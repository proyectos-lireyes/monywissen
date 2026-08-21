import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Change netAvailable label to Flujo Neto
content = content.replace(
    '<Line type="monotone" dataKey="netAvailable" name="Disponible Total"',
    '<Line type="monotone" dataKey="netAvailable" name="Flujo Neto (Ingreso - Gastos)"'
)
content = content.replace(
    '<Line yAxisId="left" type="monotone" dataKey="netAvailable" name="Disponible Total (Eje Izq.)"',
    '<Line yAxisId="left" type="monotone" dataKey="netAvailable" name="Flujo Neto (Eje Izq.)"'
)

# Update the tooltip component to show the real Disponible (Balance - Colchon)
tooltip_target = """        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex justify-between items-center text-xs mb-1" style={{ color: entry.color }}>
            <span className="font-semibold">{entry.name}:</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.value)}</span>
          </div>
        ))}"""

tooltip_replacement = """        {payload.map((entry: any, index: number) => {
          let name = entry.name;
          if (name.includes('Flujo Neto')) name = 'Flujo del Período';
          if (name.includes('Eje')) name = name.replace(' (Eje Izq.)', '').replace(' (Eje Der.)', '');
          return (
          <div key={`item-${index}`} className="flex justify-between items-center text-xs mb-1" style={{ color: entry.color }}>
            <span className="font-semibold">{name}:</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.value)}</span>
          </div>
        )})}
        <div className="flex justify-between items-center text-xs mb-1 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800" style={{ color: '#2563eb' }}>
          <span className="font-bold">Liquidez Real (Saldo):</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.balance)}</span>
        </div>"""

content = content.replace(tooltip_target, tooltip_replacement)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
