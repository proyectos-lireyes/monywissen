import re

with open('src/utils/firebase.ts', 'r') as f:
    content = f.read()

# Add new imports
if "collection" not in content:
    content = content.replace("getDoc, onSnapshot", "getDoc, onSnapshot, collection, getDocs, query, orderBy, deleteDoc, limit")

# Append the manual backup functions at the end of the file
new_functions = """
export async function saveManualBackup(email: string, appState: any, label: string) {
  try {
    if (!email) return;
    const historyRef = collection(db, 'backups', email.toLowerCase().trim(), 'history');
    
    // Add new backup
    const timestamp = Date.now().toString();
    const newBackupRef = doc(historyRef, timestamp);
    await setDoc(newBackupRef, {
      id: timestamp,
      label,
      userEmail: email.toLowerCase().trim(),
      dataPayload: appState,
      updatedAt: new Date().toISOString(),
      timestamp: parseInt(timestamp)
    });

    // Fetch all backups to enforce limit of 4
    const q = query(historyRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 4) {
      // Delete older ones
      const docsToDelete = snapshot.docs.slice(4);
      for (const d of docsToDelete) {
        await deleteDoc(d.ref);
      }
    }
  } catch (error) {
    console.error('saveManualBackup error:', error);
    throw error;
  }
}

export async function getManualBackups(email: string) {
  try {
    if (!email) return [];
    const historyRef = collection(db, 'backups', email.toLowerCase().trim(), 'history');
    const q = query(historyRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('getManualBackups error:', error);
    return [];
  }
}
"""

if "saveManualBackup" not in content:
    content += new_functions

with open('src/utils/firebase.ts', 'w') as f:
    f.write(content)

print("Success")
