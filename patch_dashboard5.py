import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Fix Weekly
weekly_old = """    // Add planned info
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origWeekPrefix = getWeekNumber(e.originalDate);
      if (!weeklyDataMap[origWeekPrefix]) {
        weeklyDataMap[origWeekPrefix] = {
          date: e.originalDate,
          label: origWeekPrefix,
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
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
          weeklyDataMap[origWeekPrefix].plannedIncome = (weeklyDataMap[origWeekPrefix].plannedIncome || 0) + e.amt;
        }
        if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
          weeklyDataMap[origWeekPrefix].plannedEgresos = (weeklyDataMap[origWeekPrefix].plannedEgresos || 0) + Math.abs(e.amt);
        }
      }
    }
  });"""

weekly_new = """    // Add planned info
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origWeekPrefix = getWeekStart(e.originalDate);
      if (!weeklyDataMap[origWeekPrefix]) {
        weeklyDataMap[origWeekPrefix] = {
          label: origWeekPrefix.substring(5,10),
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
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
        weeklyDataMap[origWeekPrefix].plannedIncome = (weeklyDataMap[origWeekPrefix].plannedIncome || 0) + e.amt;
      }
      if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
        weeklyDataMap[origWeekPrefix].plannedEgresos = (weeklyDataMap[origWeekPrefix].plannedEgresos || 0) + Math.abs(e.amt);
      }
    }
  });"""
content = content.replace(weekly_old, weekly_new)

# Fix Biweekly
biweekly_old = """    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      // Find biweek for original date
      const dObj = new Date(e.originalDate);
      const isFirstHalf = dObj.getDate() <= 15;
      const origBiweekPrefix = `${e.originalDate.substring(0, 7)} ${isFirstHalf ? 'Q1' : 'Q2'}`;
      if (!biweeklyDataMap[origBiweekPrefix]) {
        biweeklyDataMap[origBiweekPrefix] = {
          date: e.originalDate,
          label: origBiweekPrefix,
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
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
          biweeklyDataMap[origBiweekPrefix].plannedIncome = (biweeklyDataMap[origBiweekPrefix].plannedIncome || 0) + e.amt;
        }
        if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
          biweeklyDataMap[origBiweekPrefix].plannedEgresos = (biweeklyDataMap[origBiweekPrefix].plannedEgresos || 0) + Math.abs(e.amt);
        }
      }
    }
  });"""

biweekly_new = """    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origBiweekPrefix = getBiweeklyStart(e.originalDate);
      if (!biweeklyDataMap[origBiweekPrefix]) {
        biweeklyDataMap[origBiweekPrefix] = {
          label: origBiweekPrefix.substring(5),
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
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
        biweeklyDataMap[origBiweekPrefix].plannedIncome = (biweeklyDataMap[origBiweekPrefix].plannedIncome || 0) + e.amt;
      }
      if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
        biweeklyDataMap[origBiweekPrefix].plannedEgresos = (biweeklyDataMap[origBiweekPrefix].plannedEgresos || 0) + Math.abs(e.amt);
      }
    }
  });"""
content = content.replace(biweekly_old, biweekly_new)


# Fix Monthly
monthly_old = """    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origMonthPrefix = e.originalDate.substring(0, 7);
      if (!monthlyDataMap[origMonthPrefix]) {
        monthlyDataMap[origMonthPrefix] = {
          date: e.originalDate,
          label: origMonthPrefix,
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
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
          monthlyDataMap[origMonthPrefix].plannedIncome = (monthlyDataMap[origMonthPrefix].plannedIncome || 0) + e.amt;
        }
        if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
          monthlyDataMap[origMonthPrefix].plannedEgresos = (monthlyDataMap[origMonthPrefix].plannedEgresos || 0) + Math.abs(e.amt);
        }
      }
    }
  });"""

monthly_new = """    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origMonthPrefix = e.originalDate.substring(0, 7);
      if (!monthlyDataMap[origMonthPrefix]) {
        monthlyDataMap[origMonthPrefix] = {
          label: origMonthPrefix,
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
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
        monthlyDataMap[origMonthPrefix].plannedIncome = (monthlyDataMap[origMonthPrefix].plannedIncome || 0) + e.amt;
      }
      if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
        monthlyDataMap[origMonthPrefix].plannedEgresos = (monthlyDataMap[origMonthPrefix].plannedEgresos || 0) + Math.abs(e.amt);
      }
    }
  });"""
content = content.replace(monthly_old, monthly_new)


# Re-verify that I am not messing up the previous object syntax. Wait, I will use regular expressions to be safe for replacing.

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
