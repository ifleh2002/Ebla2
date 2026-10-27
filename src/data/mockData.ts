import { 
  PropertyLot, 
  BlocType, 
  TypologyType, 
  OrientationType, 
  LotStatus, 
  ChantierAvancement, 
  TresorerieAmicale, 
  ReunionItem, 
  TacheBureau, 
  AdherentProfile, 
  VisiteRdv, 
  ReservationDemande,
  MessageDiscussion,
  NotificationApp,
  RoomDimension,
  ImmeubleContenanceRow,
  BureauDocument,
  ImmeubleAvancement,
  CameraSurveillanceItem
} from '../types';

// Données officielles certifiées issues de : Tableau_contenance_162_appartements.xlsx - Synthèse
export const IMMEUBLES_CONTENANCE: ImmeubleContenanceRow[] = [
  { immeuble: 'A', blocName: 'Immeuble A', appartRdc: 0, appartParEtage: 4, nombreEtages: 3, appartEtages: 12, totalAppartements: 12, magasins: 3 },
  { immeuble: 'B', blocName: 'Immeuble B', appartRdc: 4, appartParEtage: 7, nombreEtages: 3, appartEtages: 21, totalAppartements: 25, magasins: 3 },
  { immeuble: 'C', blocName: 'Immeuble C', appartRdc: 10, appartParEtage: 9, nombreEtages: 3, appartEtages: 27, totalAppartements: 37, magasins: 0 },
  { immeuble: 'D', blocName: 'Immeuble D', appartRdc: 4, appartParEtage: 4, nombreEtages: 3, appartEtages: 12, totalAppartements: 16, magasins: 0 },
  { immeuble: 'E', blocName: 'Immeuble E', appartRdc: 9, appartParEtage: 11, nombreEtages: 3, appartEtages: 33, totalAppartements: 42, magasins: 0 },
  { immeuble: 'F', blocName: 'Immeuble F', appartRdc: 3, appartParEtage: 9, nombreEtages: 3, appartEtages: 27, totalAppartements: 30, magasins: 3 },
];

export const TABLEAU_CONTENANCE_SYNTHESE = {
  logements: 162,
  magasins: 9,
  totalLots: 171,
  immeubles: 6,
  parkingPlaces: 230,
  niveauxResidentiels: 'RDC à R+3',
  totalAppartRdc: 30,
  totalAppartParEtageCourant: 44,
  totalAppartEtages: 132,
  surfaceTerrainM2: 11841,
  sousSolConstruitM2: 7500,
  rdcConstruitM2: 4080,
  r1ConstruitM2: 3400,
  r2ConstruitM2: 3400,
  r3ConstruitM2: 3400,
  surfaceConstruiteTotaleM2: 21780,
  planchersHorsSousSolM2: 14280,
  surfaceConstruiteAuSolM2: 4080,
  csvAssetUrl: '/assets/aistudio/Tableau_contenance_162_appartements.xlsx_-_Synth_se_8e0f18a0.csv',
  avertissement:
    'ATTENTION : les surfaces globales ci-dessus ne constituent PAS des surfaces privatives par appartement. Les valeurs individuelles sont à rapprocher des lots sur le plan.',
};

// Generate strictly 162 Apartments (30 RDC + 132 Étages across Immeubles A, B, C, D, E, F) + 9 Magasins (3 in A, 3 in B, 3 in F) = 171 Lots
export function generateAllLots(): PropertyLot[] {
  const lots: PropertyLot[] = [];
  let lotCounter = 1;

  // 1. Generate 9 Magasins RDC (3 in Immeuble A, 3 in Immeuble B, 3 in Immeuble F)
  const magasinsSpecs: {
    num: number;
    bloc: BlocType;
    surfHab: number;
    surfTerr: number;
    surfTot: number;
    prixM2: number;
    statut: LotStatus;
    orient: OrientationType;
    desc: string;
  }[] = [
    { num: 1, bloc: 'Immeuble A', surfHab: 75, surfTerr: 20, surfTot: 95, prixM2: 17500, statut: 'Réservé', orient: 'Sud/Soleil', desc: 'Magasin d angle Immeuble A sur grande voie de 16m, idéal café ou pharmacie.' },
    { num: 2, bloc: 'Immeuble A', surfHab: 52, surfTerr: 10, surfTot: 62, prixM2: 16800, statut: 'Disponible', orient: 'Sud/Soleil', desc: 'Local commercial Immeuble A avec vitrine linéaire et soupente.' },
    { num: 3, bloc: 'Immeuble A', surfHab: 88, surfTerr: 25, surfTot: 113, prixM2: 18200, statut: 'Vendu', orient: 'Sud/Soleil', desc: 'Grand local Immeuble A avec soupente et terrasse privative aménagée.' },
    { num: 4, bloc: 'Immeuble B', surfHab: 45, surfTerr: 8, surfTot: 53, prixM2: 16500, statut: 'Disponible', orient: 'Piscine & Jardin', desc: 'Local commercial Immeuble B idéal pour bureau de services, agence ou cabinet médical.' },
    { num: 5, bloc: 'Immeuble B', surfHab: 62, surfTerr: 12, surfTot: 74, prixM2: 17000, statut: 'Réservé', orient: 'Piscine & Jardin', desc: 'Boutique centrale Immeuble B avec hauteur sous plafond permettant soupente.' },
    { num: 6, bloc: 'Immeuble B', surfHab: 38, surfTerr: 8, surfTot: 46, prixM2: 16900, statut: 'Disponible', orient: 'Piscine & Jardin', desc: 'Boutique Immeuble B avec soupente sur l axe principal.' },
    { num: 7, bloc: 'Immeuble F', surfHab: 110, surfTerr: 35, surfTot: 145, prixM2: 18500, statut: 'Vendu', orient: 'Sud/Soleil', desc: 'Grand espace commercial Immeuble F de standing pour enseigne de restauration ou banque.' },
    { num: 8, bloc: 'Immeuble F', surfHab: 58, surfTerr: 12, surfTot: 70, prixM2: 17200, statut: 'Disponible', orient: 'Sud/Soleil', desc: 'Local d activité Immeuble F avec accès livraison sécurisé et soupente.' },
    { num: 9, bloc: 'Immeuble F', surfHab: 70, surfTerr: 15, surfTot: 85, prixM2: 17800, statut: 'Réservé', orient: 'Sud/Soleil', desc: 'Boutique Immeuble F sur l axe d entrée de la résidence balnéaire.' },
  ];

  magasinsSpecs.forEach((m) => {
    lots.push({
      id: `MAG-0${m.num}`,
      lotNumber: lotCounter++,
      type: 'magasin',
      bloc: m.bloc,
      etage: 0,
      typology: 'Local Commercial',
      surfaceHabitable: m.surfHab,
      surfaceTerrasse: m.surfTerr,
      surfaceTotale: m.surfTot,
      orientation: m.orient,
      prixAuM2: m.prixM2,
      prixTotal: Math.round(m.surfTot * m.prixM2),
      statut: m.statut,
      nbChambres: 0,
      nbSallesDeBain: 1,
      parkingSousSolNumero: 162 + m.num,
      description: m.desc,
      pointsForts: [
        `Rattaché à l'${m.bloc} (RDC + Soupente)`,
        'Rideau métallique électrique',
        'Arrivée eau & évacuation',
        'Compteur individuel',
        'Accès sur voie de lotissement 16m',
      ],
      pieces: [
        { name: 'Surface commerciale principale RDC', surface: m.surfHab - 15, type: 'magasin_surface' },
        { name: 'Soupente / Mezzanine commerciale', surface: 15, type: 'mezzanine' },
        { name: 'Sanitaire indépendant', surface: 3, type: 'sdb' },
        { name: 'Terrasse / Parvis privatif', surface: m.surfTerr, type: 'terrasse' },
      ],
    });
  });

  // 2. Generate strictly 162 Apartments across Immeubles A, B, C, D, E, F
  // Exact floor breakdown per building from Tableau_contenance_162_appartements.xlsx:
  // Immeuble A: RDC=0, R+1=4, R+2=4, R+3=4 (Total = 12)
  // Immeuble B: RDC=4, R+1=7, R+2=7, R+3=7 (Total = 25)
  // Immeuble C: RDC=10, R+1=9, R+2=9, R+3=9 (Total = 37)
  // Immeuble D: RDC=4, R+1=4, R+2=4, R+3=4 (Total = 16)
  // Immeuble E: RDC=9, R+1=11, R+2=11, R+3=11 (Total = 42)
  // Immeuble F: RDC=3, R+1=9, R+2=9, R+3=9 (Total = 30)
  // Total RDC = 30 | Total R+1..R+3 = 132 (44/étage) | Total Appartements = 162
  let aptGlobalIndex = 0;

  IMMEUBLES_CONTENANCE.forEach((immConfig) => {
    const floorsDistribution: { floor: number; count: number }[] = [
      { floor: 0, count: immConfig.appartRdc },
      { floor: 1, count: immConfig.appartParEtage },
      { floor: 2, count: immConfig.appartParEtage },
      { floor: 3, count: immConfig.appartParEtage },
    ];

    floorsDistribution.forEach(({ floor, count }) => {
      for (let unitIdx = 1; unitIdx <= count; unitIdx++) {
        aptGlobalIndex += 1;
        const aptDoorNumber =
          floor === 0
            ? `0${unitIdx < 10 ? `0${unitIdx}` : unitIdx}`
            : `${floor * 100 + unitIdx}`;
        const lotId = `APP-${immConfig.immeuble}${aptDoorNumber}`;

        // Typologies matching the 4 architectural showcase types (40m² Studio/F2, 78m² F2/F3, 115m² F3/F4, 135m² Grand F4)
        let typo: TypologyType = 'F3';
        let surfHab = 78;
        let surfTerr = 10;
        let nbCh = 2;
        let nbSdb = 2;
        let basePrixM2 = 10500;

        if (aptGlobalIndex % 6 === 0) {
          typo = 'Studio';
          surfHab = 36 + (aptGlobalIndex % 5);
          surfTerr = 4 + (aptGlobalIndex % 3);
          nbCh = 1;
          nbSdb = 1;
          basePrixM2 = 10200;
        } else if (aptGlobalIndex % 3 === 0) {
          typo = 'F2';
          surfHab = 62 + (aptGlobalIndex % 10);
          surfTerr = 8 + (aptGlobalIndex % 5);
          nbCh = 1;
          nbSdb = 1;
          basePrixM2 = 10300;
        } else if (aptGlobalIndex % 5 === 0) {
          typo = 'F4';
          surfHab = 115 + (aptGlobalIndex % 12);
          surfTerr = 16 + (aptGlobalIndex % 6);
          nbCh = 3;
          nbSdb = 2;
          basePrixM2 = 11200;
        } else {
          typo = 'F3';
          surfHab = 82 + (aptGlobalIndex % 14);
          surfTerr = 12 + (aptGlobalIndex % 6);
          nbCh = 2;
          nbSdb = 2;
          basePrixM2 = 10600;
        }

        // Orientation based on Immeuble and floor
        let orient: OrientationType = 'Piscine & Jardin';
        if (
          floor >= 2 &&
          (immConfig.immeuble === 'A' || immConfig.immeuble === 'B' || immConfig.immeuble === 'F') &&
          unitIdx % 2 === 0
        ) {
          orient = 'Mer';
          basePrixM2 += 1200;
        } else if (aptGlobalIndex % 3 === 1) {
          orient = 'Sud/Soleil';
          basePrixM2 += 400;
        }

        // Upper floor elevation bonus (RDC to R+3)
        basePrixM2 += floor * 300;

        const surfTot = surfHab + surfTerr;
        const prixTotal = Math.round(surfTot * basePrixM2);

        // Status realistic distribution
        let statut: LotStatus = 'Disponible';
        if (lotId === 'APP-B204') {
          statut = 'Réservé';
        } else if (aptGlobalIndex % 7 === 0 || aptGlobalIndex % 11 === 0) {
          statut = 'Vendu';
        } else if (aptGlobalIndex % 2 === 0 || aptGlobalIndex % 5 === 0) {
          statut = 'Réservé';
        } else {
          statut = 'Disponible';
        }

        const pieces: RoomDimension[] = [
          { name: 'Grand Salon Marocain & Séjour', surface: Math.round(surfHab * 0.38), type: 'salon' },
          { name: 'Suite Parentale avec dressing', surface: Math.round(surfHab * 0.22), type: 'chambre' },
          ...(nbCh >= 2 ? [{ name: 'Chambre Enfants / Invités', surface: Math.round(surfHab * 0.16), type: 'chambre' as const }] : []),
          ...(nbCh >= 3 ? [{ name: 'Chambre 3 / Bureau', surface: Math.round(surfHab * 0.14), type: 'chambre' as const }] : []),
          { name: 'Cuisine équipée moderne', surface: Math.round(surfHab * 0.12), type: 'cuisine' },
          { name: 'Salle de bain principale avec douche italienne', surface: 5, type: 'sdb' },
          ...(nbSdb >= 2 ? [{ name: 'Salle d eau invités', surface: 3, type: 'sdb' as const }] : []),
          { name: 'Terrasse panoramique ensoleillée', surface: surfTerr, type: 'terrasse' },
        ];

        const floorLabel =
          floor === 0 ? 'Rez-de-chaussée (RDC)' : floor === 1 ? '1er étage (R+1)' : `${floor}ème étage (R+${floor})`;

        lots.push({
          id: lotId,
          lotNumber: lotCounter++,
          type: 'appartement',
          bloc: immConfig.blocName,
          etage: floor,
          typology: typo,
          surfaceHabitable: surfHab,
          surfaceTerrasse: surfTerr,
          surfaceTotale: surfTot,
          orientation: orient,
          prixAuM2: basePrixM2,
          prixTotal: prixTotal,
          statut: statut,
          nbChambres: nbCh,
          nbSallesDeBain: nbSdb,
          parkingSousSolNumero: aptGlobalIndex, // 1 to 162 within the 230 underground parking spaces
          description: `Appartement ${typo} au ${floorLabel} de l'${immConfig.blocName} (Résidence R+3 · ${immConfig.totalAppartements} appts dans cet immeuble), offrant une orientation ${orient.toLowerCase()} dégagée. (Surface indicative à rapprocher du lot sur plan autorisé).`,
          pointsForts: [
            `${immConfig.blocName} (RDC à R+3 · ${immConfig.appartParEtage} appts/étage courant)`,
            `Orientation ${orient} sans vis-à-vis`,
            `Place de parking sous-sol attribuée n°${aptGlobalIndex} (sur 230 places)`,
            'Ascenseur Schindler depuis le sous-sol (-2,70 m)',
            'Carrelage grand format & menuiserie aluminium double vitrage',
          ],
          pieces: pieces,
          reservedBy:
            lotId === 'APP-B204'
              ? {
                  nom: 'Mme. Karima El Fassi',
                  cin: 'BK628901',
                  date: '15/01/2026',
                }
              : undefined,
        });
      }
    });
  });

  return lots;
}

export const INITIAL_LOTS = generateAllLots();

export const INITIAL_IMMEUBLES_AVANCEMENT: ImmeubleAvancement[] = [
  {
    immeuble: 'A',
    blocName: 'Immeuble A',
    nbAppartements: 12,
    nbMagasins: 3,
    tauxGlobal: 82,
    etapeActuelle: 'Revêtements Marbre, Menuiserie Alu & Peinture',
    dateDerniereMaj: '25/10/2026',
    responsableBloc: 'Ing. Karim Mansouri · Chef de Lot A/B',
    observations: 'Façade front de mer terminée à 95%. Pose des garde-corps vitrés et habillage des 3 magasins RDC en cours.',
    etapes: [
      { id: 'A-1', nom: '1. Terrassement, Sous-Sol & Fondations', taux: 100, statut: 'Terminé', dateMaj: '10/02/2026' },
      { id: 'A-2', nom: '2. Gros Œuvre & Structure Béton Armé R+3', taux: 100, statut: 'Terminé', dateMaj: '15/05/2026' },
      { id: 'A-3', nom: '3. Étanchéité Toiture-Terrasse & Isolation', taux: 100, statut: 'Terminé', dateMaj: '20/07/2026' },
      { id: 'A-4', nom: '4. Cloisonnement, Enduits & Plâtrerie', taux: 95, statut: 'Terminé', dateMaj: '02/09/2026' },
      { id: 'A-5', nom: '5. Plomberie, Électricité & Pré-installation Clim', taux: 88, statut: 'En cours', dateMaj: '12/10/2026' },
      { id: 'A-6', nom: '6. Revêtements Sols Marbre & Carrelage', taux: 76, statut: 'En cours', dateMaj: '22/10/2026' },
      { id: 'A-7', nom: '7. Menuiserie Aluminium, Bois & Cuisines', taux: 65, statut: 'En cours', dateMaj: '25/10/2026' },
      { id: 'A-8', nom: '8. Peinture Finale, Ascenseur & Nettoyage', taux: 32, statut: 'En cours', dateMaj: '25/10/2026' },
    ],
  },
  {
    immeuble: 'B',
    blocName: 'Immeuble B',
    nbAppartements: 25,
    nbMagasins: 3,
    tauxGlobal: 79,
    etapeActuelle: 'Revêtements Sols, Menuiserie Alu & Appartement Témoin',
    dateDerniereMaj: '25/10/2026',
    responsableBloc: 'Ing. Karim Mansouri · Chef de Lot A/B',
    observations: 'Appartement témoin au RDC achevé à 100%. Pose du marbre dans le hall et carrelage aux 2e et 3e étages.',
    etapes: [
      { id: 'B-1', nom: '1. Terrassement, Sous-Sol & Fondations', taux: 100, statut: 'Terminé', dateMaj: '15/02/2026' },
      { id: 'B-2', nom: '2. Gros Œuvre & Structure Béton Armé R+3', taux: 100, statut: 'Terminé', dateMaj: '25/05/2026' },
      { id: 'B-3', nom: '3. Étanchéité Toiture-Terrasse & Isolation', taux: 100, statut: 'Terminé', dateMaj: '28/07/2026' },
      { id: 'B-4', nom: '4. Cloisonnement, Enduits & Plâtrerie', taux: 92, statut: 'Terminé', dateMaj: '10/09/2026' },
      { id: 'B-5', nom: '5. Plomberie, Électricité & Pré-installation Clim', taux: 84, statut: 'En cours', dateMaj: '15/10/2026' },
      { id: 'B-6', nom: '6. Revêtements Sols Marbre & Carrelage', taux: 72, statut: 'En cours', dateMaj: '23/10/2026' },
      { id: 'B-7', nom: '7. Menuiserie Aluminium, Bois & Cuisines', taux: 60, statut: 'En cours', dateMaj: '25/10/2026' },
      { id: 'B-8', nom: '8. Peinture Finale, Ascenseur & Nettoyage', taux: 24, statut: 'En cours', dateMaj: '25/10/2026' },
    ],
  },
  {
    immeuble: 'C',
    blocName: 'Immeuble C',
    nbAppartements: 37,
    nbMagasins: 0,
    tauxGlobal: 74,
    etapeActuelle: 'Plomberie, Électricité & Pose Carrelage Étages 1-2',
    dateDerniereMaj: '24/10/2026',
    responsableBloc: 'Ing. Youssef El Idrissi · Chef de Lot C/D',
    observations: 'Plus grand bâtiment côté jardin central (37 appartements). Étanchéité 100% réceptive, gaines techniques terminées.',
    etapes: [
      { id: 'C-1', nom: '1. Terrassement, Sous-Sol & Fondations', taux: 100, statut: 'Terminé', dateMaj: '20/02/2026' },
      { id: 'C-2', nom: '2. Gros Œuvre & Structure Béton Armé R+3', taux: 100, statut: 'Terminé', dateMaj: '01/06/2026' },
      { id: 'C-3', nom: '3. Étanchéité Toiture-Terrasse & Isolation', taux: 95, statut: 'Terminé', dateMaj: '05/08/2026' },
      { id: 'C-4', nom: '4. Cloisonnement, Enduits & Plâtrerie', taux: 88, statut: 'En cours', dateMaj: '18/09/2026' },
      { id: 'C-5', nom: '5. Plomberie, Électricité & Pré-installation Clim', taux: 78, statut: 'En cours', dateMaj: '19/10/2026' },
      { id: 'C-6', nom: '6. Revêtements Sols Marbre & Carrelage', taux: 62, statut: 'En cours', dateMaj: '24/10/2026' },
      { id: 'C-7', nom: '7. Menuiserie Aluminium, Bois & Cuisines', taux: 50, statut: 'En cours', dateMaj: '24/10/2026' },
      { id: 'C-8', nom: '8. Peinture Finale, Ascenseur & Nettoyage', taux: 19, statut: 'En cours', dateMaj: '24/10/2026' },
    ],
  },
  {
    immeuble: 'D',
    blocName: 'Immeuble D',
    nbAppartements: 16,
    nbMagasins: 0,
    tauxGlobal: 71,
    etapeActuelle: 'Cloisonnement, Fluides & Chapes Carrelage',
    dateDerniereMaj: '24/10/2026',
    responsableBloc: 'Ing. Youssef El Idrissi · Chef de Lot C/D',
    observations: 'Immeuble intimiste de 16 appartements (4 par niveau). Faux-plafonds plâtre et cadres aluminium en cours de pose.',
    etapes: [
      { id: 'D-1', nom: '1. Terrassement, Sous-Sol & Fondations', taux: 100, statut: 'Terminé', dateMaj: '25/02/2026' },
      { id: 'D-2', nom: '2. Gros Œuvre & Structure Béton Armé R+3', taux: 100, statut: 'Terminé', dateMaj: '05/06/2026' },
      { id: 'D-3', nom: '3. Étanchéité Toiture-Terrasse & Isolation', taux: 90, statut: 'Terminé', dateMaj: '14/08/2026' },
      { id: 'D-4', nom: '4. Cloisonnement, Enduits & Plâtrerie', taux: 85, statut: 'En cours', dateMaj: '25/09/2026' },
      { id: 'D-5', nom: '5. Plomberie, Électricité & Pré-installation Clim', taux: 74, statut: 'En cours', dateMaj: '20/10/2026' },
      { id: 'D-6', nom: '6. Revêtements Sols Marbre & Carrelage', taux: 55, statut: 'En cours', dateMaj: '24/10/2026' },
      { id: 'D-7', nom: '7. Menuiserie Aluminium, Bois & Cuisines', taux: 48, statut: 'En cours', dateMaj: '24/10/2026' },
      { id: 'D-8', nom: '8. Peinture Finale, Ascenseur & Nettoyage', taux: 16, statut: 'En attente', dateMaj: '24/10/2026' },
    ],
  },
  {
    immeuble: 'E',
    blocName: 'Immeuble E',
    nbAppartements: 42,
    nbMagasins: 0,
    tauxGlobal: 65,
    etapeActuelle: 'Enduits Intérieurs, Électricité & Plomberie (42 lots)',
    dateDerniereMaj: '23/10/2026',
    responsableBloc: 'Ing. Hassan Berrada · Chef de Lot E/F',
    observations: 'Immeuble E (42 appartements). Gros œuvre 100% achevé, équipes doublées sur les lots secondaires et colonnes montantes.',
    etapes: [
      { id: 'E-1', nom: '1. Terrassement, Sous-Sol & Fondations', taux: 100, statut: 'Terminé', dateMaj: '01/03/2026' },
      { id: 'E-2', nom: '2. Gros Œuvre & Structure Béton Armé R+3', taux: 100, statut: 'Terminé', dateMaj: '10/06/2026' },
      { id: 'E-3', nom: '3. Étanchéité Toiture-Terrasse & Isolation', taux: 85, statut: 'En cours', dateMaj: '25/08/2026' },
      { id: 'E-4', nom: '4. Cloisonnement, Enduits & Plâtrerie', taux: 80, statut: 'En cours', dateMaj: '02/10/2026' },
      { id: 'E-5', nom: '5. Plomberie, Électricité & Pré-installation Clim', taux: 65, statut: 'En cours', dateMaj: '22/10/2026' },
      { id: 'E-6', nom: '6. Revêtements Sols Marbre & Carrelage', taux: 45, statut: 'En cours', dateMaj: '23/10/2026' },
      { id: 'E-7', nom: '7. Menuiserie Aluminium, Bois & Cuisines', taux: 35, statut: 'En cours', dateMaj: '23/10/2026' },
      { id: 'E-8', nom: '8. Peinture Finale, Ascenseur & Nettoyage', taux: 10, statut: 'En attente', dateMaj: '23/10/2026' },
    ],
  },
  {
    immeuble: 'F',
    blocName: 'Immeuble F',
    nbAppartements: 30,
    nbMagasins: 3,
    tauxGlobal: 63,
    etapeActuelle: 'Étanchéité, Plâtrerie & Réseaux techniques + 3 Magasins',
    dateDerniereMaj: '23/10/2026',
    responsableBloc: 'Ing. Hassan Berrada · Chef de Lot E/F',
    observations: '30 appartements + 3 magasins commerciaux sur boulevard. Structure béton 100% réceptionnée par Bureau Veritas.',
    etapes: [
      { id: 'F-1', nom: '1. Terrassement, Sous-Sol & Fondations', taux: 100, statut: 'Terminé', dateMaj: '05/03/2026' },
      { id: 'F-2', nom: '2. Gros Œuvre & Structure Béton Armé R+3', taux: 100, statut: 'Terminé', dateMaj: '15/06/2026' },
      { id: 'F-3', nom: '3. Étanchéité Toiture-Terrasse & Isolation', taux: 80, statut: 'En cours', dateMaj: '05/09/2026' },
      { id: 'F-4', nom: '4. Cloisonnement, Enduits & Plâtrerie', taux: 76, statut: 'En cours', dateMaj: '08/10/2026' },
      { id: 'F-5', nom: '5. Plomberie, Électricité & Pré-installation Clim', taux: 62, statut: 'En cours', dateMaj: '22/10/2026' },
      { id: 'F-6', nom: '6. Revêtements Sols Marbre & Carrelage', taux: 42, statut: 'En cours', dateMaj: '23/10/2026' },
      { id: 'F-7', nom: '7. Menuiserie Aluminium, Bois & Cuisines', taux: 34, statut: 'En cours', dateMaj: '23/10/2026' },
      { id: 'F-8', nom: '8. Peinture Finale, Ascenseur & Nettoyage', taux: 10, statut: 'En attente', dateMaj: '23/10/2026' },
    ],
  },
];

export const INITIAL_CAMERAS_SURVEILLANCE: CameraSurveillanceItem[] = [
  {
    id: 'cam-1',
    code: 'CAM-01',
    nom: 'Façade Principale & Front de Mer',
    zone: 'Entrée Principale · Boulevard Côtiers Mansouria',
    immeublesCouverts: 'Immeubles A & B + Magasins 1 à 6',
    streamUrl: '/assets/aistudio/VIDEO-2026-08-30-17-02-51_abd5fb63.mp4',
    resolution: '4K UHD',
    statut: 'En direct 24/7',
    visionNocturne: false,
    anglePtz: 'Azimut 115° · Zoom 1.0x',
  },
  {
    id: 'cam-2',
    code: 'CAM-02',
    nom: 'Piscine Centrale & Jardins Paysagers',
    zone: 'Cœur d’Îlot · Esplanade Piscine (11 841 m²)',
    immeublesCouverts: 'Immeubles C & D · Vue Panoramique',
    streamUrl: '/assets/aistudio/VIDEO-2026-08-30-17-02-58_8210e145.mp4',
    resolution: '4K UHD',
    statut: 'En direct 24/7',
    visionNocturne: false,
    anglePtz: 'Azimut 210° · Zoom 1.2x',
  },
  {
    id: 'cam-3',
    code: 'CAM-03',
    nom: 'Zone Travaux Finitions & Intérieurs',
    zone: 'Aile Sud-Est & Halls Résidentiels',
    immeublesCouverts: 'Immeubles E & F (72 Appartements)',
    streamUrl: '/assets/aistudio/VIDEO-2026-08-30-17-02-59_2a6e36c0.mp4',
    resolution: '1080p Full HD',
    statut: 'En direct 24/7',
    visionNocturne: false,
    anglePtz: 'Azimut 45° · Zoom 1.0x',
  },
  {
    id: 'cam-4',
    code: 'CAM-04',
    nom: 'Accès Logistique, Sous-Sol & Magasins',
    zone: 'Rampe Parking Sous-Sol (230 places / 7 500 m²)',
    immeublesCouverts: 'Sous-Sol Général & Magasins 7 à 9 (Immeuble F)',
    streamUrl: '/assets/aistudio/VIDEO-2026-08-30-17-03-01_84430d95.mp4',
    resolution: '1080p Full HD',
    statut: 'En direct 24/7',
    visionNocturne: false,
    anglePtz: 'Azimut 300° · Zoom 1.0x',
  },
];

// Chantier Data
export const INITIAL_CHANTIER: ChantierAvancement = {
  globalPourcentage: 72,
  dateDerniereVisiteBet: '22 Octobre 2026',
  bureauControle: 'Bureau Veritas Maroc & BET SOCOTEC',
  architecte: 'Cabinet d Architecture El Atouani Mohamed Amine & ARK Architect',
  immeublesAvancement: INITIAL_IMMEUBLES_AVANCEMENT,
  camerasSurveillance: INITIAL_CAMERAS_SURVEILLANCE,
  corpsDEtat: [
    {
      nom: 'Gros Œuvre & Béton Armé (6 Immeubles A à F + Sous-Sol 7 500 m²)',
      responsable: 'Ste Générale de Bâtiment Ouest',
      pourcentage: 100,
      statut: 'Terminé',
      dateFinPrevue: '15 Juin 2026',
      details: 'Structures BA des 6 immeubles (A, B, C, D, E, F en R+3) et sous-sol (230 places) intégralement réceptionnées (21 780 m² bâtis).'
    },
    {
      nom: 'Étanchéité & Terrasses',
      responsable: 'Pro-Étanchéité Maroc',
      pourcentage: 88,
      statut: 'En cours',
      dateFinPrevue: '10 Novembre 2026',
      details: 'Étanchéité bicouche élastomère terminée sur les Immeubles A, B, C, D et E. Test de mise en eau concluant.'
    },
    {
      nom: 'Plomberie & Évacuation Sanitaire',
      responsable: 'AquaTherm Fluides',
      pourcentage: 74,
      statut: 'En cours',
      dateFinPrevue: '30 Novembre 2026',
      details: 'Canalisations PER et colonnes montantes des 162 appartements et 9 magasins prêtes au raccordement.'
    },
    {
      nom: 'Électricité & Pré-câblage Fibre Optique',
      responsable: 'Electro-Tech Mansouria',
      pourcentage: 70,
      statut: 'En cours',
      dateFinPrevue: '15 Décembre 2026',
      details: 'Passage des gaines, tableaux divisionnaires Schneider Electric et réservation domotique pour les 162 logements.'
    },
    {
      nom: 'Menuiserie Aluminium & Double Vitrage',
      responsable: 'Alumil Maroc Systèmes',
      pourcentage: 62,
      statut: 'En cours',
      dateFinPrevue: '20 Janvier 2027',
      details: 'Profilés aluminium à rupture de pont thermique et double vitrage isolant phonique/thermique.'
    },
    {
      nom: 'Revêtements Sols & Murs (Marbre & Carrelage)',
      responsable: 'Déco Ceram & Granit',
      pourcentage: 58,
      statut: 'En cours',
      dateFinPrevue: '15 Février 2027',
      details: 'Marbre dans les halls d accueil des 6 immeubles (A à F) et carrelage rectifié dans les appartements.'
    },
    {
      nom: 'Piscine Centrale, Jardins Paysagers & Clôture (Terrain 11 841 m²)',
      responsable: 'Jardins d Océan SARL',
      pourcentage: 45,
      statut: 'En cours',
      dateFinPrevue: '30 Mars 2027',
      details: 'Bassin de la grande piscine centrale coulé. Plantation des palmiers et aménagement sur l assiette foncière de 11 841 m².'
    }
  ],
  photosRecentes: [
    {
      titre: 'Pose des façades et baies vitrées Immeubles B & C',
      date: '20 Octobre 2026',
      zone: 'Immeubles B & C - Étage 2 & 3',
      description: 'Validation de la teinte blanc nacré et pose des garde-corps vitrés trempés face océan.'
    },
    {
      titre: 'Coulage du bassin de la piscine centrale',
      date: '14 Octobre 2026',
      zone: 'Espace Central Paysager',
      description: 'Bétonnage hydrofuge du grand bassin de nage central entouré des 6 immeubles A à F.'
    },
    {
      titre: 'Installation des ascenseurs Schindler (Sous-sol à R+3)',
      date: '08 Octobre 2026',
      zone: 'Immeubles A à F',
      description: 'Montage des machineries d ascenseur avec accès direct depuis les 230 places de parking sous-sol.'
    },
    {
      titre: 'Appartement témoin entièrement aménagé',
      date: '01 Octobre 2026',
      zone: 'Immeuble B - RDC',
      description: 'Visite possible pour les adhérents et acquéreurs : cuisine intégrée, marbre et éclairage LED.'
    }
  ]
};

// Tresorerie Data
export const INITIAL_TRESORERIE: TresorerieAmicale = {
  totalCollecte: 84620000, // in MAD
  totalDepenses: 62450000,
  soldeActuelBanque: 22170000,
  totalImpayesRelances: 3450000,
  banquePartenaire: 'Attijariwafa Bank - Agence Mohammedia Kasbah',
  ribAmicale: '007 780 0001234567890123 45',
  transactions: [
    {
      id: 'TRX-1092',
      date: '24/10/2026',
      libelle: 'Versement Tranche 2 - Adhérent B104 (Driss Bennani)',
      categorie: 'Cotisation Adhérent',
      type: 'Entrée',
      montant: 215000,
      referencePiece: 'VIR-ATW-99214',
      statut: 'Rapproché'
    },
    {
      id: 'TRX-1091',
      date: '22/10/2026',
      libelle: 'Situation n°14 - Ste Générale de Bâtiment Ouest (Finition)',
      categorie: 'Entreprise BTP',
      type: 'Sortie',
      montant: 1850000,
      referencePiece: 'CHQ-882310',
      statut: 'Rapproché'
    },
    {
      id: 'TRX-1090',
      date: '18/10/2026',
      libelle: 'Honoraires BET & Contrôle Technique Bureau Veritas',
      categorie: 'Bureau Contrôle/BET',
      type: 'Sortie',
      montant: 145000,
      referencePiece: 'VIR-VERITAS-2026-10',
      statut: 'Rapproché'
    },
    {
      id: 'TRX-1089',
      date: '15/10/2026',
      libelle: 'Versement Acompte Réservation Magasin MAG-07',
      categorie: 'Cotisation Adhérent',
      type: 'Entrée',
      montant: 670000,
      referencePiece: 'VIR-BMCE-5510',
      statut: 'Rapproché'
    },
    {
      id: 'TRX-1088',
      date: '10/10/2026',
      libelle: 'Acompte Entreprise Peinture & Ravalement Extérieur',
      categorie: 'Entreprise BTP',
      type: 'Sortie',
      montant: 420000,
      referencePiece: 'CHQ-882309',
      statut: 'Rapproché'
    },
    {
      id: 'TRX-1087',
      date: '04/10/2026',
      libelle: 'Assurance Chantier Tous Risques (TRC) AXA Assurance',
      categorie: 'Frais Administratifs',
      type: 'Sortie',
      montant: 85000,
      referencePiece: 'VIR-AXA-TRC-44',
      statut: 'Rapproché'
    }
  ]
};

// Meetings Data
export const INITIAL_REUNIONS: ReunionItem[] = [
  {
    id: 'REU-2026-04',
    titre: 'Assemblée Générale Ordinaire 2026 des Adhérents',
    type: 'Assemblée Générale Ordinaire',
    date: '15 Novembre 2026',
    heure: '10:00',
    lieu: 'Hôtel Novotel Mohammedia & Retransmission Live Zoom',
    ordreDuJour: [
      '1. Présentation du rapport moral par le Président du Bureau Exécutif',
      '2. Rapport financier et approbation des comptes arrêtés au 30/09/2026',
      '3. Point d avancement détaillé du chantier et calendrier de livraison 2027',
      '4. Validation du choix des matériaux de finition des parties communes',
      '5. Approbation de la convention de syndic de copropriété post-livraison'
    ],
    quorumAtteint: true,
    tauxPresence: 86,
    decisions: [
      'Convocation officielle envoyée par lettre recommandée et notification mobile',
      'Documents financiers et PV provisoire mis à disposition dans la GED'
    ],
    pvRef: 'PV-AG-EBLA-2026-ORD.pdf',
    statut: 'Programmée'
  },
  {
    id: 'REU-2026-03',
    titre: 'Réunion Mensuelle du Bureau Exécutif avec l Architecte et le BET',
    type: 'Réunion Bureau Exécutif',
    date: '10 Octobre 2026',
    heure: '15:30',
    lieu: 'Bureau de Chantier Ebla Two - Mansouria',
    ordreDuJour: [
      'Validation des échantillons d aluminium anodisé pour les balcons',
      'Examen des demandes de modifications intérieures exprimées par 8 adhérents',
      'Coordination avec la Régie Lydec / Redal pour le raccordement électrique MT',
      'Suivi des encaissements de la tranche 2'
    ],
    quorumAtteint: true,
    tauxPresence: 100,
    decisions: [
      'Adoption à l unanimité du profilé aluminium 70mm à rupture thermique',
      'Autorisation de 5 modifications de cloisons validées par l ingénieur conseil',
      'Envoi des mises en demeure pour 4 adhérents en retard de paiement'
    ],
    pvRef: 'PV-BUREAU-2026-10-SIGNE.pdf',
    statut: 'Clôturée'
  },
  {
    id: 'REU-2026-02',
    titre: 'Comité Technique de Validation des Titres Fonciers et Bornage',
    type: 'Comité Chantier & BET',
    date: '12 Septembre 2026',
    heure: '11:00',
    lieu: 'Étude Notariale Me. Amrani (Casablanca)',
    ordreDuJour: [
      'Avancement du dossier de morcellement à la Conservation Foncière de Benslimane / Mohammedia',
      'Plan cadastral d éclatement des 162 titres parcellaires (Immeubles A à F) et 9 magasins',
      'Règlement de copropriété provisoire de l amicale'
    ],
    quorumAtteint: true,
    tauxPresence: 95,
    decisions: [
      'Dépôt officiel du dossier cadastral validé par l ingénieur géomètre topographe',
      'Obtention programmée des réquisitions parcellaires'
    ],
    pvRef: 'PV-FONCIER-NOTAIRE-SEPT2026.pdf',
    statut: 'Clôturée'
  }
];

// Tasks for Bureau
export const INITIAL_TACHES: TacheBureau[] = [
  {
    id: 'TSK-01',
    titre: 'Validation finale du marbre des halls d entrée Bloc A et B',
    responsable: 'Dr. Mohammed Tazi (Président)',
    priorite: 'Haute',
    statut: 'En cours',
    echeance: '28/10/2026',
    categorie: 'Chantier'
  },
  {
    id: 'TSK-02',
    titre: 'Envoi des convocations formelles pour l Assemblée Générale du 15/11',
    responsable: 'M. Adil Chraibi (Secrétaire Général)',
    priorite: 'Haute',
    statut: 'En cours',
    echeance: '30/10/2026',
    categorie: 'Communication'
  },
  {
    id: 'TSK-03',
    titre: 'Clôture de l arrêté des comptes de trésorerie au 30 Septembre',
    responsable: 'Mme. Nadia Bennis (Trésorière)',
    priorite: 'Haute',
    statut: 'Validé',
    echeance: '20/10/2026',
    categorie: 'Comptabilité'
  },
  {
    id: 'TSK-04',
    titre: 'Contrôle des conventions de réservation pour 3 nouveaux adhérents',
    responsable: 'Me. El Ouali (Conseiller Juridique)',
    priorite: 'Moyenne',
    statut: 'En cours',
    echeance: '02/11/2026',
    categorie: 'Juridique'
  },
  {
    id: 'TSK-05',
    titre: 'Visite de conformité des réseaux d assainissement avec la Commune',
    responsable: 'Ing. Karim Mansouri (Responsable Suivi Chantier)',
    priorite: 'Moyenne',
    statut: 'À faire',
    echeance: '05/11/2026',
    categorie: 'Chantier'
  }
];

// Demo Adhérent Account (Mme. Karima El Fassi, App B204 F3)
export const DEMO_ADHERENT: AdherentProfile = {
  id: 'ADH-2026-088',
  nomComplet: 'Mme. Karima El Fassi',
  cin: 'BK628901',
  email: 'adherent@eblatwo.ma',
  telephone: '+212 6 61 45 78 90',
  ville: 'Mohammedia / Casablanca',
  dateAdhesion: '15 Janvier 2026',
  lotAttribueId: 'APP-B204',
  pourcentageAvancementPersonnel: 79,
  contratAchatSigne: true,
  dateSignatureContratAchat: '02 Février 2026',
  notaireInstrumentaire: 'Étude Notariale Me. Amrani (Casablanca / Mohammedia)',
  echeancier: [
    {
      id: 'ECH-01',
      numeroTranche: 1,
      libelle: 'Tranche 1 - Adhésion & Réservation (25%)',
      pourcentage: 25,
      montant: 247000,
      dateEcheance: '15/01/2026',
      statut: 'Payé',
      quittanceNumero: 'QUIT-EBLA-2026-0042',
      datePaiement: '18/01/2026',
      modePaiement: 'Virement bancaire Attijariwafa'
    },
    {
      id: 'ECH-02',
      numeroTranche: 2,
      libelle: 'Tranche 2 - Achèvement Gros Œuvre & Dalle (25%)',
      pourcentage: 25,
      montant: 247000,
      dateEcheance: '20/06/2026',
      statut: 'Payé',
      quittanceNumero: 'QUIT-EBLA-2026-0158',
      datePaiement: '24/06/2026',
      modePaiement: 'Chèque certifié BMCE'
    },
    {
      id: 'ECH-03',
      numeroTranche: 3,
      libelle: 'Tranche 3 - Finitions, Aluminium & Étanchéité (25%)',
      pourcentage: 25,
      montant: 247000,
      dateEcheance: '15/11/2026',
      statut: 'En cours',
      modePaiement: 'En attente d appel de fonds'
    },
    {
      id: 'ECH-04',
      numeroTranche: 4,
      libelle: 'Tranche 4 - Remise des clés & Titre Foncier (25%)',
      pourcentage: 25,
      montant: 247000,
      dateEcheance: '30/03/2027',
      statut: 'À venir'
    }
  ],
  documents: [
    {
      id: 'DOC-CIN-01',
      titre: 'Copie CIN Légalisée Recto/Verso (N° BK628901)',
      categorie: 'CIN',
      date: '15/01/2026',
      taille: '1.1 Mo',
      fichierRef: 'CIN_BK628901_EL_FASSI.pdf',
      modeAjout: 'Caméra',
      statutVerification: 'Vérifié',
      contenuTexte: 'Carte Nationale d Identité Electronique N° BK628901 au nom de Mme Karima El Fassi, vérifiée conforme à l original.'
    },
    {
      id: 'DOC-RES-01',
      titre: 'Contrat de Réservation & Affectation Lot APP-B204 (Immeuble B)',
      categorie: 'Contrat de réservation',
      date: '16/01/2026',
      taille: '2.1 Mo',
      fichierRef: 'CONTRAT_RESERVATION_APP_B204.pdf',
      modeAjout: 'Téléchargement',
      statutVerification: 'Signé & Certifié',
      contenuTexte: 'Contrat de réservation provisoire du Lot APP-B204 (Immeuble B, 2e étage) avec versement de la 1ère tranche de 247 000 DH.'
    },
    {
      id: 'DOC-ACHAT-01',
      titre: 'Contrat d’Achat Définitif & Attribution Notariée (Lot APP-B204 + Parking n°34)',
      categorie: "Contrat d'achat",
      date: '02/02/2026',
      taille: '3.4 Mo',
      fichierRef: 'CONTRAT_ACHAT_NOTARIE_APP_B204.pdf',
      modeAjout: 'Téléchargement',
      statutVerification: 'Signé & Certifié',
      contenuTexte: 'Contrat d achat et d adhésion définitive signé par-devant Me. Amrani, attribuant l appartement APP-B204 et la place de parking sous-sol n°34.'
    },
    {
      id: 'DOC-CORR-01',
      titre: 'Correspondance du Président : Confirmation Choix Marbre & Cuisine Lot B204',
      categorie: 'Correspondances',
      date: '12/09/2026',
      taille: '540 Ko',
      fichierRef: 'CORRESPONDANCE_BUREAU_APP_B204.pdf',
      modeAjout: 'Saisie directe',
      statutVerification: 'Signé & Certifié',
      contenuTexte: 'Courrier officiel du Président confirmant la prise en compte des finitions personnalisées pour le salon et la cuisine de l appartement APP-B204.'
    },
    {
      id: 'DOC-AUTRE-01',
      titre: 'Quittances Libératoires Tranches 1 & 2 (494 000 DH) + Plan Architecte Coté',
      categorie: 'Autres',
      date: '25/06/2026',
      taille: '4.2 Mo',
      fichierRef: 'QUITTANCES_ET_PLANS_APP_B204.pdf',
      modeAjout: 'Téléchargement',
      statutVerification: 'Signé & Certifié',
      contenuTexte: 'Dossier technique regroupant les quittances n°0042 et n°0158 validées par le Trésorier ainsi que le plan d architecte coté.'
    }
  ]
};

// Liste complète des Dossiers d'Adhérents Acquéreurs ayant signé leur Contrat d'Achat
export const INITIAL_ADHERENTS_DOSSIERS: AdherentProfile[] = [
  DEMO_ADHERENT,
  {
    id: 'ADH-2026-041',
    nomComplet: 'M. Driss Bennani',
    cin: 'BE741290',
    email: 'driss.bennani@gmail.com',
    telephone: '+212 6 61 20 33 44',
    ville: 'Rabat',
    dateAdhesion: '10 Février 2026',
    lotAttribueId: 'APP-A102',
    pourcentageAvancementPersonnel: 82,
    contratAchatSigne: true,
    dateSignatureContratAchat: '25 Février 2026',
    notaireInstrumentaire: 'Étude Notariale Me. Amrani (Casablanca / Mohammedia)',
    echeancier: [
      {
        id: 'ECH-DB-1',
        numeroTranche: 1,
        libelle: 'Tranche 1 - Adhésion & Réservation (25%)',
        pourcentage: 25,
        montant: 215000,
        dateEcheance: '10/02/2026',
        statut: 'Payé',
        quittanceNumero: 'QUIT-EBLA-2026-0061',
        datePaiement: '12/02/2026',
        modePaiement: 'Chèque certifié Attijariwafa'
      },
      {
        id: 'ECH-DB-2',
        numeroTranche: 2,
        libelle: 'Tranche 2 - Achèvement Gros Œuvre (25%)',
        pourcentage: 25,
        montant: 215000,
        dateEcheance: '24/10/2026',
        statut: 'Payé',
        quittanceNumero: 'QUIT-EBLA-2026-0192',
        datePaiement: '24/10/2026',
        modePaiement: 'Virement bancaire VIR-ATW-99214'
      },
      {
        id: 'ECH-DB-3',
        numeroTranche: 3,
        libelle: 'Tranche 3 - Finitions & Menuiserie (25%)',
        pourcentage: 25,
        montant: 215000,
        dateEcheance: '15/12/2026',
        statut: 'En cours'
      },
      {
        id: 'ECH-DB-4',
        numeroTranche: 4,
        libelle: 'Tranche 4 - Remise des clés & Titre Foncier (25%)',
        pourcentage: 25,
        montant: 215000,
        dateEcheance: '30/03/2027',
        statut: 'À venir'
      }
    ],
    documents: [
      {
        id: 'DOC-DB-CIN',
        titre: 'CIN Légalisée M. Driss Bennani (BE741290)',
        categorie: 'CIN',
        date: '10/02/2026',
        taille: '980 Ko',
        fichierRef: 'CIN_BE741290_BENNANI.jpg',
        modeAjout: 'Caméra',
        statutVerification: 'Vérifié',
        contenuTexte: 'Scan caméra haute résolution de la CIN N° BE741290.'
      },
      {
        id: 'DOC-DB-RES',
        titre: 'Contrat de Réservation Lot APP-A102 (Immeuble A)',
        categorie: 'Contrat de réservation',
        date: '10/02/2026',
        taille: '1.9 Mo',
        fichierRef: 'CONTRAT_RESERVATION_APP_A102.pdf',
        modeAjout: 'Téléchargement',
        statutVerification: 'Signé & Certifié'
      },
      {
        id: 'DOC-DB-ACHAT',
        titre: 'Contrat d’Achat Signé & Légalisé Lot APP-A102',
        categorie: "Contrat d'achat",
        date: '25/02/2026',
        taille: '3.1 Mo',
        fichierRef: 'CONTRAT_ACHAT_DEFINITIF_APP_A102.pdf',
        modeAjout: 'Téléchargement',
        statutVerification: 'Signé & Certifié'
      },
      {
        id: 'DOC-DB-CORR',
        titre: 'Notification d’Encaissement 2ème Tranche & Convocation AG',
        categorie: 'Correspondances',
        date: '24/10/2026',
        taille: '420 Ko',
        fichierRef: 'COURRIER_TRESORERIE_APP_A102.pdf',
        modeAjout: 'Saisie directe',
        statutVerification: 'Signé & Certifié'
      },
      {
        id: 'DOC-DB-AUT',
        titre: 'Plan Architectural Immeuble A & Attestation Parking Sous-Sol',
        categorie: 'Autres',
        date: '26/02/2026',
        taille: '2.7 Mo',
        fichierRef: 'PLAN_ET_PARKING_APP_A102.pdf',
        modeAjout: 'Téléchargement',
        statutVerification: 'Vérifié'
      }
    ]
  },
  {
    id: 'ADH-2026-105',
    nomComplet: 'Pharmacie Mansouria Santé (Dr. Sbihi)',
    cin: 'C341120',
    email: 'contact@pharmaciemansouria.ma',
    telephone: '+212 6 61 78 99 00',
    ville: 'Mansouria / Mohammedia',
    dateAdhesion: '21 Octobre 2026',
    lotAttribueId: 'MAG-02',
    pourcentageAvancementPersonnel: 82,
    contratAchatSigne: true,
    dateSignatureContratAchat: '23 Octobre 2026',
    notaireInstrumentaire: 'Étude Notariale Me. Amrani (Casablanca / Mohammedia)',
    echeancier: [
      {
        id: 'ECH-MS-1',
        numeroTranche: 1,
        libelle: 'Tranche 1 - Réservation & Contrat d’Achat Commercial (25%)',
        pourcentage: 25,
        montant: 260000,
        dateEcheance: '21/10/2026',
        statut: 'Payé',
        quittanceNumero: 'QUIT-EBLA-2026-0204',
        datePaiement: '21/10/2026',
        modePaiement: 'Chèque certifié Attijariwafa'
      },
      {
        id: 'ECH-MS-2',
        numeroTranche: 2,
        libelle: 'Tranche 2 - Aménagement Façade Vitrée RDC (25%)',
        pourcentage: 25,
        montant: 260000,
        dateEcheance: '15/12/2026',
        statut: 'En cours'
      },
      {
        id: 'ECH-MS-3',
        numeroTranche: 3,
        libelle: 'Tranche 3 - Raccordements & Mezzanine (25%)',
        pourcentage: 25,
        montant: 260000,
        dateEcheance: '30/01/2027',
        statut: 'À venir'
      },
      {
        id: 'ECH-MS-4',
        numeroTranche: 4,
        libelle: 'Tranche 4 - Remise des clés & Titre Foncier Commercial (25%)',
        pourcentage: 25,
        montant: 260000,
        dateEcheance: '30/03/2027',
        statut: 'À venir'
      }
    ],
    documents: [
      {
        id: 'DOC-MS-CIN',
        titre: 'CIN Dr. Sbihi (C341120) & RC Société Pharmacie Mansouria',
        categorie: 'CIN',
        date: '21/10/2026',
        taille: '1.4 Mo',
        fichierRef: 'CIN_ET_RC_PHARMACIE_MAG02.pdf',
        modeAjout: 'Téléchargement',
        statutVerification: 'Vérifié'
      },
      {
        id: 'DOC-MS-RES',
        titre: 'Contrat de Réservation Local Commercial MAG-02 (Immeuble A)',
        categorie: 'Contrat de réservation',
        date: '21/10/2026',
        taille: '2.0 Mo',
        fichierRef: 'CONTRAT_RESERVATION_MAG02.pdf',
        modeAjout: 'Téléchargement',
        statutVerification: 'Signé & Certifié'
      },
      {
        id: 'DOC-MS-ACHAT',
        titre: 'Contrat d’Achat Commercial Définitif MAG-02 (RDC Immeuble A)',
        categorie: "Contrat d'achat",
        date: '23/10/2026',
        taille: '3.6 Mo',
        fichierRef: 'CONTRAT_ACHAT_COMMERCIAL_MAG02.pdf',
        modeAjout: 'Téléchargement',
        statutVerification: 'Signé & Certifié'
      },
      {
        id: 'DOC-MS-CORR',
        titre: 'Autorisation du Bureau pour Enseigne Lumineuse Officine',
        categorie: 'Correspondances',
        date: '24/10/2026',
        taille: '390 Ko',
        fichierRef: 'AUTORISATION_ENSEIGNE_MAG02.pdf',
        modeAjout: 'Saisie directe',
        statutVerification: 'Signé & Certifié'
      },
      {
        id: 'DOC-MS-AUT',
        titre: 'Plan Technique RDC + Mezzanine MAG-02',
        categorie: 'Autres',
        date: '23/10/2026',
        taille: '2.9 Mo',
        fichierRef: 'PLAN_RDC_MAG02.png',
        modeAjout: 'Téléchargement',
        statutVerification: 'Vérifié'
      }
    ]
  }
];

// Documents Officiels du Bureau Exécutif classés par Rôle (Secrétaire Général, Trésorier, Président)
export const INITIAL_BUREAU_DOCUMENTS: BureauDocument[] = [
  // 1. Secrétaire Général : les PV, les doc du projet, les doc des adhérents, autres
  {
    id: 'BDOC-SG-01',
    titre: 'PV de la Réunion Mensuelle du Bureau Exécutif avec Architecte & BET',
    membreRole: 'Secrétaire Général',
    categorie: 'PV',
    modeAjout: 'Téléchargement',
    date: '10/10/2026',
    auteur: 'M. Adil Chraibi (Secrétaire Général)',
    taille: '1.8 Mo',
    fichierRef: 'PV-BUREAU-2026-10-SIGNE.pdf',
    referencePiece: 'PV-SG-2026/10',
    contenuTexte: 'Procès-verbal signé à l unanimité validant les échantillons d aluminium 70mm à rupture thermique pour les 6 immeubles A à F.'
  },
  {
    id: 'BDOC-SG-02',
    titre: 'Plans Autorisés Ne Varietur & Tableau de Contenance (162 Appartements + 9 Magasins)',
    membreRole: 'Secrétaire Général',
    categorie: 'Documents du projet',
    modeAjout: 'Téléchargement',
    date: '05/09/2026',
    auteur: 'M. Adil Chraibi (Secrétaire Général)',
    taille: '5.4 Mo',
    fichierRef: '/assets/aistudio/plans_autorise_s__2_-1_cd342e2d.png',
    dataUrl: '/assets/aistudio/plans_autorise_s__2_-1_cd342e2d.png',
    referencePiece: 'PRJ-PLANS-162',
    contenuTexte: 'Plans architecturaux autorisés par la Commune de Mansouria : 6 Immeubles R+3 (A à F), 162 appartements, 9 magasins et 230 places sous-sol.'
  },
  {
    id: 'BDOC-SG-03',
    titre: 'Registre Récapitulatif des Dossiers Adhérents & Affectations Lots A–F',
    membreRole: 'Secrétaire Général',
    categorie: 'Documents des adhérents',
    modeAjout: 'Saisie directe',
    date: '22/10/2026',
    auteur: 'M. Adil Chraibi (Secrétaire Général)',
    taille: '640 Ko',
    fichierRef: 'REGISTRE_ADHERENTS_OCT2026.pdf',
    referencePiece: 'SG-ADH-162',
    contenuTexte: 'Vérification complète des pièces CIN, contrats de réservation et contrats d achat signés pour les adhérents des Immeubles A à F.'
  },
  // 2. Trésorier : avis d'opérations, chèques émis ou reçus, doc de comptabilité, autres
  {
    id: 'BDOC-TR-01',
    titre: 'Avis d’Opération Virement Attijariwafa - Tranche 2 Lot APP-A102 (215 000 DH)',
    membreRole: 'Trésorier',
    categorie: "Avis d'opérations",
    modeAjout: 'Caméra',
    date: '24/10/2026',
    auteur: 'Mme. Nadia Bennis (Trésorière)',
    taille: '920 Ko',
    fichierRef: 'AVIS_OP_VIR_ATW_99214.jpg',
    referencePiece: 'VIR-ATW-99214',
    montant: 215000,
    adherentCibleId: 'ADH-2026-041',
    contenuTexte: 'Avis de crédit bancaire Attijariwafa Bank Mohammedia Kasbah de 215 000,00 MAD reçu de M. Driss Bennani (Lot APP-A102).'
  },
  {
    id: 'BDOC-TR-02',
    titre: 'Copie Chèque Certifié Émis N° 882310 - Situation n°14 BTP (1 850 000 DH)',
    membreRole: 'Trésorier',
    categorie: 'Chèques émis ou reçus',
    modeAjout: 'Caméra',
    date: '22/10/2026',
    auteur: 'Mme. Nadia Bennis (Trésorière)',
    taille: '1.2 Mo',
    fichierRef: 'CHEQUE_EMIS_882310_SGBO.jpg',
    referencePiece: 'CHQ-882310',
    montant: 1850000,
    contenuTexte: 'Chèque barré certifié émis au profit de la Sté Générale de Bâtiment Ouest en règlement du décompte provisoire n°14 dûment visé par le BET.'
  },
  {
    id: 'BDOC-TR-03',
    titre: 'Bilan Comptable Trimestriel T3-2026 & État de Rapprochement Bancaire',
    membreRole: 'Trésorier',
    categorie: 'Documents de comptabilité',
    modeAjout: 'Téléchargement',
    date: '30/09/2026',
    auteur: 'Mme. Nadia Bennis (Trésorière)',
    taille: '2.6 Mo',
    fichierRef: 'BILAN_COMPTABLE_T3_2026_EBLA.pdf',
    referencePiece: 'COMPTA-2026-T3',
    montant: 22170000,
    contenuTexte: 'Arrêté des comptes au 30/09/2026 certifié par le commissaire aux comptes : Solde disponible en banque 22 170 000 MAD.'
  },
  // 3. Président : les correspondances, les doc administratifs, les convocations, autres
  {
    id: 'BDOC-PR-01',
    titre: 'Convocation Officielle à l’Assemblée Générale Ordinaire du 15 Novembre 2026',
    membreRole: 'Président',
    categorie: 'Convocations',
    modeAjout: 'Saisie directe',
    date: '20/10/2026',
    auteur: 'Dr. Mohammed Tazi (Président)',
    taille: '480 Ko',
    fichierRef: 'CONVOCATION_AGO_15_NOV_2026.pdf',
    referencePiece: 'CONV-PR-2026-04',
    contenuTexte: 'Mesdames et Messieurs les Adhérents de l Amicale Résidence Ebla Two, vous êtes cordialement convoqués à l Assemblée Générale Ordinaire le 15 Novembre 2026 à 10h00 à l Hôtel Novotel Mohammedia.'
  },
  {
    id: 'BDOC-PR-02',
    titre: 'Autorisation de Construire & Certificat de Propriété Foncier (11 841 m²)',
    membreRole: 'Président',
    categorie: 'Documents administratifs',
    modeAjout: 'Téléchargement',
    date: '14/01/2026',
    auteur: 'Dr. Mohammed Tazi (Président)',
    taille: '3.9 Mo',
    fichierRef: '/assets/aistudio/PLAN_CADASTRAL_EBLA_ONE-1_4efc9c99.png',
    dataUrl: '/assets/aistudio/PLAN_CADASTRAL_EBLA_ONE-1_4efc9c99.png',
    referencePiece: 'ADM-PERMIS-EBLA',
    contenuTexte: 'Autorisation de construire délivrée par la Commune de Mansouria et plan cadastral officiel de l assiette foncière de 11 841 m².'
  },
  {
    id: 'BDOC-PR-03',
    titre: 'Correspondance Officielle à la Régie Lydec / Redal - Raccordement MT & Eau Potable',
    membreRole: 'Président',
    categorie: 'Correspondances',
    modeAjout: 'Saisie directe',
    date: '16/10/2026',
    auteur: 'Dr. Mohammed Tazi (Président)',
    taille: '510 Ko',
    fichierRef: 'COURRIER_PRESIDENCE_RACCORDEMENT_MT.pdf',
    referencePiece: 'CORR-PR-2026-18',
    contenuTexte: 'Demande officielle de planification des travaux de branchement moyenne tension et alimentation en eau potable pour les 162 logements et 9 commerces.'
  }
];

// Initial Visits
export const INITIAL_VISITES: VisiteRdv[] = [
  {
    id: 'VIS-301',
    nomVisiteur: 'Taha Berrada',
    telephone: '+212 6 70 12 34 56',
    email: 'taha.berrada@gmail.com',
    date: '28/10/2026',
    creneau: '14:30',
    typeVisite: 'Sur site Mansouria',
    statut: 'Confirmée',
    lotInteresseId: 'APP-A302',
    conseillerAssigne: 'Yassine Berrada'
  },
  {
    id: 'VIS-302',
    nomVisiteur: 'Leila Amrani (MRE France)',
    telephone: '+33 6 45 89 12 30',
    email: 'l.amrani@wanadoo.fr',
    date: '31/10/2026',
    creneau: '16:00',
    typeVisite: 'Visite virtuelle 3D guidée',
    statut: 'Confirmée',
    lotInteresseId: 'APP-C201',
    conseillerAssigne: 'Yassine Berrada'
  }
];

// Initial Reservations submitted
export const INITIAL_RESERVATIONS: ReservationDemande[] = [
  {
    id: 'RES-901',
    lotId: 'APP-D102',
    nomClient: 'Omar Kabbaj',
    cin: 'BE892144',
    telephone: '+212 6 62 11 22 33',
    email: 'omar.kabbaj@outlook.com',
    apportInitial: 220000,
    dateDemande: '23/10/2026',
    statut: 'En attente de validation',
    commentaire: 'Dossier complet avec justificatif de virement bancaire.'
  },
  {
    id: 'RES-902',
    lotId: 'MAG-02',
    nomClient: 'Pharmacie Mansouria Santé SARL (Dr. Sbihi)',
    cin: 'C341120',
    telephone: '+212 6 61 78 99 00',
    email: 'contact@pharmaciemansouria.ma',
    apportInitial: 260000,
    dateDemande: '21/10/2026',
    statut: 'Validée',
    commentaire: 'Affectation validée pour officine pharmaceutique par le bureau.'
  }
];

// Initial Chat messages
export const INITIAL_MESSAGES: MessageDiscussion[] = [
  {
    id: 'MSG-01',
    expediteurRole: 'commercial',
    expediteurNom: 'Yassine Berrada (Conseiller Commercial)',
    texte: 'Bonjour Mme El Fassi, nous avons le plaisir de vous informer que la pose du marbre dans le hall de votre bloc B a débuté cette semaine.',
    date: '22/10/2026 11:20',
    lu: true
  },
  {
    id: 'MSG-02',
    expediteurRole: 'adherent',
    expediteurNom: 'Mme. Karima El Fassi',
    texte: 'Bonjour M. Berrada, merci beaucoup pour cette mise à jour ! Est-ce qu il serait possible de visiter l appartement ce samedi pour vérifier les arrivées de climatisation dans les chambres ?',
    date: '22/10/2026 14:05',
    lu: true
  },
  {
    id: 'MSG-03',
    expediteurRole: 'commercial',
    expediteurNom: 'Yassine Berrada (Conseiller Commercial)',
    texte: 'Absolument ! Je vous bloque le créneau de samedi 11h30 avec le chef de chantier pour vous accompagner sur place à Mansouria.',
    date: '22/10/2026 14:40',
    lu: true
  }
];

// Notifications
export const INITIAL_NOTIFICATIONS: NotificationApp[] = [
  {
    id: 'NOTIF-01',
    titre: 'Convocation Assemblée Générale Ordinaire',
    message: 'L Assemblée Générale Annuelle des adhérents Ebla Two se tiendra le samedi 15 Novembre 2026 à 10h. Consultez l ordre du jour dans l onglet Réunions.',
    date: 'Il y a 2 heures',
    categorie: 'Réunion',
    urgente: true,
    lue: false
  },
  {
    id: 'NOTIF-02',
    titre: 'Rapport d avancement de chantier n°18',
    message: 'Le taux d avancement global a franchi le palier des 72%. L étanchéité du bloc B a été contrôlée et validée par Bureau Veritas.',
    date: 'Hier à 16:30',
    categorie: 'Chantier',
    urgente: false,
    lue: false
  },
  {
    id: 'NOTIF-03',
    titre: 'Appel de fonds - Tranche 3 Finitions',
    message: 'La Tranche 3 est exigible à partir du 15 Novembre. Les quittances seront générées automatiquement dès réception des virements.',
    date: 'Il y a 3 jours',
    categorie: 'Paiement',
    urgente: false,
    lue: true
  }
];
