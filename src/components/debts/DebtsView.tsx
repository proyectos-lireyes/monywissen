import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode } from '../../types';
import { Confetti } from '../shared/Confetti';
import { formatCurrency, formatDateStr, getRemainingDebtAmount, getDebtTotalPaid, calculateAmortizationPlan } from '../../utils/financialEngine';
import { publishDebtTemplateToFirestore, loadDebtTemplatesFromFirestore } from '../../utils/firebase';
import { Plus, Building2, ShieldAlert, Sparkles, Download, Layers, Trash2, Table as TableIcon, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';

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
  
  const [subTab, setSubTab] = useState<'active' | 'settled' | 'types' | 'strategy'>('active');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [tableSortColumn, setTableSortColumn] = useState<'name' | 'start' | 'freq' | 'total' | 'paid' | 'installment' | 'remaining'>('remaining');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [strategyMode, setStrategyMode] = useState<'snowball' | 'avalanche'>('snowball');
  const [sortOption, setSortOption] = useState<'name' | 'total' | 'remaining' | 'paid' | 'type'>('remaining');
  const [showCustomDebtModal, setShowCustomDebtModal] = useState(false);
  const [editingCustomDebt, setEditingCustomDebt] = useState<any>(null);
  const [customDebtForm, setCustomDebtForm] = useState<{ name: string; freq: string; hasInterest: boolean; usePlan: boolean; color: string; dueDay: string; cutDay: string; creditLimit: string; limitCurrency: string; isCreditCard: boolean; currency: CurrencyCode; }>({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', limitCurrency: 'USD_BCV', isCreditCard: false, currency: 'USD_BCV' });
  const [showFormCutGrid, setShowFormCutGrid] = useState(false);
  const [showFormDueGrid, setShowFormDueGrid] = useState(false);
  const [showCloudTemplatesModal, setShowCloudTemplatesModal] = useState(false);
  const [cloudTemplates, setCloudTemplates] = useState<any[]>([]);
  const [isSearchingTemplates, setIsSearchingTemplates] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTemplates = async () => {
    setIsSearchingTemplates(true);
    try {
      const templates = await loadDebtTemplatesFromFirestore();
      if (templateSearchQuery) {
        const queryLower = templateSearchQuery.toLowerCase();
        setCloudTemplates(templates.filter(t => t.name?.toLowerCase().includes(queryLower) || t.authorAlias?.toLowerCase().includes(queryLower)));
      } else {
        setCloudTemplates(templates);
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
          color: template.color,
          currency: template.currency || 'USD_BCV',
          limitCurrency: template.limitCurrency || 'USD_BCV',
          isCreditCard: !!template.isCreditCard,
          cutDay: template.cutDay || '5',
          creditLimit: template.creditLimit || ''
        });
      }
    });
    showToast(`Plantilla "${template.name}" descargada`, "✅");
    setShowCloudTemplatesModal(false);
  };

  const handlePublishCustomDebt = async (cd: any) => {
    try {
      const res = await publishDebtTemplateToFirestore({
        name: cd.name,
        freq: cd.freq,
        hasInterest: cd.hasInterest,
        usePlan: cd.usePlan,
        color: cd.color,
        currency: cd.currency || 'USD_BCV',
        limitCurrency: cd.limitCurrency || 'USD_BCV',
        isCreditCard: !!cd.isCreditCard,
        dueDay: cd.dueDay || '1',
        cutDay: cd.cutDay || '5',
        creditLimit: cd.creditLimit || '',
        authorAlias: profile.settings.myAlias || 'Usuario Monywissen'
      });
      if (res.success) {
        showToast(`Modelo "${cd.name}" publicado en MonyStore 🌐`, '🚀');
      } else {
        showToast(res.error || 'Error al publicar', '❌');
      }
    } catch (e) {
      showToast('Error al conectar con MonyStore', '❌');
    }
  };

  const debts = profile.debts || [];
  const overrides = profile.overrides || {};

  const planStart = profile.settings.planStart || '2020-01-01';
  const planEnd = profile.settings.planEnd || '2099-12-31';

  let filteredDebts = debts;
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    filteredDebts = filteredDebts.filter(d => d.name.toLowerCase().includes(q) || (d.type && d.type.toLowerCase().includes(q)));
  }
  if (typeFilter !== 'all') {
    filteredDebts = filteredDebts.filter(d => d.type === typeFilter);
  }

  let baseActiveDebts = filteredDebts.filter(d => getRemainingDebtAmount(d, overrides, exchangeRates) > 0.01);
  let baseSettledDebts = filteredDebts.filter(d => {
    if (getRemainingDebtAmount(d, overrides, exchangeRates) > 0.01) return false;
    
    if (d.start >= planStart && d.start <= planEnd) return true;

    let hasPaymentInWindow = false;
    for (const key of Object.keys(overrides)) {
       if (key.startsWith(`${d.id}_`) || key.startsWith(`debt_${d.id}_`)) {
          const ov = overrides[key];
          if (ov.done || (ov.partials && ov.partials.length > 0)) {
             const paymentDate = ov.actualDate || ov.date || (key.includes('cuota') ? '' : key.split('_').pop());
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

  const handleColumnHeaderClick = (col: 'name' | 'start' | 'freq' | 'total' | 'paid' | 'installment' | 'remaining') => {
    if (tableSortColumn === col) {
      setTableSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortColumn(col);
      setTableSortDir(col === 'name' || col === 'freq' || col === 'start' ? 'asc' : 'desc');
    }
    setSortOption(col === 'name' ? 'name' : (col === 'total' ? 'total' : (col === 'paid' ? 'paid' : (col === 'freq' ? 'type' : 'remaining'))));
  };

  const renderSortIcon = (col: 'name' | 'start' | 'freq' | 'total' | 'paid' | 'installment' | 'remaining') => {
    if (tableSortColumn !== col) {
      return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />;
    }
    return tableSortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-amber-600 dark:text-amber-400 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-600 dark:text-amber-400 font-bold" />
    );
  };

  const applySort = (list: any[]) => {
    return [...list].sort((a, b) => {
      let res = 0;
      if (tableSortColumn === 'name') {
        res = a.name.localeCompare(b.name);
      } else if (tableSortColumn === 'start') {
        const startA = a.start || '9999-12-31';
        const startB = b.start || '9999-12-31';
        res = startA.localeCompare(startB);
        if (res === 0) {
          res = a.name.localeCompare(b.name);
        }
      } else if (tableSortColumn === 'freq') {
        const freqA = a.type === 'card' ? `corte_${a.cutDay || 5}` : (a.freq || 'monthly');
        const freqB = b.type === 'card' ? `corte_${b.cutDay || 5}` : (b.freq || 'monthly');
        res = freqA.localeCompare(freqB);
      } else if (tableSortColumn === 'total') {
        const planA = calculateAmortizationPlan(a, overrides, customDebts, undefined, exchangeRates);
        const remA = planA.reduce((acc, p) => acc + (p.requiredPay || 0), 0);
        const paidA = getDebtTotalPaid(a, overrides, exchangeRates);
        const origA = convertAmount(remA + paidA, a.currency);

        const planB = calculateAmortizationPlan(b, overrides, customDebts, undefined, exchangeRates);
        const remB = planB.reduce((acc, p) => acc + (p.requiredPay || 0), 0);
        const paidB = getDebtTotalPaid(b, overrides, exchangeRates);
        const origB = convertAmount(remB + paidB, b.currency);

        res = origA - origB;
      } else if (tableSortColumn === 'paid') {
        const paidA = convertAmount(getDebtTotalPaid(a, overrides, exchangeRates), a.currency);
        const paidB = convertAmount(getDebtTotalPaid(b, overrides, exchangeRates), b.currency);
        res = paidA - paidB;
      } else if (tableSortColumn === 'installment') {
        const planA = calculateAmortizationPlan(a, overrides, customDebts, undefined, exchangeRates);
        const instA = convertAmount(planA.length > 0 ? planA[0].expectedAmount : (a.amount || a.minPay || 0), a.currency);

        const planB = calculateAmortizationPlan(b, overrides, customDebts, undefined, exchangeRates);
        const instB = convertAmount(planB.length > 0 ? planB[0].expectedAmount : (b.amount || b.minPay || 0), b.currency);

        res = instA - instB;
      } else if (tableSortColumn === 'remaining') {
        const remA = convertAmount(getRemainingDebtAmount(a, overrides, exchangeRates), a.currency);
        const remB = convertAmount(getRemainingDebtAmount(b, overrides, exchangeRates), b.currency);
        res = remA - remB;
      }

      return tableSortDir === 'asc' ? res : -res;
    });
  };

  const activeDebts = applySort(baseActiveDebts);
  const settledDebts = applySort(baseSettledDebts);

  let totalOriginalActive = 0;
  let totalRemainingActive = 0;
  let totalPaidActive = 0;

  activeDebts.forEach(d => {
    const plan = calculateAmortizationPlan(d, overrides, profile.settings.customDebts || [], undefined, exchangeRates);
    const rem = plan.reduce((acc, p) => acc + (p.requiredPay || 0), 0);
    const paid = getDebtTotalPaid(d, overrides, exchangeRates);
    totalOriginalActive += convertAmount(rem + paid, d.currency);
    totalRemainingActive += convertAmount(rem, d.currency);
    totalPaidActive += convertAmount(paid, d.currency);
  });

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
    setCustomDebtForm({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', limitCurrency: 'USD_BCV', isCreditCard: false, currency: 'USD_BCV' as CurrencyCode });
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
          <div className="flex items-center justify-between gap-2 px-1 mb-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-28 sm:w-40 text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:border-amber-500"
              />
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1">
                <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="card">💳 Tarjetas de Crédito</option>
                  <option value="loan_interest">🏦 Préstamos con Interés</option>
                  <option value="loan_no_interest">🤝 Préstamos sin Interés</option>
                  {customDebts.map((cd: any) => (
                    <option key={cd.id} value={cd.id}>🏷️ {cd.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Vista Tabla"
              >
                <TableIcon className="w-3.5 h-3.5" /> Tabla
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Vista Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Tarjetas
              </button>
            </div>
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

              {viewMode === 'table' ? (
                /* Debt Table View */
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800 select-none">
                        <th 
                          onClick={() => handleColumnHeaderClick('name')}
                          className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                        >
                          <div className="flex items-center gap-1">
                            <span>Deuda / Tipo</span>
                            {renderSortIcon('name')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleColumnHeaderClick('start')}
                          className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                        >
                          <div className="flex items-center gap-1">
                            <span>Fecha Inicio</span>
                            {renderSortIcon('start')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleColumnHeaderClick('freq')}
                          className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                        >
                          <div className="flex items-center gap-1">
                            <span>Frecuencia / Días</span>
                            {renderSortIcon('freq')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleColumnHeaderClick('total')}
                          className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Monto Inicial</span>
                            {renderSortIcon('total')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleColumnHeaderClick('paid')}
                          className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Pagado</span>
                            {renderSortIcon('paid')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleColumnHeaderClick('installment')}
                          className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Cuota Est.</span>
                            {renderSortIcon('installment')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleColumnHeaderClick('remaining')}
                          className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Saldo Pendiente</span>
                            {renderSortIcon('remaining')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {activeDebts.map(item => {
                        const realIndex = debts.findIndex(d => d.id === item.id);
                        const customDef = (profile.settings?.customDebts || []).find((cd: any) => cd.id === item.type);
                        const itemColor = item.color || customDef?.color || (item.type === 'fixed' ? '#1a73e8' : item.type === 'noloan' ? '#00897b' : '#f59e0b');
                        const itemTypeLabel = customDef ? `✨ ${customDef.name}` : (item.type === 'card' ? '💳 Tarjeta de Crédito' : (item.type === 'loan_interest' ? '🏦 Préstamo con Interés' : '🤝 Préstamo sin Interés'));
                        
                        const plan = calculateAmortizationPlan(item, overrides, profile.settings.customDebts || [], undefined, exchangeRates);
                        const remaining = plan.reduce((acc, p) => acc + (p.requiredPay || 0), 0);
                        const paid = getDebtTotalPaid(item, overrides, exchangeRates);
                        const original = remaining + paid;
                        const progressPct = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 0;
                        const monthlyInstallment = plan.length > 0 ? plan[0].expectedAmount : (item.amount || item.minPay || 0);

                        return (
                          <tr
                            key={item.id}
                            onClick={() => onOpenEdit('debt', realIndex)}
                            className="hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                                  style={{ backgroundColor: itemColor }}
                                />
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                                    {item.name}
                                    {item.currency && item.currency !== 'USD_BCV' && (
                                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold">
                                        {item.currency}
                                      </span>
                                    )}
                                    {item.incomeId && (() => {
                                      const inc = (profile.incomes || []).find(i => i.id === item.incomeId);
                                      return inc ? (
                                        <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded font-bold border border-indigo-200/50 dark:border-indigo-800/30">
                                          🏦 {inc.name}
                                        </span>
                                      ) : null;
                                    })()}
                                    {item.done && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-bold border border-emerald-200/50 dark:border-emerald-800/30">
                                        ✓ Pagado
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {itemTypeLabel}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap">
                              {item.start ? formatDateStr(item.start) : '—'}
                            </td>
                            <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                              {item.type === 'card'
                                ? `Corte: día ${item.cutDay || 5} / Pago: día ${item.dueDay || 25}`
                                : (item.freq === 'biweekly'
                                    ? `Quincenal (Día ${item.dueDay || '15-30'})`
                                    : (item.freq === 'weekly'
                                        ? 'Semanal'
                                        : (item.freq === 'triweekly'
                                            ? 'Trisemanal'
                                            : (item.freq === 'bimonthly'
                                                ? `Bimensual (Día ${item.dueDay || 1})`
                                                : (item.freq === 'quarterly'
                                                    ? `Trimestral (Día ${item.dueDay || 1})`
                                                    : (item.freq === 'four-monthly' || (item.freq as any) === 'cuatrimestral'
                                                        ? `Cuatrimestral (Día ${item.dueDay || 1})`
                                                        : (item.freq === 'semiannual' || (item.freq as any) === 'semestral'
                                                            ? `Semestral (Día ${item.dueDay || 1})`
                                                            : (item.freq === 'annual'
                                                                ? `Anual (Día ${item.dueDay || 1})`
                                                                : `Mensual (Día ${item.dueDay || 1})`))))))))}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              {formatCurrencyExt(original, item.currency)}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrencyExt(paid, item.currency)}
                              </div>
                              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                <div className="w-12 bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progressPct}%` }} />
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold">{progressPct}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {formatCurrencyExt(monthlyInstallment, (item as any).currency)}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                              {formatCurrencyExt(remaining, (item as any).currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Debt Cards View */
                <div className="space-y-3">
                  {activeDebts.map(item => {
                    const realIndex = debts.findIndex(d => d.id === item.id);
                    const customDef = (profile.settings?.customDebts || []).find((cd: any) => cd.id === item.type);
                    const itemColor = item.color || customDef?.color || (item.type === 'fixed' ? '#1a73e8' : item.type === 'noloan' ? '#00897b' : '#f59e0b');
                    const itemTypeLabel = customDef ? `✨ ${customDef.name}` : (item.type === 'card' ? '💳 Tarjeta de Crédito' : (item.type === 'loan_interest' ? '🏦 Préstamo con Interés' : '🤝 Préstamo sin Interés'));
                    
                    const plan = calculateAmortizationPlan(item, overrides, profile.settings.customDebts || [], undefined, exchangeRates);
                    const remaining = plan.reduce((acc, p) => acc + (p.requiredPay || 0), 0);
                    const paid = getDebtTotalPaid(item, overrides, exchangeRates);
                    const original = remaining + paid;
                    const progressPct = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 0;
                    const installmentsCount = plan.length;
                    const monthlyInstallment = plan.length > 0 ? plan[0].expectedAmount : (item.amount || item.minPay || 0);

                    return (
                      <div
                        key={item.id}
                        onClick={() => onOpenEdit('debt', realIndex)}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all space-y-2.5 cursor-pointer"
                        style={{ borderLeftWidth: '4px', borderLeftColor: itemColor }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 shadow-2xs"
                              style={{ backgroundColor: itemColor }}
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                                {item.name}
                                {item.currency && item.currency !== 'USD_BCV' && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-bold">
                                    {item.currency}
                                  </span>
                                )}
                                {item.incomeId && (() => {
                                  const inc = (profile.incomes || []).find(i => i.id === item.incomeId);
                                  return inc ? (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-md font-bold border border-indigo-200/50 dark:border-indigo-800/30">
                                      🏦 {inc.name}
                                    </span>
                                  ) : null;
                                })()}
                                {item.done && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-bold border border-emerald-200/50 dark:border-emerald-800/30">
                                    ✓ Pagado
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {itemTypeLabel}
                                {' • '}
                                {item.type === 'card' 
                                  ? `Corte: día ${item.cutDay || 5} / Pago: día ${item.dueDay || 25}`
                                  : (item.freq === 'biweekly' 
                                      ? `Quincenal (${item.dueDay || '15-30'})` 
                                      : (item.freq === 'weekly' 
                                          ? 'Semanal' 
                                          : (item.freq === 'triweekly' 
                                              ? 'Trisemanal' 
                                              : (item.freq === 'bimonthly'
                                                  ? `Bimensual (Día ${item.dueDay || 1})`
                                                  : (item.freq === 'quarterly'
                                                      ? `Trimestral (Día ${item.dueDay || 1})`
                                                      : (item.freq === 'four-monthly' || (item.freq as any) === 'cuatrimestral'
                                                          ? `Cuatrimestral (Día ${item.dueDay || 1})`
                                                          : (item.freq === 'semiannual' || (item.freq as any) === 'semestral'
                                                              ? `Semestral (Día ${item.dueDay || 1})`
                                                              : (item.freq === 'annual'
                                                                  ? `Anual (Día ${item.dueDay || 1})`
                                                                  : `Mensual (Día ${item.dueDay || 1})`))))))))}
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
                            {item.start && (
                              <span className="text-slate-400 font-normal">
                                • Inicio: <strong className="font-semibold text-slate-600 dark:text-slate-300">{formatDateStr(item.start)}</strong>
                              </span>
                            )}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            Cuota: {formatCurrencyExt(monthlyInstallment, (item as any).currency)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        ) : subTab === 'settled' ? (
          settledDebts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No hay deudas saldadas en el historial.
            </p>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] uppercase font-extrabold tracking-wider border-b border-emerald-100 dark:border-emerald-900/40 select-none">
                    <th 
                      onClick={() => handleColumnHeaderClick('name')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60 transition-colors group"
                    >
                      <div className="flex items-center gap-1">
                        <span>Deuda Saldada</span>
                        {renderSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleColumnHeaderClick('start')}
                      className="py-3 px-3 cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60 transition-colors group"
                    >
                      <div className="flex items-center gap-1">
                        <span>Fecha Inicio</span>
                        {renderSortIcon('start')}
                      </div>
                    </th>
                    <th className="py-3 px-3">Estado</th>
                    <th 
                      onClick={() => handleColumnHeaderClick('remaining')}
                      className="py-3 px-3 text-right cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60 transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Monto Saldado</span>
                        {renderSortIcon('remaining')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/60 dark:divide-emerald-900/30 text-xs">
                  {settledDebts.map(item => {
                    const realIndex = debts.findIndex(d => d.id === item.id);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => onOpenEdit('debt', realIndex)}
                        className="hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {item.name}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-medium whitespace-nowrap">
                          {item.start ? formatDateStr(item.start) : '—'}
                        </td>
                        <td className="py-3 px-3 text-xs font-semibold text-emerald-600">
                          ✅ Completada
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-700 dark:text-emerald-300">
                          {formatCurrencyExt(item.balance, (item as any).currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                      <p className="text-[10px] text-emerald-600 flex items-center gap-1.5">
                        <span>✅ Completada</span>
                        {item.start && <span>• Inicio: {formatDateStr(item.start)}</span>}
                      </p>
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
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{cd.currency ? cd.currency.replace('_BCV', '') : 'USD'}</span> • {cd.freq === 'weekly' ? 'Semanal' :
                         cd.freq === 'biweekly' ? `Quincenal (${cd.dueDay || '15-30'})` :
                         cd.freq === 'triweekly' ? 'Trisemanal' :
                         cd.freq === 'bimonthly' ? `Bimensual (Día ${cd.dueDay || 1})` :
                         cd.freq === 'quarterly' ? `Trimestral (Día ${cd.dueDay || 1})` :
                         cd.freq === 'four-monthly' || (cd.freq as any) === 'cuatrimestral' ? `Cuatrimestral (Día ${cd.dueDay || 1})` :
                         cd.freq === 'semiannual' || (cd.freq as any) === 'semestral' ? `Semestral (Día ${cd.dueDay || 1})` :
                         cd.freq === 'annual' ? `Anual (Día ${cd.dueDay || 1})` :
                         `Mensual (Día ${cd.dueDay || 1})`} • {cd.hasInterest ? 'Con interés' : 'Sin interés'}
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
                    },
                    {
                      icon: '🛡️',
                      label: 'Póliza de Seguro',
                      desc: 'Seguro de auto, salud o vida semestral/anual',
                      form: { name: 'Póliza de Seguro', freq: 'semiannual', dueDay: '1', hasInterest: false, usePlan: true, color: '#00acc1' }
                    },
                    {
                      icon: '🏛️',
                      label: 'Impuestos / Tributos',
                      desc: 'Declaraciones o pagos trimestrales',
                      form: { name: 'Impuestos / Tasas', freq: 'quarterly', dueDay: '15', hasInterest: false, usePlan: false, color: '#fbbc04' }
                    },
                    {
                      icon: '🏢',
                      label: 'Cuota de Mantenimiento',
                      desc: 'Condominio o mantenimiento bimensual',
                      form: { name: 'Mantenimiento / Condominio', freq: 'bimonthly', dueDay: '5', hasInterest: false, usePlan: false, color: '#0f9d58' }
                    },
                    {
                      icon: '📅',
                      label: 'Suscripción / Anualidad',
                      desc: 'Membresía o cuota anual',
                      form: { name: 'Membresía Anual', freq: 'annual', dueDay: '1', hasInterest: false, usePlan: false, color: '#9c27b0' }
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Moneda del Tipo</label>
                    <select
                      value={customDebtForm.currency || 'USD_BCV'}
                      onChange={e => setCustomDebtForm({...customDebtForm, currency: e.target.value as any})}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="USD_BCV">USD ($ BCV)</option>
                      <option value="EUR_BCV">EUR (€ BCV)</option>
                      <option value="USDT">USDT</option>
                      <option value="BS">Bs (Bolívares)</option>
                    </select>
                  </div>
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
                      <option value="bimonthly">Bimensual (Cada 2 meses)</option>
                      <option value="quarterly">Trimestral (Cada 3 meses)</option>
                      <option value="four-monthly">Cuatrimestral (Cada 4 meses)</option>
                      <option value="semiannual">Semestral (Cada 6 meses)</option>
                      <option value="annual">Anual (Cada 12 meses)</option>
                      <option value="triweekly">Trisemanal (3 Semanas)</option>
                    </select>
                  </div>
                </div>

                {customDebtForm.freq === 'biweekly' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Día Pago</label>
                    <select
                      value={customDebtForm.dueDay || '15-30'}
                      onChange={e => setCustomDebtForm({...customDebtForm, dueDay: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="15-30">15 y 30</option>
                      <option value="14-28">14 y 28</option>
                      <option value="13-27">13 y 27</option>
                      <option value="exact_14">Cada 14 días (Cashea)</option>
                      <option value="exact_15">Cada 15 días</option>
                    </select>
                  </div>
                ) : (customDebtForm.freq === 'monthly' || customDebtForm.freq === 'bimonthly' || customDebtForm.freq === 'quarterly' || customDebtForm.freq === 'four-monthly' || customDebtForm.freq === 'semiannual' || customDebtForm.freq === 'annual') ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Día de Pago Sugerido</label>
                      <select
                        value={customDebtForm.dueDay || '1'}
                        onChange={e => setCustomDebtForm({...customDebtForm, dueDay: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>Día {d}</option>
                        ))}
                      </select>
                    </div>
                  ) : null}

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
                        {template.freq === 'weekly' ? 'Semanal' :
                         template.freq === 'biweekly' ? 'Quincenal' :
                         template.freq === 'triweekly' ? 'Trisemanal' :
                         template.freq === 'bimonthly' ? 'Bimensual' :
                         template.freq === 'quarterly' ? 'Trimestral' :
                         template.freq === 'four-monthly' || (template.freq as any) === 'cuatrimestral' ? 'Cuatrimestral' :
                         template.freq === 'semiannual' || (template.freq as any) === 'semestral' ? 'Semestral' :
                         template.freq === 'annual' ? 'Anual' :
                         'Mensual'}
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
