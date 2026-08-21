import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("    if (type !== 'debt') return [];", "    if (type !== 'debt') return [];\n    if (!parseFloat(String(balance))) return [];")

content = content.replace('{expectedCuotas.length} cuotas.', '{expectedCuotas.length > 0 ? `${expectedCuotas.length} cuotas proyectadas.` : ""}')

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
