import fs from 'fs';

let code = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

const target = `<option value="triweekly">Trisemanal (3 Semanas)</option>
                    </select>
                  </div>
                </div>`;
const replacement = `<option value="triweekly">Trisemanal (3 Semanas)</option>
                    </select>
                  </div>
                  
                  {customDebtForm.freq === 'biweekly' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Día Pago</label>
                      <select
                        value={customDebtForm.dueDay || '15-30'}
                        onChange={e => setCustomDebtForm({...customDebtForm, dueDay: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="15-30">15 y 30</option>
                        <option value="14-28">14 y 28</option>
                        <option value="13-27">13 y 27</option>
                        <option value="exact_14">Cada 14 días (Cashea)</option>
                        <option value="exact_15">Cada 15 días</option>
                      </select>
                    </div>
                  )}
                </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/debts/DebtsView.tsx', code);
console.log("Patched DebtsView.tsx");
