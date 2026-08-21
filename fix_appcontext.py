import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

target = "import { backupStateToFirebase } from '../utils/firebase';"
replacement = "import { backupStateToFirebase, subscribeToFirebaseState } from '../utils/firebase';"
content = content.replace(target, replacement)

# 1. We need to throttle/debounce the backupStateToFirebase so we don't spam it.
# 2. We need to handle onSnapshot. 
# Inside the `AppProvider`, we can add a `useEffect`.

target_useeffect = """  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [state]);"""

replacement_useeffect = """  // Sync state to LocalStorage and Firebase
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      // Auto Backup / Sync to Firebase if authenticated
      if (state.authUser && state.authUser.email) {
         // Debounce or just save
         const timer = setTimeout(() => {
            backupStateToFirebase(state.authUser!.email, state);
         }, 2000);
         return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [state]);

  // Listener for Cross-device Sync
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

content = content.replace(target_useeffect, replacement_useeffect)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)

print("Success")
