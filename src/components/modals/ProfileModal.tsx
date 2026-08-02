import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserIcon, Plus, Edit2, Trash2, X, CreditCard, QrCode, LogOut, LogIn, AlertOctagon } from 'lucide-react';
import { requestAccountDeletion } from '../../utils/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const {
    state,
    profile,
    currentProfileName,
    switchProfile,
    createProfile,
    deleteProfile,
    renameProfile,
    updateProfileData,
    logoutUser,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'info' | 'payment'>('info');
  const [showQRModal, setShowQRModal] = useState(false);

  // Contact info local inputs initialized from profile.settings
  const [alias, setAlias] = useState(profile.settings.myAlias || '');
  const [phone, setPhone] = useState(profile.settings.myPhone || '');
  const [email] = useState(profile.settings.myEmail || state.authUser?.email || 'usuario@monywissen.com');
  const [newProfileInput, setNewProfileInput] = useState('');

  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [bankForm, setBankForm] = useState({ bank: '', account: '', name: '', idCard: '' });

  if (!isOpen) return null;

  const handleSaveContactInfo = () => {
    updateProfileData(draft => {
      draft.settings.myAlias = alias;
      draft.settings.myPhone = phone;
    });
    showToast('Información de usuario guardada', '👤');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      updateProfileData(draft => {
        draft.avatar = result;
      });
      showToast('Foto de perfil actualizada', '📷');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePaymentMethod = () => {
    if (!bankForm.bank.trim()) {
      showToast('Ingresa el nombre del banco o entidad', '⚠️');
      return;
    }

    updateProfileData(draft => {
      draft.settings.paymentMethods = draft.settings.paymentMethods || [];
      draft.settings.paymentMethods.push({
        id: `pm_${Date.now()}`,
        bank: bankForm.bank.trim(),
        account: bankForm.account.trim(),
        name: bankForm.name.trim(),
        idCard: bankForm.idCard.trim(),
        phone: '',
        email: '',
      });
    });

    setBankForm({ bank: '', account: '', name: '', idCard: '' });
    setShowAddAccountForm(false);
    showToast('Método de pago / cuenta agregada', '💳');
  };

  const handleDeletePaymentMethod = (id: string) => {
    updateProfileData(draft => {
      draft.settings.paymentMethods = (draft.settings.paymentMethods || []).filter(pm => pm.id !== id);
    });
    showToast('Método de pago eliminado', '🗑️');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Tu Perfil
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar & Name */}
        <div className="flex flex-col items-center gap-2">
          <label className="relative cursor-pointer group">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 border-2 border-blue-500 font-extrabold text-2xl flex items-center justify-center overflow-hidden shadow-md">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentProfileName.substring(0, 2).toUpperCase()
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>

          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">
              {currentProfileName}
            </span>
            <button
              onClick={() => {
                const newName = prompt('Nuevo nombre para el perfil:', currentProfileName);
                if (newName) renameProfile(currentProfileName, newName);
              }}
              className="p-1 text-slate-400 hover:text-blue-600"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowQRModal(true)}
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
          >
            <QrCode className="w-3.5 h-3.5" /> Compartir Contacto por QR
          </button>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setTab('info')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'info' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            🪪 Usuario
          </button>
          <button
            onClick={() => setTab('payment')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'payment' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            💳 Mis Cuentas
          </button>
        </div>

        {tab === 'info' ? (
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                disabled
                readOnly
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Alias / Usuario Secundario en Red MonyShared
              </label>
              <input
                type="text"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                placeholder="Ej. @mony_user"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Teléfono / Pago Móvil (Identificador Adicional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ej. 04141234567"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleSaveContactInfo}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Guardar Datos de Usuario
            </button>

            {state.authUser && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    onClose();
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión ({state.authUser.email})
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('¿Estás seguro de que deseas eliminar tu cuenta definitivamente? Tendrás 7 días para recuperarla volviendo a iniciar sesión, después se borrará de forma permanente de la nube.')) {
                      try {
                        if (state.authUser?.email) {
                          await requestAccountDeletion(state.authUser.email);
                        }
                        logoutUser();
                        onClose();
                      } catch (err) {
                        showToast('Error al solicitar eliminación de cuenta', '❌');
                      }
                    }
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-800/60"
                >
                  <AlertOctagon className="w-3.5 h-3.5" /> Eliminar Cuenta Definitivamente
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {!showAddAccountForm ? (
              <button
                type="button"
                onClick={() => setShowAddAccountForm(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Añadir Cuenta Bancaria o Billetera
              </button>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                  💳 Registrar Nueva Cuenta
                </span>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Banco / Billetera</label>
                  <input
                    type="text"
                    placeholder="Ej. Banesco, Mercantil, Zelle, Binance..."
                    value={bankForm.bank}
                    onChange={e => setBankForm({ ...bankForm, bank: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Nro. Cuenta / Teléfono / Correo</label>
                  <input
                    type="text"
                    placeholder="Ej. 0105-0000... o correo Zelle"
                    value={bankForm.account}
                    onChange={e => setBankForm({ ...bankForm, account: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Titular</label>
                    <input
                      type="text"
                      placeholder="Nombre..."
                      value={bankForm.name}
                      onChange={e => setBankForm({ ...bankForm, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Cédula / RIF</label>
                    <input
                      type="text"
                      placeholder="V-12345678"
                      value={bankForm.idCard}
                      onChange={e => setBankForm({ ...bankForm, idCard: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAccountForm(false)}
                    className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePaymentMethod}
                    className="flex-1 py-1.5 bg-blue-600 text-white rounded-xl font-bold"
                  >
                    Guardar Cuenta
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {(profile.settings.paymentMethods || []).length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-3">No has registrado cuentas bancarias.</p>
              ) : (
                (profile.settings.paymentMethods || []).map(m => (
                  <div key={m.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">🏦 {m.bank}</p>
                      <p className="text-[10px] text-slate-400">
                        {m.account || m.phone || m.email || m.name} {m.idCard ? `(${m.idCard})` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePaymentMethod(m.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Profile Switcher & New Profile Creation */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Perfil Activo</span>
            <select
              value={currentProfileName}
              onChange={e => switchProfile(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              {Object.keys(state.profiles).map(pName => (
                <option key={pName} value={pName}>{pName}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">+ Crear Nuevo Perfil</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Negocio, Pareja, Personal..."
                value={newProfileInput}
                onChange={e => setNewProfileInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (!newProfileInput.trim()) return;
                    createProfile(newProfileInput.trim());
                    setNewProfileInput('');
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newProfileInput.trim()) {
                    showToast('Ingresa un nombre para el perfil', '⚠️');
                    return;
                  }
                  createProfile(newProfileInput.trim());
                  setNewProfileInput('');
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Crear
              </button>
            </div>
          </div>

          {Object.keys(state.profiles).length > 1 && (
            <button
              onClick={() => deleteProfile(currentProfileName)}
              className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1 mt-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar Perfil Activo ("{currentProfileName}")
            </button>
          )}
        </div>
      </div>

      {/* QR Code Contact Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                🪪 Tarjeta Digital MonyShared
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {currentProfileName}
              </h3>
              <p className="text-xs text-slate-500">
                {alias ? `@${alias}` : email}
              </p>
            </div>

            {/* QR Image */}
            <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block">
              {(() => {
                const qrPayload = JSON.stringify({
                  type: 'mony_contact',
                  alias: alias || currentProfileName,
                  email: email,
                  phone: phone || '',
                  paymentMethods: profile.settings.paymentMethods || [],
                });
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`;
                return (
                  <img
                    src={qrUrl}
                    alt="QR Contacto"
                    className="w-48 h-48 mx-auto object-contain rounded-lg"
                  />
                );
              })()}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Escanea este código QR desde la agenda de MonyShared para agregar instantáneamente este contacto y sus cuentas bancarias.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = `Contacto Monywissen:\nAlias: ${alias || currentProfileName}\nCorreo: ${email}\nTeléfono: ${phone || 'N/A'}`;
                  navigator.clipboard.writeText(text);
                  showToast('Datos de contacto copiados', '📋');
                }}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Copiar Datos
              </button>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
