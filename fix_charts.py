import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Fix the definitions
content = content.replace("optimizedAtrasados?: number; deficit?: number }>", "optimizedAtrasados?: number; deficit?: number; plannedIncome?: number; plannedEgresos?: number; }>")
content = content.replace("netAvailable: 0,\n          items: [],", "netAvailable: 0,\n          plannedIncome: 0,\n          plannedEgresos: 0,\n          items: [],")

# Inject weekly planned tracking
weekly_regex = re.compile(r"""(weeklyDataMap\[weekPrefix\]\.savingsAccumulated = e\.savingsAccumulated \|\| 0;\n    })\n  \}\);""")
weekly_planned = r"""\1
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origWeekPrefix = getWeekStart(e.originalDate);
      if (!weeklyDataMap[origWeekPrefix]) {
        weeklyDataMap[origWeekPrefix] = {
          label: origWeekPrefix.substring(5,10),
          income: 0, expense: 0, optimizedAdelantados: 0, optimizedAtrasados: 0, deficit: 0, debt: 0, totalEgresos: 0, netAvailable: 0, plannedIncome: 0, plannedEgresos: 0, items: [],
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) weeklyDataMap[origWeekPrefix].plannedIncome = (weeklyDataMap[origWeekPrefix].plannedIncome || 0) + e.amt;
      if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) weeklyDataMap[origWeekPrefix].plannedEgresos = (weeklyDataMap[origWeekPrefix].plannedEgresos || 0) + Math.abs(e.amt);
    }
  });"""
content = weekly_regex.sub(weekly_planned, content)

# Inject biweekly planned tracking
biweekly_regex = re.compile(r"""(biweeklyDataMap\[prefix\]\.savingsAccumulated = e\.savingsAccumulated \|\| 0;\n    })\n  \}\);""")
biweekly_planned = r"""\1
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origBiweekPrefix = getBiweeklyStart(e.originalDate);
      if (!biweeklyDataMap[origBiweekPrefix]) {
        biweeklyDataMap[origBiweekPrefix] = {
          label: origBiweekPrefix.substring(5),
          income: 0, expense: 0, optimizedAdelantados: 0, optimizedAtrasados: 0, deficit: 0, debt: 0, totalEgresos: 0, netAvailable: 0, plannedIncome: 0, plannedEgresos: 0, items: [],
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) biweeklyDataMap[origBiweekPrefix].plannedIncome = (biweeklyDataMap[origBiweekPrefix].plannedIncome || 0) + e.amt;
      if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) biweeklyDataMap[origBiweekPrefix].plannedEgresos = (biweeklyDataMap[origBiweekPrefix].plannedEgresos || 0) + Math.abs(e.amt);
    }
  });"""
content = biweekly_regex.sub(biweekly_planned, content)

# Inject monthly planned tracking
monthly_regex = re.compile(r"""(monthlyDataMap\[monthPrefix\]\.savingsAccumulated = e\.savingsAccumulated \|\| 0;\n    })\n  \}\);""")
monthly_planned = r"""\1
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origMonthPrefix = e.originalDate.substring(0, 7);
      if (!monthlyDataMap[origMonthPrefix]) {
        monthlyDataMap[origMonthPrefix] = {
          label: origMonthPrefix,
          income: 0, expense: 0, optimizedAdelantados: 0, optimizedAtrasados: 0, deficit: 0, debt: 0, totalEgresos: 0, netAvailable: 0, plannedIncome: 0, plannedEgresos: 0, items: [],
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) monthlyDataMap[origMonthPrefix].plannedIncome = (monthlyDataMap[origMonthPrefix].plannedIncome || 0) + e.amt;
      if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) monthlyDataMap[origMonthPrefix].plannedEgresos = (monthlyDataMap[origMonthPrefix].plannedEgresos || 0) + Math.abs(e.amt);
    }
  });"""
content = monthly_regex.sub(monthly_planned, content)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
