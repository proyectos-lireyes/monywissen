const fs = require('fs');
let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

// Use string state for openingBalance
code = code.replace(
  `const [openingBalance, setOpeningBalance] = useState(settings.openingBalance);`,
  `const [openingBalanceStr, setOpeningBalanceStr] = useState(String(settings.openingBalance || 0));`
);

// Add the UI input
code = code.replace(
  `              <div>
                <label className="text-xs font-bold text-slate-500">Saldo mínimo (Colchón)</label>`,
  `              <div>
                <label className="text-xs font-bold text-slate-500">Saldo Inicial Manual</label>
                <input
                  type="number"
                  value={openingBalanceStr === '0' ? '' : openingBalanceStr}
                  onChange={e => setOpeningBalanceStr(e.target.value)}
                  placeholder="0 para auto-calcular"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 mb-3"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Saldo mínimo (Colchón)</label>`
);

// Save logic
code = code.replace(
  `draft.settings.openingBalance = openingBalance;`,
  `draft.settings.openingBalance = parseFloat(openingBalanceStr) || 0;`
);

fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
console.log("Patched SettingsView.tsx");
