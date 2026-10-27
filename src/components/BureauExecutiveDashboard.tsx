import React, { useState } from 'react';
import {
  ChantierAvancement,
  TresorerieAmicale,
  ReunionItem,
  TacheBureau,
  ReservationDemande,
  VisiteRdv,
  PropertyLot,
  TransactionFinanciere,
  BureauDocument,
  AdherentProfile,
  AdherentDocument,
  AdherentDocCategory,
  MembreBureauRole,
  CategorieDocBureau,
  ModeAjoutDocument,
  ImmeubleAvancement,
  CameraSurveillanceItem,
} from '../types';
import {
  Building2,
  FileCheck,
  CreditCard,
  Users,
  Bell,
  Plus,
  CheckCircle,
  Download,
  Check,
  X,
  Briefcase,
  FileSpreadsheet,
  FolderOpen,
  Camera,
  Upload,
  FileEdit,
  Video,
  UserPlus,
  ShieldCheck,
  Eye,
  Sliders,
  FileText,
} from 'lucide-react';
import { ChantierLiveCameras } from './ChantierLiveCameras';
import {
  DocumentCaptureModal,
  CATEGORIES_PAR_ROLE,
  CATEGORIES_DOSSIER_ADHERENT,
} from './DocumentCaptureModal';

interface BureauExecutiveDashboardProps {
  chantier: ChantierAvancement;
  tresorerie: TresorerieAmicale;
  reunions: ReunionItem[];
  taches: TacheBureau[];
  reservations: ReservationDemande[];
  visites: VisiteRdv[];
  lots: PropertyLot[];
  bureauDocuments: BureauDocument[];
  adherentsDossiers: AdherentProfile[];
  onApproveReservation: (resId: string) => void;
  onRejectReservation: (resId: string) => void;
  onAddTransaction: (trx: Omit<TransactionFinanciere, 'id'>) => void;
  onAddReunion: (reunion: Omit<ReunionItem, 'id'>) => void;
  onSendAlert: (titre: string, message: string, categorie: 'Paiement' | 'Chantier' | 'Réunion') => void;
  onOpenExcelManager: () => void;
  onAddBureauDocument: (doc: Omit<BureauDocument, 'id' | 'date'>) => void;
  onOpenNewAdherentDossier: (newProfile: AdherentProfile) => void;
  onAddDocumentToAdherent: (
    adherentId: string,
    doc: Omit<AdherentDocument, 'id' | 'date'>
  ) => void;
  onUpdateImmeubleAvancement: (updated: ImmeubleAvancement) => void;
  onUpdateCameraSurveillance: (updated: CameraSurveillanceItem) => void;
}

export const BureauExecutiveDashboard: React.FC<BureauExecutiveDashboardProps> = ({
  chantier,
  tresorerie,
  reunions,
  taches,
  reservations,
  lots,
  bureauDocuments,
  adherentsDossiers,
  onApproveReservation,
  onRejectReservation,
  onAddTransaction,
  onAddReunion,
  onSendAlert,
  onOpenExcelManager,
  onAddBureauDocument,
  onOpenNewAdherentDossier,
  onAddDocumentToAdherent,
  onUpdateImmeubleAvancement,
  onUpdateCameraSurveillance,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'ged_bureau'
    | 'dossiers_adherents'
    | 'chantier'
    | 'cameras'
    | 'reunions'
    | 'tresorerie'
    | 'reservations'
    | 'taches'
  >('ged_bureau');

  // GED Bureau Filter State
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<MembreBureauRole | 'Tous'>('Tous');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('Toutes');

  // Document Capture Modal State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalContext, setDocModalContext] = useState<'bureau' | 'adherent'>('bureau');
  const [docModalInitialRole, setDocModalInitialRole] =
    useState<MembreBureauRole>('Secrétaire Général');
  const [docModalInitialAdherentCat, setDocModalInitialAdherentCat] =
    useState<AdherentDocCategory>("Contrat d'achat");
  const [previewDoc, setPreviewDoc] = useState<{
    titre: string;
    sousTitre: string;
    contenu?: string;
    dataUrl?: string;
    fichierRef: string;
  } | null>(null);

  // Dossiers Adhérents State
  const [selectedAdherentId, setSelectedAdherentId] = useState<string>(
    adherentsDossiers[0]?.id || ''
  );
  const [showNewDossierModal, setShowNewDossierModal] = useState(false);
  const [newDossierNom, setNewDossierNom] = useState('');
  const [newDossierCin, setNewDossierCin] = useState('');
  const [newDossierTel, setNewDossierTel] = useState('');
  const [newDossierEmail, setNewDossierEmail] = useState('');
  const [newDossierVille, setNewDossierVille] = useState('Mohammedia / Casablanca');
  const [newDossierLotId, setNewDossierLotId] = useState('APP-A103');
  const [newDossierNotaire, setNewDossierNotaire] = useState(
    'Étude Notariale Me. Amrani (Casablanca / Mohammedia)'
  );

  // Immeubles A-F Construction Progress State
  const [selectedImmeubleCode, setSelectedImmeubleCode] = useState<
    'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  >('A');
  const [newEtapeNom, setNewEtapeNom] = useState('');

  // Existing Modals States
  const [showAddTrxModal, setShowAddTrxModal] = useState(false);
  const [trxLibelle, setTrxLibelle] = useState('');
  const [trxMontant, setTrxMontant] = useState('');
  const [trxType, setTrxType] = useState<'Entrée' | 'Sortie'>('Sortie');
  const [trxCat, setTrxCat] = useState<TransactionFinanciere['categorie']>('Entreprise BTP');

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitre, setAlertTitre] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCat, setAlertCat] = useState<'Paiement' | 'Chantier' | 'Réunion'>('Chantier');
  const [alertSentSuccess, setAlertSentSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showAddReunionModal, setShowAddReunionModal] = useState(false);
  const [reunionTitre, setReunionTitre] = useState('');
  const [reunionDate, setReunionDate] = useState('');
  const [reunionOrdre, setReunionOrdre] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedAdherent =
    adherentsDossiers.find((a) => a.id === selectedAdherentId) || adherentsDossiers[0];

  const selectedImmeuble =
    chantier.immeublesAvancement?.find((im) => im.immeuble === selectedImmeubleCode) ||
    chantier.immeublesAvancement?.[0];

  const handleOpenBureauDocModal = (role: MembreBureauRole) => {
    setDocModalContext('bureau');
    setDocModalInitialRole(role);
    setDocModalOpen(true);
  };

  const handleOpenAdherentDocModal = (cat: AdherentDocCategory) => {
    setDocModalContext('adherent');
    setDocModalInitialAdherentCat(cat);
    setDocModalOpen(true);
  };

  const handleCreateNewDossier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDossierNom.trim() || !newDossierCin.trim()) return;

    const targetLot = lots.find((l) => l.id === newDossierLotId) || lots[0];
    const trancheAmount = Math.round((targetLot?.prixTotal || 900000) * 0.25);
    const todayStr = new Date().toLocaleDateString('fr-FR');
    const newId = `ADH-2026-${Math.floor(110 + Math.random() * 880)}`;

    const newDossier: AdherentProfile = {
      id: newId,
      nomComplet: newDossierNom.trim(),
      cin: newDossierCin.trim().toUpperCase(),
      email: newDossierEmail.trim() || 'acquereur@eblatwo.ma',
      telephone: newDossierTel.trim() || '+212 6 61 00 00 00',
      ville: newDossierVille.trim() || 'Mohammedia',
      dateAdhesion: todayStr,
      lotAttribueId: newDossierLotId,
      pourcentageAvancementPersonnel: chantier.globalPourcentage,
      contratAchatSigne: true,
      dateSignatureContratAchat: todayStr,
      notaireInstrumentaire: newDossierNotaire,
      echeancier: [
        {
          id: `ECH-${newId}-1`,
          numeroTranche: 1,
          libelle: 'Tranche 1 - Réservation & Signature Contrat d’Achat (25%)',
          pourcentage: 25,
          montant: trancheAmount,
          dateEcheance: todayStr,
          statut: 'Payé',
          quittanceNumero: `QUIT-${Date.now().toString().slice(-4)}`,
          datePaiement: todayStr,
          modePaiement: 'Chèque certifié / Virement',
        },
        {
          id: `ECH-${newId}-2`,
          numeroTranche: 2,
          libelle: 'Tranche 2 - Achèvement Gros Œuvre (25%)',
          pourcentage: 25,
          montant: trancheAmount,
          dateEcheance: '15/12/2026',
          statut: 'En cours',
        },
        {
          id: `ECH-${newId}-3`,
          numeroTranche: 3,
          libelle: 'Tranche 3 - Finitions & Menuiserie (25%)',
          pourcentage: 25,
          montant: trancheAmount,
          dateEcheance: '15/02/2027',
          statut: 'À venir',
        },
        {
          id: `ECH-${newId}-4`,
          numeroTranche: 4,
          libelle: 'Tranche 4 - Remise des clés & Titre Foncier (25%)',
          pourcentage: 25,
          montant: trancheAmount,
          dateEcheance: '30/03/2027',
          statut: 'À venir',
        },
      ],
      documents: [
        {
          id: `DOC-${newId}-CIN`,
          titre: `Copie CIN Légalisée (${newDossierCin.toUpperCase()}) - ${newDossierNom}`,
          categorie: 'CIN',
          date: todayStr,
          taille: '950 Ko',
          fichierRef: `CIN_${newDossierCin.toUpperCase()}.pdf`,
          modeAjout: 'Caméra',
          statutVerification: 'Vérifié',
          contenuTexte: `Pièce d'identité CIN ${newDossierCin.toUpperCase()} vérifiée lors de l'ouverture du dossier d'achat.`,
        },
        {
          id: `DOC-${newId}-RES`,
          titre: `Contrat de Réservation Signé · Lot ${newDossierLotId}`,
          categorie: 'Contrat de réservation',
          date: todayStr,
          taille: '1.8 Mo',
          fichierRef: `CONTRAT_RESERVATION_${newDossierLotId}.pdf`,
          modeAjout: 'Téléchargement',
          statutVerification: 'Signé & Certifié',
          contenuTexte: `Contrat de réservation du lot ${newDossierLotId} au profit de ${newDossierNom}.`,
        },
        {
          id: `DOC-${newId}-ACHAT`,
          titre: `Contrat d'Achat Définitif Signé · Lot ${newDossierLotId}`,
          categorie: "Contrat d'achat",
          date: todayStr,
          taille: '3.2 Mo',
          fichierRef: `CONTRAT_ACHAT_${newDossierLotId}.pdf`,
          modeAjout: 'Saisie directe',
          statutVerification: 'Signé & Certifié',
          contenuTexte: `Contrat d'achat définitif signé devant ${newDossierNotaire} pour le lot ${newDossierLotId} par ${newDossierNom} (CIN: ${newDossierCin.toUpperCase()}).`,
        },
        {
          id: `DOC-${newId}-CORR`,
          titre: `Lettre de Bienvenue & Confirmation d'Ouverture de Compte Adhérent`,
          categorie: 'Correspondances',
          date: todayStr,
          taille: '410 Ko',
          fichierRef: `COURRIER_OUVERTURE_${newId}.pdf`,
          modeAjout: 'Saisie directe',
          statutVerification: 'Signé & Certifié',
          contenuTexte: `Correspondance officielle du Bureau Exécutif confirmant l'ouverture du dossier individuel ${newId}.`,
        },
        {
          id: `DOC-${newId}-AUT`,
          titre: `Plan Coté du Lot ${newDossierLotId} & Quittance 1ère Tranche`,
          categorie: 'Autres',
          date: todayStr,
          taille: '2.5 Mo',
          fichierRef: `PLAN_ET_QUITTANCE_${newDossierLotId}.pdf`,
          modeAjout: 'Téléchargement',
          statutVerification: 'Vérifié',
        },
      ],
    };

    onOpenNewAdherentDossier(newDossier);
    setSelectedAdherentId(newId);
    setShowNewDossierModal(false);
    setNewDossierNom('');
    setNewDossierCin('');
    setNewDossierTel('');
    setNewDossierEmail('');
    showToast(
      `Dossier acquéreur ${newId} (${newDossier.nomComplet} · Lot ${newDossierLotId}) ouvert avec CIN, Contrat de réservation, Contrat d'achat, Correspondances et Autres !`
    );
  };

  const handleUpdateEtapeTaux = (etapeId: string, newTaux: number) => {
    if (!selectedImmeuble) return;
    const clamped = Math.max(0, Math.min(100, newTaux));
    const updatedEtapes = selectedImmeuble.etapes.map((et) => {
      if (et.id !== etapeId) return et;
      const newStatut: 'Terminé' | 'En cours' | 'En attente' =
        clamped === 100 ? 'Terminé' : clamped > 0 ? 'En cours' : 'En attente';
      return {
        ...et,
        taux: clamped,
        statut: newStatut,
        dateMaj: new Date().toLocaleDateString('fr-FR'),
      };
    });
    const avgTaux = Math.round(
      updatedEtapes.reduce((sum, e) => sum + e.taux, 0) / updatedEtapes.length
    );
    const currentInProgress =
      updatedEtapes.find((e) => e.statut === 'En cours')?.nom ||
      'Finitions & Réception finale';

    onUpdateImmeubleAvancement({
      ...selectedImmeuble,
      tauxGlobal: avgTaux,
      etapeActuelle: currentInProgress,
      dateDerniereMaj: new Date().toLocaleDateString('fr-FR'),
      etapes: updatedEtapes,
    });
  };

  const handleAddEtapeToImmeuble = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImmeuble || !newEtapeNom.trim()) return;
    const nextNum = selectedImmeuble.etapes.length + 1;
    const newEtape = {
      id: `${selectedImmeuble.immeuble}-${Date.now().toString().slice(-3)}`,
      nom: `${nextNum}. ${newEtapeNom.trim()}`,
      taux: 0,
      statut: 'En attente' as const,
      dateMaj: new Date().toLocaleDateString('fr-FR'),
    };
    const updatedEtapes = [...selectedImmeuble.etapes, newEtape];
    const avgTaux = Math.round(
      updatedEtapes.reduce((sum, item) => sum + item.taux, 0) / updatedEtapes.length
    );
    onUpdateImmeubleAvancement({
      ...selectedImmeuble,
      tauxGlobal: avgTaux,
      dateDerniereMaj: new Date().toLocaleDateString('fr-FR'),
      etapes: updatedEtapes,
    });
    setNewEtapeNom('');
    showToast(`Nouvelle étape ajoutée pour l'${selectedImmeuble.blocName}`);
  };

  const handleDownloadOrPreviewDoc = (doc: {
    titre: string;
    sousTitre: string;
    contenu?: string;
    dataUrl?: string;
    fichierRef: string;
  }) => {
    setPreviewDoc(doc);
  };

  const triggerRealFileDownload = (doc: {
    titre: string;
    sousTitre: string;
    contenu?: string;
    dataUrl?: string;
    fichierRef: string;
  }) => {
    if (doc.dataUrl) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.fichierRef || `${doc.titre}.png`;
      a.click();
      return;
    }
    const content = `====================================================================
AMICALE RÉSIDENTIELLE EBLA TWO — MANSOURIA (MOHAMMEDIA)
====================================================================
DOCUMENT OFFICIEL CERTIFIÉ : ${doc.titre}
${doc.sousTitre}
Fichier : ${doc.fichierRef}
--------------------------------------------------------------------

${doc.contenu || 'Document officiel certifié conforme par le Bureau Exécutif de l’Amicale Ebla Two.'}

====================================================================
Cachet & Signature Électronique Certifiée · Amicale Ebla Two
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.fichierRef.replace(/\.[^/.]+$/, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateTrx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxLibelle || !trxMontant) return;
    onAddTransaction({
      date: new Date().toLocaleDateString('fr-FR'),
      libelle: trxLibelle,
      categorie: trxCat,
      type: trxType,
      montant: Number(trxMontant),
      referencePiece: `VIR-EBLA-${Date.now().toString().slice(-4)}`,
      statut: 'Rapproché',
    });
    setTrxLibelle('');
    setTrxMontant('');
    setShowAddTrxModal(false);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitre || !alertMessage) return;
    onSendAlert(alertTitre, alertMessage, alertCat);
    setAlertTitre('');
    setAlertMessage('');
    setShowAlertModal(false);
    setAlertSentSuccess(true);
    setTimeout(() => setAlertSentSuccess(false), 3000);
  };

  const handleCreateReunion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reunionTitre || !reunionDate) return;
    onAddReunion({
      titre: reunionTitre,
      type: 'Réunion Bureau Exécutif',
      date: reunionDate,
      heure: '15:00',
      lieu: 'Bureau de Chantier Mansouria',
      ordreDuJour: reunionOrdre.split('\n').filter((l) => l.trim()),
      quorumAtteint: true,
      tauxPresence: 100,
      decisions: ['Ordre du jour validé et diffusé aux membres du bureau.'],
      pvRef: `PV-${Date.now().toString().slice(-4)}.pdf`,
      statut: 'Programmée',
    });
    setReunionTitre('');
    setReunionDate('');
    setReunionOrdre('');
    setShowAddReunionModal(false);
  };

  const filteredBureauDocs = bureauDocuments.filter((d) => {
    const matchRole = selectedRoleFilter === 'Tous' || d.membreRole === selectedRoleFilter;
    const matchCat = selectedCatFilter === 'Toutes' || d.categorie === selectedCatFilter;
    return matchRole && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Executive Dashboard */}
      <div className="bg-ebla-navy-gradient text-white rounded-2xl p-6 sm:p-8 border border-amber-500/30 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-20 h-16 rounded-xl bg-white border border-amber-300 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/assets/aistudio/Logo_premium_de_r_sidence_Ebal_two_66cf26e0.png"
                alt="Logo Résidence Ebla Two"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
                <Briefcase className="w-4 h-4" />
                <span>Gouvernance &amp; Pilotage du Bureau Exécutif</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Amicale Résidence Ebla Two · Mansouria
              </h1>
              <p className="text-slate-200 text-sm mt-1">
                GED du Bureau (Secrétaire Général, Trésorier, Président), Dossiers Contrats d'Achat Adhérents, Avancement par Immeuble (A à F) &amp; Caméras 24/7.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDocModalContext('bureau');
                setDocModalInitialRole('Secrétaire Général');
                setDocModalOpen(true);
              }}
              className="px-3.5 py-2 bg-ebla-gold-gradient hover:opacity-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Document (Fichier / Caméra / Saisie)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNewDossierModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Ouvrir Dossier Acquéreur</span>
            </button>

            <button
              type="button"
              onClick={onOpenExcelManager}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel 162 Lots</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAlertModal(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Alerte Push</span>
            </button>
          </div>
        </div>

        {/* Global Executive Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div>
            <div className="text-xs text-slate-400">Avancement Global (A–F)</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {chantier.globalPourcentage}%
            </div>
            <div className="text-[11px] text-slate-400">6 Immeubles R+3</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Documents Bureau GED</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              {bureauDocuments.length}
            </div>
            <div className="text-[11px] text-amber-300">SG · Trésorier · Président</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Dossiers Acquéreurs</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {adherentsDossiers.length}
            </div>
            <div className="text-[11px] text-emerald-400/80">Contrats d'achat signés</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Solde Banque Amicale</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-sky-400 tabular-nums">
              {(tresorerie.soldeActuelBanque / 1000000).toFixed(2)} M DH
            </div>
            <div className="text-[11px] text-slate-400">Attijariwafa Mohammedia</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-xs text-slate-400">Télésurveillance</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 tabular-nums flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>4 CAM</span>
            </div>
            <div className="text-[11px] text-slate-400">Streaming Live 24/7</div>
          </div>
        </div>
      </div>

      {(alertSentSuccess || toastMessage) && (
        <div className="p-3.5 bg-emerald-900 text-white rounded-xl text-xs flex items-center justify-between animate-fade-in shadow-md">
          <span>
            {toastMessage ||
              'Notification push instantanée envoyée avec succès à tous les adhérents connectés !'}
          </span>
          <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white p-1.5 rounded-xl shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ged_bureau')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'ged_bureau'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>GED Bureau (SG · Trésorier · Président)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dossiers_adherents')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'dossiers_adherents'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dossiers Adhérents &amp; Contrats d'Achat ({adherentsDossiers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chantier')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'chantier'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Travaux par Immeuble A–F ({chantier.globalPourcentage}%)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cameras')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'cameras'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-rose-500" />
          <span>4 Caméras Live 24/7</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tresorerie')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'tresorerie'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Trésorerie ({(tresorerie.soldeActuelBanque / 1000000).toFixed(1)}M DH)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reunions')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'reunions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Réunions &amp; AG ({reunions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'reservations'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Réservations ({reservations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('taches')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'taches'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Tâches ({taches.length})</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1 : GED DU BUREAU EXÉCUTIF PAR FONCTION (SG, TRÉSORIER, PRÉSIDENT)
          ===================================================================== */}
      {activeTab === 'ged_bureau' && (
        <div className="space-y-6">
          {/* 3 Role Cards with their exact prerogatives & quick action buttons */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Secrétaire Général */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    Secrétaire Général
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {bureauDocuments.filter((d) => d.membreRole === 'Secrétaire Général').length} docs
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  M. Adil Chraibi · Secrétariat Général
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CATEGORIES_PAR_ROLE['Secrétaire Général'].map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBureauDocModal('Secrétaire Général')}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Ajouter (PV / Doc Projet / Doc Adhérents / Autres)</span>
              </button>
            </div>

            {/* Trésorier */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Trésorier
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {bureauDocuments.filter((d) => d.membreRole === 'Trésorier').length} docs
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Mme. Nadia Bennis · Trésorerie &amp; Comptabilité
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CATEGORIES_PAR_ROLE['Trésorier'].map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBureauDocModal('Trésorier')}
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>Ajouter (Avis d'opérations / Chèques / Comptabilité)</span>
              </button>
            </div>

            {/* Président */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Président
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {bureauDocuments.filter((d) => d.membreRole === 'Président').length} docs
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Dr. Mohammed Tazi · Présidence de l'Amicale
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CATEGORIES_PAR_ROLE['Président'].map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBureauDocModal('Président')}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter (Correspondances / Doc Admin / Convocations)</span>
              </button>
            </div>
          </div>

          {/* Filter & Documents List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                {(['Tous', 'Secrétaire Général', 'Trésorier', 'Président'] as const).map(
                  (role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSelectedRoleFilter(role);
                        setSelectedCatFilter('Toutes');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        selectedRoleFilter === role
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {role}
                    </button>
                  )
                )}
              </div>

              {selectedRoleFilter !== 'Tous' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCatFilter('Toutes')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                      selectedCatFilter === 'Toutes'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Toutes
                  </button>
                  {CATEGORIES_PAR_ROLE[selectedRoleFilter].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCatFilter(cat)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                        selectedCatFilter === cat
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredBureauDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            doc.membreRole === 'Secrétaire Général'
                              ? 'bg-indigo-100 text-indigo-800'
                              : doc.membreRole === 'Trésorier'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.membreRole}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                          {doc.categorie}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-medium flex items-center gap-1">
                        {doc.modeAjout === 'Caméra' ? (
                          <Camera className="w-3 h-3 text-emerald-600" />
                        ) : doc.modeAjout === 'Saisie directe' ? (
                          <FileEdit className="w-3 h-3 text-sky-600" />
                        ) : (
                          <Upload className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{doc.modeAjout}</span>
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900">{doc.titre}</div>

                    {doc.contenuTexte && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {doc.contenuTexte}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 pt-1">
                      <span>{doc.auteur}</span>
                      <span>&middot;</span>
                      <span>{doc.date}</span>
                      {doc.referencePiece && (
                        <>
                          <span>&middot;</span>
                          <span className="font-mono text-slate-700 font-semibold">
                            Réf: {doc.referencePiece}
                          </span>
                        </>
                      )}
                      {doc.montant !== undefined && (
                        <>
                          <span>&middot;</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {doc.montant.toLocaleString('fr-FR')} DH
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadOrPreviewDoc({
                          titre: doc.titre,
                          sousTitre: `${doc.membreRole} · ${doc.categorie} · ${doc.date}`,
                          contenu: doc.contenuTexte,
                          dataUrl: doc.dataUrl,
                          fichierRef: doc.fichierRef,
                        })
                      }
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>Consulter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        triggerRealFileDownload({
                          titre: doc.titre,
                          sousTitre: `${doc.membreRole} · ${doc.categorie} · ${doc.date}`,
                          contenu: doc.contenuTexte,
                          dataUrl: doc.dataUrl,
                          fichierRef: doc.fichierRef,
                        })
                      }
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2 : DOSSIERS ADHÉRENTS ACQUÉREURS (CIN, RÉSERVATION, CONTRAT D'ACHAT, CORRESPONDANCES, AUTRES)
          ===================================================================== */}
      {activeTab === 'dossiers_adherents' && (
        <div className="space-y-6">
          {/* Header & Selector of Buyer Dossiers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Dossiers Individuels des Adhérents Acquéreurs (Contrats d'Achat Signés)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chaque dossier contient obligatoirement : CIN, Contrat de réservation, Contrat d'achat, Correspondances et Autres pièces.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewDossierModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ouvrir un Nouveau Dossier Acquéreur (Contrat d'Achat)</span>
              </button>
            </div>

            {/* Buyer Dossier Cards Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {adherentsDossiers.map((adh) => {
                const isSelected = adh.id === selectedAdherent?.id;
                return (
                  <button
                    key={adh.id}
                    type="button"
                    onClick={() => setSelectedAdherentId(adh.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {adh.id} &middot; Lot {adh.lotAttribueId}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        Contrat Signé
                      </span>
                    </div>
                    <div className="text-xs font-bold mt-1">{adh.nomComplet}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      CIN : {adh.cin} &middot; {adh.documents.length} pièces au dossier
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Adherent Dossier Detail */}
            {selectedAdherent && (
              <div className="pt-4 border-t border-slate-200 space-y-5">
                <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">
                        Dossier Acquéreur N° {selectedAdherent.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Contrat d'achat signé le{' '}
                        {selectedAdherent.dateSignatureContratAchat || selectedAdherent.dateAdhesion}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">
                      {selectedAdherent.nomComplet} &middot; Lot {selectedAdherent.lotAttribueId}
                    </h4>
                    <div className="text-xs text-slate-300">
                      CIN : <strong>{selectedAdherent.cin}</strong> &middot; Tél :{' '}
                      {selectedAdherent.telephone} &middot; Email : {selectedAdherent.email} &middot;{' '}
                      {selectedAdherent.notaireInstrumentaire || 'Étude Notariale Me. Amrani'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAdherentDocModal("Contrat d'achat")}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter Pièce (Téléchargement / Caméra / Saisie)</span>
                  </button>
                </div>

                {/* 5 Mandatory Dossier Categories Checklist & Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {CATEGORIES_DOSSIER_ADHERENT.map((cat) => {
                    const docsInCat = selectedAdherent.documents.filter((d) =>
                      cat === 'Autres'
                        ? d.categorie === 'Autres' ||
                          d.categorie === 'Quittance' ||
                          d.categorie === 'Plan' ||
                          d.categorie === 'Attestation'
                        : cat === "Contrat d'achat"
                        ? d.categorie === "Contrat d'achat" || d.categorie === 'Contrat'
                        : d.categorie === cat
                    );
                    const hasDoc = docsInCat.length > 0;

                    return (
                      <div
                        key={cat}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                          hasDoc
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{cat}</span>
                            {hasDoc ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-amber-700 font-semibold">
                                À compléter
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            {docsInCat.length} document(s)
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenAdherentDocModal(cat)}
                          className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-amber-600" />
                          <span>Ajouter {cat}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Full List of Documents inside this Adherent's Dossier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedAdherent.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                            {doc.categorie}
                          </span>
                          {doc.modeAjout && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                              {doc.modeAjout}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            {doc.statutVerification || 'Certifié'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{doc.titre}</div>
                        {doc.contenuTexte && (
                          <p className="text-[11px] text-slate-600 line-clamp-2">
                            {doc.contenuTexte}
                          </p>
                        )}
                        <div className="text-[11px] text-slate-500">
                          {doc.fichierRef} &middot; {doc.taille} &middot; Ajouté le {doc.date}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadOrPreviewDoc({
                              titre: doc.titre,
                              sousTitre: `Dossier ${selectedAdherent.nomComplet} (${selectedAdherent.id}) · ${doc.categorie}`,
                              contenu: doc.contenuTexte,
                              dataUrl: doc.dataUrl,
                              fichierRef: doc.fichierRef,
                            })
                          }
                          className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                          title="Consulter"
                        >
                          <Eye className="w-4 h-4 text-amber-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            triggerRealFileDownload({
                              titre: doc.titre,
                              sousTitre: `Dossier ${selectedAdherent.nomComplet} (${selectedAdherent.id}) · ${doc.categorie}`,
                              contenu: doc.contenuTexte,
                              dataUrl: doc.dataUrl,
                              fichierRef: doc.fichierRef,
                            })
                          }
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4 text-amber-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3 : SAISIE DU TAUX ET DES ÉTAPES DES TRAVAUX POUR CHAQUE IMMEUBLE (A à F)
          ===================================================================== */}
      {activeTab === 'chantier' && (
        <div className="space-y-6">
          {/* 6 Immeubles A-F Overview & Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>
                    Saisie du Taux d'Avancement et des Étapes des Travaux par Immeuble (A à F)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sélectionnez l'un des 6 immeubles pour mettre à jour le pourcentage et l'état d'avancement de chaque étape.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                Moyenne Générale Chantier : {chantier.globalPourcentage}%
              </span>
            </div>

            {/* Grid of 6 Immeubles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {chantier.immeublesAvancement?.map((imm) => {
                const isSelected = imm.immeuble === selectedImmeubleCode;
                return (
                  <button
                    key={imm.immeuble}
                    type="button"
                    onClick={() => setSelectedImmeubleCode(imm.immeuble)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-500'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{imm.blocName}</span>
                      <span
                        className={`text-sm font-mono font-bold ${
                          isSelected ? 'text-amber-400' : 'text-amber-700'
                        }`}
                      >
                        {imm.tauxGlobal}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/40 rounded-full overflow-hidden my-2">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${imm.tauxGlobal}%` }}
                      />
                    </div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {imm.nbAppartements} Appts{' '}
                      {imm.nbMagasins > 0 ? `+ ${imm.nbMagasins} Mag` : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detailed Editor for the Selected Immeuble */}
            {selectedImmeuble && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-amber-400 font-bold text-xs">
                        {selectedImmeuble.blocName} (R+3)
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        {selectedImmeuble.nbAppartements} Appartements
                        {selectedImmeuble.nbMagasins > 0
                          ? ` & ${selectedImmeuble.nbMagasins} Magasins RDC`
                          : ''}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Étape active : <strong>{selectedImmeuble.etapeActuelle}</strong> &middot;
                      Dernière mise à jour : {selectedImmeuble.dateDerniereMaj}
                    </div>
                  </div>

                  {/* Direct Global Percentage Slider for this Building */}
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500">
                        Taux Global {selectedImmeuble.blocName}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={selectedImmeuble.tauxGlobal}
                          onChange={(e) =>
                            onUpdateImmeubleAvancement({
                              ...selectedImmeuble,
                              tauxGlobal: Number(e.target.value),
                              dateDerniereMaj: new Date().toLocaleDateString('fr-FR'),
                            })
                          }
                          className="w-28 accent-amber-600 cursor-pointer"
                        />
                        <span className="text-base font-bold font-mono text-slate-900 w-12 text-right">
                          {selectedImmeuble.tauxGlobal}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editable Observations & Current Stage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Étape en cours sur {selectedImmeuble.blocName}
                    </label>
                    <input
                      type="text"
                      value={selectedImmeuble.etapeActuelle}
                      onChange={(e) =>
                        onUpdateImmeubleAvancement({
                          ...selectedImmeuble,
                          etapeActuelle: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Observations Techniques BET / Architecte
                    </label>
                    <input
                      type="text"
                      value={selectedImmeuble.observations}
                      onChange={(e) =>
                        onUpdateImmeubleAvancement({
                          ...selectedImmeuble,
                          observations: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                {/* Stages List with Interactive Sliders & Status Selectors */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-800">
                    Étapes détaillées des travaux — {selectedImmeuble.blocName} (glissez le curseur pour ajuster le taux %) :
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedImmeuble.etapes.map((etape) => (
                      <div
                        key={etape.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">{etape.nom}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              etape.statut === 'Terminé'
                                ? 'bg-emerald-100 text-emerald-800'
                                : etape.statut === 'En cours'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {etape.statut}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={etape.taux}
                            onChange={(e) =>
                              handleUpdateEtapeTaux(etape.id, Number(e.target.value))
                            }
                            className="flex-1 accent-amber-600 cursor-pointer"
                          />
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={etape.taux}
                            onChange={(e) =>
                              handleUpdateEtapeTaux(etape.id, Number(e.target.value))
                            }
                            className="w-14 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-right"
                          />
                          <span className="text-xs font-mono font-bold text-slate-700">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add a new custom stage to this building */}
                <form
                  onSubmit={handleAddEtapeToImmeuble}
                  className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={`Ajouter une nouvelle étape pour l'${selectedImmeuble.blocName} (ex: Pose des portes blindées)...`}
                    value={newEtapeNom}
                    onChange={(e) => setNewEtapeNom(e.target.value)}
                    className="flex-1 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ajouter l'Étape</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4 : STREAMING LIVE 24/7 DE 4 CAMÉRAS DE SURVEILLANCE DU CHANTIER
          ===================================================================== */}
      {activeTab === 'cameras' && (
        <ChantierLiveCameras
          cameras={chantier.camerasSurveillance || []}
          isEditable={true}
          onUpdateCamera={(updatedCam) => {
            onUpdateCameraSurveillance(updatedCam);
            showToast(`Flux de la caméra ${updatedCam.code} mis à jour !`);
          }}
          onCaptureSnapshot={(camCode, zone, dataUrl) => {
            onAddBureauDocument({
              titre: `Capture Caméra Surveillance ${camCode} - ${zone}`,
              membreRole: 'Secrétaire Général',
              categorie: 'Documents du projet',
              modeAjout: 'Caméra',
              auteur: 'Système Télésurveillance 24/7',
              taille: '980 Ko',
              fichierRef: `SNAPSHOT_${camCode}_${Date.now().toString().slice(-5)}.jpg`,
              referencePiece: `CAM-${camCode}`,
              contenuTexte: `Capture horodatée issue du streaming 24/7 de la caméra ${camCode} (${zone}).`,
              dataUrl,
            });
            showToast(
              `Capture photo de ${camCode} enregistrée automatiquement dans les Documents du Projet (GED Bureau) !`
            );
          }}
        />
      )}

      {/* =====================================================================
          TAB 5 : RÉUNIONS & PVs
          ===================================================================== */}
      {activeTab === 'reunions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Procès-Verbaux d'Assemblées Générales &amp; Réunions de Bureau
            </h3>
            <button
              type="button"
              onClick={() => setShowAddReunionModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Convoquer Réunion / Nouveau PV</span>
            </button>
          </div>

          <div className="space-y-3">
            {reunions.map((reu) => (
              <div
                key={reu.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{reu.titre}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          reu.statut === 'Clôturée'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {reu.statut}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>
                        Date :{' '}
                        <strong>
                          {reu.date} à {reu.heure}
                        </strong>
                      </span>
                      <span>&middot;</span>
                      <span>Lieu : {reu.lieu}</span>
                      <span>&middot;</span>
                      <span>Quorum : {reu.tauxPresence}% de présence</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      triggerRealFileDownload({
                        titre: reu.titre,
                        sousTitre: `${reu.date} · ${reu.lieu}`,
                        contenu: `ORDRE DU JOUR :\n${reu.ordreDuJour.join('\n')}\n\nDÉCISIONS :\n${reu.decisions.join('\n')}`,
                        fichierRef: reu.pvRef,
                      })
                    }
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-600" />
                    <span>Télécharger PV ({reu.pvRef})</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-900 mb-1">
                      Points à l'Ordre du Jour :
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {reu.ordreDuJour.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-900 mb-1">
                      Résolutions &amp; Décisions Votées :
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {reu.decisions.map((dec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{dec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6 : TRÉSORERIE & COMPTES
          ===================================================================== */}
      {activeTab === 'tresorerie' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500">Total Cotisations &amp; Appels Encaissés</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {(tresorerie.totalCollecte / 1000000).toFixed(2)} M DH
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Tranches 1 et 2 encaissées</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500">Dépenses &amp; Situations Payées (BTP/BET)</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {(tresorerie.totalDepenses / 1000000).toFixed(2)} M DH
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Gros œuvre et acomptes finitions</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500">Solde Réel Disponible en Banque</div>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                {(tresorerie.soldeActuelBanque / 1000000).toFixed(2)} M DH
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Compte bloqué Attijariwafa</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500">Retards &amp; Relances Adhérents</div>
              <div className="text-xl font-bold font-mono text-rose-600 mt-1 tabular-nums">
                {(tresorerie.totalImpayesRelances / 1000000).toFixed(2)} M DH
              </div>
              <div className="text-[11px] text-rose-600/80 mt-1">4 mises en demeure envoyées</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Grand Livre des Mouvements Financiers de l'Amicale
                </h3>
                <p className="text-xs text-slate-500">
                  {tresorerie.banquePartenaire} &middot; RIB : {tresorerie.ribAmicale}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenBureauDocModal('Trésorier')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scanner Chèque / Avis d'Opération</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTrxModal(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouvelle Écriture</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Libellé de l'Opération</th>
                    <th className="px-4 py-3 font-semibold">Catégorie</th>
                    <th className="px-4 py-3 font-semibold">Référence Pièce</th>
                    <th className="px-4 py-3 font-semibold text-right">Montant (DH)</th>
                    <th className="px-4 py-3 font-semibold text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tresorerie.transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-slate-600">{t.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{t.libelle}</td>
                      <td className="px-4 py-3 text-slate-600">{t.categorie}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{t.referencePiece}</td>
                      <td
                        className={`px-4 py-3 font-mono font-bold text-right tabular-nums ${
                          t.type === 'Entrée' ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {t.type === 'Entrée' ? '+' : '-'}
                        {t.montant.toLocaleString('fr-FR')} DH
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7 : DEMANDES DE RÉSERVATION & OUVERTURE AUTOMATIQUE DE DOSSIER
          ===================================================================== */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Dossiers d'Adhésion &amp; Demandes de Réservation Soumises
              </h3>
              <p className="text-xs text-slate-500">
                Validez une réservation pour ouvrir automatiquement le Dossier Acquéreur complet (CIN, Contrat de réservation, Contrat d'achat, Correspondances).
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{reservations.length} dossiers</span>
          </div>

          <div className="space-y-3">
            {reservations.map((res) => (
              <div
                key={res.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {res.id} &middot; Lot {res.lotId}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        res.statut === 'Validée'
                          ? 'bg-emerald-100 text-emerald-800'
                          : res.statut === 'En attente de validation'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {res.statut}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 font-medium">
                    Acquéreur : {res.nomClient} &middot; CIN : <strong>{res.cin}</strong> &middot;
                    Tél : {res.telephone}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Acompte initial déposé :{' '}
                    <strong>{res.apportInitial.toLocaleString('fr-FR')} DH</strong> &middot; Reçu
                    le {res.dateDemande}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {res.statut === 'En attente de validation' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onApproveReservation(res.id);
                          showToast(
                            `Réservation validée et dossier d'achat ouvert pour ${res.nomClient} (Lot ${res.lotId}) !`
                          );
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Valider &amp; Ouvrir Dossier Achat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectReservation(res.id)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-rose-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rejeter</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('dossiers_adherents')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Voir Dossier Acquéreur</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 8 : TÂCHES DU BUREAU
          ===================================================================== */}
      {activeTab === 'taches' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Plan d'Action &amp; Tâches Opérationnelles du Bureau
              </h3>
              <p className="text-xs text-slate-500">
                Répartition des missions entre Président, Trésorière, Secrétaire Général et Juriste
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{taches.length} tâches</span>
          </div>

          <div className="space-y-2.5">
            {taches.map((t) => (
              <div
                key={t.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{t.titre}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        t.priorite === 'Haute'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {t.priorite}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Assigné à : <strong>{t.responsable}</strong> &middot; Catégorie : {t.categorie}{' '}
                    &middot; Échéance : {t.echeance}
                  </div>
                </div>

                <span
                  className={`text-[11px] px-2.5 py-1 rounded-md font-semibold shrink-0 ${
                    t.statut === 'Validé'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {t.statut}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL : CAPTURE / UPLOAD / SAISIE DIRECTE DE DOCUMENT
          ===================================================================== */}
      <DocumentCaptureModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        context={docModalContext}
        initialRole={docModalInitialRole}
        initialAdherentCategory={docModalInitialAdherentCat}
        targetAdherent={selectedAdherent}
        adherentsList={adherentsDossiers}
        onSaveBureauDoc={(newDoc) => {
          onAddBureauDocument(newDoc);
          showToast(
            `Document « ${newDoc.titre} » ajouté par ${newDoc.membreRole} (${newDoc.modeAjout}) !`
          );
        }}
        onSaveAdherentDoc={(adherentId, newDoc) => {
          onAddDocumentToAdherent(adherentId, newDoc);
          showToast(
            `Pièce « ${newDoc.categorie} : ${newDoc.titre} » ajoutée au dossier acquéreur (${newDoc.modeAjout}) !`
          );
        }}
      />

      {/* =====================================================================
          MODAL : OUVRIR UN NOUVEAU DOSSIER ADHÉRENT ACQUÉREUR (CONTRAT D'ACHAT)
          ===================================================================== */}
      {showNewDossierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Ouverture de Compte &amp; Contrat d'Achat
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Ouvrir un Dossier pour un Nouvel Adhérent Acquéreur
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDossierModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewDossier} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nom complet de l'acquéreur
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: M. Youssef Berrada"
                    value={newDossierNom}
                    onChange={(e) => setNewDossierNom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° CIN</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BK551290"
                    value={newDossierCin}
                    onChange={(e) => setNewDossierCin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    required
                    placeholder="+212 6 61 00 00 00"
                    value={newDossierTel}
                    onChange={(e) => setNewDossierTel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={newDossierEmail}
                    onChange={(e) => setNewDossierEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lot Acheté (162 Appartements / 9 Magasins)
                  </label>
                  <select
                    value={newDossierLotId}
                    onChange={(e) => setNewDossierLotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                  >
                    {lots.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.id} ({l.bloc} · {l.typology} · {l.surfaceTotale}m² ·{' '}
                        {l.prixTotal.toLocaleString('fr-FR')} DH)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville de résidence</label>
                  <input
                    type="text"
                    value={newDossierVille}
                    onChange={(e) => setNewDossierVille(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notaire / Référence Contrat d'Achat Signé
                </label>
                <input
                  type="text"
                  value={newDossierNotaire}
                  onChange={(e) => setNewDossierNotaire(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                L'ouverture du dossier initialise automatiquement les 5 compartiments réglementaires :{' '}
                <strong>
                  CIN, Contrat de réservation, Contrat d'achat, Correspondances et Autres
                </strong>
                .
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewDossierModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Créer le Dossier &amp; Valider le Contrat d'Achat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL : APERÇU DE DOCUMENT OFFICIEL
          ===================================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  {previewDoc.sousTitre}
                </span>
                <h4 className="text-base font-bold text-slate-900">{previewDoc.titre}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewDoc.dataUrl &&
            (previewDoc.dataUrl.startsWith('data:image') ||
              previewDoc.dataUrl.endsWith('.png') ||
              previewDoc.dataUrl.endsWith('.jpg')) ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 p-2">
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.titre}
                  className="w-full max-h-[460px] object-contain mx-auto rounded"
                />
              </div>
            ) : null}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {previewDoc.contenu ||
                `ACTE & DOCUMENT OFFICIEL CERTIFIÉ — AMICALE EBLA TWO MANSOURIA\nRéférence Fichier : ${previewDoc.fichierRef}\n\nCe document fait partie intégrante des archives certifiées de l'Amicale Résidence Ebla Two (162 appartements A–F & 9 magasins commerciaux).`}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => triggerRealFileDownload(previewDoc)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Télécharger ({previewDoc.fichierRef})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Modals: Add Transaction, Broadcast Alert, Add Meeting */}
      {showAddTrxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">Enregistrer une Écriture</h4>
              <button
                type="button"
                onClick={() => setShowAddTrxModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrx} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Type de flux
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrxType('Entrée')}
                    className={`p-2 rounded-lg text-xs font-semibold border ${
                      trxType === 'Entrée'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    + Entrée (Cotisation/Apport)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrxType('Sortie')}
                    className={`p-2 rounded-lg text-xs font-semibold border ${
                      trxType === 'Sortie'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    - Sortie (Dépense BTP/BET)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Libellé</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Facture menuiserie aluminium Immeuble B"
                  value={trxLibelle}
                  onChange={(e) => setTrxLibelle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Montant en Dirhams (MAD)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 150000"
                  value={trxMontant}
                  onChange={(e) => setTrxMontant(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catégorie comptable
                </label>
                <select
                  value={trxCat}
                  onChange={(e) => setTrxCat(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="Cotisation Adhérent">Cotisation Adhérent</option>
                  <option value="Entreprise BTP">Entreprise BTP</option>
                  <option value="Bureau Contrôle/BET">Bureau Contrôle/BET</option>
                  <option value="Notaire & Foncier">Notaire &amp; Foncier</option>
                  <option value="Frais Administratifs">Frais Administratifs</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTrxModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">Diffuser une Alerte Push</h4>
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Titre de l'alerte
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Point d'avancement des finitions Immeuble C"
                  value={alertTitre}
                  onChange={(e) => setAlertTitre(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Catégorie</label>
                <select
                  value={alertCat}
                  onChange={(e) => setAlertCat(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="Chantier">Chantier &amp; Travaux</option>
                  <option value="Paiement">Paiement &amp; Appels de fonds</option>
                  <option value="Réunion">Réunions &amp; AG</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Détails de la communication à tous les adhérents..."
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
                >
                  Envoyer l'Alerte Push
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddReunionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">Convoquer une Réunion</h4>
              <button
                type="button"
                onClick={() => setShowAddReunionModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReunion} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Titre de la réunion
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Comité Technique de Chantier n°19"
                  value={reunionTitre}
                  onChange={(e) => setReunionTitre(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={reunionDate}
                  onChange={(e) => setReunionDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ordre du jour (1 point par ligne)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="1. Choix du carrelage des paliers&#10;2. Validation situation entreprise BTP"
                  value={reunionOrdre}
                  onChange={(e) => setReunionOrdre(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddReunionModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  Convoquer &amp; Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
