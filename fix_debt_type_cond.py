import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

search_cond = "                    {debtType === 'card' ? ("
replace_cond = "                    {debtType === '' ? null : debtType === 'card' ? ("

content = content.replace(search_cond, replace_cond)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
