import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PropertyLot, ReservationDemande } from '../types';
import { X, CheckCircle, ShieldCheck, FileCheck, ArrowRight, Sparkles, Building, User, Phone, Mail, IdCard } from 'lucide-react';

interface ReservationModalProps {
  lot: PropertyLot;
  onClose: () => void;
  onSuccess: (reservation: ReservationDemande) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  lot,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nom, setNom] = useState('');
  const [cin, setCin] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState('Casablanca / Mohammedia');
  const [modePaiement, setModePaiement] = useState('Virement bancaire certifié');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<ReservationDemande | null>(null);

  const apport25 = Math.round(lot.prixTotal * 0.25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !cin || !telephone || !email || !acceptTerms) return;

    const newRes: ReservationDemande = {
      id: `RES-${Date.now().toString().slice(-4)}`,
      lotId: lot.id,
      nomClient: nom,
      cin: cin.toUpperCase(),
      telephone: telephone,
      email: email,
      apportInitial: apport25,
      dateDemande: new Date().toLocaleDateString('fr-FR'),
      statut: 'En attente de validation',
      commentaire: `Demande d'adhésion pour le lot ${lot.id} (${lot.typology} - ${lot.surfaceTotale}m²). Mode: ${modePaiement}.`,
    };

    setCreatedReservation(newRes);
    setStep(3);

    // Fire joyful confetti animation
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#d97706', '#0284c7', '#10b981'],
    });

    onSuccess(newRes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Dossier de Réservation &middot; {lot.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress indicator */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-100 text-xs text-slate-600 border-b border-slate-200">
          <span className={step >= 1 ? 'font-bold text-amber-700' : ''}>1. Choix du Lot</span>
          <span>&rarr;</span>
          <span className={step >= 2 ? 'font-bold text-amber-700' : ''}>2. Coordonnées Acquéreur</span>
          <span>&rarr;</span>
          <span className={step >= 3 ? 'font-bold text-emerald-700' : ''}>3. Confirmation</span>
        </div>

        {/* Step 1: Recap */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 text-xs space-y-1.5 text-amber-900">
              <div className="font-bold text-sm">Amicale Résidence Ebla Two (Mansouria)</div>
              <div>Votre choix : <strong>{lot.id}</strong> ({lot.typology} · {lot.bloc} · {lot.surfaceTotale} m²)</div>
              <div>Orientation : <strong>{lot.orientation}</strong> &middot; Place parking n° {lot.parkingSousSolNumero}</div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-800">
                Plan Financier &amp; Apport Initial
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">Prix Total Amicale</div>
                  <div className="text-base font-bold font-mono text-slate-900 tabular-nums">
                    {lot.prixTotal.toLocaleString('fr-FR')} DH
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-medium">Acompte 25% Exigible</div>
                  <div className="text-base font-bold font-mono text-emerald-800 tabular-nums">
                    {apport25.toLocaleString('fr-FR')} DH
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                Le montant d'adhésion est versé sur le compte séquestre de l'Amicale auprès d'Attijariwafa Bank. Une quittance officielle et le contrat d'adhésion notarié vous seront délivrés.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-xs"
              >
                <span>Continuer vers mes coordonnées</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nom et Prénom *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mohammed Benjelloun"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  N° CIN ou Passeport MRE *
                </label>
                <div className="relative">
                  <IdCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: BK123456"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Téléphone Mobile (WhatsApp) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+212 6 XX XX XX XX"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Adresse Email *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="nom@exemple.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mode de versement de l'acompte
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Virement bancaire certifié">Virement bancaire vers RIB de l'Amicale</option>
                <option value="Chèque certifié de banque">Chèque certifié déposé au bureau de l'amicale</option>
                <option value="Versement espèces direct en agence">Versement espèces sur compte Attijariwafa</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>
                  Je confirme mon intention d'adhérer à l'Amicale d'Habitation Résidence Ebla Two et j'accepte les statuts déposés ainsi que l'échéancier prévisionnel en 4 tranches.
                </span>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                &larr; Retour
              </button>

              <button
                type="submit"
                disabled={!acceptTerms}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-xs"
              >
                <span>Confirmer &amp; Transmettre le Dossier</span>
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && createdReservation && (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900">
                Dossier de Réservation Transmis avec Succès !
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Votre dossier <strong>n° {createdReservation.id}</strong> a été enregistré et transmis au Bureau Exécutif et au Conseiller Commercial de l'Amicale Ebla Two.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Lot réservé :</span>
                <span className="font-bold text-slate-900">{createdReservation.lotId} ({lot.typology})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Acquéreur :</span>
                <span className="text-slate-900">{createdReservation.nomClient} (CIN: {createdReservation.cin})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Acompte à régler :</span>
                <span className="font-bold text-emerald-700">{createdReservation.apportInitial.toLocaleString('fr-FR')} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Compte Amicale :</span>
                <span className="text-slate-700">Attijariwafa Mohammedia (RIB 007 780 000123...)</span>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Un SMS de confirmation a été envoyé au {createdReservation.telephone}. Le conseiller vous contactera sous 24h.
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Fermer &amp; Retourner à l'exploration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
