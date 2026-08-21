import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

# Disable auto-sync aggressive writes and reads
target_sync_write = """      // Auto Backup / Sync to Firebase if authenticated
      if (state.authUser && state.authUser.email) {
         // Debounce or just save
         const timer = setTimeout(() => {
            backupStateToFirebase(state.authUser!.email, state);
         }, 2000);
         return () => clearTimeout(timer);
      }"""

replacement_sync_write = """      // Removed aggressive auto-sync to avoid overwriting recent local changes
      // The user prefers manual backups with 4 copies"""

content = content.replace(target_sync_write, replacement_sync_write)

target_sync_read = """  // Listener for Cross-device Sync
  useEffect(() => {
     if (state.authUser && state.authUser.email) {
       const unsubscribe = subscribeToFirebaseState(state.authUser.email, (remoteState) => {
         // Only update if remote state is significantly different or just merge?
         // To avoid infinite loops, we can check a lastUpdated timestamp, or simply trust the remote if it's not exactly identical.
         // Doing a deep compare is expensive. For now, since user requested sync, let's just do a basic stringify check.
         const localStr = localStorage.getItem(STORAGE_KEY);
         const remoteStr = JSON.stringify(remoteState);
         if (localStr !== remoteStr && remoteState.profiles) {
           // We have a new remote state
           setState(remoteState);
           localStorage.setItem(STORAGE_KEY, remoteStr);
         }
       });
       return () => unsubscribe();
     }
  }, [state.authUser]);"""

replacement_sync_read = """  // Removed aggressive real-time listener to prevent wiping local data unexpectedly
  // The user will use explicit Restore actions from Settings."""

content = content.replace(target_sync_read, replacement_sync_read)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)

print("Success")
