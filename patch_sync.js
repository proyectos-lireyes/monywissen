const fs = require('fs');
const p = 'src/context/AppContext.tsx';
let c = fs.readFileSync(p, 'utf8');
const target = `  // Removed aggressive real-time listener to prevent wiping local data unexpectedly
  // The user will use explicit Restore actions from Settings.`;
const repl = `  useEffect(() => {
    if (state.authUser && state.authUser.email) {
      const unsubscribe = subscribeToFirebaseState(state.authUser.email, (payload) => {
        if (payload) {
          setState(prev => {
            const prevStr = JSON.stringify({ ...prev, authToken: undefined, authUser: undefined });
            const payloadStr = JSON.stringify({ ...payload, authToken: undefined, authUser: undefined });
            if (prevStr === payloadStr) return prev;
            
            // showToast('Datos sincronizados', '🔄');
            return {
              ...payload,
              authToken: prev.authToken,
              authUser: prev.authUser
            };
          });
        }
      });
      return () => unsubscribe();
    }
  }, [state.authUser]);`;
c = c.replace(target, repl);
fs.writeFileSync(p, c);
console.log('Done');
