import React, { useState } from 'react';
import { PropertyLot, RoomDimension } from '../types';
import { Download, Maximize2, ZoomIn, ZoomOut, RotateCcw, Check, Layers, Eye } from 'lucide-react';

interface Floorplan2DViewerProps {
  lot: PropertyLot;
}

export const Floorplan2DViewer: React.FC<Floorplan2DViewerProps> = ({ lot }) => {
  const [activeRoom, setActiveRoom] = useState<RoomDimension | null>(null);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showFurniture, setShowFurniture] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const isMagasin = lot.type === 'magasin';

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            Plan d'Architecte 2D Coté
          </span>
          <span className="text-xs text-slate-500">
            Échelle 1:50 · Réf BET-EBLA-{lot.id}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            title="Afficher/Masquer les cotes"
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors flex items-center gap-1 ${
              showDimensions ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cotes métriques</span>
          </button>

          <button
            onClick={() => setShowFurniture(!showFurniture)}
            title="Afficher/Masquer le mobilier suggéré"
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors flex items-center gap-1 ${
              showFurniture ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobilier</span>
          </button>

          <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.15))}
              className="p-1 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-600 tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
              className="p-1 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-l border-slate-200"
              title="Réinitialiser zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>PDF Généré !</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Floorplan Canvas Render (SVG Vector) */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-100 flex items-center justify-center p-4 overflow-hidden select-none">
        <div 
          className="transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {isMagasin ? (
            /* Commercial Store SVG Plan */
            <svg
              viewBox="0 0 600 400"
              className="w-[320px] sm:w-[480px] h-auto drop-shadow-md"
            >
              {/* Floor background */}
              <rect x="50" y="40" width="500" height="320" fill="#f8fafc" stroke="#334155" strokeWidth="8" rx="2" />
              
              {/* Main Store Area */}
              <rect
                x="54"
                y="44"
                width="340"
                height="312"
                fill={activeRoom?.type === 'magasin_surface' ? '#fef3c7' : '#ffffff'}
                stroke="#64748b"
                strokeWidth="2"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveRoom(lot.pieces.find(p => p.type === 'magasin_surface') || null)}
                onMouseLeave={() => setActiveRoom(null)}
              />

              {/* Mezzanine / Reserve Area */}
              <rect
                x="394"
                y="44"
                width="152"
                height="190"
                fill={activeRoom?.type === 'mezzanine' ? '#fef3c7' : '#f1f5f9'}
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 2"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveRoom(lot.pieces.find(p => p.type === 'mezzanine') || null)}
                onMouseLeave={() => setActiveRoom(null)}
              />

              {/* WC / SDB */}
              <rect
                x="394"
                y="234"
                width="152"
                height="122"
                fill={activeRoom?.type === 'sdb' ? '#fef3c7' : '#e2e8f0'}
                stroke="#64748b"
                strokeWidth="2"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveRoom(lot.pieces.find(p => p.type === 'sdb') || null)}
                onMouseLeave={() => setActiveRoom(null)}
              />

              {/* Glass storefront with entrance door */}
              <line x1="50" y1="360" x2="394" y2="360" stroke="#0284c7" strokeWidth="6" />
              <text x="220" y="380" fill="#0369a1" fontSize="11" fontWeight="bold" textAnchor="middle">
                FACADE VITRÉE & ACCÈS CLIENTS (MANSOURIA)
              </text>

              {/* Room Labels */}
              <text x="220" y="190" fill="#0f172a" fontSize="14" fontWeight="600" textAnchor="middle">
                Surface Commerciale
              </text>
              <text x="220" y="210" fill="#64748b" fontSize="12" textAnchor="middle">
                {lot.pieces.find(p => p.type === 'magasin_surface')?.surface || 60} m² · H: 4.20m
              </text>

              <text x="470" y="130" fill="#0f172a" fontSize="12" fontWeight="600" textAnchor="middle">
                Mezzanine / Réserve
              </text>
              <text x="470" y="150" fill="#64748b" fontSize="11" textAnchor="middle">
                15 m²
              </text>

              <text x="470" y="290" fill="#0f172a" fontSize="12" fontWeight="600" textAnchor="middle">
                Sanitaire WC
              </text>
              <text x="470" y="308" fill="#64748b" fontSize="11" textAnchor="middle">
                3 m²
              </text>

              {/* Dimension indicators */}
              {showDimensions && (
                <g stroke="#94a3b8" strokeWidth="1" fill="#64748b" fontSize="10">
                  <line x1="50" y1="25" x2="550" y2="25" />
                  <text x="300" y="20" textAnchor="middle" fontWeight="bold">12.50 m</text>
                  <line x1="30" y1="40" x2="30" y2="360" />
                  <text x="22" y="200" textAnchor="middle" transform="rotate(-90 22 200)" fontWeight="bold">8.00 m</text>
                </g>
              )}
            </svg>
          ) : (
            /* Residential Apartment SVG Plan (F2 / F3 / F4) */
            <svg
              viewBox="0 0 700 480"
              className="w-[340px] sm:w-[540px] h-auto drop-shadow-md"
            >
              {/* Outer load-bearing perimeter walls */}
              <rect x="60" y="50" width="580" height="380" fill="#f8fafc" stroke="#1e293b" strokeWidth="8" rx="2" />

              {/* 1. Grand Salon Marocain & Séjour */}
              <rect
                x="64"
                y="54"
                width="310"
                height="220"
                fill={activeRoom?.type === 'salon' ? '#fef3c7' : '#ffffff'}
                stroke="#64748b"
                strokeWidth="2"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveRoom(lot.pieces.find(p => p.type === 'salon') || null)}
                onMouseLeave={() => setActiveRoom(null)}
              />

              {/* 2. Suite Parentale */}
              <rect
                x="374"
                y="54"
                width="262"
                height="220"
                fill={activeRoom?.name.includes('Parentale') ? '#fef3c7' : '#ffffff'}
                stroke="#64748b"
                strokeWidth="2"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveRoom(lot.pieces.find(p => p.name.includes('Parentale')) || null)}
                onMouseLeave={() => setActiveRoom(null)}
              />

              {/* 3. Cuisine Équipée */}
              <rect
                x="64"
                y="274"
                width="160"
                height="152"
                fill={activeRoom?.type === 'cuisine' ? '#fef3c7' : '#f8fafc'}
                stroke="#64748b"
                strokeWidth="2"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveRoom(lot.pieces.find(p => p.type === 'cuisine') || null)}
                onMouseLeave={() => setActiveRoom(null)}
              />

              {/* 4. Salle de bain / WC */}
              <rect
                x="224"
                y="274"
                width="150"
                height="152"
                fill={activeRoom?.type === 'sdb' ? '#fef3c7' : '#f1f5f9'}
                stroke="#64748b"
                strokeWidth="2"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveRoom(lot.pieces.find(p => p.type === 'sdb') || null)}
                onMouseLeave={() => setActiveRoom(null)}
              />

              {/* 5. Deuxième Chambre ou Chambre 2/3 */}
              <rect
                x="374"
                y="274"
                width="262"
                height="152"
                fill={activeRoom?.name.includes('Enfants') ? '#fef3c7' : '#ffffff'}
                stroke="#64748b"
                strokeWidth="2"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveRoom(lot.pieces.find(p => p.name.includes('Enfants')) || null)}
                onMouseLeave={() => setActiveRoom(null)}
              />

              {/* 6. Terrasse Panoramique Vue Mer / Piscine */}
              <rect
                x="64"
                y="54"
                width="310"
                height="45"
                fill={activeRoom?.type === 'terrasse' ? '#fed7aa' : '#ffedd5'}
                stroke="#ea580c"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setActiveRoom(lot.pieces.find(p => p.type === 'terrasse') || null)}
                onMouseLeave={() => setActiveRoom(null)}
              />

              {/* Bay Window / Balustrade for terrace */}
              <line x1="64" y1="50" x2="374" y2="50" stroke="#0284c7" strokeWidth="4" />
              <text x="219" y="42" fill="#0369a1" fontSize="10" fontWeight="bold" textAnchor="middle">
                BAIE VITRÉE COULISSANTE ALU (ORIENTATION {lot.orientation.toUpperCase()})
              </text>

              {/* Furniture hints (if enabled) */}
              {showFurniture && (
                <g opacity="0.6">
                  {/* Moroccan L-shaped Salon */}
                  <path d="M 80 120 L 220 120 L 220 200 L 195 200 L 195 145 L 80 145 Z" fill="#cbd5e1" stroke="#94a3b8" />
                  <rect x="110" y="160" width="60" height="40" rx="3" fill="#e2e8f0" stroke="#94a3b8" />
                  
                  {/* Master Bed */}
                  <rect x="440" y="80" width="120" height="90" rx="4" fill="#e2e8f0" stroke="#94a3b8" />
                  <rect x="450" y="85" width="45" height="25" rx="2" fill="#94a3b8" />
                  <rect x="505" y="85" width="45" height="25" rx="2" fill="#94a3b8" />

                  {/* Kitchen counter */}
                  <rect x="75" y="290" width="40" height="120" fill="#e2e8f0" stroke="#94a3b8" />
                  <circle cx="95" cy="320" r="12" fill="#94a3b8" />
                  <circle cx="95" cy="360" r="12" fill="#94a3b8" />

                  {/* SDB Walk-in Italian Shower */}
                  <rect x="235" y="285" width="50" height="50" fill="#bae6fd" stroke="#38bdf8" />
                </g>
              )}

              {/* Room Text Labels */}
              <text x="219" y="80" fill="#ea580c" fontSize="11" fontWeight="bold" textAnchor="middle">
                Terrasse ({lot.surfaceTerrasse} m²)
              </text>

              <text x="219" y="170" fill="#0f172a" fontSize="14" fontWeight="bold" textAnchor="middle">
                Grand Salon & Séjour
              </text>
              <text x="219" y="190" fill="#64748b" fontSize="12" textAnchor="middle">
                {lot.pieces.find(p => p.type === 'salon')?.surface || 32} m²
              </text>

              <text x="505" y="185" fill="#0f172a" fontSize="13" fontWeight="bold" textAnchor="middle">
                Suite Parentale
              </text>
              <text x="505" y="205" fill="#64748b" fontSize="11" textAnchor="middle">
                {lot.pieces.find(p => p.name.includes('Parentale'))?.surface || 18} m²
              </text>

              <text x="144" y="340" fill="#0f172a" fontSize="12" fontWeight="bold" textAnchor="middle">
                Cuisine Équipée
              </text>
              <text x="144" y="358" fill="#64748b" fontSize="11" textAnchor="middle">
                {lot.pieces.find(p => p.type === 'cuisine')?.surface || 10} m²
              </text>

              <text x="299" y="340" fill="#0f172a" fontSize="12" fontWeight="bold" textAnchor="middle">
                SDB Italienne
              </text>
              <text x="299" y="358" fill="#64748b" fontSize="11" textAnchor="middle">
                5 m²
              </text>

              <text x="505" y="340" fill="#0f172a" fontSize="12" fontWeight="bold" textAnchor="middle">
                Chambre 2
              </text>
              <text x="505" y="358" fill="#64748b" fontSize="11" textAnchor="middle">
                {lot.pieces.find(p => p.name.includes('Enfants'))?.surface || 14} m²
              </text>

              {/* Entrance Door with arc */}
              <path d="M 60 250 A 30 30 0 0 1 90 280" fill="none" stroke="#d97706" strokeWidth="2" />
              <text x="40" y="270" fill="#b45309" fontSize="10" fontWeight="bold" textAnchor="end">
                ENTRÉE PRINCIPALE
              </text>

              {/* Dimension indicators */}
              {showDimensions && (
                <g stroke="#94a3b8" strokeWidth="1" fill="#64748b" fontSize="10">
                  <line x1="60" y1="35" x2="640" y2="35" />
                  <text x="350" y="30" textAnchor="middle" fontWeight="bold">11.80 m</text>
                  <line x1="40" y1="50" x2="40" y2="430" />
                  <text x="32" y="240" textAnchor="middle" transform="rotate(-90 32 240)" fontWeight="bold">9.20 m</text>
                </g>
              )}
            </svg>
          )}
        </div>

        {/* Hovered Room Detail Box */}
        {activeRoom && (
          <div className="absolute bottom-3 left-4 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg text-xs flex items-center gap-3 animate-fade-in border border-slate-700">
            <span className="font-semibold text-amber-300">{activeRoom.name}</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono">{activeRoom.surface} m²</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 capitalize">{activeRoom.type}</span>
          </div>
        )}
      </div>

      {/* Surface Breakdown Summary */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="text-xs font-semibold text-slate-800 mb-2">
          Découpage des Surfaces Clé en Main
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {lot.pieces.map((piece, idx) => (
            <div 
              key={idx}
              onMouseEnter={() => setActiveRoom(piece)}
              onMouseLeave={() => setActiveRoom(null)}
              className={`p-2 rounded border transition-colors cursor-pointer text-xs ${
                activeRoom?.name === piece.name ? 'border-amber-500 bg-amber-50/50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="text-slate-600 truncate">{piece.name}</div>
              <div className="font-semibold text-slate-900 font-mono mt-0.5">{piece.surface} m²</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
