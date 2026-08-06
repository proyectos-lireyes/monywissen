import re

with open('src/components/settings/SettingsView.tsx', 'r') as f:
    content = f.read()

# draft.settings.customDebts = draft.settings.customDebts.filter(d => ['cashea', 'quoota'].includes(d.id));
replace_from = """        draft.settings.customDebts = draft.settings.customDebts.filter(d => ['cashea', 'quoota'].includes(d.id));"""
replace_to = """        draft.settings.customDebts = [];"""

content = content.replace(replace_from, replace_to)
with open('src/components/settings/SettingsView.tsx', 'w') as f:
    f.write(content)
