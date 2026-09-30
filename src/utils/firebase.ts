import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocs, query, orderBy, deleteDoc, limit, where, updateDoc } from 'firebase/firestore';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { calculateAmortizationPlan, parseOverrideKey } from './financialEngine';

export const app = initializeApp(firebaseConfig);

if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize({
    clientId: firebaseConfig.oAuthClientId,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let quotaToastShown = false;

export function isQuotaCurrentlyBlocked(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('mony_firestore_quota_exceeded') === 'true';
}

export function isQuotaExceededError(error: any): boolean {
  if (!error) return false;
  const code = error?.code || error?.error?.code || '';
  const msg = String(error?.message || error?.error?.message || error || '').toLowerCase();
  return (
    code === 'resource-exhausted' ||
    msg.includes('quota exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('quota limit exceeded') ||
    msg.includes('free daily write units') ||
    msg.includes('free daily read units')
  );
}

export function handleFirestoreError(error: any, contextMessage: string) {
  if (isQuotaExceededError(error)) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mony_firestore_quota_exceeded', 'true');
    }
    if (!quotaToastShown) {
      quotaToastShown = true;
      console.warn('⚠️ Límite de cuota diaria de Firestore alcanzado. La app continuará funcionando guardando tus cambios localmente en este dispositivo.');
    }
  } else {
    console.error(contextMessage, error);
  }
}

/**
 * Full logout from Firebase Auth and Capacitor GoogleAuth
 */
export async function logoutFirebase() {
  try {
    await auth.signOut();
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
  } catch (e) {
    console.warn('Logout Firebase error:', e);
  }
}

/**
 * Sign in with Google Firebase Auth
 */
export async function loginWithGoogleFirebase() {
  try {
    let user;
    if (Capacitor.isNativePlatform()) {
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      const result = await signInWithCredential(auth, credential);
      user = result.user;
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      user = result.user;
    }
    
    const email = user.email || '';
    let alias = user.displayName || email.split('@')[0] || 'Usuario Google';
    let phone = user.phoneNumber || '';
    let avatar = user.photoURL || '';

    // Register in Firestore DB (initial or update if already there)
    await registerUserInFirebase(email, alias, phone);

    // Check if user has custom alias, phone, or avatar in users collection overriding defaults
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      alias = docSnap.data().alias || alias;
      phone = docSnap.data().phone || phone;
      avatar = docSnap.data().avatar || avatar;
    }

    // Try restoring state from Firestore
    const backupData = await restoreStateFromFirebase(email);

    return {
      user: { email, alias, phone, avatar },
      backupData,
      token: await user.getIdToken()
    };
  } catch (error) {
    console.error('Google Auth Error:', error);
    throw error;
  }
}

/**
 * Recovers data by stripping any 'undefined' property to avoid crashing setDoc() in Firestore
 */
export function cleanFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item));
  }
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = cleanFirestoreData(value);
      }
    }
    return clean;
  }
  return obj;
}

/**
 * Register or update user in Firestore
 */
export async function registerUserInFirebase(email: string, alias: string, phone: string = '') {
  try {
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: email.toLowerCase().trim(),
        alias,
        alias_lower: alias.toLowerCase().trim(),
        phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { isNew: true, data: { email, alias, phone } };
    } else {
      await setDoc(userRef, {
        alias,
        alias_lower: alias.toLowerCase().trim(),
        phone,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { isNew: false, data: userSnap.data() };
    }
  } catch (error) {
    console.error('Firebase registerUser error:', error);
    throw error;
  }
}

/**
 * Request account deletion with 7 days grace period
 */
export async function requestAccountDeletion(email: string) {
  try {
    if (!email) return;
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    await setDoc(userRef, {
      deletionRequestedAt: new Date().toISOString(),
      deletionScheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    }, { merge: true });
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    throw error;
  }
}

/**
 * Check if user account is pending deletion or if 7-day grace period expired
 */
export async function checkAccountDeletionStatus(email: string) {
  try {
    if (!email) return null;
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    
    const data = userSnap.data();
    if (data.deletionScheduledFor) {
      const scheduledTime = new Date(data.deletionScheduledFor).getTime();
      const now = Date.now();
      const remainingMs = scheduledTime - now;
      if (remainingMs > 0) {
        const remainingDays = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
        return {
          isPendingDeletion: true,
          remainingDays,
          scheduledFor: data.deletionScheduledFor,
          requestedAt: data.deletionRequestedAt,
        };
      } else {
        // Grace period expired! Permanently delete data
        await permanentlyDeleteUserAccount(email);
        return { isExpiredDeletion: true };
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'Error checking deletion status:');
    return null;
  }
}

/**
 * Cancel pending account deletion (restore account)
 */
export async function cancelAccountDeletion(email: string) {
  try {
    if (!email) return;
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    await setDoc(userRef, {
      deletionRequestedAt: null,
      deletionScheduledFor: null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error canceling account deletion:', error);
    throw error;
  }
}

/**
 * Permanently delete user account and backup from Firestore
 */
export async function permanentlyDeleteUserAccount(email: string) {
  try {
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim();
    await deleteDoc(doc(db, 'users', cleanEmail));
    await deleteDoc(doc(db, 'backups', cleanEmail));
  } catch (error) {
    console.error('Error permanently deleting account:', error);
  }
}

/**
 * Save full app backup state to Firebase Firestore
 */
export async function backupStateToFirebase(email: string, appState: any) {
  try {
    if (!email || isQuotaCurrentlyBlocked()) return;
    
    const cleanPayload = cleanFirestoreData(appState);
    if (!cleanPayload.lastUpdatedAt) {
      cleanPayload.lastUpdatedAt = Date.now();
    }
    const cleanEmail = email.toLowerCase().trim();
    
    // Main synced document (Cloud Sync)
    const backupRef = doc(db, 'backups', cleanEmail);
    await setDoc(backupRef, {
      userEmail: cleanEmail,
      dataPayload: cleanPayload,
      updatedAt: new Date().toISOString(),
      lastUpdatedAt: cleanPayload.lastUpdatedAt,
    });
    
    // Weekly Monday Backup
    const today = new Date();
    if (today.getDay() === 1) { // 1 = Monday
       const mondayDate = today.toISOString().split('T')[0];
       const weeklyRef = doc(db, 'backups_weekly', `${cleanEmail}_${mondayDate}`);
       await setDoc(weeklyRef, {
         userEmail: cleanEmail,
         dataPayload: cleanPayload,
         backupDate: mondayDate,
         updatedAt: new Date().toISOString(),
       });
    }
    
  } catch (error) {
    handleFirestoreError(error, 'Firebase backupState error:');
  }
}

/**
 * Check if the user has any data in our main Firestore subcollections
 */
async function hasFirestoreSubcollectionsData(email: string): Promise<boolean> {
  try {
    const debtsRef = collection(db, 'users', email.toLowerCase().trim(), 'debts');
    const dSnap = await getDocs(debtsRef);
    if (!dSnap.empty) return true;

    const incomesRef = collection(db, 'users', email.toLowerCase().trim(), 'incomes');
    const iSnap = await getDocs(incomesRef);
    if (!iSnap.empty) return true;

    const expensesRef = collection(db, 'users', email.toLowerCase().trim(), 'expenses');
    const eSnap = await getDocs(expensesRef);
    if (!eSnap.empty) return true;

    const savingsRef = collection(db, 'users', email.toLowerCase().trim(), 'savings');
    const sSnap = await getDocs(savingsRef);
    if (!sSnap.empty) return true;

    const uniqueRef = collection(db, 'users', email.toLowerCase().trim(), 'unique_transactions');
    const uSnap = await getDocs(uniqueRef);
    if (!uSnap.empty) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Merge loaded Firestore collections (debts, incomes, expenses) into the payload
 */
async function mergeFirestoreCollectionsIntoPayload(email: string, payload: any) {
  if (!payload) return payload;
  if (!payload.profiles) payload.profiles = {};

  try {
    const firestoreGroupedData = await loadDebtsAndCuotasFromFirestore(email);
    const firestoreIncomesData = await loadIncomesAndOverridesFromFirestore(email);
    const firestoreExpensesData = await loadExpensesAndOverridesFromFirestore(email);
    const firestoreSavingsData = await loadSavingsFromFirestore(email);
    const firestoreUniqueData = await loadUniqueTransactionsFromFirestore(email);

    const allProfileNames = new Set([
      ...Object.keys(firestoreGroupedData),
      ...Object.keys(firestoreIncomesData),
      ...Object.keys(firestoreExpensesData),
      ...Object.keys(firestoreSavingsData),
      ...Object.keys(firestoreUniqueData)
    ]);

    allProfileNames.forEach(pName => {
      if (!payload.profiles[pName]) {
        payload.profiles[pName] = {
          settings: {
            planStart: new Date().toISOString().slice(0, 10),
            planEnd: new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10),
            minBalance: 50,
            delayDays: 7,
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
          savings: { current: 0, digital: 0 }
        };
      }

      // Merge Debts
      if (firestoreGroupedData[pName]) {
        payload.profiles[pName].debts = firestoreGroupedData[pName].debts;
      }

      // Merge Incomes (Recurring + Unique)
      const recIncomes = firestoreIncomesData[pName]?.incomes || [];
      const uniqIncomes = firestoreUniqueData[pName]?.incomes || [];
      payload.profiles[pName].incomes = [...recIncomes, ...uniqIncomes];

      // Merge Expenses (Recurring + Unique)
      const recExpenses = firestoreExpensesData[pName]?.expenses || [];
      const uniqExpenses = firestoreUniqueData[pName]?.expenses || [];
      payload.profiles[pName].expenses = [...recExpenses, ...uniqExpenses];

      // Merge Savings
      if (firestoreSavingsData[pName]) {
        payload.profiles[pName].savingsList = firestoreSavingsData[pName].savingsList;
      } else {
        payload.profiles[pName].savingsList = [];
      }

      // Merge Overrides
      const mergedOverrides: Record<string, any> = {};
      Object.entries(payload.profiles[pName].overrides || {}).forEach(([key, val]) => {
        const { type } = parseOverrideKey(key);
        if (!type && !key.startsWith('debt_') && !key.startsWith('income_') && !key.startsWith('expense_')) {
          mergedOverrides[key] = val;
        }
        // Always preserve system/synthetic overrides (such as required_starting_fund and rescates)
        if (key.startsWith('income_required_starting_fund_') || key.startsWith('rescate_ahorros_')) {
          mergedOverrides[key] = val;
        }
      });

      if (firestoreGroupedData[pName]) {
        Object.entries(firestoreGroupedData[pName].overrides).forEach(([key, val]) => {
          mergedOverrides[key] = val;
        });
      }

      if (firestoreIncomesData[pName]) {
        Object.entries(firestoreIncomesData[pName].overrides).forEach(([key, val]) => {
          mergedOverrides[key] = val;
        });
      }

      if (firestoreExpensesData[pName]) {
        Object.entries(firestoreExpensesData[pName].overrides).forEach(([key, val]) => {
          mergedOverrides[key] = val;
        });
      }

      payload.profiles[pName].overrides = mergedOverrides;
    });
  } catch (e) {
    console.error('Error merging Firestore collections into payload:', e);
  }
  return payload;
}

/**
 * Restore full app backup state from Firebase Firestore
 */
export async function restoreStateFromFirebase(email: string) {
  try {
    if (!email) return null;
    const backupRef = doc(db, 'backups', email.toLowerCase().trim());
    const snap = await getDoc(backupRef);
    const snapData = snap.exists() ? snap.data() : null;
    let payload = snapData?.dataPayload;
    const docTime = snapData?.lastUpdatedAt || (snapData?.updatedAt ? new Date(snapData.updatedAt).getTime() : 0);
    
    if (!payload && (await hasFirestoreSubcollectionsData(email))) {
      payload = {
        currentProfile: 'Personal',
        profiles: {}
      };
    }

    if (payload) {
      payload = await mergeFirestoreCollectionsIntoPayload(email, payload);
      if (!payload.lastUpdatedAt || payload.lastUpdatedAt < docTime) {
        payload.lastUpdatedAt = docTime;
      }
    }
    return payload || null;
  } catch (error) {
    handleFirestoreError(error, 'Firebase restoreState error:');
    return null;
  }
}


export function subscribeToFirebaseState(email: string, onUpdate: (data: any, exists: boolean) => void) {
  if (!email) return () => {};

  const cleanEmail = email.toLowerCase().trim();
  const backupRef = doc(db, 'backups', cleanEmail);
  const debtsRef = collection(db, 'users', cleanEmail, 'debts');
  const incomesRef = collection(db, 'users', cleanEmail, 'incomes');
  const expensesRef = collection(db, 'users', cleanEmail, 'expenses');
  const savingsRef = collection(db, 'users', cleanEmail, 'savings');
  const uniqueTransactionsRef = collection(db, 'users', cleanEmail, 'unique_transactions');

  let currentBackupPayload: any = null;
  let isUpdating = false;

  const triggerUpdate = async () => {
    if (isUpdating) return;
    isUpdating = true;
    try {
      let payload = currentBackupPayload;
      const hasData = await hasFirestoreSubcollectionsData(cleanEmail);
      if (!payload && hasData) {
        payload = {
          currentProfile: 'Personal',
          profiles: {}
        };
      }
      if (payload) {
        payload = await mergeFirestoreCollectionsIntoPayload(cleanEmail, payload);
        onUpdate(payload, true);
      } else {
        onUpdate(null, false);
      }
    } catch (e) {
      handleFirestoreError(e, 'Subscription reload error:');
    } finally {
      isUpdating = false;
    }
  };

  const onErr = (err: any) => {
    handleFirestoreError(err, 'Snapshot listener error:');
  };

  const unsubBackup = onSnapshot(backupRef, (docSnap) => {
    if (docSnap.exists()) {
      currentBackupPayload = docSnap.data()?.dataPayload || null;
    } else {
      currentBackupPayload = null;
    }
    triggerUpdate();
  }, onErr);

  const unsubDebts = onSnapshot(debtsRef, () => {
    triggerUpdate();
  }, onErr);

  const unsubIncomes = onSnapshot(incomesRef, () => {
    triggerUpdate();
  }, onErr);

  const unsubExpenses = onSnapshot(expensesRef, () => {
    triggerUpdate();
  }, onErr);

  const unsubSavings = onSnapshot(savingsRef, () => {
    triggerUpdate();
  }, onErr);

  const unsubUnique = onSnapshot(uniqueTransactionsRef, () => {
    triggerUpdate();
  }, onErr);

  return () => {
    unsubBackup();
    unsubDebts();
    unsubIncomes();
    unsubExpenses();
    unsubSavings();
    unsubUnique();
  };
}

export async function saveManualBackup(email: string, appState: any, label?: string, isScheduled: boolean = false) {
  try {
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim();
    const historyRef = collection(db, 'backups', cleanEmail, 'history');
    
    // Add new backup
    const timestampNum = Date.now();
    const timestampStr = timestampNum.toString();
    const newBackupRef = doc(historyRef, timestampStr);
    const cleanPayload = cleanFirestoreData(appState);
    
    const formattedLabel = label || (isScheduled 
      ? `Respaldo Programado (${new Date().toLocaleString('es-ES')})` 
      : `Respaldo Manual (${new Date().toLocaleString('es-ES')})`);

    await setDoc(newBackupRef, {
      id: timestampStr,
      label: formattedLabel,
      userEmail: cleanEmail,
      dataPayload: cleanPayload,
      updatedAt: new Date().toISOString(),
      timestamp: timestampNum,
      isLocked: false,
      isScheduled: Boolean(isScheduled),
    });

    // Fetch all backups to enforce limit of 4
    const snapshot = await getDocs(historyRef);
    const allBackups = snapshot.docs.map(d => ({ ref: d.ref, data: d.data() }));

    // Sort by timestamp desc
    allBackups.sort((a, b) => (b.data.timestamp || 0) - (a.data.timestamp || 0));

    // If total count exceeds 4, delete oldest unlocked ones
    if (allBackups.length > 4) {
      const excess = allBackups.length - 4;
      // Get unlocked items sorted oldest first (smallest timestamp)
      const unlockedCandidates = allBackups
        .filter(b => !b.data.isLocked)
        .sort((a, b) => (a.data.timestamp || 0) - (b.data.timestamp || 0));

      const itemsToDelete = unlockedCandidates.slice(0, excess);
      for (const item of itemsToDelete) {
        await deleteDoc(item.ref);
      }
    }
  } catch (error) {
    console.error('saveManualBackup error:', error);
    throw error;
  }
}

export async function deleteManualBackup(email: string, backupId: string) {
  try {
    if (!email || !backupId) return;
    const cleanEmail = email.toLowerCase().trim();
    const backupDocRef = doc(db, 'backups', cleanEmail, 'history', backupId);
    await deleteDoc(backupDocRef);
  } catch (error) {
    console.error('deleteManualBackup error:', error);
    throw error;
  }
}

export async function toggleLockManualBackup(email: string, backupId: string, currentIsLocked: boolean) {
  try {
    if (!email || !backupId) return false;
    const cleanEmail = email.toLowerCase().trim();
    const backupDocRef = doc(db, 'backups', cleanEmail, 'history', backupId);
    const nextLocked = !currentIsLocked;
    await setDoc(backupDocRef, { isLocked: nextLocked }, { merge: true });
    return nextLocked;
  } catch (error) {
    console.error('toggleLockManualBackup error:', error);
    throw error;
  }
}

export async function getManualBackups(email: string) {
  try {
    if (!email) return [];
    const cleanEmail = email.toLowerCase().trim();
    const historyRef = collection(db, 'backups', cleanEmail, 'history');
    
    let historyDocs: any[] = [];
    try {
      const q = query(historyRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      historyDocs = snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.warn('Fallback history query without orderBy:', e);
      const snapshot = await getDocs(historyRef);
      historyDocs = snapshot.docs.map(doc => doc.data());
      historyDocs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    let list: any[] = [...historyDocs];

    // If history is empty, check primary document backup
    if (list.length === 0) {
      const primaryRef = doc(db, 'backups', cleanEmail);
      const primarySnap = await getDoc(primaryRef);

      if (primarySnap.exists()) {
        const data = primarySnap.data();
        if (data && data.dataPayload) {
          const primaryTimestamp = data.updatedAt || new Date().toISOString();
          const primaryEntry = {
            id: 'primary',
            label: `Respaldo Principal Sincronizado (${new Date(primaryTimestamp).toLocaleString('es-ES')})`,
            timestamp: primaryTimestamp,
            dataPayload: data.dataPayload,
            isLocked: false,
          };
          list.unshift(primaryEntry);
        }
      }
    }

    return list;
  } catch (error) {
    console.error('getManualBackups error:', error);
    try {
      const backup = await restoreStateFromFirebase(email);
      if (backup) {
        return [{
          id: 'emergency_backup',
          label: `Respaldo de Emergencia Firebase (${new Date().toLocaleString('es-ES')})`,
          timestamp: new Date().toISOString(),
          dataPayload: backup,
          isLocked: false
        }];
      }
    } catch (e) {
      console.error('Fallback restore error:', e);
    }
    return [];
  }
}

export async function loginWithEmailFirebase(email: string, password: string): Promise<{ user: any, token: string, backupData: any }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    const token = await fbUser.getIdToken();
    
    // Check if user exists in our db
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    const docSnap = await getDoc(userRef);
    let alias = fbUser.displayName || email.split('@')[0];
    let phone = '';
    let avatar = fbUser.photoURL || '';
    
    if (docSnap.exists()) {
      alias = docSnap.data().alias || alias;
      phone = docSnap.data().phone || phone;
      avatar = docSnap.data().avatar || avatar;
    }
    
    const backupData = await restoreStateFromFirebase(email);
    
    return {
      user: {
        email: fbUser.email || email,
        alias,
        phone,
        avatar,
      },
      token,
      backupData
    };
  } catch (error: any) {
    console.error('Firebase Email Login Error:', error);
    throw error;
  }
}

export async function registerWithEmailFirebase(email: string, password: string, alias: string): Promise<{ user: any, token: string, backupData: any }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    const token = await fbUser.getIdToken();
    
    // Save to users collection (merge prevents overwriting existing data)
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    await setDoc(userRef, {
      email: email.toLowerCase().trim(),
      alias,
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    const backupData = await restoreStateFromFirebase(email);
    
    return {
      user: {
        email: fbUser.email || email,
        alias,
        avatar: fbUser.photoURL || '',
        phone: '',
      },
      token,
      backupData
    };
  } catch (error: any) {
    console.error('Firebase Email Register Error:', error);
    throw error;
  }
}

export async function getUserProfileByEmail(email: string) {
  try {
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function updateUserAvatar(email: string, avatarDataUrl: string | null) {
  try {
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    await setDoc(userRef, { avatar: avatarDataUrl }, { merge: true });
  } catch (e) {
    console.error(e);
  }
}

/**
 * Saves all user profile fields (alias, phone, avatar, and payment methods/accounts) directly to the /users/{email} document in Firestore
 */
export async function saveUserProfileToFirestore(
  email: string, 
  alias: string, 
  phone: string, 
  avatar: string | null, 
  paymentMethods: any[]
) {
  try {
    if (!email) return;
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    await setDoc(userRef, cleanFirestoreData({
      alias,
      alias_lower: alias.toLowerCase().trim(),
      phone,
      avatar: avatar || null,
      paymentMethods: paymentMethods || [],
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'Error saving user profile to Firestore users collection:');
  }
}

/**
 * Load all debts and their subcollection of cuotas from Firestore grouped by profile name
 */
export async function loadDebtsAndCuotasFromFirestore(email: string): Promise<Record<string, { debts: any[], overrides: Record<string, any> }>> {
  const data: Record<string, { debts: any[], overrides: Record<string, any> }> = {};
  try {
    if (!email) return data;
    const debtsRef = collection(db, 'users', email.toLowerCase().trim(), 'debts');
    const debtsSnap = await getDocs(debtsRef);

    for (const debtDoc of debtsSnap.docs) {
      const debtData = debtDoc.data();
      const pName = debtData.profileName || 'Personal';
      
      if (!data[pName]) {
        data[pName] = { debts: [], overrides: {} };
      }
      
      const { profileName, ...cleanDebt } = debtData;
      data[pName].debts.push(cleanDebt);

      // Fetch its cuotas
      const cuotasRef = collection(db, 'users', email.toLowerCase().trim(), 'debts', debtDoc.id, 'cuotas');
      const cuotasSnap = await getDocs(cuotasRef);
      cuotasSnap.forEach(cuotaDoc => {
        const cuotaData = cuotaDoc.data();
        let cuotaKey = cuotaData.key;
        if (!cuotaKey) {
          if (cuotaDoc.id.startsWith('cuota_')) {
            const idx = cuotaDoc.id.split('_').pop();
            cuotaKey = `${cleanDebt.id}_${idx}`;
          } else {
            cuotaKey = cuotaDoc.id;
          }
        }
        // Normalize: done is single source of truth for payment status
        const isDone = Boolean(cuotaData.done);
        const hasPayment = isDone || (cuotaData.paidAmount && parseFloat(String(cuotaData.paidAmount)) > 0) || (cuotaData.partials && cuotaData.partials.length > 0);
        const hasCustom = cuotaData.userPostponed || cuotaData.discarded || Boolean(cuotaData.actualDate && cuotaData.actualDate !== cuotaData.originalDate) || Boolean(cuotaData.incomeId) || cuotaData.noAffectBalance !== undefined || cuotaData.amt !== undefined;

        if (hasPayment || hasCustom) {
          data[pName].overrides[cuotaKey] = {
            ...cuotaData,
            done: isDone
          };
        }
      });
    }

    return data;
  } catch (error) {
    handleFirestoreError(error, 'Error loading debts and cuotas from Firestore:');
    return data;
  }
}

export function sanitizeDocId(name: string, fallbackId: string): string {
  if (!name) return fallbackId;
  const cleanName = name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[\✓\√\✔\✅]+/g, '')
    .trim();
  const target = cleanName || name;
  return target
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
    .trim()
    .replace(/[^a-z0-9]+/g, '_') // replace spaces and special chars with underscores
    .replace(/^_+|_+$/g, '');   // trim leading/trailing underscores
}

/**
 * Save all calculated cuotas of a debt to Firestore so they are visible as subcollections
 */
export async function saveCalculatedCuotasToFirestore(
  email: string, 
  debt: any, 
  overrides: Record<string, any> = {},
  customDebts: any[] = [],
  exchangeRates?: Record<string, number>
) {
  try {
    if (!email || !debt || !debt.id || isQuotaCurrentlyBlocked()) return;
    const docId = sanitizeDocId(debt.name, debt.id);
    const cleanEmail = email.toLowerCase().trim();
    
    // Calculate the complete amortization plan using current overrides
    const cuotas = calculateAmortizationPlan(debt, overrides, customDebts, undefined, exchangeRates);
    
    for (const cuota of cuotas) {
      const ov = overrides[cuota.key] || overrides[`${debt.id}_${cuota.index}`] || {};
      const ovHasPayment = ov.done === true || (ov.amt !== undefined && parseFloat(String(ov.amt)) > 0) || (ov.paidAmount !== undefined && parseFloat(String(ov.paidAmount)) > 0) || (ov.partials && ov.partials.length > 0) || ov.actualDate !== undefined || ov.noAffectBalance !== undefined || cuota.isPaid === true;

      // Only write cuotas that have active user overrides or payments to avoid sweeping dozens of unmodified default cuotas
      if (!ovHasPayment && !ov.done) continue;

      const cuotaDbId = cuota.key || `${debt.id}_${cuota.index}`;
      const cuotaDocRef = doc(db, 'users', cleanEmail, 'debts', docId, 'cuotas', cuotaDbId);
      
      const isDone = Boolean(ov.done ?? cuota.isPaid);
      const paidAmt = ov.amt !== undefined ? parseFloat(String(ov.amt)) : (ov.paidAmount !== undefined ? parseFloat(String(ov.paidAmount)) : cuota.paidAmount);

      const cuotaPayload: any = {
        index: cuota.index,
        date: ov.actualDate || cuota.date,
        originalDate: ov.actualDate || cuota.date,
        key: cuota.key,
        expectedAmount: cuota.expectedAmount,
        requiredPay: isDone ? 0 : cuota.requiredPay,
        done: isDone, // single source of truth
        paidAmount: isDone ? paidAmt : 0,
        paidCurrency: ov.payCurrency || cuota.paidCurrency || debt.currency || 'USD',
        updatedAt: new Date().toISOString()
      };

      if (ov.actualDate) cuotaPayload.actualDate = ov.actualDate;
      if (ov.partials) cuotaPayload.partials = ov.partials;
      if (ov.rawPayAmount) cuotaPayload.rawPayAmount = ov.rawPayAmount;
      if (ov.incomeId !== undefined) cuotaPayload.incomeId = ov.incomeId;
      if (ov.noAffectBalance !== undefined) cuotaPayload.noAffectBalance = ov.noAffectBalance;
      if (ov.amt !== undefined) cuotaPayload.amt = ov.amt;
      if (ov.payCurrency) cuotaPayload.payCurrency = ov.payCurrency;

      await setDoc(cuotaDocRef, cleanFirestoreData(cuotaPayload), { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, 'Error saving calculated cuotas to Firestore:');
  }
}

/**
 * Save a single debt to Firestore with profile name association
 */
export async function saveDebtToFirestore(
  email: string, 
  debt: any, 
  profileName: string,
  overrides: Record<string, any> = {},
  customDebts: any[] = [],
  exchangeRates?: Record<string, number>
) {
  try {
    if (!email || !debt || !debt.id || isQuotaCurrentlyBlocked()) return;
    const docId = sanitizeDocId(debt.name, debt.id);
    const cleanEmail = email.toLowerCase().trim();
    const debtDocRef = doc(db, 'users', cleanEmail, 'debts', docId);

    // Check all cuotas status from overrides:
    // "Parent Debt Status Logic: Ensure a parent debt reflects paid: false if any child quota is done: false."
    const cuotas = calculateAmortizationPlan(debt, overrides, customDebts, undefined, exchangeRates);
    const anyChildUnpaid = cuotas.some(c => !c.isPaid);
    const isDone = cuotas.length > 0 ? !anyChildUnpaid : Boolean(debt.done);

    await setDoc(debtDocRef, cleanFirestoreData({
      ...debt,
      done: isDone,
      profileName,
      updatedAt: new Date().toISOString()
    }));
    // Write out all calculated amortization installments (cuotas) as subcollection documents
    await saveCalculatedCuotasToFirestore(email, debt, overrides, customDebts, exchangeRates);
  } catch (error) {
    handleFirestoreError(error, 'Error saving debt to Firestore:');
  }
}

/**
 * Delete a single debt and its subcollection cuotas from Firestore
 */
export async function deleteDebtFromFirestore(email: string, debtId: string, debtName?: string) {
  try {
    if (!email || !debtId || isQuotaCurrentlyBlocked()) return;
    const docId = debtName ? sanitizeDocId(debtName, debtId) : debtId;
    const debtDocRef = doc(db, 'users', email.toLowerCase().trim(), 'debts', docId);
    await deleteDoc(debtDocRef);
    
    // Delete subcollection cuotas
    const cuotasRef = collection(db, 'users', email.toLowerCase().trim(), 'debts', docId, 'cuotas');
    const cuotasSnap = await getDocs(cuotasRef);
    for (const d of cuotasSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (error) {
    handleFirestoreError(error, 'Error deleting debt from Firestore:');
  }
}

/**
 * Save a single cuota override to Firestore
 */
export async function saveCuotaToFirestore(email: string, debtId: string, cuotaKey: string, cuotaData: any, debtName?: string) {
  try {
    if (!email || !debtId || !cuotaKey || isQuotaCurrentlyBlocked()) return;
    const docId = debtName ? sanitizeDocId(debtName, debtId) : sanitizeDocId(debtId, debtId);
    const cleanEmail = email.toLowerCase().trim();
    const dbDocId = cuotaKey;

    const isDone = Boolean(cuotaData.done);
    const mergedData = { 
      ...cuotaData,
      done: isDone,
      key: cuotaKey,
      updatedAt: new Date().toISOString()
    };

    const cuotaDocRef = doc(db, 'users', cleanEmail, 'debts', docId, 'cuotas', dbDocId);
    await setDoc(cuotaDocRef, cleanFirestoreData(mergedData), { merge: true });

    // Update parent debt status efficiently: if this cuota is not done, parent debt is not done
    const debtDocRef = doc(db, 'users', cleanEmail, 'debts', docId);
    if (!isDone) {
      await setDoc(debtDocRef, {
        done: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, 'Error saving cuota to Firestore:');
  }
}

/**
 * Delete a single cuota override from Firestore
 */
export async function deleteCuotaFromFirestore(email: string, debtId: string, cuotaKey: string, debtName?: string) {
  try {
    if (!email || !debtId || !cuotaKey || isQuotaCurrentlyBlocked()) return;
    const docId = debtName ? sanitizeDocId(debtName, debtId) : debtId;
    
    const dbDocId = cuotaKey;

    const cuotaDocRef = doc(db, 'users', email.toLowerCase().trim(), 'debts', docId, 'cuotas', dbDocId);
    await deleteDoc(cuotaDocRef);
  } catch (error) {
    handleFirestoreError(error, 'Error deleting cuota from Firestore:');
  }
}

/**
 * Load all incomes and their subcollection of overrides from Firestore grouped by profile name
 */
export async function loadIncomesAndOverridesFromFirestore(email: string): Promise<Record<string, { incomes: any[], overrides: Record<string, any> }>> {
  const data: Record<string, { incomes: any[], overrides: Record<string, any> }> = {};
  try {
    if (!email) return data;
    const incomesRef = collection(db, 'users', email.toLowerCase().trim(), 'incomes');
    const incomesSnap = await getDocs(incomesRef);

    for (const incDoc of incomesSnap.docs) {
      const incData = incDoc.data();
      const pName = incData.profileName || 'Personal';
      
      if (!data[pName]) {
        data[pName] = { incomes: [], overrides: {} };
      }
      
      if (!incData.isSynthetic) {
        const { profileName, ...cleanInc } = incData;
        data[pName].incomes.push(cleanInc);
      }

      // Fetch its overrides
      const overridesRef = collection(db, 'users', email.toLowerCase().trim(), 'incomes', incDoc.id, 'overrides');
      const overridesSnap = await getDocs(overridesRef);
      overridesSnap.forEach(ovDoc => {
        data[pName].overrides[ovDoc.id] = ovDoc.data();
      });
    }

    return data;
  } catch (error) {
    handleFirestoreError(error, 'Error loading incomes and overrides from Firestore:');
    return data;
  }
}

/**
 * Save a single income to Firestore. One-time transactions go to 'unique_transactions' while recurring go to 'incomes'.
 */
export async function saveIncomeToFirestore(email: string, income: any, profileName: string) {
  try {
    if (!email || !income || !income.id || isQuotaCurrentlyBlocked()) return;
    const docId = sanitizeDocId(income.name, income.id);
    const cleanEmail = email.toLowerCase().trim();

    if (income.freq === 'one-time') {
      // Save to unique_transactions
      const utDocRef = doc(db, 'users', cleanEmail, 'unique_transactions', docId);
      await setDoc(utDocRef, cleanFirestoreData({
        ...income,
        realType: 'income',
        profileName,
        updatedAt: new Date().toISOString()
      }));
      // Delete from recurring incomes just in case it changed
      const incomeDocRef = doc(db, 'users', cleanEmail, 'incomes', docId);
      await deleteDoc(incomeDocRef);
    } else {
      // Save to recurring incomes
      const incomeDocRef = doc(db, 'users', cleanEmail, 'incomes', docId);
      await setDoc(incomeDocRef, cleanFirestoreData({
        ...income,
        profileName,
        updatedAt: new Date().toISOString()
      }));
      // Delete from unique_transactions just in case it changed
      const utDocRef = doc(db, 'users', cleanEmail, 'unique_transactions', docId);
      await deleteDoc(utDocRef);
    }
  } catch (error) {
    handleFirestoreError(error, 'Error saving income to Firestore:');
  }
}

/**
 * Delete a single income and its overrides/unique logs from Firestore
 */
export async function deleteIncomeFromFirestore(email: string, incomeId: string, incomeName?: string) {
  try {
    if (!email || !incomeId || isQuotaCurrentlyBlocked()) return;
    const docId = incomeName ? sanitizeDocId(incomeName, incomeId) : incomeId;
    const cleanEmail = email.toLowerCase().trim();

    const incomeDocRef = doc(db, 'users', cleanEmail, 'incomes', docId);
    await deleteDoc(incomeDocRef);

    const utDocRef = doc(db, 'users', cleanEmail, 'unique_transactions', docId);
    await deleteDoc(utDocRef);

    // Delete overrides
    const overridesRef = collection(db, 'users', cleanEmail, 'incomes', docId, 'overrides');
    const overridesSnap = await getDocs(overridesRef);
    for (const d of overridesSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (error) {
    handleFirestoreError(error, 'Error deleting income from Firestore:');
  }
}

/**
 * Save a single income override to Firestore
 */
export async function saveIncomeOverrideToFirestore(email: string, incomeId: string, overrideKey: string, overrideData: any, incomeName?: string) {
  try {
    if (!email || !incomeId || !overrideKey || isQuotaCurrentlyBlocked()) return;
    const cleanEmail = email.toLowerCase().trim();
    const docId = incomeName ? sanitizeDocId(incomeName, incomeId) : incomeId;

    // Ensure parent document exists if synthetic (like required_starting_fund)
    if (incomeId === 'required_starting_fund' || overrideKey.startsWith('income_required_starting_fund_')) {
      const parentDocRef = doc(db, 'users', cleanEmail, 'incomes', 'required_starting_fund');
      await setDoc(parentDocRef, {
        id: 'required_starting_fund',
        name: 'Fondo Requerido para Iniciar',
        isSynthetic: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    const overrideDocRef = doc(db, 'users', cleanEmail, 'incomes', docId, 'overrides', overrideKey);
    await setDoc(overrideDocRef, cleanFirestoreData({
      ...overrideData,
      key: overrideKey,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, 'Error saving income override to Firestore:');
  }
}

/**
 * Delete a single income override from Firestore
 */
export async function deleteIncomeOverrideFromFirestore(email: string, incomeId: string, overrideKey: string, incomeName?: string) {
  try {
    if (!email || !incomeId || !overrideKey || isQuotaCurrentlyBlocked()) return;
    const docId = incomeName ? sanitizeDocId(incomeName, incomeId) : incomeId;
    const overrideDocRef = doc(db, 'users', email.toLowerCase().trim(), 'incomes', docId, 'overrides', overrideKey);
    await deleteDoc(overrideDocRef);
  } catch (error) {
    handleFirestoreError(error, 'Error deleting income override from Firestore:');
  }
}

/**
 * Load all expenses and their subcollection of overrides from Firestore grouped by profile name
 */
export async function loadExpensesAndOverridesFromFirestore(email: string): Promise<Record<string, { expenses: any[], overrides: Record<string, any> }>> {
  const data: Record<string, { expenses: any[], overrides: Record<string, any> }> = {};
  try {
    if (!email) return data;
    const expensesRef = collection(db, 'users', email.toLowerCase().trim(), 'expenses');
    const expensesSnap = await getDocs(expensesRef);

    for (const expDoc of expensesSnap.docs) {
      const expData = expDoc.data();
      const pName = expData.profileName || 'Personal';
      
      if (!data[pName]) {
        data[pName] = { expenses: [], overrides: {} };
      }
      
      const { profileName, ...cleanExp } = expData;
      data[pName].expenses.push(cleanExp);

      // Fetch its overrides
      const overridesRef = collection(db, 'users', email.toLowerCase().trim(), 'expenses', expDoc.id, 'overrides');
      const overridesSnap = await getDocs(overridesRef);
      overridesSnap.forEach(ovDoc => {
        data[pName].overrides[ovDoc.id] = ovDoc.data();
      });
    }

    return data;
  } catch (error) {
    handleFirestoreError(error, 'Error loading expenses and overrides from Firestore:');
    return data;
  }
}

/**
 * Save a single expense to Firestore. One-time transactions go to 'unique_transactions' while recurring go to 'expenses'.
 */
export async function saveExpenseToFirestore(email: string, expense: any, profileName: string) {
  try {
    if (!email || !expense || !expense.id || isQuotaCurrentlyBlocked()) return;
    const docId = sanitizeDocId(expense.name, expense.id);
    const cleanEmail = email.toLowerCase().trim();

    if (expense.freq === 'one-time') {
      // Save to unique_transactions
      const utDocRef = doc(db, 'users', cleanEmail, 'unique_transactions', docId);
      await setDoc(utDocRef, cleanFirestoreData({
        ...expense,
        realType: 'expense',
        profileName,
        updatedAt: new Date().toISOString()
      }));
      // Delete from recurring expenses just in case it changed
      const expenseDocRef = doc(db, 'users', cleanEmail, 'expenses', docId);
      await deleteDoc(expenseDocRef);
    } else {
      // Save to recurring expenses
      const expenseDocRef = doc(db, 'users', cleanEmail, 'expenses', docId);
      await setDoc(expenseDocRef, cleanFirestoreData({
        ...expense,
        profileName,
        updatedAt: new Date().toISOString()
      }));
      // Delete from unique_transactions just in case it changed
      const utDocRef = doc(db, 'users', cleanEmail, 'unique_transactions', docId);
      await deleteDoc(utDocRef);
    }
  } catch (error) {
    handleFirestoreError(error, 'Error saving expense to Firestore:');
  }
}

/**
 * Delete a single expense and its overrides/unique logs from Firestore
 */
export async function deleteExpenseFromFirestore(email: string, expenseId: string, expenseName?: string) {
  try {
    if (!email || !expenseId || isQuotaCurrentlyBlocked()) return;
    const docId = expenseName ? sanitizeDocId(expenseName, expenseId) : expenseId;
    const cleanEmail = email.toLowerCase().trim();

    const expenseDocRef = doc(db, 'users', cleanEmail, 'expenses', docId);
    await deleteDoc(expenseDocRef);

    const utDocRef = doc(db, 'users', cleanEmail, 'unique_transactions', docId);
    await deleteDoc(utDocRef);

    // Delete overrides
    const overridesRef = collection(db, 'users', cleanEmail, 'expenses', docId, 'overrides');
    const overridesSnap = await getDocs(overridesRef);
    for (const d of overridesSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (error) {
    handleFirestoreError(error, 'Error deleting expense from Firestore:');
  }
}

/**
 * Save a single expense override to Firestore
 */
export async function saveExpenseOverrideToFirestore(email: string, expenseId: string, overrideKey: string, overrideData: any, expenseName?: string) {
  try {
    if (!email || !expenseId || !overrideKey || isQuotaCurrentlyBlocked()) return;
    const docId = expenseName ? sanitizeDocId(expenseName, expenseId) : expenseId;
    const overrideDocRef = doc(db, 'users', email.toLowerCase().trim(), 'expenses', docId, 'overrides', overrideKey);
    await setDoc(overrideDocRef, cleanFirestoreData({
      ...overrideData,
      key: overrideKey,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, 'Error saving expense override to Firestore:');
  }
}

/**
 * Delete a single expense override from Firestore
 */
export async function deleteExpenseOverrideFromFirestore(email: string, expenseId: string, overrideKey: string, expenseName?: string) {
  try {
    if (!email || !expenseId || !overrideKey || isQuotaCurrentlyBlocked()) return;
    const docId = expenseName ? sanitizeDocId(expenseName, expenseId) : expenseId;
    const overrideDocRef = doc(db, 'users', email.toLowerCase().trim(), 'expenses', docId, 'overrides', overrideKey);
    await deleteDoc(overrideDocRef);
  } catch (error) {
    handleFirestoreError(error, 'Error deleting expense override from Firestore:');
  }
}

/**
 * Save a single savings item to Firestore
 */
export async function saveSavingsToFirestore(email: string, saving: any, profileName: string) {
  try {
    if (!email || !saving || !saving.id || isQuotaCurrentlyBlocked()) return;
    const docId = sanitizeDocId(saving.person || 'saving', saving.id);
    const savingDocRef = doc(db, 'users', email.toLowerCase().trim(), 'savings', docId);
    await setDoc(savingDocRef, cleanFirestoreData({
      ...saving,
      profileName,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, 'Error saving savings item to Firestore:');
  }
}

/**
 * Delete a single savings item from Firestore
 */
export async function deleteSavingsFromFirestore(email: string, savingId: string, personName?: string) {
  try {
    if (!email || !savingId || isQuotaCurrentlyBlocked()) return;
    const docId = personName ? sanitizeDocId(personName, savingId) : savingId;
    const savingDocRef = doc(db, 'users', email.toLowerCase().trim(), 'savings', docId);
    await deleteDoc(savingDocRef);
  } catch (error) {
    handleFirestoreError(error, 'Error deleting savings item from Firestore:');
  }
}

/**
 * Load all savings (ahorros) from Firestore grouped by profile name
 */
export async function loadSavingsFromFirestore(email: string): Promise<Record<string, { savingsList: any[] }>> {
  const data: Record<string, { savingsList: any[] }> = {};
  try {
    if (!email) return data;
    const savingsRef = collection(db, 'users', email.toLowerCase().trim(), 'savings');
    const savingsSnap = await getDocs(savingsRef);

    for (const sDoc of savingsSnap.docs) {
      const sData = sDoc.data();
      const pName = sData.profileName || 'Personal';
      if (!data[pName]) {
        data[pName] = { savingsList: [] };
      }
      const { profileName, ...cleanSaving } = sData;
      data[pName].savingsList.push(cleanSaving);
    }
    return data;
  } catch (error) {
    handleFirestoreError(error, 'Error loading savings from Firestore:');
    return data;
  }
}

/**
 * Load all unique (one-time) transactions from Firestore grouped by profile name
 */
export async function loadUniqueTransactionsFromFirestore(email: string): Promise<Record<string, { incomes: any[], expenses: any[] }>> {
  const data: Record<string, { incomes: any[], expenses: any[] }> = {};
  try {
    if (!email) return data;
    const uniqueRef = collection(db, 'users', email.toLowerCase().trim(), 'unique_transactions');
    const uniqueSnap = await getDocs(uniqueRef);

    for (const uDoc of uniqueSnap.docs) {
      const uData = uDoc.data();
      const pName = uData.profileName || 'Personal';
      if (!data[pName]) {
        data[pName] = { incomes: [], expenses: [] };
      }
      const { profileName, ...cleanTx } = uData;
      if (cleanTx.realType === 'income') {
        data[pName].incomes.push(cleanTx);
      } else if (cleanTx.realType === 'expense') {
        data[pName].expenses.push(cleanTx);
      }
    }
    return data;
  } catch (error) {
    handleFirestoreError(error, 'Error loading unique transactions from Firestore:');
    return data;
  }
}

/**
 * Wipe all debts, incomes, and expenses in Firestore and upload current local state
 */
export async function forceUploadStateToFirestore(email: string, appState: any) {
  try {
    if (!email || !appState || isQuotaCurrentlyBlocked()) return;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Delete all debts and their subcollections
    const debtsRef = collection(db, 'users', cleanEmail, 'debts');
    const debtsSnap = await getDocs(debtsRef);
    for (const dDoc of debtsSnap.docs) {
      const cuotasRef = collection(db, 'users', cleanEmail, 'debts', dDoc.id, 'cuotas');
      const cuotasSnap = await getDocs(cuotasRef);
      for (const cDoc of cuotasSnap.docs) {
        await deleteDoc(cDoc.ref);
      }
      await deleteDoc(dDoc.ref);
    }

    // 2. Delete all incomes and their subcollections
    const incomesRef = collection(db, 'users', cleanEmail, 'incomes');
    const incomesSnap = await getDocs(incomesRef);
    for (const iDoc of incomesSnap.docs) {
      const overridesRef = collection(db, 'users', cleanEmail, 'incomes', iDoc.id, 'overrides');
      const overridesSnap = await getDocs(overridesRef);
      for (const oDoc of overridesSnap.docs) {
        await deleteDoc(oDoc.ref);
      }
      await deleteDoc(iDoc.ref);
    }

    // 2.5 Delete all unique transactions
    const uniqueRef = collection(db, 'users', cleanEmail, 'unique_transactions');
    const uniqueSnap = await getDocs(uniqueRef);
    for (const uDoc of uniqueSnap.docs) {
      await deleteDoc(uDoc.ref);
    }

    // 3. Delete all expenses and their subcollections
    const expensesRef = collection(db, 'users', cleanEmail, 'expenses');
    const expensesSnap = await getDocs(expensesRef);
    for (const eDoc of expensesSnap.docs) {
      const overridesRef = collection(db, 'users', cleanEmail, 'expenses', eDoc.id, 'overrides');
      const overridesSnap = await getDocs(overridesRef);
      for (const oDoc of overridesSnap.docs) {
        await deleteDoc(oDoc.ref);
      }
      await deleteDoc(eDoc.ref);
    }

    // 3.5 Delete all savings
    const savingsRef = collection(db, 'users', cleanEmail, 'savings');
    const savingsSnap = await getDocs(savingsRef);
    for (const sDoc of savingsSnap.docs) {
      await deleteDoc(sDoc.ref);
    }

    // 4. Upload from appState profiles
    const profiles = appState.profiles || {};
    for (const [profileName, profile] of Object.entries(profiles)) {
      const p = profile as any;
      if (!p) continue;

      // Debts
      if (Array.isArray(p.debts)) {
        for (const debt of p.debts) {
          await saveDebtToFirestore(cleanEmail, debt, profileName);
        }
      }

      // Incomes (will auto route to incomes or unique_transactions)
      if (Array.isArray(p.incomes)) {
        for (const income of p.incomes) {
          await saveIncomeToFirestore(cleanEmail, income, profileName);
        }
      }

      // Expenses (will auto route to expenses or unique_transactions)
      if (Array.isArray(p.expenses)) {
        for (const expense of p.expenses) {
          await saveExpenseToFirestore(cleanEmail, expense, profileName);
        }
      }

      // Savings
      if (Array.isArray(p.savingsList)) {
        for (const saving of p.savingsList) {
          await saveSavingsToFirestore(cleanEmail, saving, profileName);
        }
      }

      // Overrides/cuotas
      if (p.overrides && typeof p.overrides === 'object') {
        for (const [key, val] of Object.entries(p.overrides)) {
          const { type: overrideType, entityId } = parseOverrideKey(key);
          if (entityId) {
            if (overrideType === 'debt') {
              const parent = p.debts?.find((d: any) => d.id === entityId);
              await saveCuotaToFirestore(cleanEmail, entityId, key, val, parent?.name);
            } else if (overrideType === 'income') {
              const parent = p.incomes?.find((inc: any) => inc.id === entityId);
              await saveIncomeOverrideToFirestore(cleanEmail, entityId, key, val, parent?.name);
            } else if (overrideType === 'expense') {
              const parent = p.expenses?.find((exp: any) => exp.id === entityId);
              await saveExpenseOverrideToFirestore(cleanEmail, entityId, key, val, parent?.name);
            }
          }
        }
      }
    }

    // 5. Update the primary user profile in the users collection with active settings
    const activeProfileName = appState.currentProfile || 'Personal';
    const activeProfile = profiles[activeProfileName] || Object.values(profiles)[0] || null;
    if (activeProfile) {
      const p = activeProfile as any;
      await saveUserProfileToFirestore(
        cleanEmail,
        p.settings?.myAlias || p.settings?.alias || cleanEmail.split('@')[0],
        p.settings?.myPhone || '',
        p.avatar || null,
        p.settings?.paymentMethods || []
      );
    }

    // 6. Save primary backup payload
    await backupStateToFirebase(cleanEmail, appState);
  } catch (error) {
    handleFirestoreError(error, 'Error in forceUploadStateToFirestore:');
    throw error;
  }
}


/**
 * Publish a custom debt template to MonyStore (Firestore)
 */
export async function publishDebtTemplateToFirestore(template: any) {
  try {
    const docRef = doc(collection(db, 'market_templates'));
    await setDoc(docRef, {
      ...template,
      id: docRef.id,
      publishedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, 'Error publishing template:');
    return { success: false, error: 'Failed to publish to MonyStore' };
  }
}

/**
 * Load all custom debt templates from MonyStore (Firestore)
 */
export async function loadDebtTemplatesFromFirestore(): Promise<any[]> {
  try {
    const templatesRef = collection(db, 'market_templates');
    const q = query(templatesRef, orderBy('publishedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    handleFirestoreError(error, 'Error loading templates:');
    return [];
  }
}

/**
 * SOCIAL SYSTEM: Send a Friend Request on the MonyShared network
 */
export async function sendFriendRequest(senderEmail: string, senderAlias: string, receiverEmail: string) {
  try {
    if (isQuotaCurrentlyBlocked()) return { success: false, error: 'Quota exceeded' };
    const cleanSender = senderEmail.toLowerCase().trim();
    const cleanReceiver = receiverEmail.toLowerCase().trim();
    if (cleanSender === cleanReceiver) {
      return { success: false, error: 'No puedes enviarte una solicitud a ti mismo' };
    }

    const docId = `${cleanSender.replace(/\./g, '_')}_to_${cleanReceiver.replace(/\./g, '_')}`;
    const reqRef = doc(db, 'friend_requests', docId);
    
    await setDoc(reqRef, {
      id: docId,
      senderEmail: cleanSender,
      senderAlias,
      receiverEmail: cleanReceiver,
      status: 'pending',
      timestamp: Date.now()
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, 'Error sending friend request:');
    return { success: false, error: 'Failed to send request' };
  }
}

/**
 * SOCIAL SYSTEM: Respond to a Friend Request
 */
export async function respondFriendRequest(requestId: string, status: 'accepted' | 'rejected') {
  try {
    if (isQuotaCurrentlyBlocked()) return;
    const reqRef = doc(db, 'friend_requests', requestId);
    await updateDoc(reqRef, { status, updatedAt: Date.now() });
  } catch (error) {
    handleFirestoreError(error, 'Error responding to friend request:');
  }
}

/**
 * SOCIAL SYSTEM: Listen to all incoming and outgoing friend requests in real-time
 */
export function subscribeFriendRequests(email: string, onUpdate: (requests: any[]) => void) {
  if (!email || isQuotaCurrentlyBlocked()) return () => {};
  const cleanEmail = email.toLowerCase().trim();
  
  // Real-time query matching incoming OR outgoing requests
  const q = query(
    collection(db, 'friend_requests'),
    where('receiverEmail', '==', cleanEmail)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    onUpdate(list);
  }, (err) => {
    console.error('Error in friend requests subscription:', err);
  });
}

/**
 * SOCIAL SYSTEM: Listen to outgoing friend requests to see who accepted
 */
export function subscribeOutgoingFriendRequests(email: string, onUpdate: (requests: any[]) => void) {
  if (!email || isQuotaCurrentlyBlocked()) return () => {};
  const cleanEmail = email.toLowerCase().trim();
  
  const q = query(
    collection(db, 'friend_requests'),
    where('senderEmail', '==', cleanEmail)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    onUpdate(list);
  }, (err) => {
    console.error('Error in outgoing requests subscription:', err);
  });
}

/**
 * P2P AGREEMENT WORKFLOW: Send or update a shared P2P Loan proposal
 */
export async function saveP2PLoanToCloud(loan: any) {
  try {
    if (isQuotaCurrentlyBlocked()) return;
    const loanRef = doc(db, 'shared_loans', loan.id);
    await setDoc(loanRef, {
      ...loan,
      lastUpdated: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'Error saving P2P loan to cloud:');
  }
}

/**
 * P2P AGREEMENT WORKFLOW: Update loan status and notify peer
 */
export async function updateP2PLoanCloudStatus(loanId: string, status: string, additionalFields: any = {}) {
  try {
    if (isQuotaCurrentlyBlocked()) return;
    const loanRef = doc(db, 'shared_loans', loanId);
    await setDoc(loanRef, {
      status,
      ...additionalFields,
      lastUpdated: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'Error updating shared loan status:');
  }
}

/**
 * P2P AGREEMENT WORKFLOW: Listen to active shared loans in real-time
 */
export function subscribeSharedLoans(email: string, onUpdate: (loans: any[]) => void) {
  if (!email || isQuotaCurrentlyBlocked()) return () => {};
  const cleanEmail = email.toLowerCase().trim();

  // Listen to loans where current user is either lender or borrower
  const qLender = query(collection(db, 'shared_loans'), where('lenderEmail', '==', cleanEmail));
  const qBorrower = query(collection(db, 'shared_loans'), where('borrowerEmail', '==', cleanEmail));

  const activeLoans: Record<string, any> = {};

  const processSnap = (snap: any) => {
    snap.docs.forEach((docSnap: any) => {
      const data = docSnap.data();
      activeLoans[docSnap.id] = { ...data, id: docSnap.id };
    });
    onUpdate(Object.values(activeLoans));
  };

  const unsubLender = onSnapshot(qLender, processSnap, (err) => console.error(err));
  const unsubBorrower = onSnapshot(qBorrower, processSnap, (err) => console.error(err));

  return () => {
    unsubLender();
    unsubBorrower();
  };
}
