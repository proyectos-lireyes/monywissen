import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FrequencyType, IncomeItem, ExpenseItem, DebtItem, SavingsItem } from '../../types';
import { todayStr, formatCurrency, advanceDateFreq, getRemainingDebtAmount, getDebtTotalPaid, calculateAmortizationPlan } from '../../utils/financialEngine';
import { X, Trash2, CheckCircle, Pencil, Check } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  type: 'income' | 'expense' | 'debt' | 'saving' | null;
  editIndex: number | null;
  forceOneTime?: boolean;
  onClose: () => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  type,
  editIndex,
  forceOneTime = false,
  onClose,
}) => {
  const { profile, updateProfileData, showToast, validateTransaction, convertAmount, exchangeRates } = useApp();

  const formatCurrencyExt = (amt: number, curr?: string) => {
    let sym = '$';
    if (curr === 'EUR' || curr === 'EUR_BCV') sym = '€';
    else if (curr === 'BS') sym = 'Bs';
    else if (curr === 'COP') sym = '$';
    else if (curr === 'BRL') sym = 'R$';
    else if (curr === 'USDT') sym = 'USDT ';
    
    const raw = sym + (Math.round((amt || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
    if (curr && curr !== 'USD_BCV') {
      const conv = convertAmount(amt, curr);
      if (conv !== amt) {
        return `${raw} (${formatCurrency(conv)})`;
      }
    }
    return raw;
  };
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [freq, setFreq] = useState<FrequencyType>('monthly');
  const [day, setDay] = useState<number | string>(1);
  const [date, setDate] = useState(todayStr());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [strictDate, setStrictDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [desc, setDesc] = useState('');
  const [debtType, setDebtType] = useState('fixed');
  const [balance, setBalance] = useState<number | string>('');
  const [installments, setInstallments] = useState<number | string>('');
  const [cutDay, setCutDay] = useState<number | string>(5);
  const [dueDay, setDueDay] = useState<number | string>('1');
  const [apr, setApr] = useState<number | string>('');
  const [amortized, setAmortized] = useState<number | string>('');

  const [savPerson, setSavPerson] = useState('');
  const [savType, setSavType] = useState<'physical' | 'digital'>('physical');
  const [savStatus, setSavStatus] = useState<'pending' | 'completed'>('completed');
  const [savPlatform, setSavPlatform] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [currency, setCurrency] = useState('USD_BCV');
  const [receiptImg, setReceiptImg] = useState<string>('');
  const [markAsDone, setMarkAsDone] = useState<boolean>(true);

  const [showCutGrid, setShowCutGrid] = useState(false);
  const [showDueGrid, setShowDueGrid] = useState(false);

  const calcInstallmentInfo = (months: number) => {
    const p = parseFloat(String(balance)) || 0;
    if (p <= 0) return { cuota: 0, total: 0 };
    const r = (parseFloat(String(apr || '60')) / 100) / 12;
    let cuotaMensual = 0;
    if (r === 0) {
       cuotaMensual = p / months;
    } else {
       cuotaMensual = p * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    }
    const total = cuotaMensual * months;
    const cuota = freq === 'biweekly' ? cuotaMensual / 2 : cuotaMensual;
    return { cuota, total };
  };

  const [editingPayment, setEditingPayment] = useState<{
    recKey: string;
    partialIdx?: number;
    amount: string;
    currency: string;
    date: string;
  } | null>(null);

  const calculatedPmt = React.useMemo(() => {
    const bal = parseFloat(String(balance)) || 0;
    const principal = Math.max(0, bal);
    const inst = parseInt(String(installments), 10) || 1;
    let pmt = principal / inst;
    const hasInt = debtType === 'loan_interest' || debtType === 'card' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
    if (hasInt && parseFloat(String(apr) || '0') > 0) {
        const r = (parseFloat(String(apr)) / 100) / 12;
        pmt = principal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
    }
    return pmt;
  }, [balance, amortized, installments, apr, debtType, profile.settings.customDebts]);

  const expectedCuotas = React.useMemo(() => {
    if (type !== 'debt') return [];
    if (!parseFloat(String(balance))) return [];
    const itemId = editIndex !== null && profile.debts[editIndex] ? profile.debts[editIndex].id : 'preview';
    const isTdc = debtType === 'card' || debtType.startsWith('tdc_');
    const inst = parseInt(String(installments), 10) || 1;
    const actualInst = (isTdc && freq === 'biweekly') ? inst * 2 : inst;
    const finalFreq = isTdc ? freq : freq;
    let finalDueDay = finalFreq === 'biweekly' ? dueDay : (dueDay || day);
    if (isTdc && finalFreq === 'biweekly' && String(finalDueDay).indexOf('-') === -1) {
       const d1 = parseInt(String(finalDueDay), 10) || 15;
       const d2 = d1 + 15 > 30 ? 30 : d1 + 15;
       finalDueDay = String(d1) + "-" + String(d2);
    }

    const dummyItem = {
      id: itemId,
      name: name,
      type: debtType,
      balance: parseFloat(String(balance)) || 0,
      amount: calculatedPmt,
      amortized: parseFloat(String(amortized)) || 0,
      installments: actualInst,
      currency: currency as any,
      minPay: calculatedPmt,
      start: date,
      dueDay: finalDueDay,
      freq: finalFreq,
      hasInterest: (debtType === 'loan_interest' || debtType === 'card' || !!(profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)),
      apr: parseFloat(String(apr)) || 0
    };
    
    const plan = calculateAmortizationPlan(dummyItem, profile.overrides || {}, profile.settings.customDebts || [], undefined, exchangeRates);
    
    return plan.map((c, i) => {
      const isPaid = c.isCoveredByExplicit || c.isCoveredBySequential;
      return {
        index: i + 1,
        date: c.date,
        key: c.key,
        expectedAmount: c.expectedAmount,
        isPaid,
        paidAmount: isPaid ? c.expectedAmount : 0, // Simplifying preview
        paidCurrency: currency,
        ov: c.isCoveredByExplicit ? (profile.overrides || {})[c.key] : {},
        isCoveredBySequential: c.isCoveredBySequential,
        isCoveredByExplicit: c.isCoveredByExplicit,
        requiredPay: c.requiredPay
      };
    });
  }, [type, editIndex, profile.debts, profile.overrides, profile.settings.customDebts, installments, date, freq, dueDay, day, debtType, calculatedPmt, currency, amortized, balance, apr, name]);

  const debtPaymentHistory = React.useMemo(() => {
    if (type !== 'debt' || editIndex === null) return [];
    const item = profile.debts[editIndex];
    if (!item) return [];
    
    const overrides = profile.overrides || {};
    const history: any[] = [];
    
    Object.keys(overrides).forEach(key => {
      if (key.startsWith(`debt_${item.id}_`)) {
        const ov = overrides[key];
        if (ov.done) {
           history.push({
             key,
             date: ov.actualDate || key.split('_').pop() || '',
             amount: ov.amt,
             rawAmount: ov.rawPayAmount,
             currency: ov.payCurrency || 'USD_BCV',
           });
        }
        if (ov.partials && ov.partials.length > 0) {
           ov.partials.forEach((pt: any, pIdx: number) => {
              history.push({
                key,
                partialIdx: pIdx,
                date: pt.date || key.split('_').pop() || '',
                amount: pt.amt,
                rawAmount: pt.rawAmt,
                currency: pt.currency || 'USD_BCV',
              });
           });
        }
      }
    });
    
    history.sort((a, b) => b.date.localeCompare(a.date));
    return history;
  }, [type, editIndex, profile.debts, profile.overrides]);

  
  useEffect(() => {
    // Ghost deletion removed to prevent wiping valid payments on load
  }, []);

  const handleDeleteDebtPayment = (rec: any) => {
    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      const current = draft.overrides[rec.key];
      if (current) {
         if (rec.partialIdx !== undefined) {
            current.partials?.splice(rec.partialIdx, 1);
            if (current.partials?.length === 0 && !current.done && !current.userPostponed) {
               delete draft.overrides[rec.key];
            }
         } else {
            current.done = false;
            current.amt = undefined;
            if (!current.partials || current.partials.length === 0) {
               delete draft.overrides[rec.key];
            }
         }
      }
    });
    showToast('Registro de pago eliminado', '🗑️');
  };

  const handleSaveDebtPayment = () => {
    if (!editingPayment) return;
    const rawAmt = parseFloat(editingPayment.amount) || 0;
    if (rawAmt <= 0 && editingPayment.isPaidState !== false) {
      showToast('El monto debe ser mayor a 0', '⚠️');
      return;
    }
    const usdVal = convertAmount(rawAmt, editingPayment.currency);

    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      if (!draft.overrides[editingPayment.recKey]) {
        draft.overrides[editingPayment.recKey] = {};
      }
      const current = draft.overrides[editingPayment.recKey];
      
      if (editingPayment.isPaidState === false) {
        current.actualDate = editingPayment.date;
        current.userPostponed = true;
      } else {
        if (editingPayment.partialIdx !== undefined) {
            if (current.partials && current.partials[editingPayment.partialIdx]) {
              current.partials[editingPayment.partialIdx] = {
                ...current.partials[editingPayment.partialIdx],
                amt: usdVal,
                rawAmt: rawAmt,
                currency: editingPayment.currency,
                date: editingPayment.date
              };
            }
        } else {
            current.done = true;
            current.amt = usdVal;
            current.rawPayAmount = rawAmt;
            current.payCurrency = editingPayment.currency;
            current.actualDate = editingPayment.date;
        }
      }
    });
    setEditingPayment(null);
    showToast(editingPayment.isPaidState === false ? 'Fecha reprogramada' : 'Registro de pago actualizado', '✅');
  };

  const hasCleanedPreview = React.useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasCleanedPreview.current = false;
    }
    if (!isOpen || !type) return;

    if (type === 'debt' && editIndex === null && !hasCleanedPreview.current) {
      hasCleanedPreview.current = true;
      updateProfileData(draft => {
        if (draft.overrides) {
          Object.keys(draft.overrides).forEach(k => {
            if (k.startsWith('debt_preview_')) delete draft.overrides[k];
          });
        }
      });
    }

    if (editIndex !== null) {
      if (type === 'income') {
        const item = profile.incomes[editIndex];
        if (item && item.freq === 'one-time') {
           const key = `income_${item.id}_${item.date}`;
           setMarkAsDone(profile.overrides?.[key]?.done ?? true);
        }
        if (item) {
          setName(item.name);
          setStrictDate((item as any).strictDate || false);
          setAmount(item.amount);
          setFreq(item.freq);
          setDay(item.day || 1);
          setDate(item.start || item.date || todayStr());
          setHasEndDate(!!item.end);
          setEndDate(item.end || '');
          setDesc(item.desc || '');
          setCategory('');
          setTags(item.tags ? item.tags.join(', ') : '');
          setCurrency(item.currency || 'USD_BCV');
        }
      } else if (type === 'expense') {
        const item = profile.expenses[editIndex];
        if (item && item.freq === 'one-time') {
           const key = `expense_${item.id}_${item.date}`;
           setMarkAsDone(profile.overrides?.[key]?.done ?? true);
        }
        if (item) {
          setName(item.name);
          setStrictDate((item as any).strictDate || false);
          setAmount(item.amount);
          setFreq(item.freq);
          setDay(item.day || 1);
          setDate(item.start || item.date || todayStr());
          setHasEndDate(!!item.end);
          setEndDate(item.end || '');
          setDesc(item.desc || '');
          setCategory(item.category || '');
          setTags(item.tags ? item.tags.join(', ') : '');
          setCurrency(item.currency || 'USD_BCV');
          setReceiptImg(item.receiptImg || '');
        }
      } else if (type === 'debt') {
        const item = profile.debts[editIndex];
        if (item) {
          setName(item.name);
          setStrictDate((item as any).strictDate || false);
          setColor(item.color || '');
          setDebtType(item.type);
          setBalance(item.balance);
          setAmount(item.amount || item.minPay || '');
          setCurrency(item.currency || 'USD_BCV');
          setCutDay(item.cutDay || 5);
          setApr(item.apr || '');
          setAmortized(item.amortized || '');
          let itemFreq = item.freq;
          if (item.type !== 'card' && item.type !== 'fixed' && item.type !== 'loan_interest') {
             const cDef = profile.settings.customDebts?.find(d => d.id === item.type);
             if (cDef) itemFreq = cDef.freq as any;
          }
          const finalFreqState = itemFreq || 'monthly';
          const isItemTdc = item.type === 'card' || item.type.startsWith('tdc_');
          if (isItemTdc && finalFreqState === 'biweekly') {
             setInstallments((item.installments || 2) / 2);
          } else {
             setInstallments(item.installments || '');
          }
          setFreq(finalFreqState);
          let initDueDay = item.dueDay || (finalFreqState === 'biweekly' ? '15-30' : '1');
          if (finalFreqState === 'monthly' && initDueDay === '15-30') initDueDay = '1';
          setDueDay(initDueDay);
          setDate(item.start || todayStr());
        }
      } else if (type === 'saving') {
        const item = profile.savingsList[editIndex];
        if (item) {
          setSavPerson(item.person);
          setAmount(item.amount);
          setDate(item.date);
          setSavType(item.savType);
          setSavStatus(item.status === 'pending' ? 'pending' : 'completed');
          setSavPlatform(item.platformId || '');
          setCurrency(item.currency || 'USD_BCV');
          setReceiptImg(item.receiptImg || '');
        }
      }
    } else {
      // Defaults for creation
      setName('');
      setAmount('');
      setFreq(forceOneTime ? 'one-time' : 'monthly');
      setDay(1);
      setDate(todayStr());
      setDesc('');
      setDebtType('');
      setBalance('');
      setInstallments('');
      setCutDay(5);
      setDueDay('15-30');
      setApr('');
      setSavPerson('');
      setSavType('physical');
      setSavStatus('completed');
      setSavPlatform('');
      setCategory('');
      setTags('');
      setCurrency('USD_BCV');
      setReceiptImg('');
    }
  }, [isOpen, type, editIndex, forceOneTime]); // Removed profile to prevent reset on every profile update

  if (!isOpen || !type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(String(amount)) || 0;

    if (type === 'saving') {
      if (!savPerson || !numAmt) {
        showToast('Completa el concepto y el monto', '⚠️');
        return;
      }

      updateProfileData(draft => {
        draft.savingsList = draft.savingsList || [];
        const newSav: SavingsItem = {
          id: editIndex !== null ? draft.savingsList[editIndex].id : `sav_${Date.now()}`,
          person: savPerson,
          amount: numAmt,
          date,
          delivered: savStatus === 'completed',
          status: savStatus,
          savType,
          platformId: savType === 'digital' ? savPlatform : undefined,
          currency: currency as any,
          receiptImg: receiptImg || undefined,
          strictDate,
        };

        if (editIndex !== null) {
          draft.savingsList[editIndex] = newSav;
        } else {
          draft.savingsList.push(newSav);
        }
      });

      showToast('Ahorro guardado correctamente', '✅');
      onClose();
      return;
    }

    if (!name || (type !== 'debt' && !numAmt) || (type === 'debt' && !parseFloat(String(balance)))) {
      showToast('Ingresa un nombre y monto válido', '⚠️');
      return;
    }

    // Preventive Negative Flow Check
    const finalFreq: FrequencyType = forceOneTime ? 'one-time' : freq;
    const check = validateTransaction({
      type: type as any,
      amount: numAmt,
      date: finalFreq === 'one-time' ? date : undefined,
      freq: finalFreq,
    });

    if (check.warning) {
      showToast(check.warning, '🛡️');
    }

    updateProfileData(draft => {
      if (type === 'income') {
        const item: IncomeItem = {
          id: editIndex !== null ? draft.incomes[editIndex].id : `inc_${Date.now()}`,
          name,
          amount: numAmt,
          freq: finalFreq,
          day: finalFreq !== 'one-time' ? day : undefined,
          date: finalFreq === 'one-time' ? date : undefined,
          start: finalFreq !== 'one-time' ? date : undefined,
          end: finalFreq !== 'one-time' && hasEndDate ? endDate : undefined,
          desc,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          currency: currency as any,
          receiptImg: receiptImg || undefined,
          strictDate,
        };

        if (editIndex !== null) draft.incomes[editIndex] = item;
        else draft.incomes.push(item);
        
        if (finalFreq === 'one-time') {
           draft.overrides = draft.overrides || {};
           const key = `income_${item.id}_${date}`;
           draft.overrides[key] = { ...(draft.overrides[key] || {}), done: markAsDone };
        }
      } else if (type === 'expense') {
        const item: ExpenseItem = {
          id: editIndex !== null ? draft.expenses[editIndex].id : `exp_${Date.now()}`,
          name,
          amount: numAmt,
          freq: finalFreq,
          day: finalFreq !== 'one-time' ? day : undefined,
          date: finalFreq === 'one-time' ? date : undefined,
          start: finalFreq !== 'one-time' ? date : undefined,
          end: finalFreq !== 'one-time' && hasEndDate ? endDate : undefined,
          desc,
          category: category || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          currency: currency as any,
          receiptImg: receiptImg || undefined,
          strictDate,
        };

        if (editIndex !== null) draft.expenses[editIndex] = item;
        else draft.expenses.push(item);
        
        if (finalFreq === 'one-time') {
           draft.overrides = draft.overrides || {};
           const key = `expense_${item.id}_${date}`;
           draft.overrides[key] = { ...(draft.overrides[key] || {}), done: markAsDone };
        }
      } else if (type === 'debt') {
        const isTdc = debtType === 'card' || debtType.startsWith('tdc_');
        let finalDueDay = freq === 'biweekly' ? dueDay : (dueDay || day);
        if (isTdc && freq === 'biweekly' && String(finalDueDay).indexOf('-') === -1) {
           const d1 = parseInt(String(finalDueDay), 10) || 15;
           const d2 = d1 + 15 > 30 ? 30 : d1 + 15;
           finalDueDay = String(d1) + "-" + String(d2);
        }
        
        const bal = parseFloat(String(balance)) || 0;
        const amort = parseFloat(String(amortized)) || 0;
        const principal = Math.max(0, bal - amort);
        const inst = parseInt(String(installments), 10) || 1;
        const actualInst = (isTdc && freq === 'biweekly') ? inst * 2 : inst;
        
        let calculatedAmount = principal / actualInst;
        const hasInt = debtType === 'loan_interest' || isTdc || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
        if (hasInt && parseFloat(String(apr) || '0') > 0) {
            const r = (parseFloat(String(apr)) / 100) / 12;
            const monthlyPayment = principal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
            calculatedAmount = (isTdc && freq === 'biweekly') ? monthlyPayment / 2 : monthlyPayment;
        }

        const item: DebtItem = {
          id: editIndex !== null ? draft.debts[editIndex].id : `debt_${Date.now()}`,
          name,
          color: color || undefined,
          type: debtType,
          balance: bal,
          amount: calculatedAmount,
          minPay: calculatedAmount,
          installments: actualInst,
          start: date,
          currency: currency as any,
          cutDay: isTdc ? (parseInt(String(cutDay), 10) || 5) : undefined,
          dueDay: finalDueDay,
          freq: freq,
          apr: apr ? parseFloat(String(apr)) : undefined,
          amortized: parseFloat(String(amortized)) || undefined,
          hasInterest: (debtType === 'loan_interest' || isTdc || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) ? true : false,
          strictDate,
        };

        if (editIndex !== null) draft.debts[editIndex] = item;
        else {
          draft.debts.push(item);
          if (draft.overrides) {
            Object.keys(draft.overrides).forEach(k => {
              if (k.startsWith('debt_preview_')) {
                const newKey = k.replace('debt_preview_', `debt_${item.id}_`);
                draft.overrides[newKey] = draft.overrides[k];
                delete draft.overrides[k];
              }
            });
          }
        }
      } else if (type === 'saving') {
        const item = {
          id: editIndex !== null ? draft.savingsList[editIndex].id : `sav_${Date.now()}`,
          person: savPerson,
          amount: numAmt,
          date,
          delivered: savStatus === 'completed',
          status: savStatus,
          savType,
          platformId: savType === 'digital' ? savPlatform : undefined,
          currency: currency as any,
        };
        if (editIndex !== null) draft.savingsList[editIndex] = item;
        else draft.savingsList.push(item);
      }
    }, true);

    showToast('Registro guardado exitosamente', '✅');
    onClose();
  };

  const handleClose = () => {
    if (type === 'debt' && editIndex === null) {
      updateProfileData(draft => {
        if (draft.overrides) {
          Object.keys(draft.overrides).forEach(k => {
            if (k.startsWith('debt_preview_')) delete draft.overrides[k];
          });
        }
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editIndex === null) return;

    updateProfileData(draft => {
      if (type === 'income') draft.incomes.splice(editIndex, 1);
      else if (type === 'expense') draft.expenses.splice(editIndex, 1);
      else if (type === 'debt') draft.debts.splice(editIndex, 1);
      else if (type === 'saving') draft.savingsList.splice(editIndex, 1);
    });

    showToast('Registro eliminado', '🗑️');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate pr-4 max-w-[300px]" title={editIndex !== null ? (type === 'saving' ? savPerson : name) : 'Nuevo Registro'}>
            {editIndex !== null ? 'Editar: ' + (type === 'saving' ? savPerson : name) : 'Nuevo Registro'}
          </h3>
          <button type="button" onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-3">
            {type === 'saving' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Tipo</label>
                    <select
                      value={savType}
                      onChange={e => setSavType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="physical">💵 Efectivo (Físico)</option>
                      <option value="digital">🏦 Digital (Bancos)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Estado</label>
                    <select
                      value={savStatus}
                      onChange={e => setSavStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="completed">✅ Entregado (Listo)</option>
                      <option value="pending">⏳ Pendiente</option>
                    </select>
                  </div>
                  {savType === 'digital' && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 block">Plataforma</label>
                      <select
                        value={savPlatform}
                        onChange={e => setSavPlatform(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Seleccione...</option>
                        {profile.settings?.savingPlatforms?.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Monto</label>
                    <input
                      type="number" required value={amount} onChange={e => setAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Fecha</label>
                    <input
                      type="date" required value={date} onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Divisa</label>
                    <select
                      value={currency} onChange={e => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="USD_BCV">Dólar BCV (Bs)</option>
                      <option value="USD">Dólar USD ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="COP">Peso Colombiano</option>
                      <option value="BRL">Real Brasileño</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block">Concepto / Vendedor</label>
                  <input
                    type="text" required value={savPerson} onChange={e => setSavPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Comprobante (Imagen)</label>
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setReceiptImg(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                  />
                  {receiptImg && (
                    <div className="mt-2">
                      <img src={receiptImg} alt="Comprobante" className="h-16 rounded-lg object-cover" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500">Nombre / Concepto</label>
                  <input
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                {type === 'debt' ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500">Tipo de Deuda</label>
                      <select
                        value={debtType}
                        onChange={e => {
                          const selected = e.target.value;
                          setDebtType(selected);
                          if (selected === 'card') {
                             setFreq('monthly');
                             setDueDay('1');
                             setInstallments(1);
                             setApr('60');
                          } else {
                             const customDef = profile.settings.customDebts?.find(d => d.id === selected);
                             if (customDef) {
                                if (!name) setName(customDef.name);
                                if (!color) setColor(customDef.color || '');
                                const newFreq = customDef.freq as any || 'monthly';
                                setFreq(newFreq);
                                
                                if (selected.startsWith('tdc_')) {
                                  if (customDef.cutDay) setCutDay(customDef.cutDay);
                                  if (customDef.dueDay) setDueDay(customDef.dueDay);
                                  else setDueDay('1');
                                  if (customDef.limitCurrency) setCurrency(customDef.limitCurrency);
                                } else {
                                  let dDueDay = customDef.dueDay || '1';
                                  if (!customDef.dueDay) {
                                    if (newFreq === 'biweekly') dDueDay = '15-30';
                                    if (newFreq === 'triweekly') dDueDay = '3';
                                  }
                                  setDueDay(dDueDay);
                                }
                             } else {
                                setFreq('monthly');
                                setDueDay('1');
                             }
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 font-bold"
                      >
                        <option value="" disabled>Seleccione...</option>
                        <option value="card">💳 Tarjeta de Crédito (Nueva)</option>
                        <option value="loan_interest">🏦 Préstamo con Interés</option>
                        <option value="loan_no_interest">🤝 Préstamo sin Interés</option>
                        {profile.settings.customDebts && profile.settings.customDebts.length > 0 && (
                          <optgroup label="Plantillas Guardadas">
                            {profile.settings.customDebts.map(cd => (
                               <option key={cd.id} value={cd.id}>✨ {cd.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {debtType !== '' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Fecha Inicial</label>
                        <input
                          type="date" required value={date} onChange={e => setDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}

                    {debtType === '' ? null : (debtType === 'card' || debtType.startsWith('tdc_')) ? (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">💳 Configuración Tarjeta de Crédito</span>
                          <div className="flex gap-1 bg-amber-100 dark:bg-amber-900/40 p-1 rounded-lg">
                             <button type="button" onClick={() => setFreq('monthly')} className={'text-[10px] font-bold px-2 py-0.5 rounded-md ' + (freq === 'monthly' ? 'bg-amber-500 text-white' : 'text-amber-700 dark:text-amber-300')}>Mensual</button>
                             <button type="button" onClick={() => setFreq('biweekly')} className={'text-[10px] font-bold px-2 py-0.5 rounded-md ' + (freq === 'biweekly' ? 'bg-amber-500 text-white' : 'text-amber-700 dark:text-amber-300')}>Quincenal</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 relative">
                          <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Día de Corte</label>
                            <button
                              type="button"
                              onClick={() => { setShowCutGrid(!showCutGrid); setShowDueGrid(false); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 flex justify-between items-center"
                            >
                              <span>{cutDay}</span>
                              <span className="text-[10px] text-slate-400">📅</span>
                            </button>
                            {showCutGrid && (
                              <div className="absolute top-full left-0 mt-1 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 w-[220px]">
                                <div className="grid grid-cols-6 gap-1">
                                  {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                    <button
                                      key={`cut-${d}`} type="button"
                                      onClick={() => { setCutDay(d); setShowCutGrid(false); }}
                                      className={`text-[10px] py-1 rounded-md font-bold ${cutDay == d ? 'bg-amber-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                    >
                                      {d}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Día de Cobro</label>
                            <button
                              type="button"
                              onClick={() => { setShowDueGrid(!showDueGrid); setShowCutGrid(false); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 flex justify-between items-center"
                            >
                              <span>{dueDay}</span>
                              <span className="text-[10px] text-slate-400">📅</span>
                            </button>
                            {showDueGrid && (
                              <div className="absolute top-full right-0 mt-1 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 w-[220px]">
                                <div className="grid grid-cols-6 gap-1">
                                  {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                    <button
                                      key={`due-${d}`} type="button"
                                      onClick={() => { setDueDay(d); setShowDueGrid(false); }}
                                      className={`text-[10px] py-1 rounded-md font-bold ${dueDay == d ? 'bg-amber-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                    >
                                      {d}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Monto Total</label>
                            <input
                              type="number" required value={balance} onChange={e => setBalance(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Moneda</label>
                            <select
                              value={currency} onChange={e => setCurrency(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            >
                              <option value="USD_BCV">USD (BCV)</option>
                              <option value="EUR_BCV">EUR (BCV)</option>
                              <option value="USDT">USDT</option>
                              <option value="BS">Bs</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Cuotas (Max 6 Meses)</label>
                            <select
                              required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-900 dark:text-slate-100"
                            >
                              {Array.from({ length: 6 }, (_, i) => i + 1).map(m => {
                                const info = calcInstallmentInfo(m);
                                return (
                                  <option key={m} value={m}>
                                    {m} mes{m > 1 ? 'es' : ''} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(info.cuota)}/c {freq === 'biweekly' ? '(Quincenal)' : ''} | Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(info.total)}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Tasa APR Anual (%)</label>
                            <input
                              type="number" step="any" min="0" value={apr} onChange={e => setApr(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!name) { showToast('Ingresa el Nombre de la Tarjeta arriba primero', '⚠️'); return; }
                              updateProfileData(draft => {
                                draft.settings.customDebts = draft.settings.customDebts || [];
                                const existingIdx = draft.settings.customDebts.findIndex(d => d.name === name);
                                const newTDC = {
                                  id: `tdc_${Date.now()}`,
                                  name: name,
                                  freq: freq,
                                  hasInterest: true,
                                  usePlan: true,
                                  color: color || '#f59e0b',
                                  cutDay: parseInt(String(cutDay), 10) || 5,
                                  dueDay: dueDay,
                                  apr: parseFloat(String(apr)) || 60,
                                  isCreditCard: true,
                                  creditLimit: parseFloat(String(balance)) || 0,
                                  limitCurrency: currency
                                };
                                if (existingIdx >= 0) {
                                  draft.settings.customDebts[existingIdx] = newTDC as any;
                                } else {
                                  draft.settings.customDebts.push(newTDC as any);
                                }
                              });
                              showToast(`Tarjeta '${name}' guardada`, '💾');
                            }}
                            className="w-full text-[11px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold py-2 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                          >
                            💾 Guardar Perfil de TDC
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Color (Opcional)</label>
                            <input
                              type="color" value={color || '#94a3b8'} onChange={e => setColor(e.target.value)}
                              className="w-full h-[32px] px-1 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Amortización Inicial</label>
                            <input
                              type="number" step="any" min="0" value={amortized} onChange={e => setAmortized(e.target.value)}
                              placeholder="Monto ya pagado antes del registro"
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-amber-100/50 dark:bg-amber-900/40 rounded-xl text-[10px] font-bold text-amber-900 dark:text-amber-200 text-center">
                              {(() => {
                                 const pmt = calculatedPmt;
                                 return (
                                   <div className="flex justify-between items-center px-2">
                                     <span>Cuota mensual: {formatCurrencyExt(pmt, currency)}</span>
                                     <span className="text-rose-600 dark:text-rose-400 font-bold">
                                        Me falta: {formatCurrencyExt(expectedCuotas.reduce((s, c) => s + (c.requiredPay || 0), 0), currency)}
                                     </span>
                                   </div>
                                 );
                              })()}
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Monto Total</label>
                            <input
                              type="number" required value={balance} onChange={e => setBalance(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Moneda</label>
                            <select
                              value={currency} onChange={e => setCurrency(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            >
                              <option value="USD_BCV">USD (BCV)</option>
                              <option value="EUR_BCV">EUR (BCV)</option>
                              <option value="USDT">USDT</option>
                              <option value="BS">Bs</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Día Pago</label>
                            {freq === 'weekly' ? (
                              <select
                                value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              >
                                <option value="1">Lunes</option>
                                <option value="2">Martes</option>
                                <option value="3">Miércoles</option>
                                <option value="4">Jueves</option>
                                <option value="5">Viernes</option>
                                <option value="6">Sábado</option>
                                <option value="0">Domingo</option>
                              </select>
                            ) : freq === 'biweekly' ? (
                              <select
                                value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              >
                                <option value="15-30">15 y 30</option>
                                <option value="14-28">14 y 28</option>
                                <option value="13-27">13 y 27</option>
                              </select>
                            ) : freq === 'triweekly' ? (
                              <select
                                value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              >
                                <option value="3">3ra Semana del Mes</option>
                              </select>
                            ) : (
                              <select
                                value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              >
                                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                  <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Número de Cuotas</label>
                            <input
                              type="number" min="1" required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          {(debtType === 'loan_interest' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) && (
                            <div>
                              <label className="text-xs font-bold text-slate-500 block">Interés (%)</label>
                              <input
                                type="number" step="any" min="0" required value={apr} onChange={e => setApr(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Color (Opcional)</label>
                            <input
                              type="color" value={color || '#94a3b8'} onChange={e => setColor(e.target.value)}
                              className="w-full h-[36px] px-1 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Amortización Inicial</label>
                            <input
                              type="number" step="any" min="0" value={amortized} onChange={e => setAmortized(e.target.value)}
                              placeholder="Monto ya pagado antes del registro"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">
                              {(() => {
                                 const pmt = calculatedPmt;
                                 return (
                                   <div className="flex justify-between items-center px-2">
                                     <span>Cuota mensual: {formatCurrencyExt(pmt, currency)}</span>
                                     <span className="text-rose-600 dark:text-rose-400 font-bold">
                                        Me falta: {formatCurrencyExt(expectedCuotas.reduce((s, c) => s + (c.requiredPay || 0), 0), currency)}
                                     </span>
                                   </div>
                                 );
                              })()}
                           </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block">Monto</label>
                        <input
                          type="number" required value={amount} onChange={e => setAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block">Divisa</label>
                        <select
                          value={currency} onChange={e => setCurrency(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                        >
                          <option value="USD_BCV">USD (BCV)</option>
                          <option value="EUR_BCV">EUR (BCV)</option>
                          <option value="USDT">USDT (Binance)</option>
                          <option value="BS">Bs (Bolívares)</option>
                        </select>
                      </div>
                    </div>
                    {(forceOneTime || freq === 'one-time') && (type === 'income' || type === 'expense') && (
                      <div className="pt-2 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <input type="checkbox" checked={markAsDone} onChange={e => setMarkAsDone(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Marcar como procesado (Listo)</span>
                        </label>
                      </div>
                    )}
                    
                    {forceOneTime ? (
                      <div>
                        <label className="text-xs font-bold text-slate-500 block">Fecha</label>
                        <input
                          type="date" value={date} onChange={e => setDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-500 block">Frecuencia</label>
                          <select
                            value={freq} onChange={e => {
                               const newFreq = e.target.value as any;
                               setFreq(newFreq);
                               if (newFreq === 'biweekly') setDueDay('15-30');
                               else if (newFreq === 'weekly') setDueDay('1');
                               else if (newFreq === 'triweekly') setDueDay('3');
                               else setDueDay('1');
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          >
                            <option value="monthly">Mensual</option>
                            <option value="biweekly">Quincenal</option>
                            <option value="weekly">Semanal</option>
                          </select>
                        </div>
                        {freq === 'monthly' ? (
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día</label>
                            <input
                              type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        ) : freq === 'weekly' ? (
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día</label>
                            <select
                              value={day} onChange={e => setDay(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            >
                              <option value="1">Lunes</option>
                              <option value="2">Martes</option>
                              <option value="3">Miércoles</option>
                              <option value="4">Jueves</option>
                              <option value="5">Viernes</option>
                              <option value="6">Sábado</option>
                              <option value="0">Domingo</option>
                            </select>
                          </div>
                        ) : freq === 'biweekly' ? (
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día</label>
                            <select
                              value={day} onChange={e => setDay(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            >
                              <option value="15-30">15 y 30</option>
                              <option value="14-28">14 y 28</option>
                              <option value="13-27">13 y 27</option>
                            </select>
                          </div>
                        ) : null}
                      </div>
                    )}
                    
                    {!forceOneTime && (
                      <div className="space-y-3 mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Rango de Validez (Opcional)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Válido Desde</label>
                            <input
                              type="date" value={date} onChange={e => setDate(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                               <input type="checkbox" checked={hasEndDate} onChange={e => setHasEndDate(e.target.checked)} className="mr-1" />
                               Válido Hasta
                            </label>
                            <input
                              type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!hasEndDate}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            
            

            
            {type === 'debt' && (() => {
              const dummyItem = {
                ...(editIndex !== null && profile.debts[editIndex] ? profile.debts[editIndex] : ({} as any)),
                id: editIndex !== null && profile.debts[editIndex] ? profile.debts[editIndex].id : 'preview',
                amount: parseFloat(String(balance)) || 0,
                amortized: parseFloat(String(amortized)) || 0,
                currency: currency as any,
              };
              const tPaid = getDebtTotalPaid(dummyItem, profile.overrides || {}, exchangeRates);
              return (
                <div className="text-[10px] text-red-500 font-mono">
                  {expectedCuotas.length > 0 ? `${expectedCuotas.length} cuotas proyectadas.` : ""}
                </div>
              );
            })()}


              {/* Strict Date */}
              {(type === 'expense' || type === 'debt') && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 mt-4">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Fecha Estricta (No reprogramable)</label>
                    <p className="text-[10px] text-slate-500 font-medium">El sistema no sugerirá reprogramar este pago para equilibrar liquidez.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={strictDate} onChange={e => setStrictDate(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              )}

            {type === "debt" && expectedCuotas.length > 0 && (

              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Plan de Cuotas</h4>
                <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {expectedCuotas.map((cuota, i) => {
                    const isEditing = editingPayment?.recKey === cuota.key;
                    return (
                      <div key={cuota.key} className={`flex flex-col p-2 rounded-xl border ${cuota.isPaid ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                        {isEditing ? (
                          <div className="space-y-2">
                            {editingPayment.isPaidState !== false && (
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={editingPayment.amount}
                                  onChange={e => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                                  className="flex-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                                />
                                <select
                                  value={editingPayment.currency}
                                  onChange={e => setEditingPayment({ ...editingPayment, currency: e.target.value })}
                                  className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold"
                                >
                                  <option value="USD_BCV">$ (BCV)</option>
                                  <option value="EUR_BCV">€ (BCV)</option>
                                  <option value="USDT">USDT</option>
                                  <option value="BS">Bs</option>
                                </select>
                              </div>
                            )}
                            <div className="flex gap-2 items-center">
                              <input
                                type="date"
                                value={editingPayment.date}
                                onChange={e => setEditingPayment({ ...editingPayment, date: e.target.value })}
                                className="flex-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              />
                              <button
                                type="button"
                                onClick={handleSaveDebtPayment}
                                className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPayment(null)}
                                className="p-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cuota.isPaid) {
                                    if (cuota.isCoveredByExplicit) {
                                      handleDeleteDebtPayment({ key: cuota.key });
                                    } else if (cuota.isCoveredBySequential) {
                                      const itemId = type === 'debt' && editIndex !== null ? profile.debts[editIndex].id : 'preview';
                                      const orphanKey = Object.keys(profile.overrides || {}).find(k => {
                                        if (!k.startsWith(`debt_${itemId}_`)) return false;
                                        if (expectedCuotas.some(c => c.key === k)) return false;
                                        return profile.overrides[k].done;
                                      });
                                      if (orphanKey) {
                                        handleDeleteDebtPayment({ key: orphanKey });
                                      } else {
                                        const currentAmort = parseFloat(String(amortized)) || 0;
                                        const newAmort = Math.max(0, currentAmort - cuota.paidAmount);
                                        setAmortized(newAmort === 0 ? '' : String(newAmort));
                                      }
                                    }
                                  } else {
                                    setEditingPayment({
                                      recKey: cuota.key,
                                      amount: String(cuota.requiredPay > 0 ? cuota.requiredPay : cuota.expectedAmount),
                                      currency: currency,
                                      date: cuota.date
                                    });
                                  }
                                }}
                                className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${cuota.isPaid ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500'}`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <div 
                                className="flex flex-col cursor-pointer flex-1"
                                onClick={() => setEditingPayment({
                                  recKey: cuota.key,
                                  amount: String(cuota.isPaid ? cuota.paidAmount : cuota.requiredPay),
                                  currency: cuota.isPaid ? cuota.paidCurrency : currency,
                                  date: cuota.ov.actualDate || cuota.date,
                                  isPaidState: cuota.isPaid
                                })}
                              >
                                <span className={`text-xs font-bold ${cuota.isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'} group-hover:text-blue-600 transition-colors`}>
                                  Cuota {cuota.index} {cuota.isPaid ? `- ${formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)}` : (cuota.paidAmount > 0 ? `(Abonado: ${formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)})` : '')}
                                </span>
                                <span className="text-[10px] text-slate-500">{cuota.date} {cuota.isPaid && `(Pagado)`}</span>
                              </div>
                            </div>
                            {!cuota.isPaid && ( <span className='text-xs font-bold text-slate-400'>{cuota.paidAmount > 0 ? 'Falta: ' : ''}{formatCurrencyExt(cuota.requiredPay, currency)}</span> )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              {editIndex !== null && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/50"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <CheckCircle className="w-5 h-5" /> {editIndex !== null ? 'Guardar Cambios' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
