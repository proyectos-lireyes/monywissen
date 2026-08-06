import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

btn_search = """          <button
            onClick={() => setSubTab('strategy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'strategy'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            💡 Estrategia
          </button>"""

tipos_btn = """          <button
            onClick={() => setSubTab('types')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'types'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🏷️ Tipos ({customDebts.length})
          </button>\n""" + btn_search

content = content.replace(btn_search, tipos_btn)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)
