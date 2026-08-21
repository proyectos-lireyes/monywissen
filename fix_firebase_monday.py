import re

with open('src/utils/firebase.ts', 'r') as f:
    content = f.read()

target = """export async function backupStateToFirebase(email: string, appState: any) {
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
}"""

replacement = """export async function backupStateToFirebase(email: string, appState: any) {
  try {
    if (!email) return;
    
    // Main synced backup
    const backupRef = doc(db, 'backups', email.toLowerCase().trim());
    await setDoc(backupRef, {
      userEmail: email.toLowerCase().trim(),
      dataPayload: appState,
      updatedAt: new Date().toISOString(),
    });
    
    // Weekly Monday Backup
    const today = new Date();
    if (today.getDay() === 1) { // 1 = Monday
       const mondayDate = today.toISOString().split('T')[0];
       const weeklyRef = doc(db, 'backups_weekly', f"{email.toLowerCase().trim()}_{mondayDate}");
       await setDoc(weeklyRef, {
         userEmail: email.toLowerCase().trim(),
         dataPayload: appState,
         backupDate: mondayDate,
         updatedAt: new Date().toISOString(),
       });
    }
    
  } catch (error) {
    console.error('Firebase backupState error:', error);
  }
}"""

content = content.replace(target, replacement)

with open('src/utils/firebase.ts', 'w') as f:
    f.write(content)

print("Success")
