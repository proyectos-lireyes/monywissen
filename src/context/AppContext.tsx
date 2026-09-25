/**
 * Application Context & Global State Management
 * Handles persistent state synchronisation, profile management, active view navigation,
 * toast messaging, and financial CRUD operations across all modules.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import { AppStateData, UserProfile, ToastMessage, AuthUser } from '../types';
import { todayStr, calculateProjections, setGlobalFormattingContext, parseOverrideKey, calculateAmortizationPlan } from '../utils/financialEngine';
import { validateFinancialIntegrity, validateTransactionExecution, IntegrityReport } from '../utils/financialIntegrity';
import { verifyJWT } from '../utils/security';
import {
  backupStateToFirebase,
  restoreStateFromFirebase,
  subscribeToFirebaseState,
  saveDebtToFirestore,
  deleteDebtFromFirestore,
  saveCuotaToFirestore,
  deleteCuotaFromFirestore,
  saveIncomeToFirestore,
  deleteIncomeFromFirestore,
  saveIncomeOverrideToFirestore,
  deleteIncomeOverrideFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveExpenseOverrideToFirestore,
  deleteExpenseOverrideFromFirestore,
  saveSavingsToFirestore,
  deleteSavingsFromFirestore,
  sanitizeDocId,
  forceUploadStateToFirestore,
  logoutFirebase
} from '../utils/firebase';
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
          openingBalance: 0,
          freeSpend: 0,
          notifTime: '08:00',
          defaultChart: 0,
          customDebts: [],
          paymentMethods: [],
          contacts: [],
          onboardingCompleted: true,
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

  const overrides = raw.overrides && typeof raw.overrides === 'object' ? raw.overrides : {};
  const customDebts = Array.isArray(raw.settings?.customDebts) ? raw.settings.customDebts : [];
  const rawDebts = Array.isArray(raw.debts) ? raw.debts : [];

  const debts = rawDebts.map(debt => {
    try {
      const cuotas = calculateAmortizationPlan(debt, overrides, customDebts, undefined, undefined);
      const isDone = cuotas.length > 0 && cuotas.every(c => c.isPaid);
      return {
        ...debt,
        done: isDone
      };
    } catch (e) {
      return debt;
    }
  });

  return {
    settings: {
      ...seed.settings,
      ...(raw.settings || {}),
      customDebts: customDebts,
      paymentMethods: Array.isArray(raw.settings?.paymentMethods) ? raw.settings.paymentMethods : seed.settings.paymentMethods,
      contacts: Array.isArray(raw.settings?.contacts) ? raw.settings.contacts : seed.settings.contacts,
      budgets: raw.settings?.budgets && typeof raw.settings.budgets === 'object' ? raw.settings.budgets : {},
    },
    incomes: Array.isArray(raw.incomes) ? raw.incomes : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    debts,
    savingsList: Array.isArray(raw.savingsList) ? raw.savingsList : [],
    sharedAccounts: Array.isArray(raw.sharedAccounts) ? raw.sharedAccounts : [],
    p2p: Array.isArray(raw.p2p) ? raw.p2p : [],
    overrides,
    savings: raw.savings && typeof raw.savings === 'object' ? raw.savings : { current: 0, digital: 0 },
    avatar: raw.avatar || '',
  };
}

export interface AppUpdateState {
  hasUpdate: boolean;
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
  checkForUpdates: (customUrl?: string) => Promise<{ hasUpdate: boolean; latestVersion: string; message: string }>;
  forceUploadLocalToCloud: () => Promise<void>;
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
    'USD': 1,
    'USD_PARALELO': 1, // Optional placeholder
    'EUR_BCV': 1.05, // Default/fallback
    'EUR': 1.05,
    'USDT': 1,
    'BS': 0.02, // 1 / 50 as fallback
    'VES': 0.02,
  });

  const [exchangeRatesMeta, setExchangeRatesMeta] = useState<{ publishedAt: string; updatedAt: string; bcvUsd: number; bcvEur: number } | undefined>(undefined);
  const [syncSessionId, setSyncSessionId] = useState<number>(0);

  // App APK Background Update State
  const isSyncReady = React.useRef(false);
  const isBulkOperationInProgress = React.useRef(false);
  const lastServerPayloadRef = React.useRef<string | null>(null);
  const [updateState, setUpdateState] = React.useState<AppUpdateState>({
    hasUpdate: false,
    isDownloading: false,
    progress: 0,
    downloadSpeed: '0 MB/s',
    downloadedMB: 0,
    totalMB: 18.4,
    isCompleted: false,
    latestVersion: typeof __APP_VERSION__ !== 'undefined' ? `v${__APP_VERSION__}` : 'v1.0.0',
    downloadUrl: '',
  });

  const checkForUpdates = async (customUrl?: string) => {
    const rawCurrent = typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__) : '1.2.5';
    const currentVer = rawCurrent.replace(/^v/, '').trim();
    const targetUrl = customUrl || 'https://api.github.com/repos/proyectos-lireyes/monywissen/releases/latest';

    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const data = await res.json();
        const latestTag = data.tag_name ? data.tag_name.replace(/^v/, '').trim() : '';

        const isNewerVersion = (curr: string, lat: string): boolean => {
          if (!lat || lat === 'latest') return false;
          const curParts = curr.split('.').map(n => parseInt(n, 10) || 0);
          const latParts = lat.split('.').map(n => parseInt(n, 10) || 0);

          for (let i = 0; i < Math.max(curParts.length, latParts.length); i++) {
            const c = curParts[i] || 0;
            const l = latParts[i] || 0;
            if (l > c) return true;  // Latest is strictly newer
            if (c > l) return false; // Current is equal or newer
          }
          return false;
        };

        if (isNewerVersion(currentVer, latestTag)) {
          const apkAsset = data.assets?.find((a: any) => a.name?.endsWith('.apk'));
          const nextState = {
            hasUpdate: true,
            latestVersion: `v${latestTag}`,
            isCompleted: false,
            totalMB: apkAsset ? Number((apkAsset.size / (1024 * 1024)).toFixed(1)) : 18.4,
            downloadUrl: apkAsset ? apkAsset.browser_download_url : (data.html_url || '')
          };
          setUpdateState(prev => ({ ...prev, ...nextState }));
          return { hasUpdate: true, latestVersion: `v${latestTag}`, message: `¡Nueva versión v${latestTag} disponible!` };
        } else {
          setUpdateState(prev => ({ ...prev, hasUpdate: false, isCompleted: false }));
          return { hasUpdate: false, latestVersion: `v${currentVer}`, message: `Tienes la última versión instalada (v${currentVer}). Tu aplicación está completamente actualizada.` };
        }
      } else {
        setUpdateState(prev => ({ ...prev, hasUpdate: false, isCompleted: false }));
        return { hasUpdate: false, latestVersion: `v${currentVer}`, message: `Tienes la versión instalada v${currentVer}. Tu aplicación está actualizada.` };
      }
    } catch (err) {
      console.error("Error checking for updates:", err);
      setUpdateState(prev => ({ ...prev, hasUpdate: false, isCompleted: false }));
      return { hasUpdate: false, latestVersion: `v${currentVer}`, message: `Tienes la versión instalada v${currentVer}. Servidor no reporta actualizaciones.` };
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  const startBackgroundUpdateDownload = async () => {
    if (updateState.isDownloading || updateState.isCompleted) return;

    setUpdateState(prev => ({ ...prev, isDownloading: true, progress: 0, isCompleted: false }));
    showToast(`Descargando actualización ${updateState.latestVersion} en memoria de la app...`, '⏬');

    // 1. Native Capacitor Shell Android download
    if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
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

          setUpdateState(prev => ({
            ...prev,
            progress: progressNum,
            downloadedMB,
            downloadSpeed: speedStr === '0 MB/s' && prev.downloadSpeed !== '0 MB/s' ? prev.downloadSpeed : speedStr
          }));
        });

        const result = await Filesystem.downloadFile({
          url: updateState.downloadUrl,
          path: fileName,
          directory: Directory.Data,
          progress: true
        });

        if (listener) listener.remove();

        showToast(`¡Descarga completada en memoria de la app! Listo para instalar.`, '🎉');
        setUpdateState(prev => ({
          ...prev,
          progress: 100,
          isDownloading: false,
          isCompleted: true,
          downloadedMB: prev.totalMB,
          downloadSpeed: '0 MB/s',
          downloadUrl: result.path || updateState.downloadUrl
        }));
        return;
      } catch (e: any) {
        console.error('Capacitor download error, falling back to direct in-app fetch:', e);
      }
    }

    // 2. Direct In-App Memory XHR Download (does NOT redirect to browser)
    try {
      const fileName = `monywissen-${updateState.latestVersion}.apk`;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', updateState.downloadUrl, true);
      xhr.responseType = 'blob';

      let lastTime = Date.now();
      let lastBytes = 0;

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progressNum = Math.round((event.loaded / event.total) * 100);
          const downloadedMB = parseFloat((event.loaded / (1024 * 1024)).toFixed(1));
          const totalMB = parseFloat((event.total / (1024 * 1024)).toFixed(1));

          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          let speedStr = '0 MB/s';
          if (timeDiff > 0.5) {
            const bytesDiff = event.loaded - lastBytes;
            const speedMBps = (bytesDiff / (1024 * 1024)) / timeDiff;
            speedStr = `${speedMBps.toFixed(1)} MB/s`;
            lastTime = now;
            lastBytes = event.loaded;
          }

          setUpdateState(prev => ({
            ...prev,
            progress: progressNum,
            downloadedMB,
            totalMB,
            downloadSpeed: speedStr === '0 MB/s' && prev.downloadSpeed !== '0 MB/s' ? prev.downloadSpeed : speedStr
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 0) {
          const blob = xhr.response;
          const blobUrl = URL.createObjectURL(blob);
          
          showToast(`¡Descarga completada en la memoria de la app!`, '🎉');
          setUpdateState(prev => ({
            ...prev,
            progress: 100,
            isDownloading: false,
            isCompleted: true,
            downloadedMB: prev.totalMB,
            downloadSpeed: '0 MB/s',
            downloadUrl: blobUrl
          }));

          // Trigger in-app package installation prompt from downloaded blob
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          showToast('Error al descargar APK en la app', '❌');
          setUpdateState(prev => ({ ...prev, isDownloading: false }));
        }
      };

      xhr.onerror = () => {
        // Fallback if CORS prevents blob fetch: create direct trigger in app memory
        showToast('Descarga iniciada en memoria local...', '⏬');
        const a = document.createElement('a');
        a.href = updateState.downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setUpdateState(prev => ({
          ...prev,
          progress: 100,
          isDownloading: false,
          isCompleted: true,
          downloadedMB: prev.totalMB,
          downloadSpeed: '0 MB/s'
        }));
      };

      xhr.send();
    } catch (err: any) {
      console.error('In-app download error:', err);
      showToast('Error al descargar actualización en la app', '❌');
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

        const eurVal = eurRate / usdRate;
        const bsVal = 1 / usdRate;

        setExchangeRates({
          'USD_BCV': 1,
          'USD': 1,
          'USD_PARALELO': usdParaleloRate / usdRate, // relative to BCV
          'USDT': usdParaleloRate / usdRate, // USDT maps to Dolar Paralelo
          'EUR_BCV': eurVal, 
          'EUR': eurVal,
          'BS': bsVal, 
          'VES': bsVal,
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
    if (!amount) return 0;
    if (!fromCurrency || fromCurrency === 'USD_BCV' || fromCurrency === 'USD') return amount;
    let curr = fromCurrency;
    if (curr === 'EUR') curr = 'EUR_BCV';
    const rate = exchangeRates[curr] || exchangeRates[fromCurrency];
    return rate ? amount * rate : amount;
  };

  const currentProfileName = state.currentProfile && state.profiles && state.profiles[state.currentProfile]
    ? state.currentProfile
    : (state.profiles ? Object.keys(state.profiles)[0] : 'Personal') || 'Personal';

  const rawProfile = (state.profiles && state.profiles[currentProfileName])
    ? state.profiles[currentProfileName]
    : getDefaultSeed().profiles.Personal;

  const profile = useMemo(() => sanitizeProfile(rawProfile), [rawProfile]);

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

  // Sync state to LocalStorage and Firebase with fast debounce
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocalMutationTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      lastLocalMutationTimeRef.current = Date.now();
      
      // Auto-sync to Firebase if logged in or cloud sync is active
      const isCloudEnabled = Boolean(profile?.settings?.enableCloudSync || state.authUser?.email);
      const userEmail = state.authUser?.email || profile?.settings?.userEmail;
      
      if (isCloudEnabled && userEmail && !isBulkOperationInProgress.current && isSyncReady.current) {
         // Create a minimal clone without tokens for backup
         const stateToBackup = JSON.parse(JSON.stringify(state));
         delete stateToBackup.authToken;
         if (!stateToBackup.lastUpdatedAt) {
           stateToBackup.lastUpdatedAt = Date.now();
         }
         
         const stateBackupStr = JSON.stringify({ ...stateToBackup, authUser: undefined, lastUpdatedAt: undefined });
         if (lastServerPayloadRef.current === stateBackupStr) {
           return;
         }
         
         if (syncTimeoutRef.current) {
           clearTimeout(syncTimeoutRef.current);
         }
         
         // Fast debounce: 250ms so user actions sync immediately across devices
         syncTimeoutRef.current = setTimeout(() => {
           backupStateToFirebase(userEmail, stateToBackup).then(() => {
             lastServerPayloadRef.current = stateBackupStr;
           }).catch(err => {
             console.error('Error syncing to Firebase:', err);
           });
         }, 250);
      }
    } catch (e) {
      console.error('Error saving state:', e);
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [state, profile?.settings?.enableCloudSync, profile?.settings?.userEmail]);

  // Flush sync immediately when leaving tab or closing app
  useEffect(() => {
    const handleBeforeUnloadOrHide = () => {
      const userEmail = state.authUser?.email || profile?.settings?.userEmail;
      const isCloudEnabled = Boolean(profile?.settings?.enableCloudSync || state.authUser?.email);
      if (isCloudEnabled && userEmail && isSyncReady.current) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        const stateToBackup = JSON.parse(JSON.stringify(state));
        delete stateToBackup.authToken;
        if (!stateToBackup.lastUpdatedAt) stateToBackup.lastUpdatedAt = Date.now();
        backupStateToFirebase(userEmail, stateToBackup).catch(console.error);
      }
    };
    document.addEventListener('visibilitychange', handleBeforeUnloadOrHide);
    window.addEventListener('beforeunload', handleBeforeUnloadOrHide);
    window.addEventListener('pagehide', handleBeforeUnloadOrHide);
    return () => {
      document.removeEventListener('visibilitychange', handleBeforeUnloadOrHide);
      window.removeEventListener('beforeunload', handleBeforeUnloadOrHide);
      window.removeEventListener('pagehide', handleBeforeUnloadOrHide);
    };
  }, [state, profile?.settings?.enableCloudSync, profile?.settings?.userEmail]);

  // Initial load on user authentication
  const initialLoadedUserRef = useRef<string | null>(null);

  useEffect(() => {
    const userEmail = state.authUser?.email || profile?.settings?.userEmail;
    const isCloudEnabled = Boolean(profile?.settings?.enableCloudSync || state.authUser?.email);
    if (isCloudEnabled && userEmail && initialLoadedUserRef.current !== userEmail && syncSessionId !== -1) {
      initialLoadedUserRef.current = userEmail;
      isSyncReady.current = false;
      
      restoreStateFromFirebase(userEmail).then(payload => {
        if (payload) {
          setState(prev => {
            const remoteTime = Number(payload.lastUpdatedAt || 0);
            const localTime = Number(prev.lastUpdatedAt || 0);
            const payloadStr = JSON.stringify({ ...payload, authToken: undefined, authUser: undefined, lastUpdatedAt: undefined });
            lastServerPayloadRef.current = payloadStr;

            // Last-Write-Wins: if remote payload is newer or equal, or local has no timestamp, accept remote
            if (remoteTime >= localTime || !prev.lastUpdatedAt) {
              return {
                ...payload,
                authToken: prev.authToken,
                authUser: prev.authUser,
                lastUpdatedAt: remoteTime || Date.now()
              };
            }
            return prev;
          });
        }
        isSyncReady.current = true;
      }).catch(err => {
        console.error('Error loading initial state from Firebase:', err);
        isSyncReady.current = true;
      });
    }
  }, [state.authUser, profile?.settings?.enableCloudSync, profile?.settings?.userEmail, syncSessionId]);

  // Real-time listener for changes from other devices
  useEffect(() => {
    const userEmail = state.authUser?.email || profile?.settings?.userEmail;
    const isCloudEnabled = Boolean(profile?.settings?.enableCloudSync || state.authUser?.email);
    if (!isCloudEnabled || !userEmail || syncSessionId === -1) return;

    const unsubscribe = subscribeToFirebaseState(userEmail, (remotePayload, exists) => {
      if (!exists || !remotePayload || isBulkOperationInProgress.current) return;

      const remoteStr = JSON.stringify({ ...remotePayload, authToken: undefined, authUser: undefined, lastUpdatedAt: undefined });
      if (remoteStr === lastServerPayloadRef.current) return;

      setState(prev => {
        const currentStr = JSON.stringify({ ...prev, authToken: undefined, authUser: undefined, lastUpdatedAt: undefined });
        if (remoteStr === currentStr) return prev;

        const remoteTime = Number(remotePayload.lastUpdatedAt || 0);
        const localTime = Number(prev.lastUpdatedAt || 0);

        // Accept remote change if remote is newer or equal to local
        if (remoteTime >= localTime || !prev.lastUpdatedAt) {
          lastServerPayloadRef.current = remoteStr;
          return {
            ...remotePayload,
            authToken: prev.authToken,
            authUser: prev.authUser,
            lastUpdatedAt: remoteTime || Date.now()
          };
        }
        return prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [state.authUser?.email, profile?.settings?.enableCloudSync, profile?.settings?.userEmail, syncSessionId]);

  // Tab focus / visibility auto-refresh: When user switches back to this tab or device, immediately fetch latest data
  useEffect(() => {
    const handleTabFocus = async () => {
      const userEmail = state.authUser?.email || profile?.settings?.userEmail;
      const isCloudEnabled = Boolean(profile?.settings?.enableCloudSync || state.authUser?.email);
      if (document.visibilityState === 'visible' && isCloudEnabled && userEmail && !isBulkOperationInProgress.current) {
        try {
          const remotePayload = await restoreStateFromFirebase(userEmail);
          if (remotePayload) {
            const remoteStr = JSON.stringify({ ...remotePayload, authToken: undefined, authUser: undefined, lastUpdatedAt: undefined });
            if (remoteStr !== lastServerPayloadRef.current) {
              setState(prev => {
                const currentStr = JSON.stringify({ ...prev, authToken: undefined, authUser: undefined, lastUpdatedAt: undefined });
                if (currentStr === remoteStr) return prev;

                const remoteTime = Number(remotePayload.lastUpdatedAt || 0);
                const localTime = Number(prev.lastUpdatedAt || 0);

                if (remoteTime >= localTime || !prev.lastUpdatedAt) {
                  lastServerPayloadRef.current = remoteStr;
                  return {
                    ...remotePayload,
                    authToken: prev.authToken,
                    authUser: prev.authUser,
                    lastUpdatedAt: remoteTime || Date.now()
                  };
                }
                return prev;
              });
            }
          }
        } catch (e) {
          console.error('Error refreshing on tab focus:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleTabFocus);
    window.addEventListener('focus', handleTabFocus);
    window.addEventListener('pageshow', handleTabFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleTabFocus);
      window.removeEventListener('focus', handleTabFocus);
      window.removeEventListener('pageshow', handleTabFocus);
    };
  }, [profile?.settings?.enableCloudSync, profile?.settings?.userEmail, state.authUser?.email]);

  const showToast = (message: string, icon: string = '✅') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Sync global formatting context for financialEngine so that formatCurrency() knows the display currency
  useEffect(() => {
    setGlobalFormattingContext(profile.settings.displayCurrency || 'USD', exchangeRates);
  }, [profile.settings.displayCurrency, exchangeRates]);

  // Automated incremental Firestore sync for user-saved changes (debts, incomes, expenses, savings, overrides)
  const prevDebtsRef = useRef<any[]>([]);
  const prevIncomesRef = useRef<any[]>([]);
  const prevExpensesRef = useRef<any[]>([]);
  const prevOverridesRef = useRef<Record<string, any>>({});
  const prevSavingsRef = useRef<any[]>([]);
  const lastUserRef = useRef<string | null>(null);

  useEffect(() => {
    const email = state.authUser?.email;
    if (!email) {
      prevDebtsRef.current = [];
      prevIncomesRef.current = [];
      prevExpensesRef.current = [];
      prevOverridesRef.current = {};
      prevSavingsRef.current = [];
      lastUserRef.current = null;
      return;
    }

    const currentDebts = profile.debts || [];
    const currentIncomes = profile.incomes || [];
    const currentExpenses = profile.expenses || [];
    const currentSavings = profile.savingsList || [];
    const currentOverrides = profile.overrides || {};

    // Initialize refs if the user just logged in or switched to avoid redundant writes of existing records
    if (lastUserRef.current !== email) {
      prevDebtsRef.current = JSON.parse(JSON.stringify(currentDebts));
      prevIncomesRef.current = JSON.parse(JSON.stringify(currentIncomes));
      prevExpensesRef.current = JSON.parse(JSON.stringify(currentExpenses));
      prevOverridesRef.current = JSON.parse(JSON.stringify(currentOverrides));
      prevSavingsRef.current = JSON.parse(JSON.stringify(currentSavings));
      lastUserRef.current = email;
      return;
    }

    // Guard against overwriting during initial database download
    if (!isSyncReady.current) {
      prevDebtsRef.current = JSON.parse(JSON.stringify(currentDebts));
      prevIncomesRef.current = JSON.parse(JSON.stringify(currentIncomes));
      prevExpensesRef.current = JSON.parse(JSON.stringify(currentExpenses));
      prevOverridesRef.current = JSON.parse(JSON.stringify(currentOverrides));
      prevSavingsRef.current = JSON.parse(JSON.stringify(currentSavings));
      return;
    }

    const prevDebts = prevDebtsRef.current;
    const prevIncomes = prevIncomesRef.current;
    const prevExpenses = prevExpensesRef.current;
    const prevOverrides = prevOverridesRef.current;
    const prevSavings = prevSavingsRef.current;

    // --- DEBTS SYNC ---
    // Detect deleted debts
    prevDebts.forEach(prevD => {
      if (!currentDebts.some(d => d.id === prevD.id)) {
        deleteDebtFromFirestore(email, prevD.id, prevD.name);
      }
    });
    // Detect added or modified debts
    currentDebts.forEach(d => {
      const prevD = prevDebts.find(p => p.id === d.id);
      if (!prevD || JSON.stringify(prevD) !== JSON.stringify(d)) {
        if (prevD && prevD.name !== d.name) {
          deleteDebtFromFirestore(email, prevD.id, prevD.name);
        }
        saveDebtToFirestore(email, d, currentProfileName, currentOverrides, profile.settings?.customDebts || [], state.exchangeRates);
      }
    });

    // --- INCOMES SYNC ---
    // Detect deleted incomes
    prevIncomes.forEach(prevInc => {
      if (!currentIncomes.some(inc => inc.id === prevInc.id)) {
        deleteIncomeFromFirestore(email, prevInc.id, prevInc.name);
      }
    });
    // Detect added or modified incomes
    currentIncomes.forEach(inc => {
      const prevInc = prevIncomes.find(p => p.id === inc.id);
      if (!prevInc || JSON.stringify(prevInc) !== JSON.stringify(inc)) {
        if (prevInc && prevInc.name !== inc.name) {
          deleteIncomeFromFirestore(email, prevInc.id, prevInc.name);
        }
        saveIncomeToFirestore(email, inc, currentProfileName);
      }
    });

    // --- EXPENSES SYNC ---
    // Detect deleted expenses
    prevExpenses.forEach(prevExp => {
      if (!currentExpenses.some(exp => exp.id === prevExp.id)) {
        deleteExpenseFromFirestore(email, prevExp.id, prevExp.name);
      }
    });
    // Detect added or modified expenses
    currentExpenses.forEach(exp => {
      const prevExp = prevExpenses.find(p => p.id === exp.id);
      if (!prevExp || JSON.stringify(prevExp) !== JSON.stringify(exp)) {
        if (prevExp && prevExp.name !== exp.name) {
          deleteExpenseFromFirestore(email, prevExp.id, prevExp.name);
        }
        saveExpenseToFirestore(email, exp, currentProfileName);
      }
    });

    // --- SAVINGS SYNC ---
    // Detect deleted savings
    prevSavings.forEach(prevS => {
      if (!currentSavings.some(s => s.id === prevS.id)) {
        deleteSavingsFromFirestore(email, prevS.id, prevS.person);
      }
    });
    // Detect added or modified savings
    currentSavings.forEach(s => {
      const prevS = prevSavings.find(p => p.id === s.id);
      if (!prevS || JSON.stringify(prevS) !== JSON.stringify(s)) {
        if (prevS && prevS.person !== s.person) {
          deleteSavingsFromFirestore(email, prevS.id, prevS.person);
        }
        saveSavingsToFirestore(email, s, currentProfileName);
      }
    });

    // --- OVERRIDES SYNC (cuotas / overrides) ---
    // Detect deleted overrides
    Object.keys(prevOverrides).forEach(key => {
      if (!currentOverrides[key]) {
        const { type: overrideType, entityId } = parseOverrideKey(key);
        if (entityId) {
          if (overrideType === 'debt') {
            const parent = prevDebts.find(d => d.id === entityId || d.id === 'debt_' + entityId || ('debt_' + d.id) === entityId || sanitizeDocId(d.name, d.id) === entityId) || currentDebts.find(d => d.id === entityId || d.id === 'debt_' + entityId || ('debt_' + d.id) === entityId || sanitizeDocId(d.name, d.id) === entityId);
            deleteCuotaFromFirestore(email, entityId, key, parent?.name);
          } else if (overrideType === 'income') {
            const parent = prevIncomes.find(inc => inc.id === entityId || sanitizeDocId(inc.name, inc.id) === entityId) || currentIncomes.find(inc => inc.id === entityId || sanitizeDocId(inc.name, inc.id) === entityId);
            deleteIncomeOverrideFromFirestore(email, entityId, key, parent?.name);
          } else if (overrideType === 'expense') {
            const parent = prevExpenses.find(exp => exp.id === entityId || sanitizeDocId(exp.name, exp.id) === entityId) || currentExpenses.find(exp => exp.id === entityId || sanitizeDocId(exp.name, exp.id) === entityId);
            deleteExpenseOverrideFromFirestore(email, entityId, key, parent?.name);
          }
        }
      }
    });

    // Detect added or modified overrides
    Object.keys(currentOverrides).forEach(key => {
      const { type: overrideType, entityId } = parseOverrideKey(key);
      const val = currentOverrides[key];
      const prevVal = prevOverrides[key];
      if (entityId) {
        let forceWrite = false;
        if (overrideType === 'debt') {
          const prevParent = prevDebts.find(d => d.id === entityId || d.id === 'debt_' + entityId || ('debt_' + d.id) === entityId || sanitizeDocId(d.name, d.id) === entityId);
          const currParent = currentDebts.find(d => d.id === entityId || d.id === 'debt_' + entityId || ('debt_' + d.id) === entityId || sanitizeDocId(d.name, d.id) === entityId);
          if (prevParent && currParent && prevParent.name !== currParent.name) {
            forceWrite = true;
          }
        } else if (overrideType === 'income') {
          const prevParent = prevIncomes.find(inc => inc.id === entityId || sanitizeDocId(inc.name, inc.id) === entityId);
          const currParent = currentIncomes.find(inc => inc.id === entityId || sanitizeDocId(inc.name, inc.id) === entityId);
          if (prevParent && currParent && prevParent.name !== currParent.name) {
            forceWrite = true;
          }
        } else if (overrideType === 'expense') {
          const prevParent = prevExpenses.find(exp => exp.id === entityId || sanitizeDocId(exp.name, exp.id) === entityId);
          const currParent = currentExpenses.find(exp => exp.id === entityId || sanitizeDocId(exp.name, exp.id) === entityId);
          if (prevParent && currParent && prevParent.name !== currParent.name) {
            forceWrite = true;
          }
        }

        if (forceWrite || !prevVal || JSON.stringify(prevVal) !== JSON.stringify(val)) {
          if (overrideType === 'debt') {
            const parent = currentDebts.find(d => d.id === entityId || d.id === 'debt_' + entityId || ('debt_' + d.id) === entityId || sanitizeDocId(d.name, d.id) === entityId);
            saveCuotaToFirestore(email, entityId, key, val, parent?.name);
          } else if (overrideType === 'income') {
            const parent = currentIncomes.find(inc => inc.id === entityId || sanitizeDocId(inc.name, inc.id) === entityId);
            saveIncomeOverrideToFirestore(email, entityId, key, val, parent?.name);
          } else if (overrideType === 'expense') {
            const parent = currentExpenses.find(exp => exp.id === entityId || sanitizeDocId(exp.name, exp.id) === entityId);
            saveExpenseOverrideToFirestore(email, entityId, key, val, parent?.name);
          }
        }
      }
    });

    // Update refs for next change detection loop
    prevDebtsRef.current = JSON.parse(JSON.stringify(currentDebts));
    prevIncomesRef.current = JSON.parse(JSON.stringify(currentIncomes));
    prevExpensesRef.current = JSON.parse(JSON.stringify(currentExpenses));
    prevSavingsRef.current = JSON.parse(JSON.stringify(currentSavings));
    prevOverridesRef.current = JSON.parse(JSON.stringify(currentOverrides));
  }, [profile.debts, profile.incomes, profile.expenses, profile.savingsList, profile.overrides, state.authUser, currentProfileName]);



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
      return { ...prev, profiles: draftProfiles, lastUpdatedAt: Date.now() };
    });
  };

  const undoLastTransaction = () => {
    if (undoBuffer) {
      setState(prev => {
        const draftProfiles = { ...prev.profiles };
        draftProfiles[currentProfileName] = undoBuffer;
        return { ...prev, profiles: draftProfiles, lastUpdatedAt: Date.now() };
      });
      setUndoBuffer(null);
      showToast('Última acción deshecha exitosamente', '↩️');
    }
  };

  const switchProfile = (name: string) => {
    if (state.profiles[name]) {
      setState(prev => {
        const draftProfiles = { ...prev.profiles };
        if (draftProfiles[name]?.settings) {
          if (draftProfiles[name].settings.openingBalance === undefined) {
            draftProfiles[name].settings.openingBalance = 0;
          }
          draftProfiles[name].settings.onboardingCompleted = true;
        }
        return { ...prev, currentProfile: name, profiles: draftProfiles };
      });
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
        onboardingCompleted: true,
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
      if (draftProfiles[nextProfile]?.settings) {
        if (draftProfiles[nextProfile].settings.openingBalance === undefined) {
          draftProfiles[nextProfile].settings.openingBalance = 0;
        }
        draftProfiles[nextProfile].settings.onboardingCompleted = true;
      }
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
    setState(prev => {
      const aliasName = user.alias?.trim();
      const draftProfiles = { ...prev.profiles };
      let newCurrentProfile = prev.currentProfile;

      if (aliasName) {
        if (draftProfiles[newCurrentProfile] && newCurrentProfile !== aliasName && !draftProfiles[aliasName]) {
          draftProfiles[aliasName] = draftProfiles[newCurrentProfile];
          delete draftProfiles[newCurrentProfile];
          newCurrentProfile = aliasName;
        } else if (draftProfiles['Personal'] && !draftProfiles[aliasName]) {
          draftProfiles[aliasName] = draftProfiles['Personal'];
          delete draftProfiles['Personal'];
          if (newCurrentProfile === 'Personal') {
            newCurrentProfile = aliasName;
          }
        }
      }

      // Also ensure myAlias setting is synced
      if (aliasName && draftProfiles[newCurrentProfile]) {
        draftProfiles[newCurrentProfile].settings.myAlias = aliasName;
      }

      return {
        ...prev,
        authToken: token,
        authUser: user,
        currentProfile: newCurrentProfile,
        profiles: draftProfiles,
      };
    });
    showToast(`¡Bienvenido, ${user.alias}!`, '🔐');
  };

  const logoutUser = () => {
    logoutFirebase();
    setState({
      ...getDefaultSeed(),
      authToken: null,
      authUser: null,
    });
    showToast('Sesión cerrada y datos locales borrados', '👋');
  };

  const importFullState = (incomingState: any) => {
    if (!incomingState || typeof incomingState !== 'object') {
      showToast('Objeto de datos no válido para la restauración', '⚠️');
      return;
    }

    const newState = incomingState.dataPayload ? incomingState.dataPayload : incomingState;
    const defaultSeed = getDefaultSeed();
    let rawProfiles = newState.profiles && typeof newState.profiles === 'object' ? newState.profiles : null;

    if (!rawProfiles) {
      if (newState.incomes || newState.expenses || newState.settings || newState.debts) {
        rawProfiles = { [newState.currentProfile || 'Personal']: newState };
      } else {
        rawProfiles = {};
      }
    }

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
    showToast('Base de datos y perfiles restaurados correctamente con toda tu información', '💾');
  };

  const importProfileState = (profileName: string, profileData: UserProfile) => {
    setState(prev => ({
      ...prev,
      currentProfile: profileName,
      profiles: { ...prev.profiles, [profileName]: profileData },
    }));
    showToast(`Perfil "${profileName}" importado`, '📥');
  };

  const forceUploadLocalToCloud = async () => {
    if (!state.authUser?.email) {
      showToast('Inicia sesión para subir datos a Firebase', '⚠️');
      return;
    }
    
    setSyncSessionId(-1);
    isBulkOperationInProgress.current = true;
    isSyncReady.current = false;
    try {
      const stateToBackup = JSON.parse(JSON.stringify(state));
      delete stateToBackup.authToken;
      
      await forceUploadStateToFirestore(state.authUser.email, stateToBackup);
      showToast('¡Nube sobrescrita con tus datos locales con éxito!', '🔥');
    } catch (e) {
      console.error(e);
      showToast('Error al forzar la subida a Firebase', '❌');
    } finally {
      isSyncReady.current = true;
      // Re-enable snapshot stream
      setSyncSessionId(Date.now());
      // Delay releasing the lock to let all deletion/update snapshots settle
      setTimeout(() => {
        isBulkOperationInProgress.current = false;
      }, 1500);
    }
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
        checkForUpdates,
        forceUploadLocalToCloud,
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
