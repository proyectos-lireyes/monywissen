import re

with open('src/components/auth/AuthModal.tsx', 'r') as f:
    content = f.read()

target_imports = "import { registerUserInFirebase, restoreStateFromFirebase, loginWithGoogleFirebase } from '../../utils/firebase';"
replacement_imports = "import { registerUserInFirebase, restoreStateFromFirebase, loginWithGoogleFirebase, loginWithEmailFirebase, registerWithEmailFirebase } from '../../utils/firebase';"
content = content.replace(target_imports, replacement_imports)

target_state = """  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);"""
replacement_state = """  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);"""
content = content.replace(target_state, replacement_state)

target_submit = """  const handleSubmit = async (e: React.FormEvent) => {
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
      onClose();
    } catch (err) {
      console.error('Registration/Auth error:', err);
      // Fallback local registration
      const simulatedToken = `jwt_sim_${Date.now()}_${btoa(email)}`;
      loginUser({ email, alias, phone }, simulatedToken);
      showToast('Sesión iniciada correctamente', '⚡');
      onClose();
    } finally {
      setLoading(false);
    }
  };"""
replacement_submit = """  const handleSubmit = async (e: React.FormEvent) => {
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
        showToast('¡Cuenta registrada exitosamente!', '🔥');
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
      onClose();
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
  };"""
content = content.replace(target_submit, replacement_submit)

target_form = """          <div>
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
          </button>"""
replacement_form = """          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-slate-400 transition-colors"
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre / Alias
              </label>
              <input
                type="text"
                required={isRegistering}
                value={alias}
                onChange={e => setAlias(e.target.value)}
                placeholder="Ej. Lissandro"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-slate-400 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Verificando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
          
          <div className="text-center mt-2">
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>"""
content = content.replace(target_form, replacement_form)

with open('src/components/auth/AuthModal.tsx', 'w') as f:
    f.write(content)

print("Success")
