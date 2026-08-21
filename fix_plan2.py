import re

with open('src/types/index.ts', 'r') as f:
    content = f.read()

content = content.replace("  isPartial?: boolean;\n  strictDate?: boolean;\n}", "  isPartial?: boolean;\n  strictDate?: boolean;\n  pulledEarly?: boolean;\n  optimizedFrom?: string;\n  isDelayed?: boolean;\n}")

with open('src/types/index.ts', 'w') as f:
    f.write(content)
