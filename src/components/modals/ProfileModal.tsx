import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { saveUserProfileToFirestore, updateUserAvatar, backupStateToFirebase } from '../../utils/firebase';
import { Users, Trash2, X, QrCode, LogOut, LogIn, Edit2, Check, ArrowRightLeft, Plus } from 'lucide-react';
import { AvatarViewerModal } from './AvatarViewerModal';
import { DeleteProfileConfirmModal } from './DeleteProfileConfirmModal';
import { UserProfile } from '../../types';
import QRCode from 'qrcode';

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
    loginUser,
    logoutUser,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'info' | 'payment' | 'profiles'>('info');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);

  // In-app rename profile state under photo
  const [isRenamingProfile, setIsRenamingProfile] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState('');

  // Per-item rename in profiles tab
  const [renamingInList, setRenamingInList] = useState<string | null>(null);
  const [renameListInputValue, setRenameListInputValue] = useState('');

  // Delete profile state in profiles tab
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');

  // Contact info local inputs
  const [alias, setAlias] = useState(profile.settings.myAlias || state.authUser?.alias || '');
  const [phone, setPhone] = useState(profile.settings.myPhone || state.authUser?.phone || '');
  const [email] = useState(profile.settings.myEmail || state.authUser?.email || 'usuario@monywissen.com');

  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [bankForm, setBankForm] = useState({ bank: '', account: '', name: '', idCard: '' });

  // Update local states when profile changes
  useEffect(() => {
    setAlias(profile.settings.myAlias || state.authUser?.alias || '');
    setPhone(profile.settings.myPhone || state.authUser?.phone || '');
  }, [profile.settings.myAlias, profile.settings.myPhone, state.authUser?.alias, state.authUser?.phone, currentProfileName]);

  // Generate QR code data URL locally with zero network delay
  const generateQR = async () => {
    try {
      const qrPayload = JSON.stringify({
        type: 'mony_contact',
        alias: alias || currentProfileName,
        email: email,
        phone: phone || '',
        paymentMethods: profile.settings.paymentMethods || [],
      });
      const url = await QRCode.toDataURL(qrPayload, { width: 220, margin: 1, errorCorrectionLevel: 'L' });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  };

  useEffect(() => {
    generateQR();
  }, [alias, currentProfileName, email, phone, profile.settings.paymentMethods]);

  if (!isOpen) return null;

  const handleSaveContactInfo = () => {
    updateProfileData(draft => {
      draft.settings.myPhone = phone;
    });

    if (state.authUser?.email) {
      loginUser({ ...state.authUser, phone }, state.authToken || '');
      saveUserProfileToFirestore(
        state.authUser.email,
        alias || profile.settings.myAlias || currentProfileName,
        phone,
        profile.avatar || null,
        profile.settings.paymentMethods || []
      );
    }

    showToast('Datos de contacto actualizados', '✅');
  };

  const handleSaveProfileRename = () => {
    const clean = renameInputValue.trim();
    if (!clean) {
      showToast('El nombre del perfil no puede estar vacío', '⚠️');
      return;
    }
    if (clean !== currentProfileName) {
      renameProfile(currentProfileName, clean);
      setAlias(clean);
      updateProfileData(draft => {
        draft.settings.myAlias = clean;
      });
      showToast(`Perfil renombrado a "${clean}"`, '✏️');
    }
    setIsRenamingProfile(false);
  };

  const handleSaveListRename = (oldName: string) => {
    const clean = renameListInputValue.trim();
    if (!clean) {
      showToast('El nombre no puede estar vacío', '⚠️');
      return;
    }
    if (clean !== oldName) {
      renameProfile(oldName, clean);
      if (oldName === currentProfileName) {
        setAlias(clean);
      }
      showToast(`Perfil renombrado a "${clean}"`, '✏️');
    }
    setRenamingInList(null);
  };

  const handleCreateNewProfile = () => {
    const clean = newProfileName.trim();
    if (!clean) {
      showToast('Ingresa un nombre para el nuevo perfil', '⚠️');
      return;
    }
    if (state.profiles[clean]) {
      showToast('Ya existe un perfil con ese nombre', '⚠️');
      return;
    }
    createProfile(clean);
    setNewProfileName('');
  };

  const handleConfirmDeleteProfile = async ({ saveLocalBackup, saveCloudBackup }: { saveLocalBackup: boolean; saveCloudBackup: boolean }) => {
    if (!profileToDelete) return;
    const nameToDelete = profileToDelete;

    try {
      if (saveLocalBackup) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement('a');
        const filename = `monywissen_backup_perfil_${nameToDelete}_${new Date().toISOString().slice(0, 10)}.mswsn`;
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Respaldo local descargado antes de eliminar', '📥');
      }

      if (saveCloudBackup && state.authUser?.email) {
        await backupStateToFirebase(state.authUser.email, state);
        showToast('Copia de respaldo guardada en Firebase Cloud', '☁️');
      }

      deleteProfile(nameToDelete);
      setProfileToDelete(null);
    } catch (e) {
      console.error('Error al eliminar perfil:', e);
      deleteProfile(nameToDelete);
      setProfileToDelete(null);
    }
  };

  const handleSavePaymentMethod = () => {
    if (!bankForm.bank.trim()) {
      showToast('Ingresa el nombre del banco o entidad', '⚠️');
      return;
    }

    const newPaymentMethod = {
      id: `pm_${Date.now()}`,
      bank: bankForm.bank.trim(),
      account: bankForm.account.trim(),
      name: bankForm.name.trim(),
      idCard: bankForm.idCard.trim(),
      phone: '',
      email: '',
    };

    const updatedPaymentMethods = [
      ...(profile.settings.paymentMethods || []),
      newPaymentMethod
    ];

    updateProfileData(draft => {
      draft.settings.paymentMethods = updatedPaymentMethods;
    });

    if (state.authUser?.email) {
      saveUserProfileToFirestore(
        state.authUser.email,
        alias,
        phone,
        profile.avatar || null,
        updatedPaymentMethods
      );
    }

    setBankForm({ bank: '', account: '', name: '', idCard: '' });
    setShowAddAccountForm(false);
    showToast('Método de pago / cuenta agregada', '💳');
  };

  const handleDeletePaymentMethod = (id: string) => {
    const updatedPaymentMethods = (profile.settings.paymentMethods || []).filter(pm => pm.id !== id);

    updateProfileData(draft => {
      draft.settings.paymentMethods = updatedPaymentMethods;
    });

    if (state.authUser?.email) {
      saveUserProfileToFirestore(
        state.authUser.email,
        alias,
        phone,
        profile.avatar || null,
        updatedPaymentMethods
      );
    }

    showToast('Método de pago eliminado', '🗑️');
  };

  const currentDisplayName = alias || profile.settings.myAlias || currentProfileName;
  const profileKeys = Object.keys(state.profiles);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full h-[85vh] max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tu Perfil
            </h3>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {/* Profile Avatar & Name */}
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => setAvatarViewerOpen(true)} className="relative cursor-pointer group rounded-full">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-100 text-blue-700 border-2 border-blue-500 font-extrabold text-3xl flex items-center justify-center overflow-hidden shadow-md">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentDisplayName.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-[10px] font-bold">Ver Foto</span>
                </div>
              </button>

              {/* Profile Name & Inline Rename */}
              {isRenamingProfile ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={renameInputValue}
                    onChange={e => setRenameInputValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveProfileRename();
                      if (e.key === 'Escape') setIsRenamingProfile(false);
                    }}
                    autoFocus
                    className="px-3 py-1 text-sm font-bold rounded-xl border border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleSaveProfileRename}
                    className="p-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    title="Guardar nuevo nombre"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRenamingProfile(false)}
                    className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {currentDisplayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRenameInputValue(currentDisplayName);
                      setIsRenamingProfile(true);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Renombrar perfil"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Tabs: Mis Datos, Cuentas, Gestionar Perfiles side by side */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setTab('info')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'info'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Mis Datos
              </button>
              <button
                type="button"
                onClick={() => setTab('payment')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'payment'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Cuentas
              </button>
              <button
                type="button"
                onClick={() => setTab('profiles')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'profiles'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Gestionar Perfiles
              </button>
            </div>
            
            {/* TAB 1: MIS DATOS (No redundant alias, only phone and email) */}
            {tab === 'info' && (
              <div className="space-y-3">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase">Teléfono</label>
                   <input
                     value={phone}
                     onChange={e => setPhone(e.target.value)}
                     placeholder="Ej. +58 412 1234567"
                     className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase">Correo</label>
                   <input
                     value={email}
                     readOnly
                     disabled
                     className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-500"
                   />
                 </div>
                 <div className="flex gap-2 pt-1">
                   <button
                     type="button"
                     onClick={handleSaveContactInfo}
                     className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors"
                   >
                     Guardar Datos
                   </button>
                   <button
                     type="button"
                     onClick={() => { generateQR(); setShowQRModal(true); }}
                     className="flex-1 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs hover:bg-indigo-200 transition-colors"
                   >
                     <QrCode className="w-4 h-4"/> Ver QR
                   </button>
                 </div>
              </div>
            )}
            
            {/* TAB 2: CUENTAS */}
            {tab === 'payment' && (
              <div className="space-y-3">
                {!showAddAccountForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddAccountForm(true)}
                    className="w-full py-2 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-900/50"
                  >
                    + Agregar Cuenta
                  </button>
                )}
                {showAddAccountForm && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Banco</label>
                        <input
                          value={bankForm.bank}
                          onChange={e => setBankForm({...bankForm, bank: e.target.value})}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Cuenta / Pago Móvil</label>
                        <input
                          value={bankForm.account}
                          onChange={e => setBankForm({...bankForm, account: e.target.value})}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Titular</label>
                        <input
                          value={bankForm.name}
                          onChange={e => setBankForm({...bankForm, name: e.target.value})}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Cédula</label>
                        <input
                          value={bankForm.idCard}
                          onChange={e => setBankForm({...bankForm, idCard: e.target.value})}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddAccountForm(false)}
                        className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePaymentMethod}
                        className="flex-1 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs"
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

            {/* TAB 3: GESTIONAR PERFILES (Full list, switch, rename, delete) */}
            {tab === 'profiles' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tus Perfiles ({profileKeys.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Activo: <strong className="text-blue-600 dark:text-blue-400">{currentProfileName}</strong>
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                  {profileKeys.map(pName => {
                    const isActive = pName === currentProfileName;
                    const profileData: UserProfile | undefined = state.profiles[pName];
                    const displayName = profileData?.settings?.myAlias || pName;
                    const isRenamingThis = renamingInList === pName;

                    return (
                      <div
                        key={pName}
                        className={`p-3 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/80 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {isRenamingThis ? (
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500">
                              Renombrar perfil "{pName}"
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={renameListInputValue}
                                onChange={e => setRenameListInputValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveListRename(pName);
                                  if (e.key === 'Escape') setRenamingInList(null);
                                }}
                                autoFocus
                                className="flex-1 px-3 py-1.5 rounded-xl border border-blue-400 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveListRename(pName)}
                                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                title="Guardar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenamingInList(null)}
                                className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 ${
                                  isActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {profileData?.avatar ? (
                                  <img
                                    src={profileData.avatar}
                                    alt="Avatar"
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  displayName.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {displayName}
                                </p>
                                {isActive ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                    <Check className="w-3 h-3" /> Perfil Activo
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400">
                                    Inactivo
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              {!isActive && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    switchProfile(pName);
                                    showToast(`Cambiado a perfil "${displayName}"`, '👤');
                                  }}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                                  title="Seleccionar y activar este perfil"
                                >
                                  <ArrowRightLeft className="w-3 h-3" /> Cambiar
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingInList(pName);
                                  setRenameListInputValue(displayName);
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors"
                                title="Renombrar perfil"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {profileKeys.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setProfileToDelete(pName)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                                  title={`Eliminar perfil "${pName}"`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Create new profile form */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-blue-600" /> Crear Nuevo Perfil
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. Pareja, Empresa..."
                      value={newProfileName}
                      onChange={e => setNewProfileName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateNewProfile();
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewProfile}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bottom Actions: Log out / In */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {state.authUser ? (
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    showToast('Sesión cerrada correctamente', '👋');
                    onClose();
                  }}
                  className="w-full py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Cerrar Sesión ({state.authUser.email})
                </button>
              ) : onOpenAuth ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4" /> Iniciar Sesión / Vincular Cuenta
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      
      {/* QR Code Contact Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" /> Mi Código QR de Contacto
              </h4>
              <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR de Contacto" className="w-52 h-52 object-contain" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                  Generando QR...
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {alias || currentProfileName}
              </p>
              <p className="text-[11px] text-slate-500">
                Escanea este código desde la sección "Contactos" de Monywissen para agregar a este usuario automáticamente.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({
                    alias: alias || currentProfileName,
                    email,
                    phone,
                    paymentMethods: profile.settings.paymentMethods || [],
                  }));
                  showToast('Datos de contacto copiados al portapapeles', '📋');
                }}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
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

      {/* Avatar Viewer Modal */}
      <AvatarViewerModal 
        isOpen={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
        imageUrl={profile.avatar || null}
        title={currentProfileName}
        canEdit={true}
        onImageUpload={(b64) => {
          updateProfileData(draft => { draft.avatar = b64; });
          if (state.authUser?.email) {
            updateUserAvatar(state.authUser.email, b64);
            saveUserProfileToFirestore(
              state.authUser.email,
              alias,
              phone,
              b64,
              profile.settings.paymentMethods || []
            );
          }
          showToast('Foto de perfil actualizada', '✅');
        }}
        onImageDelete={() => {
          updateProfileData(draft => { delete draft.avatar; });
          if (state.authUser?.email) {
            updateUserAvatar(state.authUser.email, null);
            saveUserProfileToFirestore(
              state.authUser.email,
              alias,
              phone,
              null,
              profile.settings.paymentMethods || []
            );
          }
          showToast('Foto de perfil eliminada', '🗑️');
        }}
      />

      {/* Delete Profile Confirmation Modal */}
      <DeleteProfileConfirmModal
        isOpen={profileToDelete !== null}
        onClose={() => setProfileToDelete(null)}
        profileName={profileToDelete || ''}
        onConfirmDelete={handleConfirmDeleteProfile}
      />
    </>
  );
};
