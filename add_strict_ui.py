import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

ui_checkbox = """
              {/* Strict Date */}
              {(type === 'expense' || type === 'debt') && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 mt-4">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Fecha Estricta (No reprogramable)</label>
                    <p className="text-[10px] text-slate-500 font-medium">El sistema no sugerirá reprogramar este pago para equilibrar liquidez.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={strictDate} onChange={e => setStrictDate(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              )}
"""

content = content.replace('            {type === "debt" && expectedCuotas.length > 0 && (', ui_checkbox + '\n            {type === "debt" && expectedCuotas.length > 0 && (')

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
