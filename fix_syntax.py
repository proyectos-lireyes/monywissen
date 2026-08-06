import os

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(") : \n                  {type === 'saving' ? (", ") : type === 'saving' ? (")

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
