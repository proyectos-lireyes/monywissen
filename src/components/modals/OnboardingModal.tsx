import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Phone, Check, LogOut, Camera, Landmark } from 'lucide-react';
import { requestAccountDeletion } from '../../utils/firebase';

export const OnboardingModal: React.FC = () => {
  const { state, profile, updateProfileData, showToast, logoutUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [idCard, setIdCard] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  useEffect(() => {
    if (state.authUser && !profile.settings.onboardingCompleted) {
      setIsOpen(true);
      setAlias(profile.settings.myAlias || state.authUser.alias || '');
      setPhone(profile.settings.myPhone || state.authUser.phone || '');
    } else {
      setIsOpen(false);
    }
  }, [state.authUser, profile.settings.onboardingCompleted]);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = ev => {
        setAvatarUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = () => {
    if (!alias.trim()) {
      showToast('El Alias es obligatorio', '⚠️');
      return;
    }
    if (!bank.trim()) {
      showToast('El Banco principal es obligatorio', '⚠️');
      return;
    }

    updateProfileData(draft => {
      draft.settings.myAlias = alias.trim();
      draft.settings.myPhone = phone.trim();
      draft.settings.onboardingCompleted = true;
      
      // Store avatar if uploaded
      if (avatarUrl) {
        // Find personal contact in settings if exists?
        // Let's just create or ensure a payment method for the bank
      }

      if (!draft.settings.paymentMethods) draft.settings.paymentMethods = [];
      const newMethod = {
        id: 'pm_' + Date.now(),
        bank: bank.trim(),
        account: accountNumber.trim(),
        name: alias.trim(),
        idCard: idCard.trim(),
        type: 'monywissen_contact'
      };
      draft.settings.paymentMethods.push(newMethod);
    });

    showToast('¡Configuración inicial completada!', '🎉');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Configura tu Perfil</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Información necesaria para comenzar</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group cursor-pointer">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <Camera className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Foto (Opcional)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Alias en la Red MonyWissen *
              </label>
              <input
                type="text"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                placeholder="Ej. mi_alias_unico"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Teléfono (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+584141234567"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-blue-500" /> Banco / Entidad Principal *
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">
                    Nombre del Banco
                  </label>
                  <input
                    type="text"
                    value={bank}
                    onChange={e => setBank(e.target.value)}
                    placeholder="Ej. Banesco, Zelle, Mercantil..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">
                    Nro. de Cuenta, Pago Móvil o Correo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Ej. 0134... o mi@zelle.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">
                    Cédula / Documento de Identidad (Opcional)
                  </label>
                  <input
                    type="text"
                    value={idCard}
                    onChange={e => setIdCard(e.target.value)}
                    placeholder="Ej. V12345678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleComplete}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Finalizar y Entrar
          </button>
          
          <button
            type="button"
            onClick={logoutUser}
            className="w-full py-2 bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
          >
            <LogOut className="w-3 h-3" /> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};
