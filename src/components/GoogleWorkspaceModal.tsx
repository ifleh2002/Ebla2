import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { PropertyLot, VisiteRdv } from '../types';
import {
  googleSignIn,
  logout,
  getAccessToken,
  listGoogleDriveFiles,
  uploadAssetToGoogleDrive,
  deleteGoogleDriveFile,
  exportLotsToNewGoogleSheet,
  overwriteExistingGoogleSheet,
  importLotsFromGoogleSheet,
  listGoogleCalendarEvents,
  createGoogleCalendarVisitEvent,
  deleteGoogleCalendarEvent,
  saveBatchLotsToFirestore,
  createSiteVisitInFirestore,
  DriveFileItem,
  CalendarEventItem,
} from '../services/firebaseWorkspaceService';
import {
  X,
  HardDrive,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  Database,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Upload,
  RefreshCw,
  Plus,
  Search,
  LogOut,
  Download,
} from 'lucide-react';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  hasOAuthToken: boolean;
  onAuthChange: (user: User | null, token: string | null) => void;
  lots: PropertyLot[];
  onUpdateLots: (newLots: PropertyLot[]) => void;
  onAddVisit: (visit: VisiteRdv) => void;
}

interface PendingConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive: boolean;
  onConfirm: () => Promise<void>;
}

const OFFICIAL_PNG_ASSETS_FOR_DRIVE = [
  {
    name: 'Ebla_Two_Plans_Autorises_Planche_1_R+3_Facades.png',
    label: 'Plans Autorisés « Ne Varietur » · Planche 1/2 (Étage Courant R+3 & Façades)',
    url: '/assets/aistudio/plans_autorise_s__2_-1_cd342e2d.png',
    mimeType: 'image/png',
  },
  {
    name: 'Ebla_Two_Plans_Autorises_Planche_2_SousSol_RDC.png',
    label: 'Plans Autorisés « Ne Varietur » · Planche 2/2 (Sous-Sol 230 Parkings & RDC)',
    url: '/assets/aistudio/plans_autorise_s__2_-2_b3f525bf.png',
    mimeType: 'image/png',
  },
  {
    name: 'Ebla_Two_Plan_Cadastral_TF_36089_25.png',
    label: 'Plan Cadastral Officiel ANCFCC (Jawharat Al Bahr 16 · 1ha 18a 41ca)',
    url: '/assets/aistudio/PLAN_CADASTRAL_EBLA_ONE-1_4efc9c99.png',
    mimeType: 'image/png',
  },
  {
    name: 'Tableau_contenance_162_appartements_Synthese.csv',
    label: 'Tableau de Contenance Officiel · Synthèse 162 Appartements (6 Immeubles A–F) & 9 Magasins',
    url: '/assets/aistudio/Tableau_contenance_162_appartements.xlsx_-_Synth_se_8e0f18a0.csv',
    mimeType: 'text/csv',
  },
];

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  hasOAuthToken,
  onAuthChange,
  lots,
  onUpdateLots,
  onAddVisit,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'drive' | 'calendar' | 'firestore'>('sheets');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Sheets state
  const [sheetTitleInput, setSheetTitleInput] = useState(
    'Résidence Ebla Two - Inventaire 162 Appartements R+3 (Immeubles A-F) & 9 Magasins'
  );
  const [targetSpreadsheetId, setTargetSpreadsheetId] = useState('');
  const [lastCreatedSheet, setLastCreatedSheet] = useState<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    title: string;
  } | null>(null);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [visitNom, setVisitNom] = useState(firebaseUser?.displayName || '');
  const [visitTel, setVisitTel] = useState('06 61 00 00 00');
  const [visitDate, setVisitDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [visitCreneau, setVisitCreneau] = useState('10:30');
  const [visitLotId, setVisitLotId] = useState('B-204');
  const [visitType, setVisitType] = useState<'Sur place (Chantier Mansouria)' | 'Visioconférence WhatsApp 3D'>(
    'Sur place (Chantier Mansouria)'
  );

  useEffect(() => {
    if (firebaseUser?.displayName && !visitNom) {
      setVisitNom(firebaseUser.displayName);
    }
  }, [firebaseUser, visitNom]);

  useEffect(() => {
    if (!isOpen || !hasOAuthToken) return;
    if (activeTab === 'drive') {
      loadDriveFiles();
    } else if (activeTab === 'calendar') {
      loadCalendarEvents();
    }
  }, [isOpen, activeTab, hasOAuthToken]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setStatusBanner(null);
    try {
      const result = await googleSignIn();
      onAuthChange(result.user, result.accessToken);
      setStatusBanner({
        type: 'success',
        text: `Connecté avec succès en tant que ${result.user.displayName || result.user.email} (Google Drive, Sheets, Calendar & Firestore activés).`,
      });
    } catch (error: any) {
      setStatusBanner({
        type: 'error',
        text: error?.message || 'Échec de la connexion Google.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    onAuthChange(null, null);
    setDriveFiles([]);
    setCalendarEvents([]);
    setStatusBanner({
      type: 'success',
      text: 'Session Google Workspace déconnectée.',
    });
  };

  const ensureAuthenticated = async (): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token) {
      setStatusBanner({
        type: 'error',
        text: 'Veuillez vous connecter avec Google pour autoriser l’accès à Google Workspace.',
      });
      return false;
    }
    return true;
  };

  // --- SHEETS HANDLERS ---
  const handleCreateNewSheet = async () => {
    if (!(await ensureAuthenticated())) return;
    setIsBusy(true);
    setStatusBanner(null);
    try {
      const res = await exportLotsToNewGoogleSheet(lots, sheetTitleInput);
      setLastCreatedSheet(res);
      setTargetSpreadsheetId(res.spreadsheetId);
      setStatusBanner({
        type: 'success',
        text: `Google Sheet "${res.title}" créé avec succès (${lots.length} lots exportés) !`,
      });
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err?.message || 'Erreur lors de la création du Google Sheet.' });
    } finally {
      setIsBusy(false);
    }
  };

  const requestOverwriteExistingSheet = () => {
    const cleanId = targetSpreadsheetId.trim();
    if (!cleanId) {
      setStatusBanner({ type: 'error', text: 'Veuillez saisir l’identifiant (Spreadsheet ID) du Google Sheet.' });
      return;
    }
    setPendingConfirm({
      title: 'Confirmer la mise à jour du Google Sheet',
      description: `Vous êtes sur le point d'écraser et de mettre à jour les ${lots.length} lignes (153 appartements R+3 et 9 magasins) dans le fichier Google Sheets ID "${cleanId}". Voulez-vous continuer ?`,
      confirmLabel: 'Confirmer la mise à jour',
      isDestructive: false,
      onConfirm: async () => {
        setIsBusy(true);
        try {
          const result = await overwriteExistingGoogleSheet(cleanId, lots);
          setStatusBanner({
            type: 'success',
            text: `${result.updatedRows} lots synchronisés dans l'onglet "${result.sheetTitle}" du Google Sheet.`,
          });
        } catch (err: any) {
          setStatusBanner({ type: 'error', text: err?.message || 'Erreur mise à jour Google Sheet.' });
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const requestImportFromSheet = () => {
    const cleanId = targetSpreadsheetId.trim();
    if (!cleanId) {
      setStatusBanner({ type: 'error', text: 'Veuillez saisir l’identifiant (Spreadsheet ID) du Google Sheet.' });
      return;
    }
    setPendingConfirm({
      title: 'Confirmer l’importation depuis Google Sheets vers le site & Firestore',
      description: `Cette action va lire les données du Google Sheet "${cleanId}" et mettre à jour les prix, surfaces et statuts des lots sur le site ainsi que dans la base Firebase Firestore. Confirmez-vous cette modification ?`,
      confirmLabel: 'Importer et appliquer',
      isDestructive: false,
      onConfirm: async () => {
        setIsBusy(true);
        try {
          const { updatedLots, sheetTitle, importedCount } = await importLotsFromGoogleSheet(cleanId, lots);
          onUpdateLots(updatedLots);
          await saveBatchLotsToFirestore(updatedLots);
          setStatusBanner({
            type: 'success',
            text: `${importedCount} lots importés depuis l'onglet "${sheetTitle}" et sauvegardés dans Firestore !`,
          });
        } catch (err: any) {
          setStatusBanner({ type: 'error', text: err?.message || 'Erreur lors de l’import Google Sheets.' });
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  // --- DRIVE HANDLERS ---
  const loadDriveFiles = async (q = driveSearch) => {
    if (!(await ensureAuthenticated())) return;
    setIsLoadingDrive(true);
    try {
      const files = await listGoogleDriveFiles(q);
      setDriveFiles(files);
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err?.message || 'Impossible de charger les fichiers Google Drive.' });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleUploadOfficialPlanToDrive = async (item: typeof OFFICIAL_PNG_ASSETS_FOR_DRIVE[0]) => {
    if (!(await ensureAuthenticated())) return;
    setIsBusy(true);
    setStatusBanner(null);
    try {
      const uploaded = await uploadAssetToGoogleDrive(item.name, item.url, item.mimeType);
      setStatusBanner({
        type: 'success',
        text: `Fichier "${uploaded.name}" sauvegardé dans votre Google Drive !`,
      });
      await loadDriveFiles();
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err?.message || 'Échec de l’envoi vers Google Drive.' });
    } finally {
      setIsBusy(false);
    }
  };

  const requestDeleteDriveFile = (file: DriveFileItem) => {
    setPendingConfirm({
      title: `Supprimer "${file.name}" de Google Drive ?`,
      description: `Attention : vous êtes sur le point de supprimer définitivement le fichier "${file.name}" (ID: ${file.id}) de votre Google Drive. Cette opération est irréversible.`,
      confirmLabel: 'Supprimer définitivement',
      isDestructive: true,
      onConfirm: async () => {
        setIsBusy(true);
        try {
          await deleteGoogleDriveFile(file.id);
          setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
          setStatusBanner({
            type: 'success',
            text: `Le fichier "${file.name}" a été supprimé de Google Drive.`,
          });
        } catch (err: any) {
          setStatusBanner({ type: 'error', text: err?.message || 'Erreur lors de la suppression.' });
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  // --- CALENDAR HANDLERS ---
  const loadCalendarEvents = async () => {
    if (!(await ensureAuthenticated())) return;
    setIsLoadingCalendar(true);
    try {
      const items = await listGoogleCalendarEvents();
      setCalendarEvents(items);
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err?.message || 'Impossible de charger Google Calendar.' });
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleCreateCalendarVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await ensureAuthenticated())) return;
    setIsBusy(true);
    setStatusBanner(null);
    try {
      const createdEvent = await createGoogleCalendarVisitEvent({
        nomVisiteur: visitNom || 'Visiteur Ebla Two',
        telephone: visitTel,
        date: visitDate,
        creneau: visitCreneau,
        typeVisite: visitType,
        lotId: visitLotId,
      });

      const newVisit: VisiteRdv = {
        id: `VIS-${Date.now()}`,
        lotInteresseId: visitLotId,
        nomVisiteur: visitNom || 'Visiteur Ebla Two',
        telephone: visitTel,
        email: firebaseUser?.email || 'visiteur@eblatwo.ma',
        date: visitDate,
        creneau: visitCreneau,
        typeVisite:
          visitType === 'Visioconférence WhatsApp 3D'
            ? 'Visite virtuelle 3D guidée'
            : 'Sur site Mansouria',
        statut: 'Confirmée',
        conseillerAssigne: 'Yassine Berrada',
      };

      onAddVisit(newVisit);
      await createSiteVisitInFirestore(newVisit, createdEvent.id);
      await loadCalendarEvents();

      setStatusBanner({
        type: 'success',
        text: `Visite ajoutée à votre Google Calendar et enregistrée dans Firebase Firestore (${visitDate} à ${visitCreneau}) !`,
      });
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err?.message || 'Erreur lors de l’ajout au Google Calendar.' });
    } finally {
      setIsBusy(false);
    }
  };

  const requestDeleteCalendarEvent = (ev: CalendarEventItem) => {
    setPendingConfirm({
      title: `Supprimer l'événement "${ev.summary}" ?`,
      description: `Voulez-vous vraiment supprimer l'événement "${ev.summary}" de votre agenda Google Calendar ?`,
      confirmLabel: 'Supprimer du calendrier',
      isDestructive: true,
      onConfirm: async () => {
        setIsBusy(true);
        try {
          await deleteGoogleCalendarEvent(ev.id);
          setCalendarEvents((prev) => prev.filter((item) => item.id !== ev.id));
          setStatusBanner({
            type: 'success',
            text: `Événement "${ev.summary}" supprimé de Google Calendar.`,
          });
        } catch (err: any) {
          setStatusBanner({ type: 'error', text: err?.message || 'Impossible de supprimer cet événement.' });
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  // --- FIRESTORE SYNC HANDLER ---
  const requestSyncAllLotsToFirestore = () => {
    setPendingConfirm({
      title: 'Synchroniser les 162 lots vers Firebase Firestore ?',
      description: `Cette opération va enregistrer l'état actuel des ${lots.length} lots (153 appartements R+3 et 9 magasins commerciaux) dans la collection Cloud Firestore "/lots". Confirmez-vous la synchronisation ?`,
      confirmLabel: 'Synchroniser vers Firestore',
      isDestructive: false,
      onConfirm: async () => {
        setIsBusy(true);
        try {
          const count = await saveBatchLotsToFirestore(lots);
          setStatusBanner({
            type: 'success',
            text: `${count} lots enregistrés et synchronisés en temps réel dans Firebase Firestore !`,
          });
        } catch (err: any) {
          setStatusBanner({ type: 'error', text: err?.message || 'Erreur écriture Firestore.' });
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Google Workspace &amp; Firebase Cloud · Résidence Ebla Two
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              Synchronisation Google Sheets, Google Drive, Calendar &amp; Firestore
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {firebaseUser && hasOAuthToken ? (
              <div className="flex items-center gap-2.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <div className="text-right">
                  <div className="text-xs font-bold text-white truncate max-w-[160px]">
                    {firebaseUser.displayName || firebaseUser.email}
                  </div>
                  <div className="text-[10px] text-emerald-400">Connecté Google &amp; Firestore</div>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Déconnecter Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Prompt Bar if not signed in with OAuth token */}
        {(!firebaseUser || !hasOAuthToken) && (
          <div className="p-6 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900">
                Authentification Google Workspace &amp; Firebase requise
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                Connectez-vous avec votre compte Google pour exporter ou importer les 153 appartements R+3 sur <strong>Google Sheets</strong>, sauvegarder les plans PNG HD sur <strong>Google Drive</strong>, planifier vos visites dans <strong>Google Calendar</strong> et synchroniser <strong>Cloud Firestore</strong>.
              </p>
            </div>

            {/* Official Sign in with Google Button per workspace-integration skill */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 shadow-xs flex items-center gap-2.5 shrink-0 cursor-pointer transition-all"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper flex items-center gap-2.5">
                <div className="gsi-material-button-icon w-4 h-4">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoggingIn ? 'Connexion en cours...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets (162 Lots)</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'drive'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive (Plans PNG &amp; Fichiers)</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'calendar'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Google Calendar (Visites RDV)</span>
          </button>

          <button
            onClick={() => setActiveTab('firestore')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'firestore'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Firebase Firestore (Temps Réel)</span>
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusBanner && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              statusBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusBanner.text}</span>
            </div>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              {/* Create a new Google Sheet */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  1. Exporter les 153 Appartements R+3 &amp; 9 Magasins vers un nouveau Google Sheet
                </div>
                <p className="text-xs text-slate-600">
                  Crée automatiquement une feuille de calcul Google Sheets structurée dans votre compte avec l’intégralité des 162 lots, superficies, prix au m² et statuts.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <input
                    type="text"
                    value={sheetTitleInput}
                    onChange={(e) => setSheetTitleInput(e.target.value)}
                    placeholder="Titre du Google Sheet..."
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleCreateNewSheet}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer un Google Sheet (162 Lots)</span>
                  </button>
                </div>

                {lastCreatedSheet && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{lastCreatedSheet.title}</span>
                      <span className="text-slate-500 ml-2 font-mono text-[11px]">
                        ID: {lastCreatedSheet.spreadsheetId}
                      </span>
                    </div>
                    <a
                      href={lastCreatedSheet.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ouvrir dans Google Sheets</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Sync or Import with an existing Google Sheet */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Synchroniser ou Importer depuis un Google Sheet existant
                </div>
                <p className="text-xs text-slate-600">
                  Saisissez l’identifiant (Spreadsheet ID) de votre feuille Google Sheets pour importer vos modifications de prix/statuts dans l’application ou mettre à jour la feuille existante.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={targetSpreadsheetId}
                    onChange={(e) => setTargetSpreadsheetId(e.target.value)}
                    placeholder="Collez le Spreadsheet ID (ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)"
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={requestImportFromSheet}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Importer vers le site</span>
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={requestOverwriteExistingSheet}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Écraser le Sheet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-5">
              {/* Quick save official PNG plans to user's Google Drive */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Sauvegarder les Plans Officiels PNG Ultra-HD sur votre Google Drive
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {OFFICIAL_PNG_ASSETS_FOR_DRIVE.map((asset) => (
                    <div
                      key={asset.name}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-3"
                    >
                      <div className="text-xs font-bold text-slate-900 leading-snug">
                        {asset.label}
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleUploadOfficialPlanToDrive(asset)}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Envoyer vers mon Drive</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Browse & search user's Google Drive files */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Fichiers récents dans votre Google Drive
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={driveSearch}
                        onChange={(e) => setDriveSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles(driveSearch)}
                        placeholder="Filtrer par nom..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => loadDriveFiles(driveSearch)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                      <span>Actualiser</span>
                    </button>
                  </div>
                </div>

                {driveFiles.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    {isLoadingDrive
                      ? 'Chargement de vos fichiers Google Drive...'
                      : 'Aucun fichier affiché. Connectez-vous ou cliquez sur Actualiser.'}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{file.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{file.mimeType}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Ouvrir</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => requestDeleteDriveFile(file)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer de Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form to schedule a site visit on Google Calendar */}
              <form
                onSubmit={handleCreateCalendarVisit}
                className="md:col-span-5 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Planifier une Visite dans Google Calendar
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nom complet du visiteur
                  </label>
                  <input
                    type="text"
                    required
                    value={visitNom}
                    onChange={(e) => setVisitNom(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Heure</label>
                    <input
                      type="time"
                      required
                      value={visitCreneau}
                      onChange={(e) => setVisitCreneau(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Lot concerné
                    </label>
                    <input
                      type="text"
                      value={visitLotId}
                      onChange={(e) => setVisitLotId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      required
                      value={visitTel}
                      onChange={(e) => setVisitTel(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Type de visite
                  </label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="Sur place (Chantier Mansouria)">Sur place (Chantier Mansouria)</option>
                    <option value="Visioconférence WhatsApp 3D">Visioconférence WhatsApp 3D</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Ajouter à Google Calendar &amp; Firestore
                </button>
              </form>

              {/* Upcoming Calendar Events List */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Vos prochains événements Google Calendar
                  </h3>
                  <button
                    type="button"
                    onClick={loadCalendarEvents}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
                    <span>Actualiser</span>
                  </button>
                </div>

                {calendarEvents.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    {isLoadingCalendar
                      ? 'Chargement de votre agenda Google Calendar...'
                      : 'Aucun événement à venir trouvé.'}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {calendarEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{ev.summary}</div>
                          <div className="text-[11px] text-slate-500">
                            {ev.start?.dateTime
                              ? new Date(ev.start.dateTime).toLocaleString('fr-FR')
                              : ev.start?.date}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {ev.htmlLink && (
                            <a
                              href={ev.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Agenda</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => requestDeleteCalendarEvent(ev)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer du calendrier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FIREBASE FIRESTORE CLOUD SYNC */}
          {activeTab === 'firestore' && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-orange-700">
                      Base de données Cloud Firebase Firestore (europe-west2)
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      Persistance temps réel des Lots, Réservations &amp; Visites
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    Connecté · Règles Déployées
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Toutes les réservations de lots, demandes de visites sur site et mises à jour de disponibilité sont automatiquement persistées dans votre base <strong>Cloud Firestore</strong> sécurisée (Projet <code>gen-lang-client-0242623543</code>).
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={requestSyncAllLotsToFirestore}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Synchroniser les 162 Lots vers Firestore</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MANDATORY CONFIRMATION DIALOG FOR MUTATING / DESTRUCTIVE OPERATIONS */}
        {pendingConfirm && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    pendingConfirm.isDestructive
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{pendingConfirm.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {pendingConfirm.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPendingConfirm(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const action = pendingConfirm.onConfirm;
                    setPendingConfirm(null);
                    await action();
                  }}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-xl cursor-pointer ${
                    pendingConfirm.isDestructive
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {pendingConfirm.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
