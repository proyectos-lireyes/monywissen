import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, LogIn, Wallet, Sparkles } from 'lucide-react';
import { registerUserInFirebase, restoreStateFromFirebase, loginWithGoogleFirebase, loginWithEmailFirebase, registerWithEmailFirebase } from '../../utils/firebase';

export const LoginScreen: React.FC = () => {
  const { loginUser, importFullState, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

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
    if (!email.trim() || !password.trim()) {
      showToast('Por favor ingresa tu correo y contraseña', '⚠️');
      return;
    }
    if (isRegistering && !alias.trim()) {
      showToast('Por favor ingresa tu alias para registrarte', '⚠️');
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        const res = await registerWithEmailFirebase(email, password, alias);
        if (res.backupData) {
          importFullState(res.backupData);
          showToast('¡Contraseña establecida y datos recuperados!', '🔄');
        } else {
          showToast('¡Cuenta registrada exitosamente!', '🔥');
        }
        loginUser(res.user, res.token);
      } else {
        const res = await loginWithEmailFirebase(email, password);
        if (res.backupData) {
          importFullState(res.backupData);
          showToast('¡Perfil completo y base financiera restaurados!', '🔄');
        } else {
          showToast('Sesión iniciada correctamente', '⚡');
        }
        loginUser(res.user, res.token);
      }
    } catch (err: any) {
      console.error('Registration/Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        showToast('El correo ya está registrado. Intenta iniciar sesión.', '⚠️');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        showToast('Correo o contraseña incorrectos.', '❌');
      } else if (err.code === 'auth/weak-password') {
        showToast('La contraseña debe tener al menos 6 caracteres.', '⚠️');
      } else {
        showToast('Error de autenticación: ' + err.message, '❌');
      }
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

        

        {/* Email Form */}
        

        <p className="text-[11px] text-center text-slate-500 font-medium">
          Al iniciar sesión, tus datos y perfil se sincronizarán en la nube de Firebase Firestore.
        </p>
      </div>
    </div>
  );
};
