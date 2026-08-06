import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

search_select = """                      <select
                        value={debtType}
                        onChange={e => {
                          const selected = e.target.value;
                          setDebtType(selected);
                          setFreq('monthly');
                          if (selected === 'card') setInstallments(1);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 font-bold"
                      >"""

replace_select = """                      <select
                        value={debtType}
                        onChange={e => {
                          const selected = e.target.value;
                          setDebtType(selected);
                          if (selected === 'card') {
                             setFreq('monthly');
                             setInstallments(1);
                          } else {
                             const customDef = profile.settings.customDebts?.find(d => d.id === selected);
                             if (customDef) {
                                setFreq(customDef.freq as any || 'monthly');
                                setDueDay(customDef.dueDay || '1');
                             } else {
                                setFreq('monthly');
                             }
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 font-bold"
                      >"""

content = content.replace(search_select, replace_select)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
