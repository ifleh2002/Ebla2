import React, { useState } from 'react';
import {
  AdherentProfile,
  AdherentDocument,
  AdherentDocCategory,
  PropertyLot,
  ChantierAvancement,
  MessageDiscussion,
} from '../types';
import {
  Building,
  FileText,
  Download,
  CheckCircle,
  Calendar,
  Send,
  ShieldCheck,
  Camera,
  CreditCard,
  MessageSquare,
  Video,
  Plus,
  Upload,
  FileEdit,
  FolderOpen,
} from 'lucide-react';
import { ChantierLiveCameras } from './ChantierLiveCameras';
import {
  DocumentCaptureModal,
  CATEGORIES_DOSSIER_ADHERENT,
} from './DocumentCaptureModal';

interface AdherentSpaceProps {
  profile: AdherentProfile;
  allProfiles?: AdherentProfile[];
  onSelectProfile?: (profileId: string) => void;
  lot: PropertyLot;
  chantier: ChantierAvancement;
  messages: MessageDiscussion[];
  onSendMessage: (text: string) => void;
  onRequestVisit: (lot: PropertyLot) => void;
  onAddDocumentToAdherent?: (
    adherentId: string,
    doc: Omit<AdherentDocument, 'id' | 'date'>
  ) => void;
}

export const AdherentSpace: React.FC<AdherentSpaceProps> = ({
  profile,
  allProfiles = [profile],
  onSelectProfile,
  lot,
  chantier,
  messages,
  onSendMessage,
  onRequestVisit,
  onAddDocumentToAdherent,
}) => {
  const [activeTab, setActiveTab] = useState<
    'ged' | 'suivi' | 'cameras' | 'echeancier' | 'messagerie'
  >('ged');
  const [selectedDocCategory, setSelectedDocCategory] = useState<
    AdherentDocCategory | 'Tous'
  >('Tous');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalCategory, setDocModalCategory] =
    useState<AdherentDocCategory>("Contrat d'achat");
  const [messageInput, setMessageInput] = useState('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const totalVerse = profile.echeancier
    .filter((e) => e.statut === 'Payé')
    .reduce((sum, e) => sum + e.montant, 0);

  const totalRestant = Math.max(0, lot.prixTotal - totalVerse);

  // Find the exact building progress (Immeuble A..F) for this adherent's lot
  const blocLetter = (lot.bloc.replace('Immeuble ', '').trim() || 'B') as
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F';
  const monImmeuble =
    chantier.immeublesAvancement?.find((im) => im.immeuble === blocLetter) ||
    chantier.immeublesAvancement?.[0];

  const handleDownload = (doc: AdherentDocument) => {
    setDownloadNotice(doc.titre);
    setTimeout(() => setDownloadNotice(null), 3000);
    if (doc.dataUrl) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.fichierRef || `${doc.titre}.jpg`;
      a.click();
      return;
    }
    const content = `====================================================================
DOSSIER ACQUÉREUR CERTIFIÉ — AMICALE RÉSIDENTIELLE EBLA TWO
====================================================================
Adhérent : ${profile.nomComplet} (Dossier ${profile.id} · CIN ${profile.cin})
Lot attribué : ${lot.id} (${lot.bloc} · ${lot.typology} · ${lot.surfaceTotale} m²)
Catégorie : ${doc.categorie}
Intitulé : ${doc.titre}
Date : ${doc.date}
--------------------------------------------------------------------

${
  doc.contenuTexte ||
  'Pièce contractuelle certifiée conforme et versée au dossier individuel de l’adhérent.'
}
====================================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.fichierRef.replace(/\.[^/.]+$/, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    onSendMessage(messageInput.trim());
    setMessageInput('');
  };

  const filteredDocuments = profile.documents.filter((d) => {
    if (selectedDocCategory === 'Tous') return true;
    if (selectedDocCategory === 'Autres') {
      return (
        d.categorie === 'Autres' ||
        d.categorie === 'Quittance' ||
        d.categorie === 'Plan' ||
        d.categorie === 'Attestation'
      );
    }
    if (selectedDocCategory === "Contrat d'achat") {
      return d.categorie === "Contrat d'achat" || d.categorie === 'Contrat';
    }
    return d.categorie === selectedDocCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Member Identification & Dossier Switcher */}
      <div className="bg-ebla-navy-gradient text-white rounded-2xl p-6 sm:p-8 border border-amber-500/30 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-20 h-16 rounded-xl bg-white border border-amber-300 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/assets/aistudio/Logo_premium_de_r_sidence_Ebal_two_66cf26e0.png"
                alt="Logo Résidence Ebla Two"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Dossier Acquéreur &amp; Contrat d'Achat Signé &middot; Amicale Ebla Two</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {profile.nomComplet}
              </h1>
              <p className="text-slate-200 text-sm">
                Dossier n° <strong>{profile.id}</strong> &middot; CIN : <strong>{profile.cin}</strong>{' '}
                &middot; Propriétaire du <strong>Lot {lot.id}</strong> ({lot.bloc} &middot;{' '}
                {lot.typology} - {lot.surfaceTotale} m²)
              </p>
              {allProfiles.length > 1 && onSelectProfile && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-300">Changer de dossier acquéreur :</span>
                  {allProfiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectProfile(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        p.id === profile.id
                          ? 'bg-amber-500 text-white font-bold'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {p.nomComplet} ({p.lotAttribueId})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-800/85 p-4 rounded-xl border border-amber-500/30 backdrop-blur-sm text-center">
            <div>
              <div className="text-xs text-slate-300">Avancement {lot.bloc}</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 tabular-nums">
                {monImmeuble ? monImmeuble.tauxGlobal : profile.pourcentageAvancementPersonnel}%
              </div>
              <div className="text-[11px] text-slate-300">Gros œuvre 100%</div>
            </div>
            <div>
              <div className="text-xs text-slate-300">Apports Versés</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {(totalVerse / 1000).toLocaleString('fr-FR')} kDH
              </div>
              <div className="text-[11px] text-emerald-400/80">Contrat d'achat actif</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-300">Parking Sous-sol</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-200 tabular-nums">
                N° {lot.parkingSousSolNumero}
              </div>
              <div className="text-[11px] text-slate-300">230 places titrées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-1.5 rounded-xl shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ged')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'ged'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Mon Dossier d'Achat (CIN, Réservation, Contrat d'achat, Correspondances) (
            {profile.documents.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suivi')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'suivi'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>
            Étapes Travaux {lot.bloc} ({monImmeuble ? monImmeuble.tauxGlobal : 72}%)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cameras')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'cameras'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-rose-500" />
          <span>Streaming 4 Caméras 24/7</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('echeancier')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'echeancier'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>
            Échéancier &amp; Quittances (
            {profile.echeancier.filter((e) => e.statut === 'Payé').length}/4)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messagerie')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'messagerie'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Messagerie ({messages.length})</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1 : DOSSIER D'ACHAT COMPLET (CIN, CONTRAT DE RÉSERVATION, CONTRAT D'ACHAT, CORRESPONDANCES, AUTRES)
          ===================================================================== */}
      {activeTab === 'ged' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Dossier Individuel de l'Acquéreur · {profile.nomComplet} (Lot {lot.id})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pièces officielles du compte : CIN, Contrat de réservation, Contrat d'achat signé, Correspondances et Autres documents.
              </p>
            </div>

            {onAddDocumentToAdherent && (
              <button
                type="button"
                onClick={() => {
                  setDocModalCategory("Contrat d'achat");
                  setDocModalOpen(true);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un Document (Téléchargement / Caméra / Saisie)</span>
              </button>
            )}
          </div>

          {/* 5 Mandatory Dossier Compartments */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedDocCategory('Tous')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedDocCategory === 'Tous'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs font-bold">Tout le Dossier</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {profile.documents.length} pièces
              </div>
            </button>

            {CATEGORIES_DOSSIER_ADHERENT.map((cat) => {
              const count = profile.documents.filter((d) =>
                cat === 'Autres'
                  ? d.categorie === 'Autres' ||
                    d.categorie === 'Quittance' ||
                    d.categorie === 'Plan' ||
                    d.categorie === 'Attestation'
                  : cat === "Contrat d'achat"
                  ? d.categorie === "Contrat d'achat" || d.categorie === 'Contrat'
                  : d.categorie === cat
              ).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedDocCategory(cat)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedDocCategory === cat
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{cat}</span>
                    {count > 0 && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">{count} document(s)</div>
                </button>
              );
            })}
          </div>

          {downloadNotice && (
            <div className="p-3 bg-slate-900 text-white rounded-lg text-xs flex items-center justify-between animate-fade-in">
              <span>
                Document <strong>{downloadNotice}</strong> téléchargé avec succès !
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
          )}

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-amber-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                        {doc.categorie}
                      </span>
                      {doc.modeAjout && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
                          {doc.modeAjout === 'Caméra' ? (
                            <Camera className="w-3 h-3 text-emerald-600" />
                          ) : doc.modeAjout === 'Saisie directe' ? (
                            <FileEdit className="w-3 h-3 text-sky-600" />
                          ) : (
                            <Upload className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{doc.modeAjout}</span>
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        {doc.statutVerification || 'Certifié'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{doc.titre}</div>
                    {doc.contenuTexte && (
                      <p className="text-[11px] text-slate-600 line-clamp-2">{doc.contenuTexte}</p>
                    )}
                    <div className="text-[11px] text-slate-500">
                      {doc.fichierRef} &middot; {doc.taille} &middot; Déposé le {doc.date}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-slate-700 hover:text-slate-950 bg-white hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors shrink-0 cursor-pointer"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2 : SUIVI ACHAT & ÉTAPES DES TRAVAUX DE L'IMMEUBLE DE L'ADHÉRENT
          ===================================================================== */}
      {activeTab === 'suivi' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Avancement détaillé de votre bâtiment · {lot.bloc} (Lot {lot.id})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {monImmeuble?.observations ||
                    `Contrôlé et validé par ${chantier.bureauControle} le ${chantier.dateDerniereVisiteBet}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('cameras')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-rose-400" />
                  <span>Voir Caméras 24/7</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestVisit(lot)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Prendre RDV sur chantier</span>
                </button>
              </div>
            </div>

            {/* Progress bar for the Adherent's Immeuble */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">
                  Taux d'exécution {lot.bloc} ({monImmeuble?.etapeActuelle})
                </span>
                <span className="text-amber-700 font-mono">
                  {monImmeuble ? monImmeuble.tauxGlobal : chantier.globalPourcentage}% Réalisé
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      monImmeuble ? monImmeuble.tauxGlobal : chantier.globalPourcentage
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* 8 Stages of the Adherent's Immeuble */}
            {monImmeuble && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {monImmeuble.etapes.map((etape) => (
                  <div
                    key={etape.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{etape.nom}</span>
                      <span className="text-xs font-mono font-bold text-amber-700">
                        {etape.taux}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          etape.taux === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${etape.taux}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{etape.statut}</span>
                      <span>MAJ {etape.dateMaj}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3 : STREAMING 24/7 DES 4 CAMÉRAS DE SURVEILLANCE DU CHANTIER
          ===================================================================== */}
      {activeTab === 'cameras' && (
        <ChantierLiveCameras
          cameras={chantier.camerasSurveillance || []}
          isEditable={false}
        />
      )}

      {/* =====================================================================
          TAB 4 : ÉCHÉANCIER FINANCIER & QUITTANCES
          ===================================================================== */}
      {activeTab === 'echeancier' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Échéancier de Paiement de l'Amicale (Lot {lot.id})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Montant global contractuel :{' '}
                  <strong>{lot.prixTotal.toLocaleString('fr-FR')} DH</strong> &middot; Payé à ce
                  jour : <strong>{totalVerse.toLocaleString('fr-FR')} DH</strong>
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Solde Restant à Débloquer</div>
                <div className="text-lg font-bold font-mono text-slate-800 tabular-nums">
                  {totalRestant.toLocaleString('fr-FR')} DH
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {profile.echeancier.map((tranche) => (
                <div
                  key={tranche.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    tranche.statut === 'Payé'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : tranche.statut === 'En cours'
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{tranche.libelle}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          tranche.statut === 'Payé'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tranche.statut === 'En cours'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tranche.statut}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                      <span>
                        Échéance : <strong>{tranche.dateEcheance}</strong>
                      </span>
                      {tranche.datePaiement && (
                        <>
                          <span>&middot;</span>
                          <span>
                            Payé le : {tranche.datePaiement} ({tranche.modePaiement})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-slate-900 tabular-nums">
                        {tranche.montant.toLocaleString('fr-FR')} DH
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {tranche.pourcentage}% du total
                      </div>
                    </div>

                    {tranche.quittanceNumero ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload({
                            id: tranche.id,
                            titre: `Quittance ${tranche.quittanceNumero}`,
                            categorie: 'Autres',
                            date: tranche.datePaiement || tranche.dateEcheance,
                            taille: '450 Ko',
                            fichierRef: `${tranche.quittanceNumero}.txt`,
                            contenuTexte: `QUITTANCE LIBÉRATOIRE N° ${tranche.quittanceNumero}\nMontant : ${tranche.montant.toLocaleString('fr-FR')} DH\nLot : ${lot.id}\nAdhérent : ${profile.nomComplet}`,
                          })
                        }
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger Quittance</span>
                      </button>
                    ) : tranche.statut === 'En cours' ? (
                      <span className="text-xs text-amber-700 font-medium bg-amber-100/70 px-2.5 py-1 rounded-md">
                        Appel de fonds envoyé
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">À la livraison</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5 : MESSAGERIE DIRECTE AVEC LE CONSEILLER
          ===================================================================== */}
      {activeTab === 'messagerie' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-[480px]">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                YB
              </div>
              <div>
                <div className="text-xs font-bold text-white">Yassine Berrada</div>
                <div className="text-[11px] text-slate-400">
                  Conseiller Commercial &amp; Relation Adhérents Ebla Two
                </div>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              En ligne sur site
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((m) => {
              const isMe = m.expediteurRole === 'adherent';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[80%] ${
                    isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 mb-0.5">{m.expediteurNom}</div>
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-amber-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-2xs'
                    }`}
                  >
                    {m.texte}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{m.date}</div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleSendChat}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Écrivez votre message au conseiller..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer</span>
            </button>
          </form>
        </div>
      )}

      {onAddDocumentToAdherent && (
        <DocumentCaptureModal
          isOpen={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          context="adherent"
          initialAdherentCategory={docModalCategory}
          targetAdherent={profile}
          adherentsList={allProfiles}
          onSaveAdherentDoc={(adherentId, newDoc) => {
            onAddDocumentToAdherent(adherentId, newDoc);
          }}
        />
      )}
    </div>
  );
};
