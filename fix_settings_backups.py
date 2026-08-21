import re

with open('src/components/settings/SettingsView.tsx', 'r') as f:
    content = f.read()

# Add getManualBackups and saveManualBackup to the import
import_target = "registerUserInFirebase, backupStateToFirebase, restoreStateFromFirebase"
import_replacement = "registerUserInFirebase, backupStateToFirebase, restoreStateFromFirebase, getManualBackups, saveManualBackup"
content = content.replace(import_target, import_replacement)

# Add state variables for the modal
state_target = "const [isFbBackupLoading, setIsFbBackupLoading] = useState(false);"
state_replacement = """  const [isFbBackupLoading, setIsFbBackupLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);"""
content = content.replace(state_target, state_replacement)

# Update handleFirebaseBackup
backup_target = """  const handleFirebaseBackup = async () => {
    setIsFbBackupLoading(true);
    try {
      const userEmail = state.authUser?.email || await getOrForceUserEmail();
      await backupStateToFirebase(userEmail, state);
      showToast(`¡Respaldo completo de perfil y datos guardado en Firebase DB!`, '🔥');
    } catch (e) {
      console.error(e);
      showToast('Inicia sesión para respaldar en Firebase Cloud', '⚠️');
    } finally {
      setIsFbBackupLoading(false);
    }
  };"""

backup_replacement = """  const handleFirebaseBackup = async () => {
    setIsFbBackupLoading(true);
    try {
      const userEmail = state.authUser?.email || await getOrForceUserEmail();
      const label = `Copia de seguridad - ${new Date().toLocaleString()}`;
      await saveManualBackup(userEmail, state, label);
      showToast(`¡Respaldo guardado! Tienes hasta 4 copias seguras.`, '🔥');
    } catch (e) {
      console.error(e);
      showToast('Inicia sesión para respaldar en Firebase Cloud', '⚠️');
    } finally {
      setIsFbBackupLoading(false);
    }
  };"""
content = content.replace(backup_target, backup_replacement)

# Update handleFirebaseRestore
restore_target = """  const handleFirebaseRestore = async () => {
    setIsFbBackupLoading(true);
    try {
      const userEmail = state.authUser?.email || await getOrForceUserEmail();
      const data = await restoreStateFromFirebase(userEmail);
      if (data) {
        importFullState(data);
        showToast('¡Perfil y base de datos financiera restaurados desde Firebase Cloud!', '🎉');
      } else {
        showToast(`No se halló respaldo guardado en Firebase para ${userEmail}`, '⚠️');
      }
    } catch (e) {
      console.error(e);
      showToast('Error al consultar Firebase DB', '❌');
    } finally {
      setIsFbBackupLoading(false);
    }
  };"""

restore_replacement = """  const handleFirebaseRestore = async () => {
    setIsFbBackupLoading(true);
    try {
      const userEmail = state.authUser?.email || await getOrForceUserEmail();
      const backups = await getManualBackups(userEmail);
      if (backups && backups.length > 0) {
        setAvailableBackups(backups);
        setShowRestoreModal(true);
      } else {
        showToast(`No tienes respaldos guardados.`, '⚠️');
      }
    } catch (e) {
      console.error(e);
      showToast('Error al consultar Firebase DB', '❌');
    } finally {
      setIsFbBackupLoading(false);
    }
  };

  const applyRestore = (payload: any) => {
    importFullState(payload);
    setShowRestoreModal(false);
    showToast('¡Perfil y base de datos restaurados con éxito!', '🎉');
  };"""
content = content.replace(restore_target, restore_replacement)

# Inject modal at the end of the component
end_target = "    </div>\n  );\n}\n"
end_replacement = """
      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" />
              Restaurar Copia de Seguridad
            </h3>
            <p className="text-xs text-slate-500 mb-4">Selecciona cuál de las siguientes copias deseas restaurar. Tienes hasta un máximo de 4 copias almacenadas.</p>
            
            <div className="space-y-2 mb-5">
              {availableBackups.map((bkp, i) => (
                <button
                  key={bkp.id}
                  onClick={() => applyRestore(bkp.dataPayload)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{bkp.label || `Respaldo ${i + 1}`}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(bkp.updatedAt).toLocaleString()}</div>
                  </div>
                  <CloudUpload className="w-4 h-4 text-orange-500" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowRestoreModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
"""
content = content.replace(end_target, end_replacement)

with open('src/components/settings/SettingsView.tsx', 'w') as f:
    f.write(content)

print("Success")
