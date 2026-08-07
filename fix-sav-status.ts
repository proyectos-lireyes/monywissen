import fs from 'fs';

let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

// 1. Add state
content = content.replace(
  "const [savType, setSavType] = useState<'physical' | 'digital'>('physical');",
  "const [savType, setSavType] = useState<'physical' | 'digital'>('physical');\n  const [savStatus, setSavStatus] = useState<'pending' | 'completed'>('completed');"
);

// 2. Set defaults
content = content.replace(
  "setSavType(item.savType);",
  "setSavType(item.savType);\n          setSavStatus(item.status === 'pending' ? 'pending' : 'completed');"
);
content = content.replace(
  "setSavType('physical');",
  "setSavType('physical');\n      setSavStatus('completed');"
);

// 3. Update submit
content = content.replace(
  "delivered: true,\n          status: 'completed',",
  "delivered: savStatus === 'completed',\n          status: savStatus,"
);
// Make sure we didn't miss another place
content = content.replace(
  "delivered: false,\n          status: 'completed' as const,",
  "delivered: savStatus === 'completed',\n          status: savStatus,"
);


// 4. Add UI field
const savTypeUI = `                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Tipo</label>
                    <select
                      value={savType}
                      onChange={e => setSavType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="physical">💵 Efectivo (Físico)</option>
                      <option value="digital">🏦 Digital (Bancos)</option>
                    </select>
                  </div>`;
const newSavTypeUI = savTypeUI + `\n                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Estado</label>
                    <select
                      value={savStatus}
                      onChange={e => setSavStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="completed">✅ Entregado (Listo)</option>
                      <option value="pending">⏳ Pendiente</option>
                    </select>
                  </div>`;
content = content.replace(savTypeUI, newSavTypeUI);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
