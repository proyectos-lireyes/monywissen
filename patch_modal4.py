import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [hasEndDate, setHasEndDate] = useState(false);", "const [hasEndDate, setHasEndDate] = useState(false);\n  const [strictDate, setStrictDate] = useState(false);")

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
