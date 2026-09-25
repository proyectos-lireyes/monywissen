import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { cancelAccountDeletion, restoreStateFromFirebase } from '../../utils/firebase';
import { useApp } from '../../context/AppContext';

interface AccountRecoveryModalProps {
  isOpen: boolean;
  userEmail: string;
  remainingDays: number;
  onSuccessRecover: () => void;
  onLogout: () => void;
}

export const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({
  isOpen,
  userEmail,
  remainingDays,
  onSuccessRecover,
  onLogout,
}) => {
  const { importFullState, showToast } = useApp();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRecoverAccount = async () => {
    setLoading(true);
    try {
      // 1. Cancel pending deletion in Firestore
      await cancelAccountDeletion(userEmail);

      // 2. Try restoring state from cloud
      const backupData = await restoreStateFromFirebase(userEmail);
      if (backupData) {
        importFullState(backupData);
      }

      showToast('¡Tu cuenta y datos financieros han sido recuperados con éxito!', '🎉');
      onSuccessRecover();
    } catch (err: any) {
      console.error('Error recovering account:', err);
      showToast('Error al intentar recuperar la cuenta: ' + (err.message || 'Error desconocido'), '⚠️');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
        
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Cuenta Programada para Eliminación
          </h2>
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
            Quedan {remainingDays} {remainingDays === 1 ? 'día' : 'días'} de margen
          </span>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
          <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            Hola, <span className="font-bold underline">{userEmail}</span>
          </p>
          <p>
            Esta cuenta tiene una solicitud de eliminación pendiente. Si continúas con la eliminación, todos tus datos y respaldos en la nube serán purgados permanentemente al finalizar el período de gracia.
          </p>
          <p className="font-bold text-emerald-700 dark:text-emerald-400">
            ¿Deseas cancelar la eliminación y recuperar todos tus datos financieros?
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleRecoverAccount}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-98"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Recuperando cuenta...' : '🔄 Recuperar mi Cuenta y Restaurar Datos'}
          </button>

          <button
            type="button"
            onClick={onLogout}
            disabled={loading}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            Mantener Eliminación y Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};
