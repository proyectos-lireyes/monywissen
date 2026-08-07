import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  formatDateStr,
  todayStr,
  calculateProjections,
} from '../../utils/financialEngine';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  List as ListIcon,
  X,
  CheckCircle2,
} from 'lucide-react';

interface CalendarViewProps {
  onOpenDetails: (type: string, refId: string, originalDate: string, planDate: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenDetails }) => {
  const { profile, state } = useApp();
  const [currentCalDate, setCurrentCalDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStateFilters, setActiveStateFilters] = useState<string[]>([]);
  const [activeOutflowFilters, setActiveOutflowFilters] = useState<string[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: any[] } | null>(null);

  const plan = calculateProjections(profile, state.exchangeRates);
  const today = todayStr();

  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const prefixMonth = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let mInc = 0;
  let mExp = 0;
  let mDebt = 0;
  const monthOutflowTypes = new Set<string>();

  const monthEvents = plan.filter(e => e.date.startsWith(prefixMonth));
  monthEvents.forEach(e => {
    if (e.amt > 0 && e.type === 'income') mInc += e.amt;
    else if (e.type === 'expense') {
      mExp += Math.abs(e.amt);
      monthOutflowTypes.add('expense');
    } else if (e.type === 'savings') {
      monthOutflowTypes.add('savings');
    } else if (e.type === 'debt' ) {
      mDebt += Math.abs(e.amt);
      monthOutflowTypes.add(e.ref?.type || e.type);
    }
  });

  const toggleStateFilter = (filterId: string) => {
    setActiveStateFilters(prev =>
      prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]
    );
  };

  const toggleOutflowFilter = (type: string) => {
    setActiveOutflowFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filterOccurrence = (e: any) => {
    const isOverdue = !e.done && e.originalDate < today;
    const isPostponed = !e.done && (e.userPostponed || e.isDelayed || e.originalDate !== e.date);
    const isPending = !e.done && !isOverdue && !isPostponed;
    const isDone = e.done;

    if (!activeStateFilters.includes('show_done') && isDone) return false;

    const hasOtherFilters = activeStateFilters.some(f => f !== 'show_done');
    if (hasOtherFilters) {
      let show = false;
      if (activeStateFilters.includes('overdue') && isOverdue) show = true;
      if (activeStateFilters.includes('postponed') && isPostponed) show = true;
      if (activeStateFilters.includes('pending') && isPending) show = true;
      if (!show) return false;
    }

    if (activeOutflowFilters.length > 0) {
      if (e.amt > 0 && e.type === 'income') return false;
      const typeToMatch = e.type === 'expense' ? 'expense' : (e.type === 'savings' ? 'savings' : (e.ref?.type || e.type));
      if (!activeOutflowFilters.includes(typeToMatch)) return false;
    }

    if (searchQuery && !e.label.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  };

  const firstDayOfWeek = new Date(year, month, 1).getDay();

  return (
    <div className="space-y-5 pb-20">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Cronograma Financiero
          </h2>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendario
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" /> Lista
            </button>
          </div>
        </div>

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Ingresos</span>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(mInc)}</p>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Gastos</span>
            <p className="text-sm font-black text-blue-700 dark:text-blue-400">{formatCurrency(mExp)}</p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Deudas</span>
            <p className="text-sm font-black text-amber-700 dark:text-amber-400">{formatCurrency(mDebt)}</p>
          </div>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentCalDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={() => setCurrentCalDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400 py-1">
                {d}
              </span>
            ))}

            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-16" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${prefixMonth}-${dayNum.toString().padStart(2, '0')}`;
              const isToday = dateStr === today;
              const dayEvents = plan.filter(e => e.date === dateStr && filterOccurrence(e));

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setSelectedDayEvents({ date: dateStr, events: dayEvents });
                    }
                  }}
                  className={`min-h-16 p-1 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isToday
                      ? 'bg-blue-50/80 border-blue-400 dark:bg-blue-950/40 dark:border-blue-700'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className={isToday ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-600 dark:text-slate-300'}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] px-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-bold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 my-0.5">
                    {dayEvents.slice(0, 2).map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(ev.type, ev.ref.id, ev.originalDate, ev.date);
                        }}
                        className={`text-[8px] font-semibold px-1 py-0.5 rounded-sm truncate border-l-2 ${
                          ev.done
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : ev.amt > 0
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                        }`}
                      >
                        {ev.label}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[8px] text-slate-400 font-bold block text-right">
                        +{dayEvents.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block">
                📆 Cronograma en Modo Lista
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Proyección hasta el próximo mes ({monthNames[(month + 1) % 12]} {month === 11 ? year + 1 : year})
              </p>
            </div>

            <button
              onClick={() => toggleStateFilter('show_done')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeStateFilters.includes('show_done')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeStateFilters.includes('show_done') ? 'Ocultar Listos' : '👁️ Mostrar Listos'}
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar concepto o movimiento..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2.5">
            {(() => {
              // Calculate end of next month
              const nextMonthEnd = new Date(year, month + 2, 0);
              const nextMonthEndStr = `${nextMonthEnd.getFullYear()}-${(nextMonthEnd.getMonth() + 1).toString().padStart(2, '0')}-${nextMonthEnd.getDate().toString().padStart(2, '0')}`;

              const filteredPlan = plan
                .filter(e => e.date <= nextMonthEndStr)
                .filter(filterOccurrence);

              if (filteredPlan.length === 0) {
                return (
                  <div className="text-center py-10 text-slate-400 space-y-1">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sin movimientos para mostrar</p>
                    <p className="text-xs">Prueba activar "👁️ Mostrar Listos" para ver pagos ya realizados.</p>
                  </div>
                );
              }

              return filteredPlan.map((e, idx) => {
                const isIncome = e.amt > 0 || e.type === 'income';
                const preIncomeBalance = isIncome ? (e.balance - e.amt) : null;

                return (
                  <div
                    key={idx}
                    onClick={() => onOpenDetails(e.type, e.ref?.id || '', e.originalDate || e.date, e.date)}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer ${
                      e.done
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                        : isIncome
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {e.label}
                        </p>
                        {e.done && (
                          <span className="text-[9px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-md font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Listo / Pagado
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 font-medium">
                        🗓️ {formatDateStr(e.date)}
                        {e.type && ` • ${e.type === 'income' ? 'Ingreso' : e.type === 'expense' ? 'Gasto' : e.type === 'savings' ? 'Ahorro' : 'Deuda/Financiamiento'}`}
                      </p>

                      {/* Display AVAILABLE BALANCE PRIOR TO INCOME */}
                      {isIncome && preIncomeBalance !== null && (
                        <div className="p-1.5 bg-emerald-100/60 dark:bg-emerald-900/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 inline-block">
                          <p className="text-[10px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                            💡 <span>Disponible previo al ingreso:</span>
                            <span className="font-black text-xs text-emerald-700 dark:text-emerald-300">
                              {formatCurrency(preIncomeBalance)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right flex sm:flex-col justify-between sm:justify-center items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50 dark:border-slate-700/50">
                      <p className={`text-xs font-black ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(e.amt))}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {isIncome ? 'Saldo posterior: ' : 'Saldo disponible: '}
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">{formatCurrency(e.balance)}</span>
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Filter Chips Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Filtros por Estado
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'pending', label: '🔴 Pendientes' },
            { id: 'overdue', label: '⚠️ Atrasados' },
            { id: 'postponed', label: '🔄 Pospuestos' },
            { id: 'show_done', label: '👁️ Mostrar Listos' },
          ].map(f => {
            const isActive = activeStateFilters.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleStateFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Events Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Movimientos del {formatDateStr(selectedDayEvents.date)}
              </h3>
              <button onClick={() => setSelectedDayEvents(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {selectedDayEvents.events.map((e, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDayEvents(null);
                    onOpenDetails(e.type, e.ref.id, e.originalDate, e.date);
                  }}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-slate-100"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{e.label}</p>
                    <p className="text-[10px] text-slate-400">{e.type}</p>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(Math.abs(e.amt))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
