import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# For Weekly Data
weekly_old = """    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!weeklyDataMap[weekPrefix]) {
        weeklyDataMap[weekPrefix] = {
          date: e.date,
          label: weekPrefix,
          balance: e.balance,
          income: 0,
          expense: 0,
          optimizedAdelantados: 0,
          optimizedAtrasados: 0,
          deficit: 0,
          debt: 0,
          totalEgresos: 0,
          netAvailable: 0,
          items: [],
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) weeklyDataMap[weekPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') weeklyDataMap[weekPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) weeklyDataMap[weekPrefix].debt += Math.abs(e.amt);
      weeklyDataMap[weekPrefix].items.push(e);
      if (e.pulledEarly) weeklyDataMap[weekPrefix].optimizedAdelantados += Math.abs(e.amt);
      if (e.isDelayed && !e.insufficientFunds) weeklyDataMap[weekPrefix].optimizedAtrasados += Math.abs(e.amt);
      if (e.insufficientFunds && e.amt < 0) weeklyDataMap[weekPrefix].deficit += Math.abs(e.amt);
      weeklyDataMap[weekPrefix].balance = e.balance;
      weeklyDataMap[weekPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
  });"""

weekly_new = """    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!weeklyDataMap[weekPrefix]) {
        weeklyDataMap[weekPrefix] = {
          date: e.date,
          label: weekPrefix,
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
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) weeklyDataMap[weekPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') weeklyDataMap[weekPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) weeklyDataMap[weekPrefix].debt += Math.abs(e.amt);
      weeklyDataMap[weekPrefix].items.push(e);
      if (e.pulledEarly) weeklyDataMap[weekPrefix].optimizedAdelantados += Math.abs(e.amt);
      if (e.isDelayed && !e.insufficientFunds) weeklyDataMap[weekPrefix].optimizedAtrasados += Math.abs(e.amt);
      if (e.insufficientFunds && e.amt < 0) weeklyDataMap[weekPrefix].deficit += Math.abs(e.amt);
      weeklyDataMap[weekPrefix].balance = e.balance;
      weeklyDataMap[weekPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
    
    // Add planned info
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origWeekPrefix = getWeekNumber(e.originalDate);
      if (weeklyDataMap[origWeekPrefix]) {
        if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
          weeklyDataMap[origWeekPrefix].plannedIncome = (weeklyDataMap[origWeekPrefix].plannedIncome || 0) + e.amt;
        }
        if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
          weeklyDataMap[origWeekPrefix].plannedEgresos = (weeklyDataMap[origWeekPrefix].plannedEgresos || 0) + Math.abs(e.amt);
        }
      }
    }
  });"""

content = content.replace(weekly_old, weekly_new)


# For Monthly Data
monthly_old = """    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!monthlyDataMap[monthPrefix]) {
        monthlyDataMap[monthPrefix] = {
          date: e.date,
          label: monthPrefix,
          balance: e.balance,
          income: 0,
          expense: 0,
          optimizedAdelantados: 0,
          optimizedAtrasados: 0,
          deficit: 0,
          debt: 0,
          totalEgresos: 0,
          netAvailable: 0,
          items: [],
        };
      }
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) monthlyDataMap[monthPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') monthlyDataMap[monthPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) monthlyDataMap[monthPrefix].debt += Math.abs(e.amt);
      monthlyDataMap[monthPrefix].items.push(e);
      if (e.pulledEarly) monthlyDataMap[monthPrefix].optimizedAdelantados += Math.abs(e.amt);
      if (e.isDelayed && !e.insufficientFunds) monthlyDataMap[monthPrefix].optimizedAtrasados += Math.abs(e.amt);
      if (e.insufficientFunds && e.amt < 0) monthlyDataMap[monthPrefix].deficit += Math.abs(e.amt);
      monthlyDataMap[monthPrefix].balance = e.balance;
      monthlyDataMap[monthPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
  });"""

monthly_new = """    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!monthlyDataMap[monthPrefix]) {
        monthlyDataMap[monthPrefix] = {
          date: e.date,
          label: monthPrefix,
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
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) monthlyDataMap[monthPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') monthlyDataMap[monthPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) monthlyDataMap[monthPrefix].debt += Math.abs(e.amt);
      monthlyDataMap[monthPrefix].items.push(e);
      if (e.pulledEarly) monthlyDataMap[monthPrefix].optimizedAdelantados += Math.abs(e.amt);
      if (e.isDelayed && !e.insufficientFunds) monthlyDataMap[monthPrefix].optimizedAtrasados += Math.abs(e.amt);
      if (e.insufficientFunds && e.amt < 0) monthlyDataMap[monthPrefix].deficit += Math.abs(e.amt);
      monthlyDataMap[monthPrefix].balance = e.balance;
      monthlyDataMap[monthPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
    
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origMonthPrefix = e.originalDate.substring(0, 7);
      if (monthlyDataMap[origMonthPrefix]) {
        if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
          monthlyDataMap[origMonthPrefix].plannedIncome = (monthlyDataMap[origMonthPrefix].plannedIncome || 0) + e.amt;
        }
        if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
          monthlyDataMap[origMonthPrefix].plannedEgresos = (monthlyDataMap[origMonthPrefix].plannedEgresos || 0) + Math.abs(e.amt);
        }
      }
    }
  });"""
  
content = content.replace(monthly_old, monthly_new)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
