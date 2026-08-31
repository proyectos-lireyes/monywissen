import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Confetti } from '../shared/Confetti';
import { formatCurrency, getRemainingDebtAmount, getDebtTotalPaid } from '../../utils/financialEngine';
import { Plus, Building2, Edit2, ShieldAlert, Sparkles, Download, Layers, Trash2 } from 'lucide-react';

interface DebtsViewProps {
  onOpenCreate: (type: 'debt') => void;
  onOpenEdit: (type: 'debt', index: number) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({ onOpenCreate, onOpenEdit }) => {
  const { profile, updateProfileData, showToast, convertAmount, exchangeRates } = useApp();

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
  const [subTab, setSubTab] = useState<'active' | 'settled' | 'types' | 'strategy'>('active');
  const [strategyMode, setStrategyMode] = useState<'snowball' | 'avalanche'>('snowball');
  const [sortOption, setSortOption] = useState<'name' | 'total' | 'remaining' | 'paid' | 'type'>('remaining');
  const [showCustomDebtModal, setShowCustomDebtModal] = useState(false);
  const [editingCustomDebt, setEditingCustomDebt] = useState<any>(null);
  const [customDebtForm, setCustomDebtForm] = useState({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', limitCurrency: 'USD_BCV', isCreditCard: false });
  const [showFormCutGrid, setShowFormCutGrid] = useState(false);
  const [showFormDueGrid, setShowFormDueGrid] = useState(false);
  const [showCloudTemplatesModal, setShowCloudTemplatesModal] = useState(false);
  const [cloudTemplates, setCloudTemplates] = useState<any[]>([]);
  const [isSearchingTemplates, setIsSearchingTemplates] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  const fetchTemplates = async () => {
    setIsSearchingTemplates(true);
    try {
      const res = await fetch(`/api/debt-templates?q=${templateSearchQuery}`);
      const data = await res.json();
      if (data.success) {
        setCloudTemplates(data.templates);
      }
    } catch (e) {
      showToast("Error al buscar plantillas", "❌");
    } finally {
      setIsSearchingTemplates(false);
    }
  };

  const handleDownloadTemplate = (template: any) => {
    updateProfileData(draft => {
      draft.settings.customDebts = draft.settings.customDebts || [];
      if (!draft.settings.customDebts.find(c => c.name.toLowerCase() === template.name.toLowerCase())) {
        draft.settings.customDebts.push({
          id: `custom_${Date.now()}`,
          name: template.name,
          freq: template.freq,
          dueDay: template.dueDay || '1',
          hasInterest: template.hasInterest,
          usePlan: template.usePlan,
          color: template.color
        });
      }
    });
    showToast(`Plantilla "${template.name}" descargada`, "✅");
    setShowCloudTemplatesModal(false);
  };

  const handlePublishCustomDebt = async (cd: any) => {
    try {
      const res = await fetch('/api/debt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cd.name,
          freq: cd.freq,
          hasInterest: cd.hasInterest,
          usePlan: cd.usePlan,
          color: cd.color,
          authorAlias: profile.settings.myAlias || 'Usuario Monywissen'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Modelo "${cd.name}" publicado en MonyStore 🌐`, '🚀');
      } else {
        showToast(data.error || 'Error al publicar', '❌');
      }
    } catch (e) {
      showToast('Error al conectar con MonyStore', '❌');
    }
  };

  const debts = profile.debts || [];
  const overrides = profile.overrides || {};

  const planStart = profile.settings.planStart || '2020-01-01';
  const planEnd = profile.settings.planEnd || '2099-12-31';

  let baseActiveDebts = debts.filter(d => getRemainingDebtAmount(d, overrides, exchangeRates) > 0.01);
  let baseSettledDebts = debts.filter(d => {
    if (getRemainingDebtAmount(d, overrides, exchangeRates) > 0.01) return false;
    
    if (d.start >= planStart && d.start <= planEnd) return true;

    let hasPaymentInWindow = false;
    for (const key of Object.keys(overrides)) {
       if (key.startsWith(`debt_${d.id}_`)) {
          const ov = overrides[key];
          if (ov.done || (ov.partials && ov.partials.length > 0)) {
             const paymentDate = ov.actualDate || key.split('_').pop();
             if (paymentDate && paymentDate >= planStart && paymentDate <= planEnd) {
                 hasPaymentInWindow = true;
                 break;
             }
             if (ov.partials) {
                for (const pt of ov.partials) {
                   if (pt.date >= planStart && pt.date <= planEnd) {
                       hasPaymentInWindow = true;
                       break;
                   }
                }
             }
          }
       }
    }
    return hasPaymentInWindow;
  });

  const customDebts = profile.settings.customDebts || [];

  const applySort = (list: any[]) => {
    return [...list].sort((a, b) => {
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      if (sortOption === 'type') {
         const typeA = customDebts.find((c: any) => c.id === a.type)?.name || a.type;
         const typeB = customDebts.find((c: any) => c.id === b.type)?.name || b.type;
         return typeA.localeCompare(typeB);
      }
      
      const totalA = convertAmount(parseFloat(String(a.balance || 0)), a.currency);
      const totalB = convertAmount(parseFloat(String(b.balance || 0)), b.currency);
      if (sortOption === 'total') return totalB - totalA;

      const remA = convertAmount(getRemainingDebtAmount(a, overrides, exchangeRates), (a as any).currency);
      const remB = convertAmount(getRemainingDebtAmount(b, overrides, exchangeRates), (b as any).currency);
      if (sortOption === 'remaining') return remB - remA;
      
      const paidA = getDebtTotalPaid(a, overrides, exchangeRates);
      const paidB = getDebtTotalPaid(b, overrides, exchangeRates);
      const paidAConv = convertAmount(paidA, (a as any).currency);
      const paidBConv = convertAmount(paidB, (b as any).currency);
      if (sortOption === 'paid') return paidBConv - paidAConv;
      
      return 0;
    });
  };

  const activeDebts = applySort(baseActiveDebts);
  const settledDebts = applySort(baseSettledDebts);

  const totalOriginalActive = activeDebts.reduce((sum, d) => sum + convertAmount(parseFloat(String(d.balance || 0)), d.currency), 0);
  const totalRemainingActive = activeDebts.reduce((sum, d) => sum + convertAmount(getRemainingDebtAmount(d, overrides, exchangeRates), d.currency), 0);
  const totalPaidActive = Math.max(0, totalOriginalActive - totalRemainingActive);
  const overallProgressPercent = totalOriginalActive > 0 ? Math.min(100, Math.round((totalPaidActive / totalOriginalActive) * 100)) : 0;

  const orderedDebts = [...activeDebts].sort((a, b) => {
    const balanceA = convertAmount(getRemainingDebtAmount(a, overrides, exchangeRates), (a as any).currency);
    const balanceB = convertAmount(getRemainingDebtAmount(b, overrides, exchangeRates), (b as any).currency);
    if (strategyMode === 'snowball') {
      return balanceA - balanceB; // Lowest balance first
    } else {
      // Avalanche: Highest interest rate first
      const aprA = a.apr || (a.hasInterest ? 20 : 0);
      const aprB = b.apr || (b.hasInterest ? 20 : 0);
      return aprB - aprA;
    }
  });

  const handleAddCustomDebt = () => {
    setEditingCustomDebt(null);
    setCustomDebtForm({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', limitCurrency: 'USD_BCV', isCreditCard: false });
    setShowCustomDebtModal(true);
  };

  const handleEditCustomDebt = (id: string, currentData: any) => {
    setEditingCustomDebt(id);
    setCustomDebtForm({ ...currentData });
    setShowCustomDebtModal(true);
  };

  const saveCustomDebt = () => {
    if (!customDebtForm.name.trim()) return;

    updateProfileData(draft => {
      draft.settings.customDebts = draft.settings.customDebts || [];
      if (editingCustomDebt) {
        const idx = draft.settings.customDebts.findIndex(d => d.id === editingCustomDebt);
        if (idx !== -1) {
          draft.settings.customDebts[idx] = { ...draft.settings.customDebts[idx], ...customDebtForm };
        }
      } else {
        draft.settings.customDebts.push({
          id: customDebtForm.isCreditCard ? `tdc_${Date.now()}` : `custom_${Date.now()}`,
          ...customDebtForm
        });
      }
    });

    showToast(`Tipo de deuda ${editingCustomDebt ? 'actualizado' : 'agregado'}`, '⭐');
    setShowCustomDebtModal(false);
  };

  const handleDeleteCustomDebt = (id: string) => {
    

    updateProfileData(draft => {
      if (draft.settings.customDebts) {
        draft.settings.customDebts = draft.settings.customDebts.filter(d => d.id !== id);
      }
    });
    showToast(`Tipo de deuda eliminado`, '🗑️');
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Gestión de Deudas
            </h2>
            <p className="text-xs text-slate-400">
              Tarjetas de crédito, financiamientos y préstamos.
            </p>
          </div>
          <button
            onClick={() => onOpenCreate('debt')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva Deuda
          </button>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => setSubTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'active'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🟢 Activas ({activeDebts.length})
          </button>
          <button
            onClick={() => setSubTab('settled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'settled'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            ✅ Saldadas ({settledDebts.length})
          </button>

          <button
            onClick={() => setSubTab('types')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'types'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🏷️ Tipos ({customDebts.length})
          </button>
          <button
            onClick={() => setSubTab('strategy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'strategy'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            💡 Estrategia
          </button>
        </div>

        {(subTab === 'active' || subTab === 'settled') && (
          <div className="flex items-center justify-end px-1 mb-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-500 dark:text-slate-400 outline-none cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <option value="remaining">Ordenar: Mayor Deuda</option>
              <option value="total">Ordenar: Deuda Total</option>
              <option value="paid">Ordenar: Más Pagado</option>
              <option value="name">Ordenar: Por Nombre</option>
              <option value="type">Ordenar: Por Tipo</option>
            </select>
          </div>
        )}

        {subTab === 'active' ? (
          activeDebts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No tienes deudas activas registradas. ¡Excelente!
            </p>
          ) : (
            <div className="space-y-3">
              {/* Overall Debt Summary Header */}
              <div className="p-3.5 bg-slate-900 text-white dark:bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Resumen de Deudas Activas</span>
                  <span className="text-emerald-400">{overallProgressPercent}% amortizado</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${overallProgressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-center">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Total Inicial</p>
                    <p className="text-xs font-black text-slate-100">{formatCurrency(totalOriginalActive)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-emerald-400">He Pagado</p>
                    <p className="text-xs font-black text-emerald-400">{formatCurrency(totalPaidActive)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-rose-400">Me Falta</p>
                    <p className="text-xs font-black text-rose-400">{formatCurrency(totalRemainingActive)}</p>
                  </div>
                </div>
              </div>

              {/* Debt Cards */}
              {activeDebts.map(item => {
                const realIndex = debts.findIndex(d => d.id === item.id);
                
                const plan = calculateAmortizationPlan(item, overrides, profile.settings.customDebts || [], undefined, exchangeRates);
                const remaining = plan.reduce((acc, p) => acc + (p.requiredPay || 0), 0);
                const paid = getDebtTotalPaid(item, overrides, exchangeRates);
                const original = remaining + paid;
                const progressPct = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 0;
                const isCleared = progressPct === 100;
                const installmentsCount = plan.length;
                const monthlyInstallment = plan.length > 0 ? plan[0].expectedAmount : (item.amount || item.minPay || 0);

                return (
                  <div
                    key={item.id}
                    onClick={() => onOpenEdit('debt', realIndex)}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all space-y-2.5 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: item.color || '#f59e0b' }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                            {item.name}
                            {item.currency && item.currency !== 'USD_BCV' && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-bold">
                                {item.currency}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {item.type === 'card' ? '💳 Tarjeta de Crédito' : (item.type === 'loan_interest' ? '🏦 Préstamo con Interés' : '🤝 Préstamo sin Interés')}
                            {' • '}
                            {item.type === 'card' 
                              ? `Corte: día ${item.cutDay || 5} / Pago: día ${item.dueDay || 25}`
                              : (item.freq === 'biweekly' 
                                  ? `Quincenal (${item.dueDay || '15-30'})` 
                                  : (item.freq === 'weekly' 
                                      ? 'Semanal' 
                                      : (item.freq === 'triweekly' 
                                          ? 'Trisemanal' 
                                          : `Mensual (Día ${item.dueDay || 1})`)))}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Me falta</span>
                        <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                          {formatCurrencyExt(remaining, (item as any).currency)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar per item */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <span>Pagado: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrencyExt(paid, item.currency)}</strong></span>
                        <span>Total: <strong>{formatCurrencyExt(original, item.currency)}</strong></span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Installments info tag */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        🗓️ {installmentsCount > 1 ? `Plan de ${installmentsCount} cuotas` : 'Pago único / recurrente'}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        Cuota: {formatCurrencyExt(monthlyInstallment, (item as any).currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : subTab === 'settled' ? (
          settledDebts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No hay deudas saldadas en el historial.
            </p>
          ) : (
            <div className="space-y-2">
              {settledDebts.map(item => {
                const realIndex = debts.findIndex(d => d.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => onOpenEdit('debt', realIndex)}
                    className="p-3 bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-2xl flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-emerald-600">✅ Completada</p>
                    </div>
                    <span className="text-xs font-black text-emerald-700">
                      {formatCurrencyExt(item.balance, (item as any).currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        ) : subTab === 'types' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Modelos Personalizados de Deuda
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCloudTemplatesModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5"
                >
                  <span className="text-base">🌐</span> Explorar
                </button>
                <button
                  onClick={handleAddCustomDebt}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs"
                >
                  + Crear Tipo
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {customDebts.map(cd => (
                <div key={cd.id} onClick={() => handleEditCustomDebt(cd.id, cd)} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: cd.color }}
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {cd.name}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {cd.freq} • {cd.hasInterest ? 'Con interés' : 'Sin interés'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handlePublishCustomDebt(cd)} title="Publicar en MonyStore" className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2 py-1 rounded-lg font-medium hover:bg-indigo-100">🌐 Publicar</button>
                    </div></div>
              ))}
            </div>
          </div>
        ) : (
          /* Strategy View */
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-100">Calculadora de Estrategia de Pago</p>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300">
                  Descubre el orden óptimo para saldar tus deudas basado en el método Snowball o Avalancha. Todos los montos se muestran unificados a USD BCV para mejor comparación.
                </p>
              </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setStrategyMode('snowball')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  strategyMode === 'snowball'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                ⛄ Bola de Nieve (Menor saldo)
              </button>
              <button
                onClick={() => setStrategyMode('avalanche')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  strategyMode === 'avalanche'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                🏔️ Avalancha (Mayor interés)
              </button>
            </div>

            <div className="space-y-2">
              {orderedDebts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No hay deudas activas para calcular una estrategia.
                </p>
              ) : (
                orderedDebts.map((item, idx) => {
                  const remaining = getRemainingDebtAmount(item, overrides, exchangeRates);
                  const converted = convertAmount(remaining, (item as any).currency);
                  const apr = item.apr || (item.hasInterest ? 20 : 0);
                  
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: item.color || '#f59e0b' }} />
                      <div className="flex items-center gap-3 pl-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Interés: {apr}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs font-black text-rose-600">
                          {formatCurrency(converted)}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Monto Original: {formatCurrencyExt(remaining, item.currency)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {showCustomDebtModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl ">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {editingCustomDebt ? 'Editar Tipo de Deuda' : 'Nuevo Tipo de Deuda Personalizado'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configura o elige una plantilla de tipo de deuda común.
                </p>
              </div>
              <button onClick={() => setShowCustomDebtModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Presets Section */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  💡 Plantillas de Deudas Comunes (Selección Rápida):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {[
                    {
                      icon: '💳',
                      label: 'Tarjeta de Crédito',
                      desc: 'Pagos mensuales con cálculo de pago mínimo',
                      form: { name: 'Tarjeta de Crédito', freq: 'monthly', dueDay: '15', cutDay: '5', creditLimit: '', isCreditCard: true, hasInterest: true, usePlan: false, color: '#1a73e8' }
                    },
                    {
                      icon: '🏦',
                      label: 'Préstamo Bancario',
                      desc: 'Cuotas fijas mensuales con tasa de interés',
                      form: { name: 'Préstamo Bancario / Personal', freq: 'monthly', dueDay: '1', hasInterest: true, usePlan: true, color: '#d93025' }
                    },
                    {
                      icon: '⭐',
                      label: 'Financiamiento (BNPL)',
                      desc: 'Cuotas quincenales sin interés',
                      form: { name: 'Financiamiento (BNPL)', freq: 'biweekly', dueDay: '15-30', hasInterest: false, usePlan: true, color: '#fbbc04' }
                    },
                    {
                      icon: '🚗',
                      label: 'Crédito Vehicular',
                      desc: 'Financiamiento de automóvil o vivienda',
                      form: { name: 'Crédito Vehicular / Vivienda', freq: 'monthly', dueDay: '1', hasInterest: true, usePlan: true, color: '#0f9d58' }
                    },
                    {
                      icon: '🏬',
                      label: 'Casa Comercial',
                      desc: 'Daka, Multimax, Credidaka o tienda local',
                      form: { name: 'Casa Comercial / Tienda', freq: 'biweekly', dueDay: '15-30', hasInterest: false, usePlan: true, color: '#e65100' }
                    },
                    {
                      icon: '🤝',
                      label: 'Prestamista Informal',
                      desc: 'Cobros semanales o quincenales con intereses',
                      form: { name: 'Prestamista Particular', freq: 'weekly', dueDay: '1', hasInterest: true, usePlan: false, color: '#9c27b0' }
                    },
                    {
                      icon: '👥',
                      label: 'San / Bolso / Pandero',
                      desc: 'Ahorro o préstamo colaborativo entre conocidos',
                      form: { name: 'San / Bolso Familiar', freq: 'biweekly', dueDay: '15-30', hasInterest: false, usePlan: false, color: '#00acc1' }
                    },
                    {
                      icon: '🎓',
                      label: 'Crédito Educativo',
                      desc: 'Matrículas o financiamiento de estudios',
                      form: { name: 'Crédito Educativo', freq: 'monthly', dueDay: '1', hasInterest: false, usePlan: true, color: '#e91e63' }
                    }
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        setCustomDebtForm({ isCreditCard: false, cutDay: '5', creditLimit: '', ...preset.form });
                        showToast(`Plantilla "${preset.label}" seleccionada`, '⭐');
                      }}
                      className="p-2 text-left bg-white dark:bg-slate-800 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{preset.icon}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {preset.label}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 line-clamp-1">
                        {preset.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Details */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  ✏️ Detalles del Tipo de Deuda:
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Tipo</label>
                  <input
                    type="text"
                    value={customDebtForm.name}
                    onChange={e => setCustomDebtForm({...customDebtForm, name: e.target.value})}
                    placeholder="Ej. Prestamista, San, Financiamiento..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <label className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customDebtForm.isCreditCard}
                    onChange={e => {
                      const isCC = e.target.checked;
                      setCustomDebtForm({
                        ...customDebtForm, 
                        isCreditCard: isCC,
                        freq: isCC ? 'monthly' : customDebtForm.freq,
                        hasInterest: isCC ? true : customDebtForm.hasInterest,
                        usePlan: isCC ? true : customDebtForm.usePlan
                      });
                    }}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-600"
                  />
                  💳 Configurar como Tarjeta de Crédito (TDC)
                </label>

                {customDebtForm.isCreditCard && (
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2 relative">
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Día Corte</label>
                        <button
                          type="button"
                          onClick={() => { setShowFormCutGrid(!showFormCutGrid); setShowFormDueGrid(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 flex justify-between items-center"
                        >
                          <span>{customDebtForm.cutDay}</span>
                          <span className="text-[10px] text-slate-400">📅</span>
                        </button>
                        {showFormCutGrid && (
                          <div className="absolute top-full left-0 mt-1 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 w-[220px]">
                            <div className="grid grid-cols-6 gap-1">
                              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                <button
                                  key={`cut-${d}`} type="button"
                                  onClick={() => { setCustomDebtForm({...customDebtForm, cutDay: String(d)}); setShowFormCutGrid(false); }}
                                  className={`text-[10px] py-1 rounded-md font-bold ${customDebtForm.cutDay == String(d) ? 'bg-amber-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Día Pago</label>
                        <button
                          type="button"
                          onClick={() => { setShowFormDueGrid(!showFormDueGrid); setShowFormCutGrid(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 flex justify-between items-center"
                        >
                          <span>{customDebtForm.dueDay}</span>
                          <span className="text-[10px] text-slate-400">📅</span>
                        </button>
                        {showFormDueGrid && (
                          <div className="absolute top-full right-0 mt-1 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 w-[220px]">
                            <div className="grid grid-cols-6 gap-1">
                              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                <button
                                  key={`due-${d}`} type="button"
                                  onClick={() => { setCustomDebtForm({...customDebtForm, dueDay: String(d)}); setShowFormDueGrid(false); }}
                                  className={`text-[10px] py-1 rounded-md font-bold ${customDebtForm.dueDay == String(d) ? 'bg-amber-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Límite</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={customDebtForm.creditLimit}
                          onChange={e => setCustomDebtForm({...customDebtForm, creditLimit: e.target.value})}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Moneda Límite</label>
                        <select
                          value={customDebtForm.limitCurrency || 'USD_BCV'}
                          onChange={e => setCustomDebtForm({...customDebtForm, limitCurrency: e.target.value})}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                        >
                          <option value="USD_BCV">USD (BCV)</option>
                          <option value="EUR_BCV">EUR (BCV)</option>
                          <option value="USDT">USDT</option>
                          <option value="BS">Bs</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Frecuencia</label>
                    <select
                      value={customDebtForm.freq}
                      onChange={e => {
                        const newFreq = e.target.value;
                        setCustomDebtForm({...customDebtForm, freq: newFreq});
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quincenal</option>
                      <option value="monthly">Mensual</option>
                      <option value="triweekly">Trisemanal (3 Semanas)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">Opciones Inteligentes:</label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={customDebtForm.hasInterest}
                      onChange={e => setCustomDebtForm({...customDebtForm, hasInterest: e.target.checked})}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    Motor de Intereses (APR / Tasa de Interés)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={customDebtForm.usePlan}
                      onChange={e => setCustomDebtForm({...customDebtForm, usePlan: e.target.checked})}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    Fraccionar en Plan de Cuotas
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Color Identificador</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#d93025', '#e65100', '#fbbc04', '#0f9d58', '#00acc1', '#1a73e8', '#9c27b0', '#e91e63'].map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCustomDebtForm({...customDebtForm, color: col})}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${customDebtForm.color === col ? 'border-slate-900 dark:border-white scale-110 shadow-xs' : 'border-transparent'}`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomDebtModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              {editingCustomDebt && (
                <button
                   type="button"
                   onClick={(e) => {
                     e.stopPropagation();
                     handleDeleteCustomDebt(editingCustomDebt);
                     setShowCustomDebtModal(false);
                   }}
                   className="w-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors"
                   title="Eliminar"
                 >
                   <Trash2 className="w-5 h-5" />
                 </button>
              )}
              <button
                type="button"
                onClick={saveCustomDebt}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Guardar Tipo de Deuda
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloudTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                🌐 Plantillas en la Nube
              </h3>
              <button onClick={() => setShowCloudTemplatesModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-500">Busca modelos de deuda creados por la comunidad.</p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={templateSearchQuery}
                onChange={e => setTemplateSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchTemplates()}
                placeholder="Buscar por nombre..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
              <button
                onClick={fetchTemplates}
                disabled={isSearchingTemplates}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {isSearchingTemplates ? '...' : 'Buscar'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {cloudTemplates.length === 0 && !isSearchingTemplates ? (
                <div className="text-xs text-center py-6 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  No se encontraron plantillas.
                </div>
              ) : (
                cloudTemplates.map(template => (
                  <div key={template.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.color }} />
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{template.name}</span>
                        <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                          por {template.authorAlias || 'Anónimo'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {template.freq === 'weekly' ? 'Semanal' : template.freq === 'biweekly' ? 'Quincenal' : 'Mensual'}
                        {' • '}
                        {template.downloads || 0} descargas
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadTemplate(template)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Añadir
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
