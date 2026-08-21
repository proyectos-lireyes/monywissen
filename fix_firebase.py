import re

with open('src/utils/firebase.ts', 'r') as f:
    content = f.read()

# Add imports for email auth
target_imports = "import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signInWithRedirect, getRedirectResult } from 'firebase/auth';"
replacement_imports = "import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';"

content = content.replace(target_imports, replacement_imports)

# Add email login function
email_auth_func = """
export async function loginWithEmailFirebase(email: string, password: string): Promise<{ user: any, token: string, backupData: any }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    const token = await fbUser.getIdToken();
    
    // Check if user exists in our db
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    const docSnap = await getDoc(userRef);
    let alias = fbUser.displayName || email.split('@')[0];
    
    if (docSnap.exists()) {
      alias = docSnap.data().alias || alias;
    }
    
    const backupData = await restoreStateFromFirebase(email);
    
    return {
      user: {
        email: fbUser.email || email,
        alias: alias,
        avatar: fbUser.photoURL || '',
      },
      token,
      backupData
    };
  } catch (error: any) {
    console.error('Firebase Email Login Error:', error);
    throw error;
  }
}

export async function registerWithEmailFirebase(email: string, password: string, alias: string): Promise<{ user: any, token: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    const token = await fbUser.getIdToken();
    
    // Save to users collection
    const userRef = doc(db, 'users', email.toLowerCase().trim());
    await setDoc(userRef, {
      email: email.toLowerCase().trim(),
      alias,
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    return {
      user: {
        email: fbUser.email || email,
        alias,
        avatar: fbUser.photoURL || '',
      },
      token
    };
  } catch (error: any) {
    console.error('Firebase Email Register Error:', error);
    throw error;
  }
}
"""

# Append to file
content += email_auth_func

with open('src/utils/firebase.ts', 'w') as f:
    f.write(content)

print("Success")
