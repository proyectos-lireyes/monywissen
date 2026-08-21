import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

target1 = """  let todayBalance = profile.settings.openingBalance || 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let criticalAlert: { date: string; reason: string } | null = null;
  const delayedItems: any[] = [];

  plan.forEach(e => {
    if (e.done) todayBalance += e.amt;"""

replacement1 = """  let todayBalance = profile.settings.openingBalance || 0;
  let projectedToday = profile.settings.openingBalance || 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let criticalAlert: { date: string; reason: string } | null = null;
  const delayedItems: any[] = [];

  plan.forEach(e => {
    if (e.done) todayBalance += e.amt;
    if (e.date <= today) projectedToday += e.amt;"""

content = content.replace(target1, replacement1)

target2 = """            <p className="text-xs text-slate-500 mt-1">
              Colchón Mínimo: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(profile.settings.minBalance || 0)}</span>
            </p>"""

replacement2 = """            <p className="text-xs text-slate-500 mt-1">
              Colchón Mínimo: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(profile.settings.minBalance || 0)}</span>
              <span className="mx-2">•</span>
              Proyectado: <span className="font-semibold text-slate-700 dark:text-slate-300" title="Saldo si todos los movimientos hasta hoy estuvieran marcados como pagados">{formatCurrency(projectedToday)}</span>
            </p>"""

content = content.replace(target2, replacement2)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
