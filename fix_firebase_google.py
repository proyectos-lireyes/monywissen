import re

with open('src/utils/firebase.ts', 'r') as f:
    content = f.read()

import_str = """import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signInWithRedirect, getRedirectResult } from 'firebase/auth';"""

content = content.replace("import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';", import_str)
content = content.replace("import { Capacitor } from '@capacitor/core';\nimport { Capacitor } from '@capacitor/core';", "")

google_auth_init = """export const app = initializeApp(firebaseConfig);

if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize({
    clientId: firebaseConfig.oAuthClientId,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}
"""

content = content.replace("export const app = initializeApp(firebaseConfig);", google_auth_init)

search = """export async function loginWithGoogleFirebase() {
  if (Capacitor.isNativePlatform()) {
    throw new Error('Google Sign-In is not supported in the Android preview yet. Please use your Email and Password.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);"""

replace = """export async function loginWithGoogleFirebase() {
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
    }"""

content = content.replace(search, replace)

with open('src/utils/firebase.ts', 'w') as f:
    f.write(content)
