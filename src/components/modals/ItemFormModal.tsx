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
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [currency, setCurrency] = useState('USD_BCV');
  const [receiptImg, setReceiptImg] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !type) return;

    if (editIndex !== null) {
      if (type === 'income') {
        const item = profile.incomes[editIndex];
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
          setFreq(item.freq || (item.type === 'cashea' || item.type === 'quoota' ? 'biweekly' : 'monthly'));
          setDate(item.start || todayStr());
        }
      } else if (type === 'saving') {
        const item = profile.savingsList[editIndex];
        if (item) {
          setSavPerson(item.person);
          setAmount(item.amount);
          setDate(item.date);
          setSavType(item.savType);
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
      setDebtType('fixed');
      setBalance('');
      setInstallments('');
      setCutDay(5);
      setDueDay('15-30');
      setApr('');
      setSavPerson('');
      setSavType('physical');
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
          delivered: true,
          status: 'completed',
          savType,
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
        };

        if (editIndex !== null) draft.incomes[editIndex] = item;
        else draft.incomes.push(item);
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
        };

        if (editIndex !== null) draft.expenses[editIndex] = item;
        else draft.expenses.push(item);
      } else if (type === 'debt') {
        const finalDueDay = freq === 'biweekly' ? dueDay : (dueDay || day);
        const item: DebtItem = {
          id: editIndex !== null ? draft.debts[editIndex].id : `debt_${Date.now()}`,
          name,
          type: debtType,
          balance: parseFloat(String(balance)) || numAmt,
          amount: numAmt,
          minPay: numAmt,
          installments: parseInt(String(installments), 10) || 1,
          start: date,
          currency: currency as any,
          cutDay: debtType === 'card' ? parseInt(String(cutDay), 10) || 5 : undefined,
          dueDay: finalDueDay,
          freq: debtType === 'card' ? 'monthly' : freq,
          apr: apr ? parseFloat(String(apr)) : undefined,
        };

        if (editIndex !== null) draft.debts[editIndex] = item;
        else draft.debts.push(item);
      } else if (type === 'saving') {
        const item = {
          id: editIndex !== null ? draft.savingsList[editIndex].id : `sav_${Date.now()}`,
          person: savPerson,
          amount: numAmt,
          date,
          delivered: false,
          status: 'completed' as const,
          savType,
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {editIndex !== null ? 'Editar Registro' : 'Nuevo Registro'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {type === 'saving' ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500">Concepto / Vendedor</label>
                <input
                  type="text"
                  required
                  value={savPerson}
                  onChange={e => setSavPerson(e.target.value)}
                  placeholder="Ej. Cambio de efectivo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Monto</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Ej. 100"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Moneda</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value="USD_BCV">USD (BCV)</option>
                    <option value="USDT">USDT</option>
                    <option value="EUR_BCV">EUR (BCV)</option>
                    <option value="BS">Bs.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Modalidad</label>
                <select
                  value={savType}
                  onChange={e => setSavType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="physical">💵 Efectivo (Físico)</option>
                  <option value="digital">🌐 Digital (Plataforma)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Comprobante de Pago / Compra (Imagen)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { Camera: CapCamera, CameraResultType, CameraSource } = await import('@capacitor/camera');
                        const image = await CapCamera.getPhoto({
                          quality: 80,
                          allowEditing: false,
                          resultType: CameraResultType.DataUrl,
                          source: CameraSource.Camera,
                          promptLabelHeader: 'Tomar Foto',
                          promptLabelPhoto: 'De la Galería',
                          promptLabelPicture: 'Tomar Foto'
                        });
                        if (image.dataUrl) {
                          setReceiptImg(image.dataUrl);
                        }
                      } catch (err) {
                        console.error('Error tomando foto:', err);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <span className="text-base">📸</span>
                    <span>Tomar Foto</span>
                  </button>
                  <label className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5">
                    <span className="text-base">🖼️</span>
                    <span>Galería</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setReceiptImg(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {receiptImg && (
                    <div className="relative group shrink-0">
                      <img src={receiptImg} alt="Comprobante" className="w-10 h-10 object-cover rounded-lg border border-slate-300" />
                      <button
                        type="button"
                        onClick={() => setReceiptImg('')}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500">Nombre / Concepto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Salario, Alquiler..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">Monto</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Ej. 50"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Moneda</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value="USD_BCV">USD (BCV)</option>
                    <option value="USDT">USDT</option>
                    <option value="EUR_BCV">EUR (BCV)</option>
                    <option value="BS">Bs.</option>
                  </select>
                </div>
              </div>

              {(type === 'expense' || type === 'income') && (
                <div>
                  <label className="text-xs font-bold text-slate-500">Etiquetas (Opcional, separadas por coma)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="Ej. urgente, casa, personal"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {type === 'expense' && (
                <div>
                  <label className="text-xs font-bold text-slate-500">Categoría (Opcional)</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Ej. Comida, Transporte..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {type === 'debt' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Tipo de Deuda</label>
                    <select
                      value={debtType}
                      onChange={e => {
                        const selected = e.target.value;
                        setDebtType(selected);
                        if (selected === 'cashea' || selected === 'quoota') {
                          setFreq('biweekly');
                        } else if (selected === 'card') {
                          setFreq('monthly');
                        } else {
                          const customDef = (profile.settings.customDebts || []).find(cd => cd.id === selected);
                          if (customDef && customDef.freq) {
                            setFreq(customDef.freq as any);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="card">💳 Tarjeta de Crédito</option>
                      <option value="fixed">🏦 Préstamo Bancario / Fijo</option>
                      <option value="noloan">🤝 Deuda Personal / Sin Interés</option>
                      <option value="cashea">⭐ Cashea (Quincenal)</option>
                      <option value="quoota">⭐ Quoota (Quincenal)</option>
                      {(profile.settings.customDebts || []).map(cd => (
                        <option key={cd.id} value={cd.id}>⭐ {cd.name}</option>
                      ))}
                    </select>
                    {(() => {
                      const customDef = (profile.settings.customDebts || []).find(cd => cd.id === debtType);
                      if (!customDef) return null;
                      return (
                        <div className="mt-1.5 p-2 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-[11px] text-indigo-900 dark:text-indigo-200">
                          <span className="font-bold flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: customDef.color || '#6366f1' }} />
                            {customDef.name}
                          </span>
                          <span className="text-[10px] opacity-80">
                            {customDef.freq === 'weekly' ? 'Semanal' : customDef.freq === 'biweekly' ? 'Quincenal' : 'Mensual'} • {customDef.hasInterest ? 'Con interés' : 'Sin interés'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {debtType === 'card' ? (
                    <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">💳 Configuración Tarjeta de Crédito</span>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Día de Corte</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            required
                            value={cutDay}
                            onChange={e => setCutDay(e.target.value)}
                            placeholder="Ej. 5"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Día Límite de Pago</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            required
                            value={dueDay}
                            onChange={e => setDueDay(e.target.value)}
                            placeholder="Ej. 25"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Uso / Deuda Actual</label>
                          <input
                            type="number"
                            required
                            value={balance}
                            onChange={e => setBalance(e.target.value)}
                            placeholder="Ej. 150"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Pago Mínimo Cuota</label>
                          <input
                            type="number"
                            required
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Ej. 15"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-500 block">Saldo Total Adeudado</label>
                          <input
                            type="number"
                            required
                            value={balance}
                            onChange={e => setBalance(e.target.value)}
                            placeholder="Ej. 300"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 block">Monto por Cuota</label>
                          <input
                            type="number"
                            required
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Ej. 50"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block">Periodicidad / Frecuencia</label>
                        <select
                          value={freq}
                          onChange={e => setFreq(e.target.value as FrequencyType)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                        >
                          <option value="monthly">Mensual</option>
                          <option value="biweekly">Quincenal</option>
                          <option value="weekly">Semanal</option>
                          <option value="triweekly">Trisemanal (3 Semanas)</option>
                        </select>
                      </div>

                      {freq === 'biweekly' && (
                        <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1">
                          <label className="text-[11px] font-bold text-blue-900 dark:text-blue-200 block">Esquema Quincenal de Cobro</label>
                          <select
                            value={dueDay}
                            onChange={e => setDueDay(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          >
                            <option value="15-30">Días 15 y 30 (Fin de Mes)</option>
                            <option value="13-26">Días 13 y 26</option>
                            <option value="14-28">Días 14 y 28</option>
                          </select>
                        </div>
                      )}

                      {freq === 'monthly' && (
                        <div>
                          <label className="text-xs font-bold text-slate-500 block">Día de Vencimiento / Cobro (1-31)</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={dueDay}
                            onChange={e => setDueDay(e.target.value)}
                            placeholder="Ej. 15"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-500 block">Número de Cuotas</label>
                          <input
                            type="number"
                            value={installments}
                            onChange={e => setInstallments(e.target.value)}
                            placeholder="Ej. 6"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 block">Fecha de Inicio</label>
                          <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                !forceOneTime && (
                  <div>
                    <label className="text-xs font-bold text-slate-500">Frecuencia</label>
                    <select
                      value={freq}
                      onChange={e => setFreq(e.target.value as FrequencyType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value="one-time">Una vez</option>
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quincenal (15 y 30)</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>
                )
              )}

              {(freq === 'one-time' || forceOneTime) && (
                <div>
                  <label className="text-xs font-bold text-slate-500">Fecha</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3">
            {editIndex !== null && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
