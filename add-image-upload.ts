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

// Insert the imageUploadUI into the form. 
// A good place is before the "Notas" (desc) field or after.
// Let's find "Notas"
const targetNotes = `                    <div>
                      <label className="text-xs font-bold text-slate-500 block">Notas (Opcional)</label>`;

content = content.replace(targetNotes, imageUploadUI + '\n' + targetNotes);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
