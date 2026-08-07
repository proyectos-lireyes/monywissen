/**
 * Financial Calculation Engine Module
 * Core algorithmic logic for cash flow projection, recurrence evaluation,
 * debt installment schedules, and shared group expense balancing.
 */

import { UserProfile, PlanOccurrence, SharedGroup, DebtItem, CustomDebtType } from '../types';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round((amount || 0) * 100) / 100;
  return '$' + rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatDateStr(dStr?: string): string {
  if (!dStr) return '-';
  const p = dStr.split('-');
  if (p.length !== 3) return dStr;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

export function getDateInMonth(year: number, month: number, day: number): string {
  const maxDays = new Date(year, month + 1, 0).getDate();
  const validDay = Math.min(Math.max(1, day), maxDays);
  const mStr = String(month + 1).padStart(2, '0');
  const dStr = String(validDay).padStart(2, '0');
  return `${year}-${mStr}-${dStr}`;
}

export function advanceDateFreq(curr: Date, freq: string, dueDay?: string | number): void {
  if (freq === 'weekly') {
    curr.setDate(curr.getDate() + 7);
    if (dueDay !== undefined) {
      const targetDay = parseInt(String(dueDay), 10);
      if (!isNaN(targetDay) && targetDay >= 0 && targetDay <= 6) {
        const currentDay = curr.getDay();
        const diff = targetDay - currentDay;
        curr.setDate(curr.getDate() + diff);
      }
    }
  } else if (freq === 'biweekly') {
    const parts = String(dueDay || '15-30').split('-');
    const v1 = parseInt(parts[0], 10) || 15;
    const v2 = parts[1] || '30';
    const d = curr.getDate();
    const m = curr.getMonth();
    const limitV2 = (v2 === '30' || v2 === 'EOM') ? 28 : parseInt(v2, 10);

    if (d < v1) {
      curr.setDate(v1);
    } else if (d >= v1 && d < limitV2) {
      if (v2 === '30' || v2 === 'EOM') {
        curr.setMonth(m + 1, 0);
      } else {
        curr.setDate(parseInt(v2, 10));
      }
    } else {
      curr.setDate(1);
      curr.setMonth(m + 1);
      curr.setDate(v1);
    }
  } else if (freq === 'triweekly') {
    // Treat as a specific week of the month (1, 2, 3, or 4) mapped to 7, 14, 21, 28
    const week = parseInt(String(dueDay || '1'), 10);
    const targetDay = week * 7;
    const m = curr.getMonth();
    curr.setMonth(m + 1, targetDay);
    if (curr.getMonth() !== (m + 1) % 12) {
      curr.setDate(0);
    }
  } else {
    const targetDay = parseInt(String(dueDay || curr.getDate()), 10);
    curr.setDate(1);
    curr.setMonth(curr.getMonth() + 1);
    const maxDays = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
    curr.setDate(Math.min(targetDay, maxDays));
  }
}

export function datesBetween(start: string, end: string): string[] {
  const result: string[] = [];
  const startP = start.split('-').map(Number);
  const endP = end.split('-').map(Number);
  if (startP.length !== 3 || endP.length !== 3) return result;

  const curr = new Date(startP[0], startP[1] - 1, startP[2], 12, 0, 0);
  const last = new Date(endP[0], endP[1] - 1, endP[2], 12, 0, 0);

  while (curr <= last) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    result.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return result;
}

export function getRemainingDebtAmount(debt: DebtItem, overrides: Record<string, any> = {}): number {
  const amortized = parseFloat(String(debt.amortized || 0));
  let rem = (parseFloat(String(debt.balance || 0))) - amortized;
  const defaultPay = parseFloat(String(debt.minPay || debt.amount || 0));

  Object.keys(overrides).forEach(k => {
    if (k.startsWith(`debt_${debt.id}_`)) {
      const ov = overrides[k];
      const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + (parseFloat(String(pt.amt)) || 0), 0);

      if (ov.done || ov.discarded) {
        const finalAmt = ov.amt !== undefined ? parseFloat(String(ov.amt)) : Math.max(0, defaultPay - partialsSum);
        rem -= (finalAmt + partialsSum);
      } else {
        rem -= partialsSum;
      }
    }
  });

  return rem < 0 ? 0 : Math.round(rem * 100) / 100;
}

/**
 * Calculates day-by-day cash flow projections for a given UserProfile
 */
export function calculateProjections(profile: UserProfile, exchangeRates: Record<string, number> = {}): PlanOccurrence[] {
  const convAmt = (amt: number, currency?: string) => {
    if (!currency || currency === 'USD_BCV') return amt;
    const rate = exchangeRates[currency];
    return rate ? amt * rate : amt;
  };

  if (!profile || !profile.settings) return [];

  const settings = profile.settings;
  const startD = settings.planStart || todayStr();
  const endD = settings.planEnd || new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10);
  const overrides = profile.overrides || {};

  const map: Record<string, any[]> = {};
  let balance = settings.openingBalance || 0;

  const startYear = new Date(startD + 'T12:00:00').getFullYear();
  const startMonth = new Date(startD + 'T12:00:00').getMonth();
  const endYear = new Date(endD + 'T12:00:00').getFullYear();
  const endMonth = new Date(endD + 'T12:00:00').getMonth();

  const addOccurrence = (
    dateStr: string,
    label: string,
    type: string,
    amt: number,
    ref: any
  ) => {
    const key = `${type}_${ref.id}_${dateStr}`;
    if (overrides[key] && overrides[key].discarded) return;

    let done = overrides[key] ? !!overrides[key].done : false;
    const finalDate = (overrides[key] && overrides[key].actualDate) ? overrides[key].actualDate : dateStr;
    const userPostponed = overrides[key] ? !!overrides[key].userPostponed : false;
    const partials = (overrides[key] && overrides[key].partials) ? overrides[key].partials : [];

    const plannedAmt = Math.abs(amt);
    let remainingAmt = plannedAmt;
    let totalPaidInPartials = 0;

    partials.forEach((pt: any) => {
      totalPaidInPartials += parseFloat(pt.amt || 0);
      if (pt.date >= startD && pt.date <= endD) {
        if (!map[pt.date]) map[pt.date] = [];
        map[pt.date].push({
          label: `${label} (Abono ✓)`,
          type,
          amt: amt > 0 ? pt.amt : -pt.amt,
          ref,
          originalDate: dateStr,
          done: true,
          isPartial: true,
          userPostponed: false,
          plannedAmt,
        });
      }
      remainingAmt -= pt.amt;
    });

    let finalPaymentAmt = remainingAmt;
    if (done && overrides[key].amt !== undefined) {
      finalPaymentAmt = parseFloat(String(overrides[key].amt));
    }

    if (!done && finalPaymentAmt <= 0.01) {
      done = true;
      finalPaymentAmt = 0;
    }

    if (finalPaymentAmt > 0 || done) {
      if (finalPaymentAmt <= 0 && totalPaidInPartials >= plannedAmt) return;

      const totalPaidForInstallment = totalPaidInPartials + (done ? finalPaymentAmt : 0);
      let extraLabel = '';

      if (done && totalPaidForInstallment < plannedAmt - 0.01) {
        extraLabel = ` (Ahorraste ${formatCurrency(plannedAmt - totalPaidForInstallment)})`;
      } else if (done && totalPaidForInstallment > plannedAmt + 0.01) {
        extraLabel = ` (+${formatCurrency(totalPaidForInstallment - plannedAmt)} Extra)`;
      }

      const occurrence = {
        label: label + (done ? ` (✓)${extraLabel}` : (partials.length > 0 ? ' (Restante)' : '')),
        type,
        amt: amt > 0 ? finalPaymentAmt : -finalPaymentAmt,
        ref,
        originalDate: dateStr,
        done,
        userPostponed,
        plannedAmt,
      };

      if (finalDate >= startD && finalDate <= endD) {
        if (!map[finalDate]) map[finalDate] = [];
        map[finalDate].push(occurrence);
      } else if (finalDate < startD && !done) {
        occurrence.originalDate = dateStr;
        if (!map[startD]) map[startD] = [];
        map[startD].push(occurrence);
      }
    }
  };

  // 1. Process Incomes
  (profile.incomes || []).forEach(inc => {
    if (inc.freq === 'one-time') {
      if (inc.date && inc.date >= startD && inc.date <= endD) {
        addOccurrence(inc.date, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
      }
    } else if (inc.freq === 'monthly') {
      for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        for (let m = mStart; m <= mEnd; m++) {
          const d = getDateInMonth(y, m, Number(inc.day || 1));
          if (d >= startD && d <= endD) addOccurrence(d, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
        }
      }
    } else if (inc.freq === 'biweekly') {
      const parts = String(inc.day || '15-30').split('-');
      const v1 = parseInt(parts[0], 10) || 15;
      const v2 = parts[1];
      for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        for (let m = mStart; m <= mEnd; m++) {
          const d1 = getDateInMonth(y, m, v1);
          const d2 = (v2 === '30' || v2 === 'EOM')
            ? new Date(y, m + 1, 0).toISOString().slice(0, 10)
            : getDateInMonth(y, m, parseInt(v2, 10));
          if (d1 >= startD && d1 <= endD) addOccurrence(d1, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
          if (d2 >= startD && d2 <= endD) addOccurrence(d2, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
        }
      }
    } else if (inc.freq === 'weekly') {
      const curr = new Date(startD + 'T12:00:00');
      const targetDow = parseInt(String(inc.day || 0), 10);
      while (curr.getDay() !== targetDow) {
        curr.setDate(curr.getDate() + 1);
      }
      const limit = new Date(endD + 'T12:00:00');
      while (curr <= limit) {
        const dateStr = curr.toISOString().slice(0, 10);
        if (dateStr >= startD && dateStr <= endD) {
          addOccurrence(dateStr, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
        }
        curr.setDate(curr.getDate() + 7);
      }
    }
  });

  // 2. Process Expenses
  (profile.expenses || []).forEach(exp => {
    const endLimit = exp.end || endD;
    if (exp.freq === 'one-time') {
      if (exp.date && exp.date >= startD && exp.date <= endLimit) {
        addOccurrence(exp.date, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
      }
    } else if (exp.freq === 'monthly') {
      for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        for (let m = mStart; m <= mEnd; m++) {
          const d = getDateInMonth(y, m, Number(exp.day || 1));
          if (d >= startD && d <= endLimit) addOccurrence(d, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
        }
      }
    } else if (exp.freq === 'biweekly') {
      const parts = String(exp.day || '15-30').split('-');
      const v1 = parseInt(parts[0], 10) || 15;
      const v2 = parts[1];
      for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        for (let m = mStart; m <= mEnd; m++) {
          const d1 = getDateInMonth(y, m, v1);
          const d2 = (v2 === '30' || v2 === 'EOM')
            ? new Date(y, m + 1, 0).toISOString().slice(0, 10)
            : getDateInMonth(y, m, parseInt(v2, 10));
          if (d1 >= startD && d1 <= endLimit) addOccurrence(d1, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
          if (d2 >= startD && d2 <= endLimit) addOccurrence(d2, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
        }
      }
    } else if (exp.freq === 'weekly') {
      const curr = new Date(startD + 'T12:00:00');
      const targetDow = parseInt(String(exp.day || 0), 10);
      while (curr.getDay() !== targetDow) {
        curr.setDate(curr.getDate() + 1);
      }
      const limit = new Date(endLimit + 'T12:00:00');
      while (curr <= limit) {
        const dateStr = curr.toISOString().slice(0, 10);
        if (dateStr >= startD && dateStr <= endLimit) {
          addOccurrence(dateStr, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
        }
        curr.setDate(curr.getDate() + 7);
      }
    }
  });

  // 3. Process Debts
  const customDebts = settings.customDebts || [];
  (profile.debts || []).forEach(debt => {
    const customDef = customDebts.find(c => c.id === debt.type);
    const isStandardDebt = debt.type !== 'card';

    const effectiveColor = debt.color || (customDef ? customDef.color : (debt.type === 'fixed' ? '#1a73e8' : (debt.type === 'noloan' ? '#00897b' : '#d93025')));
    const debtRef = { ...debt, effectiveColor };

    if (customDef || isStandardDebt) {
      if (!debt.start || !debt.amount) return;
      const curr = new Date(debt.start + 'T12:00:00');
      const limitDate = debt.end ? new Date(debt.end + 'T12:00:00') : new Date(endD + 'T12:00:00');

      const freq = debt.freq || (customDef ? customDef.freq : 'monthly');
      const pay = convAmt(parseFloat(String(debt.amount || 0)), (debt as any).currency);
      let totalDebt = convAmt(parseFloat(String(debt.balance || 0)), (debt as any).currency);

      // If this debt has an APR, we assume the `pay` amount already includes interest (calculated at creation).
      // Therefore, the true total debt is simply pay * installments.
      const hasInt = debt.hasInterest || (customDef && customDef.hasInterest);
      if (hasInt && debt.apr) {
        const inst = debt.installments || 1;
        totalDebt = pay * inst;
      }

      let accumulated = 0;
      const amortized = parseFloat(String(debt.amortized || 0));

      for (let safety = 0; safety < 999; safety++) {
        if (totalDebt > 0 && accumulated >= totalDebt - 0.01) break;
        if (curr > limitDate) break;

        const dateStr = curr.toISOString().slice(0, 10);
        const key = `debt_${debt.id}_${dateStr}`;
        const ov = overrides[key] || {};

        let currentPay = pay;
        if (totalDebt > 0 && accumulated + currentPay > totalDebt) {
          currentPay = totalDebt - accumulated;
        }

        const coveredByAmort = (amortized > accumulated) ? Math.min(currentPay, amortized - accumulated) : 0;
        const requiredPay = currentPay - coveredByAmort;

        let effectivePayToAccumulate = requiredPay;
        if (ov.done && ov.amt !== undefined) {
          effectivePayToAccumulate = convAmt(parseFloat(String(ov.amt)), (debt as any).currency);
          const partialsSum = convAmt((ov.partials || []).reduce((sum: number, pt: any) => sum + parseFloat(String(pt.amt || 0)), 0), (debt as any).currency);
          effectivePayToAccumulate += partialsSum;
        }

        let excessOverTotal = 0;
        if (totalDebt > 0 && accumulated + coveredByAmort + effectivePayToAccumulate > totalDebt) {
          excessOverTotal = (accumulated + coveredByAmort + effectivePayToAccumulate) - totalDebt;
          effectivePayToAccumulate = totalDebt - accumulated - coveredByAmort;
        }

        if (requiredPay > 0.01) {
          addOccurrence(dateStr, debt.name, 'debt', -requiredPay, debtRef);
          if (excessOverTotal > 0.01) {
            addOccurrence(dateStr, `${debt.name} (Exceso pagado)`, 'expense', -excessOverTotal, debtRef);
          }
        }

        accumulated += (coveredByAmort + effectivePayToAccumulate);
        advanceDateFreq(curr, freq, debt.dueDay);
      }
    } else if (debt.type === 'card') {
      const pay = parseFloat(String(debt.minPay || debt.balance || 0));
      const maxOccurrences = debt.installments ? parseInt(String(debt.installments), 10) : (debt.plan === 'full' ? 1 : (parseInt(String(debt.plan || '').split('-')[1], 10) || 1));
      let occurrences = 0;

      const debtStartStr = debt.start || startD;
      const dStart = new Date(debtStartStr + 'T12:00:00');
      const dStartYear = dStart.getFullYear();
      const dStartMonth = dStart.getMonth();

      for (let y = dStartYear; y <= endYear; y++) {
        const mStart = (y === dStartYear) ? dStartMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        for (let m = mStart; m <= mEnd; m++) {
          if (occurrences >= maxOccurrences) break;
          if (debt.cutDay) {
            const cutDate = getDateInMonth(y, m, debt.cutDay);
            if (cutDate >= debtStartStr) addOccurrence(cutDate, `Corte: ${debt.name}`, 'debt_cut', 0, debtRef);
          }
          if (debt.dueDay) {
            const dueDate = getDateInMonth(y, m, Number(debt.dueDay));
            if (dueDate >= debtStartStr) {
              addOccurrence(dueDate, `Pago: ${debt.name}`, 'debt', -pay, debtRef);
              occurrences++;
            }
          }
        }
        if (occurrences >= maxOccurrences) break;
      }
    }
  });

  // 4. Process Savings
  (profile.savingsList || []).forEach(sav => {
    if (sav.date >= startD && sav.date <= endD) {
      addOccurrence(sav.date, `Divisa/Ahorro: ${sav.person}`, 'savings', -convAmt(sav.amount, (sav as any).currency), sav);
    }
  });

  // 5. Day-by-Day Cash Flow Simulation with Liquidity Cushion
  const plan: PlanOccurrence[] = [];
  let delayedItems: any[] = [];

  for (const d of datesBetween(startD, endD)) {
    const dayEvents = map[d] || [];
    const todayCandidates = [...dayEvents, ...delayedItems];
    delayedItems = [];

    todayCandidates.sort((a, b) => b.amt - a.amt);

    const applied: any[] = [];
    let pendingBal = balance;
    const remainingCandidates: any[] = [];
    let hasIncomeToday = false;

    todayCandidates.forEach(e => {
      if (e.amt >= 0 || e.done) {
        if (e.amt > 0 && e.type === 'income' && !e.done) hasIncomeToday = true;
        applied.push(e);
        pendingBal += e.amt;
      } else {
        remainingCandidates.push(e);
      }
    });

    remainingCandidates.forEach(e => {
      if (pendingBal + e.amt >= (settings.minBalance || 0)) {
        applied.push(e);
        pendingBal += e.amt;
      } else {
        if (hasIncomeToday) e.missedIncomes = (e.missedIncomes || 0) + 1;
        delayedItems.push(e);
      }
    });

    applied.forEach(e => {
      balance += e.amt;
      const isDelayed = !!(e.originalDate && e.originalDate < d && !e.done);
      plan.push({
        date: d,
        ...e,
        balance,
        isDelayed,
        criticalDelay: (e.missedIncomes || 0) > 2,
      });
    });
  }

  if (delayedItems.length > 0) {
    const lastDate = endD;
    delayedItems.forEach(e => {
      balance += e.amt;
      plan.push({
        date: lastDate,
        ...e,
        balance,
        isDelayed: true,
        criticalDelay: (e.missedIncomes || 0) > 2,
      });
    });
  }

  return plan;
}

/**
 * Calculates optimal debt settlements for a shared expense group
 */
export function calculateSharedSettlement(acc: SharedGroup) {
  const participants = acc.participants || [];
  const n = participants.length;
  let total = 0;
  const paid: Record<string, number> = {};

  participants.forEach(p => (paid[p] = 0));

  (acc.expenses || []).forEach(e => {
    const amt = parseFloat(String(e.amount || 0));
    total += amt;
    paid[e.paidBy] = (paid[e.paidBy] || 0) + amt;
  });

  const should: Record<string, number> = {};
  if (acc.splitType === 'percentage') {
    const pcts = acc.percentages || {};
    participants.forEach(p => {
      const pct = parseFloat(String(pcts[p] || (100 / n)));
      should[p] = total * (pct / 100);
    });
  } else {
    participants.forEach(p => {
      should[p] = n > 0 ? total / n : 0;
    });
  }

  const balances = participants.map(p => ({
    name: p,
    bal: (paid[p] || 0) - (should[p] || 0),
  }));

  const debtors = balances.filter(x => x.bal < -0.01).sort((a, b) => a.bal - b.bal);
  const creditors = balances.filter(x => x.bal > 0.01).sort((a, b) => b.bal - a.bal);

  const dArr = debtors.map(x => ({ name: x.name, bal: Math.abs(x.bal) }));
  const cArr = creditors.map(x => ({ name: x.name, bal: x.bal }));
  const transfers: Array<{ from: string; to: string; amount: number }> = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < dArr.length && cIdx < cArr.length) {
    const debtor = dArr[dIdx];
    const creditor = cArr[cIdx];
    const amount = Math.min(debtor.bal, creditor.bal);

    if (amount > 0.01) {
      transfers.push({ from: debtor.name, to: creditor.name, amount });
    }

    debtor.bal -= amount;
    creditor.bal -= amount;

    if (debtor.bal <= 0.01) dIdx++;
    if (creditor.bal <= 0.01) cIdx++;
  }

  return { total, paid, should, transfers };
}
