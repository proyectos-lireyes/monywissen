const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const selectRegex = /<select\s+value=\{debtType\}[\s\S]*?<\/select>/;
const newSelect = `<select
                      value={debtType}
                      onChange={e => {
                        const selected = e.target.value;
                        setDebtType(selected);
                        setFreq('monthly');
                        if (selected === 'card') {
                           setInstallments(1);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="card">💳 Tarjeta de Crédito</option>
                      <option value="loan_interest">🏦 Préstamo con Interés</option>
                      <option value="loan_no_interest">🤝 Préstamo sin Interés</option>
                    </select>`;
code = code.replace(selectRegex, newSelect);

const iifeRegex = /\{\(\(\) => \{\s*const customDef =.*?return null;.*?return \([\s\S]*?\);\s*\}\)\(\)\}/g;
code = code.replace(iifeRegex, '');

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
