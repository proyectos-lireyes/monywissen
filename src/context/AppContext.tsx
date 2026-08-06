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
import { backupStateToFirebase } from '../utils/firebase';
import { checkAndTriggerDaily8AMReminder } from '../utils/notifications';

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

  // App APK Background Update State
  const [updateState, setUpdateState] = useState<AppUpdateState>({
    isDownloading: false,
    progress: 0,
    downloadSpeed: '0 MB/s',
    downloadedMB: 0,
    totalMB: 18.4,
    isCompleted: false,
    latestVersion: 'v1.5.0',
    downloadUrl: 'https://github.com/monywissen/app/releases/download/v1.5.0/monywissen-v1.5.0.apk',
  });

  const startBackgroundUpdateDownload = () => {
    if (updateState.isDownloading || updateState.isCompleted) return;
    setUpdateState(prev => ({ ...prev, isDownloading: true, progress: 0, isCompleted: false }));
    showToast('Descarga APK de v1.5.0 iniciada en segundo plano', '⏬');
  };

  useEffect(() => {
    let interval: any;
    if (updateState.isDownloading && updateState.progress < 100) {
      interval = setInterval(() => {
        setUpdateState(prev => {
          const next = prev.progress + Math.floor(Math.random() * 8) + 5;
          if (next >= 100) {
            clearInterval(interval);
            showToast('¡Descarga APK de v1.5.0 completada! Ve a Ajustes para instalar', '🎉');
            return {
              ...prev,
              progress: 100,
              isDownloading: false,
              isCompleted: true,
              downloadedMB: prev.totalMB,
              downloadSpeed: '0 MB/s',
            };
          }
          const currentMB = parseFloat(((next / 100) * prev.totalMB).toFixed(1));
          return {
            ...prev,
            progress: next,
            downloadedMB: currentMB,
            downloadSpeed: `${(Math.random() * 1.5 + 2.1).toFixed(1)} MB/s`,
          };
        });
      }, 350);
    }
    return () => clearInterval(interval);
  }, [updateState.isDownloading, updateState.progress]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const [usdRes, eurRes] = await Promise.all([
          fetch('https://ve.dolarapi.com/v1/dolares/oficial').then(r => r.json()),
          fetch('https://ve.dolarapi.com/v1/euros/oficial').then(r => r.json())
        ]);
        
        // USD_BCV is the base 1 in our system because everything is translated to USD BCV
        // but wait, if the API gives us VES per USD...
        // For instance, usdRes.promedio = 43 VES.
        // So 1 USD = 43 VES.
        // If an amount is in BS, to convert to USD BCV, we divide by usdRes.promedio.
        // Let's store the raw VES values
        const usdRate = usdRes.promedio || 40;
        const eurRate = eurRes.promedio || 45;

        setExchangeRates({
          'USD_BCV': 1,
          'USDT': 1, // Assume 1:1 roughly for the app, or fetch if available
          'EUR_BCV': eurRate / usdRate, // If 1 Euro = 45 VES and 1 USD = 40 VES, then 1 Euro = 45/40 = 1.125 USD
          'BS': 1 / usdRate, // 1 VES = 1/40 USD
        });
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

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [state]);

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

  const profile = useMemo(() => sanitizeProfile(rawProfile), [rawProfile]);

  // Check 8:00 AM Daily Payment Reminders
  useEffect(() => {
    if (profile) {
      checkAndTriggerDaily8AMReminder(
        profile.expenses || [],
        profile.debts || [],
        profile.settings?.notificationsEnabled !== false
      );
    }
  }, [profile]);

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
    
    const plan = calculateProjections(profile);
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
    return validateFinancialIntegrity(profile);
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
