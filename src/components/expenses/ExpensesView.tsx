import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, todayStr } from '../../utils/financialEngine';
import { Plus, CreditCard, Clock, CheckCircle, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Receipt } from 'lucide-react';

interface ExpensesViewProps {
  onOpenCreate: (type: 'expense' | 'debt', forceOneTime?: boolean) => void;
  onOpenEdit: (type: 'expense' | 'debt', index: number) => void;
}

type SortField = 'name' | 'type' | 'freq' | 'amount';
type SortOrder = 'asc' | 'desc';

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenCreate, onOpenEdit }) => {
  const { profile, convertAmount } = useApp();
  const [subTab, setSubTab] = useState<'active' | 'completed'>('active');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const today = todayStr();

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

  // 1. Recurrent Expenses
  const recurrentExpenses = useMemo(() => {
    return (profile.expenses || []).filter(e => e.freq !== 'one-time');
  }, [profile.expenses]);

  const activeExpenses = useMemo(() => {
    return recurrentExpenses.filter(e => !e.end || e.end >= today);
  }, [recurrentExpenses, today]);

  const completedExpenses = useMemo(() => {
    return recurrentExpenses.filter(e => e.end && e.end < today);
  }, [recurrentExpenses, today]);

  // Extract unique categories for filtering
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    recurrentExpenses.forEach(e => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [recurrentExpenses]);

  // Total Active Expenses Calculation
  const totalActiveExpenses = useMemo(() => {
    return activeExpenses.reduce((acc, e) => acc + convertAmount(e.amount, (e as any).currency), 0);
  }, [activeExpenses, convertAmount]);

  // Header Sorting Helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400 font-extrabold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400 font-extrabold" />
    );
  };

  // Filter & Sort Logic for Expenses Tab
  const processedExpenses = useMemo(() => {
    const source = subTab === 'active' ? activeExpenses : completedExpenses;
    return source
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.desc && item.desc.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        let valA: any = a[sortField === 'type' ? 'category' : sortField] || '';
        let valB: any = b[sortField === 'type' ? 'category' : sortField] || '';

        if (sortField === 'amount') {
          valA = convertAmount(a.amount, (a as any).currency);
          valB = convertAmount(b.amount, (b as any).currency);
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB as string).toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [subTab, activeExpenses, completedExpenses, searchTerm, categoryFilter, sortField, sortOrder, convertAmount]);

  const getFreqLabel = (freq: string, day?: any) => {
    if (freq === 'biweekly') return `Quincenal (${day || '15-30'})`;
    if (freq === 'weekly') return `Semanal (Día ${day || '1'})`;
    if (freq === 'monthly') return `Mensual (Día ${day || '1'})`;
    if (freq === 'bimonthly') return `Bimensual (Día ${day || '1'})`;
    if (freq === 'quarterly') return `Trimestral (Día ${day || '1'})`;
    if (freq === 'four-monthly' || (freq as any) === 'cuatrimestral') return `Cuatrimestral (Día ${day || '1'})`;
    if (freq === 'semiannual' || (freq as any) === 'semestral') return `Semestral (Día ${day || '1'})`;
    if (freq === 'annual') return `Anual (Día ${day || '1'})`;
    return freq;
  };

  return (
    <div className="space-y-4 pb-20">
      {/* KPI Overview Summary */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Gastos Fijos Activos</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{formatCurrency(totalActiveExpenses)}</p>
          <p className="text-[10px] text-slate-500">{activeExpenses.length} compromisos fijos recurrentes</p>
        </div>
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
          <Receipt className="w-5 h-5" />
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Gastos Fijos
            </h2>
            <p className="text-xs text-slate-400">
              Registro de tus gastos recurrentes y suscripciones fijas.
            </p>
          </div>

          <button
            onClick={() => onOpenCreate('expense')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Gasto
          </button>
        </div>

        {/* SubTab Switcher (Activos / Finalizados) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSubTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                subTab === 'active'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Activos ({activeExpenses.length})
            </button>
            <button
              onClick={() => setSubTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                subTab === 'completed'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Finalizados ({completedExpenses.length})
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar gasto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-36 sm:w-52 text-xs pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
              <Filter className="w-3 h-3 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">Todas las categorías</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>📁 {cat}</option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            {processedExpenses.length} registrados
          </span>
        </div>

        {/* Expenses Table */}
        {processedExpenses.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">
            No se encontraron gastos fijos con los criterios aplicados.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800 select-none">
                  <th 
                    onClick={() => handleSort('name')}
                    className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                  >
                    <div className="flex items-center gap-1">
                      <span>Gasto / Detalle</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('type')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                  >
                    <div className="flex items-center gap-1">
                      <span>Categoría</span>
                      {renderSortIcon('type')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('freq')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                  >
                    <div className="flex items-center gap-1">
                      <span>Frecuencia / Día</span>
                      {renderSortIcon('freq')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('amount')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Monto Cuota</span>
                      {renderSortIcon('amount')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {processedExpenses.map(item => {
                  const realIndex = (profile.expenses || []).findIndex(e => e.id === item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onOpenEdit('expense', realIndex)}
                      className="hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </span>
                          {item.strictDate && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                              Estricta
                            </span>
                          )}
                        </div>
                        {item.desc && (
                          <p className="text-[10px] text-slate-400 truncate max-w-xs">{item.desc}</p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.category || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {getFreqLabel(item.freq, item.day)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {formatCurrencyExt(item.amount, (item as any).currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
