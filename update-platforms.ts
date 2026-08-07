import fs from 'fs';

let content = fs.readFileSync('src/components/savings/SavingsView.tsx', 'utf8');

const target2 = `            <div className="space-y-2 max-h-60 overflow-y-auto">
              {platforms.map(p => (
                <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">🌐 {p.name}</span>
                </div>
              ))}
            </div>`;

const replacement2 = `            <div className="space-y-2 max-h-60 overflow-y-auto">
              {platforms.map((p, idx) => (
                <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between group">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">🌐 {p.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        const newName = prompt('Editar nombre:', p.name);
                        if (newName) {
                          updateProfileData(draft => {
                            if (draft.settings.savingPlatforms) {
                               const idx = draft.settings.savingPlatforms.findIndex(pl => pl.id === p.id);
                               if (idx > -1) draft.settings.savingPlatforms[idx].name = newName;
                            }
                          });
                        }
                      }}
                      className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"
                    >
                      ✎
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(\`¿Eliminar \${p.name}?\`)) {
                          updateProfileData(draft => {
                            if (draft.settings.savingPlatforms) {
                              const idx = draft.settings.savingPlatforms.findIndex(pl => pl.id === p.id);
                              if (idx > -1) draft.settings.savingPlatforms.splice(idx, 1);
                            }
                          });
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>`;

content = content.replace(target2, replacement2);
fs.writeFileSync('src/components/savings/SavingsView.tsx', content);
