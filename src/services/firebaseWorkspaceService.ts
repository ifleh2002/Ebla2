import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PropertyLot, ReservationDemande, VisiteRdv } from '../types';

// 1. Initialize Firebase App, Firestore & Auth (Singleton)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Validate Connection to Firestore on Boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// 3. Structured Firestore Error Handler (Mandatory per firebase-integration-rpc)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Google Workspace OAuth Scopes (Drive, Sheets, Calendar)
export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.acls',
  'https://www.googleapis.com/auth/calendar.acls.readonly',
  'https://www.googleapis.com/auth/calendar.app.created',
  'https://www.googleapis.com/auth/calendar.calendarlist',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.calendars',
  'https://www.googleapis.com/auth/calendar.calendars.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/calendar.events.owned',
  'https://www.googleapis.com/auth/calendar.events.owned.readonly',
  'https://www.googleapis.com/auth/calendar.events.public.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.settings.readonly',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// Basic Google Auth Provider (only profile + email, zero sensitive scopes)
// Works for ANY Gmail account (e.g. iflehdriss@gmail.com) even while OAuth app is in "Testing" mode!
const basicGoogleProvider = new GoogleAuthProvider();
basicGoogleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory access token cache (NEVER stored in localStorage or sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign in to Firebase with any Gmail account without requesting sensitive Workspace scopes
export const googleSignInBasic = async (): Promise<{ user: User; accessToken: string | null }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, basicGoogleProvider);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Basic Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ============================================================================
// DEFENSIVE VALIDATION CONSTANTS (Synced verbatim with firebase-blueprint.json)
// ============================================================================
const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

function sanitizeId(raw: string, maxLen = 128): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, maxLen);
  return cleaned.length > 0 && ID_REGEX.test(cleaned) ? cleaned : `ID-${Date.now()}`;
}

function sanitizeString(val: string, maxLen: number, fallback = 'N/A'): string {
  const trimmed = (val || '').trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : fallback;
}

// ============================================================================
// FIRESTORE REAL-TIME & CRUD OPERATIONS
// ============================================================================

export function subscribeToLotsInventory(
  onLotsSnapshot: (overrides: Record<string, Partial<PropertyLot>>) => void
) {
  const path = 'lots';
  const lotsQuery = query(collection(db, path), where('prixTotal', '>=', 0));
  return onSnapshot(
    lotsQuery,
    (snapshot) => {
      const map: Record<string, Partial<PropertyLot>> = {};
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d && typeof d.id === 'string') {
          const normalizedStatut: PropertyLot['statut'] =
            d.statut === 'Disponible'
              ? 'Disponible'
              : d.statut === 'Réservé'
              ? 'Réservé'
              : 'Vendu';
          map[d.id] = {
            statut: normalizedStatut,
            prixAuM2: d.prixAuM2,
            prixTotal: d.prixTotal,
            surfaceTotale: d.surfaceTotale,
          };
        }
      });
      onLotsSnapshot(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveBatchLotsToFirestore(lotsToSync: PropertyLot[]): Promise<number> {
  if (!auth.currentUser) return 0;
  const uid = sanitizeId(auth.currentUser.uid, 128);
  const path = 'lots';
  try {
    const batch = writeBatch(db);
    let count = 0;
    for (const lot of lotsToSync) {
      const lotId = sanitizeId(lot.id, 64);
      const ref = doc(db, path, lotId);
      const mappedStatut =
        lot.statut === 'Disponible' || lot.statut === 'Réservé' || lot.statut === 'Vendu'
          ? lot.statut
          : 'Vendu';
      batch.set(ref, {
        id: lotId,
        statut: mappedStatut,
        prixAuM2: Math.max(0, Math.min(1000000, Number(lot.prixAuM2) || 9500)),
        prixTotal: Math.max(0, Math.min(100000000, Number(lot.prixTotal) || 500000)),
        surfaceTotale: Math.max(1, Math.min(5000, Number(lot.surfaceTotale) || 50)),
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
      count++;
    }
    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createReservationInFirestore(
  res: ReservationDemande,
  lot: PropertyLot
): Promise<void> {
  if (!auth.currentUser) return;
  const uid = sanitizeId(auth.currentUser.uid, 128);
  const resId = sanitizeId(res.id, 128);
  const lotId = sanitizeId(lot.id, 64);

  try {
    await setDoc(doc(db, 'reservations', resId), {
      id: resId,
      lotId,
      ownerId: uid,
      nomClient: sanitizeString(res.nomClient, 120, 'Adhérent'),
      cin: sanitizeString(res.cin, 40, 'CIN'),
      telephone: sanitizeString(res.telephone, 40, '0600000000'),
      email: sanitizeString(res.email || auth.currentUser.email || 'client@ebla.ma', 120, 'client@ebla.ma'),
      modeFinancement: 'Echeancier Amicale (4 Tranches)',
      statut: 'En attente',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'lots', lotId), {
      id: lotId,
      statut: 'Réservé',
      prixAuM2: Math.max(0, Math.min(1000000, Number(lot.prixAuM2) || 9500)),
      prixTotal: Math.max(0, Math.min(100000000, Number(lot.prixTotal) || 500000)),
      surfaceTotale: Math.max(1, Math.min(5000, Number(lot.surfaceTotale) || 50)),
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reservations/${resId}`);
  }
}

export async function updateReservationStatusInFirestore(
  res: ReservationDemande,
  newStatut: 'Validée' | 'Refusée'
): Promise<void> {
  if (!auth.currentUser) return;
  const resId = sanitizeId(res.id, 128);
  try {
    await updateDoc(doc(db, 'reservations', resId), {
      statut: newStatut,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reservations/${resId}`);
  }
}

export function subscribeToUserReservations(
  user: User,
  onReservations: (items: ReservationDemande[]) => void
) {
  const path = 'reservations';
  const isAdminUser = user.email === 'ifleh2002@gmail.com' && user.emailVerified;
  const q = isAdminUser
    ? collection(db, path)
    : query(collection(db, path), where('ownerId', '==', user.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ReservationDemande[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const mappedStatut: ReservationDemande['statut'] =
          d.statut === 'Validée'
            ? 'Validée'
            : d.statut === 'Refusée'
            ? 'Refusée'
            : 'En attente de validation';
        list.push({
          id: d.id,
          lotId: d.lotId,
          nomClient: d.nomClient,
          cin: d.cin,
          telephone: d.telephone,
          email: d.email,
          apportInitial: 250000,
          dateDemande: 'Synchronisé Cloud',
          statut: mappedStatut,
        });
      });
      onReservations(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createSiteVisitInFirestore(
  visit: VisiteRdv,
  calendarEventId = 'local'
): Promise<void> {
  if (!auth.currentUser) return;
  const uid = sanitizeId(auth.currentUser.uid, 128);
  const visitId = sanitizeId(visit.id, 128);
  const lotId = sanitizeId(visit.lotInteresseId || 'GENERAL', 64);

  try {
    await setDoc(doc(db, 'siteVisits', visitId), {
      id: visitId,
      ownerId: uid,
      lotId,
      nomVisiteur: sanitizeString(visit.nomVisiteur, 120, 'Visiteur'),
      telephone: sanitizeString(visit.telephone, 40, '0600000000'),
      date: sanitizeString(visit.date, 40, '2026-10-26'),
      creneau: sanitizeString(visit.creneau, 40, '10:30'),
      typeVisite:
        visit.typeVisite === 'Visite virtuelle 3D guidée'
          ? 'Visioconférence WhatsApp 3D'
          : 'Sur place (Chantier Mansouria)',
      statut: 'Confirmée',
      calendarEventId: sanitizeString(calendarEventId, 128, 'local'),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `siteVisits/${visitId}`);
  }
}

export function subscribeToUserSiteVisits(
  user: User,
  onVisits: (items: VisiteRdv[]) => void
) {
  const path = 'siteVisits';
  const isAdminUser = user.email === 'ifleh2002@gmail.com' && user.emailVerified;
  const q = isAdminUser
    ? collection(db, path)
    : query(collection(db, path), where('ownerId', '==', user.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: VisiteRdv[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id,
          lotInteresseId: d.lotId === 'GENERAL' ? undefined : d.lotId,
          nomVisiteur: d.nomVisiteur,
          telephone: d.telephone,
          email: user.email || 'visiteur@eblatwo.ma',
          date: d.date,
          creneau: d.creneau,
          typeVisite:
            d.typeVisite === 'Visioconférence WhatsApp 3D'
              ? 'Visite virtuelle 3D guidée'
              : 'Sur site Mansouria',
          statut: 'Confirmée',
          conseillerAssigne: 'Yassine Berrada',
        });
      });
      onVisits(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ============================================================================
// GOOGLE DRIVE API INTEGRATION
// ============================================================================

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}

export async function listGoogleDriveFiles(searchQuery = ''): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const qParts = ['trashed = false'];
  if (searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/'/g, "\\'");
    qParts.push(`name contains '${escaped}'`);
  }
  const params = new URLSearchParams({
    pageSize: '20',
    fields: 'files(id,name,mimeType,webViewLink,modifiedTime,size)',
    orderBy: 'modifiedTime desc',
    q: qParts.join(' and '),
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erreur Google Drive (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.files || [];
}

export async function uploadAssetToGoogleDrive(
  fileName: string,
  assetUrl: string,
  mimeType: string
): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const assetResponse = await fetch(assetUrl);
  const blob = await assetResponse.blob();

  const metadata = {
    name: fileName,
    mimeType,
    description: 'Document officiel Résidence Ebla Two - Mansouria (T.F. 36089/25)',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,modifiedTime',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Échec de l'envoi vers Google Drive (${res.status}): ${errText}`);
  }
  return await res.json();
}

export async function deleteGoogleDriveFile(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Impossible de supprimer le fichier Drive (${res.status}): ${errText}`);
  }
}

// ============================================================================
// GOOGLE SHEETS API INTEGRATION
// ============================================================================

export interface CreatedSheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export async function exportLotsToNewGoogleSheet(
  lots: PropertyLot[],
  customTitle?: string
): Promise<CreatedSheetResult> {
  const token = await getAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const title =
    customTitle?.trim() ||
    `Résidence Ebla Two - Inventaire R+3 (${new Date().toLocaleDateString('fr-FR')})`;

  const headerRow = [
    'Code_Lot',
    'Nature',
    'Bloc',
    'Etage',
    'Typologie',
    'Surface_Habitable_m2',
    'Surface_Terrasse_m2',
    'Surface_Totale_m2',
    'Prix_M2_DH',
    'Prix_Total_DH',
    'Orientation',
    'Statut',
    'Parking_Sous_Sol',
  ];

  const rows = lots.map((l) => [
    l.id,
    l.type === 'magasin' ? 'Magasin' : 'Appartement',
    l.bloc,
    l.etage === 0 ? 'RDC' : `${l.etage}e Étage`,
    l.typology,
    l.surfaceHabitable,
    l.surfaceTerrasse,
    l.surfaceTotale,
    l.prixAuM2,
    l.prixTotal,
    l.orientation,
    l.statut,
    l.parkingSousSolNumero,
  ]);

  // 1. Create spreadsheet with explicit tab name "Inventaire_Lots_R3"
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Inventaire_Lots_R3',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Erreur création Google Sheet (${createRes.status}): ${errText}`);
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;
  const firstSheetTitle = created.sheets?.[0]?.properties?.title || 'Inventaire_Lots_R3';

  // 2. Write all 162 lots to the discovered sheet tab
  const range = `${firstSheetTitle}!A1`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headerRow, ...rows],
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Erreur écriture Google Sheet (${updateRes.status}): ${errText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl:
      created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title,
  };
}

export async function overwriteExistingGoogleSheet(
  spreadsheetId: string,
  lots: PropertyLot[]
): Promise<{ sheetTitle: string; updatedRows: number }> {
  const token = await getAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  // Best practice per references/sheets.md: Fetch spreadsheet metadata first to identify actual tab name
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) {
    throw new Error(`Impossible de lire les métadonnées du Google Sheet (${metaRes.status})`);
  }
  const meta = await metaRes.json();
  const sheetTitle: string = meta.sheets?.[0]?.properties?.title;
  if (!sheetTitle) {
    throw new Error('Aucun onglet trouvé dans ce Google Sheet.');
  }

  const headerRow = [
    'Code_Lot',
    'Nature',
    'Bloc',
    'Etage',
    'Typologie',
    'Surface_Habitable_m2',
    'Surface_Terrasse_m2',
    'Surface_Totale_m2',
    'Prix_M2_DH',
    'Prix_Total_DH',
    'Orientation',
    'Statut',
    'Parking_Sous_Sol',
  ];

  const rows = lots.map((l) => [
    l.id,
    l.type === 'magasin' ? 'Magasin' : 'Appartement',
    l.bloc,
    l.etage === 0 ? 'RDC' : `${l.etage}e Étage`,
    l.typology,
    l.surfaceHabitable,
    l.surfaceTerrasse,
    l.surfaceTotale,
    l.prixAuM2,
    l.prixTotal,
    l.orientation,
    l.statut,
    l.parkingSousSolNumero,
  ]);

  const range = `${sheetTitle}!A1`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headerRow, ...rows],
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Erreur mise à jour Google Sheet (${updateRes.status}): ${errText}`);
  }

  return { sheetTitle, updatedRows: rows.length };
}

export async function importLotsFromGoogleSheet(
  spreadsheetId: string,
  currentLots: PropertyLot[]
): Promise<{ updatedLots: PropertyLot[]; sheetTitle: string; importedCount: number }> {
  const token = await getAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  // 1. Fetch spreadsheet metadata first to identify the actual tab name (Never hardcode "Sheet1")
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) {
    throw new Error(`Impossible d'accéder au Google Sheet (${metaRes.status})`);
  }
  const meta = await metaRes.json();
  const sheetTitle: string = meta.sheets?.[0]?.properties?.title;
  if (!sheetTitle) {
    throw new Error('Aucun onglet trouvé dans ce Google Sheet.');
  }

  // 2. Read values from the discovered sheet tab
  const range = `${sheetTitle}!A1:M250`;
  const valRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!valRes.ok) {
    throw new Error(`Erreur lecture des cellules (${valRes.status})`);
  }
  const valData = await valRes.json();
  const rows: string[][] = valData.values || [];
  if (rows.length < 2) {
    throw new Error('Le Google Sheet ne contient pas de lignes de données.');
  }

  const updatesByCode = new Map<string, string[]>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const code = (r[0] || '').trim();
    if (code) {
      updatesByCode.set(code, r);
    }
  }

  let importedCount = 0;
  const updatedLots = currentLots.map((lot) => {
    const r = updatesByCode.get(lot.id);
    if (!r) return lot;
    importedCount++;
    const surfHab = Number(r[5]) || lot.surfaceHabitable;
    const surfTerr = Number(r[6]) >= 0 ? Number(r[6]) : lot.surfaceTerrasse;
    const surfTot = Number(r[7]) || surfHab + surfTerr;
    const prixM2 = Number(r[8]) || lot.prixAuM2;
    const prixTot = Number(r[9]) || surfTot * prixM2;
    const rawStatut = (r[11] || '').trim();
    const statut: PropertyLot['statut'] =
      rawStatut === 'Réservé'
        ? 'Réservé'
        : rawStatut === 'Vendu' || rawStatut === 'Affecté'
        ? 'Vendu'
        : rawStatut === 'Disponible'
        ? 'Disponible'
        : lot.statut;

    return {
      ...lot,
      surfaceHabitable: surfHab,
      surfaceTerrasse: surfTerr,
      surfaceTotale: surfTot,
      prixAuM2: prixM2,
      prixTotal: prixTot,
      statut,
    };
  });

  return { updatedLots, sheetTitle, importedCount };
}

// ============================================================================
// GOOGLE CALENDAR API INTEGRATION
// ============================================================================

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function listGoogleCalendarEvents(): Promise<CalendarEventItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const params = new URLSearchParams({
    maxResults: '15',
    orderBy: 'startTime',
    singleEvents: 'true',
    timeMin: new Date(Date.now() - 86400000).toISOString(),
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erreur Google Calendar (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.items || [];
}

function parseVisitDates(visit: { date: string; creneau: string }) {
  const datePart = /^\d{4}-\d{2}-\d{2}$/.test(visit.date)
    ? visit.date
    : new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const timeMatch = visit.creneau.match(/(\d{1,2})[:h](\d{2})/);
  const hour = timeMatch ? String(timeMatch[1]).padStart(2, '0') : '10';
  const minute = timeMatch ? String(timeMatch[2]).padStart(2, '0') : '30';

  const startDateObj = new Date(`${datePart}T${hour}:${minute}:00`);
  const endDateObj = new Date(startDateObj.getTime() + 60 * 60 * 1000);
  return { startDateObj, endDateObj };
}

function toGoogleCalendarCompactUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generates an official universal Google Calendar Template link
 * (`https://calendar.google.com/calendar/render?action=TEMPLATE...`)
 * Works for 100% of Google accounts (including iflehdriss@gmail.com and all visitors)
 * WITHOUT requiring OAuth Consent Screen validation or Test User allowlisting!
 */
export function buildGoogleCalendarTemplateUrl(visit: {
  nomVisiteur: string;
  telephone: string;
  date: string;
  creneau: string;
  typeVisite: string;
  lotId?: string;
}): string {
  const { startDateObj, endDateObj } = parseVisitDates(visit);
  const summary = `Visite Résidence Ebla Two (${
    visit.lotId && visit.lotId !== 'GENERAL' ? `Lot ${visit.lotId}` : 'Présentation R+3'
  }) - ${visit.nomVisiteur}`;
  const location =
    'Résidence Ebla Two, Lotissement Jawharat Al Bahr 16, Commune El Mansouria, Maroc';
  const description = `Rendez-vous officiel de visite (${visit.typeVisite}).\nVisiteur : ${visit.nomVisiteur}\nTéléphone : ${visit.telephone}\nConseiller : Yassine Berrada (Amicale Ebla Two)\nTitre Foncier N° 36089/25 · Permis GUmsr-0124/2024.`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${toGoogleCalendarCompactUtc(startDateObj)}/${toGoogleCalendarCompactUtc(endDateObj)}`,
    details: description,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates a downloadable .ics iCalendar data URI for Apple Calendar, Outlook, or Google Calendar
 */
export function buildGoogleCalendarIcsDataUri(visit: {
  nomVisiteur: string;
  telephone: string;
  date: string;
  creneau: string;
  typeVisite: string;
  lotId?: string;
}): string {
  const { startDateObj, endDateObj } = parseVisitDates(visit);
  const summary = `Visite Residence Ebla Two (${
    visit.lotId && visit.lotId !== 'GENERAL' ? `Lot ${visit.lotId}` : 'Presentation R+3'
  }) - ${visit.nomVisiteur}`;
  const location =
    'Residence Ebla Two, Lotissement Jawharat Al Bahr 16, Commune El Mansouria, Maroc';
  const description = `Rendez-vous officiel de visite (${visit.typeVisite}) - Visiteur: ${visit.nomVisiteur} - Tel: ${visit.telephone}`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Residence Ebla Two Mansouria//NONSGML v1.0//FR',
    'BEGIN:VEVENT',
    `UID:eblatwo-${Date.now()}@eblatwo.ma`,
    `DTSTAMP:${toGoogleCalendarCompactUtc(new Date())}`,
    `DTSTART:${toGoogleCalendarCompactUtc(startDateObj)}`,
    `DTEND:${toGoogleCalendarCompactUtc(endDateObj)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsLines)}`;
}

export async function createGoogleCalendarVisitEvent(visit: {
  nomVisiteur: string;
  telephone: string;
  date: string;
  creneau: string;
  typeVisite: string;
  lotId?: string;
}): Promise<CalendarEventItem> {
  const token = await getAccessToken();
  const universalTemplateUrl = buildGoogleCalendarTemplateUrl(visit);
  const { startDateObj, endDateObj } = parseVisitDates(visit);

  const summary = `Visite Résidence Ebla Two (${
    visit.lotId && visit.lotId !== 'GENERAL' ? `Lot ${visit.lotId}` : 'Présentation R+3'
  }) - ${visit.nomVisiteur}`;
  const location =
    'Résidence Ebla Two, Lotissement Jawharat Al Bahr 16, Commune El Mansouria, Maroc';
  const description = `Rendez-vous officiel de visite (${visit.typeVisite}).\nVisiteur : ${visit.nomVisiteur}\nTéléphone : ${visit.telephone}\nTitre Foncier N° 36089/25 · Permis GUmsr-0124/2024.`;

  // If no OAuth token is present (e.g. visitor using an external Gmail account like iflehdriss@gmail.com
  // while the GCP OAuth app is in "Testing" mode), return a confirmed item with the universal Google Calendar link
  if (!token) {
    return {
      id: `gcal-template-${Date.now()}`,
      summary,
      location,
      description,
      htmlLink: universalTemplateUrl,
      start: { dateTime: startDateObj.toISOString() },
      end: { dateTime: endDateObj.toISOString() },
    };
  }

  const eventBody = {
    summary,
    location,
    description,
    start: {
      dateTime: startDateObj.toISOString(),
    },
    end: {
      dateTime: endDateObj.toISOString(),
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!res.ok) {
    // Fallback to universal Google Calendar template URL if API token expired or scope restricted
    return {
      id: `gcal-template-${Date.now()}`,
      summary,
      location,
      description,
      htmlLink: universalTemplateUrl,
      start: { dateTime: startDateObj.toISOString() },
      end: { dateTime: endDateObj.toISOString() },
    };
  }
  return await res.json();
}

export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Impossible de supprimer l'événement Calendar (${res.status}): ${errText}`);
  }
}
