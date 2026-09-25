import React, { useState } from 'react';
import { Trash2, Download, CloudUpload, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DeleteProfileConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  onConfirmDelete: (options: { saveLocalBackup: boolean; saveCloudBackup: boolean }) => void;
}

export const DeleteProfileConfirmModal: React.FC<DeleteProfileConfirmModalProps> = ({
  isOpen,
  onClose,
  profileName,
  onConfirmDelete,
}) => {
  const { state } = useApp();
  const [saveLocalBackup, setSaveLocalBackup] = useState(true);
  const [saveCloudBackup, setSaveCloudBackup] = useState(Boolean(state.authUser?.email));

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirmDelete({ saveLocalBackup, saveCloudBackup });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Trash2 className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Eliminar Perfil Activo
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">¿Deseas eliminar el perfil "{profileName}"?</p>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
              Todos los ingresos, gastos fijos, deudas, metas de ahorro e historiales de este perfil se eliminarán.
            </p>
          </div>
        </div>

        {/* Backup Suggestions */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Recomendaciones de Respaldo Preventivo
          </h4>

          <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            <input
              type="checkbox"
              checked={saveLocalBackup}
              onChange={(e) => setSaveLocalBackup(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-rose-600 rounded focus:ring-rose-500 border-slate-300"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-blue-600" /> Descargar Copia Local (.mswsn)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Exporta un archivo de respaldo con el estado actual antes de remover el perfil.
              </p>
            </div>
          </label>

          {state.authUser?.email && (
            <label className="flex items-start gap-3 p-3 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/40 rounded-2xl cursor-pointer hover:border-orange-300 transition-all">
              <input
                type="checkbox"
                checked={saveCloudBackup}
                onChange={(e) => setSaveCloudBackup(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CloudUpload className="w-3.5 h-3.5 text-orange-600" /> Guardar Copia en Firebase Cloud
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Genera una captura de respaldo en la nube con la cuenta ({state.authUser.email}).
                </p>
              </div>
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Sí, Eliminar Perfil
          </button>
        </div>
      </div>
    </div>
  );
};
