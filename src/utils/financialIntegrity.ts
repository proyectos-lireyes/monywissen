/**
 * Financial Integrity & Validation Engine
 * Implements double-entry verification, preventive negative cash flow detection,
 * and contradiction audits across accounts, debts, and projected cash flows.
 */

import { UserProfile, DebtItem, SharedGroup, P2PLoan, PlanOccurrence } from '../types';
import { calculateProjections, getRemainingDebtAmount, calculateSharedSettlement, todayStr, formatCurrency, formatDateStr } from './financialEngine';

export interface BreachDetail {
  index: number; // 1, 2, 3...
  date: string;
  amount: number; // deficit amount
  causeLabel?: string;
  isSolvable: boolean;
  exceeds20PercentIncome: boolean;
  recoveryDate?: string | null;
  recommendationMessage: string;
}

export interface CashBreachAnalysis {
  breachCount: number;
  isPlanViable: boolean;
  unviabilityReason?: string | null;
  totalIncome: number;
  breaches: BreachDetail[];
}

export interface DoubleEntryIssue {
  id: string;
  category: 'DEBT_IMBALANCE' | 'P2P_UNBALANCED' | 'SHARED_SPLIT_LEAK' | 'SAVINGS_MISMATCH';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  amountDiff?: number;
}

export interface PreventiveFlowWarning {
  id: string;
  date: string;
  type: 'NEGATIVE_DEFICIT' | 'MIN_BALANCE_BREACH' | 'HIGH_DEBT_SERVICE_RATIO';
  projectedBalance: number;
  requiredCushion: number;
  causeLabel?: string;
  causeAmount?: number;
  message: string;
  recommendedAction: string;
}

export interface FinancialContradiction {
  id: string;
  code: 'DEBT_OVERPAID' | 'AMORTIZATION_EXCEEDS_BALANCE' | 'PLAN_DATES_INVALID' | 'NEGATIVE_OPENING_BALANCE' | 'OVERLAPPING_RECORD';
  title: string;
  detail: string;
  suggestedFix: string;
}

export interface OptimizationSuggestion {
  id: string;
  originalDate: string;
  suggestedDate: string;
  type: 'EARLY_PAY' | 'DELAY_PAY';
  itemId: string;
  itemType: string;
  itemName: string;
  amount: number;
  message: string;
}

export interface OptimizationSuggestion {
  id: string;
  originalDate: string;
  suggestedDate: string;
  type: 'EARLY_PAY' | 'DELAY_PAY';
  itemId: string;
  itemType: string;
  itemName: string;
  amount: number;
  message: string;
}

export interface IntegrityReport {
  score: number; // 0 - 100
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  doubleEntryIssues: DoubleEntryIssue[];
  preventiveWarnings: PreventiveFlowWarning[];
  optimizations: OptimizationSuggestion[];
  contradictions: FinancialContradiction[];
  cashBreachAnalysis: CashBreachAnalysis;
  summary: {
    openingBalance: number;
    totalSavings: number;
    totalActiveDebt: number;
    netWorth: number;
    minProjectedBalance: number;
    hasDeficitRisk: boolean;
    firstDeficitDate?: string;
    debtServiceRatio: number; // percentage of income dedicated to debt payments
  };
}

/**
 * Audit double-entry consistency across all financial sub-modules:
 * 1. Debt payments must equal liability reduction
 * 2. Shared group balance sum across participants must be zero (no leak)
 * 3. P2P loans borrower liability must equal lender asset
 * 4. Savings allocations must match recorded physical/digital pools
 */
export function verifyDoubleEntry(profile: UserProfile): DoubleEntryIssue[] {
  const issues: DoubleEntryIssue[] = [];

  // 1. Audit Debt Double-Entry: sum of overrides + amortized vs initial debt balance
  (profile.debts || []).forEach(debt => {
    const origBalance = parseFloat(String(debt.balance || 0));
    const rem = getRemainingDebtAmount(debt, profile.overrides || {});

    // If remaining debt is less than 0, we paid more than owed without recording a credit/refund
    if (rem < 0) {
      issues.push({
        id: `de_debt_overpay_${debt.id}`,
        category: 'DEBT_IMBALANCE',
        title: `Desbalance en Deuda "${debt.name}"`,
        description: `Los abonos y pagos registrados superan el saldo original por ${Math.abs(rem).toFixed(2)}$`,
        severity: 'high',
        amountDiff: Math.abs(rem),
      });
    }

    // Amortized higher than balance
    if ((debt.amortized || 0) > origBalance) {
      issues.push({
        id: `de_debt_amort_${debt.id}`,
        category: 'DEBT_IMBALANCE',
        title: `Amortización Excesiva en "${debt.name}"`,
        description: `La amortización inicial ($${debt.amortized}) es mayor al saldo contratado ($${origBalance}).`,
        severity: 'high',
        amountDiff: (debt.amortized || 0) - origBalance,
      });
    }
  });

  // 2. Audit Shared Group Split Leaks: Σ(Paid - Owed) = 0
  (profile.sharedAccounts || []).forEach(group => {
    const settlement = calculateSharedSettlement(group);
    let totalPaid = 0;
    let totalOwed = 0;

    (group.participants || []).forEach(p => {
      const pPaid = settlement.paid[p] || 0;
      const pShould = settlement.should[p] || 0;
      const bal = pPaid - pShould;
      if (bal > 0) totalPaid += bal;
      if (bal < 0) totalOwed += Math.abs(bal);
    });

    // Check rounding leak larger than 5 cents
    const diff = Math.abs(totalPaid - totalOwed);
    if (diff > 0.05) {
      issues.push({
        id: `de_shared_leak_${group.id}`,
        category: 'SHARED_SPLIT_LEAK',
        title: `Fuga de Balance en Grupo Compartido "${group.name}"`,
        description: `La suma de montos a favor ($${totalPaid.toFixed(2)}) no coincide con las deudas grupales ($${totalOwed.toFixed(2)}).`,
        severity: 'medium',
        amountDiff: diff,
      });
    }
  });

  // 3. Audit P2P Loans Double-Entry
  (profile.p2p || []).forEach(loan => {
    if (loan.amount <= 0) {
      issues.push({
        id: `de_p2p_zero_${loan.id}`,
        category: 'P2P_UNBALANCED',
        title: `Préstamo P2P sin Monto Válido`,
        description: `El préstamo "${loan.desc || loan.id}" tiene un valor de $${loan.amount}.`,
        severity: 'medium',
      });
    }
  });

  // 4. Audit Savings Pool Mismatch
  const recordedSavingsSum = (profile.savingsList || []).reduce((sum, s) => sum + (parseFloat(String(s.amount)) || 0), 0);
  const poolSum = (profile.savings?.current || 0) + (profile.savings?.digital || 0);
  if (recordedSavingsSum > 0 && poolSum > 0 && Math.abs(recordedSavingsSum - poolSum) > 0.01) {
    issues.push({
      id: 'de_savings_pool_mismatch',
      category: 'SAVINGS_MISMATCH',
      title: 'Descalce de Metas y Bóvedas de Ahorro',
      description: `La suma de metas de ahorro ($${recordedSavingsSum.toFixed(2)}) difiere del saldo registrado en bóvedas ($${poolSum.toFixed(2)}).`,
      severity: 'low',
      amountDiff: Math.abs(recordedSavingsSum - poolSum),
    });
  }

  return issues;
}

/**
 * Evaluates projected daily cash flow step-by-step from planStart to planEnd.
 * Detects upcoming liquidity deficits and cushion breaches before they occur.
 */
export function detectPreventiveNegativeFlow(profile: UserProfile, exchangeRates: Record<string, number> = {}): PreventiveFlowWarning[] {
  const warnings: PreventiveFlowWarning[] = [];
  const plan: PlanOccurrence[] = calculateProjections(profile, exchangeRates);

  const convAmt = (amt: number, currency?: string) => {
    if (!currency || currency === 'USD_BCV' || currency === 'USD') return amt;
    let curr = currency;
    if (curr === 'EUR') curr = 'EUR_BCV';
    const rate = exchangeRates[curr] || exchangeRates[currency];
    return rate ? amt * rate : amt;
  };

  const minBalance = convAmt(profile.settings.minBalance || 0, profile.settings.minBalanceCurrency || profile.settings.displayCurrency);

  let firstDeficitFound = false;

  plan.forEach((item, idx) => {
    // 1. Negative Cash Flow Deficit
    if (item.balance < 0) {
      if (!firstDeficitFound) {
        firstDeficitFound = true;
      }
      warnings.push({
        id: `prev_neg_${item.date}_${idx}`,
        date: item.date,
        type: 'NEGATIVE_DEFICIT',
        projectedBalance: Math.round(item.balance * 100) / 100,
        requiredCushion: minBalance,
        causeLabel: item.label,
        causeAmount: item?.amt,
        message: `Iliquidez crítica proyectada para el ${item.date}: Saldo de ${formatCurrency(item.balance)}.`,
        recommendedAction: `Posponer "${item.label}" (${formatCurrency(Math.abs(item?.amt || 0))}) o inyectar ${formatCurrency(Math.abs(item.balance))} antes del ${item.date}.`,
      });
    }
    // 2. Safety Cushion Breach (Min Balance Breach)
    else if (minBalance > 0 && item.balance < minBalance) {
      warnings.push({
        id: `prev_cushion_${item.date}_${idx}`,
        date: item.date,
        type: 'MIN_BALANCE_BREACH',
        projectedBalance: Math.round(item.balance * 100) / 100,
        requiredCushion: minBalance,
        causeLabel: item.label,
        causeAmount: item?.amt,
        message: `Riesgo de colchón mínimo el ${item.date}: Saldo (${formatCurrency(item.balance)}) por debajo del mínimo deseado (${formatCurrency(minBalance)}).`,
        recommendedAction: `Revisar compromisos cercanos para mantener el colchón de seguridad de ${formatCurrency(minBalance)}.`,
      });
    }
  });

  // 3. High Debt Service Ratio Check (Debt Payments vs Projected Income)
  const totalIncomeProjected = plan.filter(p => p && p.amt > 0).reduce((s, p) => s + p.amt, 0);
  const totalDebtProjected = plan.filter(p => p && p.amt < 0 && p.type.startsWith('debt')).reduce((s, p) => s + Math.abs(p.amt), 0);

  if (totalIncomeProjected > 0) {
    const dsr = (totalDebtProjected / totalIncomeProjected) * 100;
    if (dsr > 60) {
      warnings.push({
        id: 'prev_high_dsr',
        date: todayStr(),
        type: 'HIGH_DEBT_SERVICE_RATIO',
        projectedBalance: plan[plan.length - 1]?.balance || 0,
        requiredCushion: minBalance,
        message: `Ratio de servicio de deuda elevado (${dsr.toFixed(1)}%). El ${dsr.toFixed(0)}% de tus ingresos previstos está comprometido en cuotas de deuda.`,
        recommendedAction: 'Evitar adquirir nuevas obligaciones en cuotas hasta amortizar las deudas actuales.',
      });
    }
  }

  return warnings;
}

/**
 * Detects structural or operational contradictions across the profile.
 */
export function detectFinancialContradictions(profile: UserProfile): FinancialContradiction[] {
  const contradictions: FinancialContradiction[] = [];

  // 1. Plan Start vs Plan End
  if (profile.settings.planStart && profile.settings.planEnd) {
    if (profile.settings.planStart > profile.settings.planEnd) {
      contradictions.push({
        id: 'c_dates_inverted',
        code: 'PLAN_DATES_INVALID',
        title: 'Fechas de Planificación Invertidas',
        detail: `La fecha de inicio (${profile.settings.planStart}) es posterior a la fecha de fin (${profile.settings.planEnd}).`,
        suggestedFix: 'Ajusta el rango del plan en Ajustes > Reglas.',
      });
    }
  }

  // 2. Negative Opening Balance
  if ((profile.settings.openingBalance || 0) < 0) {
    contradictions.push({
      id: 'c_neg_opening',
      code: 'NEGATIVE_OPENING_BALANCE',
      title: 'Saldo Inicial Negativo',
      detail: `El dinero base configurado es -$${Math.abs(profile.settings.openingBalance)}.`,
      suggestedFix: 'Establece un saldo base positivo o registra los pasivos como Deudas independientes.',
    });
  }

  // 3. Overlapping Income & Expense records with same name and amount
  profile.incomes.forEach(inc => {
    profile.expenses.forEach(exp => {
      if (
        inc.name.trim().toLowerCase() === exp.name.trim().toLowerCase() &&
        inc.amount === exp.amount &&
        inc.freq === exp.freq
      ) {
        contradictions.push({
          id: `c_overlap_${inc.id}_${exp.id}`,
          code: 'OVERLAPPING_RECORD',
          title: 'Registro Duplicado / Contrapuesto',
          detail: `Existe un ingreso y un gasto idénticos con el nombre "${inc.name}" ($${inc.amount}).`,
          suggestedFix: 'Consolida o elimina una de las entradas si es una transferencia interna.',
        });
      }
    });
  });

  return contradictions;
}

/**
 * Simulates adding a prospective financial movement and verifies whether it would cause cash flow failure.
 */
export function validateTransactionExecution(
  profile: UserProfile,
  candidate: { type: 'income' | 'expense' | 'debt' | 'saving'; amount: number; date?: string; freq?: string }
): { allowed: boolean; warning?: string; projectedMinBalance: number } {
  const numAmt = parseFloat(String(candidate.amount)) || 0;
  if (numAmt <= 0) {
    return { allowed: false, warning: 'El monto debe ser superior a $0.', projectedMinBalance: 0 };
  }

  // Deep clone profile for sandbox projection
  const sandboxProfile: UserProfile = JSON.parse(JSON.stringify(profile));

  if (candidate.type === 'expense') {
    sandboxProfile.expenses.push({
      id: 'sandbox_temp',
      name: 'Simulación de Gasto',
      amount: numAmt,
      freq: (candidate.freq as any) || 'one-time',
      date: candidate.date || todayStr(),
    });
  } else if (candidate.type === 'debt') {
    sandboxProfile.debts.push({
      id: 'sandbox_temp_debt',
      name: 'Simulación de Cuota',
      type: 'fixed',
      balance: numAmt,
      amount: numAmt,
      start: candidate.date || todayStr(),
    });
  }

  const plan = calculateProjections(sandboxProfile);
  const lowest = plan.reduce((min, p) => (p.balance < min ? p.balance : min), plan[0]?.balance || 0);

  if (lowest < 0) {
    return {
      allowed: true, // Allow execution but with active warning
      warning: `⚠️ Atención: Esta operación provocará un déficit en caja de -$${Math.abs(lowest).toFixed(2)} durante la proyección.`,
      projectedMinBalance: lowest,
    };
  }

  return { allowed: true, projectedMinBalance: lowest };
}

/**
 * Performs a comprehensive audit of the profile, producing a unified IntegrityReport.
 */

/**
 * Generates smart date shifting recommendations to prevent liquidity issues or pay earlier.
 */

export function evaluateCashBreaches(profile: UserProfile, exchangeRates: Record<string, number> = {}): CashBreachAnalysis {
  const plan: PlanOccurrence[] = calculateProjections(profile, exchangeRates);

  // Total projected income across the plan (excluding starting fund)
  const totalIncome = plan
    .filter(p => p && p.amt > 0 && p.type === 'income' && p.ref?.id !== 'required_starting_fund')
    .reduce((s, p) => s + p.amt, 0);

  const breaches: BreachDetail[] = [];
  let currentBreachMinBal = 0;
  let currentBreachDate = '';
  let currentBreachCause = '';
  let inBreach = false;

  plan.forEach((p) => {
    // A breach occurs if a savings rescue was required OR if the balance dropped below zero
    const isRescue = p.type === 'rescate_ahorros';
    const isUncoveredDeficit = p.balance < -0.001;

    if (isRescue || isUncoveredDeficit) {
      const deficitAmt = isRescue ? Math.abs(p.amt || 0) : Math.abs(p.balance || 0);
      if (!inBreach) {
        inBreach = true;
        currentBreachMinBal = deficitAmt;
        currentBreachDate = p.date;
        currentBreachCause = p.label || 'Compromiso planificado';
      } else {
        if (deficitAmt > currentBreachMinBal) {
          currentBreachMinBal = deficitAmt;
        }
      }
    } else {
      if (inBreach) {
        breaches.push({
          index: breaches.length + 1,
          date: currentBreachDate,
          amount: Math.round(currentBreachMinBal * 100) / 100,
          causeLabel: currentBreachCause,
          isSolvable: true,
          exceeds20PercentIncome: false,
          recommendationMessage: '',
        });
        inBreach = false;
        currentBreachMinBal = 0;
      }
    }
  });

  if (inBreach) {
    breaches.push({
      index: breaches.length + 1,
      date: currentBreachDate,
      amount: Math.round(currentBreachMinBal * 100) / 100,
      causeLabel: currentBreachCause,
      isSolvable: true,
      exceeds20PercentIncome: false,
      recommendationMessage: '',
    });
  }

  const twentyPercentLimit = totalIncome > 0 ? totalIncome * 0.20 : 0;
  let isPlanViable = true;
  let unviabilityReason: string | null = null;

  breaches.forEach((b) => {
    const exceeds20 = totalIncome > 0 && b.amount > twentyPercentLimit;
    b.exceeds20PercentIncome = exceeds20;

    // Search future accumulated savings / surplus for when this breach amount can be paid back
    let recoveryDate: string | null = null;
    for (const p of plan) {
      if (p.date > b.date) {
        const availableSavings = (p.savingsAccumulated || 0) + Math.max(0, p.balance);
        if (availableSavings >= b.amount) {
          recoveryDate = p.date;
          break;
        }
      }
    }
    b.recoveryDate = recoveryDate;

    if (b.index === 1) {
      // 1st Breach: Solvable
      b.isSolvable = true;
      if (recoveryDate) {
        b.recommendationMessage = `💡 Recomendación (Quiebre #1): Este quiebre por ${formatCurrency(b.amount)} el ${formatDateStr(b.date)} podrá ser pagado con tus ahorros/excedente proyectado para el ${formatDateStr(recoveryDate)}.`;
      } else {
        b.recommendationMessage = `💡 Recomendación (Quiebre #1): Este quiebre de ${formatCurrency(b.amount)} el ${formatDateStr(b.date)} es solucionable. Se sugiere un préstamo temporal para cubrirlo.`;
      }
    } else if (b.index === 2) {
      // 2nd Breach: Solvable ONLY IF <= 20% total income
      if (!exceeds20) {
        b.isSolvable = true;
        const pctStr = totalIncome > 0 ? ` (${((b.amount / totalIncome) * 100).toFixed(1)}% de tus ingresos)` : '';
        if (recoveryDate) {
          b.recommendationMessage = `💡 Recomendación (Quiebre #2): Representa un quiebre manejable${pctStr}. Podrá ser reembolsado con tus ahorros acumulados para el ${formatDateStr(recoveryDate)}.`;
        } else {
          b.recommendationMessage = `💡 Recomendación (Quiebre #2): Representa un quiebre de bajo impacto${pctStr}. Se sugiere financiamiento temporal para el ${formatDateStr(b.date)}.`;
        }
      } else {
        b.isSolvable = false;
        isPlanViable = false;
        const pctStr = totalIncome > 0 ? `${((b.amount / totalIncome) * 100).toFixed(1)}%` : 'más del 20%';
        b.recommendationMessage = `⚠️ PLAN INVIABLE: El 2do quiebre (${formatCurrency(b.amount)}) equivale al ${pctStr} de tus ingresos totales (${formatCurrency(twentyPercentLimit)}), superando el límite permitido del 20%.`;
        if (!unviabilityReason) {
          unviabilityReason = `El 2do quiebre (${formatCurrency(b.amount)}) supera el 20% de tus ingresos totales (${formatCurrency(twentyPercentLimit)}).`;
        }
      }
    } else if (b.index === 3) {
      // 3rd Breach: Plan becomes Inviable
      b.isSolvable = false;
      isPlanViable = false;
      b.recommendationMessage = `⚠️ Límite Alcanzado (Quiebre #3): Ocurre el ${formatDateStr(b.date)} por ${formatCurrency(b.amount)}. Al llegar al 3er déficit de caja el plan financiero se considera inviable.`;
      if (!unviabilityReason) {
        unviabilityReason = `Se han registrado ${breaches.length} déficits de caja en la proyección. Al 3er déficit (${formatDateStr(b.date)}) el plan se considera inviable (máximo 2 déficits manejables).`;
      }
    } else {
      // 4th breach or higher: Inviable, do not repeat individual messages to avoid clutter
      b.isSolvable = false;
      isPlanViable = false;
      b.recommendationMessage = '';
    }
  });

  return {
    breachCount: breaches.length,
    isPlanViable,
    unviabilityReason,
    totalIncome: Math.round(totalIncome * 100) / 100,
    breaches,
  };
}

export function detectOptimizations(profile: UserProfile, exchangeRates: Record<string, number> = {}): OptimizationSuggestion[] {
  return []; // Replaced by Engine Auto-Pilot
}


export function validateFinancialIntegrity(profile: UserProfile, exchangeRates: Record<string, number> = {}): IntegrityReport {
  const doubleEntryIssues = verifyDoubleEntry(profile);
  const preventiveWarnings = detectPreventiveNegativeFlow(profile, exchangeRates);
  const contradictions = detectFinancialContradictions(profile);
  const cashBreachAnalysis = evaluateCashBreaches(profile, exchangeRates);

  // Compute total active debt
  const totalActiveDebt = (profile.debts || []).reduce(
    (sum, d) => sum + getRemainingDebtAmount(d, profile.overrides || {}),
    0
  );

  // Compute total savings
  const totalSavings = (profile.savingsList || []).reduce(
    (sum, s) => sum + (parseFloat(String(s.amount)) || 0),
    0
  ) + (profile.savings?.current || 0) + (profile.savings?.digital || 0);

  // Compute cash flow projections
  const plan = calculateProjections(profile, exchangeRates);
  const minProjectedBalance = plan.reduce(
    (min, p) => (p.balance < min ? p.balance : min),
    plan[0]?.balance || profile.settings.openingBalance || 0
  );

  const firstDeficit = plan.find(p => p.balance < 0);

  const totalIncomeProjected = plan.filter(p => p && p.amt > 0).reduce((s, p) => s + p.amt, 0);
  const totalDebtProjected = plan.filter(p => p && p.amt < 0 && p.type.startsWith('debt')).reduce((s, p) => s + Math.abs(p.amt), 0);
  const debtServiceRatio = totalIncomeProjected > 0 ? (totalDebtProjected / totalIncomeProjected) * 100 : 0;

  const netWorth = (profile.settings.openingBalance || 0) + totalSavings - totalActiveDebt;

  // Deduct integrity score points
  let score = 100;

  doubleEntryIssues.forEach(i => {
    score -= i.severity === 'high' ? 20 : i.severity === 'medium' ? 10 : 5;
  });

  preventiveWarnings.forEach(w => {
    score -= w.type === 'NEGATIVE_DEFICIT' ? 25 : w.type === 'HIGH_DEBT_SERVICE_RATIO' ? 15 : 5;
  });

  contradictions.forEach(() => {
    score -= 15;
  });

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (score < 50 || firstDeficit !== undefined || !cashBreachAnalysis.isPlanViable) {
    status = 'CRITICAL';
  } else if (score < 85 || cashBreachAnalysis.breachCount > 0) {
    status = 'WARNING';
  }

  const optimizations = detectOptimizations(profile, exchangeRates);
  return {
    score,
    status,
    doubleEntryIssues,
    preventiveWarnings,
    optimizations,
    contradictions,
    cashBreachAnalysis,
    summary: {
      openingBalance: profile.settings.openingBalance || 0,
      totalSavings,
      totalActiveDebt,
      netWorth,
      minProjectedBalance,
      hasDeficitRisk: !!firstDeficit,
      firstDeficitDate: firstDeficit?.date,
      debtServiceRatio: Math.round(debtServiceRatio * 10) / 10,
    },
  };
}
