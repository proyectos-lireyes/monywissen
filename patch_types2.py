import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'biweeklyDataMap: Record<string, \{([^}]+)\}>', lambda m: m.group(0).replace('netAvailable?: number;', 'totalEgresos?: number; netAvailable?: number;'), content)
content = re.sub(r'weeklyDataMap: Record<string, \{([^}]+)\}>', lambda m: m.group(0).replace('netAvailable?: number;', 'totalEgresos?: number; netAvailable?: number;'), content)
content = re.sub(r'monthlyDataMap: Record<string, \{([^}]+)\}>', lambda m: m.group(0).replace('netAvailable?: number;', 'totalEgresos?: number; netAvailable?: number;'), content)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
print("Types Patched Again!")
