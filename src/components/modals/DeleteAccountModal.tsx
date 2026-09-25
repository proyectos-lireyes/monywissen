import React, { useState } from 'react';
import { Trash2, Download, CloudUpload, AlertOctagon, X, ShieldAlert, Check } from 'lucide-react';
import { requestAccountDeletion, permanentlyDeleteUserAccount, backupStateToFirebase } from '../../utils/firebase';
import { useApp } from '../../context/AppContext';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const { state, logoutUser, showToast } = useApp();
  const [saveLocalBackup, setSaveLocalBackup] = useState(true);
  const [deletionType, setDeletionType] = useState<'cloud_grace' | 'immediate'>('cloud_grace');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExportLocalFile = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `monywissen_backup_antes_de_eliminar_${new Date().toISOString().slice(0, 10)}.mswsn`;
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Respaldo local descargado exitosamente', '📥');
    } catch (e) {
      console.error('Error exporting local file:', e);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toLowerCase() !== 'eliminar') {
      showToast('Por favor escribe "eliminar" para confirmar', '⚠️');
      return;
    }

    setLoading(true);

    try {
      // 1. Save local backup file if requested
      if (saveLocalBackup) {
        handleExportLocalFile();
      }

      // 2. Perform Cloud Grace Deletion or Immediate Deletion
      if (deletionType === 'cloud_grace') {
        // Backup current snapshot to cloud first
        await backupStateToFirebase(userEmail, state);
        // Request 7-day deletion schedule
        await requestAccountDeletion(userEmail);
        showToast('Tu cuenta ha sido programada para eliminación en 7 días. Puedes recuperarla al iniciar sesión.', '⏳');
      } else {
        // Immediate permanent wipe
        await permanentlyDeleteUserAccount(userEmail);
        showToast('Cuenta y datos eliminados de la nube permanentemente', '🗑️');
      }

      // 3. Log out and clear local state
      logoutUser();
      onClose();
    } catch (err: any) {
      console.error('Error during account deletion:', err);
      showToast('Error al procesar la eliminación: ' + (err.message || 'Error desconocido'), '❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Eliminar Mi Cuenta
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 text-xs text-red-900 dark:text-red-200">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">¿Estás seguro de que deseas eliminar tu cuenta ({userEmail})?</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Esta acción desvinculará tu perfil, historial de pagos, deudas y presupuestos.
            </p>
          </div>
        </div>

        {/* Backup Options Before Deleting */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            1. Opciones de Respaldo Previas
          </h4>

          {/* Local File Backup Option */}
          <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            <input
              type="checkbox"
              checked={saveLocalBackup}
              onChange={(e) => setSaveLocalBackup(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-red-600 rounded focus:ring-red-500 border-slate-300"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-blue-600" /> Descargar Respaldo Físico Local (.mswsn)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Guarda una copia completa cifrada en la memoria de tu dispositivo antes de continuar.
              </p>
            </div>
          </label>

          {/* Cloud Retention Strategy */}
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider pt-2">
            2. Tipo de Eliminación
          </h4>

          <div className="space-y-2">
            <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
              deletionType === 'cloud_grace'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            }`}>
              <input
                type="radio"
                name="deletionType"
                checked={deletionType === 'cloud_grace'}
                onChange={() => setDeletionType('cloud_grace')}
                className="mt-0.5 w-4 h-4 text-amber-600 focus:ring-amber-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CloudUpload className="w-3.5 h-3.5 text-amber-600" /> Respaldo en la Nube con 7 Días de Gracia (Recomendado)
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Tus datos se guardan en la nube y la cuenta entra en un período de gracia de <strong>7 días</strong>. Si inicias sesión durante estos 7 días, podrás <strong>recuperar toda tu información</strong> con un solo clic.
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
              deletionType === 'immediate'
                ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            }`}>
              <input
                type="radio"
                name="deletionType"
                checked={deletionType === 'immediate'}
                onChange={() => setDeletionType('immediate')}
                className="mt-0.5 w-4 h-4 text-red-600 focus:ring-red-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-red-600" /> Eliminación Inmediata Sin Respaldo en la Nube
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Borra tu cuenta y datos de Firebase Cloud de forma inmediata y definitiva. No se podrá recuperar desde la nube.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Confirmation Text Input */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Escribe <span className="text-red-600 font-extrabold uppercase">"eliminar"</span> para confirmar:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="eliminar"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        {/* Submit Actions */}
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
            onClick={handleDeleteAccount}
            disabled={loading || confirmText.trim().toLowerCase() !== 'eliminar'}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Procesando...' : 'Confirmar Eliminación'}
          </button>
        </div>
      </div>
    </div>
  );
};
