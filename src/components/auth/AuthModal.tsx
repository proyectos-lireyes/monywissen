import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, LogIn, Lock, X, CloudUpload } from 'lucide-react';
import { registerUserInFirebase, restoreStateFromFirebase, loginWithGoogleFirebase } from '../../utils/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginUser, importFullState, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogleFirebase();
      if (res.backupData) {
        importFullState(res.backupData);
        showToast('¡Datos financieros restaurados desde Firebase Cloud!', '🔄');
      }
      loginUser(res.user, res.token);
      showToast(`¡Bienvenido ${res.user.alias}! Sesión iniciada con Google`, '🌐');
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      showToast('No se pudo completar el acceso con Google Popup en el iframe. Puedes ingresar tu correo abajo.', '⚠️');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !alias) {
      showToast('Por favor completa el correo y alias', '⚠️');
      return;
    }

    setLoading(true);

    try {
      // 1. Register/Update User directly in Firebase Firestore Database
      const fbResult = await registerUserInFirebase(email, alias, phone);
      if (fbResult.isNew) {
        showToast('¡Registro exitoso en la Base de Datos Firebase!', '🔥');
      } else {
        showToast('Usuario verificado en Firebase Cloud', '☁️');
      }

      // 2. Try restoring state from Firebase DB
      const backupData = await restoreStateFromFirebase(email);
      if (backupData) {
        importFullState(backupData);
        showToast('¡Datos financieros restaurados desde Firebase DB!', '🔄');
      }

      // 3. Issue Token and Login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, alias, phone }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        loginUser(data.user, data.token);
      } else {
        const simulatedToken = `jwt_sim_${Date.now()}_${btoa(email)}`;
        loginUser({ email, alias, phone }, simulatedToken);
      }

      onClose();
    } catch (err) {
      console.error('Registration/Auth error:', err);
      // Fallback local registration
      const simulatedToken = `jwt_sim_${Date.now()}_${btoa(email)}`;
      loginUser({ email, alias, phone }, simulatedToken);
      showToast('Sesión iniciada localmente (Modo Offline)', '⚡');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Autenticación JWT
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Inicia sesión para sincronización segura en la nube y token JWT cifrado.
        </p>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2.5 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {loading ? 'Cargando Google...' : 'Continuar con Google'}
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider absolute">
            o con tu correo
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Alias Único</label>
            <input
              type="text"
              required
              value={alias}
              onChange={e => setAlias(e.target.value)}
              placeholder="Ej. Lissandro"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Teléfono (Opcional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+584141234567"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogIn className="w-4 h-4" /> {loading ? 'Conectando con Firebase...' : 'Continuar / Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
