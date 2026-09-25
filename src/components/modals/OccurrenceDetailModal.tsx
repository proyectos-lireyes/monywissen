import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateStr, todayStr, calculateProjections, calculateAmortizationPlan, calculateIncomeAccountBalances, sanitizeDocId, getOverrideForItem } from '../../utils/financialEngine';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, RotateCcw, Calendar as CalendarIcon, ArrowRightLeft, CreditCard, Trash2, Check, ShieldCheck } from 'lucide-react';

interface OccurrenceDetailModalProps {
  isOpen: boolean;
  type: string | null;
  refId: string | null;
  originalDate: string | null;
  planDate: string | null;
  onClose: () => void;
}

export const OccurrenceDetailModal: React.FC<OccurrenceDetailModalProps> = ({
  isOpen,
  type,
  refId,
  originalDate,
  planDate,
  onClose,
}) => {
  const { profile, updateProfileData, showToast, convertAmount, exchangeRates } = useApp();
    const [isCelebrating, setIsCelebrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
const [postponeDate, setPostponeDate] = useState(todayStr());
  const [showPostponeInput, setShowPostponeInput] = useState(false);
  const [partialAmt, setPartialAmt] = useState('');
  const [partialCurrency, setPartialCurrency] = useState('USD_BCV');

  // Editing partial payment state
  const [editingPartialIdx, setEditingPartialIdx] = useState<number | null>(null);
  const [editingPartialAmt, setEditingPartialAmt] = useState('');
  const [editingPartialCurrency, setEditingPartialCurrency] = useState('USD_BCV');

  // Multi-currency payment state
  const [payCurrency, setPayCurrency] = useState('USD_BCV');
  const [customPayAmt, setCustomPayAmt] = useState('');
  const [showCustomPay, setShowCustomPay] = useState(false);
  const [actualDate, setActualDate] = useState(todayStr());
  const [affectBalance, setAffectBalance] = useState<boolean>(true);
  const [selectedIncomeId, setSelectedIncomeId] = useState<string>('');

  // Find target item and its details
  let targetItem: any = null;
  let itemTitle = 'Movimiento Planificado';
  let baseAmount = 0;
  let itemCurrency = 'USD_BCV';
  let plannedUsdAmount = 0;
  let occurrence: any = null;

  if (profile && type && refId) {
    const rawId = String(refId || '');
    const idWithout = rawId.replace(/^(debt_|income_|expense_|savings_)/, '');

    // Find raw target item first so we have name/id references
    if (type === 'income') {
      targetItem = (profile.incomes || []).find(i => i.id === refId || i.id === idWithout || sanitizeDocId(i.name, i.id) === sanitizeDocId(rawId, rawId));
    } else if (type === 'expense') {
      targetItem = (profile.expenses || []).find(e => e.id === refId || e.id === idWithout || sanitizeDocId(e.name, e.id) === sanitizeDocId(rawId, rawId));
    } else if (type === 'debt' || type === 'debt_cut') {
      targetItem = (profile.debts || []).find(d => d.id === refId || d.id === idWithout || sanitizeDocId(d.name, d.id) === sanitizeDocId(rawId, rawId));
    } else if (type === 'savings') {
      targetItem = (profile.savingsList || []).find(s => s.id === refId || s.id === idWithout);
    }

    const plan = calculateProjections(profile, exchangeRates);
    occurrence = plan.find(p => 
      p.type === type && 
      (
        p.ref?.id === refId || 
        p.ref?.id === idWithout || 
        (targetItem && p.ref?.id === targetItem.id) ||
        (targetItem && p.ref?.name === targetItem.name)
      ) && 
      (p.originalDate === originalDate || p.targetDate === originalDate || p.date === originalDate || p.originalDate === planDate)
    );
    
    if (!occurrence && type === 'rescate_ahorros') {
      occurrence = plan.find(p => p.type === 'rescate_ahorros' && (p.date === planDate || p.originalDate === originalDate || p.ref?.id === refId));
    }

    if (!occurrence && type === 'debt' && targetItem) {
      const expectedCuotas = calculateAmortizationPlan(targetItem, profile.overrides || {}, profile.settings?.customDebts || [], undefined, exchangeRates);
      const cuota = expectedCuotas.find(c => c.date === originalDate);
      if (cuota) {
        const cuotaAmtNative = cuota.requiredPay > 0 ? cuota.requiredPay : cuota.expectedAmount;
        plannedUsdAmount = convertAmount(cuotaAmtNative, targetItem.currency);
        itemTitle = targetItem.name;
        occurrence = { plannedAmt: plannedUsdAmount, label: itemTitle, ref: targetItem, done: cuota.isPaid, isPaid: cuota.isPaid } as any;
      }
    }

    if (occurrence) {
      itemTitle = occurrence.label;
      plannedUsdAmount = occurrence.plannedAmt !== undefined ? occurrence.plannedAmt : Math.abs(occurrence.amt || 0);
      
      if (targetItem && targetItem.currency) {
         itemCurrency = targetItem.currency;
         if (itemCurrency !== 'USD_BCV') {
            const rate = exchangeRates[itemCurrency] || 1;
            baseAmount = plannedUsdAmount / rate;
         } else {
            baseAmount = plannedUsdAmount;
         }
      } else {
         baseAmount = plannedUsdAmount;
      }
    } else if (targetItem) {
      // Fallback if not found in plan
      itemTitle = targetItem.name || 'Movimiento';
      itemCurrency = targetItem.currency || 'USD_BCV';
      if (type === 'debt' || type === 'debt_cut') {
        baseAmount = parseFloat(targetItem.minPay || targetItem.amount || targetItem.balance || 0);
      } else {
        baseAmount = parseFloat(targetItem.amount || 0);
      }
      plannedUsdAmount = convertAmount(baseAmount, itemCurrency);
    }
  }

  const customDebtDef = (type === 'debt' || type === 'debt_cut')
    ? (profile.settings?.customDebts || []).find((cd: any) => cd.id === targetItem?.type)
    : null;

  const itemColor = (type === 'debt' || type === 'debt_cut')
    ? (targetItem?.color || customDebtDef?.color || occurrence?.ref?.effectiveColor || '#f59e0b')
    : (type === 'income' ? '#10b981' : (type === 'savings' ? '#10b981' : (type === 'rescate_ahorros' ? '#8b5cf6' : '#ef4444')));

  const itemTypeLabel = (type === 'debt' || type === 'debt_cut')
    ? (customDebtDef ? `✨ ${customDebtDef.name}` : (targetItem?.type === 'card' ? '💳 Tarjeta de Crédito' : (targetItem?.type === 'loan_interest' ? '🏦 Préstamo con Interés' : '🤝 Préstamo / Cuota')))
    : (type === 'income' ? '📈 Ingreso' : (type === 'savings' ? '💰 Ahorro' : (type === 'rescate_ahorros' ? '🛟 Rescate de Ahorros' : '📉 Gasto / Pago')));

  const cuotaKey = occurrence?.ref?.cuotaKey;
  const legacyKey = `${type}_${refId}_${originalDate}`;
  const key = cuotaKey || legacyKey;

  const idStr = String(refId || '');
  const idWithout = idStr.replace(/^(debt_|income_|expense_)/, '');
  const idWith = idStr.startsWith('debt_') ? idStr : 'debt_' + idStr;
  const cuotaIndex = occurrence?.ref?.index;

  const overrides = profile.overrides || {};
  let overrideRecord = getOverrideForItem(overrides, type, occurrence?.ref || targetItem || { id: refId, name: targetItem?.name }, originalDate) || {};

  if (!overrideRecord || Object.keys(overrideRecord).length === 0) {
    overrideRecord = (cuotaKey ? overrides[cuotaKey] : null) || 
                     overrides[key] || 
                     overrides[legacyKey] || 
                     overrides[`${type}_${idWithout}_${originalDate}`] || 
                     overrides[`${type}_${idWith}_${originalDate}`] || 
                     overrides[`${idWithout}_${originalDate}`] || 
                     overrides[`${idWith}_${originalDate}`] || {};
  }

  if (cuotaIndex !== undefined && !overrideRecord.done) {
    const cuotaOv = overrides[`${idWith}_cuota_${cuotaIndex}`] || 
                    overrides[`${idWithout}_cuota_${cuotaIndex}`] || 
                    overrides[`${idWith}_${cuotaIndex}`] || 
                    overrides[`${idWithout}_${cuotaIndex}`];
    if (cuotaOv) overrideRecord = cuotaOv;
  }

  const isDone = occurrence?.done !== undefined
    ? !!occurrence.done
    : occurrence?.isPaid !== undefined
    ? !!occurrence.isPaid
    : overrideRecord.done !== undefined
    ? !!overrideRecord.done
    : overrideRecord.isPaid !== undefined
    ? !!overrideRecord.isPaid
    : targetItem?.isPaid !== undefined
    ? !!targetItem.isPaid
    : !!targetItem?.done;

  // Calculate sum of partial payments in USD
  const partialsSum = (overrideRecord.partials || []).reduce(
    (sum: number, pt: any) => sum + (parseFloat(pt.amt) || 0),
    0
  );

  const remainingUsd = isDone ? 0 : Math.max(0, plannedUsdAmount - partialsSum);

  // Compute live balances per income account to show available funds in selectors
  const planForBalances = React.useMemo(() => calculateProjections(profile, exchangeRates), [profile, exchangeRates]);
  const incomeBalances = React.useMemo(() => calculateIncomeAccountBalances(profile, planForBalances, convertAmount, todayStr()), [profile, planForBalances, convertAmount]);
  const balanceMap = React.useMemo(() => {
    const m: Record<string, number> = {};
    incomeBalances.forEach(b => { m[b.id] = b.availableToday; });
    return m;
  }, [incomeBalances]);

  useEffect(() => {
    if (isOpen) {
      setIsCelebrating(false);
      setProgress(0);
      setShowConfetti(false);
      setShowCustomPay(false);
      setShowPostponeInput(false);
      setEditingPartialIdx(null);
      setPartialAmt('');
      const isNoAffectRecorded = overrideRecord.noAffectBalance === true || overrideRecord.externalPay === true || overrideRecord.paidPrior === true;
      setAffectBalance(!isNoAffectRecorded);
      const isReqFund = refId === 'required_starting_fund' || occurrence?.ref?.id === 'required_starting_fund' || occurrence?.label === 'Fondo Requerido para Iniciar';
      const defaultIncId = isReqFund ? 'required_starting_fund' : (overrideRecord.incomeId || occurrence?.incomeId || occurrence?.ref?.incomeId || targetItem?.incomeId || (profile.incomes?.[0]?.id || ''));
      setSelectedIncomeId(isNoAffectRecorded ? '__EXTERNAL__' : defaultIncId);
      if (originalDate) {
        setActualDate(planDate || originalDate);
        setPostponeDate(planDate || originalDate);
      }
    } else {
      setIsCelebrating(false);
      setProgress(0);
      setShowConfetti(false);
    }
  }, [isOpen, refId, originalDate, planDate, type]);

  // Initialize input amount based on selected currency
  useEffect(() => {
    if (!isOpen) return;
    if (payCurrency === 'BS') {
      const bsRate = exchangeRates['BS'] || 0.02325;
      const initialBs = remainingUsd / bsRate;
      setCustomPayAmt(initialBs > 0 ? initialBs.toFixed(2) : '');
    } else {
      setCustomPayAmt(remainingUsd > 0 ? remainingUsd.toFixed(2) : '');
    }
  }, [isOpen, payCurrency, remainingUsd, exchangeRates]);

  if (!isOpen || !type || !refId || !originalDate) return null;

  // Real-time currency conversions for payment
  const numericInput = parseFloat(customPayAmt) || 0;
  const convertedPayUsd = convertAmount(numericInput, payCurrency);

  // Exchange rate display string
  const bsPerUsd = exchangeRates['BS'] ? (1 / exchangeRates['BS']).toFixed(2) : '43.00';

  const isIncome = type === 'income' || occurrence?.type === 'income' || (occurrence?.amt !== undefined && occurrence.amt > 0);

  const applyOverride = (draft: any, updates: any) => {
    draft.overrides = draft.overrides || {};
    const effectiveUpdates = { ...updates };
    if (effectiveUpdates.isPaid !== undefined && effectiveUpdates.done === undefined) {
      effectiveUpdates.done = Boolean(effectiveUpdates.isPaid);
    }
    delete effectiveUpdates.isPaid; // Use done as the single source of truth
    
    const rawId = String(refId || '');
    const idWithout = rawId.replace(/^(debt_|income_|expense_|savings_)/, '');
    const rawName = occurrence?.ref?.name || targetItem?.name || '';
    const sanitizedId = sanitizeDocId(rawName, refId || '');

    const candidateIds = Array.from(new Set([
      refId,
      rawId,
      idWithout,
      sanitizedId,
      rawName.toLowerCase().replace(/\s+/g, '_')
    ].filter(Boolean)));

    const keysToWrite = new Set<string>([
      key,
      legacyKey,
      cuotaKey,
      `${refId}_${originalDate}`,
      `${type}_${refId}_${originalDate}`,
      `${type}_${idWithout}_${originalDate}`,
      `${idWithout}_${originalDate}`,
      `${type}_${sanitizedId}_${originalDate}`,
      `${sanitizedId}_${originalDate}`,
    ].filter(Boolean) as string[]);

    if (effectiveUpdates.actualDate) {
      const actDate = effectiveUpdates.actualDate;
      keysToWrite.add(`${refId}_${actDate}`);
      keysToWrite.add(`${type}_${refId}_${actDate}`);
      keysToWrite.add(`${type}_${idWithout}_${actDate}`);
      keysToWrite.add(`${idWithout}_${actDate}`);
      keysToWrite.add(`${type}_${sanitizedId}_${actDate}`);
      keysToWrite.add(`${sanitizedId}_${actDate}`);
    }

    // Scan draft.overrides for matches
    Object.keys(draft.overrides).forEach(k => {
      if (k.endsWith(`_${originalDate}`)) {
        for (const cid of candidateIds) {
          if (cid && cid.length > 2 && k.includes(cid)) {
            keysToWrite.add(k);
          }
        }
      }
    });

    keysToWrite.forEach(k => {
      draft.overrides[k] = {
        ...(draft.overrides[k] || {}),
        ...effectiveUpdates
      };
    });

    // Update base item directly in draft.incomes / draft.expenses for single source of truth
    if (isIncome || type === 'income') {
      (draft.incomes || []).forEach((inc: any) => {
        if (inc.id === refId || inc.id === idWithout || inc.id === rawId || inc.name === rawName) {
          if (effectiveUpdates.done !== undefined) {
            inc.isPaid = effectiveUpdates.done;
            inc.done = effectiveUpdates.done;
          }
          if (effectiveUpdates.actualDate && inc.freq === 'one-time') {
            inc.date = effectiveUpdates.actualDate;
          }
        }
      });
    } else if (type === 'expense' || occurrence?.type === 'expense') {
      (draft.expenses || []).forEach((exp: any) => {
        if (exp.id === refId || exp.id === idWithout || exp.id === rawId || exp.name === rawName) {
          if (effectiveUpdates.done !== undefined) {
            exp.isPaid = effectiveUpdates.done;
            exp.done = effectiveUpdates.done;
          }
          if (effectiveUpdates.actualDate && exp.freq === 'one-time') {
            exp.date = effectiveUpdates.actualDate;
          }
        }
      });
    }

    if (idStr.includes('auto_savings')) {
      draft.overrides[`savings_auto_savings_${originalDate}`] = {
        ...(draft.overrides[`savings_auto_savings_${originalDate}`] || {}),
        ...effectiveUpdates
      };
      draft.overrides[`auto_savings_${originalDate}`] = {
        ...(draft.overrides[`auto_savings_${originalDate}`] || {}),
        ...effectiveUpdates
      };
    }
    if (idStr.includes('rescate_ahorros')) {
      draft.overrides[`rescate_ahorros_${originalDate}`] = {
        ...(draft.overrides[`rescate_ahorros_${originalDate}`] || {}),
        ...effectiveUpdates
      };
      draft.overrides[`rescate_ahorros_rescate_ahorros_${originalDate}`] = {
        ...(draft.overrides[`rescate_ahorros_rescate_ahorros_${originalDate}`] || {}),
        ...effectiveUpdates
      };
    }
  };

  const finishMarkDone = () => {
    const finalAmountUsd = showCustomPay ? convertedPayUsd : remainingUsd;
    const finalPayDate = showCustomPay ? actualDate : (actualDate || todayStr());
    updateProfileData(draft => {
      applyOverride(draft, {
        done: true,
        actualDate: finalPayDate,
        amt: affectBalance ? finalAmountUsd : 0,
        noAffectBalance: !affectBalance,
        incomeId: affectBalance ? selectedIncomeId : undefined,
        payCurrency,
        rawPayAmount: numericInput,
      });
    });
    const currLabel = payCurrency === 'BS' ? 'Bs' : (payCurrency === 'EUR_BCV' ? '€' : '$');
    const incName = (profile.incomes || []).find(i => i.id === selectedIncomeId)?.name;
    if (affectBalance) {
      showToast(isIncome ? `Ingreso recibido (${currLabel} ${numericInput.toLocaleString()}) → $${finalAmountUsd.toFixed(2)} USD [${incName || 'Cuenta'}]` : `Pagado (${currLabel} ${numericInput.toLocaleString()}) → $${finalAmountUsd.toFixed(2)} USD [${incName || 'Cuenta'}]`, '✅');
    } else {
      showToast(isIncome ? `Marcado como cobrado con fondos externos` : `Marcada como pagada con fondos anteriores / externos`, '🛡️');
    }
    setTimeout(() => {
      setIsCelebrating(false);
      setProgress(0);
      setShowConfetti(false);
      onClose();
    }, 1500); // Wait for confetti to finish before closing
  };

  const handleMarkDone = () => {
    let isFinalPayment = false;
    if (type === 'debt') {
      const targetItem = (profile.debts || []).find(d => d.id === refId);
      if (targetItem) {
        const expectedCuotas = calculateAmortizationPlan(targetItem, profile.overrides || {}, profile.settings?.customDebts || [], undefined, exchangeRates);
        const unpaidCuotas = expectedCuotas.filter(c => !c.isPaid);
        if (unpaidCuotas.length <= 1) {
            isFinalPayment = true;
        }
      }
    }

    if (type === 'debt' && isFinalPayment) {
      setIsCelebrating(true);
      let p = 0;
      const interval = setInterval(() => {
        p += 4;
        setProgress(p > 100 ? 100 : p);
        if (p >= 100) {
          clearInterval(interval);
          setShowConfetti(true);
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
          finishMarkDone();
        }
      }, 30);
      return;
    }
    const finalAmountUsd = showCustomPay ? convertedPayUsd : remainingUsd;
    const finalPayDate = showCustomPay ? actualDate : (actualDate || todayStr());
    updateProfileData(draft => {
      applyOverride(draft, {
        done: true,
        actualDate: finalPayDate,
        amt: affectBalance ? finalAmountUsd : 0,
        noAffectBalance: !affectBalance,
        incomeId: affectBalance ? selectedIncomeId : undefined,
        payCurrency,
        rawPayAmount: numericInput,
      });
    });
    const currLabel = payCurrency === 'BS' ? 'Bs' : (payCurrency === 'EUR_BCV' ? '€' : '$');
    const incName = (profile.incomes || []).find(i => i.id === selectedIncomeId)?.name;
    if (affectBalance) {
      showToast(isIncome ? `Ingreso recibido (${currLabel} ${numericInput.toLocaleString()}) → $${finalAmountUsd.toFixed(2)} USD [${incName || 'Cuenta'}]` : `Pagado (${currLabel} ${numericInput.toLocaleString()}) → $${finalAmountUsd.toFixed(2)} USD [${incName || 'Cuenta'}]`, '✅');
    } else {
      showToast(isIncome ? `Marcado como cobrado con fondos externos` : `Marcada como pagada con fondos anteriores / externos`, '🛡️');
    }
    onClose();
  };

  const handleDiscard = () => {
    updateProfileData(draft => {
      applyOverride(draft, { discarded: true });
    });
    showToast('Movimiento descartado', '🗑️');
    onClose();
  };

  const handlePostpone = () => {
    if (!postponeDate) return;
    updateProfileData(draft => {
      applyOverride(draft, {
        actualDate: postponeDate,
        done: false,
        isPaid: false,
        userPostponed: true,
      });

      const idStr = String(refId || '');
      const idWithout = idStr.replace(/^(debt_|income_|expense_)/, '');
      if (type === 'income' || occurrence?.type === 'income') {
        const inc = (draft.incomes || []).find((i: any) => i.id === refId || i.id === idWithout);
        if (inc) {
          inc.isPaid = false;
          (inc as any).done = false;
          if (inc.freq === 'one-time') {
            inc.date = postponeDate;
          }
        }
      } else if (type === 'expense' || occurrence?.type === 'expense') {
        const exp = (draft.expenses || []).find((e: any) => e.id === refId || e.id === idWithout);
        if (exp) {
          exp.isPaid = false;
          (exp as any).done = false;
          if (exp.freq === 'one-time') {
            exp.date = postponeDate;
          }
        }
      }
    });
    showToast(`Posfechado para el ${formatDateStr(postponeDate)}`, '🗓️');
    onClose();
  };

  const handleAddPartial = () => {
    const rawNum = parseFloat(partialAmt);
    if (!rawNum || rawNum <= 0) return;

    const usdVal = convertAmount(rawNum, partialCurrency);

    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      const current = draft.overrides[key] || draft.overrides[legacyKey] || {};
      const partials = [...(current.partials || [])];
      partials.push({
        date: todayStr(),
        amt: usdVal,
        rawAmt: rawNum,
        currency: partialCurrency,
        incomeId: affectBalance ? selectedIncomeId : undefined,
      });
      applyOverride(draft, { partials });
    });

    setPartialAmt('');
    showToast(`Abono parcial de ${formatCurrency(usdVal)} registrado`, '💸');
  };

  const handleDeletePartial = (pIdx: number) => {
    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      const current = draft.overrides[key] || draft.overrides[legacyKey] || {};
      if (current.partials) {
        const partials = [...current.partials];
        partials.splice(pIdx, 1);
        if (partials.length === 0 && !current.done && !current.userPostponed) {
          delete draft.overrides[key];
          delete draft.overrides[legacyKey];
        } else {
          applyOverride(draft, { partials });
        }
      }
    });
    showToast('Abono parcial eliminado', '🗑️');
  };

  const handleStartEditPartial = (pIdx: number, pt: any) => {
    setEditingPartialIdx(pIdx);
    setEditingPartialAmt(pt.rawAmt ? String(pt.rawAmt) : String(pt.amt));
    setEditingPartialCurrency(pt.currency || 'USD_BCV');
  };

  const handleSaveEditPartial = (pIdx: number) => {
    const rawNum = parseFloat(editingPartialAmt);
    if (!rawNum || rawNum <= 0) return;

    const usdVal = convertAmount(rawNum, editingPartialCurrency);

    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      const current = draft.overrides[key] || draft.overrides[legacyKey] || {};
      if (current.partials && current.partials[pIdx]) {
        const partials = [...current.partials];
        partials[pIdx] = {
          ...partials[pIdx],
          amt: usdVal,
          rawAmt: rawNum,
          currency: editingPartialCurrency,
        };
        applyOverride(draft, { partials });
      }
    });

    setEditingPartialIdx(null);
    showToast('Abono parcial actualizado', '✏️');
  };

  const handleUndoDone = () => {
    const idStr = String(refId || '');
    const idWithout = idStr.replace(/^(debt_|income_|expense_|savings_)/, '');
    const rawName = occurrence?.ref?.name || targetItem?.name || '';
    const cleanName = rawName
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/[\✓\√\✔\✅]+/g, '')
      .trim();
    const sanitizedId = sanitizeDocId(rawName, refId || '');
    const cuotaIndex = occurrence?.ref?.index;

    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};

      const candidateIds = Array.from(new Set([
        refId,
        idStr,
        idWithout,
        sanitizedId,
        rawName.toLowerCase().replace(/\s+/g, '_'),
        cleanName.toLowerCase().replace(/\s+/g, '_')
      ].filter(Boolean)));

      const targetKeys = new Set<string>([
        key,
        legacyKey,
        cuotaKey,
        `${refId}_${originalDate}`,
        `income_${refId}_${originalDate}`,
        `expense_${refId}_${originalDate}`,
        `debt_${refId}_${originalDate}`,
        `${idWithout}_${originalDate}`,
        `income_${idWithout}_${originalDate}`,
        `expense_${idWithout}_${originalDate}`,
        `debt_${idWithout}_${originalDate}`,
        `${sanitizedId}_${originalDate}`,
        `income_${sanitizedId}_${originalDate}`,
        `expense_${sanitizedId}_${originalDate}`,
        `debt_${sanitizedId}_${originalDate}`,
      ].filter(Boolean) as string[]);

      if (cuotaIndex !== undefined) {
        targetKeys.add(`${refId}_${cuotaIndex}`);
        targetKeys.add(`debt_${refId}_cuota_${cuotaIndex}`);
        targetKeys.add(`${idWithout}_${cuotaIndex}`);
        targetKeys.add(`debt_${idWithout}_cuota_${cuotaIndex}`);
      }

      // Scan draft.overrides for ALL keys matching candidate IDs
      Object.keys(draft.overrides).forEach(k => {
        for (const cid of candidateIds) {
          if (cid && cid.length > 2 && k.includes(cid)) {
            targetKeys.add(k);
          }
        }
      });

      targetKeys.forEach(k => {
        if (draft.overrides[k] !== undefined) {
          delete draft.overrides[k];
        }
      });

      // Update base item in incomes / expenses / debts
      if (type === 'income' || occurrence?.type === 'income') {
        (draft.incomes || []).forEach((inc: any) => {
          if (
            inc.id === refId || 
            inc.id === idWithout || 
            (cleanName && inc.name && inc.name.includes(cleanName)) ||
            sanitizeDocId(inc.name, inc.id) === sanitizedId
          ) {
            inc.isPaid = false;
            inc.done = false;
            if (cleanName && inc.name && (inc.name.includes('(') || inc.name.includes('✓') || inc.name.includes('√'))) {
              inc.name = cleanName;
            }
          }
        });
      } else if (type === 'expense' || occurrence?.type === 'expense') {
        (draft.expenses || []).forEach((exp: any) => {
          if (
            exp.id === refId || 
            exp.id === idWithout || 
            (cleanName && exp.name && exp.name.includes(cleanName)) ||
            sanitizeDocId(exp.name, exp.id) === sanitizedId
          ) {
            exp.isPaid = false;
            exp.done = false;
            if (cleanName && exp.name && (exp.name.includes('(') || exp.name.includes('✓') || exp.name.includes('√'))) {
              exp.name = cleanName;
            }
          }
        });
      } else if (type === 'debt' || occurrence?.type === 'debt') {
        (draft.debts || []).forEach((dbt: any) => {
          if (
            dbt.id === refId || 
            dbt.id === idWithout || 
            (cleanName && dbt.name && dbt.name.includes(cleanName)) ||
            sanitizeDocId(dbt.name, dbt.id) === sanitizedId
          ) {
            dbt.isPaid = false;
            dbt.done = false;
            if (cleanName && dbt.name && (dbt.name.includes('(') || dbt.name.includes('✓') || dbt.name.includes('√'))) {
              dbt.name = cleanName;
            }
          }
        });
      }
    });

    showToast('Pago revertido', '🔄');
    onClose();
  };

  
  if (isCelebrating) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
          {showConfetti && (
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
               <div className="animate-ping absolute w-32 h-32 bg-emerald-400 rounded-full opacity-0"></div>
               <div className="animate-pulse absolute w-48 h-48 bg-emerald-500 rounded-full opacity-20"></div>
             </div>
          )}
          
          <div className="space-y-2 relative z-10">
             <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
               {showConfetti ? '¡Pago Registrado!' : 'Procesando Pago...'}
             </h2>
             <p className="text-sm text-slate-500">
               {showConfetti ? '¡Una deuda menos (o una cuota menos) en tu lista!' : 'Registrando en tu historial financiero'}
             </p>
          </div>

          <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full z-10">
            <div 
              className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-75"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="relative z-10 text-emerald-600 font-black text-xl">
            {progress}%
          </div>
        </div>
      </div>
    );
  }
return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full h-[80vh] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ borderTop: `4px solid ${itemColor}` }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${itemColor}18`,
                  color: itemColor,
                  border: `1px solid ${itemColor}35`
                }}
              >
                {itemTypeLabel}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {itemTitle}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
        {/* Amount & Date Financial Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Monto Planificado</span>
              <p className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5 flex-wrap">
                <span>{formatCurrency(plannedUsdAmount)}</span>
                {((profile.settings?.paymentCurrency || 'BS') !== (profile.settings?.displayCurrency || 'USD')) && (
                  <span className="text-[10px] opacity-70">
                    (~{
                      (profile.settings?.paymentCurrency || 'BS') === 'BS' ? `Bs ${(plannedUsdAmount / (exchangeRates['BS'] || 0.02325)).toFixed(2)}` :
                      (profile.settings?.paymentCurrency || 'BS') === 'EUR' ? `€${(plannedUsdAmount / (exchangeRates['EUR_BCV'] || 1.05)).toFixed(2)}` :
                      (profile.settings?.paymentCurrency || 'BS') === 'USDT' ? `${(plannedUsdAmount / (exchangeRates['USDT'] || 1)).toFixed(2)} USDT` :
                      formatCurrency(plannedUsdAmount)
                    })
                  </span>
                )}
              </p>
              {itemCurrency === 'BS' && (
                <p className="text-[10px] text-slate-500 font-semibold">
                  ({baseAmount.toLocaleString()} Bs)
                </p>
              )}
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Fecha</span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {formatDateStr(occurrence?.date || planDate || originalDate)}
              </p>
            </div>
          </div>

          {/* Rate conversion info badge */}
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500">
            <span>Tasa BCV Oficial:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              1 USD = {bsPerUsd} Bs
            </span>
          </div>

          {/* Pending remaining summary or Completed state */}
          {isDone ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Estado: <strong>Ya está lista (Pagada)</strong></span>
              </span>
              <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                {formatCurrency(overrideRecord.amt !== undefined ? overrideRecord.amt : plannedUsdAmount)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-200">
                {partialsSum > 0 ? 'Saldo Restante Pendiente:' : 'Total a Pagar:'}
              </span>
              <span className="font-black text-blue-700 dark:text-blue-300 text-sm flex items-center gap-1.5 flex-wrap justify-end">
                <span>{formatCurrency(remainingUsd)}</span>
                {((profile.settings?.paymentCurrency || 'BS') !== (profile.settings?.displayCurrency || 'USD')) && (
                  <span className="text-xs opacity-70">
                    (~{
                      (profile.settings?.paymentCurrency || 'BS') === 'BS' ? `Bs ${(remainingUsd / (exchangeRates['BS'] || 0.02325)).toFixed(2)}` :
                      (profile.settings?.paymentCurrency || 'BS') === 'EUR' ? `€${(remainingUsd / (exchangeRates['EUR_BCV'] || 1.05)).toFixed(2)}` :
                      (profile.settings?.paymentCurrency || 'BS') === 'USDT' ? `${(remainingUsd / (exchangeRates['USDT'] || 1)).toFixed(2)} USDT` :
                      formatCurrency(remainingUsd)
                    })
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* History of Partial Abonos */}
        {overrideRecord.partials && overrideRecord.partials.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Abonos Parciales Registrados</span>
            {overrideRecord.partials.map((pt: any, pIdx: number) => {
              const isEditingThis = editingPartialIdx === pIdx;
              const currLabel = pt.currency === 'BS' ? 'Bs' : (pt.currency === 'EUR_BCV' ? '€' : (pt.currency === 'USDT' ? 'USDT' : '$'));
              const fundAccount = (profile.incomes || []).find(i => i.id === pt.incomeId);

              return (
                <div key={pIdx} className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  {isEditingThis ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        value={editingPartialAmt}
                        onChange={e => setEditingPartialAmt(e.target.value)}
                        className="flex-1 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                      />
                      <select
                        value={editingPartialCurrency}
                        onChange={e => setEditingPartialCurrency(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                      >
                        <option value="USD_BCV">$ USD</option>
                        <option value="BS">Bs</option>
                        <option value="EUR_BCV">€ EUR</option>
                        <option value="USDT">USDT</option>
                      </select>
                      <button
                        onClick={() => handleSaveEditPartial(pIdx)}
                        className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                        title="Guardar"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingPartialIdx(null)}
                        className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-xs">
                      <div
                        onClick={() => handleStartEditPartial(pIdx, pt)}
                        className="flex-1 cursor-pointer group pr-2"
                        title="Toca para editar abono"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-500 font-medium text-[10px]">{formatDateStr(pt.date)}</span>
                          {fundAccount ? (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                              🏦 {fundAccount.name}
                            </span>
                          ) : pt.incomeId && pt.incomeId !== '__EXTERNAL__' ? (
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              🏦 Histórico (Cuenta eliminada)
                            </span>
                          ) : pt.incomeId === '__EXTERNAL__' ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              🛡️ Fondos externos
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-bold text-emerald-600 text-xs group-hover:underline">{formatCurrency(pt.amt)}</span>
                          {pt.rawAmt && pt.currency !== 'USD_BCV' && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({pt.rawAmt.toLocaleString()} {currLabel})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeletePartial(pIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar / Deshacer abono"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Action Section */}
        {isDone ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{isIncome ? 'Marcado como Recibido el' : 'Marcado como Pagado el'} {formatDateStr(overrideRecord.actualDate || originalDate)}</span>
            </div>

            {/* Origen del dinero / Cuenta que pagó o recibió */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {isIncome ? 'Cuenta que recibió el ingreso:' : 'Cuenta de donde se pagó:'}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  overrideRecord.noAffectBalance
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                }`}>
                  {overrideRecord.noAffectBalance
                    ? '🛡️ Fondos externos / Anteriores'
                    : (() => {
                        const isReq = refId === 'required_starting_fund' || occurrence?.ref?.id === 'required_starting_fund' || occurrence?.label === 'Fondo Requerido para Iniciar' || (typeof occurrence?.label === 'string' && occurrence.label.toLowerCase().includes('fondo requerido'));
                        if (isReq) return '🪙 Fondo Requerido';
                        const incId = overrideRecord.incomeId || occurrence?.incomeId || occurrence?.ref?.incomeId || targetItem?.incomeId;
                        if (incId === 'required_starting_fund') return '🪙 Fondo Requerido';
                        const foundInc = (profile.incomes || []).find(i => i.id === incId);
                        if (foundInc) return `🏦 ${foundInc.name}`;
                        if (incId) return '🏦 Histórico (Cuenta eliminada)';
                        return '🏦 Cuenta Predeterminada';
                      })()}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {overrideRecord.noAffectBalance
                  ? (isIncome ? 'Este ingreso está marcado con fondos previos o externos. No suma dinero a tus cuentas actuales.' : 'Esta cuota está marcada con fondos previos o externos. No descuenta dinero de tus cuentas de ingreso actuales.')
                  : (isIncome ? 'Se suma al saldo acumulado de la cuenta de ingreso seleccionada.' : 'Se descuenta del saldo acumulado de la cuenta de ingreso seleccionada.')}
              </p>
              <div className="pt-1">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  {isIncome ? 'Cambiar cuenta receptora para este ingreso:' : 'Cambiar cuenta de origen para este pago:'}
                </label>
                <select
                  value={overrideRecord.noAffectBalance ? '__EXTERNAL__' : (overrideRecord.incomeId || occurrence?.incomeId || occurrence?.ref?.incomeId || targetItem?.incomeId || (refId === 'required_starting_fund' ? 'required_starting_fund' : (profile.incomes?.[0]?.id || '')))}
                  onChange={e => {
                    const val = e.target.value;
                    const finalAmountUsd = overrideRecord.amt !== undefined && overrideRecord.amt > 0 ? overrideRecord.amt : plannedUsdAmount;
                    if (val === '__EXTERNAL__') {
                      updateProfileData(draft => {
                        applyOverride(draft, {
                          noAffectBalance: true,
                          incomeId: undefined,
                          amt: 0
                        });
                      });
                      showToast('Cambiado a: Fondos externos / Anteriores', '🛡️');
                    } else if (val === 'required_starting_fund') {
                      updateProfileData(draft => {
                        applyOverride(draft, {
                          noAffectBalance: false,
                          incomeId: 'required_starting_fund',
                          amt: finalAmountUsd > 0 ? finalAmountUsd : plannedUsdAmount
                        });
                      });
                      showToast('Cambiado a cuenta: Fondo Requerido', '🪙');
                    } else {
                      updateProfileData(draft => {
                        applyOverride(draft, {
                          noAffectBalance: false,
                          incomeId: val,
                          amt: finalAmountUsd > 0 ? finalAmountUsd : plannedUsdAmount
                        });
                      });
                      const incName = (profile.incomes || []).find(i => i.id === val)?.name || 'Cuenta';
                      showToast(`Cambiado a cuenta: ${incName}`, '🏦');
                    }
                  }}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                >
                  {(refId === 'required_starting_fund' || occurrence?.ref?.id === 'required_starting_fund' || balanceMap['required_starting_fund'] !== undefined) && (
                    <option value="required_starting_fund">
                      🪙 Fondo Requerido — {formatCurrency(balanceMap['required_starting_fund'] ?? 0)}
                    </option>
                  )}
                  {(profile.incomes || []).map(inc => {
                    const bal = balanceMap[inc.id] ?? 0;
                    return (
                      <option key={inc.id} value={inc.id}>
                        🏦 {inc.name} — {isIncome ? 'Disponible:' : 'Quedan:'} {formatCurrency(bal)}
                      </option>
                    );
                  })}
                  <option value="__EXTERNAL__">
                    🛡️ Fondos externos / Anteriores ({isIncome ? 'no sumar a cuentas' : 'no debitar de cuentas'})
                  </option>
                </select>
              </div>
            </div>

            <button
              onClick={handleUndoDone}
              className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Revertir Estado a Pendiente
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {/* Selector: Cuenta de destino u origen */}
            <div className="p-3 bg-slate-100/80 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                  {isIncome ? 'Cuenta receptora del ingreso (a donde sumará):' : 'Cuenta de donde saldrá el egreso:'}
                </label>
                {selectedIncomeId !== '__EXTERNAL__' && balanceMap[selectedIncomeId] !== undefined && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {isIncome ? 'Disponible actual:' : 'Quedan:'} {formatCurrency(balanceMap[selectedIncomeId])}
                  </span>
                )}
              </div>
              <select
                value={selectedIncomeId}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedIncomeId(val);
                  setAffectBalance(val !== '__EXTERNAL__');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs text-slate-800 dark:text-slate-100"
              >
                {(refId === 'required_starting_fund' || occurrence?.ref?.id === 'required_starting_fund' || balanceMap['required_starting_fund'] !== undefined) && (
                  <option value="required_starting_fund">
                    🪙 Fondo Requerido — {formatCurrency(balanceMap['required_starting_fund'] ?? 0)}
                  </option>
                )}
                {(profile.incomes || []).map(inc => {
                  const bal = balanceMap[inc.id] ?? 0;
                  return (
                    <option key={inc.id} value={inc.id}>
                      🏦 {inc.name} — {isIncome ? 'Disponible:' : 'Quedan:'} {formatCurrency(bal)}
                    </option>
                  );
                })}
                <option value="__EXTERNAL__">
                  🛡️ Fondos externos / Anteriores ({isIncome ? 'no sumar a cuentas' : 'no deducir de cuentas'})
                </option>
              </select>

              {selectedIncomeId !== '__EXTERNAL__' && (
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">
                    {isIncome ? 'Saldo tras recibir este ingreso:' : 'Saldo tras pagar este ítem:'}
                  </span>
                  {(() => {
                    const currentBal = balanceMap[selectedIncomeId] ?? 0;
                    const payAmt = showCustomPay ? convertedPayUsd : remainingUsd;
                    const afterBal = isIncome ? currentBal + payAmt : currentBal - payAmt;
                    return (
                      <span className={`font-black ${afterBal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(afterBal)}
                      </span>
                    );
                  })()}
                </div>
              )}

              <p className="text-[10px] text-slate-500 leading-tight">
                {selectedIncomeId === '__EXTERNAL__'
                  ? (isIncome ? '🛡️ Se registrará como cobrado sin sumar a tus cuentas de ingreso actuales.' : '🛡️ Se registrará como pagada con dinero previo o externo, sin restar de tus cuentas de ingreso actuales.')
                  : (isIncome ? '💳 Se sumará al disponible acumulativo de la cuenta de ingreso seleccionada.' : '💳 Se restará del disponible acumulativo de la cuenta de ingreso seleccionada.')}
              </p>
            </div>

            {/* Custom currency / amount toggle */}
            {!showCustomPay ? (
              <div className="space-y-2">
                <button
                  onClick={handleMarkDone}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-colors text-white ${
                    affectBalance
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {affectBalance ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Marcar Completo ({formatCurrency(remainingUsd)}{((profile.settings?.paymentCurrency || 'BS') !== (profile.settings?.displayCurrency || 'USD')) && ` ~ ${(profile.settings?.paymentCurrency || 'BS') === 'BS' ? `Bs ${(remainingUsd / (exchangeRates['BS'] || 0.02325)).toFixed(2)}` : (profile.settings?.paymentCurrency || 'BS') === 'EUR' ? `€${(remainingUsd / (exchangeRates['EUR_BCV'] || 1.05)).toFixed(2)}` : (profile.settings?.paymentCurrency || 'BS') === 'USDT' ? `${(remainingUsd / (exchangeRates['USDT'] || 1)).toFixed(2)} USDT` : ''}`})
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Marcar Pagada con Fondos Anteriores / Externos
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowCustomPay(true)}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" /> Opciones Avanzadas (Monto, Moneda o Fecha)
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Opciones de Pago / Cobro
                  </span>
                  <button onClick={() => setShowCustomPay(false)} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Monto (Opcional)</label>
                    <input
                      type="number"
                      step="any"
                      value={customPayAmt}
                      onChange={e => setCustomPayAmt(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Moneda Usada</label>
                    <select
                      value={payCurrency}
                      onChange={e => setPayCurrency(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    >
                      <option value="USD_BCV">$ USD (BCV)</option>
                      <option value="BS">Bs</option>
                      <option value="EUR_BCV">€ EUR</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Fecha Real de Pago / Cobro</label>
                    <input
                      type="date"
                      value={actualDate}
                      onChange={e => setActualDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Conversion feedback */}
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-[11px] space-y-1 border border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>Equivalente en Saldo:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(convertedPayUsd)} USD
                    </span>
                  </div>
                  {payCurrency === 'BS' && (
                    <p className="text-[10px] text-slate-400">
                      Tasa aplicada: 1 USD = {bsPerUsd} Bs (BCV)
                    </p>
                  )}
                  {convertedPayUsd !== remainingUsd && (
                    <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {convertedPayUsd < remainingUsd
                        ? `💡 Ahórraste ${formatCurrency(remainingUsd - convertedPayUsd)} USD`
                        : `💡 Pagaste +${formatCurrency(convertedPayUsd - remainingUsd)} USD extra`}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleMarkDone}
                  className={`w-full py-2.5 text-white rounded-xl font-extrabold text-xs shadow-md transition-colors ${
                    affectBalance
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {affectBalance
                    ? `Confirmar Pago (${formatCurrency(convertedPayUsd)})`
                    : 'Confirmar Pago Previo (Sin Descontar Disponible)'}
                </button>
              </div>
            )}

            {/* Abono Parcial */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200/60 dark:border-slate-700/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Registrar Abono Parcial</span>
                {affectBalance && selectedIncomeId && (
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                    Fondear desde: {(profile.incomes || []).find(i => i.id === selectedIncomeId)?.name || 'Cuenta'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Puedes pagar con múltiples cuentas: abona un monto desde una cuenta y el restante desde otra.
              </p>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  value={partialAmt}
                  onChange={e => setPartialAmt(e.target.value)}
                  placeholder="Monto"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
                <select
                  value={partialCurrency}
                  onChange={e => setPartialCurrency(e.target.value)}
                  className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  <option value="USD_BCV">$ USD</option>
                  <option value="BS">Bs</option>
                  <option value="EUR_BCV">€ EUR</option>
                  <option value="USDT">USDT</option>
                </select>
                <button
                  onClick={handleAddPartial}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Abonar
                </button>
              </div>
            </div>

            {/* Postpone option */}
            {!showPostponeInput ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowPostponeInput(true)}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CalendarIcon className="w-3.5 h-3.5" /> Posponer Fecha de Pago
                </button>
                <button
                  onClick={handleDiscard}
                  className="w-full py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Descartar / Ignorar Pago
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Seleccionar Nueva Fecha</label>
                <input
                  type="date"
                  value={postponeDate}
                  onChange={e => setPostponeDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePostpone}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
                  >
                    Guardar Nueva Fecha
                  </button>
                  <button
                    onClick={() => setShowPostponeInput(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
