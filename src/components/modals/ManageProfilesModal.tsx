import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types';
import { Users, X, Plus, Trash2, Edit2, Check, ArrowRightLeft } from 'lucide-react';
import { DeleteProfileConfirmModal } from './DeleteProfileConfirmModal';
import { backupStateToFirebase } from '../../utils/firebase';

interface ManageProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageProfilesModal: React.FC<ManageProfilesModalProps> = ({ isOpen, onClose }) => {
  const {
    state,
    currentProfileName,
    switchProfile,
    createProfile,
    deleteProfile,
    renameProfile,
    showToast,
  } = useApp();

  const [newProfileName, setNewProfileName] = useState('');
  const [renamingProfileName, setRenamingProfileName] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartRename = (name: string) => {
    setRenamingProfileName(name);
    const profile = state.profiles[name];
    setRenameInputValue(profile?.settings?.myAlias || name);
  };

  const handleSaveRename = (oldName: string) => {
    const trimmed = renameInputValue.trim();
    if (!trimmed) {
      showToast('El nombre no puede estar vacío', '⚠️');
      return;
    }
    if (trimmed !== oldName) {
      renameProfile(oldName, trimmed);
    }
    setRenamingProfileName(null);
    setRenameInputValue('');
  };

  const handleCreateProfile = () => {
    const trimmed = newProfileName.trim();
    if (!trimmed) {
      showToast('Ingresa un nombre para el nuevo perfil', '⚠️');
      return;
    }
    if (state.profiles[trimmed]) {
      showToast('Ya existe un perfil con ese nombre', '⚠️');
      return;
    }
    createProfile(trimmed);
    setNewProfileName('');
  };

  const handleConfirmDelete = async ({ saveLocalBackup, saveCloudBackup }: { saveLocalBackup: boolean; saveCloudBackup: boolean }) => {
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

  const profileKeys = Object.keys(state.profiles);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Gestionar Perfiles
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Cambia de perfil, renombra o elimina tus cuentas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List of profiles */}
          <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tus Perfiles ({profileKeys.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Activo: <strong className="text-blue-600 dark:text-blue-400">{currentProfileName}</strong>
              </span>
            </div>

            <div className="space-y-2">
              {profileKeys.map(pName => {
                const isActive = pName === currentProfileName;
                const profileData: UserProfile | undefined = state.profiles[pName];
                const displayName = profileData?.settings?.myAlias || pName;
                const isRenamingThis = renamingProfileName === pName;

                return (
                  <div
                    key={pName}
                    className={`p-3.5 rounded-2xl border transition-all ${
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
                            value={renameInputValue}
                            onChange={e => setRenameInputValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveRename(pName);
                              if (e.key === 'Escape') setRenamingProfileName(null);
                            }}
                            autoFocus
                            className="flex-1 px-3 py-1.5 rounded-xl border border-blue-400 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(pName)}
                            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            title="Guardar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingProfileName(null)}
                            className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 ${
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

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                switchProfile(pName);
                                showToast(`Cambiado a perfil "${displayName}"`, '👤');
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                              title="Seleccionar y activar este perfil"
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Cambiar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartRename(pName)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors"
                            title="Renombrar perfil"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {profileKeys.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setProfileToDelete(pName)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
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

            {/* Create new profile card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 mt-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-blue-600" /> Crear Nuevo Perfil
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Pareja, Empresa, Ahorros..."
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateProfile();
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleCreateProfile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Delete Profile Confirmation Modal */}
      <DeleteProfileConfirmModal
        isOpen={profileToDelete !== null}
        onClose={() => setProfileToDelete(null)}
        profileName={profileToDelete || ''}
        onConfirmDelete={handleConfirmDelete}
      />
    </>
  );
};
