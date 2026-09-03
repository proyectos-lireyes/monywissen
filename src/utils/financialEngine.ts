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

export function snapDateFreq(curr: Date, freq: string, dueDay?: string | number): void {
  const d = curr.getDate();
  const m = curr.getMonth();

  if (freq === 'biweekly' && (dueDay === 'exact_14' || dueDay === 'exact_15')) return;

  if (freq === 'biweekly' && (dueDay === 'exact_14' || dueDay === 'exact_15')) return;
  if (freq === 'monthly') {
    const targetDay = parseInt(String(dueDay || '1'), 10);
    if (d < targetDay) {
      curr.setDate(targetDay);
    } else if (d > targetDay) {
      curr.setMonth(m + 1, targetDay);
    }
  } else if (freq === 'biweekly') {
    const parts = String(dueDay || '15-30').split('-');
    const v1 = parseInt(parts[0], 10) || 15;
    const v2 = parts[1] || '30';
    
    let v2Date = 30;
    const temp = new Date(curr.getTime());
    if (v2 === '30' || v2 === 'EOM') {
        temp.setMonth(m + 1, 0);
        v2Date = temp.getDate();
    } else {
        v2Date = parseInt(v2, 10);
    }

    if (d < v1) {
        curr.setDate(v1);
    } else if (d > v1 && d < v2Date) {
        if (v2 === '30' || v2 === 'EOM') {
            curr.setMonth(m + 1, 0);
        } else {
            curr.setDate(v2Date);
        }
    } else if (d > v2Date) {
        curr.setDate(1);
        curr.setMonth(m + 1);
        curr.setDate(v1);
    }
  } else if (freq === 'weekly') {
    if (dueDay !== undefined) {
      const targetDay = parseInt(String(dueDay), 10);
      if (!isNaN(targetDay) && targetDay >= 0 && targetDay <= 6) {
        const currentDay = curr.getDay();
        if (currentDay !== targetDay) {
          let diff = targetDay - currentDay;
          if (diff < 0) diff += 7;
          curr.setDate(curr.getDate() + diff);
        }
      }
    }
  } else if (freq === 'triweekly') {
    const week = parseInt(String(dueDay || '1'), 10);
    const targetDay = week * 7;
    if (d < targetDay) {
        curr.setDate(targetDay);
    } else if (d > targetDay) {
        curr.setMonth(m + 1, targetDay);
    }
  }
}

export function advanceDateFreq(curr: Date, freq: string, dueDay?: string | number): void {
  if (freq === 'biweekly' && dueDay === 'exact_14') {
    curr.setDate(curr.getDate() + 14);
    return;
  }
  if (freq === 'biweekly' && dueDay === 'exact_15') {
    curr.setDate(curr.getDate() + 15);
    return;
  }
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

export function getAmtInDebtCurrency(debt: DebtItem, amtUsd: number, rawAmt?: number, payCurr?: string, exchangeRates?: Record<string, number>): number {
  if (rawAmt !== undefined && (!payCurr || payCurr === debt.currency)) return parseFloat(String(rawAmt));
  if (exchangeRates && debt.currency && debt.currency !== 'USD_BCV') {
     const rate = exchangeRates[debt.currency];
     if (rate) return amtUsd / rate;
  }
  return amtUsd;
}

export function getDebtTotalPaid(debt: DebtItem, overrides: Record<string, any> = {}, exchangeRates?: Record<string, number>): number {
  let paid = 0; // Amortization is now a down payment and reduces principal upfront, so we don't count it as paid installments
  const defaultPay = parseFloat(String(debt.minPay || debt.amount || 0));
  

  Object.keys(overrides).forEach(k => {
    if (k.startsWith(`debt_${debt.id}_`)) {
      const ov = overrides[k];
      const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + getAmtInDebtCurrency(debt, parseFloat(String(pt?.amt)) || 0, pt.rawAmt, pt.currency, exchangeRates), 0);
      
      if (ov.done || ov.discarded) {
        const amtUsd = ov.amt !== undefined ? parseFloat(String(ov.amt)) : undefined;
        let finalAmt = 0;
        if (amtUsd !== undefined) {
           finalAmt = getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates);
        } else {
           finalAmt = Math.max(0, defaultPay - partialsSum);
        }
        paid += (finalAmt + partialsSum);
      } else {
        paid += partialsSum;
      }
    }
  });
  return Math.round(paid * 100) / 100;
}


export interface AmortizationInstallment {
  index: number;
  date: string;
  key: string;
  expectedAmount: number;
  isPaid: boolean;
  paidAmount: number;
  paidCurrency: string;
  ov: any;
  isCoveredBySequential: boolean;
  isCoveredByExplicit: boolean;
  requiredPay: number;
}

export function calculateAmortizationPlan(
  debt: any,
  overrides: Record<string, any> = {},
  customDebts: any[] = [],
  limitDate?: Date,
  exchangeRates?: Record<string, number>
): AmortizationInstallment[] {
  const customDef = customDebts.find(c => c.id === debt.type);
  const isCard = debt.type === 'card' || debt.type.startsWith('tdc_');
  const freq = debt.freq || (customDef ? customDef.freq : 'monthly');
  const dueDay = debt.dueDay || (customDef ? customDef.dueDay : '1');

  let initialTotalDebt = parseFloat(String(debt.balance || 0));
  const amort = parseFloat(String(debt.amortized || 0));
  const inst = parseInt(String(debt.installments || 1), 10);
  const hasInt = debt.hasInterest || (customDef && customDef.hasInterest);
  
  // Amortization (down payment) reduces the principal to be financed
  initialTotalDebt = Math.max(0, initialTotalDebt - amort);
  
  let pay = initialTotalDebt / inst;
  let lifetimeTotal = initialTotalDebt;
  
  if (hasInt && debt.apr && parseFloat(String(debt.apr)) > 0) {
    const r = (parseFloat(String(debt.apr)) / 100) / 12;
    const isBiweekly = freq === 'biweekly';
    const instMonths = isBiweekly ? inst / 2 : inst;
    const monthlyPay = initialTotalDebt * (r * Math.pow(1 + r, instMonths)) / (Math.pow(1 + r, instMonths) - 1);
    pay = isBiweekly ? monthlyPay / 2 : monthlyPay;
    lifetimeTotal = pay * inst;
  }

  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  
  let unallocatedPaid = totalPaid; // We use totalPaid to sequentially cover any cuotas that don't have explicit payments (e.g. orphaned payments)
  let remainingPrincipal = lifetimeTotal - totalPaid;

  let curr = new Date((debt.start || todayStr()) + 'T12:00:00');
  
  if (freq !== 'one-time') {
    // Just snap to the nearest valid due date
        snapDateFreq(curr, freq, dueDay);
  }

  const cuotas: AmortizationInstallment[] = [];
  let i = 0;
  const maxIterations = 999;
  const seenKeys = new Set<string>();
  let currentShiftDays = 0;
  while (i < maxIterations) {
    if (limitDate && curr > limitDate) break;

    let dateStr = curr.toISOString().slice(0, 10);
    let key = `debt_${debt.id}_${dateStr}`;
    
    let failSafe = 0;
    while (seenKeys.has(key) && failSafe < 100) {
      advanceDateFreq(curr, freq, dueDay);
      dateStr = curr.toISOString().slice(0, 10);
      key = `debt_${debt.id}_${dateStr}`;
      failSafe++;
    }
    if (failSafe >= 100) break;

    seenKeys.add(key);

    const ov = overrides[key] || {};
    
    let expectedAmount = pay;
    if (ov.plannedAmt !== undefined) {
      expectedAmount = getAmtInDebtCurrency(debt, parseFloat(String(ov.plannedAmt)), ov.rawPayAmount, ov.payCurrency, exchangeRates);
    }
    let isPaid = false;
    let paidAmt = 0;
    let isCoveredByExplicit = false;
    let isCoveredBySequential = false;
    let requiredPay = 0;
    
    const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + getAmtInDebtCurrency(debt, parseFloat(String(pt?.amt)) || 0, pt.rawAmt, pt.currency, exchangeRates), 0);
    
    if (ov.done || ov.discarded) {
      isPaid = true;
      isCoveredByExplicit = true;
      const amtUsd = ov.amt !== undefined ? parseFloat(String(ov.amt)) : undefined;
      const finalAmt = amtUsd !== undefined ? getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates) : Math.max(0, pay - partialsSum);
      paidAmt = finalAmt + partialsSum;
      expectedAmount = Math.max(pay, paidAmt);
      unallocatedPaid -= paidAmt;
    } else {
      if (unallocatedPaid > 0) {
        const canCover = Math.min(pay, unallocatedPaid);
        if (canCover >= pay - 0.01) {
          isPaid = true;
          isCoveredBySequential = true;
          paidAmt = canCover;
          unallocatedPaid -= canCover;
        } else {
          paidAmt = canCover;
          unallocatedPaid -= canCover;
        }
      }
      
      paidAmt += partialsSum;
      
      if (paidAmt >= pay - 0.01) {
        isPaid = true;
      } else {
        requiredPay = Math.min(pay - paidAmt, Math.max(0, remainingPrincipal));
        if (requiredPay < 0.01) {
          requiredPay = 0;
        }
        expectedAmount = paidAmt + requiredPay;
        remainingPrincipal -= requiredPay;
      }
    }
    
    if (!isPaid && expectedAmount <= 0) {
      break; 
    }
    
    if (isCard && i >= inst) break;

    let finalDate = dateStr;
    if (ov.userPostponed && ov.actualDate) {
      finalDate = ov.actualDate;
      const d1 = new Date(dateStr + 'T12:00:00');
      const d2 = new Date(finalDate + 'T12:00:00');
      currentShiftDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    } else if (currentShiftDays !== 0) {
      const d1 = new Date(dateStr + 'T12:00:00');
      d1.setDate(d1.getDate() + currentShiftDays);
      finalDate = d1.toISOString().slice(0, 10);
    }

    cuotas.push({
      index: i + 1,
      date: finalDate,
      key,
      expectedAmount,
      isPaid,
      paidAmount: isPaid ? paidAmt : (partialsSum > 0 ? partialsSum : 0),
      paidCurrency: ov.payCurrency || debt.currency || 'USD_BCV',
      ov,
      isCoveredBySequential,
      isCoveredByExplicit,
      requiredPay
    });

    // curr remains unchanged by user postponed date to keep schedule keys stable

    advanceDateFreq(curr, freq, dueDay);
    i++;
  }

  return cuotas;
}

export function getRemainingDebtAmount(debt: DebtItem, overrides: Record<string, any> = {}, exchangeRates?: Record<string, number>): number {
  let totalDebt = parseFloat(String(debt.balance || 0));
  const amort = parseFloat(String(debt.amortized || 0));
  totalDebt = Math.max(0, totalDebt - amort);
  const inst = debt.installments || 1;
  
  // Custom debt checking for interest is handled safely here if we can
  // But wait, the function doesn't have customDebts! 
  // Let's just do a math recalculation if apr exists.
  if (debt.hasInterest && debt.apr && parseFloat(String(debt.apr)) > 0) {
    const r = (parseFloat(String(debt.apr)) / 100) / 12;
    const pay = totalDebt * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
    totalDebt = pay * inst;
  }
  const rem = totalDebt - getDebtTotalPaid(debt, overrides, exchangeRates);
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
  const itemShifts: Record<string, number> = {};
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

    let done = overrides[key] ? !!overrides[key].done : (type === 'savings' && ref.status === 'completed');
    
    let finalDate = dateStr;
    const ov = overrides[key];
    const userPostponed = ov ? !!ov.userPostponed : false;
    
    if (userPostponed && ov.actualDate) {
      finalDate = ov.actualDate;
      const d1 = new Date(dateStr + 'T12:00:00');
      const d2 = new Date(finalDate + 'T12:00:00');
      itemShifts[ref.id] = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    } else if (itemShifts[ref.id]) {
      const d1 = new Date(dateStr + 'T12:00:00');
      d1.setDate(d1.getDate() + itemShifts[ref.id]);
      finalDate = d1.toISOString().slice(0, 10);
    }
    const partials = (overrides[key] && overrides[key].partials) ? overrides[key].partials : [];

    let effectiveColor = ref.color;
    if (!effectiveColor && type === 'debt' && profile.settings && profile.settings.customDebts) {
       const cd = profile.settings.customDebts.find((d: any) => d.id === ref.type);
       if (cd && cd.color) effectiveColor = cd.color;
    }

    const safeRef = { ...ref, effectiveColor };

    const plannedAmt = Math.abs(amt);
    let remainingAmt = plannedAmt;
    let totalPaidInPartials = 0;

    partials.forEach((pt: any) => {
      if (!pt) return;
      totalPaidInPartials += parseFloat(pt.amt || 0);
      if (pt.date >= startD && pt.date <= endD) {
        if (!map[pt.date]) map[pt.date] = [];
        map[pt.date].push({
          label: `${label} (Abono ✓)`,
          type,
          amt: amt > 0 ? pt.amt : -pt.amt,
          ref: safeRef,
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
    if (done && overrides[key] && overrides[key].amt !== undefined) {
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
        ref: safeRef,
        originalDate: dateStr,
        targetDate: finalDate,
        done,
        userPostponed,
        plannedAmt,
      };

      if (finalDate >= startD && finalDate <= endD) {
        if (!map[finalDate]) map[finalDate] = [];
        map[finalDate].push(occurrence);
      }
    }
  };

  // 1. Process Incomes
  (profile.incomes || []).forEach(inc => {
    const itemStart = inc.start || inc.date || startD;
    const itemEnd = inc.end || endD;
    const effStart = itemStart > startD ? itemStart : startD;
    const effEnd = itemEnd < endD ? itemEnd : endD;

    if (inc.freq === 'one-time') {
      if (inc.date && inc.date >= effStart && inc.date <= effEnd) {
        addOccurrence(inc.date, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
      }
    } else if (inc.freq === 'monthly') {
      for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        for (let m = mStart; m <= mEnd; m++) {
          const d = getDateInMonth(y, m, Number(inc.day || 1));
          if (d >= effStart && d <= effEnd) addOccurrence(d, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
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
          if (d1 >= effStart && d1 <= effEnd) addOccurrence(d1, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
          if (d2 >= effStart && d2 <= effEnd) addOccurrence(d2, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
        }
      }
    } else if (inc.freq === 'weekly') {
      const curr = new Date(effStart + 'T12:00:00');
      const targetDow = parseInt(String(inc.day || 0), 10);
      while (curr.getDay() !== targetDow) {
        curr.setDate(curr.getDate() + 1);
      }
      const limit = new Date(effEnd + 'T12:00:00');
      while (curr <= limit) {
        const dateStr = curr.toISOString().slice(0, 10);
        if (dateStr >= effStart && dateStr <= effEnd) {
          addOccurrence(dateStr, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
        }
        curr.setDate(curr.getDate() + 7);
      }
    }
  });

  // 2. Process Expenses
  (profile.expenses || []).forEach(exp => {
    const itemStart = exp.start || exp.date || startD;
    const itemEnd = exp.end || endD;
    const effStart = itemStart > startD ? itemStart : startD;
    const effEnd = itemEnd < endD ? itemEnd : endD;

    if (exp.freq === 'one-time') {
      if (exp.date && exp.date >= effStart && exp.date <= effEnd) {
        addOccurrence(exp.date, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
      }
    } else if (exp.freq === 'monthly') {
      for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        for (let m = mStart; m <= mEnd; m++) {
          const d = getDateInMonth(y, m, Number(exp.day || 1));
          if (d >= effStart && d <= effEnd) addOccurrence(d, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
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
          if (d1 >= effStart && d1 <= effEnd) addOccurrence(d1, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
          if (d2 >= effStart && d2 <= effEnd) addOccurrence(d2, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
        }
      }
    } else if (exp.freq === 'weekly') {
      const curr = new Date(effStart + 'T12:00:00');
      const targetDow = parseInt(String(exp.day || 0), 10);
      while (curr.getDay() !== targetDow) {
        curr.setDate(curr.getDate() + 1);
      }
      const limit = new Date(effEnd + 'T12:00:00');
      while (curr <= limit) {
        const dateStr = curr.toISOString().slice(0, 10);
        if (dateStr >= effStart && dateStr <= effEnd) {
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
    const effectiveColor = debt.color || (customDef ? customDef.color : (debt.type === 'fixed' ? '#1a73e8' : (debt.type === 'noloan' ? '#00897b' : '#d93025')));
    const debtRef = { ...debt, effectiveColor };

    if (!debt.start || !debt.amount) return;
    
    // Optional Cut day logic
    if ((debt.type === 'card' || debt.type.startsWith('tdc_')) && debt.cutDay) {
      const dStart = new Date((debt.start || startD) + 'T12:00:00');
      for (let y = dStart.getFullYear(); y <= endYear; y++) {
        for (let m = (y === dStart.getFullYear() ? dStart.getMonth() : 0); m <= (y === endYear ? endMonth : 11); m++) {
           const cutDate = getDateInMonth(y, m, debt.cutDay);
           if (cutDate >= (debt.start || startD) && cutDate <= endD) {
              addOccurrence(cutDate, `Corte: ${debt.name}`, 'debt_cut', 0, debtRef);
           }
        }
      }
    }

    const curr = new Date(debt.start + 'T12:00:00');
    const limitDate = debt.end ? new Date(debt.end + 'T12:00:00') : new Date(endD + 'T12:00:00');

    const plan = calculateAmortizationPlan(debt, overrides, customDebts, limitDate, exchangeRates);
    
    plan.forEach(cuota => {
      const expectedNative = cuota.expectedAmount;
      const requiredNative = cuota.requiredPay;

      if (cuota.isCoveredByExplicit) {
        addOccurrence(cuota.date, debt.name, 'debt', -convAmt(expectedNative, (debt as any).currency), debtRef);
      } else if (requiredNative > 0.01) {
        addOccurrence(cuota.date, debt.name, 'debt', -convAmt(requiredNative, (debt as any).currency), debtRef);
      }
    });
  });

  // 4. Process Savings
  (profile.savingsList || []).forEach(sav => {
    if (sav.date >= startD && sav.date <= endD) {
      addOccurrence(sav.date, `Divisa/Ahorro: ${sav.person}`, 'savings', -convAmt(sav.amount, (sav as any).currency), { ...sav, strictDate: true });
    }
  });



  // 5. Day-by-Day Cash Flow Simulation with forward-first optimization model
  const plan: PlanOccurrence[] = [];
  let delayedItems: any[] = [];
  let savingsAccumulated = (profile.savings?.current || 0) + (profile.savings?.digital || 0);
  let futureEvents: any[] = [];
  
  const allDatesList = datesBetween(startD, endD);
  
  let autoCalculatedStart = false;
  // If openingBalance is exactly 0 or undefined/null, we run the deficit calculator
  if (settings.openingBalance !== undefined && settings.openingBalance !== null && settings.openingBalance !== 0) {
    balance = settings.openingBalance;
  } else {
    balance = 0;
    
    // Find the first income date
    let firstIncomeDate = null;
    for (const d of allDatesList) {
        const dayEvents = map[d] || [];
        if (dayEvents.some(e => (e?.amt || 0) > 0 && e?.type === 'income')) {
            firstIncomeDate = d;
            break;
        }
    }
    
    // Calculate deficit before first income (or up to 45 days if no income)
    let simBalance = 0;
    let minSimBalance = 0;
    let daysSearched = 0;
    
    for (const d of allDatesList) {
        if (daysSearched > 45) break;
        if (firstIncomeDate && d > firstIncomeDate) break; // only look BEFORE or ON first income
        
        daysSearched++;
        const dayEvents = map[d] || [];
        let dayExpense = 0;
        let dayIncome = 0;
        
        for (const e of dayEvents) {
            if ((e?.amt || 0) < 0 && e?.type !== 'savings') {
                dayExpense += e.amt;
            } else if ((e?.amt || 0) > 0) {
                dayIncome += e.amt;
            }
        }
        
        simBalance += dayExpense;
        if (simBalance < minSimBalance) minSimBalance = simBalance;
        simBalance += dayIncome;
        if (dayIncome > 0) break; 
    }
    
    const requiredInitial = Math.abs(minSimBalance) + (settings.minBalance || 0);
    
    // Inject required initial fund as a pending income if it's > 0
    if (requiredInitial > 0) {
        const key = `income_required_starting_fund_${startD}`;
        const ov = overrides[key] || {};
        
        if (!ov.discarded) {
            const isDone = !!ov.done;
            const amtToInject = isDone && ov.amt !== undefined ? parseFloat(String(ov.amt)) : requiredInitial;
            
            if (!map[startD]) map[startD] = [];
            map[startD].unshift({
                label: 'Fondo Requerido para Iniciar',
                type: 'income',
                amt: amtToInject,
                ref: { id: 'required_starting_fund', name: 'Fondo Requerido', effectiveColor: '#f59e0b' },
                originalDate: startD,
                done: isDone,
                isGhost: false
            });
        }
    }
  }

  for (const d of allDatesList) {
     futureEvents.push(...(map[d] || []));
  }
  
  const targetMin = settings.minBalance || 0;

  plan.push({
    date: startD,
    label: autoCalculatedStart ? 'Saldo Inicial Base (Auto-calculado)' : 'Saldo Inicial Base (Manual)',
    type: 'opening_balance',
    amt: balance,
    ref: { id: 'opening_balance', name: 'Saldo Base', effectiveColor: '#94a3b8' },
    originalDate: startD,
    done: true,
    balance: balance,
    isDelayed: false,
    savingsAccumulated: 0
  });

  for (const d of datesBetween(startD, endD)) {


    // Determine auto-saving first: sweep BEFORE applying today's income
    let hasIncomeToday = futureEvents.some(e => (e?.targetDate || e?.originalDate) === d && (e?.amt || 0) > 0 && e?.type === 'income' && !e?.pulledEarly);
    if (hasIncomeToday && balance > targetMin && d !== startD) {
       const autosaveKey = `savings_autosave_${d}_${d}`;
       const missedKey = `expense_missed_autosave_${d}_${d}`;
       const isDiscarded = (overrides[autosaveKey] && overrides[autosaveKey].discarded) || (overrides[missedKey] && overrides[missedKey].discarded);
       const isDone = (overrides[autosaveKey] && overrides[autosaveKey].done) || (overrides[missedKey] && overrides[missedKey].done);
       
       if (!isDiscarded) {
           // Calculate pending delayed expenses that we are about to pay today
           const pendingDelayed = delayedItems.reduce((acc, item) => acc + ((item?.amt || 0) < 0 ? item.amt : 0), 0); // only reserve for expenses
           
           // Also include flexible expenses that are scheduled for exactly today
           const todayFlexibleOut = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === d && !e?.pulledEarly && (e?.amt || 0) < 0 && !e?.done && !(e?.ref?.strictDate && e?.type !== 'savings') && !(e?.type === 'savings' && d < todayStr()));
           const todayPending = todayFlexibleOut.reduce((acc, item) => acc + (item?.amt || 0), 0);

           let excess = balance - targetMin + pendingDelayed + todayPending; // Reserve money for the pending delayed and today's flexible expenses
           if (excess < 0) excess = 0;
           
           if (excess === 0 && d >= todayStr()) {
               // Do nothing if there's no real excess (we need it for the delayed bills)
           } else if (d < todayStr() && !isDone) {
               balance -= excess;
               plan.push({
                 date: d,
                 label: 'Ajuste: Excedente gastado (No ahorrado)',
                 type: 'expense',
                 amt: -excess,
                 ref: { id: `missed_autosave_${d}`, name: 'Ajuste de Saldo', effectiveColor: '#f59e0b' },
                 originalDate: d,
                 done: true,
                 balance,
                 isDelayed: false,
                 savingsAccumulated,
               });
           } else {
               balance -= excess;
               savingsAccumulated += excess;
               plan.push({
                 date: d,
                 label: 'Ahorro Automático (Excedente pre-ingreso)',
                 type: 'savings',
                 amt: -excess,
                 ref: { id: `autosave_${d}`, name: 'Ahorro Automático', effectiveColor: '#10b981' },
                 originalDate: d,
                 done: !!isDone,
                 balance,
                 isDelayed: false,
                 savingsAccumulated,
               });
           }
       }
    }

    // Current day's scheduled events (that haven't been pulled early)
    let dayEvents = futureEvents.filter(e => (e?.targetDate || e?.originalDate) === d && !e?.pulledEarly);
    
    // 1. Process Incomes and Strict Expenses
    let incomes = dayEvents.filter(e => (e?.amt || 0) >= 0);
    let strictOut = dayEvents.filter(e => (e?.amt || 0) < 0 && (e?.done || (e?.ref?.strictDate && e?.type !== 'savings')));
    let flexibleOut = dayEvents.filter(e => (e?.amt || 0) < 0 && !e?.done && !(e?.ref?.strictDate && e?.type !== 'savings') && !(e?.type === 'savings' && d < todayStr()));
    let missedSavings = dayEvents.filter(e => (e?.amt || 0) < 0 && !e?.done && e?.type === 'savings' && d < todayStr());
    
    const applied: any[] = [];
    
    const applyEvent = (e: any) => {
        if (!e) return;
        balance += e.amt || 0;
        
        if (e?.type === 'savings' && (e?.amt || 0) < 0) {
           savingsAccumulated += Math.abs(e.amt);
        }

        const eventIndex = applied.length;
        applied.push({ ...e, date: d });

        let rescuedAmt = 0;
        if (balance < targetMin && savingsAccumulated > 0) {
            const autowithdrawKey = `rescate_ahorros_autowithdraw_${d}_${d}`;
            const isDiscarded = overrides[autowithdrawKey] && overrides[autowithdrawKey].discarded;
            if (!isDiscarded) {
                const deficit = targetMin - balance;
                const amtToWithdraw = Math.min(deficit, savingsAccumulated);
                rescuedAmt = amtToWithdraw;
                balance += amtToWithdraw;
                savingsAccumulated -= amtToWithdraw;

                applied.push({
                   date: d,
                   label: 'Rescate de Ahorros',
                   type: 'rescate_ahorros',
                   amt: amtToWithdraw,
                   ref: { id: `autowithdraw_${d}_${applied.length}`, name: 'Rescate de Ahorros', effectiveColor: '#0ea5e9' },
                   originalDate: d,
                   done: overrides[autowithdrawKey] ? !!overrides[autowithdrawKey].done : false,
                   runningBalance: balance,
                   isDelayed: false,
                   insufficientFunds: false,
                   savingsAccumulated,
                });
            }
        }
        applied[eventIndex].runningBalance = balance - (typeof rescuedAmt !== 'undefined' ? rescuedAmt : 0);
    };

    for (const e of incomes) applyEvent(e);
    for (const e of strictOut) applyEvent(e);
    for (const e of missedSavings) {
        applied.push({ ...e, date: d, amt: 0, label: `${e.label} (Omitido)`, runningBalance: balance, isDiscarded: true });
    }
    
    // Add today's flexible expenses to the pending backlog
    delayedItems.push(...flexibleOut);
    
    let candidates = [...delayedItems];
    
    const isProcessingDay = incomes.length > 0;
    if (isProcessingDay) {
       const nextIncome = futureEvents.find(e => e?.originalDate > d && (e?.amt || 0) > 0 && e?.type === 'income');
       const nextIncomeDate = nextIncome ? nextIncome?.originalDate : null;
       
       const upcoming = futureEvents.filter(e => 
           e?.originalDate > d && 
           (nextIncomeDate ? e?.originalDate < nextIncomeDate : true) && 
           (e?.amt || 0) < 0 && 
           !e?.done && 
           !e?.ref?.strictDate &&
           !e?.pulledEarly
       );
       candidates.push(...upcoming);
    }
    
    candidates.sort((a, b) => a.originalDate.localeCompare(b.originalDate) || Math.abs(a.amt || 0) - Math.abs(b.amt || 0));
    
    let newDelayed: any[] = [];
    
    for (const e of candidates) {
       // Only apply if we have enough balance to cover it without dipping below targetMin
       const isIncome = (e.amt || 0) > 0;
       if (isIncome || balance + (e.amt || 0) >= targetMin) {
          if (e.originalDate > d) {
             e.pulledEarly = true;
          } else if (e.originalDate < d) {
             e.isDelayed = true;
          }
          e.optimizedFrom = e.originalDate;
          applyEvent(e);
       } else {
          // If we can't pay it, and it's due (or overdue), keep it in the backlog
          if (e.originalDate <= d) {
              newDelayed.push(e);
          }
       }
    }
    delayedItems = newDelayed;
    
    // Finalize applied events WITH running balance
    applied.forEach(e => {
      const stepBalance = e.runningBalance !== undefined ? e.runningBalance : balance;
      plan.push({
        ...e,
        balance: stepBalance,
        insufficientFunds: stepBalance < targetMin,
        savingsAccumulated,
      });
    });

    if (d === endD && delayedItems.length > 0) {
      delayedItems.forEach(e => {
        if (!e) return;
        balance += e.amt || 0;
        plan.push({
          ...e,
          date: d,
          balance,
          isDelayed: true,
          insufficientFunds: true,
          savingsAccumulated
        });
      });
    }
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
