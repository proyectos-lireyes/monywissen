import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

biweekly_old = """    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!biweeklyDataMap[biweekPrefix]) {
        biweeklyDataMap[biweekPrefix] = {
          date: e.date,
          label: biweekPrefix,
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
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) biweeklyDataMap[biweekPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') biweeklyDataMap[biweekPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) biweeklyDataMap[biweekPrefix].debt += Math.abs(e.amt);
      biweeklyDataMap[biweekPrefix].items.push(e);
      if (e.pulledEarly) biweeklyDataMap[biweekPrefix].optimizedAdelantados += Math.abs(e.amt);
      if (e.isDelayed && !e.insufficientFunds) biweeklyDataMap[biweekPrefix].optimizedAtrasados += Math.abs(e.amt);
      if (e.insufficientFunds && e.amt < 0) biweeklyDataMap[biweekPrefix].deficit += Math.abs(e.amt);
      biweeklyDataMap[biweekPrefix].balance = e.balance;
      biweeklyDataMap[biweekPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
  });"""

biweekly_new = """    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!biweeklyDataMap[biweekPrefix]) {
        biweeklyDataMap[biweekPrefix] = {
          date: e.date,
          label: biweekPrefix,
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
      if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) biweeklyDataMap[biweekPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') biweeklyDataMap[biweekPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) biweeklyDataMap[biweekPrefix].debt += Math.abs(e.amt);
      biweeklyDataMap[biweekPrefix].items.push(e);
      if (e.pulledEarly) biweeklyDataMap[biweekPrefix].optimizedAdelantados += Math.abs(e.amt);
      if (e.isDelayed && !e.insufficientFunds) biweeklyDataMap[biweekPrefix].optimizedAtrasados += Math.abs(e.amt);
      if (e.insufficientFunds && e.amt < 0) biweeklyDataMap[biweekPrefix].deficit += Math.abs(e.amt);
      biweeklyDataMap[biweekPrefix].balance = e.balance;
      biweeklyDataMap[biweekPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
    
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      // Find biweek for original date
      const dObj = new Date(e.originalDate);
      const isFirstHalf = dObj.getDate() <= 15;
      const origBiweekPrefix = `${e.originalDate.substring(0, 7)} ${isFirstHalf ? 'Q1' : 'Q2'}`;
      if (biweeklyDataMap[origBiweekPrefix]) {
        if (e.amt > 0 && (e.type === 'income' || e.type === 'compensation')) {
          biweeklyDataMap[origBiweekPrefix].plannedIncome = (biweeklyDataMap[origBiweekPrefix].plannedIncome || 0) + e.amt;
        }
        if (e.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
          biweeklyDataMap[origBiweekPrefix].plannedEgresos = (biweeklyDataMap[origBiweekPrefix].plannedEgresos || 0) + Math.abs(e.amt);
        }
      }
    }
  });"""

content = content.replace(biweekly_old, biweekly_new)
with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
