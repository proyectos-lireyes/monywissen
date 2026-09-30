import React from 'react';
import { useApp } from '../../context/AppContext';
import { CloudUpload, CloudDownload, RefreshCw, AlertTriangle, Calendar, Users, Handshake, TrendingUp, PiggyBank, X } from 'lucide-react';

export const InteractiveSyncModal: React.FC = () => {
  const { syncComparison, setSyncComparison, convertAmount } = useApp();

  if (!syncComparison) return null;

  const { local, remote, email, onResolve } = syncComparison;

  // Helper to extract stats from any state payload (local or remote)
  const getStats = (statePayload: any) => {
    if (!statePayload) {
      return {
        timestamp: 0,
        profilesCount: 0,
        incomesCount: 0,
        expensesCount: 0,
        debtsCount: 0,
        totalSavings: 0,
        profileNames: []
      };
    }

    const payload = statePayload.dataPayload ? statePayload.dataPayload : statePayload;
    const profiles = payload.profiles || {};
    const profileNames = Object.keys(profiles);
    const profilesCount = profileNames.length;

    let incomesCount = 0;
    let expensesCount = 0;
    let debtsCount = 0;
    let totalSavings = 0;

    profileNames.forEach(name => {
      const p = profiles[name] || {};
      incomesCount += Array.isArray(p.incomes) ? p.incomes.length : 0;
      expensesCount += Array.isArray(p.expenses) ? p.expenses.length : 0;
      debtsCount += Array.isArray(p.debts) ? p.debts.length : 0;
      
      const currentSav = p.savings?.current || 0;
      const digitalSav = p.savings?.digital || 0;
      totalSavings += (currentSav + digitalSav);
    });

    const timestamp = payload.lastUpdatedAt || 0;

    return {
      timestamp,
      profilesCount,
      incomesCount,
      expensesCount,
      debtsCount,
      totalSavings,
      profileNames
    };
  };

  const localStats = getStats(local);
  const remoteStats = getStats(remote);

  const formatDate = (ts: number) => {
    if (!ts) return 'Nunca';
    return new Date(ts).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isLocalNewer = localStats.timestamp > remoteStats.timestamp;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 rounded-xl">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Sincronización Inteligente Mony
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Detectamos diferencias entre tus datos locales y los guardados en la nube para <span className="font-semibold text-blue-600">{email}</span>.
            </p>
          </div>
          <button
            onClick={() => setSyncComparison(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1">
          
          {/* LOCAL DEVICE CARD */}
          <div className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
            isLocalNewer 
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-xs' 
              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Este Dispositivo</span>
                {isLocalNewer && (
                  <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-extrabold px-2 py-0.5 rounded-full">
                    Más reciente ⚡
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                📦 Datos Locales
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 mb-4">
                Último cambio: <b className="text-slate-600 dark:text-slate-300">{formatDate(localStats.timestamp)}</b>
              </p>

              {/* Stats List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Perfiles:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{localStats.profilesCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Ingresos / Gastos:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{localStats.incomesCount} / {localStats.expensesCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5 text-rose-500" /> Deudas:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{localStats.debtsCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><PiggyBank className="w-3.5 h-3.5 text-sky-500" /> Total Ahorros:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">${localStats.totalSavings.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onResolve('upload')}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <CloudUpload className="w-4 h-4" /> Cargar en la Nube
            </button>
          </div>

          {/* FIRESTORE CLOUD CARD */}
          <div className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
            !isLocalNewer 
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-xs' 
              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Copia en la Nube</span>
                {!isLocalNewer && remoteStats.timestamp > 0 && (
                  <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-extrabold px-2 py-0.5 rounded-full">
                    Más reciente ⚡
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                ☁️ Datos en Firebase
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 mb-4">
                Último cambio: <b className="text-slate-600 dark:text-slate-300">{formatDate(remoteStats.timestamp)}</b>
              </p>

              {/* Stats List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Perfiles:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{remoteStats.profilesCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Ingresos / Gastos:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{remoteStats.incomesCount} / {remoteStats.expensesCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5 text-rose-500" /> Deudas:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{remoteStats.debtsCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><PiggyBank className="w-3.5 h-3.5 text-sky-500" /> Total Ahorros:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">${remoteStats.totalSavings.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onResolve('download')}
              disabled={!remote}
              className={`mt-6 w-full py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md rounded-2xl cursor-pointer ${
                remote 
                  ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CloudDownload className="w-4 h-4" /> Descargar de la Nube
            </button>
          </div>

        </div>

        {/* Warning info */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            <b>¡Atención!</b> Al cargar o descargar se sobrescribirá por completo la información en el destino seleccionado. Te recomendamos elegir la opción marcada como <b>Más reciente ⚡</b>.
          </p>
        </div>

        {/* Footer option to skip / close */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => onResolve('keep_local_only')}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
          >
            Ignorar y continuar con datos locales
          </button>
          <button
            onClick={() => setSyncComparison(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-500 cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
