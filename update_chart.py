import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Update chartDataMap type
target_type = "const chartDataMap: Record<string, { date: string; label: string; balance: number; income: number; expense: number; debt: number; netAvailable: number; items: any[] }> = {};"
replacement_type = "const chartDataMap: Record<string, { date: string; label: string; balance: number; income: number; expense: number; debt: number; totalEgresos: number; netAvailable: number; items: any[] }> = {};"

# Update initialization
target_init = """          income: 0,
          expense: 0,
          debt: 0,
          netAvailable: 0,
          items: []
        };"""
replacement_init = """          income: 0,
          expense: 0,
          debt: 0,
          totalEgresos: 0,
          netAvailable: 0,
          items: []
        };"""

# Update calculation
target_calc = "Object.values(chartDataMap).forEach(d => { d.netAvailable = d.income - d.expense - d.debt; });"
replacement_calc = "Object.values(chartDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; });"


if target_type in content and target_init in content and target_calc in content:
    content = content.replace(target_type, replacement_type)
    content = content.replace(target_init, replacement_init)
    content = content.replace(target_calc, replacement_calc)
    with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
        f.write(content)
    print("Success patch data preparation")
else:
    print("Failed to patch data preparation")
