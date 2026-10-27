# Résidence Ebla Two (Mansouria) - Plateforme de Gestion de l'Amicale & Espace Adhérents

Plateforme web responsive et mobile-friendly dédiée au Bureau Exécutif de l'amicale, à l'équipe commerciale et aux adhérents de la résidence fermée **Ebla Two** à Mansouria (Mohammedia), intégrant le suivi de chantier, la gouvernance de l'amicale, la trésorerie, le catalogue complet des 153 appartements et 9 magasins avec plans 2D et visites 3D, un système de réservation, un espace adhérent personnalisé, et un conseiller IA vocal bilingue en Darija marocaine et Français.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Les trois orientations clés suivantes ont été validées lors du cadrage interactif :

- **Authentification & Espaces d'Accès** : Système d'authentification sécurisé par email/identifiant et mot de passe avec 3 profils distincts préconfigurés pour tester immédiatement chaque cas d'usage :
  1. *Bureau Exécutif* (Président / Trésorier / Secrétaire) : gestion chantiers, PVs, ordres du jour, approbation des réservations, trésorerie globale.
  2. *Conseiller Commercial* : gestion des leads, réservations de visites sur site, offres, messagerie en direct.
  3. *Adhérent / Acquéreur* : espace personnel sécurisé, suivi de l'avancement de son lot, calendrier de versement (apports, tranches gros œuvre / finition / remise des clés), quittances et documents officiels.
- **Visualisation Immobilière des 153 Appartements & 9 Magasins** : Plan de masse interactif avec sélecteur de bâtiment, niveau/étage, orientation mer/jardin, visualiseur de plans 2D d'architecte cotés et module de visite 3D interactive (canvas WebGL / Three.js immersif avec rotation à 360° et visite des pièces).
- **Conseiller Virtuel IA Bilingue Darija & Français** : Chatbot intelligent propulsé par Gemini avec synthèse vocale audio (Web Speech / Gemini TTS) capable de répondre avec fluidité en Darija marocaine authentique (textes arabes & transcription latine) ou en Français aux questions sur l'amicale, l'avancement des travaux à Mansouria, les prix, les tranches de paiement et les réservations.

---

### 1. Overview & Core Concept

- **Projet Réel** : Résidence fermée haut standing **Ebla Two**, située à Mansouria (Mohammedia), face à l'océan Atlantique et à proximité de la sortie d'autoroute. Composée de **153 appartements** (du T2 au T4, de 54 m² à 128 m²) et **9 magasins commerciaux** en rez-de-chaussée (de 38 m² à 145 m²).
- **Problématique Adressée** : Les amicales d'habitation au Maroc font face à des défis majeurs de transparence, de suivi des cotisations et appels de fonds, de communication avec les adhérents et de gestion rigoureuse des réservations et des visites.
- **Expérience Utilisateur** : Une solution unifiée "Mobile First" avec barre de navigation inférieure ergonomique sur smartphone et panneau de contrôle complet sur tablette/ordinateur, offrant une transparence totale et une expérience premium pour les futurs résidents.

---

### 2. User Experience & Visual Design

#### Parcours Utilisateurs Principaux

1. **Parcours Visiteur & Réservation** :
   - Découverte du projet : situation Mansouria, atouts (piscines, espaces verts, sécurité 24/7, parking sous-sol, vue mer).
   - Exploration du plan de masse interactif : sélection par immeuble, étage et typologie.
   - Page dédiée par appartement/magasin : caractéristiques, surface habitable et terrasses, orientation, prix au m² et global, plan 2D vectoriel haute fidélité, module de visite 3D à 360°.
   - Action de réservation d'appartement en 3 étapes (choix lot, upload CIN/justificatif, contrat de réservation généré).
   - Prise de rendez-vous de visite sur site avec créneau horaire et confirmation instantanée par notification.

2. **Parcours Adhérent / Espace Personnel Sécurisé** :
   - Tableau de bord personnel : lot attribué, numéro de titre foncier en cours, photos d'avancement des travaux de son appartement.
   - Échéancier financier : acomptes versés, tranches restantes, dates d'exigibilité, quittances téléchargeables en PDF.
   - GED Personnelle : contrat d'adhésion, statuts de l'amicale, plans de son appartement, PVs d'AG.
   - Messagerie directe avec le conseiller commercial et le bureau de l'amicale.

3. **Parcours Bureau Exécutif de l'Amicale** :
   - Suivi des travaux : pourcentage global et par corps d'état (terrassement, gros œuvre, étanchéité, plomberie, finition, espaces verts).
   - Gestion des réunions & Assemblées Générales : convocation, ordre du jour, quorum, rédaction et signature des procès-verbaux (PVs).
   - Trésorerie & Comptabilité : total collecté vs impayés, dépenses engagées fournisseurs/BET/architecte, solde bancaire amicale.
   - Approbation des réservations et validation des dossiers d'adhésion.
   - Envoi de notifications push & alertes en temps réel aux adhérents.

4. **Conseiller Virtuel IA Vocal (Darija & Français)** :
   - Accessible partout via un bouton flottant avec micro.
   - Réponses précises : *"Salam, chehal baqi f l'avancement d'Ebla Two ?"*, *"Bghit n3ref les prix d appartements vue sur mer"*, *"Kifash n'reservi chi mahal tijari ?"*.
   - Lecture vocale audio avec accent naturel et transcription textuelle claire.

#### Direction Artistique & Charte Graphique

- **Ambiance** : Élégance balnéaire moderne, standing marocain contemporain et clarté institutionnelle.
- **Palette de Couleurs (60-30-10)** :
  - *Canvas (60%)* : Blanc pur (`#FFFFFF`) et blanc cassé écru sablé (`#F8FAFC`).
  - *Surfaces & Typographie (30%)* : Bleu marine atlantique profond (`#0F1E36`), ardoise minérale (`#334155`), bordures ultrafines sable doux (`#E2E8F0`).
  - *Accents (10%)* : Ocre doré / terracotta noble (`#C59B27` / `#D97706`) pour les actions principales, les badges de standing et les statuts clés.
- **Typographie** : `Plus Jakarta Sans` pour la titraille et la structure éditoriale, `DM Sans` pour la lecture fluide des descriptions et fiches techniques, et `font-mono tabular-nums` pour tous les prix en Dirhams (MAD), surfaces (m²) et pourcentages.
- **Composants & Ergonomie Mobile** :
  - Barre d'onglets inférieure ergonomique (Thumb Zone) sur mobile : Explorer, Lots & Plans, Espace Adhérent, Bureau, Conseiller IA.
  - Cartes épurées sans fioritures (Zero-Pill Discipline), métadonnées aérées séparées par `·`.

---

### 3. Key Product Decisions & Trade-Offs

- **Gestion des Données & Persistance Locale Réactive** :
  - *Choix* : Base de données locale réactive avec synchronisation `localStorage`, initialisée avec les 153 appartements et 9 magasins, les réunions, les PVs, les comptes et les profils adhérents de démonstration pré-configurés.
  - *Pourquoi* : Permet une exploration fluide et instantanée sans dépendance à un serveur externe indisponible, tout en permettant à l'utilisateur de créer, réserver, ajouter des PVs ou modifier des statuts avec persistance immédiate.
- **Plans 2D & Visite 3D Immersion** :
  - *Choix* : Rendu vectoriel SVG interactif haute précision pour les plans d'architecte 2D (cotes, cloisons, pièces cliquables) et visualiseur 3D interactif Three.js/WebGL fluide et optimisé pour mobile (rotation orbitale, vue en coupe écorchée, changement de matériau/vue).
  - *Pourquoi* : Offre des performances 60 FPS sur smartphones tout en éliminant les temps de chargement lourds de fichiers BIM externes.
- **Synthèse Vocale & Chatbot Darija Hybride** :
  - *Choix* : Moteur d'IA avec contexte complet sur la Résidence Ebla Two de Mansouria combiné à l'API Web Speech du navigateur + support de l'API Gemini pour la génération de réponses riches et la voix.
  - *Pourquoi* : Réponse instantanée même en conditions de réseau mobile instable avec fallback vocal garanti.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RÉSIDENCE EBLA TWO                              │
│                    Amicale & Espace Adhérents                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │                               │                               │
┌───▼─────────────────────┐ ┌───────▼─────────────────┐ ┌───────────▼────────────────┐
│   ESPACE ADHÉRENT &     │ │   CATALOGUE TECHNIQUE   │ │    BUREAU EXÉCUTIF &       │
│   RÉSERVATIONS          │ │   153 APPS + 9 MAGASINS │ │    GESTION DE L'AMICALE    │
├─────────────────────────┤ ├─────────────────────────┤ ├─────────────────────────┤
│ • Suivi Achat & Travaux │ │ • Plan de masse par ét. │ │ • Travaux & Corps d'état│
│ • Échéancier Paiements  │ │ • Plans 2D d'architecte │ │ • Réunions & PVs d'AG   │
│ • GED Documents/Quittance│ │ • Visite 3D interactive │ │ • Trésorerie & Dépenses │
│ • Prise RDV Visite Site │ │ • Fiches techniques lot │ │ • Approbation Dossiers  │
│ • Messagerie Conseiller │ │ • Disponibilité & Prix  │ │ • Alertes Push & Notifs │
└───┬─────────────────────┘ └───────┬─────────────────┘ └───────────┬─────────────┘
    │                               │                               │
    └───────────────────────────────┼───────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    SERVICES TRANSVERSAUX & MOTEURS                     │
├────────────────────────────────────────────────────────────────────────┤
│ • Authentification & Rôles (Bureau, Commercial, Adhérent)              │
│ • Conseiller Virtuel IA Bilingue Darija/Français (Texte + Audio TTS)   │
│ • Système d'Alertes Push & Notifications en Temps Réel                 │
│ • Stockage Réactif Local & Gestionnaire d'État (Zustand/Context)       │
└────────────────────────────────────────────────────────────────────────┘
```

#### Modèle de Données Principal

- **Lot (153 Appartements + 9 Magasins)** :
  - `id`: identifiant unique (ex: `APP-A102`, `MAG-03`)
  - `type`: `'appartement' | 'magasin'`
  - `batiment`: `'Bloc A' | 'Bloc B' | 'Bloc C' | 'Bloc D'`
  - `etage`: `0` (RDC magasins) à `4`
  - `typologie`: `'F2' | 'F3' | 'F4' | 'Local Commercial'`
  - `surface_habitable`, `surface_terrasse`, `surface_totale`
  - `prix_m2`, `prix_total` (en MAD)
  - `orientation`: `'Mer' | 'Piscine & Jardin' | 'Sud/Soleil'`
  - `statut`: `'Libre' | 'Réservé' | 'Vendu'`
  - `plan_2d_spec`: découpage des pièces (salon, chambres, cuisine, SDB, terrasse avec cotes)
  - `visite_3d_config`: coordonnées caméras et ambiance lumineuse
- **Adhérent / Réservation** :
  - `adherent_id`, `nom`, `cin`, `email`, `telephone`, `lot_id`
  - `echeancier`: liste de tranches (`nom`, `pourcentage`, `montant`, `date_echeance`, `statut: 'Payé' | 'En attente' | 'À venir'`, `quittance_url`)
  - `avancement_lot`: pourcentage de finition spécifique
- **Gouvernance & Bureau de l'Amicale** :
  - `reunions`: liste avec date, ordre du jour, quorum, décisions votées, document PV téléchargeable
  - `tresorerie`: récapitulatif total collecté, total décaissé, solde bancaire, dépenses par poste (BET, gros œuvre, notaire, etc.)
  - `notifications`: fil des alertes avec niveau d'urgence et date

---

### Plan d'Implémentation Étape par Étape

1. **Initialisation & Structure de Base** :
   - Mise à jour de `metadata.json` et `index.html` avec le branding de la Résidence Ebla Two Mansouria.
   - Configuration du thème Tailwind avec typographies et palette atlantique/marocaine.
2. **Génération des Données Immobilières & Moteur d'État** :
   - Base complète des 153 appartements et 9 magasins avec caractéristiques réalistes, prix calculés, orientations et statuts.
   - Données financières, calendrier des PVs d'assemblée générale et chantiers de l'amicale.
3. **Module Plans 2D Architecte & Visite 3D Interactive** :
   - Composant de plan de masse interactif par bloc et étage.
   - Plan 2D d'architecte interactif avec cotes métriques et pièces survolables.
   - Rendu 3D orbital interactif pour visiter les appartements et magasins.
4. **Espace Adhérent Sécurisé & Système de Réservation** :
   - Suivi d'achat en temps réel (pourcentage global, tranches de paiement, reçus de versement).
   - Module de réservation en ligne avec formulaire d'adhésion.
   - Module de prise de rendez-vous pour visite physique sur site à Mansouria.
5. **Espace Bureau Exécutif de l'Amicale** :
   - Suivi de chantier par corps d'état avec timeline photographique.
   - Module réunions, convocations, votes et PVs d'AG.
   - Tableau de bord de trésorerie de l'amicale avec graphiques financiers.
6. **Messagerie en Direct & Alertes Push** :
   - Messagerie interactive bidirectionnelle adhérent <-> conseiller commercial / bureau.
   - Centre de notifications push en temps réel avec filtres d'alertes.
7. **Conseiller Virtuel IA Vocal Bilingue (Darija & Français)** :
   - Chatbot contextuel alimenté par Gemini, capable de converser en Darija marocaine authentique et en français.
   - Synthèse vocale audio intégrée pour écouter les réponses.
