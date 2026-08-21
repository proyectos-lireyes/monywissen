import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Replace the single YAxis in biweekly, weekly, monthly with double YAxis
target_axes = """                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />"""

replacement_axes = """                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                  <YAxis yAxisId="rightSavings" orientation="right" stroke="#0ea5e9" fontSize={10} tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip content={<CustomTooltip />} />"""

content = content.replace(target_axes, replacement_axes)

# Replace the Lines in biweekly, weekly, monthly to use yAxisId
target_line_income = 'name="Ingresos" stroke="#10b981"'
replacement_line_income = 'yAxisId="left" name="Ingresos" stroke="#10b981"'
content = content.replace(target_line_income, replacement_line_income)

target_line_expense = 'name="Gastos" stroke="#ef4444"'
replacement_line_expense = 'yAxisId="left" name="Gastos" stroke="#ef4444"'
content = content.replace(target_line_expense, replacement_line_expense)

target_line_debt = 'name="Deudas" stroke="#f59e0b"'
replacement_line_debt = 'yAxisId="left" name="Deudas" stroke="#f59e0b"'
content = content.replace(target_line_debt, replacement_line_debt)

target_line_balance = 'name="Saldo Acumulado (Liquidez)" stroke="#8b5cf6"'
replacement_line_balance = 'yAxisId="left" name="Saldo Acumulado (Liquidez)" stroke="#8b5cf6"'
content = content.replace(target_line_balance, replacement_line_balance)

target_line_savings = 'name="Ahorros" stroke="#0ea5e9"'
replacement_line_savings = 'yAxisId="rightSavings" name="Ahorros" stroke="#0ea5e9"'
content = content.replace(target_line_savings, replacement_line_savings)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
