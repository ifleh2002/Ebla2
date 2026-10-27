/**
 * Firestore Security Rules Specification Test Suite (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads defined in security_spec.md
 * are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'create' | 'update' | 'get' | 'list';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Reservation Create',
    collection: 'reservations',
    docId: 'RES_001',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'RES_001',
      lotId: 'A-001',
      ownerId: 'user_B',
      nomClient: 'Karim',
      cin: 'AB12345',
      telephone: '0600000000',
      email: 'a@example.com',
      modeFinancement: 'Comptant',
      statut: 'En attente',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoof of Admin',
    collection: 'lots',
    docId: 'A-001',
    operation: 'update',
    auth: { uid: 'spoof_uid', email: 'ifleh2002@gmail.com', email_verified: false },
    payload: {
      id: 'A-001',
      statut: 'Affecté',
      prixAuM2: 9500,
      prixTotal: 1100000,
      surfaceTotale: 115,
      updatedByUid: 'spoof_uid',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Reservation Create',
    collection: 'reservations',
    docId: 'RES_002',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'RES_002',
      lotId: 'A-001',
      ownerId: 'user_A',
      nomClient: 'Karim',
      cin: 'AB12345',
      telephone: '0600000000',
      email: 'a@example.com',
      modeFinancement: 'Comptant',
      statut: 'En attente',
      isApprovedByAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'PII Blanket Read by Non-Owner',
    collection: 'reservations',
    docId: 'RES_OWNED_BY_A',
    operation: 'get',
    auth: { uid: 'user_B', email: 'b@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Terminal State Mutation on Validated Reservation',
    collection: 'reservations',
    docId: 'RES_VALIDATED',
    operation: 'update',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      statut: 'En attente',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'State Escalation by Non-Admin on Create',
    collection: 'reservations',
    docId: 'RES_003',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'RES_003',
      lotId: 'A-001',
      ownerId: 'user_A',
      nomClient: 'Karim',
      cin: 'AB12345',
      telephone: '0600000000',
      email: 'a@example.com',
      modeFinancement: 'Comptant',
      statut: 'Validée',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable Field Tampering on SiteVisit Update',
    collection: 'siteVisits',
    docId: 'VIS_001',
    operation: 'update',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      ownerId: 'user_B',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Client Timestamp Forgery',
    collection: 'siteVisits',
    docId: 'VIS_002',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'VIS_002',
      ownerId: 'user_A',
      lotId: 'A-001',
      nomVisiteur: 'Karim',
      telephone: '0600000000',
      date: '2026-11-01',
      creneau: '10:30',
      typeVisite: 'Sur place (Chantier Mansouria)',
      statut: 'Confirmée',
      calendarEventId: 'none',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Denial-of-Wallet Oversized String',
    collection: 'reservations',
    docId: 'RES_004',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'RES_004',
      lotId: 'A-001',
      ownerId: 'user_A',
      nomClient: 'X'.repeat(5000),
      cin: 'AB12345',
      telephone: '0600000000',
      email: 'a@example.com',
      modeFinancement: 'Comptant',
      statut: 'En attente',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'ID Poisoning with Invalid Characters',
    collection: 'siteVisits',
    docId: 'INVALID ID$$$',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Value Poisoning on Allowed Key',
    collection: 'siteVisits',
    docId: 'VIS_001',
    operation: 'update',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      creneau: 12345,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Privilege Escalation in /admins',
    collection: 'admins',
    docId: 'user_A',
    operation: 'create',
    auth: { uid: 'user_A', email: 'a@example.com', email_verified: true },
    payload: {
      uid: 'user_A',
      email: 'a@example.com',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
