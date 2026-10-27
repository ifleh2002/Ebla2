import React from 'react';
import { UtilisateurSession, NotificationApp } from '../types';
import {
  Building2,
  Layers,
  ShieldCheck,
  Users,
  Bot,
  Bell,
  LogIn,
  LogOut,
  Film,
  Cloud,
} from 'lucide-react';

export const EBLA_LOGO_URL = '/assets/aistudio/Logo_premium_de_r_sidence_Ebal_two_66cf26e0.png';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  session: UtilisateurSession | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
  onToggleChatbot: () => void;
  onOpenWorkspace: () => void;
  isGoogleConnected: boolean;
  notifications: NotificationApp[];
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  session,
  onOpenAuth,
  onLogout,
  onOpenNotifications,
  onToggleChatbot,
  onOpenWorkspace,
  isGoogleConnected,
  notifications,
}) => {
  const unreadCount = notifications.filter((n) => !n.lue).length;

  return (
    <>
      {/* Top Bar Header (Desktop & Tablet) with Royal Navy & Imperial Gold Identity */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-2xs">
        {/* Subtle Gold & Royal Navy Signature Top Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#895811] via-[#e3bc68] to-[#061836]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Zone 1: Official Logo & Brand Lockup */}
          <button
            onClick={() => onSelectTab('vitrine')}
            className="text-left whitespace-nowrap shrink-0 group flex items-center gap-3 cursor-pointer"
          >
            <div className="h-13 w-16 sm:w-20 rounded-xl bg-white border border-amber-200/90 shadow-2xs p-1 flex items-center justify-center overflow-hidden group-hover:border-amber-500 transition-colors">
              <img
                src={EBLA_LOGO_URL}
                alt="Logo Résidence Ebla Two"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                RÉSIDENCE EBLA TWO
              </span>
              <span className="text-[11px] font-semibold text-amber-700 tracking-wide">
                Mansouria · Prestige Balnéaire
              </span>
            </div>
          </button>

          {/* Zone 2: Clean Typography Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600">
            <button
              onClick={() => onSelectTab('vitrine')}
              className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer py-1.5 border-b-2 ${
                currentTab === 'vitrine'
                  ? 'text-slate-900 font-bold border-amber-500'
                  : 'border-transparent'
              }`}
            >
              Vitrine, Vidéos &amp; Plans PNG
            </button>

            <button
              onClick={() => onSelectTab('lots')}
              className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer py-1.5 border-b-2 ${
                currentTab === 'lots'
                  ? 'text-slate-900 font-bold border-amber-500'
                  : 'border-transparent'
              }`}
            >
              162 Apps &amp; 9 Magasins (R+3)
            </button>

            <button
              onClick={() => onSelectTab('chantier')}
              className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer py-1.5 border-b-2 ${
                currentTab === 'chantier'
                  ? 'text-slate-900 font-bold border-amber-500'
                  : 'border-transparent'
              }`}
            >
              Suivi Travaux (72%)
            </button>

            <button
              onClick={() => onSelectTab('adherent')}
              className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer py-1.5 border-b-2 ${
                currentTab === 'adherent'
                  ? 'text-slate-900 font-bold border-amber-500'
                  : 'border-transparent'
              }`}
            >
              Espace Adhérent
            </button>

            <button
              onClick={() => onSelectTab('bureau')}
              className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer py-1.5 border-b-2 ${
                currentTab === 'bureau'
                  ? 'text-slate-900 font-bold border-amber-500'
                  : 'border-transparent'
              }`}
            >
              Bureau Exécutif
            </button>
          </nav>

          {/* Zone 3: Primary Action & Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Google Workspace & Firebase Cloud Button */}
            <button
              onClick={onOpenWorkspace}
              className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isGoogleConnected
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              title="Google Drive, Google Sheets, Google Calendar & Firebase Firestore"
            >
              <Cloud className={`w-4 h-4 ${isGoogleConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="hidden xl:inline">Google Cloud &amp; Sheets</span>
            </button>

            <button
              onClick={onToggleChatbot}
              className="p-2 text-slate-900 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Conseiller IA Bilingue Darija / Français"
            >
              <Bot className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">IA Darija</span>
            </button>

            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Alertes &amp; Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {session ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                    {session.nom}
                  </div>
                  <div className="text-[10px] text-amber-700 font-semibold capitalize">
                    {session.role}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Déconnexion"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Quitter</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Connexion</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200 shadow-lg">
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => onSelectTab('vitrine')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'vitrine'
                ? 'text-amber-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Vitrine</span>
          </button>

          <button
            onClick={() => onSelectTab('lots')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'lots'
                ? 'text-amber-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">162 Apps</span>
          </button>

          <button
            onClick={() => onSelectTab('chantier')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'chantier'
                ? 'text-amber-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Travaux</span>
          </button>

          <button
            onClick={() => onSelectTab('adherent')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'adherent'
                ? 'text-amber-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Adhérent</span>
          </button>

          <button
            onClick={() => onSelectTab('bureau')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'bureau'
                ? 'text-amber-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Bureau</span>
          </button>
        </div>
      </div>
    </>
  );
};
