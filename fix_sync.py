import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

target = """  // Sync state to LocalStorage and Firebase
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      // Removed aggressive auto-sync to avoid overwriting recent local changes
      // The user prefers manual backups with 4 copies
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [state]);"""

replacement = """  // Sync state to LocalStorage and Firebase
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      // Auto-sync to Firebase if logged in
      if (state.authUser && state.authUser.email) {
         // Create a minimal clone without tokens for backup
         const stateToBackup = JSON.parse(JSON.stringify(state));
         delete stateToBackup.authToken;
         
         // Use setTimeout to debounce slightly, though React handles basic debouncing
         backupStateToFirebase(state.authUser.email, stateToBackup).catch(err => {
             console.error('Error syncing to Firebase:', err);
         });
      }
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [state]);"""

if target in content:
    with open('src/context/AppContext.tsx', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Success")
else:
    print("Target not found")
