import React, { useState, useMemo } from 'react';
import { PropertyLot, BlocType, LotStatus } from '../types';
import { IMMEUBLES_CONTENANCE, TABLEAU_CONTENANCE_SYNTHESE } from '../data/mockData';
import { exportLotsToExcel } from '../utils/excelHelper';
import {
  Building2,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Store,
  Download,
  Upload,
  Table,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

interface InteractiveMasterplanProps {
  lots: PropertyLot[];
  onSelectLot: (lot: PropertyLot) => void;
  onReserveLot: (lot: PropertyLot) => void;
  onRequestVisit: (lot: PropertyLot) => void;
  onOpenExcelManager: () => void;
}

export const InteractiveMasterplan: React.FC<InteractiveMasterplanProps> = ({
  lots,
  onSelectLot,
  onReserveLot,
  onRequestVisit,
  onOpenExcelManager,
}) => {
  const [selectedBloc, setSelectedBloc] = useState<string>('All');
  const [selectedFloor, setSelectedFloor] = useState<number | 'All'>('All');
  const [selectedTypo, setSelectedTypo] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedOrientation, setSelectedOrientation] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [showSyntheseTable, setShowSyntheseTable] = useState<boolean>(true);

  // Filtered lots
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      if (selectedBloc !== 'All') {
        if (selectedBloc === 'Magasins' && lot.type !== 'magasin') return false;
        if (selectedBloc !== 'Magasins' && lot.bloc !== selectedBloc) return false;
      }
      if (selectedFloor !== 'All' && lot.etage !== selectedFloor) return false;
      if (selectedTypo !== 'All' && lot.typology !== selectedTypo) return false;
      if (selectedStatus !== 'All' && lot.statut !== selectedStatus) return false;
      if (selectedOrientation !== 'All' && lot.orientation !== selectedOrientation) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = lot.id.toLowerCase().includes(q);
        const matchType = lot.typology.toLowerCase().includes(q);
        const matchBloc = lot.bloc.toLowerCase().includes(q);
        if (!matchId && !matchType && !matchBloc) return false;
      }
      return true;
    });
  }, [lots, selectedBloc, selectedFloor, selectedTypo, selectedStatus, selectedOrientation, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = lots.length;
    const totalApps = lots.filter((l) => l.type === 'appartement').length;
    const totalMags = lots.filter((l) => l.type === 'magasin').length;
    const dispo = lots.filter((l) => l.statut === 'Disponible').length;
    const reserve = lots.filter((l) => l.statut === 'Réservé').length;
    const vendu = lots.filter((l) => l.statut === 'Vendu').length;
    const commercialisePct = total > 0 ? Math.round(((reserve + vendu) / total) * 100) : 0;
    return { total, totalApps, totalMags, dispo, reserve, vendu, commercialisePct };
  }, [lots]);

  const getStatusBadge = (status: LotStatus) => {
    switch (status) {
      case 'Disponible':
        return <span className="text-emerald-700 font-medium">Disponible</span>;
      case 'Réservé':
        return <span className="text-amber-700 font-medium">Réservé</span>;
      case 'Vendu':
        return <span className="text-slate-500 font-medium">Attribué / Vendu</span>;
    }
  };

  const getStatusColor = (status: LotStatus) => {
    switch (status) {
      case 'Disponible':
        return 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100';
      case 'Réservé':
        return 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100';
      case 'Vendu':
        return 'bg-slate-100 border-slate-300 text-slate-500 opacity-70';
    }
  };

  const allBlocNames: BlocType[] = [
    'Immeuble A',
    'Immeuble B',
    'Immeuble C',
    'Immeuble D',
    'Immeuble E',
    'Immeuble F',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Key Metrics */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
              <Building2 className="w-4 h-4" />
              <span>Tableau de Contenance Certifié · Résidence Balnéaire Ebla Two</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              162 Appartements (RDC à R+3 · 6 Immeubles A à F) &amp; 9 Magasins
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Données vérifiées selon le fichier officiel <strong className="text-white">Tableau_contenance_162_appartements.xlsx</strong> : <strong className="text-amber-300">30 appartements au RDC</strong> + <strong className="text-amber-300">132 appartements aux étages R+1 à R+3</strong> (44 par étage courant), <strong className="text-amber-300">9 magasins</strong> (Immeubles A, B et F), <strong className="text-amber-300">230 places de parking</strong> au sous-sol sur un terrain de <strong className="text-white">11 841 m²</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() =>
                  exportLotsToExcel(lots, 'Inventaire_Ebla_Two_162_Appartements_9_Magasins.xlsx')
                }
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter Inventaire Complet (.xlsx)</span>
              </button>
              <a
                href={TABLEAU_CONTENANCE_SYNTHESE.csvAssetUrl}
                download="Tableau_contenance_162_appartements_Synthese.csv"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Télécharger Synthèse Officielle (.csv)</span>
              </a>
              <button
                onClick={onOpenExcelManager}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Importer Fichier Excel</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 backdrop-blur-sm shrink-0">
            <div>
              <div className="text-xs text-slate-400">Logements</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums">
                {stats.totalApps}
              </div>
              <div className="text-[11px] text-slate-300">30 RDC + 132 Étages</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Magasins &amp; Parking</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                {stats.totalMags} <span className="text-xs text-slate-400 font-normal">/ 230 pl.</span>
              </div>
              <div className="text-[11px] text-slate-300">Immeubles A, B, F</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Disponibles</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {stats.dispo}
              </div>
              <div className="text-[11px] text-emerald-400/80">Ouverts adhésion</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Surface Construite</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-sky-400 tabular-nums">
                21 780 m²
              </div>
              <div className="text-[11px] text-slate-300">Terrain 11 841 m²</div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Tableau de Contenance Synthesis Section (from Excel attachment) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Table className="w-4 h-4 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                RÉSIDENCE BALNÉAIRE · TABLEAU DE CONTENANCE OFFICIEL (6 Immeubles A à F · 162 Appartements · 9 Magasins)
              </h2>
              <p className="text-xs text-slate-500">
                Cliquez sur un immeuble dans le tableau pour filtrer directement ses appartements et magasins ci-dessous.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSyntheseTable(!showSyntheseTable)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
          >
            {showSyntheseTable ? 'Masquer le tableau de synthèse' : 'Afficher le tableau de synthèse'}
          </button>
        </div>

        {showSyntheseTable && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 7 Cols: Exact Table by Immeuble (A to F) */}
              <div className="lg:col-span-7 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="py-2.5 px-3 font-semibold rounded-tl-lg">Immeuble</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Appart. RDC</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Appart. / étage</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Nb étages</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Appart. étages</th>
                      <th className="py-2.5 px-3 font-semibold text-center text-amber-300">Total Appart.</th>
                      <th className="py-2.5 px-3 font-semibold text-center rounded-tr-lg">Magasins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {IMMEUBLES_CONTENANCE.map((row) => {
                      const isSelected = selectedBloc === row.blocName;
                      return (
                        <tr
                          key={row.immeuble}
                          onClick={() =>
                            setSelectedBloc(isSelected ? 'All' : row.blocName)
                          }
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-50/90 font-bold text-slate-900'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-sans font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-mono">
                              {row.immeuble}
                            </span>
                            <span>{row.blocName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">{row.appartRdc}</td>
                          <td className="py-2.5 px-3 text-center">{row.appartParEtage}</td>
                          <td className="py-2.5 px-3 text-center">{row.nombreEtages}</td>
                          <td className="py-2.5 px-3 text-center">{row.appartEtages}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-700">
                            {row.totalAppartements}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-900">
                            {row.magasins}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-300">
                      <td className="py-2.5 px-3 font-sans">TOTAL (6 Immeubles)</td>
                      <td className="py-2.5 px-3 text-center">{TABLEAU_CONTENANCE_SYNTHESE.totalAppartRdc}</td>
                      <td className="py-2.5 px-3 text-center">{TABLEAU_CONTENANCE_SYNTHESE.totalAppartParEtageCourant} / étage</td>
                      <td className="py-2.5 px-3 text-center">3 (R+1 à R+3)</td>
                      <td className="py-2.5 px-3 text-center">{TABLEAU_CONTENANCE_SYNTHESE.totalAppartEtages}</td>
                      <td className="py-2.5 px-3 text-center text-amber-700 text-sm">
                        {TABLEAU_CONTENANCE_SYNTHESE.logements}
                      </td>
                      <td className="py-2.5 px-3 text-center text-sm">
                        {TABLEAU_CONTENANCE_SYNTHESE.magasins}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Right 5 Cols: Global Surfaces Table from CSV */}
              <div className="lg:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Surfaces Globales du Projet (m²)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-700">
                    Parking : {TABLEAU_CONTENANCE_SYNTHESE.parkingPlaces} places
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">Surface terrain :</span>
                    <strong className="font-mono text-slate-900">11 841 m²</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">Sous-sol construit :</span>
                    <strong className="font-mono text-slate-900">7 500 m²</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">RDC construit :</span>
                    <strong className="font-mono text-slate-900">4 080 m²</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">R+1 construit :</span>
                    <strong className="font-mono text-slate-900">3 400 m²</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">R+2 construit :</span>
                    <strong className="font-mono text-slate-900">3 400 m²</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">R+3 construit :</span>
                    <strong className="font-mono text-slate-900">3 400 m²</strong>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between col-span-2">
                    <span className="font-semibold text-amber-950">Surface construite totale :</span>
                    <strong className="font-mono text-amber-800 text-sm">21 780 m²</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">Planchers hors S/Sol :</span>
                    <strong className="font-mono text-slate-900">14 280 m²</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">Construite au sol :</span>
                    <strong className="font-mono text-slate-900">4 080 m²</strong>
                  </div>
                </div>

                {/* Official Warning from Excel file */}
                <div className="p-2.5 bg-amber-50/80 border border-amber-300/80 rounded-lg flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{TABLEAU_CONTENANCE_SYNTHESE.avertissement}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Filters Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-900">Filtres de Recherche &amp; Navigation par Immeuble</span>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plan de Masse par Immeuble (A à F)
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catalogue Liste &amp; Fiches ({filteredLots.length})
            </button>
          </div>
        </div>

        {/* Filter Rows */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Immeuble / Zone */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Immeuble / Zone</label>
            <select
              value={selectedBloc}
              onChange={(e) => setSelectedBloc(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">Tous (6 Immeubles A–F + 9 Magasins)</option>
              <option value="Immeuble A">Immeuble A (12 appts · 0 RDC, 4/étage + 3 mag)</option>
              <option value="Immeuble B">Immeuble B (25 appts · 4 RDC, 7/étage + 3 mag)</option>
              <option value="Immeuble C">Immeuble C (37 appts · 10 RDC, 9/étage)</option>
              <option value="Immeuble D">Immeuble D (16 appts · 4 RDC, 4/étage)</option>
              <option value="Immeuble E">Immeuble E (42 appts · 9 RDC, 11/étage)</option>
              <option value="Immeuble F">Immeuble F (30 appts · 3 RDC, 9/étage + 3 mag)</option>
              <option value="Magasins">Magasins RDC (9 locaux : A, B, F)</option>
            </select>
          </div>

          {/* Floor */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Niveau / Étage</label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">Tous les niveaux (RDC à R+3)</option>
              <option value="0">Rez-de-chaussée (30 appts RDC + 9 magasins)</option>
              <option value="1">1er Étage R+1 (44 appartements)</option>
              <option value="2">2ème Étage R+2 (44 appartements)</option>
              <option value="3">3ème Étage R+3 (44 appartements)</option>
            </select>
          </div>

          {/* Typology */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Typologie</label>
            <select
              value={selectedTypo}
              onChange={(e) => setSelectedTypo(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">Toutes typologies</option>
              <option value="Studio">Studio / F2 Compact (~40 m²)</option>
              <option value="F2">F2 Contemporain (~68-78 m²)</option>
              <option value="F3">F3 Balnéaire (~82-115 m²)</option>
              <option value="F4">Grand F4 Familial (~115-135 m²)</option>
              <option value="Local Commercial">Magasins RDC (9 locaux)</option>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Orientation</label>
            <select
              value={selectedOrientation}
              onChange={(e) => setSelectedOrientation(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">Toutes orientations</option>
              <option value="Mer">Vue Mer (Océan Atlantique)</option>
              <option value="Piscine & Jardin">Vue Piscine Centrale &amp; Jardin</option>
              <option value="Sud/Soleil">Plein Sud / Ensoleillé</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Disponibilité</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">Tous les statuts</option>
              <option value="Disponible">Disponibles uniquement</option>
              <option value="Réservé">Réservés</option>
              <option value="Vendu">Vendus / Attribués</option>
            </select>
          </div>

          {/* Search ID */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Recherche n° de lot</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Ex: B204, E105, MAG-02..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Active results indicator & Reset button */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <div>
            <span className="font-semibold text-slate-900 font-mono">{filteredLots.length}</span> lots affichés sur{' '}
            <span className="font-semibold text-slate-900 font-mono">{lots.length}</span> au total (162 appartements + 9 magasins)
          </div>

          {(selectedBloc !== 'All' ||
            selectedFloor !== 'All' ||
            selectedTypo !== 'All' ||
            selectedStatus !== 'All' ||
            selectedOrientation !== 'All' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedBloc('All');
                setSelectedFloor('All');
                setSelectedTypo('All');
                setSelectedStatus('All');
                setSelectedOrientation('All');
                setSearchQuery('');
              }}
              className="text-amber-600 hover:text-amber-800 font-medium underline cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* View Mode 1: Interactive Floor Matrix across 6 Immeubles (A to F) + 9 Magasins */}
      {viewMode === 'matrix' && (
        <div className="space-y-6">
          {/* Ground Floor Magasins Section (3 in Immeuble A, 3 in Immeuble B, 3 in Immeuble F) */}
          {(selectedBloc === 'All' ||
            selectedBloc === 'Magasins' ||
            selectedBloc === 'Immeuble A' ||
            selectedBloc === 'Immeuble B' ||
            selectedBloc === 'Immeuble F') && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Galerie Commerciale RDC · 9 Magasins (3 Immeuble A · 3 Immeuble B · 3 Immeuble F)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Avec soupente / mezzanine sur voie de 16m</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {lots
                  .filter((l) => l.type === 'magasin')
                  .map((mag) => {
                    const isMatch = filteredLots.some((f) => f.id === mag.id);
                    return (
                      <div
                        key={mag.id}
                        onClick={() => onSelectLot(mag)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                          isMatch ? getStatusColor(mag.statut) : 'opacity-25 bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                            <span>{mag.id}</span>
                            <span className="text-[10px] font-mono">{mag.surfaceTotale}m²</span>
                          </div>
                          <div className="text-[10px] text-slate-600 font-semibold mb-1">{mag.bloc}</div>
                          <div className="text-[11px] font-medium truncate mb-1">
                            {getStatusBadge(mag.statut)}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] font-mono font-semibold">
                          {(mag.prixTotal / 1000).toLocaleString('fr-FR')} kDH
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Residential Immeubles (A, B, C, D, E, F) Floors */}
          {allBlocNames
            .filter((bloc) => selectedBloc === 'All' || selectedBloc === bloc)
            .map((blocName) => {
              const blocLots = lots.filter((l) => l.bloc === blocName && l.type === 'appartement');
              const blocSynthese = IMMEUBLES_CONTENANCE.find((c) => c.blocName === blocName);
              const floors = [3, 2, 1, 0]; // R+3 down to RDC (0)

              return (
                <div key={blocName} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm font-mono">
                        {blocName.replace('Immeuble ', '')}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {blocName} · {blocLots.length} Appartements (RDC à R+3)
                          {blocSynthese && blocSynthese.magasins > 0
                            ? ` + ${blocSynthese.magasins} Magasins RDC`
                            : ''}
                        </h3>
                        <div className="text-xs text-slate-500">
                          {blocSynthese
                            ? `${blocSynthese.appartRdc} appart. au RDC · ${blocSynthese.appartParEtage} appart./étage × ${blocSynthese.nombreEtages} étages (${blocSynthese.appartEtages} aux étages)`
                            : `${blocLots.length} appartements`}{' '}
                          · Ascenseur &amp; Parking Sous-Sol (230 places)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Dispo ({blocLots.filter((l) => l.statut === 'Disponible').length})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Réservé ({blocLots.filter((l) => l.statut === 'Réservé').length})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        Vendu ({blocLots.filter((l) => l.statut === 'Vendu').length})
                      </span>
                    </div>
                  </div>

                  {/* Floor rows */}
                  <div className="space-y-3">
                    {floors
                      .filter((fl) => selectedFloor === 'All' || selectedFloor === fl)
                      .map((floorNum) => {
                        const floorLots = blocLots.filter((l) => l.etage === floorNum);
                        const floorStores =
                          floorNum === 0
                            ? lots.filter((l) => l.bloc === blocName && l.type === 'magasin')
                            : [];

                        return (
                          <div key={floorNum} className="flex flex-col sm:flex-row items-stretch gap-2">
                            {/* Floor Tag */}
                            <div className="sm:w-32 shrink-0 bg-slate-100 rounded-lg p-2 flex sm:flex-col items-center justify-center text-center">
                              <span className="text-xs font-bold text-slate-800">
                                {floorNum === 0
                                  ? 'Rez-de-chaussée'
                                  : floorNum === 1
                                  ? '1er Étage (R+1)'
                                  : `${floorNum}ème Étage (R+${floorNum})`}
                              </span>
                              <span className="text-[10px] text-slate-500 sm:mt-0.5 font-mono">
                                {floorLots.length} app.{floorStores.length > 0 ? ` + ${floorStores.length} mag.` : ''}
                              </span>
                            </div>

                            {/* Units in this floor */}
                            {floorLots.length > 0 ? (
                              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
                                {floorLots.map((apt) => {
                                  const isMatch = filteredLots.some((f) => f.id === apt.id);
                                  return (
                                    <div
                                      key={apt.id}
                                      onClick={() => onSelectLot(apt)}
                                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                                        isMatch ? getStatusColor(apt.statut) : 'opacity-20 bg-slate-50 border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-xs font-bold">
                                        <span>{apt.id.replace('APP-', '')}</span>
                                        <span className="text-[10px] font-semibold">{apt.typology}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                                        <span>{apt.surfaceTotale}m²</span>
                                        <span>
                                          {apt.orientation === 'Mer'
                                            ? '🌊 Mer'
                                            : apt.orientation === 'Piscine & Jardin'
                                            ? '🏊 Piscine'
                                            : '☀️ Sud'}
                                        </span>
                                      </div>
                                      <div className="mt-1.5 pt-1 border-t border-slate-200/50 text-[10px] font-mono font-bold">
                                        {(apt.prixTotal / 1000).toLocaleString('fr-FR')} kDH
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex-1 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
                                <span>
                                  Aucun appartement résidentiel au RDC de l&apos;{blocName} (0 appart. RDC selon tableau de contenance — occupé par les 3 magasins commerciaux MAG-01 à MAG-03).
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* View Mode 2: Detailed Cards Grid */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLots.map((lot) => (
            <div
              key={lot.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">{lot.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {lot.typology}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {lot.bloc} &middot; {lot.etage === 0 ? 'RDC' : `${lot.etage}e Étage (R+${lot.etage})`}
                    </div>
                  </div>

                  <div className="text-xs text-right">
                    {getStatusBadge(lot.statut)}
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {lot.orientation === 'Mer'
                        ? '🌊 Vue Océan'
                        : lot.orientation === 'Piscine & Jardin'
                        ? '🏊 Vue Piscine'
                        : '☀️ Plein Sud'}
                    </div>
                  </div>
                </div>

                {/* Specs row */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-3 text-center">
                  <div>
                    <div className="text-[11px] text-slate-500">Surface Totale</div>
                    <div className="text-xs font-bold text-slate-800 font-mono">{lot.surfaceTotale} m²</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Habitable / Terr.</div>
                    <div className="text-xs font-bold text-slate-800 font-mono">
                      {lot.surfaceHabitable}+{lot.surfaceTerrasse}m²
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Parking S/Sol</div>
                    <div className="text-xs font-bold text-slate-800 font-mono">N° {lot.parkingSousSolNumero}</div>
                  </div>
                </div>

                {/* Pricing in MAD */}
                <div className="flex items-baseline justify-between mt-3">
                  <div className="text-xs text-slate-500">
                    Prix amicale ({lot.prixAuM2.toLocaleString('fr-FR')} DH/m²)
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-700 tabular-nums">
                    {lot.prixTotal.toLocaleString('fr-FR')} DH
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectLot(lot)}
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Détails &amp; Plans 2D/3D</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {lot.statut === 'Disponible' ? (
                  <button
                    onClick={() => onReserveLot(lot)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    Réserver ce lot
                  </button>
                ) : (
                  <button
                    onClick={() => onRequestVisit(lot)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Demander visite
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
