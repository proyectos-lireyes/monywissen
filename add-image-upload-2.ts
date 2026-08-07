import fs from 'fs';

let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const imageUploadUI = `                    <div>
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
                    </div>`;

const targetButtons = `<div className="flex gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">`;

content = content.replace(targetButtons, imageUploadUI + '\n              ' + targetButtons);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
