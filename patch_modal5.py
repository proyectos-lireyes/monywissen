import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("desc: desc || undefined,", "desc: desc || undefined,\n          strictDate,")

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
