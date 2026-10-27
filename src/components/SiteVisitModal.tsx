import React, { useState } from 'react';
import { PropertyLot, VisiteRdv } from '../types';
import { X, Calendar, MapPin, CheckCircle, Video, ExternalLink, Download } from 'lucide-react';
import {
  buildGoogleCalendarTemplateUrl,
  buildGoogleCalendarIcsDataUri,
  createGoogleCalendarVisitEvent,
} from '../services/firebaseWorkspaceService';

interface SiteVisitModalProps {
  lot?: PropertyLot;
  onClose: () => void;
  onSuccess: (visite: VisiteRdv) => void;
}

export const SiteVisitModal: React.FC<SiteVisitModalProps> = ({
  lot,
  onClose,
  onSuccess,
}) => {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('2026-10-31');
  const [creneau, setCreneau] = useState('11:00');
  const [typeVisite, setTypeVisite] = useState<'Sur site Mansouria' | 'Visite virtuelle 3D guidée'>('Sur site Mansouria');
  const [confirmed, setConfirmed] = useState(false);
  const [calendarLink, setCalendarLink] = useState<string>('');
  const [icsUri, setIcsUri] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !telephone || !email) return;

    const visitParams = {
      nomVisiteur: nom,
      telephone,
      date,
      creneau,
      typeVisite,
      lotId: lot?.id,
    };

    const gcalTemplate = buildGoogleCalendarTemplateUrl(visitParams);
    const icsData = buildGoogleCalendarIcsDataUri(visitParams);
    setCalendarLink(gcalTemplate);
    setIcsUri(icsData);

    try {
      const ev = await createGoogleCalendarVisitEvent(visitParams);
      if (ev.htmlLink) setCalendarLink(ev.htmlLink);
    } catch {
      // Uses universal template link
    }

    const newVisit: VisiteRdv = {
      id: `VIS-${Date.now().toString().slice(-4)}`,
      nomVisiteur: nom,
      telephone,
      email,
      date,
      creneau,
      typeVisite,
      statut: 'Confirmée',
      lotInteresseId: lot?.id,
      conseillerAssigne: 'Yassine Berrada (Conseiller Commercial)',
    };

    onSuccess(newVisit);
    setConfirmed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Réserver une Visite {lot ? `· Lot ${lot.id}` : ''}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!confirmed ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Bureau de Vente &amp; Chantier · Mansouria (Mohammedia)</span>
              </div>
              <p className="text-slate-600">
                À 2 minutes de la sortie d&apos;autoroute Mansouria et 300m de la plage. Appartement témoin et vue panoramique sur place.
              </p>
            </div>

            {/* Visit Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Type de Rendez-vous
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTypeVisite('Sur site Mansouria')}
                  className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    typeVisite === 'Sur site Mansouria' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sur site à Mansouria</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTypeVisite('Visite virtuelle 3D guidée')}
                  className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    typeVisite === 'Visite virtuelle 3D guidée' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-sky-600" />
                  <span>Visioconférence 3D</span>
                </button>
              </div>
            </div>

            {/* Date & Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date souhaitée
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Créneau horaire
                </label>
                <select
                  value={creneau}
                  onChange={(e) => setCreneau(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="09:30">09:30 - Matinée</option>
                  <option value="10:30">10:30 - Matinée</option>
                  <option value="11:00">11:00 - Matinée</option>
                  <option value="14:30">14:30 - Après-midi</option>
                  <option value="16:00">16:00 - Après-midi</option>
                  <option value="17:30">17:30 - Coucher de soleil</option>
                </select>
              </div>
            </div>

            {/* Visitor Info */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom Complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Votre nom et prénom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+212 6 XX XX XX XX"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@exemple.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                Confirmer &amp; Préparer Google Calendar
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">
                Visite Confirmée avec Succès !
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Nous serons ravis de vous accueillir le <strong>{date} à {creneau}</strong> pour votre visite {typeVisite.toLowerCase()}.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono">
              Conseiller assigné : Yassine Berrada (+212 5 23 32 40 00)
            </div>

            <div className="space-y-2 pt-1">
              {calendarLink && (
                <a
                  href={calendarLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ajouter dans mon Google Calendar (Tout compte Gmail)</span>
                </a>
              )}

              {icsUri && (
                <a
                  href={icsUri}
                  download={`RDV-Ebla-Two-${date}.ics`}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>Télécharger le fichier Agenda (.ics)</span>
                </a>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Terminer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
