import re

with open('src/types/index.ts', 'r') as f:
    content = f.read()

content = content.replace('  currency?: CurrencyCode;\n}', '  currency?: CurrencyCode;\n  strictDate?: boolean;\n}')
content = content.replace('  cardId?: string;', '  cardId?: string;\n  strictDate?: boolean;')
content = content.replace('  isPartial?: boolean;', '  isPartial?: boolean;\n  strictDate?: boolean;\n  optimizedFrom?: string;')

with open('src/types/index.ts', 'w') as f:
    f.write(content)
