export type LotType = 'appartement' | 'magasin';
export type LotStatus = 'Disponible' | 'Réservé' | 'Vendu';
export type OrientationType = 'Mer' | 'Piscine & Jardin' | 'Sud/Soleil';
export type TypologyType = 'Studio' | 'F2' | 'F3' | 'F4' | 'Local Commercial';
export type BlocType =
  | 'Immeuble A'
  | 'Immeuble B'
  | 'Immeuble C'
  | 'Immeuble D'
  | 'Immeuble E'
  | 'Immeuble F';

export interface ImmeubleContenanceRow {
  immeuble: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  blocName: BlocType;
  appartRdc: number;
  appartParEtage: number;
  nombreEtages: number;
  appartEtages: number;
  totalAppartements: number;
  magasins: number;
}

export interface RoomDimension {
  name: string;
  surface: number; // in m²
  type: 'salon' | 'chambre' | 'cuisine' | 'sdb' | 'terrasse' | 'hall' | 'magasin_surface' | 'mezzanine';
}

export interface PropertyLot {
  id: string; // e.g. "APP-A204" or "MAG-03"
  lotNumber: number;
  type: LotType;
  bloc: BlocType;
  etage: number; // 0 for RDC, 1 to 4
  typology: TypologyType;
  surfaceHabitable: number;
  surfaceTerrasse: number;
  surfaceTotale: number;
  orientation: OrientationType;
  prixAuM2: number;
  prixTotal: number;
  statut: LotStatus;
  nbChambres: number;
  nbSallesDeBain: number;
  parkingSousSolNumero: number;
  description: string;
  pointsForts: string[];
  pieces: RoomDimension[];
  reservedBy?: {
    nom: string;
    cin: string;
    date: string;
  };
}

export interface EcheancePaiement {
  id: string;
  numeroTranche: number;
  libelle: string;
  pourcentage: number;
  montant: number;
  dateEcheance: string;
  statut: 'Payé' | 'En cours' | 'À venir';
  quittanceNumero?: string;
  datePaiement?: string;
  modePaiement?: string;
}

export type ModeAjoutDocument = 'Téléchargement' | 'Caméra' | 'Saisie directe';

export type MembreBureauRole = 'Secrétaire Général' | 'Trésorier' | 'Président';

export type CategorieDocBureau =
  // Secrétaire Général
  | 'PV'
  | 'Documents du projet'
  | 'Documents des adhérents'
  // Trésorier
  | "Avis d'opérations"
  | 'Chèques émis ou reçus'
  | 'Documents de comptabilité'
  // Président
  | 'Correspondances'
  | 'Documents administratifs'
  | 'Convocations'
  // Commun
  | 'Autres';

export interface BureauDocument {
  id: string;
  titre: string;
  membreRole: MembreBureauRole;
  categorie: CategorieDocBureau;
  modeAjout: ModeAjoutDocument;
  date: string;
  auteur: string;
  taille: string;
  fichierRef: string;
  referencePiece?: string;
  montant?: number;
  adherentCibleId?: string;
  contenuTexte?: string;
  dataUrl?: string;
}

export type AdherentDocCategory =
  | 'CIN'
  | 'Contrat de réservation'
  | "Contrat d'achat"
  | 'Correspondances'
  | 'Autres'
  | 'Contrat'
  | 'Plan'
  | 'Quittance'
  | 'PV'
  | 'Attestation';

export interface AdherentDocument {
  id: string;
  titre: string;
  categorie: AdherentDocCategory;
  date: string;
  taille: string;
  fichierRef: string;
  modeAjout?: ModeAjoutDocument;
  contenuTexte?: string;
  dataUrl?: string;
  statutVerification?: 'Signé & Certifié' | 'Vérifié' | 'En attente';
}

export interface AdherentProfile {
  id: string;
  nomComplet: string;
  cin: string;
  email: string;
  telephone: string;
  ville: string;
  dateAdhesion: string;
  lotAttribueId: string;
  pourcentageAvancementPersonnel: number;
  contratAchatSigne?: boolean;
  dateSignatureContratAchat?: string;
  notaireInstrumentaire?: string;
  echeancier: EcheancePaiement[];
  documents: AdherentDocument[];
}

export interface ReunionItem {
  id: string;
  titre: string;
  type: 'Assemblée Générale Ordinaire' | 'Réunion Bureau Exécutif' | 'Comité Chantier & BET';
  date: string;
  heure: string;
  lieu: string;
  ordreDuJour: string[];
  quorumAtteint: boolean;
  tauxPresence: number;
  decisions: string[];
  pvRef: string;
  statut: 'Clôturée' | 'Programmée';
}

export interface CorpsDEtat {
  nom: string;
  responsable: string;
  pourcentage: number;
  statut: 'Terminé' | 'En cours' | 'En attente';
  dateFinPrevue: string;
  details: string;
}

export interface EtapeTravauxImmeuble {
  id: string;
  nom: string;
  taux: number; // 0 to 100
  statut: 'Terminé' | 'En cours' | 'En attente';
  dateMaj: string;
}

export interface ImmeubleAvancement {
  immeuble: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  blocName: BlocType;
  nbAppartements: number;
  nbMagasins: number;
  tauxGlobal: number;
  etapeActuelle: string;
  dateDerniereMaj: string;
  responsableBloc: string;
  observations: string;
  etapes: EtapeTravauxImmeuble[];
}

export interface CameraSurveillanceItem {
  id: string;
  code: 'CAM-01' | 'CAM-02' | 'CAM-03' | 'CAM-04';
  nom: string;
  zone: string;
  immeublesCouverts: string;
  streamUrl: string;
  resolution: '1080p Full HD' | '4K UHD';
  statut: 'En direct 24/7' | 'Maintenance';
  visionNocturne: boolean;
  anglePtz: string;
}

export interface ChantierAvancement {
  globalPourcentage: number;
  dateDerniereVisiteBet: string;
  bureauControle: string;
  architecte: string;
  corpsDEtat: CorpsDEtat[];
  immeublesAvancement: ImmeubleAvancement[];
  camerasSurveillance: CameraSurveillanceItem[];
  photosRecentes: {
    titre: string;
    date: string;
    zone: string;
    description: string;
  }[];
}

export interface TransactionFinanciere {
  id: string;
  date: string;
  libelle: string;
  categorie: 'Cotisation Adhérent' | 'Entreprise BTP' | 'Bureau Contrôle/BET' | 'Notaire & Foncier' | 'Frais Administratifs';
  type: 'Entrée' | 'Sortie';
  montant: number;
  referencePiece: string;
  statut: 'Rapproché' | 'En attente';
}

export interface TresorerieAmicale {
  totalCollecte: number;
  totalDepenses: number;
  soldeActuelBanque: number;
  totalImpayesRelances: number;
  banquePartenaire: string;
  ribAmicale: string;
  transactions: TransactionFinanciere[];
}

export interface TacheBureau {
  id: string;
  titre: string;
  responsable: string;
  priorite: 'Haute' | 'Moyenne' | 'Basse';
  statut: 'À faire' | 'En cours' | 'Validé';
  echeance: string;
  categorie: 'Chantier' | 'Juridique' | 'Comptabilité' | 'Communication';
}

export interface ReservationDemande {
  id: string;
  lotId: string;
  nomClient: string;
  cin: string;
  telephone: string;
  email: string;
  apportInitial: number;
  dateDemande: string;
  statut: 'En attente de validation' | 'Validée' | 'Refusée';
  commentaire?: string;
}

export interface VisiteRdv {
  id: string;
  nomVisiteur: string;
  telephone: string;
  email: string;
  date: string;
  creneau: string;
  typeVisite: 'Sur site Mansouria' | 'Visite virtuelle 3D guidée';
  statut: 'Confirmée' | 'En attente';
  lotInteresseId?: string;
  conseillerAssigne: string;
}

export interface MessageDiscussion {
  id: string;
  expediteurRole: 'adherent' | 'commercial' | 'bureau';
  expediteurNom: string;
  texte: string;
  date: string;
  lu: boolean;
}

export interface NotificationApp {
  id: string;
  titre: string;
  message: string;
  date: string;
  categorie: 'Paiement' | 'Chantier' | 'Réunion' | 'Commercial';
  urgente: boolean;
  lue: boolean;
}

export type RoleUtilisateur = 'visiteur' | 'adherent' | 'commercial' | 'bureau';

export interface UtilisateurSession {
  role: RoleUtilisateur;
  nom: string;
  email: string;
  titreFonction: string;
  adherentProfileId?: string;
}
