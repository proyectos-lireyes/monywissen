import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Fix the purple line to be dataKey="balance" instead of "netAvailable" for the aggregated charts
content = content.replace(
    '<Line type="monotone" dataKey="netAvailable" name="Flujo Neto (Ingreso - Gastos)"',
    '<Line type="monotone" dataKey="balance" name="Saldo Acumulado (Liquidez)"'
)
content = content.replace(
    '<Line yAxisId="left" type="monotone" dataKey="netAvailable" name="Flujo Neto (Eje Izq.)"',
    '<Line yAxisId="left" type="monotone" dataKey="balance" name="Saldo Acumulado (Eje Izq.)"'
)
content = content.replace(
    '<Line type="monotone" dataKey="netAvailable" name="Disponible Total"',
    '<Line type="monotone" dataKey="balance" name="Saldo Acumulado (Liquidez)"'
)
content = content.replace(
    '<Line yAxisId="left" type="monotone" dataKey="netAvailable" name="Disponible Total (Eje Izq.)"',
    '<Line yAxisId="left" type="monotone" dataKey="balance" name="Saldo Acumulado (Eje Izq.)"'
)

# Weekly Data Map
target_weekly = """      if (e.amt > 0 && e.type === 'income') weeklyDataMap[weekPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') weeklyDataMap[weekPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) weeklyDataMap[weekPrefix].debt += Math.abs(e.amt);
      weeklyDataMap[weekPrefix].items.push(e);
    }
  });"""
replacement_weekly = """      if (e.amt > 0 && e.type === 'income') weeklyDataMap[weekPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') weeklyDataMap[weekPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) weeklyDataMap[weekPrefix].debt += Math.abs(e.amt);
      weeklyDataMap[weekPrefix].items.push(e);
      weeklyDataMap[weekPrefix].balance = e.balance; // Keep last balance of the week
    }
  });"""
content = content.replace(target_weekly, replacement_weekly)
content = content.replace("weeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[] }>", "weeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[]; balance?: number }>")


# Biweekly Data Map
target_biweekly = """      if (e.amt > 0 && e.type === 'income') biweeklyDataMap[prefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') biweeklyDataMap[prefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) biweeklyDataMap[prefix].debt += Math.abs(e.amt);
      biweeklyDataMap[prefix].items.push(e);
    }
  });"""
replacement_biweekly = """      if (e.amt > 0 && e.type === 'income') biweeklyDataMap[prefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') biweeklyDataMap[prefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) biweeklyDataMap[prefix].debt += Math.abs(e.amt);
      biweeklyDataMap[prefix].items.push(e);
      biweeklyDataMap[prefix].balance = e.balance;
    }
  });"""
content = content.replace(target_biweekly, replacement_biweekly)
content = content.replace("biweeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[] }>", "biweeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[]; balance?: number }>")


# Monthly Data Map
target_monthly = """      if (e.amt > 0 && e.type === 'income') monthlyDataMap[monthPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') monthlyDataMap[monthPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) monthlyDataMap[monthPrefix].debt += Math.abs(e.amt);
      monthlyDataMap[monthPrefix].items.push(e);
    }
  });"""
replacement_monthly = """      if (e.amt > 0 && e.type === 'income') monthlyDataMap[monthPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') monthlyDataMap[monthPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) monthlyDataMap[monthPrefix].debt += Math.abs(e.amt);
      monthlyDataMap[monthPrefix].items.push(e);
      monthlyDataMap[monthPrefix].balance = e.balance;
    }
  });"""
content = content.replace(target_monthly, replacement_monthly)
content = content.replace("monthlyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[] }>", "monthlyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; netAvailable: number; items: any[]; balance?: number }>")

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
