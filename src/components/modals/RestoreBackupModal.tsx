import React, { useState, useEffect } from 'react';
import { Database, RotateCcw, X, Clock, AlertCircle, Lock, Unlock, Trash2 } from 'lucide-react';
import { deleteManualBackup, toggleLockManualBackup } from '../../utils/firebase';
import { useApp } from '../../context/AppContext';

interface RestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  backups: any[];
  userEmail?: string;
  onRestore: (payload: any) => void;
  onRefreshList?: () => void;
}

export const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({
  isOpen,
  onClose,
  backups: initialBackups,
  userEmail,
  onRestore,
  onRefreshList,
}) => {
  const { showToast } = useApp();
  const [backupsList, setBackupsList] = useState<any[]>(initialBackups || []);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [backupToDelete, setBackupToDelete] = useState<any | null>(null);

  useEffect(() => {
    setBackupsList(initialBackups || []);
  }, [initialBackups]);

  if (!isOpen) return null;

  const handleToggleLock = async (backup: any) => {
    if (!userEmail || !backup.id) return;
    setLoadingActionId(`lock_${backup.id}`);
    try {
      const nextLocked = await toggleLockManualBackup(userEmail, backup.id, Boolean(backup.isLocked));
      setBackupsList(prev =>
        prev.map(b => (b.id === backup.id ? { ...b, isLocked: nextLocked } : b))
      );
      showToast(
        nextLocked ? 'Respaldo marcado como Seguro 🔒' : 'Candado retirado del respaldo 🔓',
        nextLocked ? '🔒' : '🔓'
      );
      if (onRefreshList) onRefreshList();
    } catch (err) {
      showToast('Error al cambiar el candado de seguridad', '❌');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userEmail || !backupToDelete?.id) return;
    const backupId = backupToDelete.id;
    setLoadingActionId(`del_${backupId}`);
    try {
      await deleteManualBackup(userEmail, backupId);
      setBackupsList(prev => prev.filter(b => b.id !== backupId));
      showToast('Respaldo eliminado de Firebase', '🗑️');
      if (onRefreshList) onRefreshList();
    } catch (err) {
      showToast('Error al eliminar el respaldo', '❌');
    } finally {
      setLoadingActionId(null);
      setBackupToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Gestión y Restauración de Respaldos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Se conservan hasta 4 respaldos (los más antiguos se borran al llegar al 5º, excepto los protegidos con candado 🔒).
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

        {/* Backups List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {backupsList.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No se encontraron respaldos manuales guardados
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                  Haz clic en "Guardar Respaldo Manual Ahora" en Ajustes para generar una copia guardada.
                </p>
              </div>
            </div>
          ) : (
            backupsList.map((backup, idx) => {
              const payload = backup.dataPayload || {};
              const profilesCount = payload.profiles ? Object.keys(payload.profiles).length : 0;
              const activeProfile = payload.currentProfile || 'Personal';
              const isLocked = Boolean(backup.isLocked);
              
              let dateStr = 'Fecha desconocida';
              try {
                if (backup.timestamp) {
                  const d = typeof backup.timestamp === 'number' ? new Date(backup.timestamp) : new Date(backup.timestamp);
                  dateStr = d.toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                } else if (backup.updatedAt) {
                  dateStr = new Date(backup.updatedAt).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }
              } catch (e) {
                console.error(e);
              }

              return (
                <div
                  key={backup.id || idx}
                  className={`p-4 rounded-2xl border transition-all space-y-3 shadow-xs ${
                    isLocked
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-orange-300 dark:hover:border-orange-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                          <Clock className="w-3 h-3" />
                          {dateStr}
                        </span>
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                            <Lock className="w-3 h-3 text-amber-600" /> Seguro
                          </span>
                        )}
                        {backup.isScheduled && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                            ⏰ Programado
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {backup.label || `Respaldo #${idx + 1}`}
                      </h4>
                    </div>

                    {/* Action buttons: Lock & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleLock(backup)}
                        disabled={loadingActionId === `lock_${backup.id}`}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${
                          isLocked
                            ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                        title={isLocked ? 'Quitar candado de seguridad' : 'Marcar como Seguro (Protegido)'}
                      >
                        {isLocked ? <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                      </button>

                      {backup.id && backup.id !== 'primary' && backup.id !== 'cloud_collections' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isLocked) {
                              showToast('No puedes eliminar un respaldo seguro. Quita el candado primero.', '🔒');
                              return;
                            }
                            setBackupToDelete(backup);
                          }}
                          disabled={isLocked || loadingActionId === `del_${backup.id}`}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${
                            isLocked
                              ? 'opacity-40 cursor-not-allowed text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50 dark:bg-slate-800 dark:text-rose-400 dark:border-slate-700 dark:hover:bg-rose-950/40'
                          }`}
                          title={isLocked ? 'Desbloquea el candado antes de eliminar' : 'Eliminar este respaldo'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary pills */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-semibold bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span>👤 Perfil Activo: <b>{activeProfile}</b></span>
                    <span>•</span>
                    <span>📂 Perfiles Totales: <b>{profilesCount}</b></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRestore(payload)}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <RotateCcw className="w-4 h-4" /> Restaurar Este Respaldo
                  </button>
                </div>
              );
            })
          )}
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

      {/* In-Modal Confirmation for Deleting Backup */}
      {backupToDelete && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Eliminar Respaldo
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              ¿Estás seguro de que deseas eliminar permanentemente el respaldo <strong>"{backupToDelete.label || 'Respaldo'}"</strong> de Firebase?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBackupToDelete(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
