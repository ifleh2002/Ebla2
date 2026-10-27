import React, { useState, useRef } from 'react';
import {
  Play,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Calendar,
  ArrowRight,
  CheckCircle2,
  X,
  Bot,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';

interface VitrineLandingPageProps {
  onExploreLots: () => void;
  onBookVisit: () => void;
  onOpenChatbot: () => void;
  onSelectTab: (tab: 'vitrine' | 'lots' | 'chantier' | 'adherent' | 'bureau') => void;
}

interface VideoShowcaseItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  surface: string;
  typology: string;
  priceFrom: string;
  videoUrl: string;
  posterUrl: string;
  startTime: number;
  highlights: string[];
  description: string;
}

interface GalleryPhotoItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'all' | 'salons' | 'chambres' | 'cuisines' | 'plans';
  imageUrl: string;
  typology: string;
}

interface OfficialPlanPngItem {
  id: string;
  plancheBadge: string;
  title: string;
  arabicTitle: string;
  reference: string;
  issuer: string;
  date: string;
  summary: string;
  pngUrl: string;
  resolution: string;
  keyMetric: string;
  highlights: string[];
}

const SHOWCASE_VIDEOS: VideoShowcaseItem[] = [
  {
    id: 'vid-apt-a',
    code: 'Appartement Type A',
    title: 'Grand F4 Familial · 135 m²',
    subtitle: '« Where you can hear the sound of nature » · Design par ARK Architect',
    surface: '135 m²',
    typology: 'F4 Haut Standing',
    priceFrom: '1 280 000 DH',
    videoUrl: '/assets/aistudio/VIDEO-2026-08-30-17-02-58_8210e145.mp4',
    posterUrl: '/assets/aistudio/photo_apt_a_salon.jpg',
    startTime: 12,
    highlights: [
      'Double salon de réception baigné de lumière naturelle',
      'Salle à manger 6 places & cuisine équipée vue palmiers',
      'Suite parentale avec dressing bois sur mesure & SDB privative',
      '2 chambres supplémentaires (enfants & espace bureau)',
    ],
    description:
      "Un vaste appartement familial de 135 m² pensé pour le confort absolu en bord de mer, alliant boiseries nobles, marbre au sol et larges baies vitrées ouvrant sur les jardins de la résidence.",
  },
  {
    id: 'vid-apt-b',
    code: 'Appartement Type B',
    title: 'F3 / F4 Esprit Côte Atlantique · 115 m²',
    subtitle: '« Where you can catch your wave » · Design par ARK Architect',
    surface: '115 m²',
    typology: 'F3 / F4 Balnéaire',
    priceFrom: '1 090 000 DH',
    videoUrl: '/assets/aistudio/VIDEO-2026-08-30-17-02-59_2a6e36c0.mp4',
    posterUrl: '/assets/aistudio/photo_apt_b_salon.jpg',
    startTime: 12,
    highlights: [
      'Salon panoramique aux teintes côtières & terrasse plein sud',
      'Cuisine contemporaine gris anthracite & chêne naturel avec balcon',
      'Suite parentale lumineuse avec coiffeuse et rangements intégrés',
      'Chambre enfants double avec banquette de lecture face aux jardins',
    ],
    description:
      "D'une superficie généreuse de 115 m², cette typologie célèbre l'art de vivre balnéaire de Mansouria avec des volumes aérés et une luminosité traversante toute la journée.",
  },
  {
    id: 'vid-apt-c',
    code: 'Appartement Type C',
    title: 'F2 / F3 Contemporain Chic · 78 m²',
    subtitle: '« Where you are closer to mother earth » · Design par ARK Architect',
    surface: '78 m²',
    typology: 'F2 / F3 Contemporain',
    priceFrom: '760 000 DH',
    videoUrl: '/assets/aistudio/VIDEO-2026-08-30-17-02-51_abd5fb63.mp4',
    posterUrl: '/assets/aistudio/photo_apt_c_salon.jpg',
    startTime: 11,
    highlights: [
      'Séjour ouvert avec îlot bar en marbre veiné & bois',
      'Suite parentale avec dressing vitré rétroéclairé LED',
      'Salle de bain prestige avec vasque marbre & robinetterie dorée brossée',
      'Agencement fluide sans aucune perte d espace',
    ],
    description:
      "Alliance raffinée de matériaux minéraux et de lignes contemporaines, cet appartement offre un cadre intimiste et chaleureux au cœur de la Résidence Ebla Two.",
  },
  {
    id: 'vid-apt-d',
    code: 'Appartement Type D',
    title: 'Studio Balnéaire Premium · 40 m²',
    subtitle: '« Where you feel the calmness of the sand » · Design par ARK Architect',
    surface: '40 m²',
    typology: 'Studio / F2 Compact',
    priceFrom: '460 000 DH',
    videoUrl: '/assets/aistudio/VIDEO-2026-08-30-17-03-01_84430d95.mp4',
    posterUrl: '/assets/aistudio/photo_apt_d_studio.jpg',
    startTime: 13,
    highlights: [
      'Cuisine américaine équipée avec comptoir bar en bois massif',
      'Espace salon & couchage modulable avec touches artisanales marocaines',
      'Salle d eau contemporaine avec douche à l italienne noir mat',
      'Rendement locatif estival et annuel exceptionnel à Mansouria',
    ],
    description:
      "Un pied-à-terre balnéaire de 40 m² parfaitement optimisé à 300 mètres de la plage, idéal pour les jeunes couples ou un investissement locatif à forte rentabilité.",
  },
];

const GALLERY_PHOTOS: GalleryPhotoItem[] = [
  {
    id: 'ph-1',
    title: 'Grand Salon de Réception · Appartement A (135 m²)',
    subtitle: 'Double séjour lumineux, habillage mural bois et marbre grand format',
    category: 'salons',
    imageUrl: '/assets/aistudio/photo_apt_a_salon.jpg',
    typology: '135 m²',
  },
  {
    id: 'ph-2',
    title: 'Séjour Balnéaire Atlantique · Appartement B (115 m²)',
    subtitle: 'Esprit bord de mer, salle à manger conviviale et accès terrasse',
    category: 'salons',
    imageUrl: '/assets/aistudio/photo_apt_b_salon.jpg',
    typology: '115 m²',
  },
  {
    id: 'ph-3',
    title: 'Salon & Îlot Marbre · Appartement C (78 m²)',
    subtitle: 'Architecture intérieure ouverte avec bar en marbre et boiseries',
    category: 'salons',
    imageUrl: '/assets/aistudio/photo_apt_c_salon.jpg',
    typology: '78 m²',
  },
  {
    id: 'ph-4',
    title: 'Espace de Vie & Bar · Studio D (40 m²)',
    subtitle: 'Ambiance chaleureuse « Calmness of the Sand » avec cuisine ouverte',
    category: 'salons',
    imageUrl: '/assets/aistudio/photo_apt_d_studio.jpg',
    typology: '40 m²',
  },
  {
    id: 'ph-5',
    title: 'Suite Parentale & Dressing · Appartement A (135 m²)',
    subtitle: 'Tête de lit architecturale, coiffeuse suspendue et dressing sur mesure',
    category: 'chambres',
    imageUrl: '/assets/aistudio/photo_apt_a_suite.jpg',
    typology: '135 m²',
  },
  {
    id: 'ph-6',
    title: 'Suite Parentale Vue Jardin · Appartement B (115 m²)',
    subtitle: 'Tons doux sable et azur, grandes ouvertures sur les palmiers',
    category: 'chambres',
    imageUrl: '/assets/aistudio/photo_apt_b_chambre.jpg',
    typology: '115 m²',
  },
  {
    id: 'ph-7',
    title: 'Suite avec Dressing Vitré · Appartement C (78 m²)',
    subtitle: 'Dressing rétroéclairé, miroirs pleine hauteur et parquet chaleureux',
    category: 'chambres',
    imageUrl: '/assets/aistudio/photo_apt_c_suite.jpg',
    typology: '78 m²',
  },
  {
    id: 'ph-8',
    title: 'Chambre Double & Banquette · Appartement B (115 m²)',
    subtitle: 'Deux lits simples, banquette de lecture sous fenêtre et bureau',
    category: 'chambres',
    imageUrl: '/assets/aistudio/photo_apt_b_kids.jpg',
    typology: '115 m²',
  },
  {
    id: 'ph-9',
    title: 'Cuisine Équipée & Coin Repas · Appartement A (135 m²)',
    subtitle: 'Plans de travail en quartz, électroménager encastré et vue dégagée',
    category: 'cuisines',
    imageUrl: '/assets/aistudio/photo_apt_a_cuisine.jpg',
    typology: '135 m²',
  },
  {
    id: 'ph-10',
    title: 'Salle de Bain Marbre & Or Brossé · Appartement C',
    subtitle: 'Robinetterie encastrée dorée, vasque pierre naturelle et douche italienne',
    category: 'cuisines',
    imageUrl: '/assets/aistudio/photo_apt_c_sdb.jpg',
    typology: 'Prestations',
  },
  {
    id: 'ph-plan-1',
    title: 'Plans Autorisés « Ne Varietur » · Planche 1/2 (Étage Courant R+3 & Façades)',
    subtitle: 'Plan Masse Balcon, Étage Courant R+3 (44 appts/étage), Coupe A-A & 4 Façades',
    category: 'plans',
    imageUrl: '/assets/aistudio/plans_autorise_s__2_-1_cd342e2d.png',
    typology: 'Plan PNG HD',
  },
  {
    id: 'ph-plan-2',
    title: 'Plans Autorisés « Ne Varietur » · Planche 2/2 (Sous-Sol, RDC & Soupente)',
    subtitle: 'Sous-sol 230 places parking, RDC (30 appts + 9 magasins + piscine centrale) & Soupente',
    category: 'plans',
    imageUrl: '/assets/aistudio/plans_autorise_s__2_-2_b3f525bf.png',
    typology: 'Plan PNG HD',
  },
  {
    id: 'ph-plan-3',
    title: 'Plan Cadastral Officiel ANCFCC · Jawharat Al Bahr 16 (Échelle 1/500)',
    subtitle: 'Titre Foncier N° 36089/25 · Contenance 1ha 18a 41ca (11 841 m²)',
    category: 'plans',
    imageUrl: '/assets/aistudio/PLAN_CADASTRAL_EBLA_ONE-1_4efc9c99.png',
    typology: 'Cadastre PNG',
  },
];

const OFFICIAL_PNG_PLANS: OfficialPlanPngItem[] = [
  {
    id: 'png-plans-autorises-1',
    plancheBadge: 'Planche 1/2 · PNG Ultra-HD',
    title: 'Plans d’Architecture Autorisés « Ne Varietur » · Étage Courant R+3, Masse & Façades',
    arabicTitle: 'التصاميم المعمارية المرخصة (الطابق المتكرر R+3 والواجهات والمقطع A-A)',
    reference: 'Arch. El Atouani Mohamed Amine · Permis GUmsr-0124/2024',
    issuer: 'Province de Benslimane · Commune El Mansouria',
    date: 'Visé Ne Varietur · 2024',
    summary:
      'Planche architecturale officielle 1/2 en haute résolution réunissant le Plan Masse Balcon, le Plan d’Étage Courant R+3 (44 appartements par étage répartis sur les Immeubles A à F), les 4 Façades, la Coupe A-A et le Tableau Quantitatif officiel.',
    pngUrl: '/assets/aistudio/plans_autorise_s__2_-1_cd342e2d.png',
    resolution: '10 962 × 5 314 px (PNG HD)',
    keyMetric: 'Étage Courant R+3 · 21 780 m² bâtis',
    highlights: [
      'Plan Masse Balcon avec Piscine Centrale (73,00 m × 43,45 m d’esplanade)',
      'Plan Étage Courant R+3 : distribution détaillée des 44 appartements / étage',
      'Façade Principale sur voie de 16 m, Façade Arrière & Façades Latérales',
      'Coupe A-A montrant le Sous-Sol (-2,70 m), RDC (+0,80 m), Soupente (+3,15 m) et 3 étages (+15,25 m)',
    ],
  },
  {
    id: 'png-plans-autorises-2',
    plancheBadge: 'Planche 2/2 · PNG Ultra-HD',
    title: 'Plans d’Architecture Autorisés « Ne Varietur » · Sous-Sol (230 Parkings), RDC & Soupente',
    arabicTitle: 'التصاميم المعمارية المرخصة (الطابق تحت أرضي 230 موقف، الطابق الأرضي والسدة)',
    reference: 'Arch. El Atouani Mohamed Amine · T.F. 36089/25',
    issuer: 'Province de Benslimane · Commune El Mansouria',
    date: 'Visé Ne Varietur · 2024',
    summary:
      'Planche architecturale officielle 2/2 détaillant le Plan du Sous-Sol (230 places de stationnement affectées aux copropriétaires sur 7 500 m²), le Plan du Rez-de-Chaussée (30 appartements RDC, 9 magasins commerciaux et grande piscine centrale) ainsi que le Plan de Soupente (445 m²).',
    pngUrl: '/assets/aistudio/plans_autorise_s__2_-2_b3f525bf.png',
    resolution: '10 629 × 5 314 px (PNG HD)',
    keyMetric: '230 Parkings S/Sol · RDC + 9 Magasins',
    highlights: [
      'Plan Sous-Sol : 230 places numérotées + 2 rampes d’accès véhicules + locaux techniques',
      'Plan Rez-de-Chaussée : 30 appartements RDC avec jardins + 9 magasins sur voie de lotissement',
      'Plan Soupente : mezzanines commerciales et double hauteur sur la galerie et piscine centrale',
      'Tableau officiel de contenance : 162 appartements (6 immeubles A à F : 30 RDC + 132 étages) + 9 magasins',
    ],
  },
  {
    id: 'png-plan-cadastral',
    plancheBadge: 'Cadastre ANCFCC · PNG HD',
    title: 'Plan Cadastral Officiel & Bornage Foncier (Échelle 1/500 · Jawharat Al Bahr 16)',
    arabicTitle: 'التصميم العقاري الرسمي للملك « جوهرة البحر 16 » (الرسم العقاري 36089/25)',
    reference: 'Titre Foncier N° 36089/25 · ST 284 P',
    issuer: 'ANCFCC · Service du Cadastre de Benslimane',
    date: '19 Novembre 2024',
    summary:
      'Plan foncier officiel homologué par l’Agence Nationale de la Conservation Foncière, du Cadastre et de la Cartographie (ANCFCC), certifiant l’assiette foncière de 1 Hectare 18 Ares 41 Centiares (11 841 m²), les coordonnées Lambert et l’alignement sur les voies de 16 m.',
    pngUrl: '/assets/aistudio/PLAN_CADASTRAL_EBLA_ONE-1_4efc9c99.png',
    resolution: '2 481 × 3 508 px (PNG HD)',
    keyMetric: '1 ha 18 a 41 ca (11 841 m²)',
    highlights: [
      'Propriété dite « Jawharat Al Bahr 16 » · Titre Foncier N° 36089/25 libre de toute charge',
      'Contenance certifiée : 1 ha 18 a 41 ca (11 841 m²) · Échelle 1/500',
      'Bornes géodésiques officielles : B96, B21, B40, B37, B101, B100 (Système Lambert)',
      'Vérifiable par QR Code officiel ANCFCC (Code : 601793c1-c4ba-4357-a96c-8a9a65363506)',
    ],
  },
];

export const VitrineLandingPage: React.FC<VitrineLandingPageProps> = ({
  onExploreLots,
  onBookVisit,
  onOpenChatbot,
  onSelectTab,
}) => {
  const [activeVideo, setActiveVideo] = useState<VideoShowcaseItem>(SHOWCASE_VIDEOS[0]);
  const [isHeroMuted, setIsHeroMuted] = useState(true);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'salons' | 'chambres' | 'cuisines' | 'plans'>('all');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhotoItem | null>(null);

  // Interactive PNG Plan Viewer states
  const [selectedPlan, setSelectedPlan] = useState<OfficialPlanPngItem>(OFFICIAL_PNG_PLANS[0]);
  const [planZoom, setPlanZoom] = useState<number>(1);
  const [fullscreenPlan, setFullscreenPlan] = useState<OfficialPlanPngItem | null>(null);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(1.5);

  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const filteredPhotos =
    galleryFilter === 'all'
      ? GALLERY_PHOTOS
      : GALLERY_PHOTOS.filter((p) => p.category === galleryFilter);

  const toggleHeroMute = () => {
    if (!heroVideoRef.current) return;
    heroVideoRef.current.muted = !heroVideoRef.current.muted;
    setIsHeroMuted(heroVideoRef.current.muted);
  };

  const handleSelectPlan = (plan: OfficialPlanPngItem) => {
    setSelectedPlan(plan);
    setPlanZoom(1);
  };

  return (
    <div className="space-y-14 pb-12">
      {/* =====================================================================
          HERO SECTION: LUMINOUS SPLIT VITRINE + OFFICIAL LOGO + 100% CLEAR HD VIDEO
      ===================================================================== */}
      <section className="bg-white rounded-3xl border border-amber-200/80 shadow-md overflow-hidden">
        {/* Top Metadata Ribbon in Royal Navy & Imperial Gold */}
        <div className="px-6 sm:px-8 py-3 bg-ebla-navy-gradient text-white border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-100 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Commune El Mansouria · Mohammedia (À 300 m de la plage)</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300 font-semibold">Titre Foncier N° 36089/25 (1ha 18a 41ca)</span>
          </div>
          <div className="text-amber-200/90 font-mono text-[11px]">
            Permis de Construire N° GUmsr-0124/2024 · Résidence Fermée S/Sol + R+3
          </div>
        </div>

        {/* Main Split Grid: Left Brand & Editorial Presentation, Right 100% Bright Uncovered Video Cinema */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10 items-center">
          {/* Left 5 Columns: Official Logo Emblem, Editorial Pitch & Primary Actions */}
          <div className="lg:col-span-5 space-y-5">
            {/* Official Logo Showcase Card */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-white to-slate-50 border border-amber-200/90 shadow-2xs">
              <div className="w-24 sm:w-28 h-20 rounded-xl bg-white border border-amber-200 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                <img
                  src="/assets/aistudio/Logo_premium_de_r_sidence_Ebal_two_66cf26e0.png"
                  alt="Logo Officiel Résidence Ebla Two"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-bold tracking-wider text-amber-700 uppercase">
                  Identité Officielle · Amicale d’Habitation
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  Résidence Ebla Two · Mansouria
                </div>
                <div className="text-xs text-slate-600">
                  Architecture Balnéaire Haut Standing · Côte Atlantique
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-[1.15] text-balance">
              L’art de vivre balnéaire à Mansouria, entre jardins paysagers et océan Atlantique.
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Érigée sur un domaine titré de <strong className="text-slate-900">11 841 m²</strong> libre de toute hypothèque, la Résidence réunit <strong className="text-slate-900">162 appartements haut standing de RDC à R+3 répartis sur 6 Immeubles (A à F : 30 au RDC + 132 aux étages)</strong> et <strong className="text-slate-900">9 magasins commerciaux</strong> autour d’une grande piscine centrale et de <strong className="text-slate-900">230 places de parking en sous-sol (7 500 m²)</strong>.
            </p>

            {/* Primary CTAs in Imperial Gold & Royal Navy */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={onExploreLots}
                className="px-5 py-3 bg-ebla-gold-gradient hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Explorer les 162 Appartements &amp; 9 Magasins</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onBookVisit}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Réserver une Visite</span>
              </button>

              <button
                onClick={onOpenChatbot}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-slate-900 font-semibold text-xs rounded-xl border border-amber-300 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 text-amber-600" />
                <span>Parler à Yassine (IA Darija Live)</span>
              </button>
            </div>

            {/* Quick Highlight Points of Currently Playing Video */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  En lecture : {activeVideo.title}
                </span>
                <span className="font-mono font-bold text-amber-700">
                  Dès {activeVideo.priceFrom}
                </span>
              </div>
              <ul className="space-y-1">
                {activeVideo.highlights.slice(0, 3).map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right 7 Columns: 100% Pure, Bright, Uncovered HD Video Showcase + Switcher */}
          <div className="lg:col-span-7 space-y-3">
            {/* Video Frame with ZERO dark overlay on top of the video */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-xl aspect-video">
              <video
                ref={heroVideoRef}
                key={activeVideo.videoUrl}
                src={activeVideo.videoUrl}
                poster={activeVideo.posterUrl}
                autoPlay
                loop
                muted={isHeroMuted}
                controls
                playsInline
                onLoadedMetadata={(e) => {
                  if (e.currentTarget.currentTime < activeVideo.startTime) {
                    e.currentTarget.currentTime = activeVideo.startTime;
                  }
                }}
                className="w-full h-full object-cover brightness-105 contrast-102"
              />

              {/* Floating Top-Right Sound Toggle Button */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <button
                  onClick={toggleHeroMute}
                  className="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-900 shadow-md border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isHeroMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-600" />
                      <span>Activer le son</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Son actif</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instant Video Switcher Bar (4 Apartment Walkthrough Films with Thumbnails) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SHOWCASE_VIDEOS.map((item) => {
                const isSelected = activeVideo.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveVideo(item)}
                    className={`group text-left rounded-xl overflow-hidden border transition-all cursor-pointer flex flex-col ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="relative h-16 w-full overflow-hidden bg-slate-100">
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-white/90 text-slate-900'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className={isSelected ? 'text-amber-800' : 'text-slate-700'}>
                          {item.code.replace('Appartement ', '')}
                        </span>
                        <span className="font-mono text-amber-700">{item.surface}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-900 truncate mt-0.5">
                        {item.typology}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Certified Quantitative Metrics Bar */}
        <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
            <div>
              <div className="text-[11px] text-slate-500">Assiette Foncière Titrée</div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900">
                11 841 m²
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">1ha 18a 41ca · 0 charge</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Surface Bâtie Autorisée</div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900">
                21 780 m²
              </div>
              <div className="text-[11px] text-slate-500">Sous-sol + R+3</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Logements (6 Immeubles A–F)</div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-700">
                162 Apps
              </div>
              <div className="text-[11px] text-slate-500">30 RDC + 132 Étages (R+3)</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Commerces RDC</div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900">
                9 Magasins
              </div>
              <div className="text-[11px] text-slate-500">Immeubles A (3), B (3), F (3)</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Stationnement Sous-Sol</div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900">
                230 Places
              </div>
              <div className="text-[11px] text-slate-500">7 500 m² sécurisés</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Formule Amicale</div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-emerald-700">
                0% Intérêt
              </div>
              <div className="text-[11px] text-slate-500">4 tranches de 25%</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 01: LES 4 FILMS ARCHITECTURAUX EN GRILLE COMPLÈTE (LECTURE DIRECTE)
      ===================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-semibold text-amber-700 mb-1">
              01. Visites Vidéo Intégrales · 4 Typologies d’Appartements
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Visionnez chaque appartement sous tous les angles
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md">
            Films officiels réalisés par <strong className="text-slate-900">ARK Architect (Abd Alrahim Kassam)</strong>. Cliquez sur n’importe quelle vidéo pour lancer la lecture avec son ou en plein écran.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SHOWCASE_VIDEOS.map((vid) => (
            <div
              key={vid.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              {/* Pure Bright Video Player */}
              <div className="relative aspect-video bg-slate-100 border-b border-slate-100">
                <video
                  src={vid.videoUrl}
                  poster={vid.posterUrl}
                  controls
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    e.currentTarget.currentTime = vid.startTime;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-700">{vid.code}</span>
                    <span className="font-mono font-bold text-slate-900">
                      Superficie : {vid.surface} · Dès {vid.priceFrom}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{vid.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{vid.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={onExploreLots}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Voir disponibilités ({vid.surface})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={vid.videoUrl}
                    download
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger MP4</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECTION 02: GALERIE PHOTO HAUTE DÉFINITION & PLANS EN PNG
      ===================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-semibold text-amber-700 mb-1">
              02. Galerie Photographique &amp; Plans Haute Définition
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Finitions nobles, luminosité et plans officiels en PNG
            </h2>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            {[
              { id: 'all', label: 'Tout voir (13)' },
              { id: 'salons', label: 'Salons & Séjours' },
              { id: 'chambres', label: 'Suites & Chambres' },
              { id: 'cuisines', label: 'Cuisines & SDB' },
              { id: 'plans', label: 'Plans Officiels PNG (3)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setGalleryFilter(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  galleryFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 right-2 bg-white/95 text-slate-900 px-2.5 py-1 rounded-md text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-xs">
                  <Maximize2 className="w-3 h-3" />
                  <span>Agrandir PNG</span>
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Résidence Ebla Two</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-semibold text-amber-700">{photo.typology}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{photo.title}</h3>
                <p className="text-xs text-slate-600">{photo.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECTION 03: PLANS D'ARCHITECTURE AUTORISÉS & PLAN CADASTRAL EN PNG HD
      ===================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-semibold text-amber-700 mb-1">
              03. Plans d’Architecture Autorisés « Ne Varietur » &amp; Cadastre (Versions PNG Ultra-HD)
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Visualisation directe &amp; interactive des Plans Officiels en PNG
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md">
            Tous les plans officiels sont affichés directement en format <strong className="text-slate-900">image PNG haute résolution</strong> avec loupe de zoom, mode plein écran et téléchargement instantané.
          </p>
        </div>

        {/* 3 Official PNG Plan Selector Cards with Visual Previews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {OFFICIAL_PNG_PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                className={`rounded-2xl border overflow-hidden transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                    : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                }`}
              >
                <div>
                  {/* Live PNG Thumbnail Preview */}
                  <div className="relative h-44 w-full bg-white border-b border-slate-200 overflow-hidden group">
                    <img
                      src={plan.pngUrl}
                      alt={plan.title}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-900/90 text-amber-300 text-[11px] font-bold">
                      {plan.plancheBadge}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenPlan(plan);
                        setFullscreenZoom(1.5);
                      }}
                      className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Plein Écran HD</span>
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={isSelected ? 'text-amber-400 font-semibold' : 'text-amber-700 font-semibold'}>
                        {plan.reference}
                      </span>
                      <span className={`font-mono text-[11px] ${isSelected ? 'text-emerald-300' : 'text-slate-500'}`}>
                        {plan.keyMetric}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold leading-snug">{plan.title}</h3>
                    <div
                      className={`text-xs font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}
                      dir="rtl"
                    >
                      {plan.arabicTitle}
                    </div>
                    <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                      {plan.summary}
                    </p>
                  </div>
                </div>

                <div
                  className={`px-4 py-3 flex items-center justify-between text-xs border-t ${
                    isSelected ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'
                  }`}
                >
                  <span className="font-mono text-[11px] opacity-80">{plan.resolution}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenPlan(plan);
                        setFullscreenZoom(1.5);
                      }}
                      className={`font-semibold flex items-center gap-1 hover:underline cursor-pointer ${
                        isSelected ? 'text-amber-300' : 'text-amber-700'
                      }`}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom HD</span>
                    </button>
                    <a
                      href={plan.pngUrl}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className={`font-semibold flex items-center gap-1 hover:underline ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive High-Resolution PNG Plan Inspector + Quantitative Surface Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Interactive Viewer Toolbar */}
          <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold">{selectedPlan.title}</span>
              </div>
              <div className="text-xs text-slate-400">
                {selectedPlan.issuer} · {selectedPlan.reference} · Résolution native {selectedPlan.resolution}
              </div>
            </div>

            {/* Zoom & Fullscreen Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPlanZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Zoom arrière"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs font-mono font-bold text-amber-300">
                  {Math.round(planZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPlanZoom((z) => Math.min(3.5, +(z + 0.5).toFixed(2)))}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Zoom avant"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPlanZoom(1)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Réinitialiser le zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFullscreenPlan(selectedPlan);
                  setFullscreenZoom(1.75);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Plein Écran Loupe HD</span>
              </button>

              <a
                href={selectedPlan.pngUrl}
                download
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger le Plan PNG</span>
              </a>
            </div>
          </div>

          {/* High-Resolution Direct PNG Canvas */}
          <div className="bg-slate-100 overflow-auto max-h-[680px] p-4 sm:p-6 flex items-center justify-center border-b border-slate-200">
            <div
              style={{
                width: `${planZoom * 100}%`,
                minWidth: planZoom > 1 ? `${planZoom * 100}%` : '100%',
              }}
              className="transition-all duration-200 bg-white rounded-xl shadow-sm border border-slate-200 p-2"
            >
              <img
                key={selectedPlan.pngUrl}
                src={selectedPlan.pngUrl}
                alt={selectedPlan.title}
                onClick={() => setPlanZoom((z) => (z < 2 ? 2 : 1))}
                className="w-full h-auto object-contain cursor-zoom-in"
              />
            </div>
          </div>

          {/* Highlights of Currently Displayed PNG Plan + Quantitative Surface Table */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white items-start">
            {/* Left 5 Cols: Key Architectural Points Visible on This PNG Plan */}
            <div className="lg:col-span-5 space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Repères sur {selectedPlan.plancheBadge}
              </div>
              <h4 className="text-sm font-bold text-slate-900">{selectedPlan.title}</h4>
              <ul className="space-y-2 pt-1">
                {selectedPlan.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right 7 Cols: Official Architectural Tableau de Contenance (6 Immeubles A-F & Global Surfaces) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tableau de Contenance Officiel · 162 Appartements, 6 Immeubles (A à F) &amp; 9 Magasins
                  </h3>
                  <p className="text-xs text-slate-500">
                    Synthèse certifiée · Terrain 11 841 m² · Planchers hors S/Sol 14 280 m² · Total construit 21 780 m²
                  </p>
                </div>
                <a
                  href="/assets/aistudio/Tableau_contenance_162_appartements.xlsx_-_Synth_se_8e0f18a0.csv"
                  download="Tableau_contenance_162_appartements_Synthese.csv"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger Synthèse Excel (.csv)</span>
                </a>
              </div>

              {/* Sub-table 1: Breakdown by Immeuble (A to F) */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="py-2 px-2.5 font-semibold">Immeuble</th>
                      <th className="py-2 px-2.5 font-semibold text-center">Appart. RDC</th>
                      <th className="py-2 px-2.5 font-semibold text-center">Appart./étage</th>
                      <th className="py-2 px-2.5 font-semibold text-center">Nb étages</th>
                      <th className="py-2 px-2.5 font-semibold text-center">Appart. étages</th>
                      <th className="py-2 px-2.5 font-semibold text-center text-amber-300">Total Appart.</th>
                      <th className="py-2 px-2.5 font-semibold text-center">Magasins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {[
                      { imm: 'A', rdc: 0, parEt: 4, nbEt: 3, etages: 12, total: 12, mag: 3 },
                      { imm: 'B', rdc: 4, parEt: 7, nbEt: 3, etages: 21, total: 25, mag: 3 },
                      { imm: 'C', rdc: 10, parEt: 9, nbEt: 3, etages: 27, total: 37, mag: 0 },
                      { imm: 'D', rdc: 4, parEt: 4, nbEt: 3, etages: 12, total: 16, mag: 0 },
                      { imm: 'E', rdc: 9, parEt: 11, nbEt: 3, etages: 33, total: 42, mag: 0 },
                      { imm: 'F', rdc: 3, parEt: 9, nbEt: 3, etages: 27, total: 30, mag: 3 },
                    ].map((r) => (
                      <tr key={r.imm} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-sans font-bold text-slate-900">Immeuble {r.imm}</td>
                        <td className="py-1.5 px-2.5 text-center">{r.rdc}</td>
                        <td className="py-1.5 px-2.5 text-center">{r.parEt}</td>
                        <td className="py-1.5 px-2.5 text-center">{r.nbEt}</td>
                        <td className="py-1.5 px-2.5 text-center">{r.etages}</td>
                        <td className="py-1.5 px-2.5 text-center font-bold text-amber-700">{r.total}</td>
                        <td className="py-1.5 px-2.5 text-center font-semibold">{r.mag}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-mono font-bold text-slate-900 border-t border-slate-300">
                      <td className="py-2 px-2.5 font-sans">TOTAL (6 Immeubles)</td>
                      <td className="py-2 px-2.5 text-center">30</td>
                      <td className="py-2 px-2.5 text-center">44 / étage</td>
                      <td className="py-2 px-2.5 text-center">3 (R+1 à R+3)</td>
                      <td className="py-2 px-2.5 text-center">132</td>
                      <td className="py-2 px-2.5 text-center text-amber-700">162</td>
                      <td className="py-2 px-2.5 text-center">9</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Sub-table 2: Global Built Surfaces */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-1.5 font-semibold">Niveau Architectural</th>
                      <th className="py-1.5 font-semibold">Surface Construite</th>
                      <th className="py-1.5 font-semibold">Composition &amp; Affectation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    <tr>
                      <td className="py-1.5 font-sans font-semibold text-slate-900">Surface du terrain</td>
                      <td className="py-1.5 font-bold text-slate-900">11 841 m²</td>
                      <td className="py-1.5 font-sans text-slate-600">
                        Assiette foncière Titre Foncier N° 36089/25 (Surface construite au sol : 4 080 m²)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-sans font-semibold text-slate-900">Sous-sol construit (-2,70 m)</td>
                      <td className="py-1.5 font-bold text-slate-900">7 500 m²</td>
                      <td className="py-1.5 font-sans text-slate-600">
                        230 places de stationnement + 2 rampes d’accès + cages d’ascenseurs
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-sans font-semibold text-slate-900">RDC construit (+0,80 m)</td>
                      <td className="py-1.5 font-bold text-slate-900">4 080 m²</td>
                      <td className="py-1.5 font-sans text-slate-600">
                        30 Appartements RDC (B:4, C:10, D:4, E:9, F:3) + 9 Magasins (A:3, B:3, F:3)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-sans font-semibold text-slate-900">R+1 construit (+5,50 m)</td>
                      <td className="py-1.5 font-bold text-slate-900">3 400 m²</td>
                      <td className="py-1.5 font-sans text-slate-600">
                        44 Appartements (A:4, B:7, C:9, D:4, E:11, F:9)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-sans font-semibold text-slate-900">R+2 construit (+8,65 m)</td>
                      <td className="py-1.5 font-bold text-slate-900">3 400 m²</td>
                      <td className="py-1.5 font-sans text-slate-600">
                        44 Appartements (A:4, B:7, C:9, D:4, E:11, F:9)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-sans font-semibold text-slate-900">R+3 construit (+11,80 m)</td>
                      <td className="py-1.5 font-bold text-slate-900">3 400 m²</td>
                      <td className="py-1.5 font-sans text-slate-600">
                        44 Appartements (A:4, B:7, C:9, D:4, E:11, F:9) · Planchers hors S/Sol : 14 280 m²
                      </td>
                    </tr>
                    <tr className="bg-amber-50/70">
                      <td className="py-2 font-sans font-bold text-amber-950">Surface construite totale</td>
                      <td className="py-2 font-bold text-amber-800">21 780 m²</td>
                      <td className="py-2 font-sans text-[11px] text-amber-900">
                        ATTENTION : les surfaces globales ci-dessus ne constituent PAS des surfaces privatives par appartement. Les valeurs individuelles sont à rapprocher des lots sur le plan.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 04: BANNIÈRE D'ACTION COMMERCIALE & ACCÈS RAPIDE AUX ESPACES
      ===================================================================== */}
      <section className="bg-ebla-navy-gradient text-white rounded-3xl p-6 sm:p-10 border border-amber-500/40 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 max-w-2xl">
          <div className="w-24 h-20 rounded-2xl bg-white border-2 border-amber-400 p-2 flex items-center justify-center shrink-0 shadow-md">
            <img
              src="/assets/aistudio/Logo_premium_de_r_sidence_Ebal_two_66cf26e0.png"
              alt="Logo Résidence Ebla Two"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Adhésion Directe Sans Intermédiaire · Bureau Exécutif Ebla Two
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Prêt à choisir votre appartement ou local commercial à Mansouria ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Consultez en temps réel la disponibilité des 162 appartements (6 immeubles A à F en R+3) et des 9 magasins sur le plan de masse interactif, téléchargez l’état des lots en Excel ou échangez directement en Darija avec notre conseiller vocal.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onExploreLots}
            className="px-5 py-3 bg-ebla-gold-gradient hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Accéder au Plan des 162 Appartements</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTab('adherent')}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-amber-200 font-semibold text-xs sm:text-sm rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
          >
            Espace Adhérent
          </button>

          <button
            onClick={() => onSelectTab('bureau')}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-amber-200 font-semibold text-xs sm:text-sm rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
          >
            Espace Bureau Exécutif
          </button>
        </div>
      </section>

      {/* Lightbox Modal for Gallery Photo Inspection */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-800 text-white">
              <div>
                <div className="text-sm font-bold">{lightboxPhoto.title}</div>
                <div className="text-xs text-slate-400">{lightboxPhoto.subtitle}</div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxPhoto.imageUrl}
                  download
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger PNG/JPG</span>
                </a>
                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-white flex items-center justify-center overflow-auto max-h-[80vh] p-2">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.title}
                className="max-h-[76vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Interactive High-Resolution PNG Plan Modal */}
      {fullscreenPlan && (
        <div
          onClick={() => setFullscreenPlan(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full h-full flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Top Bar */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div>
                <div className="text-sm font-bold text-white">{fullscreenPlan.title}</div>
                <div className="text-xs text-slate-400">
                  {fullscreenPlan.reference} · {fullscreenPlan.resolution}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setFullscreenZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 text-xs font-mono font-bold text-amber-300">
                    {Math.round(fullscreenZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setFullscreenZoom((z) => Math.min(4, +(z + 0.5).toFixed(2)))}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullscreenZoom(1)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <a
                  href={fullscreenPlan.pngUrl}
                  download
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger PNG</span>
                </a>

                <button
                  type="button"
                  onClick={() => setFullscreenPlan(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable High-Resolution PNG Viewport */}
            <div className="flex-1 bg-slate-100 overflow-auto p-4 flex items-start justify-center">
              <div
                style={{
                  width: `${fullscreenZoom * 100}%`,
                  minWidth: fullscreenZoom > 1 ? `${fullscreenZoom * 100}%` : '100%',
                }}
                className="bg-white rounded-xl shadow-md p-2 transition-all duration-150"
              >
                <img
                  src={fullscreenPlan.pngUrl}
                  alt={fullscreenPlan.title}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
