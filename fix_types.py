import re

with open('src/types/index.ts', 'r') as f:
    content = f.read()

content = content.replace("  pulledEarly?: boolean;\n  optimizedFrom?: string;\n", "", 1)

with open('src/types/index.ts', 'w') as f:
    f.write(content)
