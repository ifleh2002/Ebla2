import * as XLSX from 'xlsx';
import { PropertyLot, LotType, BlocType, TypologyType, OrientationType, LotStatus, RoomDimension } from '../types';

export interface ExcelLotRow {
  ID_Lot: string;
  Numero_Ordre: number;
  Type_Bien: string;
  Bloc: string;
  Etage: number;
  Typologie: string;
  Surface_Habitable_m2: number;
  Surface_Terrasse_m2: number;
  Surface_Totale_m2: number;
  Orientation: string;
  Prix_m2_DH: number;
  Prix_Total_DH: number;
  Statut: string;
  Nb_Chambres: number;
  Nb_Salles_De_Bain: number;
  Numero_Parking_Sous_Sol: number;
  Nom_Adherent_Reserve: string;
  CIN_Adherent: string;
  Date_Reservation: string;
  Surface_Salon_m2: number;
  Surface_Suite_Parentale_m2: number;
  Surface_Chambre2_m2: number;
  Surface_Cuisine_m2: number;
  Description: string;
}

export function exportLotsToExcel(lots: PropertyLot[], filename = 'Modele_Inventaire_Ebla_Two_Mansouria.xlsx') {
  const rows: ExcelLotRow[] = lots.map((lot) => {
    const salon = lot.pieces.find((p) => p.type === 'salon' || p.type === 'magasin_surface')?.surface || Math.round(lot.surfaceHabitable * 0.38);
    const parentale = lot.pieces.find((p) => p.name.includes('Parentale') || p.type === 'mezzanine')?.surface || Math.round(lot.surfaceHabitable * 0.22);
    const ch2 = lot.pieces.find((p) => p.name.includes('Enfants') || p.name.includes('Chambre 2'))?.surface || (lot.nbChambres >= 2 ? Math.round(lot.surfaceHabitable * 0.16) : 0);
    const cuisine = lot.pieces.find((p) => p.type === 'cuisine')?.surface || Math.round(lot.surfaceHabitable * 0.12);

    return {
      ID_Lot: lot.id,
      Numero_Ordre: lot.lotNumber,
      Type_Bien: lot.type,
      Bloc: lot.bloc,
      Etage: lot.etage,
      Typologie: lot.typology,
      Surface_Habitable_m2: lot.surfaceHabitable,
      Surface_Terrasse_m2: lot.surfaceTerrasse,
      Surface_Totale_m2: lot.surfaceTotale,
      Orientation: lot.orientation,
      Prix_m2_DH: lot.prixAuM2,
      Prix_Total_DH: lot.prixTotal,
      Statut: lot.statut,
      Nb_Chambres: lot.nbChambres,
      Nb_Salles_De_Bain: lot.nbSallesDeBain,
      Numero_Parking_Sous_Sol: lot.parkingSousSolNumero,
      Nom_Adherent_Reserve: lot.reservedBy?.nom || '',
      CIN_Adherent: lot.reservedBy?.cin || '',
      Date_Reservation: lot.reservedBy?.date || '',
      Surface_Salon_m2: salon,
      Surface_Suite_Parentale_m2: parentale,
      Surface_Chambre2_m2: ch2,
      Surface_Cuisine_m2: cuisine,
      Description: lot.description,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for clean readability in Excel
  worksheet['!cols'] = [
    { wch: 14 }, // ID_Lot
    { wch: 13 }, // Numero_Ordre
    { wch: 14 }, // Type_Bien
    { wch: 10 }, // Bloc
    { wch: 8 },  // Etage
    { wch: 18 }, // Typologie
    { wch: 20 }, // Surface_Habitable_m2
    { wch: 19 }, // Surface_Terrasse_m2
    { wch: 18 }, // Surface_Totale_m2
    { wch: 18 }, // Orientation
    { wch: 14 }, // Prix_m2_DH
    { wch: 16 }, // Prix_Total_DH
    { wch: 14 }, // Statut
    { wch: 14 }, // Nb_Chambres
    { wch: 17 }, // Nb_Salles_De_Bain
    { wch: 22 }, // Numero_Parking_Sous_Sol
    { wch: 24 }, // Nom_Adherent_Reserve
    { wch: 15 }, // CIN_Adherent
    { wch: 16 }, // Date_Reservation
    { wch: 17 }, // Surface_Salon_m2
    { wch: 24 }, // Surface_Suite_Parentale_m2
    { wch: 19 }, // Surface_Chambre2_m2
    { wch: 19 }, // Surface_Cuisine_m2
    { wch: 50 }, // Description
  ];

  // Create Guide Sheet
  const guideRows = [
    { Colonne: 'ID_Lot', Valeurs_Autorisees: 'Ex: APP-A101, APP-B204, APP-E001, MAG-01 à MAG-09', Explication: 'Identifiant unique du lot (162 appartements + 9 magasins)' },
    { Colonne: 'Type_Bien', Valeurs_Autorisees: 'appartement | magasin', Explication: 'Indiquer "appartement" (162 logements) ou "magasin" (9 locaux RDC)' },
    { Colonne: 'Bloc', Valeurs_Autorisees: 'Immeuble A | Immeuble B | Immeuble C | Immeuble D | Immeuble E | Immeuble F', Explication: '6 Immeubles R+3 (A:12, B:25, C:37, D:16, E:42, F:30 = 162 appts)' },
    { Colonne: 'Etage', Valeurs_Autorisees: '0, 1, 2, 3', Explication: '0 pour Rez-de-chaussée (30 appts RDC + 9 magasins), 1 à 3 pour les étages (44 appts/étage)' },
    { Colonne: 'Typologie', Valeurs_Autorisees: 'Studio | F2 | F3 | F4 | Local Commercial', Explication: 'Type d appartement ou Local Commercial' },
    { Colonne: 'Surface_Habitable_m2', Valeurs_Autorisees: 'Nombre (ex: 82)', Explication: 'Surface privative habitable en m² (à rapprocher du lot sur plan)' },
    { Colonne: 'Surface_Terrasse_m2', Valeurs_Autorisees: 'Nombre (ex: 12)', Explication: 'Surface balcon / terrasse en m²' },
    { Colonne: 'Surface_Totale_m2', Valeurs_Autorisees: 'Nombre (ex: 94)', Explication: 'Calculé automatiquement (Habitable + Terrasse) si laissé vide' },
    { Colonne: 'Orientation', Valeurs_Autorisees: 'Mer | Piscine & Jardin | Sud/Soleil', Explication: 'Vue principale du lot' },
    { Colonne: 'Prix_m2_DH', Valeurs_Autorisees: 'Nombre en MAD (ex: 11500)', Explication: 'Prix au mètre carré en Dirhams' },
    { Colonne: 'Prix_Total_DH', Valeurs_Autorisees: 'Nombre en MAD (ex: 1081000)', Explication: 'Prix total du lot (ou calculé via Surface_Totale * Prix_m2)' },
    { Colonne: 'Statut', Valeurs_Autorisees: 'Disponible | Réservé | Vendu', Explication: 'Statut commercial actuel du lot' },
    { Colonne: 'Nom_Adherent_Reserve', Valeurs_Autorisees: 'Texte (optionnel)', Explication: 'Nom complet de l adhérent si le lot est Réservé ou Vendu' },
    { Colonne: 'CIN_Adherent', Valeurs_Autorisees: 'Texte (optionnel)', Explication: 'Numéro de CIN de l adhérent' },
  ];

  const guideSheet = XLSX.utils.json_to_sheet(guideRows);
  guideSheet['!cols'] = [{ wch: 24 }, { wch: 48 }, { wch: 66 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaire_171_Lots');
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Guide_Saisie');

  XLSX.writeFile(workbook, filename);
}

export function parseLotsFromExcelBuffer(data: ArrayBuffer): PropertyLot[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Le fichier Excel est vide ou ne contient aucune ligne valide.');
  }

  return rawRows.map((row, index) => {
    const id = String(row.ID_Lot || row.id || `APP-LOT-${index + 1}`).trim();
    const rawType = String(row.Type_Bien || row.type || '').toLowerCase().trim();
    const type: LotType = rawType.includes('mag') || id.startsWith('MAG') ? 'magasin' : 'appartement';

    const rawBloc = String(row.Bloc || row.bloc || row.Immeuble || 'Immeuble A').trim();
    const blocLetterMatch = rawBloc.match(/([A-F])$/i);
    const letter = blocLetterMatch ? blocLetterMatch[1].toUpperCase() : 'A';
    const bloc: BlocType = `Immeuble ${letter}` as BlocType;

    const etage = Number(row.Etage ?? row.etage ?? (type === 'magasin' ? 0 : 1));

    const rawTypo = String(row.Typologie || row.typology || (type === 'magasin' ? 'Local Commercial' : 'F3')).trim();
    const typology: TypologyType = (['Studio', 'F2', 'F3', 'F4', 'Local Commercial'].includes(rawTypo)
      ? rawTypo
      : type === 'magasin'
      ? 'Local Commercial'
      : 'F3') as TypologyType;

    const surfHab = Number(row.Surface_Habitable_m2 ?? row.surfaceHabitable ?? 80);
    const surfTerr = Number(row.Surface_Terrasse_m2 ?? row.surfaceTerrasse ?? 10);
    const surfTot = Number(row.Surface_Totale_m2 || (surfHab + surfTerr));

    const rawOrient = String(row.Orientation || row.orientation || 'Mer').trim();
    let orientation: OrientationType = 'Piscine & Jardin';
    if (rawOrient.toLowerCase().includes('mer')) orientation = 'Mer';
    else if (rawOrient.toLowerCase().includes('sud') || rawOrient.toLowerCase().includes('soleil')) orientation = 'Sud/Soleil';

    const prixM2 = Number(row.Prix_m2_DH ?? row.prixAuM2 ?? 10500);
    const prixTotal = Number(row.Prix_Total_DH || Math.round(surfTot * prixM2));

    const rawStatut = String(row.Statut || row.statut || 'Disponible').trim().toLowerCase();
    let statut: LotStatus = 'Disponible';
    if (rawStatut.includes('réserv') || rawStatut.includes('reserv')) statut = 'Réservé';
    else if (rawStatut.includes('vendu') || rawStatut.includes('attribu')) statut = 'Vendu';

    const nbChambres = Number(row.Nb_Chambres ?? (typology === 'F2' ? 1 : typology === 'F4' ? 3 : typology === 'F3' ? 2 : 0));
    const nbSdb = Number(row.Nb_Salles_De_Bain ?? (typology === 'F2' ? 1 : 2));
    const parking = Number(row.Numero_Parking_Sous_Sol ?? (index + 1));

    const salonSurf = Number(row.Surface_Salon_m2 || Math.round(surfHab * 0.38));
    const parentaleSurf = Number(row.Surface_Suite_Parentale_m2 || Math.round(surfHab * 0.22));
    const ch2Surf = Number(row.Surface_Chambre2_m2 || Math.round(surfHab * 0.16));
    const cuisineSurf = Number(row.Surface_Cuisine_m2 || Math.round(surfHab * 0.12));

    const pieces: RoomDimension[] =
      type === 'magasin'
        ? [
            { name: 'Surface commerciale principale', surface: Math.max(20, surfHab - 15), type: 'magasin_surface' },
            { name: 'Mezzanine / Réserve technique', surface: 15, type: 'mezzanine' },
            { name: 'Sanitaire indépendant', surface: 3, type: 'sdb' },
            { name: 'Terrasse / Parvis privatif', surface: surfTerr, type: 'terrasse' },
          ]
        : [
            { name: 'Grand Salon Marocain & Séjour', surface: salonSurf, type: 'salon' },
            { name: 'Suite Parentale avec dressing', surface: parentaleSurf, type: 'chambre' },
            ...(nbChambres >= 2 ? [{ name: 'Chambre Enfants / Invités', surface: ch2Surf, type: 'chambre' as const }] : []),
            { name: 'Cuisine équipée moderne', surface: cuisineSurf, type: 'cuisine' },
            { name: 'Salle de bain principale avec douche italienne', surface: 5, type: 'sdb' },
            { name: 'Terrasse panoramique ensoleillée', surface: surfTerr, type: 'terrasse' },
          ];

    const nomReserve = String(row.Nom_Adherent_Reserve || '').trim();
    const cinReserve = String(row.CIN_Adherent || '').trim();
    const dateReserve = String(row.Date_Reservation || '').trim() || new Date().toLocaleDateString('fr-FR');

    return {
      id,
      lotNumber: Number(row.Numero_Ordre || index + 1),
      type,
      bloc,
      etage,
      typology,
      surfaceHabitable: surfHab,
      surfaceTerrasse: surfTerr,
      surfaceTotale: surfTot,
      orientation,
      prixAuM2: prixM2,
      prixTotal,
      statut,
      nbChambres,
      nbSallesDeBain: nbSdb,
      parkingSousSolNumero: parking,
      description:
        String(row.Description || '').trim() ||
        `${type === 'magasin' ? 'Magasin commercial' : `Appartement ${typology}`} (${id}) situé au ${bloc}, orientation ${orientation}.`,
      pointsForts: [
        `Orientation ${orientation}`,
        `Place de parking sous-sol titrée n°${parking}`,
        'Ascenseur Schindler silencieux',
        'Volets roulants électriques en aluminium',
      ],
      pieces,
      reservedBy: nomReserve
        ? {
            nom: nomReserve,
            cin: cinReserve || 'N/A',
            date: dateReserve,
          }
        : undefined,
    };
  });
}
