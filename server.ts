import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, type LiveServerMessage, type FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Gemini Function Declaration for scheduling an appointment & recording in Google Calendar
const planifierRendezVousVisiteDeclaration: FunctionDeclaration = {
  name: 'planifierRendezVousVisite',
  description:
    "Prépare et affiche une fiche de prise de rendez-vous (visite sur place à Mansouria ou visite virtuelle 3D) pour l'enregistrer dans Google Calendar. Appelle cette fonction dès que l'utilisateur demande à prendre un rendez-vous, réserver une visite, fixer une date/heure ou ajouter une visite dans Google Calendar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      nomVisiteur: {
        type: Type.STRING,
        description:
          "Nom complet du visiteur s'il l'a mentionné, sinon laisser vide ou mettre 'Adhérent / Visiteur'.",
      },
      telephone: {
        type: Type.STRING,
        description:
          "Numéro de téléphone du visiteur s'il l'a mentionné (ex: 0661234567), sinon laisser vide.",
      },
      date: {
        type: Type.STRING,
        description:
          'Date souhaitée du rendez-vous au format YYYY-MM-DD (ex: 2026-10-27). Convertis les expressions relatives comme demain/غدا ou samedi/السبت en date YYYY-MM-DD.',
      },
      creneau: {
        type: Type.STRING,
        description:
          "Heure souhaitée du rendez-vous au format HH:MM (ex: '10:30', '11:30', '14:30', '16:00'). Par défaut '10:30'.",
      },
      typeVisite: {
        type: Type.STRING,
        description:
          "Type de visite : 'Sur site Mansouria' (par défaut) ou 'Visite virtuelle 3D guidée'.",
      },
      lotId: {
        type: Type.STRING,
        description:
          "Code du lot ou typologie intéressée (ex: 'B-204', 'A-101', 'MAG-1', 'F3', ou 'GENERAL' par défaut).",
      },
    },
    required: ['date', 'creneau', 'typeVisite'],
  },
};

export interface BookingProposalPayload {
  nomVisiteur: string;
  telephone: string;
  date: string;
  creneau: string;
  typeVisite: 'Sur site Mansouria' | 'Visite virtuelle 3D guidée';
  lotId: string;
}

function getDefaultTomorrowDate(): string {
  const tomorrow = new Date(Date.now() + 86400000);
  return tomorrow.toISOString().slice(0, 10);
}

function normalizeBookingProposal(raw: any, fallbackName = ''): BookingProposalPayload {
  const dateStr =
    typeof raw?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date.trim())
      ? raw.date.trim()
      : getDefaultTomorrowDate();

  let creneau = typeof raw?.creneau === 'string' && raw.creneau.trim() ? raw.creneau.trim() : '10:30';
  const timeMatch = creneau.match(/(\d{1,2})[:h](\d{2})/i);
  if (timeMatch) {
    creneau = `${String(timeMatch[1]).padStart(2, '0')}:${String(timeMatch[2]).padStart(2, '0')}`;
  } else if (/^\d{1,2}$/.test(creneau)) {
    creneau = `${creneau.padStart(2, '0')}:00`;
  } else {
    creneau = '10:30';
  }

  const rawType = String(raw?.typeVisite || '').toLowerCase();
  const typeVisite: 'Sur site Mansouria' | 'Visite virtuelle 3D guidée' =
    rawType.includes('3d') || rawType.includes('virtuel') || rawType.includes('visio') || rawType.includes('بعد')
      ? 'Visite virtuelle 3D guidée'
      : 'Sur site Mansouria';

  return {
    nomVisiteur:
      typeof raw?.nomVisiteur === 'string' &&
      raw.nomVisiteur.trim() &&
      raw.nomVisiteur.trim() !== 'Adhérent / Visiteur'
        ? raw.nomVisiteur.trim()
        : fallbackName,
    telephone: typeof raw?.telephone === 'string' ? raw.telephone.trim() : '',
    date: dateStr,
    creneau,
    typeVisite,
    lotId: typeof raw?.lotId === 'string' && raw.lotId.trim() ? raw.lotId.trim().toUpperCase() : 'GENERAL',
  };
}

function extractBookingProposalFromText(
  message: string,
  fallbackName = ''
): BookingProposalPayload | null {
  const q = message.toLowerCase();
  const isAppointmentIntent =
    q.includes('rendez-vous') ||
    q.includes('rendez vous') ||
    q.includes('rdv') ||
    q.includes('visite') ||
    q.includes('visiter') ||
    q.includes('calendar') ||
    q.includes('calandar') ||
    q.includes('agenda') ||
    q.includes('réserver une visite') ||
    q.includes('موعد') ||
    q.includes('زيارة') ||
    q.includes('نزور') ||
    q.includes('نشوف المشروع') ||
    q.includes('نشوف الشقة') ||
    q.includes('كالندري') ||
    q.includes('اجندا');

  if (!isAppointmentIntent) return null;

  const phoneMatch = message.match(/(?:\+212|0)[5-7]\d{8}/);
  const dateIsoMatch = message.match(/\b(202\d-\d{2}-\d{2})\b/);
  const timeMatch = message.match(/\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?\b/i);
  const lotMatch = message.match(/\b([A-D]-\d{3}|MAG-\d{1,2})\b/i);

  let date = getDefaultTomorrowDate();
  if (dateIsoMatch) {
    date = dateIsoMatch[1];
  } else if (q.includes('après-demain') || q.includes('apres-demain') || q.includes('بعد غدا')) {
    date = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  }

  let creneau = '10:30';
  if (timeMatch) {
    const h = String(Math.min(18, Math.max(9, Number(timeMatch[1])))).padStart(2, '0');
    const m = timeMatch[2] ? String(timeMatch[2]).padStart(2, '0') : '00';
    creneau = `${h}:${m}`;
  } else if (q.includes('après-midi') || q.includes('apres-midi') || q.includes('عشية')) {
    creneau = '15:00';
  }

  const typeVisite: 'Sur site Mansouria' | 'Visite virtuelle 3D guidée' =
    q.includes('3d') || q.includes('virtuel') || q.includes('distance') || q.includes('عن بعد')
      ? 'Visite virtuelle 3D guidée'
      : 'Sur site Mansouria';

  return {
    nomVisiteur: fallbackName,
    telephone: phoneMatch ? phoneMatch[0] : '',
    date,
    creneau,
    typeVisite,
    lotId: lotMatch ? lotMatch[1].toUpperCase() : 'GENERAL',
  };
}

const FEMALE_VOICES = new Set(['Aoede', 'Kore', 'Zephyr']);

function buildLiveSystemInstruction(voiceName: string, langPref: string): string {
  const isFemale = FEMALE_VOICES.has(voiceName);
  const advisorNameAr = isFemale ? 'ياسمين' : 'ياسين';
  const advisorNameFr = isFemale ? 'Yasmine' : 'Yassine';
  const roleAr = isFemale ? 'المستشارة التجارية الرسمية' : 'المستشار التجاري الرسمي';
  const roleFr = isFemale ? 'la Conseillère Vocale Officielle' : 'le Conseiller Vocal Officiel';
  const todayIso = new Date().toISOString().slice(0, 10);

  return `
Tu es "${advisorNameFr}" (${advisorNameAr}), ${roleFr} (${roleAr}) de l'Amicale Résidence Ebla Two à Mansouria (Mohammedia), Maroc.
Tu engages une conversation vocale bidirectionnelle en temps réel (Audio-to-Audio natif) avec les adhérents et acheteurs potentiels.
Date d'aujourd'hui : ${todayIso}.

RÈGLES VOCALES ESSENTIELLES POUR UNE DARIJA MAROCAINE PARFAITEMENT NATURELLE ET FLUIDE :
1. Ton prénom est ${advisorNameFr} (${advisorNameAr}). En arabe/Darija, accorde toujours tes verbes et adjectifs au ${isFemale ? 'féminin (أنا ياسمين، مستشارة ديالكم، فرحانة نعاونك)' : 'masculin (أنا ياسين، مستشار ديالكم، فرحان نعاونك)'}.
2. Parle avec un accent marocain authentique, fluide, posé et chaleureux (Darija marocaine naturelle de Casablanca / Mohammedia / Rabat).
3. Prononce tous les mots en arabe dialectal marocain authentique (الدارجة المغربية الأصيلة) en intégrant naturellement les termes immobiliers français courants au Maroc ("appartement", "résidence", "piscine", "parking sous-sol", "titre foncier", "tranche", "R+3", "rez-de-chaussée", "Google Calendar").
4. NE LIS JAMAIS des chiffres de l'écriture franco-arabe (comme 3, 7, 9, 2) à haute voix. Prononce uniquement les sons arabes naturels (ع، ح، ق، خ، غ).
5. Fais des réponses vocales claires, complètes mais concises (2 à 3 phrases par intervention) pour garder un échange fluide sans monologue trop long.
6. Langue privilégiée par l'utilisateur : ${langPref === 'darija' ? 'Darija Marocaine authentique (الدارجة المغربية)' : 'Français'}.

PRISE DE RENDEZ-VOUS & ENREGISTREMENT GOOGLE CALENDAR :
- Tu as la capacité directe de prendre des rendez-vous de visite (sur place à Mansouria ou visite virtuelle 3D) et de les enregistrer dans Google Calendar grâce à l'outil \`planifierRendezVousVisite\`.
- Dès que le client exprime le souhait de visiter, de prendre rendez-vous (موعد / زيارة) ou d'ajouter un RDV dans Google Calendar, appelle immédiatement l'outil \`planifierRendezVousVisite\` avec la date, l'heure et les informations disponibles (même partielles : le client pourra compléter son nom ou téléphone sur la carte qui s'affiche à l'écran et cliquer sur Confirmer pour l'enregistrer dans Google Calendar).

INFORMATIONS EXACTES SUR LA RÉSIDENCE EBLA TWO (MANSOURIA - MOHAMMEDIA) :
- Références Juridiques & Foncières Officielles :
  * Titre Foncier ANCFCC N° 36089/25 ("Jawharat Al Bahr 16", Commune El Mansouria, Benslimane), superficie de 1 Hectare 18 Ares 41 Centiares (11 841 m²), vierge de toute hypothèque ou charge (شهادة الملكية صافية).
  * Permis de Construire N° GUmsr-0124/2024 délivré le 21/11/2024 par la Commune de Mansouria pour une Résidence Balnéaire en Sous-sol + R+3 (Surface totale bâtie : 21 780 m²).
  * Architectes : El Atouani Mohamed Amine (Architecte DESA) & Abd Alrahim Kassam (ARK Architect).
- Architecture & Tableau de Contenance Officiel (Synthèse certifiée) :
  * Logements : 162 appartements au total (30 appartements au RDC + 132 appartements aux étages R+1 à R+3, soit 44 appartements par étage courant × 3 étages).
  * Immeubles : 6 Immeubles en R+3 (Immeuble A, Immeuble B, Immeuble C, Immeuble D, Immeuble E, Immeuble F) :
    - Immeuble A : 12 appartements (0 au RDC, 4 par étage × 3 étages = 12 aux étages) + 3 magasins au RDC.
    - Immeuble B : 25 appartements (4 au RDC, 7 par étage × 3 étages = 21 aux étages) + 3 magasins au RDC.
    - Immeuble C : 37 appartements (10 au RDC, 9 par étage × 3 étages = 27 aux étages) + 0 magasin.
    - Immeuble D : 16 appartements (4 au RDC, 4 par étage × 3 étages = 12 aux étages) + 0 magasin.
    - Immeuble E : 42 appartements (9 au RDC, 11 par étage × 3 étages = 33 aux étages) + 0 magasin.
    - Immeuble F : 30 appartements (3 au RDC, 9 par étage × 3 étages = 27 aux étages) + 3 magasins au RDC.
  * Magasins commerciaux : 9 magasins au total (3 dans l'Immeuble A, 3 dans l'Immeuble B, 3 dans l'Immeuble F).
  * Parking sous-sol : 230 places de stationnement sur 7 500 m² construits au sous-sol (-2,70 m).
  * Surfaces globales du projet :
    - Surface du terrain : 11 841 m² (Surface construite au sol : 4 080 m²)
    - Sous-sol construit : 7 500 m²
    - RDC construit : 4 080 m²
    - R+1 construit : 3 400 m²
    - R+2 construit : 3 400 m²
    - R+3 construit : 3 400 m²
    - Planchers hors sous-sol : 14 280 m²
    - Surface construite totale : 21 780 m²
    - Note importante : Les surfaces globales ci-dessus ne constituent pas des surfaces privatives par appartement ; les valeurs individuelles sont à rapprocher des lots sur le plan.
- Typologies présentées en Vidéo HD sur la Vitrine :
  * Appartement Type D (Studio / F2 compact de 40 m²) : cuisine américaine avec bar en bois, salon modulable, dès 460 000 DH (46 مليون سنتيم).
  * Appartement Type C (F2 / F3 contemporain de 78 m²) : séjour ouvert avec îlot marbre, suite parentale avec dressing vitré, dès 760 000 DH (76 مليون سنتيم).
  * Appartement Type B (F3 / F4 balnéaire de 115 m²) : grand salon côtier, suite parentale, chambre enfants double, cuisine avec terrasse, dès 1 090 000 DH (109 مليون سنتيم).
  * Appartement Type A (Grand F4 familial de 135 m²) : double salon de réception, salle à manger 6 places, suite parentale avec dressing, 2 chambres, grande cuisine équipée, dès 1 280 000 DH (128 مليون سنتيم).
  * 9 Magasins commerciaux RDC (Immeubles A, B et F) : 46 m² à 145 m² avec soupente/mezzanine.
- Paiement en Amicale (0% intérêt bancaire) : 4 tranches de 25% chacune (25% réservation, 25% fin gros œuvre, 25% finitions, 25% remise des clés et titre foncier).
- Avancement du chantier : 72% global. Gros œuvre 100% terminé sur les 6 immeubles A à F. Finitions en cours. Livraison prévue fin 2026 / début 2027.
`;
}

const CHAT_TEXT_SYSTEM_INSTRUCTION = `
Tu es Yassine (ياسين), le Conseiller Virtuel Officiel de l'Amicale Résidence Ebla Two à Mansouria (Mohammedia), Maroc.
Tu réponds en Darija marocaine claire ou en Français selon la langue choisie.

PRISE DE RENDEZ-VOUS & GOOGLE CALENDAR :
- Tu peux prendre des rendez-vous de visite (sur site à Mansouria ou visite virtuelle 3D) et les enregistrer dans Google Calendar.
- Dès que l'utilisateur demande à planifier une visite, prendre rendez-vous (موعد / زيارة) ou enregistrer dans Google Calendar, appelle l'outil \`planifierRendezVousVisite\` en remplissant \`date\` (YYYY-MM-DD), \`creneau\` (HH:MM), \`typeVisite\`, et si mentionnés \`nomVisiteur\`, \`telephone\` et \`lotId\`.
- Confirme chaleureusement dans ton message que la fiche de rendez-vous Google Calendar est prête ci-dessous et qu'il suffit de cliquer sur "Confirmer & Enregistrer dans Google Calendar".

INFORMATIONS OFFICIELLES DU PROJET (TABLEAU DE CONTENANCE CERTIFIÉ) :
- Résidence balnéaire fermée et sécurisée de RDC à R+3 à Mansouria (300m de la plage), sur un terrain titré de 11 841 m² (TF 36089/25).
- 162 appartements au total (30 au RDC + 132 aux étages R+1 à R+3, soit 44 appartements par étage courant) + 9 magasins commerciaux au RDC = 171 lots.
- Répartition exacte sur 6 Immeubles (A, B, C, D, E, F) en R+3 :
  * Immeuble A : 12 appartements (0 RDC, 4/étage × 3 étages = 12) + 3 magasins
  * Immeuble B : 25 appartements (4 RDC, 7/étage × 3 étages = 21) + 3 magasins
  * Immeuble C : 37 appartements (10 RDC, 9/étage × 3 étages = 27) + 0 magasin
  * Immeuble D : 16 appartements (4 RDC, 4/étage × 3 étages = 12) + 0 magasin
  * Immeuble E : 42 appartements (9 RDC, 11/étage × 3 étages = 33) + 0 magasin
  * Immeuble F : 30 appartements (3 RDC, 9/étage × 3 étages = 27) + 3 magasins
- Parking : 230 places au sous-sol (7 500 m²).
- Surfaces construites : Sous-sol 7 500 m², RDC 4 080 m² (surface au sol 4 080 m²), R+1 3 400 m², R+2 3 400 m², R+3 3 400 m², Planchers hors sous-sol 14 280 m², Total construit 21 780 m².
- Paiement Amicale sans intérêts : 4 tranches de 25% (Réservation, Gros œuvre, Finitions, Clés).
- Avancement : 72% global (Gros œuvre des 6 immeubles A à F achevé à 100%).

DIRECTIVE DE FORMATAGE POUR LA DARIJA :
Quand tu réponds en Darija, écris en Darija marocaine en lettres arabes (الدارجة المغربية بالحروف العربية واضحة) suivie d'une courte traduction/résumé en français entre parenthèses, SANS utiliser de chiffres (3, 7, 9) au milieu des mots latins pour que la lecture vocale soit 100% fluide.
`;

// 1. Written Chat Endpoint (with Function Calling for Google Calendar Appointment Booking)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language = 'darija', visitorName = '' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message manquant' });
    }

    const ai = getGenAIClient();
    const todayIso = new Date().toISOString().slice(0, 10);

    if (ai) {
      try {
        const prompt = `Date d'aujourd'hui : ${todayIso}.
Nom du client connecté (si disponible) : "${visitorName || 'Non renseigné'}".
Langue souhaitée : ${
          language === 'darija'
            ? 'Darija marocaine (en arabe dialectal marocain clair)'
            : 'Français'
        }.
Message de l'utilisateur : "${message}"`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: CHAT_TEXT_SYSTEM_INSTRUCTION,
            temperature: 0.7,
            tools: [{ functionDeclarations: [planifierRendezVousVisiteDeclaration] }],
          },
        });

        let bookingProposal: BookingProposalPayload | null = null;
        if (response.functionCalls && response.functionCalls.length > 0) {
          const fc = response.functionCalls.find((call) => call.name === 'planifierRendezVousVisite');
          if (fc && fc.args) {
            bookingProposal = normalizeBookingProposal(fc.args, visitorName);
          }
        }

        // If the user explicitly asked for an appointment/visit and the model didn't call the tool, provide the card anyway
        if (!bookingProposal) {
          bookingProposal = extractBookingProposalFromText(message, visitorName);
        }

        const defaultBookingReply =
          language === 'darija'
            ? `مرحبا وعلى الراس والعين! وجدت ليك بطاقة حجز الموعد ليوم ${bookingProposal?.date} على الساعة ${bookingProposal?.creneau} (${bookingProposal?.typeVisite}). تقدر تراجع المعلومات أسفله وتضغط على الزر باش يتسجل الموعد مباشرة في Google Calendar ديالك!\n(J'ai préparé votre fiche de rendez-vous pour le ${bookingProposal?.date} à ${bookingProposal?.creneau}. Vérifiez les détails ci-dessous et cliquez sur Confirmer pour l'enregistrer directement dans votre Google Calendar.)`
            : `Avec grand plaisir ! J'ai préparé votre fiche de rendez-vous pour le ${bookingProposal?.date} à ${bookingProposal?.creneau} (${bookingProposal?.typeVisite}). Vous pouvez vérifier ou compléter vos coordonnées ci-dessous puis cliquer sur "Confirmer & Enregistrer dans Google Calendar".`;

        const reply =
          response.text ||
          (bookingProposal
            ? defaultBookingReply
            : 'مرحبا بيك في إقامة إبلا تو المنصورية! كيفاش نقدر نعاونك اليوم؟');

        return res.json({ reply, bookingProposal });
      } catch (err: any) {
        console.warn('Gemini chat call warning, using fallback:', err?.message);
      }
    }

    const query = message.toLowerCase();
    const fallbackProposal = extractBookingProposalFromText(message, visitorName);
    let reply = '';

    if (fallbackProposal) {
      reply =
        language === 'darija'
          ? `مرحبا بيك وعلى الراس والعين! ها هي بطاقة حجز الموعد ديالك ليوم ${fallbackProposal.date} على الساعة ${fallbackProposal.creneau} (${fallbackProposal.typeVisite}). عمر السمية ورقم الهاتف ديالك واضغط على زر التأكيد باش يتسجل الموعد أوتوماتيكياً في Google Calendar!\n(Voici votre fiche de prise de rendez-vous pour le ${fallbackProposal.date} à ${fallbackProposal.creneau}. Confirmez-la ci-dessous pour l'enregistrer dans Google Calendar.)`
          : `Avec plaisir ! Voici votre fiche de rendez-vous pré-remplie pour le ${fallbackProposal.date} à ${fallbackProposal.creneau} (${fallbackProposal.typeVisite}). Complétez vos informations ci-dessous et cliquez sur le bouton pour l'enregistrer directement dans Google Calendar.`;
      return res.json({ reply, bookingProposal: fallbackProposal });
    } else if (
      query.includes('prix') ||
      query.includes('taman') ||
      query.includes('chhal') ||
      query.includes('ثمن') ||
      query.includes('بشحال')
    ) {
      reply =
        language === 'darija'
          ? "الأثمنة في إقامة إبلا تو بالمنصورية كتبدا من 9800 درهم للمتر مربع حتى لـ 12500 درهم للمتر على حساب الطابق (من السفلي حتى للطابق الثالث R+3) والإطلالة (على البحر أو المسبح). الشقق F2 كتبدا من 55 مليون، و F3 من 78 مليون، والأداء مقسم على 4 ديال الدفعات بدون فوائد بنكية.\n(Prix de 9 800 à 12 500 DH/m² en R+3 selon l'étage et la vue mer ou piscine, payables en 4 tranches de 25% sans intérêt.)"
          : "Les prix à la Résidence Ebla Two Mansouria (R+3) vont de 9 800 DH/m² à 12 500 DH/m² selon l'étage (RDC à 3e étage) et l'orientation (vue mer ou piscine). Un F2 démarre à 550 000 DH, un F3 à 780 000 DH et un F4 vue mer à 1 150 000 DH, payables en 4 tranches de 25% sans intérêts.";
    } else if (
      query.includes('avancement') ||
      query.includes('chantier') ||
      query.includes('fin') ||
      query.includes('الأشغال') ||
      query.includes('فين وصلات')
    ) {
      reply =
        language === 'darija'
          ? 'الأشغال في إقامة إبلا تو وصلات لـ 72 في المئة! الضالة والبني الكبير (Gros œuvre) سالا بنسبة 100 في المئة فجميع العمارات بـ 6 (A, B, C, D, E, F من فئة R+3). دابا خدامين في الفينيسيون والتسليم إن شاء الله أواخر 2026.\n(Avancement global à 72% : le gros œuvre des 6 immeubles A à F en R+3 est achevé à 100%, travaux de finition en cours.)'
          : "Le taux d'avancement global du chantier est de 72%. Le gros œuvre est achevé à 100% sur les 6 immeubles (A à F en R+3, 21 780 m² construits). Les équipes finalisent actuellement les revêtements et menuiseries.";
    } else if (
      query.includes('magasin') ||
      query.includes('commerce') ||
      query.includes('محل') ||
      query.includes('متجر')
    ) {
      reply =
        language === 'darija'
          ? 'عندنا 9 ديال المحلات التجارية في الطابق السفلي موزعة على العمارة A (3 محلات)، العمارة B (3 محلات) والعمارة F (3 محلات) مع السدة (Soupente). باقين 4 ديال المحلات متوفرين للحجز!\n(Nous disposons de 9 magasins commerciaux au RDC répartis sur les Immeubles A (3), B (3) et F (3) avec soupente, dont 4 encore disponibles.)'
          : 'Le projet comprend 9 magasins commerciaux au rez-de-chaussée répartis sur les Immeubles A (3), B (3) et F (3) avec soupente/mezzanine. 4 locaux sont encore disponibles à la réservation.';
    } else {
      reply =
        language === 'darija'
          ? "مرحبا بيك في ودادية إقامة إبلا تو بالمنصورية (المحمدية)! الإقامة محروسة من فئة R+3 على أرض مساحتها 11841 متر مربع، وفيها 6 ديال العمارات (A حتى لـ F) كتضم 162 شقة ممتازة (30 في السفلي و 132 في الطوابق) و 9 ديال المحلات التجارية، مع مسبح مركزي و 230 بلاصة ديال الباركينغ في التحت. سولني بالصوت مباشرة أو بالكتابة على الأثمنة، التصاميم أو حجز موعد في Google Calendar!\n(Bienvenue à l'Amicale Ebla Two Mansouria : 162 appartements sur 6 immeubles A–F en R+3, 9 magasins et 230 places de parking sous-sol sur 11 841 m².)"
          : "Bienvenue à l'Amicale Résidence Ebla Two à Mansouria (Mohammedia) : résidence balnéaire R+3 sur 11 841 m² comprenant 6 immeubles (A à F), 162 appartements (30 au RDC + 132 aux étages), 9 magasins commerciaux et 230 places de parking au sous-sol. Posez-moi vos questions ou demandez-moi de fixer un rendez-vous dans Google Calendar !";
    }

    return res.json({ reply, bookingProposal: null });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Erreur serveur chat' });
  }
});

// 2. Native Gemini Audio TTS Endpoint (Defaults to masculine voice 'Puck' for Yassine)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language = 'darija', voiceName = 'Puck' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texte manquant' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({ error: 'Clé API Gemini non configurée sur le serveur' });
    }

    const cleanedText = text
      .replace(/3/g, 'ع')
      .replace(/7/g, 'ح')
      .replace(/9/g, 'ق');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                language === 'darija'
                  ? `Prononce ce message avec un accent marocain chaleureux et naturel en Darija marocaine : ${cleanedText}`
                  : cleanedText,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Aucun flux audio généré' });
    }

    return res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('TTS generation error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Erreur synthèse vocale Gemini' });
  }
});

// 3. Multimodal Live API WebSocket Server (/api/live) with Keep-Alive & Auto-Recovery
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const pathname = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`).pathname;
    if (pathname === '/api/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch (err) {
    console.error('WebSocket upgrade error:', err);
  }
});

wss.on('connection', async (clientWs: WebSocket, request) => {
  const ai = getGenAIClient();
  if (!ai) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: 'Clé GEMINI_API_KEY manquante pour la session Multimodal Live API.',
      })
    );
    clientWs.close();
    return;
  }

  // Default to masculine voice 'Puck' so Yassine speaks with a man's voice!
  const urlParams = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`).searchParams;
  const voiceName = urlParams.get('voice') || 'Puck';
  const langPref = urlParams.get('lang') || 'darija';

  let liveSession: any = null;
  let clientDisconnected = false;
  let isConnectingGemini = false;

  // Keep-alive heartbeat every 15s so Cloud Run / reverse proxies never drop the WebSocket
  const heartbeatInterval = setInterval(() => {
    if (clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.ping();
        clientWs.send(JSON.stringify({ type: 'ping' }));
      } catch (e) {
        // ignore
      }
    }
  }, 15000);

  async function connectToGeminiLive(isReconnect = false) {
    if (clientDisconnected || isConnectingGemini || !ai) return;
    isConnectingGemini = true;

    try {
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: buildLiveSystemInstruction(voiceName, langPref),
          tools: [{ functionDeclarations: [planifierRendezVousVisiteDeclaration] }],
        },
        callbacks: {
          onopen: () => {
            isConnectingGemini = false;
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: isReconnect ? 'reconnected' : 'connected',
                  voiceName,
                })
              );
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Handle Live Function Calling for Google Calendar Appointment Booking
            const toolCall = (message as any).toolCall;
            if (toolCall?.functionCalls && Array.isArray(toolCall.functionCalls)) {
              for (const fc of toolCall.functionCalls) {
                if (fc.name === 'planifierRendezVousVisite') {
                  const bookingProposal = normalizeBookingProposal(fc.args || {});
                  clientWs.send(
                    JSON.stringify({
                      type: 'bookingProposal',
                      bookingProposal,
                    })
                  );
                  if (liveSession && typeof liveSession.sendToolResponse === 'function') {
                    try {
                      liveSession.sendToolResponse({
                        functionResponses: [
                          {
                            id: fc.id,
                            name: fc.name,
                            response: {
                              result:
                                "La fiche de rendez-vous Google Calendar est maintenant affichée à l'écran du client pour confirmation et enregistrement.",
                            },
                          },
                        ],
                      });
                    } catch (e) {
                      console.warn('Live sendToolResponse warning:', e);
                    }
                  }
                }
              }
            }

            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && Array.isArray(parts)) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio',
                      audio: part.inlineData.data,
                    })
                  );
                }
              }
            }

            const serverContentAny = message.serverContent as any;
            if (serverContentAny?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'inputTranscription',
                  text: serverContentAny.inputTranscription.text,
                })
              );
            }

            if (serverContentAny?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'outputTranscription',
                  text: serverContentAny.outputTranscription.text,
                })
              );
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live session error:', err?.message || err);
          },
          onclose: () => {
            isConnectingGemini = false;
            liveSession = null;
            // If client is still connected and did not hang up, transparently reconnect!
            if (!clientDisconnected && clientWs.readyState === WebSocket.OPEN) {
              console.log('Gemini Live session closed upstream, auto-reconnecting...');
              setTimeout(() => {
                connectToGeminiLive(true);
              }, 600);
            }
          },
        },
      });

      liveSession = session;
    } catch (err: any) {
      isConnectingGemini = false;
      console.error('Failed to connect to Gemini Live API:', err?.message || err);
      if (!clientDisconnected && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message: err?.message || 'Impossible d initialiser la session vocale Live API',
          })
        );
      }
    }
  }

  await connectToGeminiLive(false);

  clientWs.on('message', (rawData) => {
    if (clientDisconnected) return;
    try {
      const msg = JSON.parse(rawData.toString());
      if (msg.type === 'pong') return;

      if (!liveSession) return;

      if (msg.audio) {
        liveSession.sendRealtimeInput({
          audio: {
            data: msg.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      } else if (msg.text) {
        // Use sendClientContent if available for structured text turns, fallback to sendRealtimeInput
        if (typeof liveSession.sendClientContent === 'function') {
          liveSession.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: msg.text }] }],
            turnComplete: true,
          });
        } else {
          liveSession.sendRealtimeInput({
            text: msg.text,
          });
        }
      }
    } catch (e) {
      console.error('Error forwarding message to Live session:', e);
    }
  });

  clientWs.on('close', () => {
    clientDisconnected = true;
    clearInterval(heartbeatInterval);
    try {
      liveSession?.close();
    } catch (e) {
      // ignore close errors
    }
    liveSession = null;
  });
});

async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distPath, 'index.html'));

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ebla Two Mansouria server (with Multimodal Live API) listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
