import fs from 'fs';

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const search = `  // Sync state to LocalStorage and Firebase
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      // Auto-sync to Firebase if logged in
      if (state.authUser && state.authUser.email && isSyncReady.current) {
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
  }, [state]);`;

const replace = `  // Sync state to LocalStorage and Firebase
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      // Auto-sync to Firebase if logged in
      if (state.authUser && state.authUser.email && isSyncReady.current) {
         // Create a minimal clone without tokens for backup
         const stateToBackup = JSON.parse(JSON.stringify(state));
         delete stateToBackup.authToken;
         
         if (syncTimeoutRef.current) {
           clearTimeout(syncTimeoutRef.current);
         }
         
         // Debounce writes to avoid exhausting Firebase quota (10 seconds)
         syncTimeoutRef.current = setTimeout(() => {
           backupStateToFirebase(state.authUser.email, stateToBackup).catch(err => {
               console.error('Error syncing to Firebase:', err);
           });
         }, 10000);
      }
    } catch (e) {
      console.error('Error saving state:', e);
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    }
  }, [state]);`;

if (content.includes("  // Sync state to LocalStorage and Firebase")) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/context/AppContext.tsx', content);
  console.log("Success!");
} else {
  console.log("String not found!");
}
