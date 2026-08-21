import re

with open('src/utils/firebase.ts', 'r') as f:
    content = f.read()

target = "import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';"
replacement = "import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';"
content = content.replace(target, replacement)

# Add subscribeToFirebase method
new_method = """

export function subscribeToFirebaseState(email: string, onUpdate: (data: any) => void) {
  if (!email) return () => {};
  const backupRef = doc(db, 'backups', email.toLowerCase().trim());
  return onSnapshot(backupRef, (docSnap) => {
    if (docSnap.exists()) {
      const payload = docSnap.data()?.dataPayload;
      if (payload) {
        onUpdate(payload);
      }
    }
  });
}
"""
content += new_method

with open('src/utils/firebase.ts', 'w') as f:
    f.write(content)

print("Success")
