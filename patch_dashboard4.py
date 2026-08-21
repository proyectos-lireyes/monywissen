import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

def add_init(code, map_name, prefix_var):
    old = f"""      if ({map_name}[{prefix_var}]) {{
        if (e.amt > 0"""
    new = f"""      if (!{map_name}[{prefix_var}]) {{
        {map_name}[{prefix_var}] = {{
          date: e.originalDate,
          label: {prefix_var},
          balance: e.balance,
          income: 0,
          expense: 0,
          optimizedAdelantados: 0,
          optimizedAtrasados: 0,
          deficit: 0,
          debt: 0,
          totalEgresos: 0,
          netAvailable: 0,
          plannedIncome: 0,
          plannedEgresos: 0,
          items: [],
        }};
      }}
      if (e.amt > 0"""
    return code.replace(old, new)

content = add_init(content, "weeklyDataMap", "origWeekPrefix")
content = add_init(content, "biweeklyDataMap", "origBiweekPrefix")
content = add_init(content, "monthlyDataMap", "origMonthPrefix")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
