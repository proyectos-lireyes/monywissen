/**
 * Application Context & Global State Management
 * Handles persistent state synchronisation, profile management, active view navigation,
 * toast messaging, and financial CRUD operations across all modules.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { AppStateData, UserProfile, ToastMessage, AuthUser } from '../types';
import { todayStr, calculateProjections } from '../utils/financialEngine';
import { validateFinancialIntegrity, validateTransactionExecution, IntegrityReport } from '../utils/financialIntegrity';
import { verifyJWT } from '../utils/security';
import { backupStateToFirebase, subscribeToFirebaseState } from '../utils/firebase';
import { checkAndTriggerDailyReminder } from '../utils/notifications';

declare const __APP_VERSION__: string;

const STORAGE_KEY = 'finplan_profiles_v3';

function getDefaultSeed(): AppStateData {
  return {
    currentProfile: 'Personal',
    profiles: {
      Personal: {
        settings: {
          planStart: todayStr(),
          planEnd: new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10),
          minBalance: 50,
          delayDays: 7,
          openingBalance: undefined,
          freeSpend: 0,
          notifTime: '08:00',
          defaultChart: 0,
          customDebts: [],
          paymentMethods: [],
          contacts: [],
        },
        incomes: [],
        expenses: [],
        debts: [],
        savingsList: [],
        sharedAccounts: [],
        p2p: [],
        overrides: {},
        savings: { current: 0, digital: 0 },
      },
    },
    authToken: null,
    authUser: null,
  };
}

function sanitizeProfile(raw: any): UserProfile {
  const seed = getDefaultSeed().profiles.Personal;
  if (!raw || typeof raw !== 'object') return seed;

  return {
    settings: {
      ...seed.settings,
      ...(raw.settings || {}),
      customDebts: Array.isArray(raw.settings?.customDebts) ? raw.settings.customDebts : seed.settings.customDebts,
      paymentMethods: Array.isArray(raw.settings?.paymentMethods) ? raw.settings.paymentMethods : seed.settings.paymentMethods,
      contacts: Array.isArray(raw.settings?.contacts) ? raw.settings.contacts : seed.settings.contacts,
      budgets: raw.settings?.budgets && typeof raw.settings.budgets === 'object' ? raw.settings.budgets : {},
    },
    incomes: Array.isArray(raw.incomes) ? raw.incomes : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    debts: Array.isArray(raw.debts) ? raw.debts : [],
    savingsList: Array.isArray(raw.savingsList) ? raw.savingsList : [],
    sharedAccounts: Array.isArray(raw.sharedAccounts) ? raw.sharedAccounts : [],
    p2p: Array.isArray(raw.p2p) ? raw.p2p : [],
    overrides: raw.overrides && typeof raw.overrides === 'object' ? raw.overrides : {},
    savings: raw.savings && typeof raw.savings === 'object' ? raw.savings : { current: 0, digital: 0 },
    avatar: raw.avatar || '',
  };
}

export interface AppUpdateState {
  isDownloading: boolean;
  progress: number;
  downloadSpeed: string;
  downloadedMB: number;
  totalMB: number;
  isCompleted: boolean;
  latestVersion: string;
  downloadUrl: string;
}

interface AppContextType {
  state: AppStateData;
  profile: UserProfile;
  currentProfileName: string;
  activeView: string;
  setActiveView: (view: string) => void;
  toasts: ToastMessage[];
  showToast: (msg: string, icon?: string) => void;
  integrityReport: IntegrityReport;
  validateTransaction: (candidate: { type: 'income' | 'expense' | 'debt' | 'saving'; amount: number; date?: string; freq?: string }) => { allowed: boolean; warning?: string; projectedMinBalance: number };
  switchProfile: (name: string) => void;
  createProfile: (name: string) => void;
  deleteProfile: (name: string) => void;
  renameProfile: (oldName: string, newName: string) => void;
  updateProfileData: (updater: (draft: UserProfile) => void, saveUndo?: boolean) => void;
  loginUser: (user: AuthUser, token: string) => void;
  logoutUser: () => void;
  importFullState: (newState: AppStateData) => void;
  importProfileState: (profileName: string, profileData: UserProfile) => void;
  undoLastTransaction: () => void;
  canUndo: boolean;
  exchangeRates: Record<string, number>;
  exchangeRatesMeta?: { publishedAt: string; updatedAt: string; bcvUsd: number; bcvEur: number };
  convertAmount: (amount: number, fromCurrency?: string) => number;
  updateState: AppUpdateState;
  startBackgroundUpdateDownload: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppStateData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.profiles && parsed.currentProfile) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load storage:', e);
    }
    return getDefaultSeed();
  });

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [undoBuffer, setUndoBuffer] = useState<UserProfile | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    'USD_BCV': 1,
    'USD_PARALELO': 1, // Optional placeholder
    'EUR_BCV': 1.05, // Default/fallback
    'USDT': 1,
    'BS': 0.02, // 1 / 50 as fallback
  });

  const [exchangeRatesMeta, setExchangeRatesMeta] = useState<{ publishedAt: string; updatedAt: string; bcvUsd: number; bcvEur: number } | undefined>(undefined);

  // App APK Background Update State
  const [updateState, setUpdateState] = useState<AppUpdateState>({
    isDownloading: false,
    progress: 0,
    downloadSpeed: '0 MB/s',
    downloadedMB: 0,
    totalMB: 18.4,
    isCompleted: true, // We default to completed = true so it doesn't show "Update available" until we actually know there is one
    latestVersion: typeof __APP_VERSION__ !== 'undefined' ? `v${__APP_VERSION__}` : 'v1.0.0',
    downloadUrl: 'https://github.com/proyectos-lireyes/monywissen/releases/latest/download/monywissen-latest.apk',
  });

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/proyectos-lireyes/monywissen/releases/latest');
        if (res.ok) {
          const data = await res.json();
          const rawCurrent = typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__) : '1.0.0';
          const currentVer = rawCurrent.replace(/^v/, '');
          const latestTag = data.tag_name ? data.tag_name.replace(/^v/, '') : '';
          
          if (latestTag && latestTag !== currentVer && latestTag !== 'latest') {
            const apkAsset = data.assets?.find((a: any) => a.name.endsWith('.apk'));
            setUpdateState(prev => ({
              ...prev,
              latestVersion: `v${latestTag}`,
              isCompleted: false,
              totalMB: apkAsset ? Number((apkAsset.size / (1024 * 1024)).toFixed(1)) : 18.4,
              downloadUrl: apkAsset ? apkAsset.browser_download_url : data.html_url
            }));
          }
        }
      } catch (err) {
        console.error("Error checking for updates:", err);
      }
    };
    checkUpdate();
  }, []);

  const startBackgroundUpdateDownload = async () => {
    if (updateState.isDownloading || updateState.isCompleted) return;

    if (!(window as any).Capacitor || !(window as any).Capacitor.isNativePlatform()) {
      showToast('Abriendo enlace de descarga...', '⏬');
      window.location.href = updateState.downloadUrl;
      return;
    }

    setUpdateState(prev => ({ ...prev, isDownloading: true, progress: 0, isCompleted: false }));
    showToast(`Descarga APK de ${updateState.latestVersion} iniciada`, '⏬');

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const fileName = `monywissen-${updateState.latestVersion}.apk`;
      
      let listener: any = null;
      let lastTime = Date.now();
      let lastBytes = 0;

      listener = await Filesystem.addListener('progress', (status) => {
        const progressNum = Math.round((status.bytes / status.contentLength) * 100);
        const downloadedMB = parseFloat((status.bytes / (1024 * 1024)).toFixed(1));
        
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        let speedStr = '0 MB/s';
        if (timeDiff > 0.5) {
           const bytesDiff = status.bytes - lastBytes;
           const speedMBps = (bytesDiff / (1024 * 1024)) / timeDiff;
           speedStr = `${speedMBps.toFixed(1)} MB/s`;
           lastTime = now;
           lastBytes = status.bytes;
        }

        setUpdateState(prev => {
          // preserve the speed string if we didn't calculate a new one
          const currentSpeed = speedStr === '0 MB/s' && prev.downloadSpeed !== '0 MB/s' ? prev.downloadSpeed : speedStr;
          return {
            ...prev,
            progress: progressNum,
            downloadedMB,
            downloadSpeed: currentSpeed
          };
        });
      });

      const result = await Filesystem.downloadFile({
        url: updateState.downloadUrl,
        path: fileName,
        directory: Directory.Data,
        progress: true
      });

      if (listener) listener.remove();

      showToast(`¡Descarga completada! Instálalo ahora.`, '🎉');
      setUpdateState(prev => ({
        ...prev,
        progress: 100,
        isDownloading: false,
        isCompleted: true,
        downloadedMB: prev.totalMB,
        downloadSpeed: '0 MB/s',
        downloadUrl: result.path || updateState.downloadUrl // Update with local path
      }));

    } catch (e: any) {
      console.error('Download error:', e);
      showToast('Error al descargar APK', '❌');
      setUpdateState(prev => ({ ...prev, isDownloading: false }));
    }
  };

  useEffect(() => {
    // Only used for checking update now. Interval removed.
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const [usdRes, eurRes] = await Promise.all([
          fetch('https://ve.dolarapi.com/v1/dolares').then(r => r.json()),
          fetch('https://ve.dolarapi.com/v1/euros').then(r => r.json())
        ]);
        
        // Find oficial and paralelo objects
        const usdOficial = Array.isArray(usdRes) ? usdRes.find(d => d.fuente === 'oficial') : usdRes;
        const usdParalelo = Array.isArray(usdRes) ? usdRes.find(d => d.fuente === 'paralelo') : null;
        
        const eurOficial = Array.isArray(eurRes) ? eurRes.find(d => d.fuente === 'oficial') : eurRes;
        
        const usdRate = usdOficial?.promedio || 40;
        const usdParaleloRate = usdParalelo?.promedio || usdRate;
        const eurRate = eurOficial?.promedio || 45;

        setExchangeRates({
          'USD_BCV': 1,
          'USD_PARALELO': usdParaleloRate / usdRate, // relative to BCV
          'USDT': usdParaleloRate / usdRate, // USDT maps to Dolar Paralelo
          'EUR_BCV': eurRate / usdRate, 
          'BS': 1 / usdRate, 
        });

        if (usdOficial && usdOficial.fechaActualizacion) {
          setExchangeRatesMeta({
            publishedAt: usdOficial.fechaActualizacion,
            updatedAt: new Date().toISOString(),
            bcvUsd: usdOficial.promedio,
            bcvEur: eurOficial?.promedio || eurRate
          });
        }
      } catch (err) {
        console.error('Failed to fetch exchange rates', err);
      }
    };
    fetchRates();
  }, []);

  const convertAmount = (amount: number, fromCurrency?: string) => {
    if (!fromCurrency || fromCurrency === 'USD_BCV') return amount;
    const rate = exchangeRates[fromCurrency];
    return rate ? amount * rate : amount;
  };

  // Sync state to LocalStorage and Firebase
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      // Auto-sync to Firebase if logged in
      if (state.authUser && state.authUser.email) {
         // Create a minimal clone without tokens for backup
         const stateToBackup = JSON.parse(JSON.stringify(state));
         delete stateToBackup.authToken;
         
         // Use setTimeout to debounce slightly, though React handles basic debouncing
         backupStateToFirebase(state.authUser.email, stateToBackup).catch(err => {
             console.error('Error syncing to Firebase:', err);
         });
      }
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [state]);

  useEffect(() => {
    if (state.authUser && state.authUser.email) {
      const unsubscribe = subscribeToFirebaseState(state.authUser.email, (payload) => {
        if (payload) {
          setState(prev => {
            const prevStr = JSON.stringify({ ...prev, authToken: undefined, authUser: undefined });
            const payloadStr = JSON.stringify({ ...payload, authToken: undefined, authUser: undefined });
            if (prevStr === payloadStr) return prev;
            
            return {
              ...payload,
              authToken: prev.authToken,
              authUser: prev.authUser
            };
          });
        }
      });
      return () => unsubscribe();
    }
  }, [state.authUser]);

  const showToast = (message: string, icon: string = '✅') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const currentProfileName = state.currentProfile && state.profiles && state.profiles[state.currentProfile]
    ? state.currentProfile
    : (state.profiles ? Object.keys(state.profiles)[0] : 'Personal') || 'Personal';

  const rawProfile = (state.profiles && state.profiles[currentProfileName])
    ? state.profiles[currentProfileName]
    : getDefaultSeed().profiles.Personal;

  useEffect(() => {
    // Check notifications every minute
    const interval = setInterval(() => {
      const notifEnabled = rawProfile.settings.notificationsEnabled !== false;
      checkAndTriggerDailyReminder(
        rawProfile.expenses,
        rawProfile.debts,
        notifEnabled,
        rawProfile.settings.notifTime || '08:00'
      );
    }, 60000);
    return () => clearInterval(interval);
  }, [rawProfile]);

  const profile = useMemo(() => sanitizeProfile(rawProfile), [rawProfile]);



  // Budget Threshold Check
  useEffect(() => {
    if (!profile.settings.budgets) return;
    
    // Group expenses by category
    const categoryTotals: Record<string, number> = {};
    profile.expenses.forEach(exp => {
      if (exp.category) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      }
    });

    Object.entries(profile.settings.budgets).forEach(([cat, budget]) => {
      const budgetNum = typeof budget === 'number' ? budget : parseFloat(String(budget)) || 0;
      if (budgetNum > 0) {
        const total = categoryTotals[cat] || 0;
        if (total > budgetNum * 0.8) {
          showToast(`¡Alerta de Presupuesto! La categoría "${cat}" supera el 80% del límite mensual (${total} / ${budgetNum}).`, '⚠️');
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.expenses, profile.settings.budgets]);

  // Savings Goal Notifications
  useEffect(() => {
    if (!profile.savingsList || profile.savingsList.length === 0) return;
    
    const plan = calculateProjections(profile, exchangeRates);
    const delayedSavings = plan.filter(p => p.type === 'savings' && p.isDelayed && !p.done);
    
    if (delayedSavings.length > 0) {
      // Get unique delayed savings to avoid spamming multiple toasts for the same item
      const uniqueDelayedNames = Array.from(new Set(delayedSavings.map(s => s.label)));
      uniqueDelayedNames.forEach(name => {
         showToast(`¡Alerta de Ahorro! Estás retrasado o sin liquidez proyectada para: ${name}.`, '📉');
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.savingsList, profile.incomes, profile.expenses, profile.debts, profile.overrides]);

  const updateProfileData = (updater: (draft: UserProfile) => void, saveUndo: boolean = false) => {
    setState(prev => {
      const draftProfiles = { ...prev.profiles };
      const current = draftProfiles[currentProfileName];
      if (!current) return prev;

      if (saveUndo) {
        setUndoBuffer(JSON.parse(JSON.stringify(current)));
      } else if (!saveUndo) {
        // We only clear the buffer if we specifically don't save undo and we update the state
        // wait, actually we should let the caller decide if it saves. 
        // If it's another action, it should probably clear the undo buffer.
        // Let's clear it on any non-transaction update to prevent inconsistent undos.
        setUndoBuffer(null);
      }

      const clonedProfile: UserProfile = JSON.parse(JSON.stringify(current));
      updater(clonedProfile);

      draftProfiles[currentProfileName] = clonedProfile;
      return { ...prev, profiles: draftProfiles };
    });
  };

  const undoLastTransaction = () => {
    if (undoBuffer) {
      setState(prev => {
        const draftProfiles = { ...prev.profiles };
        draftProfiles[currentProfileName] = undoBuffer;
        return { ...prev, profiles: draftProfiles };
      });
      setUndoBuffer(null);
      showToast('Última acción deshecha exitosamente', '↩️');
    }
  };

  const switchProfile = (name: string) => {
    if (state.profiles[name]) {
      setState(prev => ({ ...prev, currentProfile: name }));
      showToast(`Perfil cambiado a "${name}"`, '👤');
    }
  };

  const createProfile = (name: string) => {
    if (!name || state.profiles[name]) {
      showToast('El nombre de perfil ya existe o es inválido', '⚠️');
      return;
    }
    const newProfile: UserProfile = {
      settings: {
        planStart: todayStr(),
        planEnd: new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10),
        minBalance: 50,
        delayDays: 7,
        openingBalance: 0,
        freeSpend: 0,
        notifTime: '08:00',
        defaultChart: 0,
        paymentMethods: [],
        contacts: [],
      },
      incomes: [],
      expenses: [],
      debts: [],
      savingsList: [],
      sharedAccounts: [],
      p2p: [],
      overrides: {},
      savings: { current: 0, digital: 0 },
    };

    setState(prev => ({
      ...prev,
      currentProfile: name,
      profiles: { ...prev.profiles, [name]: newProfile },
    }));

    showToast(`¡Perfil "${name}" creado!`, '🎉');
  };

  const deleteProfile = (name: string) => {
    const keys = Object.keys(state.profiles);
    if (keys.length <= 1) {
      showToast('Debes mantener al menos un perfil activo', '⚠️');
      return;
    }

    setState(prev => {
      const draftProfiles = { ...prev.profiles };
      delete draftProfiles[name];
      const nextProfile = Object.keys(draftProfiles)[0];
      return {
        ...prev,
        currentProfile: nextProfile,
        profiles: draftProfiles,
      };
    });

    showToast(`Perfil "${name}" eliminado`, '🗑️');
  };

  const renameProfile = (oldName: string, newName: string) => {
    if (!newName || state.profiles[newName]) {
      showToast('El nuevo nombre no es válido o ya existe', '⚠️');
      return;
    }

    setState(prev => {
      const draftProfiles = { ...prev.profiles };
      draftProfiles[newName] = draftProfiles[oldName];
      delete draftProfiles[oldName];
      return {
        ...prev,
        currentProfile: prev.currentProfile === oldName ? newName : prev.currentProfile,
        profiles: draftProfiles,
      };
    });

    showToast(`Perfil renombrado a "${newName}"`, '✏️');
  };

  const loginUser = (user: AuthUser, token: string) => {
    setState(prev => ({
      ...prev,
      authToken: token,
      authUser: user,
    }));
    showToast(`¡Bienvenido, ${user.alias}!`, '🔐');
  };

  const logoutUser = () => {
    setState({
      ...getDefaultSeed(),
      authToken: null,
      authUser: null,
    });
    showToast('Sesión cerrada y datos locales borrados', '👋');
  };

  const importFullState = (newState: any) => {
    if (!newState || typeof newState !== 'object') {
      showToast('Objeto de datos no válido para la restauración', '⚠️');
      return;
    }

    const defaultSeed = getDefaultSeed();
    const rawProfiles = newState.profiles && typeof newState.profiles === 'object' ? newState.profiles : {};

    const sanitizedProfiles: Record<string, UserProfile> = {};
    Object.keys(rawProfiles).forEach(key => {
      sanitizedProfiles[key] = sanitizeProfile(rawProfiles[key]);
    });

    if (Object.keys(sanitizedProfiles).length === 0) {
      sanitizedProfiles['Personal'] = defaultSeed.profiles.Personal;
    }

    const targetProfileName = newState.currentProfile && sanitizedProfiles[newState.currentProfile]
      ? newState.currentProfile
      : Object.keys(sanitizedProfiles)[0];

    setState(prev => ({
      currentProfile: targetProfileName,
      profiles: sanitizedProfiles,
      authUser: newState.authUser || prev.authUser,
      authToken: newState.authToken || prev.authToken,
    }));
    showToast('Base de datos y perfil restaurados correctamente desde la nube', '💾');
  };

  const importProfileState = (profileName: string, profileData: UserProfile) => {
    setState(prev => ({
      ...prev,
      currentProfile: profileName,
      profiles: { ...prev.profiles, [profileName]: profileData },
    }));
    showToast(`Perfil "${profileName}" importado`, '📥');
  };

  const integrityReport = useMemo(() => {
    return validateFinancialIntegrity(profile, exchangeRates);
  }, [profile]);

  const validateTransaction = (candidate: { type: 'income' | 'expense' | 'debt' | 'saving'; amount: number; date?: string; freq?: string }) => {
    return validateTransactionExecution(profile, candidate);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        profile,
        currentProfileName,
        activeView,
        setActiveView,
        toasts,
        showToast,
        integrityReport,
        validateTransaction,
        switchProfile,
        createProfile,
        deleteProfile,
        renameProfile,
        updateProfileData,
        loginUser,
        logoutUser,
        importFullState,
        importProfileState,
        undoLastTransaction,
        canUndo: !!undoBuffer,
        exchangeRates,
        exchangeRatesMeta,
        convertAmount,
        updateState,
        startBackgroundUpdateDownload,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
