import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FrequencyType, IncomeItem, ExpenseItem, DebtItem, SavingsItem } from '../../types';
import { todayStr, formatCurrency } from '../../utils/financialEngine';
import { X, Trash2, CheckCircle } from 'lucide-react';

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
  const { profile, updateProfileData, showToast, validateTransaction } = useApp();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [freq, setFreq] = useState<FrequencyType>('monthly');
  const [day, setDay] = useState<number | string>(1);
  const [date, setDate] = useState(todayStr());
  const [desc, setDesc] = useState('');
  const [debtType, setDebtType] = useState('fixed');
  const [balance, setBalance] = useState<number | string>('');
  const [installments, setInstallments] = useState<number | string>('');
  const [cutDay, setCutDay] = useState<number | string>(5);
  const [dueDay, setDueDay] = useState<number | string>('15-30');
  const [apr, setApr] = useState<number | string>('');
  const [savPerson, setSavPerson] = useState('');
  const [savType, setSavType] = useState<'physical' | 'digital'>('physical');
  const [savStatus, setSavStatus] = useState<'pending' | 'completed'>('completed');
  const [savPlatform, setSavPlatform] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [currency, setCurrency] = useState('USD_BCV');
  const [receiptImg, setReceiptImg] = useState<string>('');
  const [markAsDone, setMarkAsDone] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !type) return;

    if (editIndex !== null) {
      if (type === 'income') {
        const item = profile.incomes[editIndex];
        if (item && item.freq === 'one-time') {
           const key = `income_${item.id}_${item.date}`;
           setMarkAsDone(profile.overrides?.[key]?.done ?? true);
        }
        if (item) {
          setName(item.name);
          setAmount(item.amount);
          setFreq(item.freq);
          setDay(item.day || 1);
          setDate(item.date || todayStr());
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
          setAmount(item.amount);
          setFreq(item.freq);
          setDay(item.day || 1);
          setDate(item.date || todayStr());
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
          setDebtType(item.type);
          setBalance(item.balance);
          setAmount(item.amount || item.minPay || '');
          setInstallments(item.installments || '');
          setCurrency(item.currency || 'USD_BCV');
          setCutDay(item.cutDay || 5);
          setDueDay(item.dueDay || '15-30');
          setApr(item.apr || '');
          setFreq(item.freq || 'monthly');
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
  }, [isOpen, type, editIndex, forceOneTime, profile]);

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

    if (!name || !numAmt) {
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
          desc,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          currency: currency as any,
          receiptImg: receiptImg || undefined,
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
          desc,
          category: category || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          currency: currency as any,
          receiptImg: receiptImg || undefined,
        };

        if (editIndex !== null) draft.expenses[editIndex] = item;
        else draft.expenses.push(item);
        
        if (finalFreq === 'one-time') {
           draft.overrides = draft.overrides || {};
           const key = `expense_${item.id}_${date}`;
           draft.overrides[key] = { ...(draft.overrides[key] || {}), done: markAsDone };
        }
      } else if (type === 'debt') {
        const finalDueDay = freq === 'biweekly' ? dueDay : (dueDay || day);
        
        let calculatedAmount = numAmt;
        const bal = parseFloat(String(balance)) || numAmt;
        const inst = parseInt(String(installments), 10) || 1;
        
        if (calculatedAmount === 0 && bal > 0) {
            const hasInt = debtType === 'loan_interest' || debtType === 'card' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
            if (hasInt && parseFloat(String(apr) || '0') > 0) {
                const r = (parseFloat(String(apr)) / 100) / 12;
                calculatedAmount = bal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
            } else {
                calculatedAmount = bal / inst;
            }
        }

        const item: DebtItem = {
          id: editIndex !== null ? draft.debts[editIndex].id : `debt_${Date.now()}`,
          name,
          type: debtType,
          balance: parseFloat(String(balance)) || numAmt,
          amount: calculatedAmount,
          minPay: calculatedAmount,
          installments: parseInt(String(installments), 10) || 1,
          start: date,
          currency: currency as any,
          cutDay: debtType === 'card' ? parseInt(String(cutDay), 10) || 5 : undefined,
          dueDay: finalDueDay,
          freq: debtType === 'card' ? 'monthly' : freq,
          apr: apr ? parseFloat(String(apr)) : undefined,
          hasInterest: (debtType === 'loan_interest' || debtType === 'card' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) ? true : false,
        };

        if (editIndex !== null) draft.debts[editIndex] = item;
        else draft.debts.push(item);
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
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {editIndex !== null ? 'Editar Registro' : 'Nuevo Registro'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
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
                <div>
                  <label className="text-xs font-bold text-slate-500 block">Concepto / Vendedor</label>
                  <input
                    type="text" required value={savPerson} onChange={e => setSavPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
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
                             setInstallments(1);
                          } else {
                             const customDef = profile.settings.customDebts?.find(d => d.id === selected);
                             if (customDef) {
                                setFreq(customDef.freq as any || 'monthly');
                                setDueDay(customDef.dueDay || '1');
                             } else {
                                setFreq('monthly');
                             }
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 font-bold"
                      >
                        <option value="" disabled>Seleccione...</option>
                        <option value="card">💳 Tarjeta de Crédito</option>
                        <option value="loan_interest">🏦 Préstamo con Interés</option>
                        <option value="loan_no_interest">🤝 Préstamo sin Interés</option>
                        {profile.settings.customDebts && profile.settings.customDebts.map(cd => (
                           <option key={cd.id} value={cd.id}>✨ {cd.name}</option>
                        ))}
                      </select>
                    </div>

                    {debtType === '' ? null : debtType === 'card' ? (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">💳 Configuración Tarjeta de Crédito</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Día de Corte</label>
                            <input
                              type="number" min="1" max="31" required value={cutDay} onChange={e => setCutDay(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Día de Cobro</label>
                            <input
                              type="number" min="1" max="31" required value={dueDay} onChange={e => setDueDay(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Monto Total</label>
                            <input
                              type="number" required value={balance} onChange={e => setBalance(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Cuotas (Meses)</label>
                            <input
                              type="number" min="1" required value={installments} onChange={e => setInstallments(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Tasa APR (%)</label>
                            <input
                              type="number" step="any" min="0" value={apr} onChange={e => setApr(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-amber-100/50 dark:bg-amber-900/40 rounded-xl text-[10px] font-bold text-amber-900 dark:text-amber-200 text-center">
                              {(() => {
                                 const bal = parseFloat(String(balance) || '0');
                                 const inst = parseInt(String(installments) || '1');
                                 let pmt = bal / inst;
                                 if (parseFloat(String(apr) || '0') > 0) {
                                    const r = (parseFloat(String(apr)) / 100) / 12;
                                    pmt = bal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
                                 }
                                 return (
                                   <div className="flex justify-between items-center px-2">
                                     <span>Cuota mensual: {formatCurrency(pmt)}</span>
                                     <span className="opacity-70">Total pagado: {formatCurrency(pmt * inst)}</span>
                                   </div>
                                 );
                              })()}
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Monto Total</label>
                            <input
                              type="number" required value={balance} onChange={e => setBalance(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día de Pago</label>
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
                                <option value="1-15">1 y 15</option>
                              </select>
                            ) : freq === 'triweekly' ? (
                              <select
                                value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              >
                                <option value="1">Semana 1</option>
                                <option value="2">Semana 2</option>
                                <option value="3">Semana 3</option>
                                <option value="4">Semana 4</option>
                              </select>
                            ) : (
                              <input
                                type="number" min="1" max="31" required value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                              />
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
                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">
                              {(() => {
                                 const bal = parseFloat(String(balance) || '0');
                                 const inst = parseInt(String(installments) || '1');
                                 const hasInt = debtType === 'loan_interest' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
                                 let pmt = bal / inst;
                                 if (hasInt && parseFloat(String(apr) || '0') > 0) {
                                    // standard amortization: r = annual rate / 12
                                    const r = (parseFloat(String(apr)) / 100) / 12;
                                    if (r > 0) {
                                      pmt = bal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
                                    }
                                 }
                                 return (
                                   <div className="flex justify-between items-center px-2">
                                     <span>Cuota mensual: {formatCurrency(pmt)}</span>
                                     <span className="opacity-70">Total a pagar: {formatCurrency(pmt * inst)}</span>
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
                            value={freq} onChange={e => setFreq(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          >
                            <option value="monthly">Mensual</option>
                            <option value="biweekly">Quincenal</option>
                            <option value="weekly">Semanal</option>
                          </select>
                        </div>
                        {freq === 'monthly' && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 block">Día</label>
                            <input
                              type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
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
