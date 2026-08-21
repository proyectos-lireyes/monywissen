import re

# 1. Update firebase.ts
with open('src/utils/firebase.ts', 'r') as f:
    fb_content = f.read()

target_fb = """export async function registerWithEmailFirebase(email: string, password: string, alias: string): Promise<{ user: any, token: string }> {
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
    };"""

replacement_fb = """export async function registerWithEmailFirebase(email: string, password: string, alias: string): Promise<{ user: any, token: string, backupData: any }> {
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
      },
      token,
      backupData
    };"""

if target_fb in fb_content:
    with open('src/utils/firebase.ts', 'w') as f:
        f.write(fb_content.replace(target_fb, replacement_fb))

# 2. Update LoginScreen.tsx
with open('src/components/auth/LoginScreen.tsx', 'r') as f:
    ls_content = f.read()

target_ls = """      if (isRegistering) {
        const res = await registerWithEmailFirebase(email, password, alias);
        showToast('¡Cuenta registrada exitosamente!', '🔥');
        loginUser(res.user, res.token);
      } else {"""

replacement_ls = """      if (isRegistering) {
        const res = await registerWithEmailFirebase(email, password, alias);
        if (res.backupData) {
          importFullState(res.backupData);
          showToast('¡Contraseña establecida y datos recuperados!', '🔄');
        } else {
          showToast('¡Cuenta registrada exitosamente!', '🔥');
        }
        loginUser(res.user, res.token);
      } else {"""

if target_ls in ls_content:
    with open('src/components/auth/LoginScreen.tsx', 'w') as f:
        f.write(ls_content.replace(target_ls, replacement_ls))

# 3. Update AuthModal.tsx
with open('src/components/auth/AuthModal.tsx', 'r') as f:
    am_content = f.read()

if target_ls in am_content:
    with open('src/components/auth/AuthModal.tsx', 'w') as f:
        f.write(am_content.replace(target_ls, replacement_ls))

print("Success")
