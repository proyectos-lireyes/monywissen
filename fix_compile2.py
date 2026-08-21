import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

content = content.replace("expensePieData", "pieData")
content = content.replace('hide={hiddenLines["netAvailable"]} yAxisId="left" dataKey="netAvailable" name="Flujo Neto Mensual"', 'hide={hiddenLines["netFlow"]} yAxisId="left" dataKey="netFlow" name="Flujo Neto Mensual"')
content = content.replace("entry.netAvailable >=", "entry.netFlow >=")
content = content.replace("totalEgresos?: number; totalEgresos?: number;", "totalEgresos?: number;")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
