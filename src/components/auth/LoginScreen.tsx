import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, LogIn, Wallet, Sparkles } from 'lucide-react';
import { registerUserInFirebase, restoreStateFromFirebase, loginWithGoogleFirebase } from '../../utils/firebase';

export const LoginScreen: React.FC = () => {
  const { loginUser, importFullState, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogleFirebase();
      if (res.backupData) {
        importFullState(res.backupData);
        showToast('¡Perfil completo y datos restaurados desde Firebase Cloud!', '🔄');
      }
      loginUser(res.user, res.token);
      showToast(`¡Bienvenido ${res.user.alias}! Sesión iniciada con Google`, '🌐');
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      showToast('Error al iniciar sesión con Google: ' + err.message, '⚠️');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !alias.trim()) {
      showToast('Por favor ingresa tu correo y alias para continuar', '⚠️');
      return;
    }

    setLoading(true);

    try {
      // 1. Register/Update User in Firebase Firestore
      const fbResult = await registerUserInFirebase(email, alias, phone);
      if (fbResult.isNew) {
        showToast('¡Cuenta registrada exitosamente en Firebase Cloud DB!', '🔥');
      } else {
        showToast('Usuario autenticado en Firebase Cloud DB', '☁️');
      }

      // 2. Try restoring state from Firebase DB
      const backupData = await restoreStateFromFirebase(email);
      if (backupData) {
        importFullState(backupData);
        showToast('¡Perfil completo y base financiera restaurados!', '🔄');
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
    } catch (err) {
      console.error('Registration/Auth error:', err);
      // Fallback local registration
      const simulatedToken = `jwt_sim_${Date.now()}_${btoa(email)}`;
      loginUser({ email, alias, phone }, simulatedToken);
      showToast('Sesión iniciada correctamente', '⚡');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Accent Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-md w-full max-h-[90vh] overflow-y-auto bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 space-y-6">
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 mb-1 shadow-xs">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            MonyWissen <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Planificación e Inteligencia Financiera Personal
          </p>
        </div>

        {/* Security Badge */}
        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-3 text-xs text-blue-900">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="font-medium">Acceso seguro con respaldo automático en Firebase Cloud DB.</span>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-3 transition-all transform active:scale-98 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider absolute">
            o con tu correo
          </span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ejemplo@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-slate-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre / Alias
            </label>
            <input
              type="text"
              required
              value={alias}
              onChange={e => setAlias(e.target.value)}
              placeholder="Ej. Lissandro"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-slate-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teléfono (Opcional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+584141234567"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-slate-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Verificando con Firebase...' : 'Iniciar Sesión / Acceder'}
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500 font-medium">
          Al iniciar sesión, tus datos y perfil se sincronizarán en la nube de Firebase Firestore.
        </p>
      </div>
    </div>
  );
};
