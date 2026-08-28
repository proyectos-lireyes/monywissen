import React, { useState, useEffect } from 'react';
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
  const { profile, state, exchangeRates } = useApp();
  const [currentCalDate, setCurrentCalDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeStateFilters, setActiveStateFilters] = useState<string[]>([]);
  const [activeOutflowFilters, setActiveOutflowFilters] = useState<string[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: any[] } | null>(null);

  const plan = calculateProjections(profile, exchangeRates);
  const today = todayStr();

  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const [showAllPrevious, setShowAllPrevious] = useState(false);

  const prefixMonth = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Reset showAllPrevious when month changes
  useEffect(() => {
    setShowAllPrevious(false);
  }, [prefixMonth]);

  let mInc = 0;
  let mExp = 0;
  let mDebt = 0;
  let mSav = 0;
  const monthOutflowTypes = new Set<string>();

  const monthEvents = plan.filter(e => e.date.startsWith(prefixMonth));
  monthEvents.forEach(e => {
    if (e.amt > 0 && e.type === 'income') mInc += e.amt;
    else if (e.type === 'expense') {
      mExp += Math.abs(e.amt);
      monthOutflowTypes.add('expense');
    } else if (e.type === 'savings') {
      mSav += Math.abs(e.amt);
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
    const isPostponed = !e.done && (e.userPostponed || (e.isDelayed && !e.insufficientFunds) || (e.originalDate && e.originalDate < e.date && !e.insufficientFunds));
    const isPulledEarly = !e.done && e.pulledEarly;
    const isDeficit = !e.done && e.insufficientFunds && e.amt < 0;
    const isPending = !e.done && !isOverdue && !isPostponed && !isPulledEarly && !isDeficit;
    const isDone = e.done;

    if (activeStateFilters.includes('hide_done') && isDone) return false;

    const hasOtherFilters = activeStateFilters.some(f => f !== 'hide_done');
    if (hasOtherFilters) {
      let show = false;
      if (activeStateFilters.includes('overdue') && isOverdue) show = true;
      if (activeStateFilters.includes('postponed') && isPostponed) show = true;
      if (activeStateFilters.includes('pulledEarly') && isPulledEarly) show = true;
      if (activeStateFilters.includes('deficit') && isDeficit) show = true;
      if (activeStateFilters.includes('pending') && isPending) show = true;
      if (!show) return false;
    }

    if (activeOutflowFilters.length > 0) {
      if (!activeOutflowFilters.includes(e.type)) return false;
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

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => toggleStateFilter("hide_done")} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeStateFilters.includes("hide_done") ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200" : "bg-emerald-100 text-emerald-800 shadow-xs dark:bg-emerald-900/30 dark:text-emerald-300"}`}><CheckCircle2 className="w-3.5 h-3.5" />{activeStateFilters.includes("hide_done") ? "👁️ Mostrar Listos" : "Ocultar Listos"}</button>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Filtrar Día:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  const d = e.target.value;
                  setFilterDate(d);
                  if (d) {
                     const dEvents = plan.filter(ev => ev.date === d);
                     setSelectedDayEvents({ date: d, events: dEvents });
                     if (viewMode === 'calendar') {
                        const [y, m] = d.split('-');
                        setCurrentCalDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                     }
                  } else {
                     setSelectedDayEvents(null);
                  }
                }}
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setViewMode('calendar');
                setActiveStateFilters(prev => prev.filter(f => f !== 'hide_done'));
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendario
            </button>
            <button
              onClick={() => {
                setViewMode('list');
                setActiveStateFilters(prev => prev.includes('hide_done') ? prev : [...prev, 'hide_done']);
              }}
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
        </div>

        
        <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setCurrentCalDate(new Date(year, month - 1, 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 capitalize">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={() => setCurrentCalDate(new Date(year, month + 1, 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-4 gap-2">
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
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-sky-600 uppercase">Ahorro</span>
            <p className="text-sm font-black text-sky-700 dark:text-sky-400">{formatCurrency(mSav)}</p>
          </div>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          {/* Month navigation moved above */}

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
              const actualEvents = plan.filter(e => e.date === dateStr && filterOccurrence(e));
              const ghostEvents = plan.filter(e => e.originalDate === dateStr && e.date !== dateStr && filterOccurrence(e)).map(e => ({ ...e, isGhost: true }));
              const dayEvents = [...actualEvents, ...ghostEvents];

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
                          if (!ev.isGhost && ev.type !== 'opening_balance') {
                             onOpenDetails(ev.type, ev.ref.id, ev.originalDate, ev.date);
                          }
                        }}
                        style={(!ev.done && ev.date >= today && ev.amt <= 0 && ev.ref?.effectiveColor && !ev.isGhost) ? {
                          borderLeftColor: ev.ref.effectiveColor,
                          color: ev.ref.effectiveColor
                        } : {}}
                        title={ev.isGhost ? `Movido al ${formatDateStr(ev.date)}` : undefined}
                        className={`text-[8px] font-semibold px-1 py-0.5 rounded-sm truncate border-l-2 ${
                          ev.isGhost
                            ? 'border-slate-300 bg-slate-100/50 text-slate-400 dark:bg-slate-800/30 dark:border-slate-700 dark:text-slate-500 line-through opacity-60 cursor-help'
                            : ev.done
                            ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-500/50'
                            : (ev.date < today
                               ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:border-rose-500/50'
                               : ev.amt > 0
                                 ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20'
                                 : (!ev.ref?.effectiveColor ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800'))
                        }`}
                      >
                        {!ev.isGhost && ev.done && <span className="text-emerald-600 dark:text-emerald-400 mr-0.5">✓</span>}
                        {!ev.isGhost && ev.pulledEarly ? '⚡ ' : ''}{!ev.isGhost && ev.isDelayed ? '⚠️ ' : ''}{ev.label}
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
              const filteredPlan = plan
                .filter(e => {
                  if (searchQuery) return true;
                  if (e.date.startsWith(prefixMonth)) return true;
                  if (showAllPrevious && e.date < prefixMonth) return true;
                  return false;
                })
                .filter(filterOccurrence);
                
              const hasPreviousHidden = !showAllPrevious && !searchQuery && plan.some(e => e.date < prefixMonth && filterOccurrence(e));

              return (
                <>
                  {hasPreviousHidden && (
                    <button
                      onClick={() => setShowAllPrevious(true)}
                      className="w-full py-2.5 mb-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Cargar movimientos anteriores
                    </button>
                  )}
                  {filteredPlan.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-1">
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sin movimientos para mostrar</p>
                      <p className="text-xs">Prueba activar "👁️ Mostrar Listos" para ver pagos ya realizados.</p>
                    </div>
                  ) : (
                    filteredPlan.map((e, idx) => {
                const isIncome = e.amt > 0 || e.type === 'income';
                const preIncomeBalance = isIncome ? (e.balance - e.amt) : null;

                return (
                  <div
                    key={idx}
                    onClick={() => { if (!e.isGhost && e.type !== 'opening_balance') onOpenDetails(e.type, e.ref?.id || '', e.originalDate || e.date, e.date); }}
                    style={(!e.done && e.date >= today && !isIncome && e.ref?.effectiveColor && !e.isGhost) ? {
                      borderLeftColor: e.ref.effectiveColor,
                      borderLeftWidth: '4px'
                    } : {}}
                    title={e.isGhost ? `Movido al ${formatDateStr(e.date)}` : undefined}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${!e.isGhost && e.type !== 'opening_balance' ? 'cursor-pointer hover:opacity-80' : e.isGhost ? 'cursor-help opacity-50' : 'opacity-90'} ${
                      e.isGhost 
                        ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        : e.done
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                        : isIncome
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                        : (!e.ref?.effectiveColor ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300' : 'bg-slate-50 dark:bg-slate-900 shadow-sm')
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-black flex items-center gap-2 ${e.isGhost ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                          {e.label} {e.isGhost && <span className="text-[9px] font-normal no-underline ml-1">(Plan original)</span>}
                          
                          {!e.isGhost && !e.done && e.pulledEarly && (
                            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title={`Adelantado desde el ${e.optimizedFrom}`}>⚡ Adelantado</span>
                          )}
                          {!e.done && e.isDelayed && !e.insufficientFunds && (
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title={`Retrasado desde el ${e.optimizedFrom}`}>⚠️ Pospuesto</span>
                          )}
                          {!e.done && e.insufficientFunds && e.amt < 0 && (
                            <span className="text-[9px] bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1" title="Quiebre / Fondos insuficientes">🚨 Quiebre</span>
                          )}

                          {!e.done && e.date < today && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Atrasado</span>
                          )}
                        </p>
                        {e.done && (
                          <span className="text-[9px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-md font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Listo / Pagado
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 font-medium">
                        🗓️ {formatDateStr(e.date)}
                        {e.type && ` • ${e.type === 'opening_balance' ? 'Ajuste de Sistema' : e.type === 'rescate_ahorros' ? 'Rescate de Ahorros' : e.type === 'income' ? 'Ingreso' : e.type === 'expense' ? 'Gasto' : e.type === 'savings' ? 'Ahorro' : 'Deuda/Financiamiento'}`}
                      </p>

                      {/* Display AVAILABLE BALANCE PRIOR TO INCOME */}
                      {isIncome && e.type !== 'opening_balance' && preIncomeBalance !== null && (
                        <div className="p-1.5 bg-emerald-100/60 dark:bg-emerald-900/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 inline-block">
                          <p className="text-[10px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                            💡 <span>Disponible previo al ingreso:</span>
                            <span className="font-black text-xs text-emerald-700 dark:text-emerald-300">
                              {formatCurrency(preIncomeBalance)}
                            </span>
                          </p>
                        </div>
                      )}
                      
                      {/* Warning for INSUFFICIENT FUNDS */}
                      {!e.done && e.insufficientFunds && !isIncome && (
                        <div className="mt-1 p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/50">
                          <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 leading-tight mb-1">
                            {e.balance < 0 ? '⚠️ Saldo insuficiente para este pago.' : '⚠️ Este pago rompe tu colchón de seguridad.'}
                          </p>
                          <p className="text-[9px] font-medium text-rose-600/80 dark:text-rose-500/80">
                            Toca aquí para Moverlo o Descartarlo.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right flex sm:flex-col justify-between sm:justify-center items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50 dark:border-slate-700/50">
                      <p className={`text-xs font-black ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(e.amt))}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Saldo: <span className={e.balance < 0 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300 font-bold'}>{formatCurrency(e.balance)}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            </>
          );
        })()}
          </div>
        </div>
      )}

      {/* Filter Chips Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Filtros por Estado y Tipo
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'pending', label: '🔴 Pendientes', type: 'state' },
            { id: 'overdue', label: '⚠️ Atrasados', type: 'state' },
            { id: 'postponed', label: '🔄 Pospuestos', type: 'state' },
            { id: 'pulledEarly', label: '⚡ Adelantados', type: 'state' },
            { id: 'deficit', label: '🚨 Quiebre', type: 'state' },
            { id: 'expense', label: '📉 Gastos', type: 'outflow' },
            { id: 'debt', label: '💳 Deudas', type: 'outflow' },
          ].map(f => {
            const isActive = f.type === 'state' ? activeStateFilters.includes(f.id) : activeOutflowFilters.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => f.type === 'state' ? toggleStateFilter(f.id) : toggleOutflowFilter(f.id)}
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
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Total Gastos y Pagos (Día)</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(
                  selectedDayEvents.events.reduce((sum, e) => {
                    return (e.amt < 0) ? sum + Math.abs(e.amt) : sum;
                  }, 0)
                )}
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {selectedDayEvents.events.map((e, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDayEvents(null);
                    onOpenDetails(e.type, e.ref.id, e.originalDate, e.date);
                  }}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity border ${e.pulledEarly ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30' : e.insufficientFunds && e.amt < 0 ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30' : e.isDelayed ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30' : 'bg-slate-50 border-transparent dark:bg-slate-800'}`}
                >
                  <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.ref?.effectiveColor || '#94a3b8' }}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold flex items-center gap-1.5 truncate ${e.done ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300' : e.pulledEarly ? 'text-emerald-900 dark:text-emerald-100' : e.insufficientFunds && e.amt < 0 ? 'text-rose-900 dark:text-rose-100' : 'text-slate-900 dark:text-slate-100'}`}>
                        {e.done && <span className="text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 rounded-full px-1 py-0.5 no-underline flex items-center justify-center"><CheckCircle2 className="w-3 h-3" /></span>}
                        {e.label}
                        {e.pulledEarly && !e.done && <span title="Adelantado automáticamente" className="text-emerald-500 no-underline">⚡</span>}
                        {e.insufficientFunds && e.amt < 0 && !e.done && <span title="Alerta de Quiebre" className="text-rose-500 no-underline">🚨</span>}
                        {e.isDelayed && !e.insufficientFunds && !e.done && <span title="Retrasado" className="text-amber-500 no-underline">⚠️</span>}
                      </p>
                      <p className={`text-[10px] ${e.pulledEarly ? 'text-emerald-600/70 dark:text-emerald-400/60' : e.insufficientFunds && e.amt < 0 ? 'text-rose-600/70 dark:text-rose-400/60' : 'text-slate-400'}`}>{e.type}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-black ${e.pulledEarly ? 'text-amber-700 dark:text-amber-300' : e.insufficientFunds && e.amt < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-slate-100'}`}>
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
