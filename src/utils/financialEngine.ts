/**
 * Financial Calculation Engine Module
 * Core algorithmic logic for cash flow projection, recurrence evaluation,
 * debt installment schedules, and shared group expense balancing.
 */

import { UserProfile, PlanOccurrence, SharedGroup, DebtItem, CustomDebtType, IncomePeriodCoverage, IncomeAccountBalance } from '../types';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseDateSafe(dStr?: string | null): Date {
  if (!dStr) return new Date(todayStr() + 'T12:00:00');
  const normalized = dStr.includes('T') ? dStr : dStr + 'T12:00:00';
  const parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) {
    return new Date(todayStr() + 'T12:00:00');
  }
  return parsed;
}

export function toIsoDateSafe(dateObj: Date): string {
  if (!dateObj || isNaN(dateObj.getTime())) {
    return todayStr();
  }
  return dateObj.toISOString().slice(0, 10);
}

export let globalDisplayCurrency = 'USD';
export let globalExchangeRates: Record<string, number> = {};

export function setGlobalFormattingContext(currency: string, rates: Record<string, number>) {
    globalDisplayCurrency = currency || 'USD';
    globalExchangeRates = rates || {};
}

export function formatCurrency(amount: number): string {
    let convertedAmount = amount;
    let currencyKey = globalDisplayCurrency;
    if (currencyKey === 'EUR') currencyKey = 'EUR_BCV';
    if (currencyKey === 'USD') currencyKey = 'USD_BCV';

    if (globalDisplayCurrency !== 'USD' && globalDisplayCurrency !== 'USD_BCV') {
        const rate = globalExchangeRates[currencyKey] || globalExchangeRates[globalDisplayCurrency];
        if (rate) {
            convertedAmount = amount / rate;
        }
    }

    let prefix = '$';
    if (globalDisplayCurrency === 'BS' || globalDisplayCurrency === 'VES') prefix = 'Bs ';
    else if (globalDisplayCurrency === 'EUR' || globalDisplayCurrency === 'EUR_BCV') prefix = '€';
    else if (globalDisplayCurrency === 'USDT') prefix = 'USDT ';

    const rounded = Math.round((convertedAmount || 0) * 100) / 100;
    return prefix + rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatAmountWithCurrency(amount: number, currency: string = 'USD'): string {
    const rounded = Math.round((amount || 0) * 100) / 100;
    const curr = (currency || 'USD').toUpperCase();
    if (curr === 'EUR' || curr === 'EUR_BCV') {
        return `${rounded.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
    }
    if (curr === 'BS' || curr === 'VES') {
        return `Bs ${rounded.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    if (curr === 'USDT') {
        return `${rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USDT`;
    }
    return `$${rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
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

  if (freq === 'biweekly' && dueDay === 'exact_14') {
    curr.setDate(curr.getDate() + 14);
    return;
  }
  if (freq === 'biweekly' && dueDay === 'exact_15') {
    curr.setDate(curr.getDate() + 15);
    return;
  }
  if (freq === 'monthly' || freq === 'bimonthly' || freq === 'quarterly' || freq === 'four-monthly' || freq === 'semiannual' || freq === 'annual' || freq === 'cuatrimestral' || freq === 'semestral') {
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
  } else if (freq === 'bimonthly') {
    const targetDay = parseInt(String(dueDay || curr.getDate()), 10);
    curr.setDate(1);
    curr.setMonth(curr.getMonth() + 2);
    const maxDays = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
    curr.setDate(Math.min(targetDay, maxDays));
  } else if (freq === 'quarterly') {
    const targetDay = parseInt(String(dueDay || curr.getDate()), 10);
    curr.setDate(1);
    curr.setMonth(curr.getMonth() + 3);
    const maxDays = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
    curr.setDate(Math.min(targetDay, maxDays));
  } else if (freq === 'four-monthly' || freq === 'cuatrimestral') {
    const targetDay = parseInt(String(dueDay || curr.getDate()), 10);
    curr.setDate(1);
    curr.setMonth(curr.getMonth() + 4);
    const maxDays = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
    curr.setDate(Math.min(targetDay, maxDays));
  } else if (freq === 'semiannual' || freq === 'semestral') {
    const targetDay = parseInt(String(dueDay || curr.getDate()), 10);
    curr.setDate(1);
    curr.setMonth(curr.getMonth() + 6);
    const maxDays = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
    curr.setDate(Math.min(targetDay, maxDays));
  } else if (freq === 'annual') {
    const targetDay = parseInt(String(dueDay || curr.getDate()), 10);
    curr.setDate(1);
    curr.setFullYear(curr.getFullYear() + 1);
    const maxDays = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
    curr.setDate(Math.min(targetDay, maxDays));
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
  if (exchangeRates && debt.currency && (debt.currency as string) !== 'USD_BCV' && (debt.currency as string) !== 'USD') {
     let curr = debt.currency as string;
     if (curr === 'EUR') curr = 'EUR_BCV';
     const rate = exchangeRates[curr] || exchangeRates[debt.currency];
     if (rate) return amtUsd / rate;
  }
  return amtUsd;
}

export function getDebtTotalPaid(debt: DebtItem, overrides: Record<string, any> = {}, exchangeRates?: Record<string, number>): number {
  let paid = 0; // Amortization is now a down payment and reduces principal upfront, so we don't count it as paid installments
  const initialTotalDebt = Math.max(0, parseFloat(String(debt.balance || 0)) - parseFloat(String(debt.amortized || 0)));
  const inst = parseInt(String(debt.installments || 1), 10);
  
  let defaultPay = parseFloat(String(debt.minPay || debt.amount || 0));
  if (!defaultPay || defaultPay <= 0) {
    defaultPay = inst > 0 ? Math.round((initialTotalDebt / inst) * 100) / 100 : 0;
  }
  
  const idStr = String(debt.id || '');
  const idWithout = idStr.replace(/^debt_/, '');
  const idWith = idStr.startsWith('debt_') ? idStr : 'debt_' + idStr;

  // Track processed installments and dates to prevent duplicate counting between legacyKey and cuotaKey
  const seenCuotaIndices = new Set<string>();
  const seenDates = new Set<string>();

  Object.keys(overrides).forEach(k => {
    const matchesDebt = k.startsWith(`${idStr}_`) || 
                        k.startsWith(`${idWithout}_`) || 
                        k.startsWith(`${idWith}_`);
    if (!matchesDebt) return;

    // Check if this key specifies cuota index (e.g. debt_1_cuota_1 or 1_1)
    const cuotaMatch = k.match(/(?:cuota_|_)?(\d+)$/);
    if (cuotaMatch && !k.includes('-')) {
      const idx = cuotaMatch[1];
      if (seenCuotaIndices.has(idx)) return;
      seenCuotaIndices.add(idx);
    }
    // Check if key specifies a date (e.g. debt_1_2026-10-15)
    const dateMatch = k.match(/(\d{4}-\d{2}-\d{2})$/);
    if (dateMatch) {
      const dt = dateMatch[1];
      if (seenDates.has(dt)) return;
      seenDates.add(dt);
    }

    const ov = overrides[k];
    const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + getAmtInDebtCurrency(debt, parseFloat(String(pt?.amt)) || 0, pt.rawAmt, pt.currency, exchangeRates), 0);
    
    if (ov.done || ov.discarded || ov.isPaid) {
      const isNoAffect = ov.noAffectBalance === true || ov.externalPay === true;
      const amtUsd = (ov.amt !== undefined && !isNoAffect) ? parseFloat(String(ov.amt)) : undefined;
      let finalAmt = 0;
      if (amtUsd !== undefined && amtUsd > 0) {
         finalAmt = getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates);
      } else {
         finalAmt = Math.max(0, defaultPay - partialsSum);
      }
      paid += (finalAmt + partialsSum);
    } else {
      paid += partialsSum;
    }
  });

  // Include initialPaidCuotas if any indices haven't been processed via overrides
  const initPaidCount = parseInt(String(debt.initialPaidCuotas || 0), 10);
  if (initPaidCount > 0) {
    for (let cIdx = 1; cIdx <= initPaidCount; cIdx++) {
      const idxStr = String(cIdx);
      if (!seenCuotaIndices.has(idxStr)) {
        paid += defaultPay;
        seenCuotaIndices.add(idxStr);
      }
    }
  }

  return Math.round(paid * 100) / 100;
}


export interface AmortizationInstallment {
  index: number;
  date: string;
  originalDate: string;
  key: string;
  matchedKey?: string;
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
  let dueDay = debt.dueDay || (customDef ? customDef.dueDay : '1');

  let initialTotalDebt = parseFloat(String(debt.balance || 0));
  const amort = parseFloat(String(debt.amortized || 0));
  const inst = parseInt(String(debt.installments || 1), 10);
  const hasInt = debt.hasInterest || (customDef && customDef.hasInterest);
  
  // Amortization (down payment) reduces the principal to be financed
  initialTotalDebt = Math.max(0, initialTotalDebt - amort);
  
  // USER REQUIREMENT: Use the pre-calculated amount (quota) exactly as saved in the debt, don't recalculate
  let pay = parseFloat(String(debt.amount || 0));
  if (!pay || pay <= 0) {
      pay = initialTotalDebt / inst;
  }
  
  let lifetimeTotal = pay * inst;
  
  // Distribute lifetimeTotal exactly into installments to avoid pennies
  const scheduleAmounts: number[] = [];
  let currentSum = 0;
  for (let idx = 0; idx < inst; idx++) {
    if (idx === inst - 1) {
      scheduleAmounts.push(Math.round((lifetimeTotal - currentSum) * 100) / 100);
    } else {
      let p = Math.round(pay * 100) / 100;
      scheduleAmounts.push(p);
      currentSum += p;
    }
  }

  const totalPaid = getDebtTotalPaid(debt, overrides, exchangeRates);
  let remainingPrincipal = lifetimeTotal - totalPaid;

  const idStr = String(debt.id || '');
  const idWithout = idStr.replace(/^debt_/, '');
  const idWith = idStr.startsWith('debt_') ? idStr : 'debt_' + idStr;

  const cuotaSpecificKeys = new Set<string>();
  for (let cIdx = 1; cIdx <= inst; cIdx++) {
    cuotaSpecificKeys.add(`${idStr}_${cIdx}`);
    cuotaSpecificKeys.add(`debt_${idStr}_cuota_${cIdx}`);
    cuotaSpecificKeys.add(`${idWithout}_${cIdx}`);
    cuotaSpecificKeys.add(`debt_${idWithout}_cuota_${cIdx}`);
    cuotaSpecificKeys.add(`${idWith}_${cIdx}`);
    cuotaSpecificKeys.add(`debt_${idWith}_cuota_${cIdx}`);
  }

  // Only payments from overrides that are NOT tied to a specific cuota index should be in unallocatedPaid
  let unallocatedPaid = 0;
  Object.keys(overrides).forEach(k => {
    const matchesDebt = k.startsWith(`${idStr}_`) || 
                        k.startsWith(`${idWithout}_`) || 
                        k.startsWith(`${idWith}_`);
    if (!matchesDebt) return;
    if (cuotaSpecificKeys.has(k)) return;
    const cuotaMatch = k.match(/(?:cuota_|_)?(\d+)$/);
    if (cuotaMatch && !k.includes('-')) return;

    const ov = overrides[k];
    if (ov.done || ov.discarded || ov.isPaid) {
      const isNoAffect = ov.noAffectBalance === true || ov.externalPay === true || ov.paidPrior === true;
      const amtUsd = (ov.amt !== undefined && !isNoAffect) ? parseFloat(String(ov.amt)) : undefined;
      const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + getAmtInDebtCurrency(debt, parseFloat(String(pt?.amt)) || 0, pt.rawAmt, pt.currency, exchangeRates), 0);
      let finalAmt = 0;
      if (amtUsd !== undefined && amtUsd > 0) {
        finalAmt = getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates);
      } else {
        finalAmt = Math.max(0, pay - partialsSum);
      }
      unallocatedPaid += (finalAmt + partialsSum);
    }
  });

  let curr = parseDateSafe(debt.start);
  
  if (freq !== 'one-time') {
    // Just snap to the nearest valid due date
    snapDateFreq(curr, freq, dueDay);
  }

  const cuotas: AmortizationInstallment[] = [];
  let i = 0;
  const maxIterations = 999;
  const seenKeys = new Set<string>();
  while (i < maxIterations) {
    if (limitDate && curr > limitDate) break;

    let dateStr = toIsoDateSafe(curr);
    let key = `${debt.id}_${i + 1}`;
    const legacyKey2 = `debt_${debt.id}_cuota_${i + 1}`;
    const legacyKey1 = `debt_${debt.id}_${dateStr}`;
    
    let failSafe = 0;
    while (seenKeys.has(key) && failSafe < 100) {
      advanceDateFreq(curr, freq, dueDay);
      dateStr = toIsoDateSafe(curr);
      key = `${debt.id}_${i + 1}`;
      failSafe++;
    }
    if (failSafe >= 100) break;

    seenKeys.add(key);

    const idStr = String(debt.id || '');
    const idWithout = idStr.replace(/^debt_/, '');
    const idWith = idStr.startsWith('debt_') ? idStr : 'debt_' + idStr;

    const candidateKeys = [
      key,
      legacyKey2,
      legacyKey1,
      `${idWithout}_${i + 1}`,
      `debt_${idWithout}_cuota_${i + 1}`,
      `debt_${idWithout}_${dateStr}`,
      `${idWith}_${i + 1}`,
      `${idWith}_cuota_${i + 1}`,
      `${idWith}_${dateStr}`
    ];

    let ov: any = {};
    let matchedKey: string | undefined = undefined;
    for (const ck of candidateKeys) {
      if (overrides[ck]) {
        ov = overrides[ck];
        matchedKey = ck;
        break;
      }
    }
    
    // Auto-mark cuotas as paid if within debt.initialPaidCuotas
    if (debt.initialPaidCuotas && (i + 1) <= debt.initialPaidCuotas && !ov.explicitUnpaid && ov.done !== false && ov.isPaid !== false) {
      ov = { ...ov, done: true, isPaid: true, paidPrior: true };
    }

    let baseExpectedAmount = i < inst ? scheduleAmounts[i] : pay;
    if (isCard && i >= inst) baseExpectedAmount = 0; // fallback just in case
    if (baseExpectedAmount === 0 && !isCard) baseExpectedAmount = pay; // fallback for one-time or 0

    // Recalculate remaining unpaid future cuotas dynamically based on remaining principal
    if (ov.plannedAmt === undefined && ov.expectedAmount === undefined && !ov.done && !ov.isPaid) {
      const remainingUnpaidCount = Math.max(1, inst - i);
      const dynamicShare = Math.round((remainingPrincipal / remainingUnpaidCount) * 100) / 100;
      if (dynamicShare > 0) {
        baseExpectedAmount = dynamicShare;
      }
    }

    let expectedAmount = baseExpectedAmount;
    if (ov.plannedAmt !== undefined) {
      expectedAmount = getAmtInDebtCurrency(debt, parseFloat(String(ov.plannedAmt)), ov.rawPayAmount, ov.payCurrency, exchangeRates);
    } else if (ov.expectedAmount !== undefined) {
      expectedAmount = parseFloat(String(ov.expectedAmount));
    }
    let isPaid = false;
    let paidAmt = 0;
    let isCoveredByExplicit = false;
    let isCoveredBySequential = false;
    let requiredPay = 0;
    
    const partialsSum = (ov.partials || []).reduce((sum: number, pt: any) => sum + getAmtInDebtCurrency(debt, parseFloat(String(pt?.amt)) || 0, pt.rawAmt, pt.currency, exchangeRates), 0);
    
    if ((ov.done === true || ov.isPaid === true) && !ov.explicitUnpaid) {
      isPaid = true;
      isCoveredByExplicit = true;
      const isNoAffect = ov.noAffectBalance === true || ov.externalPay === true || ov.paidPrior === true;
      const amtUsd = (ov.amt !== undefined && !isNoAffect) ? parseFloat(String(ov.amt)) : (ov.paidAmount !== undefined ? parseFloat(String(ov.paidAmount)) : undefined);
      const finalAmt = (amtUsd !== undefined && amtUsd > 0) ? getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates) : Math.max(0, baseExpectedAmount - partialsSum);
      paidAmt = finalAmt + partialsSum;
      expectedAmount = Math.max(baseExpectedAmount, paidAmt);
    } else if (ov.discarded) {
      isPaid = true;
      isCoveredByExplicit = true;
      const amtUsd = ov.amt !== undefined ? parseFloat(String(ov.amt)) : undefined;
      const finalAmt = amtUsd !== undefined ? getAmtInDebtCurrency(debt, amtUsd, ov.rawPayAmount, ov.payCurrency, exchangeRates) : Math.max(0, baseExpectedAmount - partialsSum);
      paidAmt = finalAmt + partialsSum;
      expectedAmount = Math.max(baseExpectedAmount, paidAmt);
    } else {
      if (ov.done !== false && ov.isPaid !== false && !ov.explicitUnpaid && ov.paidAmount && parseFloat(String(ov.paidAmount)) > 0) {
        paidAmt += parseFloat(String(ov.paidAmount));
      }
      const isExplicitlyPending = ov.done === false || ov.isPaid === false || ov.explicitUnpaid === true;
      if (!isExplicitlyPending && unallocatedPaid > 0) {
        const canCover = Math.min(baseExpectedAmount, unallocatedPaid);
        if (canCover >= baseExpectedAmount - 0.01) {
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
      
      if (paidAmt >= baseExpectedAmount - 0.01) {
        isPaid = true;
      } else {
        requiredPay = Math.min(baseExpectedAmount - paidAmt, Math.max(0, remainingPrincipal));
        if (!isCard && i === inst - 1) {
          requiredPay = Math.max(0, remainingPrincipal);
        }
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
    
    if (!isCard && i >= inst) break;
    if (isCard && i >= inst) break;
    if (i >= inst && remainingPrincipal <= 0.01 && unallocatedPaid <= 0.01) break;

    const finalDate = ov.actualDate || dateStr;

    cuotas.push({
      index: i + 1,
      date: finalDate,
      originalDate: finalDate,
      key,
      matchedKey,
      expectedAmount,
      isPaid,
      paidAmount: isPaid ? paidAmt : (partialsSum > 0 ? partialsSum : 0),
      paidCurrency: ov.payCurrency || debt.currency || 'USD_BCV',
      ov,
      isCoveredBySequential,
      isCoveredByExplicit,
      requiredPay
    });

    if (ov.actualDate) {
      curr = new Date(ov.actualDate + 'T12:00:00');
      if (freq === 'weekly') {
        dueDay = curr.getDay();
      } else if (freq === 'biweekly') {
        const d = curr.getDate();
        if (d <= 15) {
          dueDay = `${d}-${d + 15}`;
        } else {
          dueDay = `${d - 15}-${d}`;
        }
      } else {
        dueDay = curr.getDate();
      }
    }

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
    const isBiweekly = debt.freq === 'biweekly';
    const isWeekly = debt.freq === 'weekly';
    const isBimonthly = debt.freq === 'bimonthly';
    const isQuarterly = debt.freq === 'quarterly';
    const isFourMonthly = debt.freq === 'four-monthly' || (debt.freq as any) === 'cuatrimestral';
    const isSemiannual = debt.freq === 'semiannual' || (debt.freq as any) === 'semestral';
    const isAnnual = debt.freq === 'annual';
    const instMonths = isBiweekly ? inst / 2 : (isWeekly ? inst / 4 : isBimonthly ? inst * 2 : isQuarterly ? inst * 3 : isFourMonthly ? inst * 4 : isSemiannual ? inst * 6 : isAnnual ? inst * 12 : inst);
    const monthlyPay = totalDebt * (r * Math.pow(1 + r, instMonths)) / (Math.pow(1 + r, instMonths) - 1);
    const pay = isBiweekly ? monthlyPay / 2 : (isWeekly ? monthlyPay / 4 : isBimonthly ? monthlyPay * 2 : isQuarterly ? monthlyPay * 3 : isFourMonthly ? monthlyPay * 4 : isSemiannual ? monthlyPay * 6 : isAnnual ? monthlyPay * 12 : monthlyPay);
    totalDebt = pay * inst;
  }
  const rem = totalDebt - getDebtTotalPaid(debt, overrides, exchangeRates);
  return rem < 0 ? 0 : Math.round(rem * 100) / 100;
}

export function getOverrideForItem(
  overrides: Record<string, any> = {},
  type: string,
  ref: any,
  dateStr: string
): any {
  if (!overrides || !ref) return null;
  const cuotaKey = ref.cuotaKey;
  if (cuotaKey && overrides[cuotaKey]) return overrides[cuotaKey];

  const rawId = String(ref.id || '');
  const idWithout = rawId.replace(/^(debt_|income_|expense_|savings_)/, '');
  const sanitizedId = sanitizeDocId(ref.name || '', rawId);

  const candidateIds = Array.from(
    new Set([rawId, idWithout, sanitizedId].filter(Boolean))
  );

  for (const idCandidate of candidateIds) {
    const keysToTry = [
      `${type}_${idCandidate}_${dateStr}`,
      `${idCandidate}_${dateStr}`,
      `debt_${idCandidate}_${dateStr}`,
      `income_${idCandidate}_${dateStr}`,
      `expense_${idCandidate}_${dateStr}`
    ];
    if (ref.index !== undefined) {
      keysToTry.push(
        `${type}_${idCandidate}_cuota_${ref.index}`,
        `${idCandidate}_cuota_${ref.index}`,
        `debt_${idCandidate}_cuota_${ref.index}`,
        `${type}_${idCandidate}_${ref.index}`,
        `${idCandidate}_${ref.index}`
      );
    }
    for (const k of keysToTry) {
      if (overrides[k]) return overrides[k];
    }
  }

  // Scan all keys in overrides for candidate matches if dateStr matches OR if item is one-time
  for (const k of Object.keys(overrides)) {
    for (const idCandidate of candidateIds) {
      if (idCandidate && idCandidate.length > 2 && k.includes(idCandidate)) {
        if (dateStr && k.endsWith(`_${dateStr}`)) {
          return overrides[k];
        }
        if (ref.freq === 'one-time' || !ref.freq) {
          const ov = overrides[k];
          if (ov && (ov.done || ov.isPaid || ov.discarded || ov.actualDate)) {
            return ov;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Calculates day-by-day cash flow projections for a given UserProfile
 */
export function calculateProjections(
  profile: UserProfile,
  exchangeRates: Record<string, number> = {},
  options?: { includeDiscarded?: boolean }
): PlanOccurrence[] {
  const convAmt = (amt: number, currency?: string) => {
    if (!currency || currency === 'USD_BCV' || currency === 'USD') return amt;
    let curr = currency;
    if (curr === 'EUR') curr = 'EUR_BCV';
    const rate = exchangeRates[curr] || exchangeRates[currency];
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
    const ov = getOverrideForItem(overrides, type, ref, dateStr);

    const isDiscarded = !!(ov && ov.discarded);
    if (isDiscarded && !options?.includeDiscarded) return;

    let done = ov 
      ? (ov.done !== undefined ? !!ov.done : !!ov.isPaid) 
      : (ref.isPaid !== undefined ? !!ref.isPaid : (type === 'savings' && ref.status === 'completed'));
    
    let finalDate = dateStr;
    const userPostponed = ov ? !!ov.userPostponed : false;
    
    if (ov && ov.actualDate) {
      finalDate = ov.actualDate;
    }

    const partials = (ov && ov.partials) ? ov.partials : [];

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
          incomeId: pt.incomeId || ov?.incomeId || safeRef.incomeId || (type === 'income' ? safeRef.id : undefined),
          ref: safeRef,
          originalDate: pt.date,
          targetDate: pt.date,
          done: true,
          isPartial: true,
          userPostponed: false,
          plannedAmt,
        });
      }
      remainingAmt -= pt.amt;
    });

    const noAffectBalance = ov ? (ov.noAffectBalance === true || ov.externalPay === true || ov.paidPrior === true) : false;

    let finalPaymentAmt = remainingAmt;
    if (done && ov && ov.amt !== undefined && !noAffectBalance) {
      finalPaymentAmt = parseFloat(String(ov.amt));
    }

    if (noAffectBalance) {
      finalPaymentAmt = 0;
    }

    if (!done && finalPaymentAmt <= 0.01) {
      done = true;
      finalPaymentAmt = 0;
    }

    if (finalPaymentAmt > 0 || done || isDiscarded) {
      if (!isDiscarded && finalPaymentAmt <= 0 && totalPaidInPartials >= plannedAmt && !noAffectBalance) return;

      const totalPaidForInstallment = totalPaidInPartials + (done ? finalPaymentAmt : 0);
      let extraLabel = '';

      if (isDiscarded) {
        extraLabel = ' (Descartada)';
      } else if (noAffectBalance) {
        extraLabel = ' (Pagada previo/externo)';
      } else if (done && totalPaidForInstallment < plannedAmt - 0.01) {
        extraLabel = ` (Ahorraste ${formatCurrency(plannedAmt - totalPaidForInstallment)})`;
      } else if (done && totalPaidForInstallment > plannedAmt + 0.01) {
        extraLabel = ` (+${formatCurrency(totalPaidForInstallment - plannedAmt)} Extra)`;
      }

      const isItemDone = isDiscarded ? false : done;
      const occurrence = {
        label: label + (isDiscarded ? ' (Descartada)' : (done ? ` (✓)${extraLabel}` : (partials.length > 0 ? ' (Restante)' : ''))),
        type,
        amt: isDiscarded ? 0 : (noAffectBalance ? 0 : (amt > 0 ? finalPaymentAmt : -finalPaymentAmt)),
        incomeId: ov?.incomeId || safeRef.incomeId || (type === 'income' ? safeRef.id : undefined),
        ref: safeRef,
        originalDate: finalDate,
        targetDate: finalDate,
        done: isItemDone,
        isPaid: isItemDone,
        discarded: isDiscarded,
        noAffectBalance,
        userPostponed,
        plannedAmt,
        isDelayed: !isDiscarded && !isItemDone && finalDate < todayStr(),
      };

      if (finalDate >= startD && finalDate <= endD) {
        if (!map[finalDate]) map[finalDate] = [];
        map[finalDate].push(occurrence);
      }
    }
  };

  // 1. Process Incomes
  (profile.incomes || []).forEach(inc => {
    const effStart = (inc.hasCustomStart && inc.start && inc.start > startD) ? inc.start : startD;
    const effEnd = inc.end || endD;

    if (inc.freq === 'one-time') {
      if (inc.date && inc.date >= startD && inc.date <= effEnd) {
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
    } else if (
      inc.freq === 'bimonthly' ||
      inc.freq === 'quarterly' ||
      inc.freq === 'four-monthly' ||
      (inc.freq as any) === 'cuatrimestral' ||
      inc.freq === 'semiannual' ||
      (inc.freq as any) === 'semestral' ||
      inc.freq === 'annual'
    ) {
      const step = inc.freq === 'bimonthly' ? 2 : inc.freq === 'quarterly' ? 3 : (inc.freq === 'four-monthly' || (inc.freq as any) === 'cuatrimestral') ? 4 : (inc.freq === 'semiannual' || (inc.freq as any) === 'semestral') ? 6 : 12;
      const baseDate = new Date(((inc.hasCustomStart && inc.start) || startD) + 'T12:00:00');
      let curY = baseDate.getFullYear();
      let curM = baseDate.getMonth();
      const targetDay = parseInt(String(inc.day || baseDate.getDate() || 1), 10);

      while (true) {
        const dStr = getDateInMonth(curY, curM, targetDay);
        if (dStr > effEnd) break;
        if (dStr >= effStart && dStr <= effEnd) {
          addOccurrence(dStr, inc.name, 'income', convAmt(inc.amount, (inc as any).currency), inc);
        }
        curM += step;
        while (curM >= 12) {
          curM -= 12;
          curY += 1;
        }
      }
    }
  });

  // 2. Process Expenses
  (profile.expenses || []).forEach(exp => {
    const effStart = (exp.hasCustomStart && exp.start && exp.start > startD) ? exp.start : startD;
    const effEnd = exp.end || endD;

    if (exp.freq === 'one-time') {
      if (exp.date && exp.date >= startD && exp.date <= effEnd) {
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
    } else if (
      exp.freq === 'bimonthly' ||
      exp.freq === 'quarterly' ||
      exp.freq === 'four-monthly' ||
      (exp.freq as any) === 'cuatrimestral' ||
      exp.freq === 'semiannual' ||
      (exp.freq as any) === 'semestral' ||
      exp.freq === 'annual'
    ) {
      const step = exp.freq === 'bimonthly' ? 2 : exp.freq === 'quarterly' ? 3 : (exp.freq === 'four-monthly' || (exp.freq as any) === 'cuatrimestral') ? 4 : (exp.freq === 'semiannual' || (exp.freq as any) === 'semestral') ? 6 : 12;
      const baseDate = new Date(((exp.hasCustomStart && exp.start) || startD) + 'T12:00:00');
      let curY = baseDate.getFullYear();
      let curM = baseDate.getMonth();
      const targetDay = parseInt(String(exp.day || baseDate.getDate() || 1), 10);

      while (true) {
        const dStr = getDateInMonth(curY, curM, targetDay);
        if (dStr > effEnd) break;
        if (dStr >= effStart && dStr <= effEnd) {
          addOccurrence(dStr, exp.name, 'expense', -convAmt(exp.amount, (exp as any).currency), exp);
        }
        curM += step;
        while (curM >= 12) {
          curM -= 12;
          curY += 1;
        }
      }
    }
  });

  // 3. Process Debts
  const customDebts = settings.customDebts || [];
  (profile.debts || []).forEach(debt => {
    const customDef = customDebts.find(c => c.id === debt.type);
    const effectiveColor = debt.color || (customDef ? customDef.color : (debt.type === 'fixed' ? '#1a73e8' : (debt.type === 'noloan' ? '#00897b' : '#d93025')));
    const debtRef = { ...debt, effectiveColor };

    const debtStart = debt.start || startD || todayStr();
    const debtBalance = parseFloat(String(debt.balance || debt.amount || 0));
    if (debtBalance <= 0) return;
    
    // Optional Cut day logic
    if ((debt.type === 'card' || debt.type.startsWith('tdc_')) && debt.cutDay) {
      const dStart = new Date(debtStart + 'T12:00:00');
      for (let y = dStart.getFullYear(); y <= endYear; y++) {
        for (let m = (y === dStart.getFullYear() ? dStart.getMonth() : 0); m <= (y === endYear ? endMonth : 11); m++) {
           const cutDate = getDateInMonth(y, m, debt.cutDay);
           if (cutDate >= debtStart && cutDate <= endD) {
              addOccurrence(cutDate, `Corte: ${debt.name}`, 'debt_cut', 0, debtRef);
           }
        }
      }
    }

    const limitDate = debt.end ? new Date(debt.end + 'T12:00:00') : new Date(endD + 'T12:00:00');

    const plan = calculateAmortizationPlan({ ...debt, start: debtStart, balance: debtBalance }, overrides, customDebts, limitDate, exchangeRates);
    
    plan.forEach(cuota => {
      const expectedNative = cuota.expectedAmount;
      const requiredNative = cuota.requiredPay;

      if (cuota.isPaid || cuota.isCoveredByExplicit || cuota.isCoveredBySequential) {
        addOccurrence(cuota.date, debt.name, 'debt', -convAmt(expectedNative, (debt as any).currency), {
          ...debtRef,
          cuotaKey: cuota.key,
          isPaid: true,
          index: cuota.index
        });
      } else if (requiredNative > 0.01) {
        addOccurrence(cuota.date, debt.name, 'debt', -convAmt(requiredNative, (debt as any).currency), {
          ...debtRef,
          cuotaKey: cuota.key,
          isPaid: false,
          index: cuota.index
        });
      }
    });
  });

  // 4. Process Savings
  (profile.savingsList || []).forEach(sav => {
    if (sav.date >= startD && sav.date <= endD) {
      addOccurrence(sav.date, `Divisa/Ahorro: ${sav.person}`, 'savings', -convAmt(sav.amount, (sav as any).currency), { ...sav, strictDate: true });
    }
  });

  const allDatesList = datesBetween(startD, endD);

  // 5. Calculate required starting fund to cover expenses + cushion before the first income date
  let initialEgresosSum = 0;
  for (const d of allDatesList) {
    const dayEvents = map[d] || [];
    let hitRealIncome = false;
    for (const e of dayEvents) {
      if ((e?.amt || 0) > 0 && e?.type === 'income' && e?.ref?.id !== 'required_starting_fund') {
        hitRealIncome = true;
        break;
      }
    }
    if (hitRealIncome) break;

    for (const e of dayEvents) {
      if ((e?.amt || 0) < 0 && e?.ref?.id !== 'auto_savings' && e?.ref?.id !== 'savings_auto_savings') {
        initialEgresosSum += Math.abs(e?.amt || 0);
      }
    }
  }

  const cushionCurrency = settings.minBalanceCurrency || settings.displayCurrency || 'USD';
  const cushionInBase = convAmt(settings.minBalance || 0, cushionCurrency);
  const openingBal = settings.openingBalance || 0;

  // Formula: Egresos iniciales + Colchón de seguridad - Saldo base inicial
  const requiredInitial = Math.max(0, Math.round((initialEgresosSum + cushionInBase - openingBal) * 100) / 100);

  if (requiredInitial > 0) {
    const key = `income_required_starting_fund_${startD}`;
    const matchKey = Object.keys(overrides).find(k => k === key) || Object.keys(overrides).find(k => k.startsWith('income_required_starting_fund_'));
    const ov = (matchKey ? overrides[matchKey] : null) || overrides[key] || {};
    if (!ov.discarded) {
      const isDone = ov.done !== undefined ? !!ov.done : false;
      const amtToInject = (ov && ov.amt !== undefined && ov.isCustomAmt) ? parseFloat(String(ov.amt)) : requiredInitial;
      if (!map[startD]) map[startD] = [];
      map[startD].unshift({
        label: 'Fondo Requerido para Iniciar',
        type: 'income',
        amt: amtToInject,
        ref: { id: 'required_starting_fund', name: 'Fondo Requerido', effectiveColor: '#f59e0b' },
        originalDate: startD,
        targetDate: startD,
        done: isDone,
        isDelayed: false,
        isGhost: false
      });
    }
  }

  // 6. Day-by-Day Cash Flow Simulation
  const plan: PlanOccurrence[] = [];
  let savingsAccumulated = (profile.savings?.current || 0) + (profile.savings?.digital || 0);
  const targetMin = convAmt(settings.minBalance || 0, cushionCurrency);
  let hasEncounteredFirstIncome = false;
  let realIncomeCount = 0;
  let hasRescuedInCurrentCycle = false;

  // Add opening balance record on startD
  plan.push({
    date: startD,
    label: 'Saldo Inicial Base',
    type: 'opening_balance',
    amt: balance,
    ref: { id: 'opening_balance', name: 'Saldo Base', effectiveColor: '#94a3b8' },
    originalDate: startD,
    targetDate: startD,
    done: true,
    balance: balance,
    isDelayed: false,
    savingsAccumulated: savingsAccumulated
  });

  for (let i = 0; i < allDatesList.length; i++) {
    const d = allDatesList[i];
    const dayEvents = map[d] || [];
    if (dayEvents.length === 0) continue;

    // Sort events on the same day: incomes first, then expenses/debts/savings
    dayEvents.sort((a, b) => {
      const aInc = (a.amt || 0) > 0 ? 1 : 0;
      const bInc = (b.amt || 0) > 0 ? 1 : 0;
      return bInc - aInc;
    });

    // Separate incomes from non-incomes on date d
    const incomeEvents: PlanOccurrence[] = [];
    const expenseEvents: PlanOccurrence[] = [];

    for (const e of dayEvents) {
      if ((e.amt || 0) > 0 && e.type === 'income') {
        incomeEvents.push(e);
      } else {
        expenseEvents.push(e);
      }
    }

    // 1. Process incomes and sweep excess to auto_savings JUST BEFORE income arrives
    let sweptToday = false;
    const enableAutoSavings = settings.enableAutoSavings !== false;
    for (const inc of incomeEvents) {
      const isRealIncome = inc.ref?.id !== 'required_starting_fund';
      if (isRealIncome) {
        realIncomeCount++;
        hasEncounteredFirstIncome = true;
        hasRescuedInCurrentCycle = false;

        // Auto-savings: JUST BEFORE the new income, sweep previous cycle's surplus above cushion
        if (enableAutoSavings && !sweptToday && realIncomeCount > 1) {
          const excess = Math.max(0, Math.round((balance - targetMin) * 100) / 100);

          if (excess > 0.001) {
            const autoKey = `savings_auto_savings_${d}`;
            const autoLegacyKey = `auto_savings_${d}`;
            const ov = overrides[autoKey] || overrides[autoLegacyKey] || {};

            if (!ov || !ov.discarded) {
              const isDone = ov ? (ov.done !== undefined ? !!ov.done : !!ov.isPaid) : false;
              const actualDate = (ov && ov.actualDate) ? ov.actualDate : d;
              
              let saveAmt = excess;
              if (ov && ov.amt !== undefined && ov.isCustomAmt) {
                saveAmt = Math.abs(parseFloat(String(ov.amt)));
              } else if (ov && ov.amt !== undefined) {
                saveAmt = Math.min(Math.abs(parseFloat(String(ov.amt))), excess);
              }
              saveAmt = Math.max(0, Math.min(saveAmt, balance - targetMin));
              saveAmt = Math.round(saveAmt * 100) / 100;

              if (saveAmt > 0.001) {
                balance = Math.round((balance - saveAmt) * 100) / 100;
                if (Math.abs(balance) < 0.001) balance = 0;
                savingsAccumulated = Math.round((savingsAccumulated + saveAmt) * 100) / 100;

                plan.push({
                  date: actualDate,
                  label: 'Ahorro Automático Sugerido',
                  type: 'savings',
                  amt: -saveAmt,
                  ref: { id: 'auto_savings', name: 'Ahorro Automático Sugerido', effectiveColor: '#10b981' },
                  originalDate: d,
                  targetDate: actualDate,
                  done: isDone,
                  balance: balance,
                  isDelayed: false,
                  insufficientFunds: false,
                  savingsAccumulated: savingsAccumulated,
                  isGhost: false,
                  incomeId: ov?.incomeId
                });
              }
            }
          }
          sweptToday = true;
        }
      }

      // Add income AFTER auto-savings
      balance = Math.round((balance + (inc.amt || 0)) * 100) / 100;
      if (Math.abs(balance) < 0.001) balance = 0;

      plan.push({
        ...inc,
        date: d,
        targetDate: d,
        balance,
        insufficientFunds: false,
        savingsAccumulated,
      });
    }

    // 2. Lump-sum savings rescue calculation on breach date:
    // If funds on date d drop below the cushion (targetMin) for the first time in this income cycle,
    // calculate a single lump-sum rescue covering total remaining expenses up to the next income + cushion.
    if (hasEncounteredFirstIncome && savingsAccumulated > 0.001 && !hasRescuedInCurrentCycle && expenseEvents.length > 0) {
      let simBal = balance;
      let breachesColchon = false;
      for (const exp of expenseEvents) {
        simBal = Math.round((simBal + (exp.amt || 0)) * 100) / 100;
        if (simBal < targetMin - 0.001) {
          breachesColchon = true;
        }
      }

      if (breachesColchon) {
        // Calculate sum of all expenses from date d up to (excluding) the next real income
        let totalExpensesUntilNextIncome = 0;
        for (const exp of expenseEvents) {
          totalExpensesUntilNextIncome += Math.abs(exp.amt || 0);
        }
        for (let k = i + 1; k < allDatesList.length; k++) {
          const futureDay = allDatesList[k];
          const futureEvents = map[futureDay] || [];
          let stopAtIncome = false;
          for (const fe of futureEvents) {
            if ((fe.amt || 0) > 0 && fe.type === 'income' && fe.ref?.id !== 'required_starting_fund') {
              stopAtIncome = true;
              break;
            }
            if ((fe.amt || 0) < 0) {
              totalExpensesUntilNextIncome += Math.abs(fe.amt || 0);
            }
          }
          if (stopAtIncome) break;
        }

        const totalNeededAtBreach = Math.round((totalExpensesUntilNextIncome + targetMin) * 100) / 100;
        const deficitNeeded = Math.max(0, Math.round((totalNeededAtBreach - balance) * 100) / 100);
        const lumpRescueAmt = Math.round(Math.min(savingsAccumulated, deficitNeeded) * 100) / 100;

        if (lumpRescueAmt > 0.001) {
          const rescueKey = `rescate_ahorros_${d}`;
          const rescueLegacyKey = `rescate_ahorros_rescate_ahorros_${d}`;
          const ov = overrides[rescueKey] || overrides[rescueLegacyKey] || {};

          if (!ov || !ov.discarded) {
            const isDone = ov ? (ov.done !== undefined ? !!ov.done : !!ov.isPaid) : false;
            const actualDate = (ov && ov.actualDate) ? ov.actualDate : d;
            const finalRescueAmt = (ov && ov.amt !== undefined && ov.isCustomAmt)
              ? Math.abs(parseFloat(String(ov.amt)))
              : lumpRescueAmt;

            balance = Math.round((balance + finalRescueAmt) * 100) / 100;
            if (Math.abs(balance) < 0.001) balance = 0;
            savingsAccumulated = Math.round((savingsAccumulated - finalRescueAmt) * 100) / 100;
            if (Math.abs(savingsAccumulated) < 0.001) savingsAccumulated = 0;

            hasRescuedInCurrentCycle = true;

            plan.push({
              date: actualDate,
              label: 'Rescate de Ahorros',
              type: 'rescate_ahorros',
              amt: finalRescueAmt,
              ref: {
                id: `rescate_ahorros_${d}`,
                name: 'Rescate de Ahorros',
                effectiveColor: '#8b5cf6',
              },
              originalDate: d,
              targetDate: actualDate,
              done: isDone,
              balance,
              isDelayed: false,
              insufficientFunds: false,
              savingsAccumulated,
              isGhost: false
            });
          }
        }
      }
    }

    // 3. Process today's non-income events (expenses, debt payments, savings)
    for (const exp of expenseEvents) {
      balance = Math.round((balance + (exp.amt || 0)) * 100) / 100;
      if (Math.abs(balance) < 0.001) balance = 0;

      if (exp.type === 'savings' && exp.amt < 0) {
        savingsAccumulated = Math.round((savingsAccumulated + Math.abs(exp.amt)) * 100) / 100;
      }

      // Safety fallback: if balance dropped below 0 unexpectedly and savings are still available (only after first income)
      if (hasEncounteredFirstIncome && balance < -0.001 && savingsAccumulated > 0.001) {
        const needed = Math.round((-balance) * 100) / 100;
        const fallbackRescue = Math.round(Math.min(savingsAccumulated, needed) * 100) / 100;
        if (fallbackRescue > 0.001) {
          const fallbackKey = `rescate_ahorros_${d}`;
          const fallbackLegacyKey = `rescate_ahorros_rescate_ahorros_${d}`;
          const ov = overrides[fallbackKey] || overrides[fallbackLegacyKey] || {};

          if (!ov || !ov.discarded) {
            const isDone = ov ? (ov.done !== undefined ? !!ov.done : !!ov.isPaid) : false;
            const actualDate = (ov && ov.actualDate) ? ov.actualDate : d;
            const rescueAmt = (ov && ov.amt !== undefined && ov.isCustomAmt)
              ? Math.abs(parseFloat(String(ov.amt)))
              : fallbackRescue;

            balance = Math.round((balance + rescueAmt) * 100) / 100;
            if (Math.abs(balance) < 0.001) balance = 0;
            savingsAccumulated = Math.round((savingsAccumulated - rescueAmt) * 100) / 100;
            if (Math.abs(savingsAccumulated) < 0.001) savingsAccumulated = 0;

            plan.push({
              date: actualDate,
              label: 'Rescate de Ahorros',
              type: 'rescate_ahorros',
              amt: rescueAmt,
              ref: {
                id: `rescate_ahorros_${d}`,
                name: 'Rescate de Ahorros',
                effectiveColor: '#8b5cf6',
              },
              originalDate: d,
              targetDate: actualDate,
              done: isDone,
              balance,
              isDelayed: false,
              insufficientFunds: false,
              savingsAccumulated,
              isGhost: false
            });
          }
        }
      }

      balance = Math.round(balance * 100) / 100;
      if (Math.abs(balance) < 0.001) balance = 0;

      const isInsufficient = balance < -0.01;
      const isBelowCush = targetMin > 0 && balance < targetMin && !isInsufficient;

      plan.push({
        ...exp,
        date: d,
        targetDate: d,
        balance,
        insufficientFunds: isInsufficient,
        belowCushion: isBelowCush,
        criticalDelay: !exp.done && (isInsufficient || isBelowCush),
        savingsAccumulated,
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

/**
  * Calculates income coverage until the next income occurrence.
  * Evaluates whether each income (or income + available balance) is sufficient
  * to cover all expenses, debt payments, and savings obligations up until the next payday.
  */
export function calculateIncomeCoverageAnalysis(
  profile: UserProfile,
  exchangeRates: Record<string, number> = {}
): IncomePeriodCoverage[] {
  const plan = calculateProjections(profile, exchangeRates);
  if (!plan || plan.length === 0) return [];

  // Filter income occurrences with positive amounts
  const incomes = plan
    .filter(p => p.type === 'income' && p.amt > 0)
    .sort((a, b) => (a.targetDate || a.date || a.originalDate).localeCompare(b.targetDate || b.date || b.originalDate));

  if (incomes.length === 0) return [];

  // Group incomes occurring on the exact same date (e.g. salary + side income on 15th)
  const groupedIncomes: { [date: string]: PlanOccurrence[] } = {};
  incomes.forEach(inc => {
    const d = inc.targetDate || inc.date || inc.originalDate;
    if (!groupedIncomes[d]) groupedIncomes[d] = [];
    groupedIncomes[d].push(inc);
  });

  const incomeDates = Object.keys(groupedIncomes).sort();
  const results: IncomePeriodCoverage[] = [];

  for (let i = 0; i < incomeDates.length; i++) {
    const incDate = incomeDates[i];
    const dayIncomes = groupedIncomes[incDate];
    const totalIncomeAmount = dayIncomes.reduce((acc, item) => acc + item.amt, 0);
    const incomeNames = dayIncomes.map(item => item.ref?.name || item.label.replace(/\s*\(\checkmark\).*/, ''));

    const nextIncDate = i < incomeDates.length - 1 ? incomeDates[i + 1] : null;
    const nextDayIncomes = nextIncDate ? groupedIncomes[nextIncDate] : [];
    const nextIncomeName = nextDayIncomes.length > 0 
      ? nextDayIncomes.map(item => item.ref?.name || item.label.replace(/\s*\(\checkmark\).*/, '')).join(', ')
      : null;

    let daysInPeriod = 30;
    if (nextIncDate) {
      const d1 = new Date(incDate + 'T12:00:00');
      const d2 = new Date(nextIncDate + 'T12:00:00');
      daysInPeriod = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));
    }

    const firstIncOccurrence = dayIncomes[0];
    const balanceAfterIncome = firstIncOccurrence.balance || 0;
    const balanceBeforeIncome = Math.max(0, balanceAfterIncome - totalIncomeAmount);
    const totalAvailable = balanceBeforeIncome + totalIncomeAmount;

    const endLimitDate = nextIncDate || (profile.settings?.planEnd || '2099-12-31');

    // Get all non-income expenses in [incDate, endLimitDate)
    const itemsInPeriod = plan.filter(p => {
      const d = p.targetDate || p.date || p.originalDate;
      const isExpenseType = p.type !== 'income' && p.type !== 'opening_balance' && p.amt < 0;
      return d >= incDate && d < endLimitDate && isExpenseType;
    });

    let totalGastosFijos = 0;
    let totalDeudas = 0;
    let totalAhorros = 0;

    itemsInPeriod.forEach(p => {
      const absAmt = Math.abs(p.amt);
      if (p.type === 'expense') totalGastosFijos += absAmt;
      else if (p.type === 'debt' || p.type === 'debt_cut') totalDeudas += absAmt;
      else if (p.type === 'savings') totalAhorros += absAmt;
      else totalGastosFijos += absAmt;
    });

    const totalEgresos = totalGastosFijos + totalDeudas + totalAhorros;

    // Simulate day by day to check if running balance drops below 0 before next income
    let outOfMoneyDate: string | null = null;
    let simBal = totalAvailable;

    const dayExpensesMap: { [d: string]: number } = {};
    itemsInPeriod.forEach(item => {
      const d = item.targetDate || item.date || item.originalDate;
      dayExpensesMap[d] = (dayExpensesMap[d] || 0) + Math.abs(item.amt);
    });

    const periodDates = datesBetween(
      incDate, 
      nextIncDate 
        ? new Date(new Date(nextIncDate + 'T12:00:00').getTime() - 86400000).toISOString().slice(0, 10) 
        : incDate
    );

    for (const pd of periodDates) {
      if (dayExpensesMap[pd]) {
        simBal -= dayExpensesMap[pd];
        if (simBal < 0 && !outOfMoneyDate) {
          outOfMoneyDate = pd;
        }
      }
    }

    const isCoveredByIncome = totalIncomeAmount >= totalEgresos;
    const isCoveredWithBalance = totalAvailable >= totalEgresos;

    const incomeCoveragePct = totalEgresos > 0 ? (totalIncomeAmount / totalEgresos) * 100 : 100;
    const availableCoveragePct = totalEgresos > 0 ? (totalAvailable / totalEgresos) * 100 : 100;

    const surplusIncome = Math.max(0, totalIncomeAmount - totalEgresos);
    const shortfallIncome = Math.max(0, totalEgresos - totalIncomeAmount);

    const surplusTotal = Math.max(0, totalAvailable - totalEgresos);
    const shortfallTotal = Math.max(0, totalEgresos - totalAvailable);

    results.push({
      incomeDate: incDate,
      incomeNames,
      totalIncomeAmount,
      balanceBeforeIncome,
      totalAvailable,
      nextIncomeDate: nextIncDate,
      nextIncomeName,
      daysInPeriod,
      totalGastosFijos,
      totalDeudas,
      totalAhorros,
      totalEgresos,
      isCoveredByIncome,
      isCoveredWithBalance,
      incomeCoveragePct: Math.round(incomeCoveragePct * 10) / 10,
      availableCoveragePct: Math.round(availableCoveragePct * 10) / 10,
      surplusIncome,
      shortfallIncome,
      surplusTotal,
      shortfallTotal,
      outOfMoneyDate,
      itemsInPeriod,
    });
  }

  return results;
}

export function sanitizeDocId(name: string, fallbackId: string): string {
  if (!name) return fallbackId;
  const cleanName = name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[\✓\√\✔\✅]+/g, '')
    .trim();
  const target = cleanName || name;
  return target
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
    .trim()
    .replace(/[^a-z0-9]+/g, '_') // replace spaces and special chars with underscores
    .replace(/^_+|_+$/g, '');   // trim leading/trailing underscores
}

export function parseOverrideKey(key: string): { type: string; entityId: string; suffix: string } {
  if (!key) return { type: '', entityId: '', suffix: '' };

  // 1. Check legacy cuota key format: debt_[entityId]_cuota_[index]
  const cuotaIndex = key.lastIndexOf('_cuota_');
  if (cuotaIndex !== -1 && key.startsWith('debt_')) {
    const entityId = key.substring(5, cuotaIndex);
    return { type: 'debt', entityId, suffix: key.substring(cuotaIndex + 7) };
  }

  const lastUnderscore = key.lastIndexOf('_');
  if (lastUnderscore !== -1) {
    const prefix = key.substring(0, lastUnderscore);
    const suffixStr = key.substring(lastUnderscore + 1);

    // 2. Standard cuota format: [debtId]_[index] (where suffix is purely numeric, e.g. "1", "2")
    // Works even if debtId starts with "debt_" like "debt_1712345678_1"
    if (/^\d+$/.test(suffixStr)) {
      return { type: 'debt', entityId: prefix, suffix: suffixStr };
    }

    // 3. Format with prefix and date suffix: income_[id]_[date], expense_[id]_[date], debt_[id]_[date]
    if (key.startsWith('income_')) {
      return { type: 'income', entityId: key.substring(7, lastUnderscore), suffix: suffixStr };
    } else if (key.startsWith('expense_')) {
      return { type: 'expense', entityId: key.substring(8, lastUnderscore), suffix: suffixStr };
    } else if (key.startsWith('debt_')) {
      return { type: 'debt', entityId: key.substring(5, lastUnderscore), suffix: suffixStr };
    }
  }

  return { type: '', entityId: '', suffix: '' };
}

/**
 * Calculates the cumulative balance and available amount for each income account.
 * Each income represents an account. Leftovers accumulate over time after paying assigned expenses/debts.
 */
export function calculateIncomeAccountBalances(
  profile: UserProfile,
  plan: PlanOccurrence[],
  convertAmount?: (amt: number, curr?: string) => number,
  today: string = todayStr()
): IncomeAccountBalance[] {
  const incomes = profile.incomes || [];
  if (incomes.length === 0) return [];

  const initialOpeningBalance = Number(profile.settings?.openingBalance) || 0;
  const validIncomeIds = new Set(incomes.map(i => i.id));

  return incomes.map((inc, index) => {
    // Initial opening balance is allocated to the primary/first income account by default
    const openingAmt = index === 0 ? initialOpeningBalance : 0;
    
    let totalInflowsToDate = openingAmt;
    let totalProjectedInflows = openingAmt;
    let nextIncomeDate: string | null = null;

    // Count items explicitly configured with this income as funding source
    let assignedItemsCount = 0;
    (profile.expenses || []).forEach(e => {
      if (e.incomeId === inc.id) assignedItemsCount++;
    });
    (profile.debts || []).forEach(d => {
      if (d.incomeId === inc.id) assignedItemsCount++;
    });
    (profile.savingsList || []).forEach(s => {
      if (s.incomeId === inc.id) assignedItemsCount++;
    });

    // Scan occurrences from the projected financial plan
    let totalOutflowsToDate = 0;
    let totalProjectedOutflows = 0;
    const paidMovements: Array<{
      date: string;
      label: string;
      type: string;
      amount: number;
    }> = [];

    (plan || []).forEach(occ => {
      if (!occ) return;
      if (occ.type === 'opening_balance') return; // Counted in openingAmt on index 0

      const isOccDone = !!occ.done;
      const occDate = occ.date || occ.targetDate || occ.originalDate;
      const isPastOrToday = occDate <= today || (occ.targetDate && occ.targetDate <= today);
      const affectsCash = !occ.noAffectBalance;
      const occUsd = Math.abs(occ.amt || 0);

      if (occ.type === 'income' || occ.type === 'rescate_ahorros') {
        const occIncomeId = occ.incomeId || occ.ref?.incomeId;
        const isThisAccount = occ.ref?.id === inc.id || 
          occIncomeId === inc.id ||
          (!validIncomeIds.has(occ.ref?.id) && (!occIncomeId || !validIncomeIds.has(occIncomeId)) && index === 0);

        if (isThisAccount) {
          totalProjectedInflows += occUsd;
          // Actual money in pocket: only when confirmed done and occurred up to today
          if (isOccDone && affectsCash && isPastOrToday) {
            totalInflowsToDate += occUsd;
          }
          if (!isOccDone && occDate >= today && (!nextIncomeDate || occDate < nextIncomeDate)) {
            nextIncomeDate = occDate;
          }
        }
      } else {
        // Outflows (expense, debt, savings, etc.)
        const assignedId = occ.incomeId || occ.ref?.incomeId;
        const isAssignedToThis = assignedId === inc.id;
        // If unassigned or assigned to a non-existent account, attribute to primary account (index === 0)
        const isFallbackToPrimary = index === 0 && (!assignedId || !validIncomeIds.has(assignedId));

        if ((isAssignedToThis || isFallbackToPrimary) && affectsCash) {
          totalProjectedOutflows += occUsd;
          // Actual money subtracted from current balance: occurred when marked as done up to today
          if (isOccDone && isPastOrToday) {
            totalOutflowsToDate += occUsd;
            paidMovements.push({
              date: occDate,
              label: occ.label ? occ.label.replace(/\s*\(✓.*?\)/g, '').trim() : 'Egreso',
              type: occ.type,
              amount: occUsd,
            });
          }
        }
      }
    });

    // Sort paid movements latest first
    paidMovements.sort((a, b) => b.date.localeCompare(a.date));

    const availableToday = totalInflowsToDate - totalOutflowsToDate;
    const projectedBalance = totalProjectedInflows - totalProjectedOutflows;

    return {
      id: inc.id,
      name: inc.name,
      amount: inc.amount,
      freq: inc.freq,
      day: inc.day,
      currency: inc.currency,
      strictDate: inc.strictDate,
      totalInflowsToDate,
      totalOutflowsToDate,
      availableToday,
      totalProjectedInflows,
      totalProjectedOutflows,
      projectedBalance,
      assignedItemsCount,
      nextIncomeDate,
      paidMovements
    };
  });
}


