import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  PropertyLot,
  ChantierAvancement,
  TresorerieAmicale,
  ReunionItem,
  TacheBureau,
  ReservationDemande,
  VisiteRdv,
  MessageDiscussion,
  NotificationApp,
  UtilisateurSession,
  TransactionFinanciere,
  BureauDocument,
  AdherentProfile,
  AdherentDocument,
  ImmeubleAvancement,
  CameraSurveillanceItem,
} from './types';
import {
  INITIAL_LOTS,
  INITIAL_CHANTIER,
  INITIAL_TRESORERIE,
  INITIAL_REUNIONS,
  INITIAL_TACHES,
  DEMO_ADHERENT,
  INITIAL_ADHERENTS_DOSSIERS,
  INITIAL_BUREAU_DOCUMENTS,
  INITIAL_VISITES,
  INITIAL_RESERVATIONS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';
import {
  initAuth,
  logout as firebaseLogout,
  subscribeToLotsInventory,
  subscribeToUserReservations,
  subscribeToUserSiteVisits,
  createReservationInFirestore,
  updateReservationStatusInFirestore,
  createSiteVisitInFirestore,
  saveBatchLotsToFirestore,
} from './services/firebaseWorkspaceService';
import { Navigation } from './components/Navigation';
import { InteractiveMasterplan } from './components/InteractiveMasterplan';
import { LotDetailModal } from './components/LotDetailModal';
import { ReservationModal } from './components/ReservationModal';
import { SiteVisitModal } from './components/SiteVisitModal';
import { AdherentSpace } from './components/AdherentSpace';
import { BureauExecutiveDashboard } from './components/BureauExecutiveDashboard';
import { DarijaAIChatbot } from './components/DarijaAIChatbot';
import { NotificationsCenter } from './components/NotificationsCenter';
import { AuthModal } from './components/AuthModal';
import { ExcelManagerModal } from './components/ExcelManagerModal';
import { VitrineLandingPage } from './components/VitrineLandingPage';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { ChantierLiveCameras } from './components/ChantierLiveCameras';
import { Bot, Building2 } from 'lucide-react';

export default function App() {
  // Primary reactive persistent state (162 Appartements + 9 Magasins across Immeubles A-F)
  const [lots, setLots] = useState<PropertyLot[]>(() => {
    const saved = localStorage.getItem('ebla_lots_162_v2');
    return saved ? JSON.parse(saved) : INITIAL_LOTS;
  });

  const [chantier, setChantier] = useState<ChantierAvancement>(() => {
    const saved = localStorage.getItem('ebla_chantier_162_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.immeublesAvancement && parsed.camerasSurveillance) {
          return parsed;
        }
      } catch (_e) {
        // fallback
      }
    }
    return INITIAL_CHANTIER;
  });

  const [bureauDocuments, setBureauDocuments] = useState<BureauDocument[]>(() => {
    const saved = localStorage.getItem('ebla_bureau_docs_v1');
    return saved ? JSON.parse(saved) : INITIAL_BUREAU_DOCUMENTS;
  });

  const [adherentsDossiers, setAdherentsDossiers] = useState<AdherentProfile[]>(() => {
    const saved = localStorage.getItem('ebla_adherents_dossiers_v1');
    return saved ? JSON.parse(saved) : INITIAL_ADHERENTS_DOSSIERS;
  });

  const [activeAdherentId, setActiveAdherentId] = useState<string>(() => {
    return DEMO_ADHERENT.id;
  });

  const [tresorerie, setTresorerie] = useState<TresorerieAmicale>(() => {
    const saved = localStorage.getItem('ebla_tresorerie');
    return saved ? JSON.parse(saved) : INITIAL_TRESORERIE;
  });

  const [reunions, setReunions] = useState<ReunionItem[]>(() => {
    const saved = localStorage.getItem('ebla_reunions');
    return saved ? JSON.parse(saved) : INITIAL_REUNIONS;
  });

  const [taches] = useState<TacheBureau[]>(() => {
    const saved = localStorage.getItem('ebla_taches');
    return saved ? JSON.parse(saved) : INITIAL_TACHES;
  });

  const [reservations, setReservations] = useState<ReservationDemande[]>(() => {
    const saved = localStorage.getItem('ebla_reservations');
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  const [visites, setVisites] = useState<VisiteRdv[]>(() => {
    const saved = localStorage.getItem('ebla_visites');
    return saved ? JSON.parse(saved) : INITIAL_VISITES;
  });

  const [messages, setMessages] = useState<MessageDiscussion[]>(() => {
    const saved = localStorage.getItem('ebla_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [notifications, setNotifications] = useState<NotificationApp[]>(() => {
    const saved = localStorage.getItem('ebla_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Firebase Auth & Google OAuth state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [hasOAuthToken, setHasOAuthToken] = useState(false);

  // Current session
  const [session, setSession] = useState<UtilisateurSession | null>(() => {
    const saved = localStorage.getItem('ebla_session');
    if (saved) return JSON.parse(saved);
    return {
      role: 'adherent',
      nom: 'Mme. Karima El Fassi',
      email: 'adherent@eblatwo.ma',
      titreFonction: 'Adhérente Propriétaire Lot B-204 (F3 Vue Mer)',
      adherentProfileId: 'ADH-2026-088',
    };
  });

  // Navigation tab (defaults to 'vitrine' showcase homepage)
  const [currentTab, setCurrentTab] = useState<'vitrine' | 'lots' | 'chantier' | 'adherent' | 'bureau'>('vitrine');

  // Modals
  const [selectedLot, setSelectedLot] = useState<PropertyLot | null>(null);
  const [reserveLot, setReserveLot] = useState<PropertyLot | null>(null);
  const [visitLot, setVisitLot] = useState<PropertyLot | null>(null);
  const [isSiteVisitModalOpen, setIsSiteVisitModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  // 1. Initialize Firebase Auth listener & Firestore real-time subscriptions
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubAuth = initAuth(
      (user, token) => {
        setFirebaseUser(user);
        setHasOAuthToken(Boolean(token));
        setIsAuthReady(true);
      },
      () => {
        setFirebaseUser(null);
        setHasOAuthToken(false);
        setIsAuthReady(true);
      }
    );
    return () => unsubAuth();
  }, []);

  // Subscribe to public /lots collection in Firestore once Auth initialization is ready
  useEffect(() => {
    if (!isAuthReady) return;
    const unsubLots = subscribeToLotsInventory((overrides) => {
      if (Object.keys(overrides).length === 0) return;
      setLots((prev) =>
        prev.map((l) => {
          const ov = overrides[l.id];
          if (!ov) return l;
          return {
            ...l,
            statut: (ov.statut as PropertyLot['statut']) || l.statut,
            prixAuM2: ov.prixAuM2 ?? l.prixAuM2,
            prixTotal: ov.prixTotal ?? l.prixTotal,
            surfaceTotale: ov.surfaceTotale ?? l.surfaceTotale,
          };
        })
      );
    });
    return () => unsubLots();
  }, [isAuthReady]);

  // Subscribe to authenticated user's reservations & site visits in Firestore
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    const unsubRes = subscribeToUserReservations(firebaseUser, (cloudRes) => {
      if (cloudRes.length > 0) {
        setReservations((prev) => {
          const existingIds = new Set(cloudRes.map((r) => r.id));
          return [...cloudRes, ...prev.filter((p) => !existingIds.has(p.id))];
        });
      }
    });
    const unsubVis = subscribeToUserSiteVisits(firebaseUser, (cloudVis) => {
      if (cloudVis.length > 0) {
        setVisites((prev) => {
          const existingIds = new Set(cloudVis.map((v) => v.id));
          return [...cloudVis, ...prev.filter((p) => !existingIds.has(p.id))];
        });
      }
    });
    return () => {
      unsubRes();
      unsubVis();
    };
  }, [firebaseUser]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ebla_lots_162_v2', JSON.stringify(lots));
  }, [lots]);

  useEffect(() => {
    localStorage.setItem('ebla_chantier_162_v3', JSON.stringify(chantier));
  }, [chantier]);

  useEffect(() => {
    localStorage.setItem('ebla_bureau_docs_v1', JSON.stringify(bureauDocuments));
  }, [bureauDocuments]);

  useEffect(() => {
    localStorage.setItem('ebla_adherents_dossiers_v1', JSON.stringify(adherentsDossiers));
  }, [adherentsDossiers]);

  useEffect(() => {
    localStorage.setItem('ebla_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('ebla_visites', JSON.stringify(visites));
  }, [visites]);

  useEffect(() => {
    localStorage.setItem('ebla_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('ebla_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ebla_tresorerie', JSON.stringify(tresorerie));
  }, [tresorerie]);

  useEffect(() => {
    localStorage.setItem('ebla_reunions', JSON.stringify(reunions));
  }, [reunions]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('ebla_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('ebla_session');
    }
  }, [session]);

  // Handlers
  const handleReservationSuccess = async (newRes: ReservationDemande) => {
    setReservations((prev) => [newRes, ...prev]);

    const targetLot = lots.find((l) => l.id === newRes.lotId);
    setLots((prev) =>
      prev.map((l) =>
        l.id === newRes.lotId
          ? {
              ...l,
              statut: 'Réservé',
              reservedBy: { nom: newRes.nomClient, cin: newRes.cin, date: newRes.dateDemande },
            }
          : l
      )
    );

    if (firebaseUser && targetLot) {
      try {
        await createReservationInFirestore(newRes, targetLot);
      } catch (e) {
        console.error(e);
      }
    }

    const newNotif: NotificationApp = {
      id: `NOTIF-${Date.now()}`,
      titre: `Nouvelle réservation reçue : Lot ${newRes.lotId}`,
      message: `${newRes.nomClient} (CIN: ${newRes.cin}) a déposé un dossier pour le lot ${newRes.lotId}.`,
      date: 'À l instant',
      categorie: 'Commercial',
      urgente: true,
      lue: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleVisitSuccess = async (newVisit: VisiteRdv) => {
    setVisites((prev) => [newVisit, ...prev]);

    if (firebaseUser) {
      try {
        await createSiteVisitInFirestore(newVisit);
      } catch (e) {
        console.error(e);
      }
    }

    const newNotif: NotificationApp = {
      id: `NOTIF-VIS-${Date.now()}`,
      titre: `Visite confirmée : ${newVisit.nomVisiteur}`,
      message: `Rendez-vous fixé pour le ${newVisit.date} à ${newVisit.creneau} (${newVisit.typeVisite}).`,
      date: 'À l instant',
      categorie: 'Commercial',
      urgente: false,
      lue: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleSendMessage = (text: string) => {
    const newMsg: MessageDiscussion = {
      id: `MSG-${Date.now()}`,
      expediteurRole: session?.role === 'bureau' ? 'bureau' : 'adherent',
      expediteurNom: session?.nom || 'Adhérent',
      texte: text,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      lu: true,
    };
    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      const replyMsg: MessageDiscussion = {
        id: `MSG-REP-${Date.now()}`,
        expediteurRole: 'commercial',
        expediteurNom: 'Yassine Berrada (Conseiller Commercial)',
        texte: `Merci pour votre message ! J'en prends bonne note et je reste à votre entière disposition au bureau de vente de Mansouria.`,
        date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        lu: false,
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1200);
  };

  const handleApproveReservation = async (resId: string) => {
    const target = reservations.find((r) => r.id === resId);
    setReservations((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, statut: 'Validée' } : r))
    );
    if (target) {
      // Mark lot as Vendu and open a complete Buyer Dossier (CIN, Contrat de réservation, Contrat d'achat, Correspondances, Autres)
      setLots((prev) =>
        prev.map((l) => (l.id === target.lotId ? { ...l, statut: 'Vendu' } : l))
      );
      const alreadyExists = adherentsDossiers.some(
        (d) => d.cin.toUpperCase() === target.cin.toUpperCase() || d.lotAttribueId === target.lotId
      );
      if (!alreadyExists) {
        const todayStr = new Date().toLocaleDateString('fr-FR');
        const newDossierId = `ADH-2026-${Date.now().toString().slice(-3)}`;
        const targetLot = lots.find((l) => l.id === target.lotId) || lots[0];
        const trancheAmt = Math.round((targetLot?.prixTotal || 900000) * 0.25);
        const autoDossier: AdherentProfile = {
          id: newDossierId,
          nomComplet: target.nomClient,
          cin: target.cin.toUpperCase(),
          email: target.email || 'adherent@eblatwo.ma',
          telephone: target.telephone,
          ville: 'Mansouria / Mohammedia',
          dateAdhesion: todayStr,
          lotAttribueId: target.lotId,
          pourcentageAvancementPersonnel: chantier.globalPourcentage,
          contratAchatSigne: true,
          dateSignatureContratAchat: todayStr,
          notaireInstrumentaire: 'Étude Notariale Me. Amrani (Casablanca / Mohammedia)',
          echeancier: [
            {
              id: `ECH-${newDossierId}-1`,
              numeroTranche: 1,
              libelle: 'Tranche 1 - Réservation & Contrat d’Achat (25%)',
              pourcentage: 25,
              montant: target.apportInitial || trancheAmt,
              dateEcheance: todayStr,
              statut: 'Payé',
              quittanceNumero: `QUIT-${Date.now().toString().slice(-4)}`,
              datePaiement: todayStr,
              modePaiement: 'Virement / Chèque certifié',
            },
            {
              id: `ECH-${newDossierId}-2`,
              numeroTranche: 2,
              libelle: 'Tranche 2 - Achèvement Gros Œuvre (25%)',
              pourcentage: 25,
              montant: trancheAmt,
              dateEcheance: '15/12/2026',
              statut: 'En cours',
            },
            {
              id: `ECH-${newDossierId}-3`,
              numeroTranche: 3,
              libelle: 'Tranche 3 - Finitions & Menuiserie (25%)',
              pourcentage: 25,
              montant: trancheAmt,
              dateEcheance: '15/02/2027',
              statut: 'À venir',
            },
            {
              id: `ECH-${newDossierId}-4`,
              numeroTranche: 4,
              libelle: 'Tranche 4 - Remise des clés & Titre Foncier (25%)',
              pourcentage: 25,
              montant: trancheAmt,
              dateEcheance: '30/03/2027',
              statut: 'À venir',
            },
          ],
          documents: [
            {
              id: `DOC-${newDossierId}-CIN`,
              titre: `CIN Légalisée (${target.cin.toUpperCase()}) - ${target.nomClient}`,
              categorie: 'CIN',
              date: todayStr,
              taille: '940 Ko',
              fichierRef: `CIN_${target.cin.toUpperCase()}.pdf`,
              modeAjout: 'Téléchargement',
              statutVerification: 'Vérifié',
            },
            {
              id: `DOC-${newDossierId}-RES`,
              titre: `Contrat de Réservation Validé · Lot ${target.lotId}`,
              categorie: 'Contrat de réservation',
              date: target.dateDemande,
              taille: '1.9 Mo',
              fichierRef: `CONTRAT_RESERVATION_${target.lotId}.pdf`,
              modeAjout: 'Téléchargement',
              statutVerification: 'Signé & Certifié',
            },
            {
              id: `DOC-${newDossierId}-ACHAT`,
              titre: `Contrat d'Achat Définitif Signé · Lot ${target.lotId}`,
              categorie: "Contrat d'achat",
              date: todayStr,
              taille: '3.2 Mo',
              fichierRef: `CONTRAT_ACHAT_${target.lotId}.pdf`,
              modeAjout: 'Saisie directe',
              statutVerification: 'Signé & Certifié',
            },
            {
              id: `DOC-${newDossierId}-CORR`,
              titre: `Notification d'Ouverture de Compte Adhérent & Affectation Lot ${target.lotId}`,
              categorie: 'Correspondances',
              date: todayStr,
              taille: '430 Ko',
              fichierRef: `CORRESPONDANCE_OUVERTURE_${target.lotId}.pdf`,
              modeAjout: 'Saisie directe',
              statutVerification: 'Signé & Certifié',
            },
            {
              id: `DOC-${newDossierId}-AUT`,
              titre: `Plan Coté Lot ${target.lotId} & Quittance Acompte Initial`,
              categorie: 'Autres',
              date: todayStr,
              taille: '2.4 Mo',
              fichierRef: `PLAN_QUITTANCE_${target.lotId}.pdf`,
              modeAjout: 'Téléchargement',
              statutVerification: 'Vérifié',
            },
          ],
        };
        setAdherentsDossiers((prev) => [autoDossier, ...prev]);
        setActiveAdherentId(newDossierId);
      }
    }
    if (firebaseUser && target) {
      try {
        await updateReservationStatusInFirestore(target, 'Validée');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRejectReservation = async (resId: string) => {
    const target = reservations.find((r) => r.id === resId);
    setReservations((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, statut: 'Refusée' } : r))
    );
    if (firebaseUser && target) {
      try {
        await updateReservationStatusInFirestore(target, 'Refusée');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddTransaction = (trx: Omit<TransactionFinanciere, 'id'>) => {
    const newTrx: TransactionFinanciere = {
      ...trx,
      id: `TRX-${Date.now().toString().slice(-4)}`,
    };
    setTresorerie((prev) => ({
      ...prev,
      transactions: [newTrx, ...prev.transactions],
      soldeActuelBanque:
        trx.type === 'Entrée'
          ? prev.soldeActuelBanque + trx.montant
          : prev.soldeActuelBanque - trx.montant,
      totalCollecte: trx.type === 'Entrée' ? prev.totalCollecte + trx.montant : prev.totalCollecte,
      totalDepenses: trx.type === 'Sortie' ? prev.totalDepenses + trx.montant : prev.totalDepenses,
    }));
  };

  const handleAddReunion = (reunion: Omit<ReunionItem, 'id'>) => {
    const newReu: ReunionItem = {
      ...reunion,
      id: `REU-${Date.now().toString().slice(-4)}`,
    };
    setReunions((prev) => [newReu, ...prev]);
  };

  const handleSendAlert = (titre: string, message: string, categorie: any) => {
    const newAlert: NotificationApp = {
      id: `ALERT-${Date.now()}`,
      titre,
      message,
      date: 'À l instant',
      categorie,
      urgente: true,
      lue: false,
    };
    setNotifications((prev) => [newAlert, ...prev]);
  };

  const handleAddBureauDocument = (doc: Omit<BureauDocument, 'id' | 'date'>) => {
    const newDoc: BureauDocument = {
      ...doc,
      id: `BDOC-${Date.now().toString().slice(-5)}`,
      date: new Date().toLocaleDateString('fr-FR'),
    };
    setBureauDocuments((prev) => [newDoc, ...prev]);
  };

  const handleOpenNewAdherentDossier = (newProfile: AdherentProfile) => {
    setAdherentsDossiers((prev) => [newProfile, ...prev]);
    setActiveAdherentId(newProfile.id);
    setLots((prev) =>
      prev.map((l) => (l.id === newProfile.lotAttribueId ? { ...l, statut: 'Vendu' } : l))
    );
  };

  const handleAddDocumentToAdherent = (
    adherentId: string,
    doc: Omit<AdherentDocument, 'id' | 'date'>
  ) => {
    const newDoc: AdherentDocument = {
      ...doc,
      id: `ADOC-${Date.now().toString().slice(-5)}`,
      date: new Date().toLocaleDateString('fr-FR'),
    };
    setAdherentsDossiers((prev) =>
      prev.map((a) =>
        a.id === adherentId ? { ...a, documents: [newDoc, ...a.documents] } : a
      )
    );
  };

  const handleUpdateImmeubleAvancement = (updatedImm: ImmeubleAvancement) => {
    setChantier((prev) => {
      const nextImmeubles = (prev.immeublesAvancement || []).map((im) =>
        im.immeuble === updatedImm.immeuble ? updatedImm : im
      );
      const nextGlobal =
        nextImmeubles.length > 0
          ? Math.round(
              nextImmeubles.reduce((sum, item) => sum + item.tauxGlobal, 0) /
                nextImmeubles.length
            )
          : prev.globalPourcentage;
      return {
        ...prev,
        globalPourcentage: nextGlobal,
        immeublesAvancement: nextImmeubles,
      };
    });
  };

  const handleUpdateCameraSurveillance = (updatedCam: CameraSurveillanceItem) => {
    setChantier((prev) => ({
      ...prev,
      camerasSurveillance: (prev.camerasSurveillance || []).map((c) =>
        c.id === updatedCam.id ? updatedCam : c
      ),
    }));
  };

  // Find active adherent dossier & lot
  const activeAdherentProfile =
    adherentsDossiers.find((a) => a.id === activeAdherentId) ||
    adherentsDossiers[0] ||
    DEMO_ADHERENT;
  const adherentLot =
    lots.find((l) => l.id === activeAdherentProfile.lotAttribueId) || lots[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 lg:pb-12 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as any)}
        session={session}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={async () => {
          setSession(null);
          if (firebaseUser) {
            await firebaseLogout();
          }
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onToggleChatbot={() => setIsChatbotOpen(!isChatbotOpen)}
        onOpenWorkspace={() => setIsWorkspaceModalOpen(true)}
        isGoogleConnected={Boolean(firebaseUser && hasOAuthToken)}
        notifications={notifications}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full">
        {/* Module 0: Vitrine Officielle, Vidéos HD, Galerie Photos & Plans PNG */}
        {currentTab === 'vitrine' && (
          <VitrineLandingPage
            onExploreLots={() => {
              setCurrentTab('lots');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBookVisit={() => {
              setVisitLot(null);
              setIsSiteVisitModalOpen(true);
            }}
            onOpenChatbot={() => setIsChatbotOpen(true)}
            onSelectTab={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Module 1: Lots & Plans (162 Appartements + 9 Magasins) */}
        {currentTab === 'lots' && (
          <InteractiveMasterplan
            lots={lots}
            onSelectLot={(lot) => setSelectedLot(lot)}
            onReserveLot={(lot) => setReserveLot(lot)}
            onRequestVisit={(lot) => {
              setVisitLot(lot);
              setIsSiteVisitModalOpen(true);
            }}
            onOpenExcelManager={() => setIsExcelModalOpen(true)}
          />
        )}

        {/* Module 2: Suivi Chantier, Avancement par Immeuble (A–F) & 4 Caméras Live 24/7 */}
        {currentTab === 'chantier' && (
          <div className="space-y-6">
            <div className="bg-ebla-navy-gradient text-white rounded-2xl p-6 sm:p-8 border border-amber-500/30 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      Contrôle Technique, Avancement par Immeuble (A à F) &amp; Télésurveillance 24/7
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                      Chantier Résidence Ebla Two · Mansouria
                    </h1>
                    <p className="text-slate-200 text-sm mt-1 max-w-2xl">
                      Suivi en direct 24/7 par 4 caméras IP et état d'avancement certifié pour chacun des 6 immeubles (A, B, C, D, E, F · 162 appartements et 9 magasins).
                    </p>
                  </div>
                </div>

                <div className="text-right bg-slate-800/90 p-4 rounded-xl border border-amber-500/30 shrink-0">
                  <div className="text-xs text-slate-300">Taux d'Avancement Global</div>
                  <div className="text-3xl font-bold font-mono text-amber-300 tabular-nums">
                    {chantier.globalPourcentage}%
                  </div>
                  <div className="text-[11px] text-emerald-400">Gros œuvre 100% achevé</div>
                </div>
              </div>
            </div>

            {/* 1. Streaming Live 24/7 des 4 Caméras de Surveillance du Chantier */}
            <ChantierLiveCameras
              cameras={chantier.camerasSurveillance || []}
              isEditable={session?.role === 'bureau'}
              onUpdateCamera={handleUpdateCameraSurveillance}
            />

            {/* 2. Taux et Étapes des Travaux pour chaque Immeuble (Immeubles A à F) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <span>Avancement Détaillé &amp; Étapes des Travaux par Immeuble (A à F)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    État d'exécution par bâtiment (162 appartements R+3 et 9 magasins commerciaux)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chantier.immeublesAvancement?.map((imm) => (
                  <div
                    key={imm.immeuble}
                    className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-slate-900">{imm.blocName}</span>
                          <span className="text-[11px] text-slate-500 block">
                            {imm.nbAppartements} Appartements
                            {imm.nbMagasins > 0 ? ` + ${imm.nbMagasins} Magasins RDC` : ''}
                          </span>
                        </div>
                        <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
                          {imm.tauxGlobal}%
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${imm.tauxGlobal}%` }}
                        />
                      </div>

                      <div className="text-xs font-semibold text-slate-800">
                        Étape active : <span className="text-amber-800">{imm.etapeActuelle}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {imm.observations}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 space-y-1.5">
                      {imm.etapes.map((et) => (
                        <div
                          key={et.id}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <span className="text-slate-700 truncate pr-2">{et.nom}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                et.statut === 'Terminé'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : et.statut === 'En cours'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {et.statut}
                            </span>
                            <span className="font-mono font-bold text-slate-900 w-9 text-right">
                              {et.taux}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Corps d'état cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chantier.corpsDEtat.map((cde, idx) => (
                <div key={idx} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{cde.nom}</div>
                      <div className="text-xs text-slate-500">Prestataire : {cde.responsable}</div>
                    </div>
                    <span className="text-base font-bold font-mono text-amber-700 tabular-nums">
                      {cde.pourcentage}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${cde.pourcentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{cde.details}</p>
                  <div className="text-[11px] text-slate-400">Échéance : {cde.dateFinPrevue}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module 3: Espace Adhérent Personnel Sécurisé (Dossier Contrat d'Achat, CIN, Réservation, Correspondances, Caméras 24/7) */}
        {currentTab === 'adherent' && (
          <AdherentSpace
            profile={activeAdherentProfile}
            allProfiles={adherentsDossiers}
            onSelectProfile={(id) => setActiveAdherentId(id)}
            lot={adherentLot}
            chantier={chantier}
            messages={messages}
            onSendMessage={handleSendMessage}
            onRequestVisit={(lot) => {
              setVisitLot(lot);
              setIsSiteVisitModalOpen(true);
            }}
            onAddDocumentToAdherent={handleAddDocumentToAdherent}
          />
        )}

        {/* Module 4: Bureau Exécutif de l'Amicale */}
        {currentTab === 'bureau' && (
          <BureauExecutiveDashboard
            chantier={chantier}
            tresorerie={tresorerie}
            reunions={reunions}
            taches={taches}
            reservations={reservations}
            visites={visites}
            lots={lots}
            bureauDocuments={bureauDocuments}
            adherentsDossiers={adherentsDossiers}
            onApproveReservation={handleApproveReservation}
            onRejectReservation={handleRejectReservation}
            onAddTransaction={handleAddTransaction}
            onAddReunion={handleAddReunion}
            onSendAlert={handleSendAlert}
            onOpenExcelManager={() => setIsExcelModalOpen(true)}
            onAddBureauDocument={handleAddBureauDocument}
            onOpenNewAdherentDossier={handleOpenNewAdherentDossier}
            onAddDocumentToAdherent={handleAddDocumentToAdherent}
            onUpdateImmeubleAvancement={handleUpdateImmeubleAvancement}
            onUpdateCameraSurveillance={handleUpdateCameraSurveillance}
          />
        )}
      </main>

      {/* Official Brand Footer with Logo */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 w-full">
        <div className="bg-white rounded-2xl border border-amber-200/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-12 rounded-xl bg-white border border-amber-200 p-1 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/Logo_premium_de_r_sidence_Ebal_two_66cf26e0.png"
                alt="Logo Résidence Ebla Two"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Amicale d’Habitation · Résidence Ebla Two
              </div>
              <div className="text-xs text-slate-500">
                Commune El Mansouria (Mohammedia) · Titre Foncier N° 36089/25 · 162 Appartements &amp; 9 Magasins
              </div>
            </div>
          </div>
          <div className="text-xs text-amber-700 font-semibold text-center sm:text-right">
            Permis N° GUmsr-0124/2024 · Tous droits réservés © Résidence Ebla Two
          </div>
        </div>
      </footer>

      {/* Floating AI Chatbot Button (Bottom Right) */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-6 z-40 p-3.5 bg-ebla-navy-gradient text-white rounded-full shadow-2xl hover:opacity-95 border border-amber-400/50 flex items-center gap-2 group transition-all cursor-pointer"
        title="Ouvrir le Conseiller Virtuel IA en Darija"
      >
        <Bot className="w-5 h-5 text-amber-400" />
        <span className="text-xs font-bold text-amber-200 hidden sm:inline pr-1">
          IA Darija / Français
        </span>
      </button>

      {/* Modals */}
      {selectedLot && (
        <LotDetailModal
          lot={selectedLot}
          onClose={() => setSelectedLot(null)}
          onReserve={(lot) => {
            setSelectedLot(null);
            setReserveLot(lot);
          }}
          onRequestVisit={(lot) => {
            setSelectedLot(null);
            setVisitLot(lot);
            setIsSiteVisitModalOpen(true);
          }}
        />
      )}

      {reserveLot && (
        <ReservationModal
          lot={reserveLot}
          onClose={() => setReserveLot(null)}
          onSuccess={handleReservationSuccess}
        />
      )}

      {isSiteVisitModalOpen && (
        <SiteVisitModal
          lot={visitLot || undefined}
          onClose={() => {
            setIsSiteVisitModalOpen(false);
            setVisitLot(null);
          }}
          onSuccess={handleVisitSuccess}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={(sess, fbUser, token) => {
          setSession(sess);
          if (fbUser) setFirebaseUser(fbUser);
          if (token) setHasOAuthToken(true);
          if (sess.role === 'bureau') setCurrentTab('bureau');
          else if (sess.role === 'adherent') setCurrentTab('adherent');
        }}
      />

      <DarijaAIChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        firebaseUser={firebaseUser}
        hasOAuthToken={hasOAuthToken}
        onAuthChange={(user, token) => {
          setFirebaseUser(user);
          setHasOAuthToken(Boolean(token));
        }}
        onBookVisitSuccess={(newVisit) => {
          setVisites((prev) => [newVisit, ...prev]);
          const newNotif: NotificationApp = {
            id: `NOTIF-CAL-${Date.now()}`,
            titre: `RDV Google Calendar confirmé : ${newVisit.nomVisiteur}`,
            message: `Rendez-vous enregistré dans Google Calendar pour le ${newVisit.date} à ${newVisit.creneau} (${newVisit.typeVisite}).`,
            date: 'À l instant',
            categorie: 'Commercial',
            urgente: false,
            lue: false,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }}
        defaultVisitorName={session?.nom || ''}
        defaultVisitorEmail={session?.email || ''}
      />

      <NotificationsCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, lue: true } : n))
          );
        }}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
        }}
      />

      <ExcelManagerModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        lots={lots}
        onUpdateLots={async (newLots) => {
          setLots(newLots);
          if (firebaseUser) {
            try {
              await saveBatchLotsToFirestore(newLots);
            } catch (e) {
              console.error(e);
            }
          }
          const newNotif: NotificationApp = {
            id: `NOTIF-XLSX-${Date.now()}`,
            titre: 'Inventaire mis à jour via Excel',
            message: `${newLots.length} lots (appartements et magasins) ont été chargés et synchronisés avec succès.`,
            date: 'À l instant',
            categorie: 'Commercial',
            urgente: false,
            lue: false,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }}
        onResetDefaultLots={() => setLots(INITIAL_LOTS)}
      />

      <GoogleWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        firebaseUser={firebaseUser}
        hasOAuthToken={hasOAuthToken}
        onAuthChange={(user, token) => {
          setFirebaseUser(user);
          setHasOAuthToken(Boolean(token));
        }}
        lots={lots}
        onUpdateLots={(newLots) => setLots(newLots)}
        onAddVisit={(visit) => setVisites((prev) => [visit, ...prev])}
      />
    </div>
  );
}
