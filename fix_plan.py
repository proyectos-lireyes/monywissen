import re

with open('src/types/index.ts', 'r') as f:
    content = f.read()

# Add to PlanOccurrence
content = content.replace("  isDelayed?: boolean;\n}", "  isDelayed?: boolean;\n  pulledEarly?: boolean;\n  optimizedFrom?: string;\n}")

with open('src/types/index.ts', 'w') as f:
    f.write(content)
