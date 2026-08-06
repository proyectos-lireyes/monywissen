import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

# Remove the 'Tipos' button
replace_btn = """          <button
            onClick={() => setSubTab('types')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'types'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🏷️ Tipos ({customDebts.length})
          </button>"""

content = content.replace(replace_btn, "")

# Remove the Tipos view logic
import_custom = """        ) : subTab === 'types' ? (
          /* Types Customization View */"""

content_split = content.split(") : subTab === 'types' ? (")
if len(content_split) > 1:
    content_part2 = content_split[1]
    end_types_idx = content_part2.find("        ) : (")
    if end_types_idx != -1:
        new_content = content_split[0] + content_part2[end_types_idx:]
        with open('src/components/debts/DebtsView.tsx', 'w') as f:
            f.write(new_content)
