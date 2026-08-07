import fs from 'fs';
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

// 1. Add state
content = content.replace(
  "const [savStatus, setSavStatus] = useState<'pending' | 'completed'>('completed');",
  "const [savStatus, setSavStatus] = useState<'pending' | 'completed'>('completed');\n  const [savPlatform, setSavPlatform] = useState('');"
);

// 2. Set defaults
content = content.replace(
  "setSavStatus(item.status === 'pending' ? 'pending' : 'completed');",
  "setSavStatus(item.status === 'pending' ? 'pending' : 'completed');\n          setSavPlatform(item.platformId || '');"
);
content = content.replace(
  "setSavStatus('completed');",
  "setSavStatus('completed');\n      setSavPlatform('');"
);

// 3. Update submit
content = content.replace(
  "savType,",
  "savType,\n          platformId: savType === 'digital' ? savPlatform : undefined,"
);

// 4. Add UI field
const savStatusUI = `                  <div>
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
const newSavStatusUI = savStatusUI + `
                  {savType === 'digital' && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 block">Plataforma</label>
                      <select
                        value={savPlatform}
                        onChange={e => setSavPlatform(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Seleccione...</option>
                        {profile.settings?.savingPlatforms?.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}`;

content = content.replace(savStatusUI, newSavStatusUI);
fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
