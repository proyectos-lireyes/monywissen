import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FrequencyType, IncomeItem, ExpenseItem, DebtItem, SavingsItem } from '../../types';
import { todayStr, formatCurrency, formatDateStr, advanceDateFreq, getRemainingDebtAmount, getDebtTotalPaid, calculateAmortizationPlan, calculateProjections, calculateIncomeAccountBalances, sanitizeDocId, getOverrideForItem } from '../../utils/financialEngine';
import { X, Trash2, CheckCircle, Check, RotateCcw, ChevronDown } from 'lucide-react';

const CURRENCY_OPTIONS: CustomSelectOption[] = [
  { value: 'USD_BCV', label: '$' },
  { value: 'EUR_BCV', label: '€' },
  { value: 'BS', label: 'Bs' },
  { value: 'USDT', label: '₮' },
];

const CurrencySelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean;
}> = ({ value, onChange, className = '', disabled = false }) => {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={CURRENCY_OPTIONS}
      placeholder="Divisa"
      className={className}
      disabled={disabled}
      dropdownWidthClass="w-20 right-0 left-auto min-w-[70px]"
    />
  );
};

interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string;
  group?: string;
}

const CustomSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  dropdownWidthClass?: string;
}> = ({ value, onChange, options, placeholder = 'Seleccione...', className = '', disabled = false, dropdownWidthClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => String(o.value) === String(value));
  const groups = Array.from(new Set(options.map(o => o.group || '')));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[38px] px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate flex items-center gap-1 justify-center min-w-0 flex-1">
          {selectedOpt ? (
            <>
              {selectedOpt.icon && <span className="shrink-0 text-xs">{selectedOpt.icon}</span>}
              <span className="truncate">{selectedOpt.label}</span>
            </>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className={`absolute top-full left-0 mt-1 ${dropdownWidthClass || 'w-full min-w-[200px]'} z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95`}>
          {groups.map(groupName => {
            const groupOpts = options.filter(o => (o.group || '') === groupName);
            return (
              <div key={groupName || 'main'} className="space-y-0.5">
                {groupName && (
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800 first:border-0 mt-1 first:mt-0 pt-1">
                    {groupName}
                  </div>
                )}
                {groupOpts.map(opt => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center justify-between font-semibold transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {opt.icon && <span className="text-sm shrink-0">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

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

  const projections = React.useMemo(() => calculateProjections(profile, exchangeRates), [profile, exchangeRates]);
  const incomeBalances = React.useMemo(() => calculateIncomeAccountBalances(profile, projections, convertAmount), [profile, projections, convertAmount]);

  const formatCurrencyExt = (amt: number, curr?: string) => {
    let sym = '$';
    if (curr === 'EUR' || curr === 'EUR_BCV') sym = '€';
    else if (curr === 'BS') sym = 'Bs';
    else if (curr === 'COP') sym = '$';
    else if (curr === 'BRL') sym = 'R$';
    else if (curr === 'USDT') sym = 'USDT ';
    
    const raw = sym + (Math.round((amt || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
    const conv = convertAmount(amt, curr || 'USD_BCV');
    const globalFormatted = formatCurrency(conv);
    
    const isDifferentCurrency = 
      (globalFormatted.includes('Bs') && sym !== 'Bs') ||
      (globalFormatted.includes('€') && sym !== '€') ||
      (globalFormatted.includes('USDT') && sym !== 'USDT ') ||
      (globalFormatted.includes('$') && !globalFormatted.includes('Bs') && sym !== '$');

    if (isDifferentCurrency) {
        return `${raw} (~ ${globalFormatted})`;
    }
    return raw;
  };
  
  const [name, setName] = useState('');
  const planStartDate = profile?.settings?.planStart || todayStr();
  const [color, setColor] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [freq, setFreq] = useState<FrequencyType>('monthly');
  const [day, setDay] = useState<number | string>(1);
  const [date, setDate] = useState(planStartDate);
  const [hasCustomStart, setHasCustomStart] = useState(false);
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
  const [initialPaidCuotas, setInitialPaidCuotas] = useState<number | string>('');

  const isTdc = debtType === 'card' || debtType.startsWith('tdc_');

  const [savPerson, setSavPerson] = useState('');
  const [savType, setSavType] = useState<'physical' | 'digital'>('physical');
  const [savStatus, setSavStatus] = useState<'pending' | 'completed'>('completed');
  const [savPlatform, setSavPlatform] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [currency, setCurrency] = useState('USD_BCV');
  const [receiptImg, setReceiptImg] = useState<string>('');
  const [markAsDone, setMarkAsDone] = useState<boolean>(false);
  const [incomeId, setIncomeId] = useState<string>('');

  const [showCutGrid, setShowCutGrid] = useState(false);
  const [showDueGrid, setShowDueGrid] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDebtTypeSelect = (selected: string) => {
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
        if (customDef.color) setColor(customDef.color);
        const newFreq = (customDef.freq as any) || 'monthly';
        setFreq(newFreq);

        if (selected.startsWith('tdc_')) {
          if (customDef.cutDay) setCutDay(customDef.cutDay);
          if (customDef.dueDay) setDueDay(customDef.dueDay);
          else setDueDay('1');
          if (customDef.limitCurrency) setCurrency(customDef.limitCurrency);
          else if (customDef.currency) setCurrency(customDef.currency);
        } else {
          let dDueDay = customDef.dueDay || '1';
          if (!customDef.dueDay) {
            if (newFreq === 'biweekly') dDueDay = '15-30';
            if (newFreq === 'triweekly') dDueDay = '3';
          }
          setDueDay(dDueDay);
          if (customDef.currency) setCurrency(customDef.currency);
          else if (customDef.limitCurrency) setCurrency(customDef.limitCurrency);
        }
      } else {
        setFreq('monthly');
        setDueDay('1');
      }
    }
  };

  const getDueDayOptions = () => {
    if (freq === 'weekly') {
      return [
        { value: '1', label: 'Lunes' },
        { value: '2', label: 'Martes' },
        { value: '3', label: 'Miércoles' },
        { value: '4', label: 'Jueves' },
        { value: '5', label: 'Viernes' },
        { value: '6', label: 'Sábado' },
        { value: '0', label: 'Domingo' },
      ];
    }
    if (freq === 'biweekly') {
      return [
        { value: '15-30', label: '15 y 30' },
        { value: '14-28', label: '14 y 28' },
        { value: '13-27', label: '13 y 27' },
        { value: 'exact_14', label: 'Cada 14 días (Cashea)' },
        { value: 'exact_15', label: 'Cada 15 días' },
      ];
    }
    if (freq === 'triweekly') {
      return [{ value: '3', label: '3ra Semana' }];
    }
    return Array.from({ length: 30 }, (_, i) => ({
      value: String(i + 1),
      label: `Día ${String(i + 1).padStart(2, '0')}`
    }));
  };

  const calcInstallmentInfo = (months: number) => {
    const bal = parseFloat(String(balance)) || 0;
    const amort = parseFloat(String(amortized)) || 0;
    const p = Math.max(0, bal - amort);
    if (p <= 0) return { cuota: 0, total: 0 };
    const r = (parseFloat(String(apr || '60')) / 100) / 12;
    let cuotaMensual = 0;
    if (r === 0) {
       cuotaMensual = p / months;
    } else {
       cuotaMensual = p * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    }
    const total = cuotaMensual * months;
    let cuota = cuotaMensual;
    if (freq === 'biweekly') cuota = cuotaMensual / 2;
    else if (freq === 'weekly') cuota = cuotaMensual / 4;
    return { cuota, total };
  };

  const [editingPayment, setEditingPayment] = useState<{
    recKey: string;
    partialIdx?: number;
    amount: string;
    currency: string;
    date: string;
    isPaidState?: boolean;
    noAffectBalance?: boolean;
    incomeId?: string;
  } | null>(null);

  const calculatedPmt = React.useMemo(() => {
    const bal = parseFloat(String(balance)) || 0;
    const amort = parseFloat(String(amortized)) || 0;
    // Amortization (down payment) reduces the principal to be financed
    const principal = Math.max(0, bal - amort);
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
    try {
      if (type !== 'debt' && type !== 'income' && type !== 'expense') return [];
      if (!parseFloat(String(balance || amount))) return [];

      if (type === 'income' || type === 'expense') {
        const itemId = editIndex !== null && profile[type === 'income' ? 'incomes' : 'expenses'][editIndex] ? profile[type === 'income' ? 'incomes' : 'expenses'][editIndex].id : 'preview';
        
        const parsedDateMs = (date && typeof date === 'string' && date.length >= 8) ? new Date(date).getTime() : NaN;
        const safeStart = (!isNaN(parsedDateMs) && isFinite(parsedDateMs)) ? date : (profile?.settings?.planStart || todayStr());
        const startMsCandidate = new Date(safeStart).getTime();
        const safeStartMs = (!isNaN(startMsCandidate) && isFinite(startMsCandidate)) ? startMsCandidate : Date.now();
        
        const parsedEndMs = (hasEndDate && endDate && typeof endDate === 'string' && endDate.length >= 8) ? new Date(endDate).getTime() : NaN;
        let safeEnd = (!isNaN(parsedEndMs) && isFinite(parsedEndMs)) ? endDate : profile?.settings?.planEnd;
        const endMsCandidate = safeEnd ? new Date(safeEnd).getTime() : NaN;
        if (!safeEnd || isNaN(endMsCandidate) || !isFinite(endMsCandidate)) {
          const baseMs = safeStartMs;
          safeEnd = new Date(baseMs + 86400000 * 365 * 3).toISOString().slice(0, 10);
        }

        const dummyItem = {
          id: itemId,
          name: name || 'Preview',
          type: type,
          amount: parseFloat(String(amount)) || 0,
          currency: currency as any,
          start: safeStart,
          day: freq === 'monthly' || freq === 'weekly' || freq === 'bimonthly' || freq === 'quarterly' || freq === 'four-monthly' || freq === 'semiannual' || freq === 'annual' ? parseInt(String(day), 10) || 1 : day,
          freq: freq,
        };

        const dummyProfile = {
          settings: { 
            planStart: safeStart, 
            planEnd: safeEnd,
            openingBalance: 0 
          },
          incomes: type === 'income' ? [dummyItem] : [],
          expenses: type === 'expense' ? [dummyItem] : [],
          debts: [],
          savingsList: [],
          overrides: profile.overrides || {}
        };

        const plan = calculateProjections(dummyProfile as any, exchangeRates, { includeDiscarded: true });
        
        const occurrences = plan.filter(p => p.ref?.id === itemId).slice(0, 50);
        
        return occurrences.map((c, i) => {
          const itemKey = `${type}_${itemId}_${c.originalDate || c.date}`;
          const ov = (profile.overrides || {})[itemKey] || {};
          const isDiscarded = !!c.discarded || !!ov.discarded;
          const isPostponed = !c.done && (c.userPostponed || Boolean(ov.userPostponed) || Boolean(c.targetDate && c.originalDate && c.targetDate !== c.originalDate));
          return {
            index: i + 1,
            date: c.targetDate || c.date || c.originalDate,
            originalDate: c.originalDate || c.date,
            key: itemKey,
            expectedAmount: parseFloat(String((c.ref as any)?.amount || amount)) || 0,
            isPaid: c.done,
            isDiscarded,
            isPostponed,
            paidAmount: c.done ? (parseFloat(String((c.ref as any)?.amount || amount)) || 0) : 0,
            paidCurrency: currency,
            ov: ov,
            isCoveredBySequential: false,
            isCoveredByExplicit: c.done,
            requiredPay: parseFloat(String((c.ref as any)?.amount || amount)) || 0
          };
        });
      }

    const itemId = editIndex !== null && profile.debts[editIndex] ? profile.debts[editIndex].id : 'preview';
    const inst = parseInt(String(installments), 10) || 1;
    let actualInst = inst;
    const finalFreq = freq;
    if (isTdc && finalFreq === 'biweekly') actualInst = inst * 2;
    if (isTdc && finalFreq === 'weekly') actualInst = inst * 4;
    let finalDueDay = finalFreq === 'biweekly' ? dueDay : (dueDay || day);
    if (isTdc && finalFreq === 'biweekly' && String(finalDueDay).indexOf('-') === -1) {
       const d = parseInt(String(finalDueDay), 10) || 15;
       let d1 = d;
       let d2 = d + 15;
       if (d > 15) {
          d1 = d - 15;
          d2 = d;
       }
       finalDueDay = String(d1) + "-" + String(d2);
    }

    let previewAmt = calculatedPmt;
    if (isTdc && finalFreq === 'biweekly') previewAmt = calculatedPmt / 2;
    if (isTdc && finalFreq === 'weekly') previewAmt = calculatedPmt / 4;

    const dummyItem = {
      id: itemId,
      name: name,
      type: debtType,
      balance: parseFloat(String(balance)) || 0,
      amount: previewAmt,
      amortized: parseFloat(String(amortized)) || 0,
      initialPaidCuotas: parseInt(String(initialPaidCuotas), 10) || 0,
      installments: actualInst,
      currency: currency as any,
      minPay: previewAmt,
      start: date,
      dueDay: finalDueDay,
      freq: finalFreq,
      hasInterest: (debtType === 'loan_interest' || debtType === 'card' || !!(profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)),
      apr: parseFloat(String(apr)) || 0
    };
    
    const plan = calculateAmortizationPlan(dummyItem, profile.overrides || {}, profile.settings.customDebts || [], undefined, exchangeRates);
    
    return plan.map((c, i) => {
      const isPaid = c.isPaid || c.isCoveredByExplicit || c.isCoveredBySequential;
      return {
        index: i + 1,
        date: c.date,
        key: c.key,
        matchedKey: c.matchedKey,
        expectedAmount: c.expectedAmount,
        isPaid,
        paidAmount: isPaid ? c.expectedAmount : 0, // Simplifying preview
        paidCurrency: currency,
        ov: c.ov || (profile.overrides || {})[c.key] || {},
        isCoveredBySequential: c.isCoveredBySequential,
        isCoveredByExplicit: c.isCoveredByExplicit,
        requiredPay: c.requiredPay
      };
    });
    } catch (err) {
      console.error('Error calculating expected cuotas preview:', err);
      return [];
    }
  }, [type, editIndex, profile.debts, profile.overrides, profile.settings.customDebts, installments, date, freq, dueDay, day, debtType, calculatedPmt, currency, amortized, initialPaidCuotas, balance, apr, name, amount]);

  const debtPaymentHistory = React.useMemo(() => {
    if (type !== 'debt' || editIndex === null) return [];
    const item = profile.debts[editIndex];
    if (!item) return [];
    
    const overrides = profile.overrides || {};
    const history: any[] = [];
    
    Object.keys(overrides).forEach(key => {
      if (key.startsWith(`${item.id}_`) || key.startsWith(`debt_${item.id}_`)) {
        const ov = overrides[key];
        if (ov.done) {
           history.push({
             key,
             date: ov.actualDate || ov.date || (key.includes('_cuota_') ? '' : key.split('_').pop() || ''),
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
                date: pt.date || ov.actualDate || ov.date || (key.includes('_cuota_') ? '' : key.split('_').pop() || ''),
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

  const handleDeleteDebtPayment = (cuotaOrRec: any) => {
    const targetKey = cuotaOrRec.key || cuotaOrRec.recKey;
    const matchedKey = cuotaOrRec.matchedKey;
    const partialIdx = cuotaOrRec.partialIdx;
    const cuotaIndex = cuotaOrRec.index;
    const cuotaDate = cuotaOrRec.date || cuotaOrRec.originalDate;
    const debtId = type === 'debt' && editIndex !== null ? profile.debts[editIndex]?.id : (cuotaOrRec.debtId || 'preview');
    
    const idStr = String(debtId || '');
    const idWithout = idStr.replace(/^debt_/, '');
    const idWith = idStr.startsWith('debt_') ? idStr : 'debt_' + idStr;

    const candidateKeys = new Set<string>();
    if (targetKey) candidateKeys.add(targetKey);
    if (matchedKey) candidateKeys.add(matchedKey);
    if (cuotaIndex !== undefined) {
      candidateKeys.add(`${debtId}_${cuotaIndex}`);
      candidateKeys.add(`debt_${debtId}_cuota_${cuotaIndex}`);
      candidateKeys.add(`${idWithout}_${cuotaIndex}`);
      candidateKeys.add(`debt_${idWithout}_cuota_${cuotaIndex}`);
      candidateKeys.add(`${idWith}_${cuotaIndex}`);
      candidateKeys.add(`debt_${idWith}_cuota_${cuotaIndex}`);
    }
    if (cuotaDate) {
      candidateKeys.add(`${debtId}_${cuotaDate}`);
      candidateKeys.add(`debt_${debtId}_${cuotaDate}`);
      candidateKeys.add(`${idWithout}_${cuotaDate}`);
      candidateKeys.add(`debt_${idWithout}_${cuotaDate}`);
      candidateKeys.add(`${idWith}_${cuotaDate}`);
      candidateKeys.add(`debt_${idWith}_${cuotaDate}`);
    }

    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      
      candidateKeys.forEach(k => {
        draft.overrides[k] = {
          ...(draft.overrides[k] || {}),
          done: false,
          isPaid: false,
          explicitUnpaid: true,
          amt: 0,
          paidAmount: 0,
          rawPayAmount: 0,
          partials: []
        };
      });

      const keysInDraft = Object.keys(draft.overrides);
      keysInDraft.forEach(k => {
        if (candidateKeys.has(k)) {
          draft.overrides[k] = {
            ...(draft.overrides[k] || {}),
            done: false,
            isPaid: false,
            explicitUnpaid: true,
            amt: 0,
            paidAmount: 0,
            rawPayAmount: 0,
            partials: []
          };
        } else if (cuotaIndex !== undefined) {
          const regex = new RegExp(`^(debt_)?(${idWithout}|${idWith}|${idStr})_?(cuota_)?${cuotaIndex}$`);
          if (regex.test(k)) {
            draft.overrides[k] = {
              ...(draft.overrides[k] || {}),
              done: false,
              isPaid: false,
              explicitUnpaid: true,
              amt: 0,
              paidAmount: 0,
              rawPayAmount: 0,
              partials: []
            };
          }
        }
      });

      if (cuotaOrRec.isCoveredBySequential) {
        const currentAmort = parseFloat(String(amortized)) || 0;
        const newAmort = Math.max(0, currentAmort - (cuotaOrRec.paidAmount || cuotaOrRec.expectedAmount || 0));
        setAmortized(newAmort === 0 ? '' : String(newAmort));
      }

      if (editIndex !== null && draft.debts[editIndex]) {
        const currentInitPaid = parseInt(String(draft.debts[editIndex].initialPaidCuotas || 0), 10);
        if (cuotaIndex !== undefined && cuotaIndex <= currentInitPaid) {
          draft.debts[editIndex].initialPaidCuotas = Math.max(0, currentInitPaid - 1);
        }
      }
    });

    if (cuotaIndex !== undefined) {
      const numInitPaid = parseInt(String(initialPaidCuotas || 0), 10);
      if (cuotaIndex <= numInitPaid) {
        setInitialPaidCuotas(Math.max(0, numInitPaid - 1));
      }
    }

    setEditingPayment(null);
    showToast('Cuota marcada como NO pagada', '🔄');
  };

  const handleRestoreCuota = (cuota: any) => {
    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      const ovKey = cuota.key;
      if (draft.overrides[ovKey]) {
        delete draft.overrides[ovKey].discarded;
        if (!draft.overrides[ovKey].done && !draft.overrides[ovKey].userPostponed && !draft.overrides[ovKey].actualDate) {
          delete draft.overrides[ovKey];
        }
      }
    });
    showToast('Cuota restaurada al plan', '✨');
  };

  const handleResetCuotaDate = (cuota: any) => {
    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      const ovKey = cuota.key;
      if (draft.overrides[ovKey]) {
        delete draft.overrides[ovKey].actualDate;
        delete draft.overrides[ovKey].userPostponed;
        delete draft.overrides[ovKey].plannedAmt;
        delete draft.overrides[ovKey].rawPayAmount;
        delete draft.overrides[ovKey].payCurrency;
        if (!draft.overrides[ovKey].done && !draft.overrides[ovKey].discarded && (!draft.overrides[ovKey].partials || draft.overrides[ovKey].partials.length === 0)) {
          delete draft.overrides[ovKey];
        }
      }
    });
    setEditingPayment(null);
    showToast('Fecha restablecida a la original', '↩️');
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
        current.plannedAmt = usdVal;
        current.rawPayAmount = rawAmt;
        current.payCurrency = editingPayment.currency;

        // Clean stale actualDate/userPostponed on future unpaid cuotas so they recalculate from this new date
        const cuotaMatch = editingPayment.recKey.match(/(\d+)$/);
        if (cuotaMatch) {
          const currentIdx = parseInt(cuotaMatch[1], 10);
          const keyPrefix = editingPayment.recKey.replace(/_?\d+$/, '');
          Object.keys(draft.overrides).forEach(k => {
            if (k.startsWith(keyPrefix)) {
              const km = k.match(/(\d+)$/);
              if (km) {
                const kIdx = parseInt(km[1], 10);
                if (kIdx > currentIdx) {
                  const futureOv = draft.overrides[k];
                  if (futureOv && !futureOv.done && !futureOv.isPaid) {
                    delete futureOv.actualDate;
                    delete futureOv.userPostponed;
                  }
                }
              }
            }
          });
        }
      } else {
        if (editingPayment.partialIdx !== undefined) {
            if (current.partials && current.partials[editingPayment.partialIdx]) {
              current.partials[editingPayment.partialIdx] = {
                ...current.partials[editingPayment.partialIdx],
                amt: editingPayment.noAffectBalance ? 0 : usdVal,
                rawAmt: rawAmt,
                currency: editingPayment.currency,
                date: editingPayment.date
              };
            }
        } else {
            delete current.explicitUnpaid;
            current.done = true;
            current.isPaid = true;
            current.noAffectBalance = !!editingPayment.noAffectBalance;
            current.incomeId = editingPayment.noAffectBalance ? undefined : (editingPayment.incomeId || incomeId || profile.incomes?.[0]?.id);
            current.amt = editingPayment.noAffectBalance ? 0 : usdVal;
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
            if (k.startsWith('debt_preview_') || k.startsWith('preview_')) delete draft.overrides[k];
          });
        }
      });
    }

    if (editIndex !== null) {
      if (type === 'income') {
        const item = profile.incomes[editIndex];
        if (item && item.freq === 'one-time') {
           const ov = getOverrideForItem(profile.overrides || {}, 'income', item, item.date || planStartDate);
           const isDone = ov ? !!ov.done : !!(item as any).done;
           setMarkAsDone(isDone);
        }
        if (item) {
          setName(item.name);
          setStrictDate((item as any).strictDate || false);
          setAmount(item.amount);
          setFreq(item.freq);
          setDay(item.day || 1);
          setHasCustomStart(!!item.hasCustomStart);
          setDate(item.hasCustomStart && item.start ? item.start : (item.date || planStartDate));
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
           const ov = getOverrideForItem(profile.overrides || {}, 'expense', item, item.date || planStartDate);
           const isDone = ov ? !!ov.done : !!(item as any).done;
           setMarkAsDone(isDone);
        }
        if (item) {
          setName(item.name);
          setStrictDate((item as any).strictDate || false);
          setAmount(item.amount);
          setFreq(item.freq);
          setDay(item.day || 1);
          setHasCustomStart(!!item.hasCustomStart);
          setDate(item.hasCustomStart && item.start ? item.start : (item.date || planStartDate));
          setHasEndDate(!!item.end);
          setEndDate(item.end || '');
          setDesc(item.desc || '');
          setCategory(item.category || '');
          setTags(item.tags ? item.tags.join(', ') : '');
          setCurrency(item.currency || 'USD_BCV');
          setReceiptImg(item.receiptImg || '');
          setIncomeId(item.incomeId || '');
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
          setInitialPaidCuotas(item.initialPaidCuotas || '');
          setIncomeId(item.incomeId || '');
          let itemFreq = item.freq;
          if (item.type !== 'card' && item.type !== 'fixed' && item.type !== 'loan_interest') {
             const cDef = profile.settings.customDebts?.find(d => d.id === item.type);
             if (cDef && !itemFreq) itemFreq = cDef.freq as any;
          }
          const finalFreqState = itemFreq || 'monthly';
          const isItemTdc = item.type === 'card' || item.type.startsWith('tdc_');
          if (isItemTdc && finalFreqState === 'biweekly') {
             setInstallments(Math.ceil((item.installments || 2) / 2));
          } else if (isItemTdc && finalFreqState === 'weekly') {
             setInstallments(Math.ceil((item.installments || 4) / 4));
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
          setIncomeId(item.incomeId || '');
        }
      }
    } else {
      // Defaults for creation
      setName('');
      setAmount('');
      setFreq(forceOneTime ? 'one-time' : 'monthly');
      setDay(1);
      setDate(forceOneTime ? todayStr() : planStartDate);
      setHasCustomStart(false);
      setHasEndDate(false);
      setEndDate('');
      setDesc('');
      setDebtType('');
      setBalance('');
      setInstallments('');
      setCutDay(5);
      setDueDay('15-30');
      setApr('');
      setAmortized('');
      setInitialPaidCuotas('');
      setSavPerson('');
      setSavType('physical');
      setSavStatus('completed');
      setSavPlatform('');
      setCategory('');
      setTags('');
      setCurrency('USD_BCV');
      setReceiptImg('');
      setIncomeId('');
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
          incomeId: incomeId || undefined,
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
          hasCustomStart: finalFreq !== 'one-time' ? hasCustomStart : undefined,
          start: finalFreq !== 'one-time' ? (hasCustomStart ? date : planStartDate) : undefined,
          end: finalFreq !== 'one-time' && hasEndDate ? endDate : undefined,
          desc,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          currency: currency as any,
          receiptImg: receiptImg || undefined,
          strictDate,
        };

        if (editIndex !== null) {
          const oldItem = draft.incomes[editIndex];
          if (oldItem && oldItem.date && oldItem.date !== date) {
            draft.overrides = draft.overrides || {};
            const idWithout = String(oldItem.id).replace(/^inc_/, '');
            const sanitizedId = sanitizeDocId(oldItem.name || '', oldItem.id);
            [
              `income_${oldItem.id}_${oldItem.date}`,
              `${oldItem.id}_${oldItem.date}`,
              `income_${idWithout}_${oldItem.date}`,
              `${idWithout}_${oldItem.date}`,
              `income_${sanitizedId}_${oldItem.date}`,
              `${sanitizedId}_${oldItem.date}`
            ].forEach(k => {
              if (draft.overrides[k]) delete draft.overrides[k];
            });
          }
          (item as any).done = markAsDone;
          draft.incomes[editIndex] = item;
        } else {
          (item as any).done = markAsDone;
          draft.incomes.push(item);
        }
        
        if (finalFreq === 'one-time') {
           draft.overrides = draft.overrides || {};
           const key = `income_${item.id}_${date}`;
           const sanitizedKey = `income_${sanitizeDocId(item.name, item.id)}_${date}`;
           if (markAsDone) {
             draft.overrides[key] = { ...(draft.overrides[key] || {}), done: true };
             if (sanitizedKey !== key) {
               draft.overrides[sanitizedKey] = { ...(draft.overrides[sanitizedKey] || {}), done: true };
             }
           } else {
             delete draft.overrides[key];
             delete draft.overrides[sanitizedKey];
           }
        }
      } else if (type === 'expense') {
        const item: ExpenseItem = {
          id: editIndex !== null ? draft.expenses[editIndex].id : `exp_${Date.now()}`,
          name,
          amount: numAmt,
          freq: finalFreq,
          day: finalFreq !== 'one-time' ? day : undefined,
          date: finalFreq === 'one-time' ? date : undefined,
          hasCustomStart: finalFreq !== 'one-time' ? hasCustomStart : undefined,
          start: finalFreq !== 'one-time' ? (hasCustomStart ? date : planStartDate) : undefined,
          end: finalFreq !== 'one-time' && hasEndDate ? endDate : undefined,
          desc,
          category: category || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          currency: currency as any,
          receiptImg: receiptImg || undefined,
          strictDate,
          incomeId: incomeId || undefined,
        };

        if (editIndex !== null) {
          const oldItem = draft.expenses[editIndex];
          if (oldItem && oldItem.date && oldItem.date !== date) {
            draft.overrides = draft.overrides || {};
            const idWithout = String(oldItem.id).replace(/^exp_/, '');
            const sanitizedId = sanitizeDocId(oldItem.name || '', oldItem.id);
            [
              `expense_${oldItem.id}_${oldItem.date}`,
              `${oldItem.id}_${oldItem.date}`,
              `expense_${idWithout}_${oldItem.date}`,
              `${idWithout}_${oldItem.date}`,
              `expense_${sanitizedId}_${oldItem.date}`,
              `${sanitizedId}_${oldItem.date}`
            ].forEach(k => {
              if (draft.overrides[k]) delete draft.overrides[k];
            });
          }
          (item as any).done = markAsDone;
          draft.expenses[editIndex] = item;
        } else {
          (item as any).done = markAsDone;
          draft.expenses.push(item);
        }
        
        if (finalFreq === 'one-time') {
           draft.overrides = draft.overrides || {};
           const key = `expense_${item.id}_${date}`;
           const sanitizedKey = `expense_${sanitizeDocId(item.name, item.id)}_${date}`;
           if (markAsDone) {
             draft.overrides[key] = { ...(draft.overrides[key] || {}), done: true };
             if (sanitizedKey !== key) {
               draft.overrides[sanitizedKey] = { ...(draft.overrides[sanitizedKey] || {}), done: true };
             }
           } else {
             delete draft.overrides[key];
             delete draft.overrides[sanitizedKey];
           }
        }
      } else if (type === 'debt') {
        const isTdc = debtType === 'card' || debtType.startsWith('tdc_');
        let finalDueDay = freq === 'biweekly' ? dueDay : (dueDay || day);
        if (isTdc && freq === 'biweekly' && String(finalDueDay).indexOf('-') === -1) {
           const d = parseInt(String(finalDueDay), 10) || 15;
           let d1 = d;
           let d2 = d + 15;
           if (d > 15) {
              d1 = d - 15;
              d2 = d;
           }
           finalDueDay = String(d1) + "-" + String(d2);
        }
        
        const bal = parseFloat(String(balance)) || 0;
        const amort = parseFloat(String(amortized)) || 0;
        const principal = Math.max(0, bal - amort);
        const inst = parseInt(String(installments), 10) || 1;
        let actualInst = inst;
        if (isTdc && freq === 'biweekly') actualInst = inst * 2;
        if (isTdc && freq === 'weekly') actualInst = inst * 4;
        
        let calculatedAmount = principal / actualInst;
        const hasInt = debtType === 'loan_interest' || isTdc || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
        if (hasInt && parseFloat(String(apr) || '0') > 0) {
            const r = (parseFloat(String(apr)) / 100) / 12;
            const monthlyPayment = principal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
            if (isTdc && freq === 'biweekly') calculatedAmount = monthlyPayment / 2;
            else if (isTdc && freq === 'weekly') calculatedAmount = monthlyPayment / 4;
            else calculatedAmount = monthlyPayment;
        }

        let debtId = editIndex !== null ? draft.debts[editIndex].id : '';
        if (!debtId) {
          const baseId = sanitizeDocId(name, `debt_${Date.now()}`);
          let finalId = baseId;
          if (draft.debts.some(d => d.id === finalId)) {
            finalId = `${baseId}_${todayStr()}`;
          }
          let counter = 1;
          while (draft.debts.some(d => d.id === finalId)) {
            finalId = `${baseId}_${todayStr()}_${counter}`;
            counter++;
          }
          debtId = finalId;
        }

        const item: DebtItem = {
          id: debtId,
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
          initialPaidCuotas: parseInt(String(initialPaidCuotas), 10) || undefined,
          hasInterest: (debtType === 'loan_interest' || isTdc || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) ? true : false,
          strictDate,
          incomeId: incomeId || undefined,
        };

        const numPaidPrior = parseInt(String(initialPaidCuotas), 10) || 0;
        draft.overrides = draft.overrides || {};
        for (let k = 1; k <= actualInst; k++) {
          const ovKey = `${item.id}_${k}`;
          const legacyKey = `debt_${item.id}_cuota_${k}`;
          if (k <= numPaidPrior) {
            draft.overrides[ovKey] = {
              ...(draft.overrides[ovKey] || {}),
              done: true,
              paidPrior: true
            };
          } else {
            if (draft.overrides[ovKey]?.paidPrior) {
              delete draft.overrides[ovKey].done;
              delete draft.overrides[ovKey].paidPrior;
              if (Object.keys(draft.overrides[ovKey]).length === 0) {
                delete draft.overrides[ovKey];
              }
            }
            if (draft.overrides[legacyKey]?.paidPrior) {
              delete draft.overrides[legacyKey].done;
              delete draft.overrides[legacyKey].paidPrior;
              if (Object.keys(draft.overrides[legacyKey]).length === 0) {
                delete draft.overrides[legacyKey];
              }
            }
          }
        }

        if (editIndex !== null) draft.debts[editIndex] = item;
        else {
          draft.debts.push(item);
          if (draft.overrides) {
            Object.keys(draft.overrides).forEach(k => {
              if (k.startsWith('debt_preview_')) {
                const newKey = k.replace('debt_preview_', `${item.id}_`);
                draft.overrides[newKey] = draft.overrides[k];
                delete draft.overrides[k];
              } else if (k.startsWith('preview_')) {
                const newKey = k.replace('preview_', `${item.id}_`);
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
            if (k.startsWith('debt_preview_') || k.startsWith('preview_')) delete draft.overrides[k];
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg sm:max-w-[560px] w-full h-[80vh] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate pr-4 max-w-[360px]" title={editIndex !== null ? (type === 'saving' ? savPerson : name) : 'Nuevo Registro'}>
            {editIndex !== null ? 'Editar: ' + (type === 'saving' ? savPerson : name) : 'Nuevo Registro'}
          </h3>
          <button type="button" onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
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
                    <label className="text-xs font-bold text-slate-500 block mb-1">Fecha</label>
                    <input
                      type="date" required value={date} onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 h-[38px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Divisa</label>
                    <CurrencySelect value={currency} onChange={setCurrency} />
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cuenta de Origen (¿De cuál cuenta saldrá este dinero?)
                  </label>
                  <select
                    value={incomeId}
                    onChange={e => setIncomeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="">❓ Sin cuenta especificada (Indicar al momento de pagar)</option>
                    {incomeBalances.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.id === 'required_starting_fund' ? '🪙' : '🏦'} {b.name} — Disponible: {formatCurrencyExt(b.availableToday, b.currency || 'USD_BCV')}
                      </option>
                    ))}
                  </select>
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
                    <div className="flex gap-2">
                      <div className={debtType !== '' && debtType !== 'card' && !debtType.startsWith('tdc_') ? "flex-[55] min-w-0" : "flex-1 min-w-0"}>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Tipo de Deuda</label>
                        <CustomSelect
                          value={debtType}
                          onChange={handleDebtTypeSelect}
                          placeholder="Seleccione..."
                          options={[
                            { value: 'card', label: 'Tarjeta de Crédito (Nueva)', icon: '💳' },
                            { value: 'loan_interest', label: 'Préstamo con Interés', icon: '🏦' },
                            { value: 'loan_no_interest', label: 'Préstamo sin Interés', icon: '🤝' },
                            ...(profile.settings.customDebts || []).map(cd => ({
                              value: cd.id,
                              label: cd.name,
                              icon: '✨',
                              group: 'Plantillas Guardadas'
                            }))
                          ]}
                        />
                      </div>

                      {debtType !== '' && debtType !== 'card' && !debtType.startsWith('tdc_') && (
                        <div className="flex-[40] min-w-0">
                          <label className="text-xs font-bold text-slate-500 block mb-1">Día Pago</label>
                          <CustomSelect
                            value={String(dueDay)}
                            onChange={val => setDueDay(val)}
                            options={getDueDayOptions()}
                          />
                        </div>
                      )}

                      <div className="w-[52px] shrink-0">
                        <label className="text-xs font-bold text-slate-500 block mb-1 text-center">Color</label>
                        <input
                          type="color" value={color || '#94a3b8'} onChange={e => setColor(e.target.value)}
                          className="w-full h-[38px] p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                        />
                      </div>
                    </div>

                    {debtType !== '' && (
                      <div className="flex gap-2">
                        <div className={debtType !== 'card' && !debtType.startsWith('tdc_') ? "flex-[55] min-w-0" : "flex-1 min-w-0"}>
                          <label className="text-xs font-bold text-slate-500 block mb-1">Fecha Inicial</label>
                          <input
                            type="date" required value={date} onChange={e => setDate(e.target.value)}
                            className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 h-[38px]"
                          />
                        </div>
                        {debtType !== 'card' && !debtType.startsWith('tdc_') ? (
                          <>
                            <div className="flex-[40] min-w-0">
                              <label className="text-xs font-bold text-slate-500 block mb-1">Monto Total</label>
                              <input
                                type="number" required value={balance} onChange={e => setBalance(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 h-[38px]"
                              />
                            </div>
                            <div className="w-[52px] shrink-0">
                              <label className="text-xs font-bold text-slate-500 block mb-1 text-center">Moneda</label>
                              <CurrencySelect value={currency} onChange={setCurrency} />
                            </div>
                          </>
                        ) : null}
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
                        <div className="flex gap-2">
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Monto Total</label>
                            <input
                              type="number" required value={balance} onChange={e => setBalance(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 h-[38px]"
                            />
                          </div>
                          <div className="w-[52px] shrink-0">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1 text-center">Moneda</label>
                            <CurrencySelect value={currency} onChange={setCurrency} />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="flex-[55] min-w-0">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Cuotas (Max 6)</label>
                            <select
                              required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-1.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-900 dark:text-slate-100 h-[38px]"
                            >
                              {Array.from({ length: 6 }, (_, i) => i + 1).map(m => {
                                const info = calcInstallmentInfo(m);
                                return (
                                  <option key={m} value={m}>
                                    {m} mes{m > 1 ? 'es' : ''} ({formatCurrencyExt(info.cuota, currency)})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div className="flex-[40] min-w-0">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Amort. Inicial</label>
                            <input
                              type="number" step="any" min="0" value={amortized} onChange={e => setAmortized(e.target.value)}
                              placeholder="Enganche/Abono"
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 h-[38px]"
                            />
                          </div>
                          <div className="w-[52px] shrink-0">
                            <label className="text-[9px] font-bold text-slate-500 block mb-1 text-center leading-tight">Pagadas</label>
                            <input
                              type="number" min="0" max={installments || 999} value={initialPaidCuotas} onChange={e => setInitialPaidCuotas(e.target.value)}
                              placeholder="0"
                              className="w-full px-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 text-center h-[38px]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Tasa APR Anual (%)</label>
                          <input
                            type="number" step="any" min="0" value={apr} onChange={e => setApr(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div className="pt-1">
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

                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-amber-100/50 dark:bg-amber-900/40 rounded-xl text-[10px] font-bold text-amber-900 dark:text-amber-200 text-center">
                              {(() => {
                                 const installmentAmt = freq === 'biweekly' ? calculatedPmt / 2 
                                   : freq === 'weekly' ? calculatedPmt / 4 
                                   : freq === 'bimonthly' ? calculatedPmt * 2 
                                   : freq === 'quarterly' ? calculatedPmt * 3 
                                   : freq === 'four-monthly' ? calculatedPmt * 4 
                                   : freq === 'semiannual' ? calculatedPmt * 6 
                                   : freq === 'annual' ? calculatedPmt * 12 
                                   : calculatedPmt;
                                 const label = freq === 'biweekly' ? 'Cuota quincenal:' 
                                   : freq === 'weekly' ? 'Cuota semanal:' 
                                   : freq === 'bimonthly' ? 'Cuota bimensual:' 
                                   : freq === 'quarterly' ? 'Cuota trimestral:' 
                                   : freq === 'four-monthly' ? 'Cuota cuatrimestral:' 
                                   : freq === 'semiannual' ? 'Cuota semestral:' 
                                   : freq === 'annual' ? 'Cuota anual:' 
                                   : 'Cuota mensual:';
                                 return (
                                   <div className="flex justify-between items-center px-2">
                                     <span>{label} {formatCurrencyExt(installmentAmt, currency)}</span>
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
                        <div className="flex gap-2">
                          <div className="flex-[55] min-w-0">
                            <label className="text-xs font-bold text-slate-500 block mb-1">Nro. Cuotas</label>
                            <input
                              type="number" min="1" required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 h-[38px]"
                            />
                          </div>
                          <div className="flex-[40] min-w-0">
                            <label className="text-xs font-bold text-slate-500 block mb-1">Amort. Inicial</label>
                            <input
                              type="number" step="any" min="0" value={amortized} onChange={e => setAmortized(e.target.value)}
                              placeholder="Enganche/Abono"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 h-[38px]"
                            />
                          </div>
                          <div className="w-[52px] shrink-0">
                            <label className="text-[9px] font-bold text-slate-500 block mb-1 text-center leading-tight">Pagadas</label>
                            <input
                              type="number" min="0" max={installments || 999} value={initialPaidCuotas} onChange={e => setInitialPaidCuotas(e.target.value)}
                              placeholder="0"
                              className="w-full px-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 text-center h-[38px]"
                            />
                          </div>
                        </div>

                        {(debtType === 'loan_interest' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Interés (%)</label>
                            <input
                              type="number" step="any" min="0" required value={apr} onChange={e => setApr(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        )}

                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">
                              {(() => {
                                 const installmentAmt = calculatedPmt;
                                 const label = freq === 'biweekly' ? 'Cuota quincenal:' 
                                   : freq === 'weekly' ? 'Cuota semanal:' 
                                   : freq === 'bimonthly' ? 'Cuota bimensual:' 
                                   : freq === 'quarterly' ? 'Cuota trimestral:' 
                                   : freq === 'four-monthly' ? 'Cuota cuatrimestral:' 
                                   : freq === 'semiannual' ? 'Cuota semestral:' 
                                   : freq === 'annual' ? 'Cuota anual:' 
                                   : 'Cuota mensual:';
                                 return (
                                   <div className="flex justify-between items-center px-2">
                                     <span>{label} {formatCurrencyExt(installmentAmt, currency)}</span>
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

                    {debtType !== '' && (
                      <div className="mt-3 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                          <span>⚙️ Opciones avanzadas</span>
                        </button>

                        {showAdvanced && (
                          <div className="mt-2 space-y-3 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                  Asignar a una cuenta fija
                                </label>
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                                  Opcional
                                </span>
                              </div>
                              <select
                                value={incomeId}
                                onChange={e => setIncomeId(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                              >
                                <option value="">❓ Sin cuenta especificada (Indicar al momento de pagar cada cuota)</option>
                                {incomeBalances.map(b => (
                                  <option key={b.id} value={b.id}>
                                    {b.id === 'required_starting_fund' ? '🪙' : '🏦'} {b.name} — Disponible: {formatCurrencyExt(b.availableToday, b.currency || 'USD_BCV')}
                                  </option>
                                ))}
                              </select>
                              <p className="text-[10px] text-slate-400 leading-tight mt-1">
                                Si seleccionas una cuenta, las cuotas de esta deuda se debitarán prioritariamente de ella.
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                              <div className="space-y-0.5">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Fecha Estricta (No reprogramable)</label>
                                <p className="text-[10px] text-slate-400 font-medium leading-tight">El sistema no sugerirá reprogramar este pago para equilibrar liquidez.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                                <input type="checkbox" className="sr-only peer" checked={strictDate} onChange={e => setStrictDate(e.target.checked)} />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-rose-500"></div>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Monto</label>
                        <input
                          type="number" required value={amount} onChange={e => setAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 h-[38px]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Divisa</label>
                        <CurrencySelect value={currency} onChange={setCurrency} />
                      </div>
                    </div>

                    {type === 'expense' && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Cuenta de Ingreso (¿De cuál cuenta saldrá este gasto?)
                        </label>
                        <select
                          value={incomeId}
                          onChange={e => setIncomeId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                        >
                          <option value="">❓ Sin cuenta especificada (Indicar al momento de pagar)</option>
                          {incomeBalances.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.id === 'required_starting_fund' ? '🪙' : '🏦'} {b.name} — Disponible: {formatCurrencyExt(b.availableToday, b.currency || 'USD_BCV')}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
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
  if (type === 'debt') {
    if (newFreq === 'biweekly') setDueDay('15-30');
    else if (newFreq === 'weekly') setDueDay('1');
    else if (newFreq === 'triweekly') setDueDay('3');
    else setDueDay('1');
  } else {
    if (newFreq === 'biweekly') setDay('15-30');
    else if (newFreq === 'weekly') setDay(1);
    else setDay(1);
  }
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          >
                            <option value="monthly">Mensual</option>
                            <option value="biweekly">Quincenal</option>
                            <option value="weekly">Semanal</option>
                            <option value="bimonthly">Bimensual (Cada 2 meses)</option>
                            <option value="quarterly">Trimestral (Cada 3 meses)</option>
                            <option value="four-monthly">Cuatrimestral (Cada 4 meses)</option>
                            <option value="semiannual">Semestral (Cada 6 meses)</option>
                            <option value="annual">Anual</option>
                          </select>
                        </div>
                        {freq === 'monthly' || freq === 'bimonthly' || freq === 'quarterly' || freq === 'four-monthly' || freq === 'semiannual' || freq === 'annual' ? (
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día del Mes</label>
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Rango de Validez</span>
                           <span className="text-[10px] text-slate-500 font-medium">Por defecto: desde inicio del plan ({planStartDate})</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                               <input 
                                 type="checkbox" 
                                 checked={hasCustomStart} 
                                 onChange={e => {
                                   setHasCustomStart(e.target.checked);
                                   if (!e.target.checked) setDate(planStartDate);
                                 }} 
                                 className="mr-1 rounded text-emerald-600 cursor-pointer" 
                               />
                               Válido Desde (Personalizado)
                            </label>
                            <input
                              type="date" 
                              value={hasCustomStart ? date : planStartDate} 
                              onChange={e => { setHasCustomStart(true); setDate(e.target.value); }} 
                              disabled={!hasCustomStart}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                               <input type="checkbox" checked={hasEndDate} onChange={e => setHasEndDate(e.target.checked)} className="mr-1 rounded text-emerald-600 cursor-pointer" />
                               Válido Hasta
                            </label>
                            <input
                              type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!hasEndDate}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            
            

            
            {type === 'expense' && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 mt-2">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Fecha Estricta (No reprogramable)</label>
                  <p className="text-[10px] text-slate-400 font-medium">El sistema no sugerirá reprogramar este pago para equilibrar liquidez.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                  <input type="checkbox" className="sr-only peer" checked={strictDate} onChange={e => setStrictDate(e.target.checked)} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-rose-500"></div>
                </label>
              </div>
            )}

            {(type === "debt" || type === "income" || type === "expense") && expectedCuotas.length > 0 && (

              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{type === 'debt' ? 'Plan de Cuotas' : 'Proyección de Fechas'}</h4>
                <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {expectedCuotas.map((cuota, i) => {
                    const isEditing = editingPayment?.recKey === cuota.key;
                    const customDefForForm = profile.settings?.customDebts?.find(d => d.id === debtType);
                    const activeCuotaColor = color || customDefForForm?.color || '#f59e0b';
                    return (
                      <div 
                        key={`${cuota.key}_${i}`} 
                        className={`flex flex-col p-2 rounded-xl border transition-all ${
                          cuota.isDiscarded 
                            ? 'bg-slate-100/70 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700 opacity-70' 
                            : cuota.isPaid 
                            ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50' 
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        }`}
                        style={cuota.isDiscarded ? { borderLeftWidth: '4px', borderLeftColor: '#94a3b8' } : !cuota.isPaid ? { borderLeftWidth: '4px', borderLeftColor: activeCuotaColor } : { borderLeftWidth: '4px', borderLeftColor: '#10b981' }}
                      >
                        {isEditing ? (
                          <div className="space-y-2 py-1">
                            {editingPayment?.isPaidState !== false && (
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={editingPayment?.amount || ''}
                                  onChange={e => editingPayment && setEditingPayment({ ...editingPayment, amount: e.target.value })}
                                  placeholder="Monto pagado"
                                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                                />
                                <select
                                  value={editingPayment?.currency || ''}
                                  onChange={e => editingPayment && setEditingPayment({ ...editingPayment, currency: e.target.value })}
                                  className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold"
                                >
                                  <option value="USD_BCV">$ (BCV)</option>
                                  <option value="EUR_BCV">€ (BCV)</option>
                                  <option value="USDT">USDT</option>
                                  <option value="BS">Bs</option>
                                </select>
                              </div>
                            )}
                            {editingPayment?.isPaidState !== false && (
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-1">
                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                                  ¿De cuál cuenta salió el pago?
                                </label>
                                <select
                                  value={editingPayment?.noAffectBalance ? '__EXTERNAL__' : (editingPayment?.incomeId || incomeId || profile.incomes?.[0]?.id || '')}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val === '__EXTERNAL__') {
                                      setEditingPayment(prev => prev ? { ...prev, noAffectBalance: true, incomeId: undefined } : null);
                                    } else {
                                      setEditingPayment(prev => prev ? { ...prev, noAffectBalance: false, incomeId: val } : null);
                                    }
                                  }}
                                  className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                                >
                                  {profile.incomes.map(inc => (
                                    <option key={inc.id} value={inc.id}>
                                      🏦 {inc.name} (Descontar de esta cuenta)
                                    </option>
                                  ))}
                                  <option value="__EXTERNAL__">
                                    🛡️ Fondos externos / Anteriores (no debitar de cuentas)
                                  </option>
                                </select>
                                <p className="text-[9px] text-slate-500 leading-tight">
                                  {editingPayment?.noAffectBalance
                                    ? '🛡️ Se registra como pagada sin restar de tus cuentas de ingreso actuales.'
                                    : '💳 Se descuenta del disponible acumulativo de la cuenta seleccionada.'}
                                </p>
                              </div>
                            )}
                            <div className="flex gap-2 items-center">
                              <input
                                type="date"
                                value={editingPayment?.date || ''}
                                onChange={e => editingPayment && setEditingPayment({ ...editingPayment, date: e.target.value })}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              />
                              <button
                                type="button"
                                onClick={handleSaveDebtPayment}
                                className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg transition-colors"
                                title="Guardar pago"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              {cuota.isPaid && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDebtPayment(cuota)}
                                  className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg transition-colors"
                                  title="Marcar como NO pagada"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingPayment(null)}
                                className="p-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              {!cuota.isDiscarded ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (cuota.isPaid) {
                                      handleDeleteDebtPayment(cuota);
                                    } else {
                                      setEditingPayment({
                                        recKey: cuota.key,
                                        amount: String(cuota.requiredPay > 0 ? cuota.requiredPay : cuota.expectedAmount),
                                        currency: currency,
                                        date: cuota.date,
                                        isPaidState: true,
                                        noAffectBalance: false
                                      });
                                    }
                                  }}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all cursor-pointer ${cuota.isPaid ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500'}`}
                                  title={cuota.isPaid ? "Click para marcar como NO pagada" : "Click para registrar pago"}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreCuota(cuota)}
                                  className="w-5 h-5 rounded-md flex items-center justify-center border border-slate-300 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:border-blue-500 shrink-0 transition-all cursor-pointer"
                                  title="Click para restaurar cuota al plan"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                              <div 
                                className="flex flex-col cursor-pointer flex-1"
                                onClick={() => {
                                  if (cuota.isDiscarded) {
                                    handleRestoreCuota(cuota);
                                  } else {
                                    setEditingPayment({
                                      recKey: cuota.key,
                                      amount: String(cuota.isPaid ? cuota.paidAmount : (cuota.requiredPay || cuota.expectedAmount)),
                                      currency: cuota.isPaid ? cuota.paidCurrency : currency,
                                      date: cuota.ov?.actualDate || cuota.date,
                                      isPaidState: cuota.isPaid,
                                      noAffectBalance: cuota.ov?.noAffectBalance ?? false
                                    });
                                  }
                                }}
                              >
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-xs font-bold ${cuota.isDiscarded ? 'text-slate-400 line-through' : cuota.isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'} group-hover:text-blue-600 transition-colors`}>
                                    Cuota {cuota.index} {cuota.isPaid ? `- ${formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)}` : (cuota.paidAmount > 0 ? `(Abonado: ${formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)})` : '')}
                                  </span>
                                  {cuota.isDiscarded && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-bold">
                                      Ignorada / Descartada
                                    </span>
                                  )}
                                  {cuota.isPaid && cuota.ov?.noAffectBalance && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded font-bold">
                                      🛡️ No afectó disponible
                                    </span>
                                  )}
                                  {cuota.isPostponed && !cuota.isDiscarded && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded font-bold">
                                      Reprogramada
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  {formatDateStr(cuota.date)} {cuota.isPaid ? ((cuota.ov?.paidPrior || cuota.index <= (parseInt(String(initialPaidCuotas), 10) || 0)) ? '(Pagado previamente)' : '(Pagado)') : ''}
                                </span>
                              </div>
                            </div>
                            {!cuota.isPaid && !cuota.isDiscarded && ( <span className='text-xs font-bold text-slate-400'>{cuota.paidAmount > 0 ? 'Falta: ' : ''}{formatCurrencyExt(cuota.requiredPay, currency)}</span> )}
                            {cuota.isDiscarded && (
                              <button
                                type="button"
                                onClick={() => handleRestoreCuota(cuota)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md"
                                title="Restaurar al plan"
                              >
                                <RotateCcw className="w-3 h-3" /> Restaurar
                              </button>
                            )}
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
