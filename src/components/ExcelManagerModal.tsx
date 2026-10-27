import React, { useState, useRef } from 'react';
import { PropertyLot } from '../types';
import { exportLotsToExcel, parseLotsFromExcelBuffer } from '../utils/excelHelper';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCcw, 
  Table, 
  Sparkles 
} from 'lucide-react';

interface ExcelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lots: PropertyLot[];
  onUpdateLots: (newLots: PropertyLot[]) => void;
  onResetDefaultLots: () => void;
}

export const ExcelManagerModal: React.FC<ExcelManagerModalProps> = ({
  isOpen,
  onClose,
  lots,
  onUpdateLots,
  onResetDefaultLots,
}) => {
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    countApps?: number;
    countMags?: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    exportLotsToExcel(lots, 'Modele_Inventaire_Ebla_Two_162Apps_9Magasins.xlsx');
  };

  const processFile = async (file: File) => {
    setImportStatus(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsedLots = parseLotsFromExcelBuffer(buffer);
      const countApps = parsedLots.filter((l) => l.type === 'appartement').length;
      const countMags = parsedLots.filter((l) => l.type === 'magasin').length;

      onUpdateLots(parsedLots);
      setImportStatus({
        type: 'success',
        message: `Importation réussie ! Le site a été mis à jour avec vos données exactes (${parsedLots.length} lots au total).`,
        countApps,
        countMags,
      });
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err?.message || 'Erreur lors de la lecture du fichier Excel. Vérifiez le format (.xlsx ou .csv).',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Gestion Excel de l'Inventaire (162 Apps &amp; 9 Magasins)
              </h2>
              <p className="text-xs text-slate-400">
                Téléchargez le modèle Excel, saisissez vos informations exactes, puis réimportez-le
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Download Excel File */}
          <div className="p-5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <span>Étape 1 · Télécharger le Fichier Excel (.xlsx)</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Modèle Pré-structuré des 171 Lots (162 Appartements + 9 Magasins · Immeubles A à F)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Contient toutes les colonnes nécessaires : <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-emerald-200">ID_Lot</code>, <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-emerald-200">Bloc</code>, <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-emerald-200">Etage</code>, <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-emerald-200">Typologie</code>, surfaces, prix au m², prix total, statut, parking et adhérent réservataire, ainsi qu'un onglet <strong>Guide_Saisie</strong>.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le Fichier Excel (.xlsx)</span>
            </button>
          </div>

          {/* Step 2: Upload Filled Excel File */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Étape 2 · Importer votre Fichier Excel Complété
              </span>
              <span className="text-[11px] text-slate-500">Formats acceptés : .xlsx, .xls, .csv</span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/60'
                  : 'border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                Cliquez ici pour choisir votre fichier Excel ou glissez-déposez-le
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Dès l'importation, les 162 appartements (6 immeubles A à F) et 9 magasins sur le plan de masse, les fiches 2D/3D et le tableau de bord seront immédiatement mis à jour.
              </p>
            </div>

            {/* Status Feedback */}
            {importStatus && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {importStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-bold">{importStatus.message}</div>
                  {importStatus.type === 'success' && (
                    <div className="text-emerald-800 font-mono">
                      • {importStatus.countApps} appartements chargés &middot; {importStatus.countMags} magasins chargés
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Column Structure Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Table className="w-4 h-4 text-amber-600" />
              <span>Colonnes incluses dans le fichier Excel :</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              {[
                { col: 'ID_Lot', ex: 'APP-A001, MAG-01' },
                { col: 'Type_Bien', ex: 'appartement | magasin' },
                { col: 'Bloc', ex: 'Immeuble A à Immeuble F (R+3)' },
                { col: 'Etage', ex: '0 (RDC), 1, 2 ou 3' },
                { col: 'Typologie', ex: 'Studio, F2, F3, F4, Local Commercial' },
                { col: 'Surface_Habitable_m2', ex: 'Ex: 84 (en m²)' },
                { col: 'Surface_Terrasse_m2', ex: 'Ex: 12 (en m²)' },
                { col: 'Surface_Totale_m2', ex: 'Ex: 96 (en m²)' },
                { col: 'Orientation', ex: 'Mer | Piscine & Jardin | Sud/Soleil' },
                { col: 'Prix_m2_DH', ex: 'Ex: 11200 (en MAD)' },
                { col: 'Prix_Total_DH', ex: 'Ex: 1075200 (en MAD)' },
                { col: 'Statut', ex: 'Disponible | Réservé | Vendu' },
                { col: 'Nb_Chambres / SDB', ex: 'Nombre de pièces' },
                { col: 'Numero_Parking_Sous_Sol', ex: 'N° place titrée' },
                { col: 'Nom_Adherent_Reserve', ex: 'Nom & CIN acquéreur' },
              ].map((item, i) => (
                <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-mono font-bold text-slate-900">{item.col}</div>
                  <div className="text-slate-500 truncate">{item.ex}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              onResetDefaultLots();
              setImportStatus({
                type: 'success',
                message: 'Les données ont été réinitialisées avec la configuration officielle des 162 appartements (Immeubles A à F) et 9 magasins.',
                countApps: 162,
                countMags: 9,
              });
            }}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser l'inventaire par défaut</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
