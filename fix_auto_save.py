import re

with open('src/utils/financialEngine.ts', 'r') as f:
    content = f.read()

target = """    // Auto-save logic if balance exceeds threshold
    if (settings.autoSaveThreshold && settings.autoSaveThreshold > 0 && balance > settings.autoSaveThreshold) {"""

replacement = """    // Auto-save logic if balance exceeds threshold
    const nextDateObj = new Date(d + 'T12:00:00');
    nextDateObj.setDate(nextDateObj.getDate() + 1);
    const nextDateStr = nextDateObj.toISOString().slice(0, 10);
    const hasIncomeTomorrow = (map[nextDateStr] || []).some(e => e.type === 'income' && e.amt > 0);
    const isLastDay = d === endD;
    
    if (settings.autoSaveThreshold && settings.autoSaveThreshold > 0 && balance > settings.autoSaveThreshold && (hasIncomeTomorrow || isLastDay)) {"""

content = content.replace(target, replacement)

with open('src/utils/financialEngine.ts', 'w') as f:
    f.write(content)

print("Success")
