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
  Trash2, RotateCcw, Clock,
} from 'lucide-react';
import { registerUserInFirebase, backupStateToFirebase, restoreStateFromFirebase, getManualBackups, saveManualBackup, saveUserProfileToFirestore } from '../../utils/firebase';
import { DeleteAccountModal } from '../modals/DeleteAccountModal';
import { CloudSyncAgreementModal } from '../modals/CloudSyncAgreementModal';
import { RestoreBackupModal } from '../modals/RestoreBackupModal';

declare const __APP_VERSION__: string;

interface SettingsViewProps {
  onOpenAuth?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAuth }) => {
  const { profile, updateProfileData, showToast, state, importFullState, loginUser, logoutUser, currentProfileName, updateState, startBackgroundUpdateDownload, checkForUpdates, forceUploadLocalToCloud } = useApp();
  const [subTab, setSubTab] = useState<'rules' | 'backup' | 'about' | 'reset'>('rules');

  const [isForceUploading, setIsForceUploading] = useState(false);
  const [resetOptions, setResetOptions] = useState({ incomes: true, expenses: true, debts: true, savings: true, accounts: true });
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [confirmPendingReset, setConfirmPendingReset] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const handleResetData = () => {
    const updatedPaymentMethods = resetOptions.accounts ? [] : (profile.settings.paymentMethods || []);

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

    if (state.authUser?.email) {
      saveUserProfileToFirestore(
        state.authUser.email,
        profile.settings.myAlias || state.authUser.alias,
        profile.settings.myPhone || state.authUser.phone || '',
        profile.avatar || null,
        updatedPaymentMethods
      );
    }

    showToast('Datos seleccionados eliminados correctamente', '🗑️');
    setShowConfirmReset(false);
    setSubTab('rules');
  };

  const handleResetAllPaidToPending = () => {
    updateProfileData(draft => {
      draft.overrides = {};
      if (draft.savingsList) {
        draft.savingsList.forEach(s => {
          if (s.status === 'completed') s.status = 'active';
        });
      }
      if (draft.settings.customDebts) {
        draft.settings.customDebts.forEach(d => {
          d.initialPaidCuotas = 0;
        });
      }
      if (draft.debts) {
        draft.debts.forEach(d => {
          d.initialPaidCuotas = 0;
        });
      }
      if (draft.incomes) {
        draft.incomes.forEach(inc => {
          inc.isPaid = false;
          inc.done = false;
          if (inc.name) {
            inc.name = inc.name.replace(/\s*\([^)]*\)/g, '').replace(/[\✓\√\✔\✅]+/g, '').trim();
          }
        });
      }
      if (draft.expenses) {
        draft.expenses.forEach(exp => {
          exp.isPaid = false;
          exp.done = false;
          if (exp.name) {
            exp.name = exp.name.replace(/\s*\([^)]*\)/g, '').replace(/[\✓\√\✔\✅]+/g, '').trim();
          }
        });
      }
    });
    setConfirmPendingReset(false);
    showToast('¡Todos los pagos, gastos e ingresos se cambiaron a Pendiente!', '🔄');
  };

  const settings = profile.settings;

  const [planStart, setPlanStart] = useState(settings.planStart);
  const [planEnd, setPlanEnd] = useState(settings.planEnd);
  const [minBalance, setMinBalance] = useState(settings.minBalance);
  const [minBalanceCurrency, setMinBalanceCurrency] = useState(settings.minBalanceCurrency || settings.displayCurrency || 'USD');
  const [delayDays, setDelayDays] = useState(settings.delayDays);
  const [autoSaveThreshold, setAutoSaveThreshold] = useState(settings.autoSaveThreshold || 0);
  const [openingBalanceStr, setOpeningBalanceStr] = useState(String(settings.openingBalance || 0));
  const [freeSpend, setFreeSpend] = useState(settings.freeSpend);
  const [notifTime, setNotifTime] = useState(settings.notifTime || '08:00');
  const [displayCurrency, setDisplayCurrency] = useState(settings.displayCurrency || 'USD');
  const [paymentCurrency, setPaymentCurrency] = useState(settings.paymentCurrency || 'BS');
  const [enableAutoSavings, setEnableAutoSavings] = useState(settings.enableAutoSavings ?? false);
  const [enableCloudSync, setEnableCloudSync] = useState(settings.enableCloudSync ?? Boolean(state.authUser?.email));
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  React.useEffect(() => {
    if (typeof settings.enableCloudSync === 'boolean') {
      setEnableCloudSync(settings.enableCloudSync);
    } else if (state.authUser?.email) {
      setEnableCloudSync(true);
    }
  }, [settings.enableCloudSync, state.authUser?.email]);

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

  
  const handleResetRescates = () => {
    const currentOverrides = { ...profile.overrides };
    let count = 0;
    Object.keys(currentOverrides).forEach(key => {
      if (key.startsWith('rescate_ahorros_') || key.startsWith('income_required_starting_fund_')) {
        delete currentOverrides[key];
        count++;
      }
    });
    if (count > 0) {
      updateProfileData(draft => { draft.overrides = currentOverrides; });
      showToast(`Se han corregido ${count} rescates en caché. Motor recalculado.`, '⚙️');
    } else {
      showToast('Todo estaba en orden, no hubo rescates que corregir.', '👍');
    }
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

  const handleForceUploadLocal = async () => {
    setIsForceUploading(true);
    try {
      await forceUploadLocalToCloud();
    } catch (e) {
      console.error(e);
    } finally {
      setIsForceUploading(false);
    }
  };

  const applyRestore = (payload: any) => {
    importFullState(payload);
    setShowRestoreModal(false);
    showToast('¡Perfil y base de datos restaurados con éxito!', '🎉');
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateMsg('Conectando con el servidor de actualizaciones...');
    try {
      const result = await checkForUpdates(showUpdateUrlInput ? updateUrl : undefined);
      setIsCheckingUpdate(false);
      setUpdateMsg(result.message);
      if (result.hasUpdate) {
        setUpdateReady(true);
        showToast(`¡Nueva versión ${result.latestVersion} disponible!`, '🚀');
      } else {
        showToast(result.message, '✅');
      }
    } catch (e) {
      setIsCheckingUpdate(false);
      setUpdateMsg('Tu aplicación está en la versión más reciente.');
      showToast('Tu aplicación está actualizada.', '✅');
    }
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
      draft.settings.minBalanceCurrency = minBalanceCurrency;
      draft.settings.delayDays = delayDays;
      draft.settings.openingBalance = parseFloat(openingBalanceStr) || 0;
      draft.settings.freeSpend = freeSpend;
      draft.settings.notifTime = notifTime;
      draft.settings.autoSaveThreshold = autoSaveThreshold;
      draft.settings.enableAutoSavings = enableAutoSavings;
      draft.settings.displayCurrency = displayCurrency;
      draft.settings.paymentCurrency = paymentCurrency;
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
        if (parsed && (parsed.profiles || parsed.incomes || parsed.expenses || parsed.settings || parsed.dataPayload)) {
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
            💾 Respaldo y Restauración
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
                <label className="text-xs font-bold text-slate-500">Saldo Inicial Manual</label>
                <input
                  type="number"
                  value={openingBalanceStr === '0' ? '' : openingBalanceStr}
                  onChange={e => setOpeningBalanceStr(e.target.value)}
                  placeholder="0 para auto-calcular"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 mb-3"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Saldo mínimo (Colchón de Seguridad)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    value={minBalance}
                    onChange={e => setMinBalance(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                  <select
                    value={minBalanceCurrency}
                    onChange={e => setMinBalanceCurrency(e.target.value)}
                    className="w-24 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="BS">BS (Bs)</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Sugerir Ahorros Automáticos
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Opcional: Permite que el sistema recomiende apartar excedentes de liquidez por encima del colchón mínimo hacia ahorros.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableAutoSavings(!enableAutoSavings)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    enableAutoSavings ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {enableAutoSavings && (
                <div>
                  <label className="text-xs font-bold text-slate-500">Excedente mínimo para sugerir ahorro ({displayCurrency})</label>
                  <input
                    type="number"
                    value={autoSaveThreshold}
                    onChange={e => setAutoSaveThreshold(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
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
                <label className="text-xs font-bold text-slate-500">Moneda a mostrar</label>
                <select
                  value={displayCurrency}
                  onChange={e => setDisplayCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="USD">USD ($)</option>
                  <option value="BS">BS (Bs)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Moneda para pagar</label>
                <select
                  value={paymentCurrency}
                  onChange={e => setPaymentCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="USD">USD ($)</option>
                  <option value="BS">BS (Bs)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USDT">USDT</option>
                </select>
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
            {/* 1. Sync Online Switch / Mode Selector */}
            <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs ${enableCloudSync ? 'bg-orange-600' : 'bg-emerald-600'}`}>
                    {enableCloudSync ? 'CLOUD' : 'LITE'}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      {enableCloudSync ? 'Sincronización en la Nube' : 'Modo Solo Local (Versión Lite)'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      {enableCloudSync ? 'Tus finanzas se sincronizan con tu cuenta Firebase' : 'Tus finanzas se guardan únicamente en tu teléfono'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!enableCloudSync) {
                      setShowAgreementModal(true);
                    } else {
                      setEnableCloudSync(false);
                      updateProfileData(draft => {
                        draft.settings.enableCloudSync = false;
                      });
                      showToast('Modo Solo Local (Lite) activado', '🔒');
                    }
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    enableCloudSync ? 'bg-orange-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {!enableCloudSync ? (
                <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 leading-relaxed">
                  🔒 <strong>Modo Solo Local Activo:</strong> Tus datos de ingresos, gastos, deudas y ahorros permanecen alojados de forma privada únicamente en la memoria interna de tu teléfono (<code className="bg-emerald-100 dark:bg-emerald-900/80 px-1 py-0.5 rounded text-[10px]">localStorage</code>). Firebase se utilizará únicamente cuando accedas a funciones colaborativas como <strong>MonyShared</strong> o el catálogo de <strong>MonyStore</strong>.
                </p>
              ) : null}
            </div>

            {/* 2. Grouped Cloud Sync Options (Parent Card) - Only shown if enableCloudSync is ON */}
            {enableCloudSync && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-600" /> Respaldo en la Nube (Firebase Cloud)
                  </h3>
                  <span className="text-[10px] bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 font-bold px-2 py-0.5 rounded-full">
                    Sincronización Online
                  </span>
                </div>

                {/* Account Status */}
                {state.authUser ? (
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
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2">
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                      Inicia sesión para respaldar tu información en Firebase Cloud.
                    </p>
                    {onOpenAuth && (
                      <button
                        onClick={onOpenAuth}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold shrink-0"
                      >
                        Iniciar Sesión
                      </button>
                    )}
                  </div>
                )}

                {/* Cloud Action Buttons in Same Parent Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleFirebaseBackup}
                    disabled={isFbBackupLoading || !state.authUser}
                    className="py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Flame className="w-4 h-4" />
                    {isFbBackupLoading ? 'Guardando...' : 'Guardar Respaldo Manual Ahora'}
                  </button>

                  <button
                    type="button"
                    onClick={handleFirebaseRestore}
                    disabled={isFbBackupLoading || !state.authUser}
                    className="py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Database className="w-4 h-4 text-orange-400" />
                    {isFbBackupLoading ? 'Restaurando...' : 'Ver / Restaurar Respaldos'}
                  </button>

                  <button
                    type="button"
                    onClick={handleForceUploadLocal}
                    disabled={isForceUploading || !state.authUser}
                    className="sm:col-span-2 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <RefreshCw className={`w-4 h-4 ${isForceUploading ? 'animate-spin' : ''}`} />
                    {isForceUploading ? 'Limpiando y Subiendo...' : 'Limpiar Base de Datos y Subir Estado Local'}
                  </button>
                </div>
              </div>
            )}

            {/* Scheduled Automatic Backups Section */}
            {enableCloudSync && (
              <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      Programar Respaldos Automáticos
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentSched = profile.settings.backupSchedule || { enabled: false, days: [1, 3, 5], time: '08:00' };
                      const nextEnabled = !currentSched.enabled;
                      updateProfileData(draft => {
                        draft.settings.backupSchedule = { ...currentSched, enabled: nextEnabled };
                      });
                      showToast(
                        nextEnabled ? 'Respaldos programados activados ⏰' : 'Respaldos programados desactivados',
                        nextEnabled ? '⏰' : '⏸️'
                      );
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      profile.settings.backupSchedule?.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Configura días de la semana y una hora específica para guardar un respaldo automático en Firebase Cloud. Se conservan hasta 4 respaldos (al 5º se elimina el más antiguo no seguro 🔒).
                </p>

                {profile.settings.backupSchedule?.enabled && (
                  <div className="space-y-3 pt-2 bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                    {/* Days Selection */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                        Días de Ejecución:
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { label: 'Dom', day: 0 },
                          { label: 'Lun', day: 1 },
                          { label: 'Mar', day: 2 },
                          { label: 'Mié', day: 3 },
                          { label: 'Jue', day: 4 },
                          { label: 'Vie', day: 5 },
                          { label: 'Sáb', day: 6 },
                        ].map(({ label, day }) => {
                          const currentDays = profile.settings.backupSchedule?.days || [1, 3, 5];
                          const isSelected = currentDays.includes(day);

                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const newDays = isSelected
                                  ? currentDays.filter(d => d !== day)
                                  : [...currentDays, day];
                                
                                if (newDays.length === 0) {
                                  showToast('Selecciona al menos un día de la semana', '⚠️');
                                  return;
                                }

                                updateProfileData(draft => {
                                  if (!draft.settings.backupSchedule) {
                                    draft.settings.backupSchedule = { enabled: true, days: newDays, time: '08:00' };
                                  } else {
                                    draft.settings.backupSchedule.days = newDays;
                                  }
                                });
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Picker */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        Hora del Respaldo (Formato 24h):
                      </label>
                      <input
                        type="time"
                        value={profile.settings.backupSchedule?.time || '08:00'}
                        onChange={e => {
                          const timeVal = e.target.value;
                          updateProfileData(draft => {
                            if (!draft.settings.backupSchedule) {
                              draft.settings.backupSchedule = { enabled: true, days: [1, 3, 5], time: timeVal };
                            } else {
                              draft.settings.backupSchedule.time = timeVal;
                            }
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Grouped Local File Backup (Parent Card for Export & Import) */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-600" /> Respaldo Físico Local
                </h3>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold px-2 py-0.5 rounded-full">
                  Archivo .mswsn
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Exporta la base de datos completa a un archivo <code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-[10px]">.mswsn</code> en tu dispositivo o importa datos guardados previamente.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleExportFile}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Exportar Archivo (.mswsn)
                </button>

                <label className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                  <CloudUpload className="w-4 h-4 text-blue-600" /> Importar Archivo
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
                  {typeof __APP_VERSION__ !== 'undefined' ? `v${__APP_VERSION__}` : 'v1.2.6'}
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
              {(updateState.isDownloading || updateState.isCompleted) && updateState.hasUpdate && (
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

              {updateState.hasUpdate && !updateState.isDownloading && !updateState.isCompleted && (
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

                {updateState.hasUpdate ? (
                  updateState.isCompleted ? (
                    <button
                      type="button"
                      onClick={() => {
                        if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
                           import('@capawesome-team/capacitor-file-opener').then(({ FileOpener }) => {
                             FileOpener.openFile({
                               path: updateState.downloadUrl,
                               mimeType: 'application/vnd.android.package-archive'
                             }).catch(err => {
                               console.error('Error abriendo APK', err);
                               showToast('Abriendo instalador...', '📲');
                               const a = document.createElement('a');
                               a.href = updateState.downloadUrl;
                               a.download = `Monywissen-${updateState.latestVersion}.apk`;
                               a.click();
                             });
                           }).catch(() => {
                             const a = document.createElement('a');
                             a.href = updateState.downloadUrl;
                             a.download = `Monywissen-${updateState.latestVersion}.apk`;
                             a.click();
                           });
                        } else {
                          showToast('Abriendo instalador de paquete...', '📲');
                          const a = document.createElement('a');
                          a.href = updateState.downloadUrl;
                          a.download = `Monywissen-${updateState.latestVersion}.apk`;
                          a.click();
                        }
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
                  )
                ) : (
                   <div className="flex-1 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                     <CheckCircle2 className="w-4 h-4" /> App Actualizada
                   </div>
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
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Restablecer Pagos a Pendiente</h3>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                    Cambia el estado de todos los gastos, deudas e ingresos marcados como pagados de vuelta a PENDIENTE sin borrar tus registros.
                  </p>
                </div>
              </div>
              {!confirmPendingReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmPendingReset(true)}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Cambiar Todo a Pendiente
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetAllPaidToPending}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    ✓ Sí, Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPendingReset(false)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

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

            {/* Delete Account Card */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-900 dark:text-red-100">Eliminar Mi Cuenta</h3>
                  <p className="text-xs text-red-700/80 dark:text-red-300/80">
                    Desvincula tu cuenta de usuario, respalda tus datos y programa el borrado en la nube con un margen de 7 días para recuperación.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!state.authUser) {
                    showToast('Inicia sesión para gestionar o eliminar tu cuenta', '⚠️');
                    if (onOpenAuth) onOpenAuth();
                  } else {
                    setShowDeleteAccountModal(true);
                  }
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {state.authUser ? `Eliminar Mi Cuenta (${state.authUser.email})` : 'Eliminar Mi Cuenta'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        userEmail={state.authUser?.email || ''}
      />

      {/* Cloud Sync Agreement Modal */}
      <CloudSyncAgreementModal
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        userEmail={state.authUser?.email}
        onAccept={() => {
          setEnableCloudSync(true);
          updateProfileData(draft => {
            draft.settings.enableCloudSync = true;
          });
          if (state.authUser?.email) {
            backupStateToFirebase(state.authUser.email, state);
          }
          showToast('Sincronización en la Nube y Acuerdo de Confidencialidad Activados', '☁️');
        }}
      />

      {/* Restore Backup Modal */}
      <RestoreBackupModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        backups={availableBackups}
        userEmail={state.authUser?.email}
        onRestore={applyRestore}
        onRefreshList={handleFirebaseRestore}
      />
    </div>
  );
};
