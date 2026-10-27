import React, { useState, useRef, useEffect } from 'react';
import {
  ModeAjoutDocument,
  MembreBureauRole,
  CategorieDocBureau,
  AdherentDocCategory,
  AdherentProfile,
} from '../types';
import {
  Upload,
  Camera,
  FileEdit,
  X,
  CheckCircle2,
  RefreshCw,
  FileText,
  Sparkles,
} from 'lucide-react';

export const CATEGORIES_PAR_ROLE: Record<MembreBureauRole, CategorieDocBureau[]> = {
  'Secrétaire Général': [
    'PV',
    'Documents du projet',
    'Documents des adhérents',
    'Autres',
  ],
  Trésorier: [
    "Avis d'opérations",
    'Chèques émis ou reçus',
    'Documents de comptabilité',
    'Autres',
  ],
  Président: [
    'Correspondances',
    'Documents administratifs',
    'Convocations',
    'Autres',
  ],
};

export const AUTEUR_PAR_ROLE: Record<MembreBureauRole, string> = {
  'Secrétaire Général': 'M. Adil Chraibi (Secrétaire Général)',
  Trésorier: 'Mme. Nadia Bennis (Trésorière)',
  Président: 'Dr. Mohammed Tazi (Président)',
};

export const CATEGORIES_DOSSIER_ADHERENT: AdherentDocCategory[] = [
  'CIN',
  'Contrat de réservation',
  "Contrat d'achat",
  'Correspondances',
  'Autres',
];

interface DocumentCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: 'bureau' | 'adherent';
  initialRole?: MembreBureauRole;
  initialAdherentCategory?: AdherentDocCategory;
  targetAdherent?: AdherentProfile;
  adherentsList?: AdherentProfile[];
  onSaveBureauDoc?: (doc: {
    titre: string;
    membreRole: MembreBureauRole;
    categorie: CategorieDocBureau;
    modeAjout: ModeAjoutDocument;
    auteur: string;
    taille: string;
    fichierRef: string;
    referencePiece?: string;
    montant?: number;
    adherentCibleId?: string;
    contenuTexte?: string;
    dataUrl?: string;
  }) => void;
  onSaveAdherentDoc?: (
    adherentId: string,
    doc: {
      titre: string;
      categorie: AdherentDocCategory;
      taille: string;
      fichierRef: string;
      modeAjout: ModeAjoutDocument;
      contenuTexte?: string;
      dataUrl?: string;
      statutVerification: 'Signé & Certifié' | 'Vérifié' | 'En attente';
    }
  ) => void;
}

export const DocumentCaptureModal: React.FC<DocumentCaptureModalProps> = ({
  isOpen,
  onClose,
  context,
  initialRole = 'Secrétaire Général',
  initialAdherentCategory = "Contrat d'achat",
  targetAdherent,
  adherentsList = [],
  onSaveBureauDoc,
  onSaveAdherentDoc,
}) => {
  const [modeAjout, setModeAjout] = useState<ModeAjoutDocument>('Téléchargement');
  const [membreRole, setMembreRole] = useState<MembreBureauRole>(initialRole);
  const [categorieBureau, setCategorieBureau] = useState<CategorieDocBureau>(
    CATEGORIES_PAR_ROLE[initialRole][0]
  );
  const [categorieAdherent, setCategorieAdherent] = useState<AdherentDocCategory>(
    initialAdherentCategory
  );
  const [selectedAdherentId, setSelectedAdherentId] = useState<string>(
    targetAdherent?.id || adherentsList[0]?.id || ''
  );

  const [titre, setTitre] = useState('');
  const [referencePiece, setReferencePiece] = useState('');
  const [montant, setMontant] = useState('');
  const [contenuTexte, setContenuTexte] = useState('');
  const [fichierRef, setFichierRef] = useState('');
  const [taille, setTaille] = useState('450 Ko');
  const [dataUrl, setDataUrl] = useState<string>('');

  // Camera live stream state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setMembreRole(initialRole);
    setCategorieBureau(CATEGORIES_PAR_ROLE[initialRole][0]);
  }, [initialRole]);

  useEffect(() => {
    setCategorieAdherent(initialAdherentCategory);
  }, [initialAdherentCategory]);

  useEffect(() => {
    if (targetAdherent) {
      setSelectedAdherentId(targetAdherent.id);
    }
  }, [targetAdherent]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "La caméra directe n'est pas accessible dans cet aperçu. Utilisez le bouton « Prendre / Choisir une photo » ci-dessous."
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (_err) {
      setCameraError(
        "Accès caméra refusé ou indisponible. Vous pouvez importer directement un cliché avec le bouton ci-dessous."
      );
      setIsCameraActive(false);
    }
  };

  const capturePhotoFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const capturedUrl = canvas.toDataURL('image/jpeg', 0.92);
      setDataUrl(capturedUrl);
      setFichierRef(`SCAN_CAM_${Date.now().toString().slice(-6)}.jpg`);
      setTaille('1.1 Mo');
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFichierRef(file.name);
    const sizeKb = Math.max(120, Math.round(file.size / 1024));
    setTaille(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} Mo` : `${sizeKb} Ko`);
    if (!titre) {
      setTitre(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const fillTemplateSaisieDirecte = () => {
    if (context === 'bureau') {
      if (membreRole === 'Secrétaire Général') {
        setTitre(`PV de Réunion du Bureau Exécutif - ${new Date().toLocaleDateString('fr-FR')}`);
        setReferencePiece(`PV-SG-${Date.now().toString().slice(-4)}`);
        setContenuTexte(
          `PROCÈS-VERBAL OFFICIEL — AMICALE RÉSIDENCE EBLA TWO (MANSOURIA)\nDate : ${new Date().toLocaleDateString('fr-FR')}\nRédigé par : M. Adil Chraibi (Secrétaire Général)\n\n1. Avancement des travaux sur les 6 Immeubles (A à F - 162 appartements et 9 magasins).\n2. Vérification des dossiers d'adhésion et contrats d'achat signés.\n3. Décisions adoptées à l'unanimité par les membres du Bureau Exécutif.`
        );
      } else if (membreRole === 'Trésorier') {
        setTitre(`Avis d'Opération / Règlement Certifié - ${new Date().toLocaleDateString('fr-FR')}`);
        setReferencePiece(`OP-TR-${Date.now().toString().slice(-4)}`);
        setContenuTexte(
          `AVIS D'OPÉRATION FINANCIÈRE — TRÉSORERIE AMICALE EBLA TWO\nBanque : Attijariwafa Bank Mohammedia\nCertifié par : Mme. Nadia Bennis (Trésorière)\n\nDétail de l'opération comptable enregistrée et rapprochée sur le compte de l'Amicale.`
        );
      } else {
        setTitre(`Convocation / Correspondance de la Présidence - ${new Date().toLocaleDateString('fr-FR')}`);
        setReferencePiece(`PR-CORR-${Date.now().toString().slice(-4)}`);
        setContenuTexte(
          `DIRECTION DE L'AMICALE RÉSIDENTIELLE EBLA TWO — MANSOURIA\nSigné par : Dr. Mohammed Tazi (Président du Bureau Exécutif)\n\nObjet : Communication officielle aux adhérents et partenaires institutionnels.`
        );
      }
    } else {
      setTitre(`${categorieAdherent} - Dossier Acquéreur Certifié`);
      setContenuTexte(
        `ACTE OFFICIEL — DOSSIER ADHÉRENT ACQUÉREUR EBLA TWO\nCatégorie : ${categorieAdherent}\nDate : ${new Date().toLocaleDateString('fr-FR')}\n\nPièce officielle vérifiée et versée au dossier individuel de l'acquéreur.`
      );
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;

    const computedFileRef =
      fichierRef ||
      `${titre
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .slice(0, 28)}.pdf`;

    if (context === 'bureau' && onSaveBureauDoc) {
      onSaveBureauDoc({
        titre: titre.trim(),
        membreRole,
        categorie: categorieBureau,
        modeAjout,
        auteur: AUTEUR_PAR_ROLE[membreRole],
        taille,
        fichierRef: computedFileRef,
        referencePiece: referencePiece.trim() || `REF-${Date.now().toString().slice(-4)}`,
        montant: montant ? Number(montant) : undefined,
        adherentCibleId: selectedAdherentId || undefined,
        contenuTexte: contenuTexte.trim() || undefined,
        dataUrl: dataUrl || undefined,
      });
    } else if (context === 'adherent' && onSaveAdherentDoc && selectedAdherentId) {
      onSaveAdherentDoc(selectedAdherentId, {
        titre: titre.trim(),
        categorie: categorieAdherent,
        taille,
        fichierRef: computedFileRef,
        modeAjout,
        contenuTexte: contenuTexte.trim() || undefined,
        dataUrl: dataUrl || undefined,
        statutVerification: 'Signé & Certifié',
      });
    }

    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              {context === 'bureau'
                ? 'GED Officielle du Bureau Exécutif'
                : 'Dossier Acquéreur & Contrat d’Achat Adhérent'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {context === 'bureau'
                ? 'Ajouter un Document (Téléchargement, Caméra ou Saisie Directe)'
                : 'Ajouter une Pièce au Dossier de l’Adhérent'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* 1. Choix du Mode d'Ajout : Téléchargement | Caméra | Saisie directe */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              1. Mode d'acquisition du document
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setModeAjout('Téléchargement');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  modeAjout === 'Téléchargement'
                    ? 'bg-amber-50 border-amber-500 text-slate-900 ring-1 ring-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span>Téléchargement</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Importer PDF, PNG, JPG, Word, Excel
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModeAjout('Caméra');
                  startCamera();
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  modeAjout === 'Caméra'
                    ? 'bg-amber-50 border-amber-500 text-slate-900 ring-1 ring-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Caméra / Scan</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Photographier PV, Chèque, CIN, Contrat
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setModeAjout('Saisie directe');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  modeAjout === 'Saisie directe'
                    ? 'bg-amber-50 border-amber-500 text-slate-900 ring-1 ring-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <FileEdit className="w-4 h-4 text-sky-600" />
                  <span>Saisie directe</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Rédiger PV, Convocation, Avis ou Courrier
                </span>
              </button>
            </div>
          </div>

          {/* 2. Rôle du Membre du Bureau ou Sélection de l'Adhérent & Catégorie */}
          {context === 'bureau' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Membre du Bureau Exécutif
                </label>
                <select
                  value={membreRole}
                  onChange={(e) => {
                    const newRole = e.target.value as MembreBureauRole;
                    setMembreRole(newRole);
                    setCategorieBureau(CATEGORIES_PAR_ROLE[newRole][0]);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                >
                  <option value="Secrétaire Général">
                    Secrétaire Général (PV, Projet, Adhérents...)
                  </option>
                  <option value="Trésorier">
                    Trésorier (Avis d'opérations, Chèques, Comptabilité...)
                  </option>
                  <option value="Président">
                    Président (Correspondances, Administratif, Convocations...)
                  </option>
                </select>
                <div className="text-[10px] text-slate-500 mt-1">
                  Signataire : <strong>{AUTEUR_PAR_ROLE[membreRole]}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catégorie Documentaire ({membreRole})
                </label>
                <select
                  value={categorieBureau}
                  onChange={(e) =>
                    setCategorieBureau(e.target.value as CategorieDocBureau)
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                >
                  {CATEGORIES_PAR_ROLE[membreRole].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dossier Adhérent Acquéreur
                </label>
                <select
                  value={selectedAdherentId}
                  onChange={(e) => setSelectedAdherentId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                >
                  {adherentsList.map((adh) => (
                    <option key={adh.id} value={adh.id}>
                      {adh.nomComplet} · Lot {adh.lotAttribueId} (CIN: {adh.cin})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pièce du Dossier d'Achat
                </label>
                <select
                  value={categorieAdherent}
                  onChange={(e) =>
                    setCategorieAdherent(e.target.value as AdherentDocCategory)
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                >
                  {CATEGORIES_DOSSIER_ADHERENT.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 3. Zone spécifique selon le Mode d'Ajout */}
          {modeAjout === 'Téléchargement' && (
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2">
              <Upload className="w-7 h-7 text-amber-600 mx-auto" />
              <div className="text-xs font-bold text-slate-800">
                Sélectionnez un fichier depuis votre appareil (PDF, Image PNG/JPG, Word, Excel)
              </div>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
              />
              {fichierRef && (
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Fichier prêt : {fichierRef} ({taille})
                  </span>
                </div>
              )}
            </div>
          )}

          {modeAjout === 'Caméra' && (
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span>Numérisation par Caméra (PV, Chèque, CIN, Contrat signé)</span>
                </span>
                {!isCameraActive && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Activer la caméra</span>
                  </button>
                )}
              </div>

              {isCameraActive ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden bg-black h-56 border border-slate-700">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={capturePhotoFromVideo}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturer la Photo du Document</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {cameraError && (
                    <p className="text-[11px] text-amber-300">{cameraError}</p>
                  )}
                  <label className="block">
                    <span className="text-[11px] text-slate-300 block mb-1">
                      Ou prendre / choisir directement une photo depuis l'appareil :
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                  </label>
                </div>
              )}

              {dataUrl && dataUrl.startsWith('data:image') && (
                <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
                  <img
                    src={dataUrl}
                    alt="Aperçu capture"
                    className="w-20 h-14 object-cover rounded border border-emerald-400"
                  />
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    Cliché capturé avec succès ({fichierRef})
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Informations du Document & Saisie Directe */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800">
                Intitulé / Objet du Document
              </label>
              {modeAjout === 'Saisie directe' && (
                <button
                  type="button"
                  onClick={fillTemplateSaisieDirecte}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pré-remplir modèle officiel</span>
                </button>
              )}
            </div>

            <input
              type="text"
              required
              placeholder={
                context === 'bureau'
                  ? 'Ex: PV Réunion Chantier, Chèque Certifié N°882315, Convocation AG...'
                  : 'Ex: Contrat d’achat définitif signé, CIN légalisée, Courrier...'
              }
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {context === 'bureau' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    N° de Référence / N° Chèque ou Pièce
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CHQ-882401, PV-2026-11, CONV-05..."
                    value={referencePiece}
                    onChange={(e) => setReferencePiece(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                {membreRole === 'Trésorier' && (
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Montant de l'opération / chèque (MAD)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 247000"
                      value={montant}
                      onChange={(e) => setMontant(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {modeAjout === 'Saisie directe'
                  ? 'Contenu intégral du document (Saisie directe officielle)'
                  : 'Notes / Synthèse du contenu du document'}
              </label>
              <textarea
                rows={modeAjout === 'Saisie directe' ? 6 : 3}
                required={modeAjout === 'Saisie directe'}
                placeholder="Saisissez ici le texte intégral du procès-verbal, de la correspondance, de la convocation, de l'avis d'opération ou des clauses du contrat..."
                value={contenuTexte}
                onChange={(e) => setContenuTexte(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Enregistrer et Certifier le Document</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
