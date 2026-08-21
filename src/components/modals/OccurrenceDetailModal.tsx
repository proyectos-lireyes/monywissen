import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateStr, todayStr, calculateProjections } from '../../utils/financialEngine';
import { X, CheckCircle2, RotateCcw, Calendar as CalendarIcon, ArrowRightLeft, CreditCard, Pencil, Trash2, Check } from 'lucide-react';

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

  // Find target item and its details
  let targetItem: any = null;
  let itemTitle = 'Movimiento Planificado';
  let baseAmount = 0;
  let itemCurrency = 'USD_BCV';

  if (profile && type && refId) {
    if (type === 'income') {
      targetItem = (profile.incomes || []).find(i => i.id === refId);
      if (targetItem) {
        itemTitle = targetItem.name;
        baseAmount = parseFloat(targetItem.amount || 0);
        itemCurrency = targetItem.currency || 'USD_BCV';
      }
    } else if (type === 'expense') {
      targetItem = (profile.expenses || []).find(e => e.id === refId);
      if (targetItem) {
        itemTitle = targetItem.name;
        baseAmount = parseFloat(targetItem.amount || 0);
        itemCurrency = targetItem.currency || 'USD_BCV';
      }
    } else if (type === 'debt' || type === 'debt_cut' ) {
      targetItem = (profile.debts || []).find(d => d.id === refId);
      if (targetItem) {
        itemTitle = targetItem.name;
        baseAmount = parseFloat(targetItem.minPay || targetItem.amount || targetItem.balance || 0);
        itemCurrency = targetItem.currency || 'USD_BCV';
      }
    } else if (type === 'savings') {
      targetItem = (profile.savingsList || []).find(s => s.id === refId);
      if (targetItem) {
        itemTitle = `Ahorro: ${targetItem.person}`;
        baseAmount = parseFloat(targetItem.amount || 0);
        itemCurrency = targetItem.currency || 'USD_BCV';
      } else if (refId?.startsWith('autosave_')) {
        const plan = calculateProjections(profile, exchangeRates);
        const occurrence = plan.find(p => p.ref.id === refId && p.type === 'savings' && p.originalDate === originalDate);
        if (occurrence) {
           itemTitle = occurrence.label || 'Ahorro Automático';
           baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
           itemCurrency = 'USD_BCV';
        }
      }
    } else if (type === 'income' && refId?.startsWith('autowithdraw_')) {
      const plan = calculateProjections(profile, exchangeRates);
      const occurrence = plan.find(p => p.ref.id === refId && p.type === 'income' && p.originalDate === originalDate);
      if (occurrence) {
         itemTitle = occurrence.label || 'Rescate de Ahorros';
         baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
         itemCurrency = 'USD_BCV';
      }
    } else if (type === 'compensation') {
      const plan = calculateProjections(profile, exchangeRates);
      const occurrence = plan.find(p => p.type === 'compensation' && p.originalDate === originalDate);
      if (occurrence) {
         itemTitle = occurrence.label;
         baseAmount = Math.abs(occurrence.plannedAmt || occurrence.amt || 0);
         itemCurrency = 'USD_BCV';
      }
    }
  }

  // Calculate base USD amount
  const plannedUsdAmount = convertAmount(baseAmount, itemCurrency);

  const key = `${type}_${refId}_${originalDate}`;
  const overrides = profile.overrides || {};
  const overrideRecord = overrides[key] || {};
  const isDone = !!overrideRecord.done;

  // Calculate sum of partial payments in USD
  const partialsSum = (overrideRecord.partials || []).reduce(
    (sum: number, pt: any) => sum + (parseFloat(pt.amt) || 0),
    0
  );

  const remainingUsd = Math.max(0, plannedUsdAmount - partialsSum);

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

  const handleMarkDone = () => {
    const finalAmountUsd = showCustomPay ? convertedPayUsd : remainingUsd;

    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      draft.overrides[key] = {
        ...draft.overrides[key],
        done: true,
        actualDate: actualDate,
        amt: finalAmountUsd,
        payCurrency,
        rawPayAmount: numericInput,
      };
    });

    const currLabel = payCurrency === 'BS' ? 'Bs' : (payCurrency === 'EUR_BCV' ? '€' : '$');
    showToast(`Pagado (${currLabel} ${numericInput.toLocaleString()}) → $${finalAmountUsd.toFixed(2)} USD`, '✅');
    onClose();
  };

  const handleDiscard = () => {
    
    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      draft.overrides[key] = {
        ...draft.overrides[key],
        discarded: true
      };
    });
    showToast('Movimiento descartado', '🗑️');
    onClose();
  };

  const handlePostpone = () => {
    if (!postponeDate) return;
    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      draft.overrides[key] = {
        ...draft.overrides[key],
        actualDate: postponeDate,
        done: false,
        userPostponed: true,
      };
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
      const current = draft.overrides[key] || {};
      current.partials = current.partials || [];
      current.partials.push({
        date: todayStr(),
        amt: usdVal,
        rawAmt: rawNum,
        currency: partialCurrency,
      });
      draft.overrides[key] = current;
    });

    setPartialAmt('');
    showToast(`Abono parcial de ${formatCurrency(usdVal)} registrado`, '💸');
  };

  const handleDeletePartial = (pIdx: number) => {
    updateProfileData(draft => {
      draft.overrides = draft.overrides || {};
      const current = draft.overrides[key] || {};
      if (current.partials) {
        current.partials.splice(pIdx, 1);
        if (current.partials.length === 0 && !current.done && !current.userPostponed) {
          delete draft.overrides[key];
        } else {
          draft.overrides[key] = current;
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
      const current = draft.overrides[key] || {};
      if (current.partials && current.partials[pIdx]) {
        current.partials[pIdx] = {
          ...current.partials[pIdx],
          amt: usdVal,
          rawAmt: rawNum,
          currency: editingPartialCurrency,
        };
        draft.overrides[key] = current;
      }
    });

    setEditingPartialIdx(null);
    showToast('Abono parcial actualizado', '✏️');
  };

  const handleUndoDone = () => {
    updateProfileData(draft => {
      if (draft.overrides && draft.overrides[key]) {
        delete draft.overrides[key];
      }
    });
    showToast('Pago revertido', '🔄');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {type === 'income' ? '📈 Ingreso' : (type === 'debt' ? '💳 Cuota / Deuda' : '📉 Gasto / Pago')}
            </span>
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
              <p className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {formatCurrency(plannedUsdAmount)}
              </p>
              {itemCurrency === 'BS' && (
                <p className="text-[10px] text-slate-500 font-semibold">
                  ({baseAmount.toLocaleString()} Bs)
                </p>
              )}
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Fecha Prevista</span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {formatDateStr(originalDate)}
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

          {/* Pending remaining summary */}
          <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs">
            <span className="font-bold text-blue-900 dark:text-blue-200">
              {partialsSum > 0 ? 'Saldo Restante Owed:' : 'Total a Pagar:'}
            </span>
            <span className="font-black text-blue-700 dark:text-blue-300 text-sm">
              {formatCurrency(remainingUsd)}
            </span>
          </div>
        </div>

        {/* History of Partial Abonos */}
        {overrideRecord.partials && overrideRecord.partials.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Abonos Parciales Registrados</span>
            {overrideRecord.partials.map((pt: any, pIdx: number) => {
              const isEditingThis = editingPartialIdx === pIdx;
              const currLabel = pt.currency === 'BS' ? 'Bs' : (pt.currency === 'EUR_BCV' ? '€' : (pt.currency === 'USDT' ? 'USDT' : '$'));

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
                        className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        title="Guardar"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingPartialIdx(null)}
                        className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-500 font-medium block text-[10px]">{formatDateStr(pt.date)}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-emerald-600 text-xs">{formatCurrency(pt.amt)}</span>
                          {pt.rawAmt && pt.currency !== 'USD_BCV' && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({pt.rawAmt.toLocaleString()} {currLabel})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditPartial(pIdx, pt)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                          title="Editar abono"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePartial(pIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
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
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-center space-y-2">
            <p className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">
              ✅ Marcado como Pagado el {formatDateStr(overrideRecord.actualDate || originalDate)}
            </p>
            {overrideRecord.amt !== undefined && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Monto Registrado: <b>{formatCurrency(overrideRecord.amt)}</b>
              </p>
            )}
            <button
              onClick={handleUndoDone}
              className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Revertir Estado a Pendiente
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {/* Custom currency / amount toggle */}
            {!showCustomPay ? (
              <div className="space-y-2">
                <button
                  onClick={handleMarkDone}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Marcar Completo ({formatCurrency(remainingUsd)})
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
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-colors"
                >
                  Confirmar Pago ({formatCurrency(convertedPayUsd)})
                </button>
              </div>
            )}

            {/* Abono Parcial */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200/60 dark:border-slate-700/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Registrar Abono Parcial</span>
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

