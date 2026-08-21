import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Fix the duplicate balance line on the daily chart
target = """                      <Line yAxisId="left" type="monotone" dataKey="debt" name="Deudas (Eje Izq.)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="balance" name="Saldo Acumulado (Eje Izq.)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </>"""
                    
replacement = """                      <Line yAxisId="left" type="monotone" dataKey="debt" name="Deudas (Eje Izq.)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </>"""

content = content.replace(target, replacement)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
