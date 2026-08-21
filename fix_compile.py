import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

content = content.replace("expensePieData", "pieData")
content = content.replace('hide={hiddenLines["netAvailable"]} yAxisId="left" dataKey="netAvailable" name="Flujo Neto Mensual"', 'hide={hiddenLines["netFlow"]} yAxisId="left" dataKey="netFlow" name="Flujo Neto Mensual"')
content = content.replace("entry.netAvailable >=", "entry.netFlow >=")

# Fix the duplicate totalEgresos bug:
# Object.values(biweeklyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });
# This is currently duplicated in biweeklyDataMap?
# Let's check biweeklyDataMap declaration
# Actually, the error is: Duplicate identifier 'totalEgresos' at line 216.
# Record<string, { label: string; income: number; expense: number; debt: number; savingsAccumulated?: number; totalEgresos?: number; netAvailable?: number; items: any[]; balance?: number }>
# Did I run the regex twice?
