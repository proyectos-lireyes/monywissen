import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

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
    const alias = user.displayName || email.split('@')[0] || 'Usuario Google';
    const phone = user.phoneNumber || '';

    // Register in Firestore DB
    await registerUserInFirebase(email, alias, phone);

    // Try restoring state from Firestore
    const backupData = await restoreStateFromFirebase(email);

    return {
      user: { email, alias, phone },
      backupData,
      token: await user.getIdToken()
    };
  } catch (error) {
    console.error('Google Auth Error:', error);
    throw error;
  }
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
        deletionRequestedAt: null, // Cancel any pending deletion
        deletionScheduledFor: null,
      }, { merge: true });
      return { isNew: false, data: userSnap.data() };
    }
  } catch (error) {
    console.error('Firebase registerUser error:', error);
    throw error;
  }
}

/**
 * Request account deletion
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
 * Save full app backup state to Firebase Firestore
 */
export async function backupStateToFirebase(email: string, appState: any) {
  try {
    if (!email) return;
    const backupRef = doc(db, 'backups', email.toLowerCase().trim());
    await setDoc(backupRef, {
      userEmail: email.toLowerCase().trim(),
      dataPayload: appState,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Firebase backupState error:', error);
  }
}

/**
 * Restore full app backup state from Firebase Firestore
 */
export async function restoreStateFromFirebase(email: string) {
  try {
    if (!email) return null;
    const backupRef = doc(db, 'backups', email.toLowerCase().trim());
    const snap = await getDoc(backupRef);
    if (snap.exists()) {
      return snap.data()?.dataPayload || null;
    }
    return null;
  } catch (error) {
    console.error('Firebase restoreState error:', error);
    return null;
  }
}
