import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

# Add strictDate to the new item object in handleSave
content = content.replace("desc: desc || undefined,", "desc: desc || undefined,\n          strictDate: strictDate,")

# Add the UI Checkbox
ui_checkbox = """
              {/* Strict Date */}
              {(type === 'expense' || type === 'debt') && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Fecha Estricta (No reprogramable)</label>
                    <p className="text-[10px] text-slate-500 font-medium">El sistema no sugerirá reprogramar este pago para equilibrar liquidez.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={strictDate} onChange={e => setStrictDate(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              )}
"""

content = content.replace('{/* Extra Options */}', ui_checkbox + '\n              {/* Extra Options */}')

# Reset strictDate on open
content = content.replace("setEndDate('');", "setEndDate('');\n        setStrictDate(false);")

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
