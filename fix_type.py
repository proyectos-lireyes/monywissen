import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

content = content.replace("type: 'income',\n      amt: deficit,\n      ref: { id: `comp_${startD}`", "type: 'compensation',\n      amt: deficit,\n      ref: { id: `comp_${startD}`")

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
