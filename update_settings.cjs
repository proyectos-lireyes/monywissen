const fs = require('fs');
const p = 'src/components/settings/SettingsView.tsx';
let txt = fs.readFileSync(p, 'utf8');

const resetFunction = `
  const handleResetRescates = () => {
    if (window.confirm("¿Seguro que deseas recalcular y corregir los rescates automáticos?")) {
      const currentOverrides = { ...profile.overrides };
      let count = 0;
      Object.keys(currentOverrides).forEach(key => {
        if (key.startsWith('rescate_ahorros_') || key.startsWith('income_required_starting_fund_')) {
          delete currentOverrides[key];
          count++;
        }
      });
      if (count > 0) {
        saveProfile({ ...profile, overrides: currentOverrides });
        showToast(\`Se han corregido \${count} rescates en caché. Motor recalculado.\`, '⚙️');
      } else {
        showToast('Todo estaba en orden, no hubo rescates que corregir.', '👍');
      }
    }
  };
`;

txt = txt.replace('const handleFirebaseBackup =', resetFunction + '\n  const handleFirebaseBackup =');

const maintenanceUI = `
            {/* Mantenimiento del Sistema */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5"><RotateCcw className="w-4 h-4" /> Recalcular Motor</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Si ves comportamientos extraños en los rescates de ahorros automáticos, puedes forzar un recálculo desde cero.
              </p>
              <button
                onClick={handleResetRescates}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                Corregir Rescates y Recalcular
              </button>
            </div>
`;

txt = txt.replace('          </div>\n        )}\n\n        {subTab === \'about\'', maintenanceUI + '          </div>\n        )}\n\n        {subTab === \'about\'');

fs.writeFileSync(p, txt);
