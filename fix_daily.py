import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

target = """                      <Line yAxisId="left" type="monotone" dataKey="expense" name="Gastos (Eje Izq.)" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </>"""

replacement = """                      <Line yAxisId="left" type="monotone" dataKey="expense" name="Gastos (Eje Izq.)" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="debt" name="Deudas (Eje Izq.)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="netAvailable" name="Disponible Total (Eje Izq.)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </>"""

content = content.replace(target, replacement)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
