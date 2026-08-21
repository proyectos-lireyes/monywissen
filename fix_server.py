import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("import { fileURLToPath } from 'url';", "")
content = content.replace("const __filename = fileURLToPath(import.meta.url);\nconst __dirname = path.dirname(__filename);", "")
content = content.replace("path.join(__dirname, 'dist')", "path.join(process.cwd(), 'dist')")

with open('server.ts', 'w') as f:
    f.write(content)

print("Success")
