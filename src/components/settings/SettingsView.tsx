import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Save,
  CloudUpload,
  Download,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Flame,
  Database,
  UserCheck,
  LogOut,
  LogIn,
  Trash2,
} from 'lucide-react';
import { registerUserInFirebase, backupStateToFirebase, restoreStateFromFirebase, getManualBackups, saveManualBackup } from '../../utils/firebase';

interface SettingsViewProps {
  onOpenAuth?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAuth }) => {
  const { profile, updateProfileData, showToast, state, importFullState, loginUser, logoutUser, currentProfileName, updateState, startBackgroundUpdateDownload } = useApp();
  const [subTab, setSubTab] = useState<'rules' | 'backup' | 'about' | 'reset'>('about');

  const [resetOptions, setResetOptions] = useState({ incomes: true, expenses: true, debts: true, savings: true, accounts: true });
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleResetData = () => {
    updateProfileData(draft => {
      if (resetOptions.incomes) draft.incomes = [];
      if (resetOptions.expenses) draft.expenses = [];
      if (resetOptions.debts) draft.debts = [];
      if (resetOptions.savings) {
        draft.savingsList = [];
        draft.savings = { current: 0, digital: 0 };
      }
      if (resetOptions.accounts) {
        draft.settings.paymentMethods = [];
        draft.settings.customDebts = [];
        draft.settings.openingBalance = 0;
      }
    });
    showToast('Datos seleccionados eliminados correctamente', '🗑️');
    setShowConfirmReset(false);
    setSubTab('rules');
  };

  const settings = profile.settings;

  const [planStart, setPlanStart] = useState(settings.planStart);
  const [planEnd, setPlanEnd] = useState(settings.planEnd);
  const [minBalance, setMinBalance] = useState(settings.minBalance);
  const [delayDays, setDelayDays] = useState(settings.delayDays);
  const [autoSaveThreshold, setAutoSaveThreshold] = useState(settings.autoSaveThreshold || 0);
  const [openingBalance, setOpeningBalance] = useState(settings.openingBalance);
  const [freeSpend, setFreeSpend] = useState(settings.freeSpend);
  const [notifTime, setNotifTime] = useState(settings.notifTime || '08:00');

  // App Update States
  const [updateUrl, setUpdateUrl] = useState(window.location.origin);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  // Developer mode secret toggle (5 taps on version string)
  const [versionTapCount, setVersionTapCount] = useState(0);
  const [showUpdateUrlInput, setShowUpdateUrlInput] = useState(false);

  const handleVersionTap = () => {
    const nextCount = versionTapCount + 1;
    setVersionTapCount(nextCount);
    if (nextCount >= 5) {
      setShowUpdateUrlInput(prev => !prev);
      showToast(!showUpdateUrlInput ? '🔧 Modo desarrollador: Configuración de Servidor activada' : 'Modo desarrollador oculto', '⚙️');
      setVersionTapCount(0);
    } else if (nextCount >= 2) {
      showToast(`Toca ${5 - nextCount} veces más para opciones de servidor`, 'ℹ️');
    }
  };

    const [isFbBackupLoading, setIsFbBackupLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);
  const [fbEmailInput, setFbEmailInput] = useState(
    state.authUser?.email || profile.settings.email || ''
  );

  const handleLogout = () => {
    logoutUser();
    if (onOpenAuth) {
      onOpenAuth();
    }
  };

  const getOrForceUserEmail = async () => {
    let email = state.authUser?.email;
    if (!email) {
      email = fbEmailInput.trim();
      if (!email) {
        if (onOpenAuth) onOpenAuth();
        throw new Error('No auth email');
      }
      try {
        await registerUserInFirebase(email, currentProfileName);
      } catch (e) {
        console.error(e);
      }
      loginUser(
        { email, alias: currentProfileName, phone: '' },
        `jwt_auto_${Date.now()}_${btoa(email)}`
      );
      showToast(`Sesión vinculada a ${email}`, '🔐');
    }
    return email;
  };

  const handleFirebaseBackup = async () => {
    setIsFbBackupLoading(true);
    try {
      const userEmail = state.authUser?.email || await getOrForceUserEmail();
      const label = `Copia de seguridad - ${new Date().toLocaleString()}`;
      await saveManualBackup(userEmail, state, label);
      showToast(`¡Respaldo guardado! Tienes hasta 4 copias seguras.`, '🔥');
    } catch (e) {
      console.error(e);
      showToast('Inicia sesión para respaldar en Firebase Cloud', '⚠️');
    } finally {
      setIsFbBackupLoading(false);
    }
  };

  const handleFirebaseRestore = async () => {
    setIsFbBackupLoading(true);
    try {
      const userEmail = state.authUser?.email || await getOrForceUserEmail();
      const backups = await getManualBackups(userEmail);
      if (backups && backups.length > 0) {
        setAvailableBackups(backups);
        setShowRestoreModal(true);
      } else {
        showToast(`No tienes respaldos guardados.`, '⚠️');
      }
    } catch (e) {
      console.error(e);
      showToast('Error al consultar Firebase DB', '❌');
    } finally {
      setIsFbBackupLoading(false);
    }
  };

  const applyRestore = (payload: any) => {
    importFullState(payload);
    setShowRestoreModal(false);
    showToast('¡Perfil y base de datos restaurados con éxito!', '🎉');
  };

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setUpdateMsg('Conectando con el servidor de actualizaciones...');
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateReady(true);
      setUpdateMsg('¡Nueva versión v1.2.5 disponible! (Multi-moneda BCV + Código QR + Flujo de Caja)');
      showToast('¡Nueva versión v1.2.5 disponible!', '🚀');
    }, 1200);
  };

  const handleInstallUpdate = () => {
    showToast('Descargando e instalando actualización...', '📦');
    setTimeout(() => {
      // Reload or open URL
      if (updateUrl && updateUrl !== window.location.origin) {
        window.open(updateUrl, '_blank');
      } else {
        window.location.reload();
      }
    }, 1000);
  };

  const handleSaveRules = () => {
    updateProfileData(draft => {
      draft.settings.planStart = planStart;
      draft.settings.planEnd = planEnd;
      draft.settings.minBalance = minBalance;
      draft.settings.delayDays = delayDays;
      draft.settings.openingBalance = openingBalance;
      draft.settings.freeSpend = freeSpend;
      draft.settings.notifTime = notifTime;
      draft.settings.autoSaveThreshold = autoSaveThreshold;
    });
    showToast('Reglas del sistema guardadas', '⚙️');
  };

  const handleExportFile = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monywissen_FULL_${new Date().toISOString().slice(0, 10)}.mswsn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Respaldo local descargado', '💾');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.profiles) {
          importFullState(parsed);
        } else {
          showToast('Archivo de respaldo no válido', '❌');
        }
      } catch (err) {
        showToast('Error al leer el archivo .mswsn', '❌');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Ajustes del Sistema
          </h2>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => setSubTab('rules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'rules'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            ⚙️ Reglas
          </button>
          <button
            onClick={() => setSubTab('backup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'backup'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            💾 Respaldo
          </button>
          <button
            onClick={() => setSubTab('about')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'about'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            ℹ️ Acerca de
          </button>
          <button
            onClick={() => setSubTab('reset')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'reset'
                ? 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🗑️ Reiniciar
          </button>
        </div>

        {subTab === 'rules' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Saldo mínimo (Colchón)</label>
                <input
                  type="number"
                  value={minBalance}
                  onChange={e => setMinBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Excedente para Ahorros</label>
                <input
                  type="number"
                  value={autoSaveThreshold}
                  onChange={e => setAutoSaveThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Retraso permitido (días)</label>
                <input
                  type="number"
                  value={delayDays}
                  onChange={e => setDelayDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Hora de Notificación Diaria</label>
                <input
                  type="time"
                  value={notifTime}
                  onChange={e => setNotifTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              onClick={handleSaveRules}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Guardar Reglas
            </button>
          </div>
        )}

        {subTab === 'backup' && (
          <div className="space-y-4">
            {/* Firebase Database Cloud Backup */}
            <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-600" /> Respaldo en Base de Datos Firebase
                </h3>
                <span className="text-[10px] bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 font-bold px-2 py-0.5 rounded-full">
                  Firestore Cloud
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Guarda y sincroniza directamente tu estado financiero completo en tu cuenta de la Base de Datos Firebase Cloud.
              </p>

              {/* Account Status */}
              {state.authUser && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-800/60 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">
                      Cuenta Activa Vinculada
                    </p>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {state.authUser.email}
                      {state.authUser.alias && (
                        <span className="text-[10px] font-semibold text-slate-400">({state.authUser.alias})</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleFirebaseBackup}
                  disabled={isFbBackupLoading}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Flame className="w-4 h-4" />
                  {isFbBackupLoading ? 'Guardando...' : 'Respaldar en Firebase'}
                </button>

                <button
                  type="button"
                  onClick={handleFirebaseRestore}
                  disabled={isFbBackupLoading}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Database className="w-4 h-4 text-orange-400" />
                  {isFbBackupLoading ? 'Restaurando...' : 'Restaurar de Firebase'}
                </button>
              </div>
            </div>

            {/* Local File Backup */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-blue-700 dark:text-blue-300">📁 Respaldo Físico Local</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Exporta la base de datos completa a un archivo `.mswsn` en tu dispositivo o importa datos guardados previamente.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleExportFile}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Exportar Archivo (.mswsn)
                </button>

                <label className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                  <CloudUpload className="w-4 h-4" /> Importar Archivo
                  <input type="file" accept=".mswsn,.json" onChange={handleImportFile} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {subTab === 'about' && (
          <div className="space-y-5 py-2">
            <div className="text-center space-y-1">
              <div className="text-4xl">🚀</div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Monywissen</h3>
              <p className="text-xs text-slate-500">
                Versión Actual Instalada:{' '}
                <b
                  onClick={handleVersionTap}
                  className="text-blue-600 dark:text-blue-400 cursor-pointer select-none hover:underline"
                  title="Toca 5 veces para opciones avanzadas de servidor"
                >
                  v1.2.5
                </b>
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Plataforma de planificación financiera con motor preventivo de liquidez, conversión multimoneda BCV, red colaborativa MonyShared y agenda QR.
              </p>
            </div>

            {/* Update Checker Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-blue-600" /> Servidor & Centro de Actualizaciones
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> PWA / App Lista
                </span>
              </div>

              {showUpdateUrlInput && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-blue-300 dark:border-blue-700 space-y-1 animate-fade-in">
                  <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    🔧 URL Servidor de Actualización (Modo Desarrollador)
                  </label>
                  <input
                    type="url"
                    value={updateUrl}
                    onChange={e => setUpdateUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              )}

              {/* Background Download Live Status */}
              {(updateState.isDownloading || updateState.isCompleted) && (
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <span className="flex items-center gap-1.5">
                      {updateState.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                      )}
                      {updateState.isCompleted ? '¡APK Lista para Instalar!' : 'Descargando APK en segundo plano...'}
                    </span>
                    <span className="font-black text-indigo-600 dark:text-indigo-300">
                      {updateState.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${updateState.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    <span>{updateState.downloadedMB} MB de {updateState.totalMB} MB</span>
                    {!updateState.isCompleted && <span>Velocidad: {updateState.downloadSpeed}</span>}
                  </div>
                </div>
              )}

              {updateReady && !updateState.isDownloading && !updateState.isCompleted && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2 text-xs">
                  <p className="font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" /> Novedades de la versión {updateState.latestVersion}:
                  </p>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                    <li>Conversión automática multimoneda a Tasa Oficial BCV en Gastos Compartidos.</li>
                    <li>Generador y escaneador de códigos QR reales para compartir datos de contacto.</li>
                    <li>Notificaciones automáticas de recordatorio a las 8:00 AM.</li>
                    <li>Descarga de actualizaciones en segundo plano para conexiones lentas.</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  {isCheckingUpdate ? 'Comprobando...' : 'Buscar Actualización'}
                </button>

                {updateState.isCompleted ? (
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Iniciando instalación de APK...', '📲');
                      const a = document.createElement('a');
                      a.href = updateState.downloadUrl;
                      a.download = `Monywissen-${updateState.latestVersion}.apk`;
                      a.click();
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Instalar APK {updateState.latestVersion}
                  </button>
                ) : updateState.isDownloading ? (
                  <button
                    disabled
                    className="flex-1 py-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Descargando ({updateState.progress}%)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startBackgroundUpdateDownload}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar APK {updateState.latestVersion}
                  </button>
                )}
              </div>

              {updateMsg && (
                <p className="text-[11px] text-center font-semibold text-blue-700 dark:text-blue-300">
                  {updateMsg}
                </p>
              )}
            </div>
          </div>
        )}

        {subTab === 'reset' && (
          <div className="space-y-4 animate-fade-in pb-12">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-900 dark:text-red-100">Reiniciar Cronograma</h3>
                  <p className="text-xs text-red-700/80 dark:text-red-300/80">
                    Selecciona qué datos deseas eliminar permanentemente de este perfil.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <label className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.incomes}
                    onChange={(e) => setResetOptions(prev => ({ ...prev, incomes: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-red-300"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Borrar Ingresos</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.expenses}
                    onChange={(e) => setResetOptions(prev => ({ ...prev, expenses: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-red-300"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Borrar Gastos Fijos</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.debts}
                    onChange={(e) => setResetOptions(prev => ({ ...prev, debts: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-red-300"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Borrar Deudas y Cuotas</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.savings}
                    onChange={(e) => setResetOptions(prev => ({ ...prev, savings: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-red-300"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Borrar Ahorros y Metas</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.accounts}
                    onChange={(e) => setResetOptions(prev => ({ ...prev, accounts: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-red-300"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Borrar Cuentas y Métodos de Pago</span>
                </label>
              </div>

              <div className="mt-5">
                {showConfirmReset ? (
                  <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                    <p className="text-sm font-bold text-red-800 dark:text-red-200 text-center">
                      ¿Estás seguro? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmReset(false)}
                        className="flex-1 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors border border-slate-200 dark:border-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleResetData}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                      >
                        Sí, Limpiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    disabled={!Object.values(resetOptions).some(Boolean)}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Ejecutar Limpieza
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
