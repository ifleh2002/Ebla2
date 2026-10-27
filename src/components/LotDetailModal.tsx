import React, { useState } from 'react';
import { PropertyLot } from '../types';
import { Floorplan2DViewer } from './Floorplan2DViewer';
import { Virtual3DTour } from './Virtual3DTour';
import {
  X,
  Download,
  Calendar,
  ShieldCheck,
  Sparkles,
  Award,
  Play,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface LotDetailModalProps {
  lot: PropertyLot;
  onClose: () => void;
  onReserve: (lot: PropertyLot) => void;
  onRequestVisit: (lot: PropertyLot) => void;
}

interface OfficialPngDoc {
  id: string;
  badge: string;
  title: string;
  cat: string;
  url: string;
  resolution: string;
}

const OFFICIAL_PNG_DOCS: OfficialPngDoc[] = [
  {
    id: 'plan-1',
    badge: 'Planche 1/2 · PNG Ultra-HD',
    title: `Plans d'Architecture Autorisés « Ne Varietur » · Étage Courant R+3, Masse Balcon & Façades`,
    cat: 'Arch. El Atouani Mohamed Amine · Commune El Mansouria (Permis GUmsr-0124/2024)',
    url: '/assets/aistudio/plans_autorise_s__2_-1_cd342e2d.png',
    resolution: '10 962 × 5 314 px',
  },
  {
    id: 'plan-2',
    badge: 'Planche 2/2 · PNG Ultra-HD',
    title: `Plans d'Architecture Autorisés « Ne Varietur » · Sous-Sol (230 Parkings), RDC & Soupente`,
    cat: 'Arch. El Atouani Mohamed Amine · 153 Appartements + 9 Magasins + Piscine Centrale',
    url: '/assets/aistudio/plans_autorise_s__2_-2_b3f525bf.png',
    resolution: '10 629 × 5 314 px',
  },
  {
    id: 'plan-cadastral',
    badge: 'Cadastre ANCFCC · PNG HD',
    title: 'Plan Cadastral Officiel (Jawharat Al Bahr 16 · Échelle 1/500 · T.F. N° 36089/25)',
    cat: 'Service du Cadastre de Benslimane · Contenance 1ha 18a 41ca (11 841 m²)',
    url: '/assets/aistudio/PLAN_CADASTRAL_EBLA_ONE-1_4efc9c99.png',
    resolution: '2 481 × 3 508 px',
  },
];

export const LotDetailModal: React.FC<LotDetailModalProps> = ({
  lot,
  onClose,
  onReserve,
  onRequestVisit,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | '2d' | '3d' | 'specs' | 'finance' | 'docs'>('video');
  const [selectedPngDoc, setSelectedPngDoc] = useState<OfficialPngDoc>(OFFICIAL_PNG_DOCS[0]);
  const [pngZoom, setPngZoom] = useState<number>(1);

  const trancheMontant = Math.round(lot.prixTotal * 0.25);

  // Match the apartment typology/surface to the corresponding official ARK Architect video
  const getMatchedVideo = () => {
    if (lot.typology === 'F4' || lot.surfaceTotale >= 118) {
      return {
        url: '/assets/aistudio/VIDEO-2026-08-30-17-02-58_8210e145.mp4',
        poster: '/assets/aistudio/photo_apt_a_salon.jpg',
        label: 'Visite Vidéo Officielle · Appartement Type A (Grand F4 · 135 m²)',
      };
    }
    if (lot.typology === 'F3' && lot.surfaceTotale >= 90) {
      return {
        url: '/assets/aistudio/VIDEO-2026-08-30-17-02-59_2a6e36c0.mp4',
        poster: '/assets/aistudio/photo_apt_b_salon.jpg',
        label: 'Visite Vidéo Officielle · Appartement Type B (F3/F4 Balnéaire · 115 m²)',
      };
    }
    if (lot.typology === 'F3' || (lot.typology === 'F2' && lot.surfaceTotale >= 62)) {
      return {
        url: '/assets/aistudio/VIDEO-2026-08-30-17-02-51_abd5fb63.mp4',
        poster: '/assets/aistudio/photo_apt_c_salon.jpg',
        label: 'Visite Vidéo Officielle · Appartement Type C (Contemporain · 78 m²)',
      };
    }
    return {
      url: '/assets/aistudio/VIDEO-2026-08-30-17-03-01_84430d95.mp4',
      poster: '/assets/aistudio/photo_apt_d_studio.jpg',
      label: 'Visite Vidéo Officielle · Appartement Type D (Studio / F2 · 40 m²)',
    };
  };

  const matchedVideo = getMatchedVideo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
              {lot.type === 'magasin' ? 'MAG' : lot.typology}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">{lot.id}</h2>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                    lot.statut === 'Disponible'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : lot.statut === 'Réservé'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {lot.statut}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lot.bloc} &middot; {lot.etage === 0 ? 'Rez-de-chaussée' : `${lot.etage}e Étage (R+3)`} &middot;{' '}
                {lot.orientation === 'Mer'
                  ? 'Vue Océan Atlantique'
                  : lot.orientation === 'Piscine & Jardin'
                  ? 'Vue Piscine Centrale & Jardins'
                  : 'Plein Sud'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400 font-mono">
                {lot.prixAuM2.toLocaleString('fr-FR')} DH / m²
              </div>
              <div className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                {lot.prixTotal.toLocaleString('fr-FR')} DH
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Visite Vidéo HD</span>
          </button>
          <button
            onClick={() => setActiveTab('2d')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === '2d'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Plan 2D d'Architecte Coté
          </button>
          <button
            onClick={() => setActiveTab('3d')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === '3d'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Maquette 3D Interactive
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'specs'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Prestations &amp; Fiche Technique
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'finance'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Échéancier 4 Tranches
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Plans Officiels PNG (3)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Specs Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div>
              <div className="text-xs text-slate-500">Surface Totale</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {lot.surfaceTotale} m²
              </div>
              <div className="text-[11px] text-slate-500">
                ({lot.surfaceHabitable} hab + {lot.surfaceTerrasse} terr)
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Chambres &amp; Salles d'eau</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {lot.nbChambres} Ch &middot; {lot.nbSallesDeBain} SDB
              </div>
              <div className="text-[11px] text-slate-500">{lot.typology} haut standing</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Parking Sous-sol (230 pl.)</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                Place n° {lot.parkingSousSolNumero}
              </div>
              <div className="text-[11px] text-slate-500">Sous-sol -2,70 m sécurisé</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Prix Global Amicale</div>
              <div className="text-base font-bold text-amber-700 font-mono mt-0.5 tabular-nums">
                {lot.prixTotal.toLocaleString('fr-FR')} DH
              </div>
              <div className="text-[11px] text-slate-500">4 tranches sans intérêts</div>
            </div>
          </div>

          {/* Tab 0: Official Architectural Walkthrough Video */}
          {activeTab === 'video' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{matchedVideo.label}</h4>
                <a
                  href={matchedVideo.url}
                  download
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger MP4</span>
                </a>
              </div>
              <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video shadow-sm">
                <video
                  src={matchedVideo.url}
                  poster={matchedVideo.poster}
                  controls
                  autoPlay
                  playsInline
                  onLoadedMetadata={(e) => {
                    if (e.currentTarget.currentTime < 12) {
                      e.currentTarget.currentTime = 12;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Tab 1: 2D Floorplan */}
          {activeTab === '2d' && (
            <div>
              <Floorplan2DViewer lot={lot} />
            </div>
          )}

          {/* Tab 2: 3D Tour */}
          {activeTab === '3d' && (
            <div>
              <Virtual3DTour lot={lot} />
            </div>
          )}

          {/* Tab 3: Detailed Specifications */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  Cahier des Charges &amp; Matériaux de Finition (T.F. N° 36089/25 · Permis GUmsr-0124/2024)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-semibold text-slate-900">Revêtements Sols &amp; Murs</div>
                      <div className="text-slate-600 mt-0.5">
                        Carrelage grès cérame grand format 120x60 importé. Marbre naturel dans les halls et escaliers. Enduit lisse blanc et garde-corps en vitrage feuilleté.
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-semibold text-slate-900">Menuiserie Aluminium &amp; Vitrages</div>
                      <div className="text-slate-600 mt-0.5">
                        Profilés aluminium gris clair à rupture de pont thermique. Double vitrage isolant phonique et thermique. Volets roulants électriques.
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-semibold text-slate-900">Équipements Sanitaires</div>
                      <div className="text-slate-600 mt-0.5">
                        Sanitaires suspendus de premier choix. Miroirs rétroéclairés LED. Douche à l'italienne avec paroi vitrée et robinetterie encastrée.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-semibold text-slate-900">Cuisine &amp; Boiseries</div>
                      <div className="text-slate-600 mt-0.5">
                        Cuisine design intégrée sur mesure avec plans de travail en Quartz, îlot ou table bar selon typologie, hotte, plaque et four encastré. Dressings en chêne clair.
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-semibold text-slate-900">Sous-Sol &amp; Stationnement</div>
                      <div className="text-slate-600 mt-0.5">
                        Sous-sol de 7 500 m² à -2,70 m comprenant 230 places de stationnement, 2 rampes d'accès (pente 5% et 18%) et accès direct aux ascenseurs.
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-semibold text-slate-900">Domaine Balnéaire de 11 841 m²</div>
                      <div className="text-slate-600 mt-0.5">
                        Grande piscine centrale entourée de jardins paysagers et palmiers, passage carrossable de sécurité, gardiennage et vidéosurveillance 24h/24.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Financial Simulation */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 rounded-xl border border-amber-200/80 p-5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Modalités de Financement de l'Amicale d'Habitation
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Le projet est réalisé sur le terrain titré N° 36089/25 (1ha 18a 41ca) vierge de toute hypothèque. Le paiement s'effectue en 4 tranches de 25% selon l'avancement réel des travaux, sans aucun intérêt bancaire.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">Tranche 1 (25%)</div>
                  <div className="text-base font-bold text-slate-900 font-mono mt-1 tabular-nums">
                    {trancheMontant.toLocaleString('fr-FR')} DH
                  </div>
                  <div className="text-xs text-slate-600 mt-1">À la réservation &amp; adhésion</div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">Tranche 2 (25%)</div>
                  <div className="text-base font-bold text-slate-900 font-mono mt-1 tabular-nums">
                    {trancheMontant.toLocaleString('fr-FR')} DH
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Achèvement Gros Œuvre (100%)</div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">Tranche 3 (25%)</div>
                  <div className="text-base font-bold text-slate-900 font-mono mt-1 tabular-nums">
                    {trancheMontant.toLocaleString('fr-FR')} DH
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Finitions &amp; menuiseries (en cours)</div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500">Tranche 4 (25%)</div>
                  <div className="text-base font-bold text-slate-900 font-mono mt-1 tabular-nums">
                    {trancheMontant.toLocaleString('fr-FR')} DH
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Remise des clés &amp; Titre foncier</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Official High-Resolution PNG Plans & Documents */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              {/* Selector buttons for the 3 PNG plans */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {OFFICIAL_PNG_DOCS.map((doc) => {
                  const isSelected = selectedPngDoc.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        setSelectedPngDoc(doc);
                        setPngZoom(1);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className={isSelected ? 'text-amber-400' : 'text-amber-700'}>
                            {doc.badge}
                          </span>
                          <span className="font-mono opacity-75">{doc.resolution}</span>
                        </div>
                        <div className="text-xs font-bold leading-snug line-clamp-2">{doc.title}</div>
                      </div>
                      <div className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'} truncate`}>
                        {doc.cat}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Inline Interactive PNG Plan Viewer */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-white">
                  <div className="text-xs font-bold truncate max-w-md">{selectedPngDoc.title}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPngZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                        className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-[11px] font-mono font-bold text-amber-300">
                        {Math.round(pngZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setPngZoom((z) => Math.min(3, +(z + 0.5).toFixed(2)))}
                        className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPngZoom(1)}
                        className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>

                    <a
                      href={selectedPngDoc.url}
                      download
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger PNG</span>
                    </a>
                  </div>
                </div>

                <div className="bg-slate-100 max-h-[380px] overflow-auto p-3 flex items-center justify-center">
                  <div
                    style={{
                      width: `${pngZoom * 100}%`,
                      minWidth: pngZoom > 1 ? `${pngZoom * 100}%` : '100%',
                    }}
                    className="bg-white rounded-lg p-1.5 shadow-xs"
                  >
                    <img
                      src={selectedPngDoc.url}
                      alt={selectedPngDoc.title}
                      onClick={() => setPngZoom((z) => (z < 2 ? 2 : 1))}
                      className="w-full h-auto object-contain cursor-zoom-in"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Titre Foncier N° 36089/25 &middot; Permis N° GUmsr-0124/2024 &middot; Mansouria
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRequestVisit(lot)}
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Réserver une visite sur site</span>
            </button>

            {lot.statut === 'Disponible' ? (
              <button
                onClick={() => onReserve(lot)}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Réserver ce lot</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 italic px-3 py-2 bg-slate-200/60 rounded-lg">
                Ce lot fait déjà l'objet d'une adhésion
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
