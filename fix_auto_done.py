import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target_withdraw = """        ref: { id: `autowithdraw_${d}`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
        originalDate: d,
        done: d <= todayStr(),"""

replacement_withdraw = """        ref: { id: `autowithdraw_${d}`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
        originalDate: d,
        done: overrides[`income_autowithdraw_${d}_${d}`] ? !!overrides[`income_autowithdraw_${d}_${d}`].done : false,"""

target_save = """        ref: { id: `autosave_${d}`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
        originalDate: d,
        done: d <= todayStr(),"""

replacement_save = """        ref: { id: `autosave_${d}`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
        originalDate: d,
        done: overrides[`savings_autosave_${d}_${d}`] ? !!overrides[`savings_autosave_${d}_${d}`].done : false,"""

content = content.replace(target_withdraw, replacement_withdraw)
content = content.replace(target_save, replacement_save)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
