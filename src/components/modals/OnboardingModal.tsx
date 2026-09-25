import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Phone, Check, LogOut, Camera, Landmark, ShieldCheck, Database, HardDrive, FileText, ChevronDown, ChevronUp, X } from 'lucide-react';
import { saveUserProfileToFirestore } from '../../utils/firebase';
import { ImageCropperModal } from './ImageCropperModal';

export const OnboardingModal: React.FC = () => {
  const { state, profile, updateProfileData, showToast, logoutUser, loginUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [idCard, setIdCard] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Initial Data Storage Mode & Privacy Agreement
  const [dataMode, setDataMode] = useState<'local' | 'cloud'>('local');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTermsDetail, setShowTermsDetail] = useState(false);

  const [selectedRawImage, setSelectedRawImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  
  useEffect(() => {
    // If onboarding was already completed by any profile or saved previously, do not open
    const hasAnyCompleted = Object.values(state.profiles).some((p: any) => p?.settings?.onboardingCompleted);
    const localCompleted = localStorage.getItem('monywissen_onboarding_completed') === 'true';

    if (state.authUser && !profile.settings.onboardingCompleted && !hasAnyCompleted && !localCompleted) {
      setIsOpen(true);
      setAlias(profile.settings.myAlias || state.authUser.alias || '');
      setPhone(profile.settings.myPhone || state.authUser.phone || '');
    } else {
      setIsOpen(false);
      // Synchronize flag so it never triggers unexpectedly
      if ((hasAnyCompleted || localCompleted) && !profile.settings.onboardingCompleted) {
        updateProfileData(draft => {
          draft.settings.onboardingCompleted = true;
        });
      }
    }
  }, [state.authUser, profile.settings.onboardingCompleted, state.profiles]);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = ev => {
        if (typeof ev.target?.result === 'string') {
          setSelectedRawImage(ev.target.result);
          setShowCropper(true);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    }
    e.target.value = '';
  };

  const handleComplete = () => {
    const cleanAlias = alias.trim();
    const cleanPhone = phone.trim();

    if (!cleanAlias) {
      showToast('El Alias es obligatorio', '⚠️');
      return;
    }
    if (!bank.trim()) {
      showToast('El Banco principal es obligatorio', '⚠️');
      return;
    }

    if (!privacyAccepted) {
      showToast('Debes aceptar el acuerdo de confidencialidad para continuar', '⚠️');
      return;
    }

    const newMethod = {
      id: 'pm_' + Date.now(),
      bank: bank.trim(),
      account: accountNumber.trim(),
      name: cleanAlias,
      idCard: idCard.trim(),
      type: 'monywissen_contact'
    };

    const updatedPaymentMethods = [
      ...(profile.settings.paymentMethods || []),
      newMethod
    ];

    updateProfileData(draft => {
      draft.settings.myAlias = cleanAlias;
      draft.settings.myPhone = cleanPhone;
      draft.settings.onboardingCompleted = true;
      draft.settings.enableCloudSync = (dataMode === 'cloud');
      if (avatarUrl) draft.avatar = avatarUrl;
      draft.settings.paymentMethods = updatedPaymentMethods;
    });

    if (state.authUser) {
      loginUser({ ...state.authUser, alias: cleanAlias, phone: cleanPhone }, state.authToken || '');
      if (state.authUser.email) {
        saveUserProfileToFirestore(
          state.authUser.email,
          cleanAlias,
          cleanPhone,
          avatarUrl || profile.avatar || null,
          updatedPaymentMethods
        );
      }
    }

    localStorage.setItem('monywissen_onboarding_completed', 'true');
    showToast(dataMode === 'cloud' ? '¡Perfil inicial y sincronización online configurados!' : '¡Perfil configurado en Modo Solo Local (Lite)!', '🎉');
    setIsOpen(false);
  };

  const handleDismiss = () => {
    updateProfileData(draft => {
      draft.settings.onboardingCompleted = true;
    });
    localStorage.setItem('monywissen_onboarding_completed', 'true');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[85vh] max-h-[85vh] overflow-hidden animate-fade-in">
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
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Avatar Upload (Larger Size) */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group cursor-pointer">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-blue-500/30 shadow-md" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <Camera className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Toca para agregar foto de perfil</p>
          </div>

          {/* 1. Mode Selection Card (Solo Local vs Cloud) */}
          <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <label className="block text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" /> ¿Cómo deseas guardar tus finanzas? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDataMode('local')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  dataMode === 'local'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${dataMode === 'local' ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900' : 'bg-slate-100 text-slate-500'}`}>
                    LITE
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-black">Solo Local</p>
                  <p className="text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400 mt-0.5">
                    Almacenamiento exclusivo en la memoria de tu teléfono.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDataMode('cloud')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  dataMode === 'cloud'
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-900 dark:text-orange-200 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Database className="w-4 h-4 text-orange-600" />
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${dataMode === 'cloud' ? 'bg-orange-200 dark:bg-orange-800 text-orange-900' : 'bg-slate-100 text-slate-500'}`}>
                    CLOUD
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-black">Nube Firebase</p>
                  <p className="text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400 mt-0.5">
                    Respaldo automático para acceso multi-dispositivo.
                  </p>
                </div>
              </button>
            </div>
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

            {/* Privacy & Confidentiality Agreement Checkbox */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={e => setPrivacyAccepted(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-snug">
                  Acepto el <strong className="text-blue-600 dark:text-blue-400">Acuerdo de Confidencialidad y Privacidad de Datos</strong> de Monywissen.
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowTermsDetail(!showTermsDetail)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 pl-6"
              >
                <FileText className="w-3 h-3" />
                {showTermsDetail ? 'Ocultar términos' : 'Leer política de confidencialidad completa'}
                {showTermsDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showTermsDetail && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 animate-fade-in leading-relaxed">
                  <p className="font-extrabold text-blue-950 dark:text-blue-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Compromiso Monywissen:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Aislamiento de Finanzas:</strong> Tus montos de ingresos, gastos y deudas son privados. Nunca serán vendidos o compartidos con terceros.</li>
                    <li><strong>Modo Solo Local:</strong> Si eliges Solo Local, tus registros permanecen alojados estrictamente en tu dispositivo sin ser subidos a ningún servidor.</li>
                    <li><strong>MonyShared:</strong> Únicamente los contactos que escaneen tu QR o agregues manualmente tendrán acceso a tus datos de pago móvil seleccionados para préstamos o gastos grupales.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleComplete}
            disabled={!privacyAccepted}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
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

      {showCropper && selectedRawImage && (
        <ImageCropperModal
          isOpen={showCropper}
          imageSrc={selectedRawImage}
          onClose={() => setShowCropper(false)}
          onConfirm={(croppedBase64) => {
            setAvatarUrl(croppedBase64);
            setShowCropper(false);
          }}
        />
      )}
    </div>
  );
};
