import fs from 'fs';
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const target = `                <div>
                  <label className="text-xs font-bold text-slate-500 block">Concepto / Vendedor</label>
                  <input
                    type="text" required value={savPerson} onChange={e => setSavPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>`;

const replacement = `                <div>
                  <label className="text-xs font-bold text-slate-500 block">Concepto / Vendedor</label>
                  <input
                    type="text" required value={savPerson} onChange={e => setSavPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block">Divisa</label>
                  <select
                    value={currency} onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="USD_BCV">Dólar BCV (Bs)</option>
                    <option value="USD">Dólar USD ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="COP">Peso Colombiano</option>
                    <option value="BRL">Real Brasileño</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Comprobante (Imagen)</label>
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setReceiptImg(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                  />
                  {receiptImg && (
                    <div className="mt-2">
                      <img src={receiptImg} alt="Comprobante" className="h-16 rounded-lg object-cover" />
                    </div>
                  )}
                </div>
              </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
