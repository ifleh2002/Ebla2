import React from 'react';
import { NotificationApp } from '../types';
import { X, Bell, CheckCircle, AlertTriangle, Building, CreditCard, Users, Check } from 'lucide-react';

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationApp[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  const getIcon = (cat: NotificationApp['categorie']) => {
    switch (cat) {
      case 'Paiement':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'Chantier':
        return <Building className="w-4 h-4 text-amber-600" />;
      case 'Réunion':
        return <Users className="w-4 h-4 text-sky-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slide-left">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Centre de Notifications</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">{notifications.length} alertes</span>
          <button
            onClick={onMarkAllAsRead}
            className="text-amber-700 hover:text-amber-900 font-semibold"
          >
            Tout marquer comme lu
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onMarkAsRead(n.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                n.lue ? 'bg-slate-50/70 border-slate-200' : 'bg-amber-50/40 border-amber-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 shrink-0">
                  {getIcon(n.categorie)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{n.titre}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{n.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
