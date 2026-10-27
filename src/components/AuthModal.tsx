import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { RoleUtilisateur, UtilisateurSession } from '../types';
import { googleSignIn, googleSignInBasic } from '../services/firebaseWorkspaceService';
import { Lock, ShieldCheck, X, User, Briefcase, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (session: UtilisateurSession, fbUser?: FirebaseUser, token?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Universal Google Sign-In (works for ANY Gmail account like iflehdriss@gmail.com without OAuth 403!)
  const handleBasicGoogleSignIn = async () => {
    setIsSigningInGoogle(true);
    setError(null);
    try {
      const { user, accessToken } = await googleSignInBasic();
      const isBureauAdmin = user.email === 'ifleh2002@gmail.com';
      onLogin(
        {
          role: isBureauAdmin ? 'bureau' : 'adherent',
          nom: user.displayName || user.email?.split('@')[0] || 'Adhérent Ebla Two',
          email: user.email || 'adherent@eblatwo.ma',
          titreFonction: isBureauAdmin
            ? 'Administrateur Bureau Exécutif'
            : `Adhérent Connecté (${user.email})`,
          adherentProfileId: 'ADH-2026-088',
        },
        user,
        accessToken || undefined
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'La connexion Google a été annulée.');
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Full Google Workspace OAuth Sign-In (Drive, Sheets, Calendar APIs)
  const handleWorkspaceGoogleSignIn = async () => {
    setIsSigningInGoogle(true);
    setError(null);
    try {
      const { user, accessToken } = await googleSignIn();
      const isBureauAdmin = user.email === 'ifleh2002@gmail.com';
      onLogin(
        {
          role: isBureauAdmin ? 'bureau' : 'adherent',
          nom: user.displayName || user.email?.split('@')[0] || 'Adhérent Ebla Two',
          email: user.email || 'adherent@eblatwo.ma',
          titreFonction: isBureauAdmin
            ? 'Administrateur Bureau Exécutif (Google Workspace)'
            : 'Adhérent Connecté Google Workspace',
          adherentProfileId: 'ADH-2026-088',
        },
        user,
        accessToken
      );
      onClose();
    } catch (err: any) {
      setError(
        "Si vous utilisez un compte autre que ifleh2002@gmail.com (ex: iflehdriss@gmail.com), cliquez sur 'Sign in with Google (Tout compte Gmail)' ci-dessus ou ajoutez votre email aux Testeurs OAuth dans Google Cloud Console."
      );
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleQuickDemoLogin = (role: RoleUtilisateur) => {
    switch (role) {
      case 'bureau':
        onLogin({
          role: 'bureau',
          nom: 'Dr. Mohammed Tazi',
          email: 'president@eblatwo.ma',
          titreFonction: 'Président du Bureau Exécutif',
        });
        break;
      case 'commercial':
        onLogin({
          role: 'commercial',
          nom: 'Yassine Berrada',
          email: 'commercial@eblatwo.ma',
          titreFonction: 'Responsable Commercial Mansouria',
        });
        break;
      case 'adherent':
        onLogin({
          role: 'adherent',
          nom: 'Mme. Karima El Fassi',
          email: 'adherent@eblatwo.ma',
          titreFonction: 'Adhérente Propriétaire Lot B-204 (F3 Vue Mer)',
          adherentProfileId: 'ADH-2026-088',
        });
        break;
      default:
        break;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-11 rounded-xl bg-white border border-amber-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src="/assets/aistudio/Logo_premium_de_r_sidence_Ebal_two_66cf26e0.png"
                alt="Logo Résidence Ebla Two"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Connexion Google &amp; Espace Membre</h3>
              <p className="text-xs text-slate-500">Amicale Résidence Ebla Two · Firebase Auth</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Official Google Sign-In Section */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Authentification Google &amp; Cloud
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Connectez-vous avec n&apos;importe quel compte Gmail (ex: <strong>iflehdriss@gmail.com</strong>) sans restriction OAuth, ou activez l&apos;API Workspace complète avec le compte propriétaire (<strong>ifleh2002@gmail.com</strong>).
          </p>

          <button
            type="button"
            onClick={handleBasicGoogleSignIn}
            disabled={isSigningInGoogle}
            className="gsi-material-button w-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="gsi-material-button-state" />
            <div className="gsi-material-button-content-wrapper flex items-center gap-2.5">
              <div className="gsi-material-button-icon w-4 h-4">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block', width: '100%', height: '100%' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </div>
              <span className="gsi-material-button-contents">
                {isSigningInGoogle ? 'Connexion en cours...' : 'Sign in with Google (Tout compte Gmail)'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleWorkspaceGoogleSignIn}
            disabled={isSigningInGoogle}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Activer les APIs Drive / Sheets / Calendar (ifleh2002@gmail.com)
          </button>

          {error && (
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-lg text-[11px] text-amber-200 space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{error}</span>
              </div>
              <a
                href="https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0242623543"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-300 underline font-bold hover:text-white"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Ajouter iflehdriss@gmail.com aux Testeurs OAuth ou Publier l&apos;appli</span>
              </a>
            </div>
          )}
        </div>

        {/* Quick Demo Role Switcher */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Accès Rapide aux Vues Métier (Démo)</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('bureau')}
              className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-amber-700" />
                <div>
                  <div className="font-bold text-slate-900">Bureau Exécutif (Dr. Tazi)</div>
                  <div className="text-[10px] text-slate-500">Travaux, Trésorerie &amp; Validation Dossiers</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-amber-700">Ouvrir &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('commercial')}
              className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-400 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-sky-700" />
                <div>
                  <div className="font-bold text-slate-900">Conseiller Commercial (Y. Berrada)</div>
                  <div className="text-[10px] text-slate-500">Visites &amp; Réservations</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-sky-700">Ouvrir &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('adherent')}
              className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <div>
                  <div className="font-bold text-slate-900">Espace Adhérent (Mme. El Fassi)</div>
                  <div className="text-[10px] text-slate-500">Propriétaire Lot B-204 (F3 Vue Mer)</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700">Ouvrir &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
