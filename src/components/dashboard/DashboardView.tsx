import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  formatDateStr,
  todayStr,
  calculateProjections,
  getRemainingDebtAmount,
} from '../../utils/financialEngine';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Plus,
  RefreshCw,
  ShieldCheck,
  Scale,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  LineChart,
  AreaChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';

interface DashboardViewProps {
  onOpenCreate: (type: 'income' | 'expense' | 'debt' | 'saving', forceOneTime?: boolean) => void;
  onOpenDetails: (type: string, refId: string, originalDate: string, planDate: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenCreate,
  onOpenDetails,
}) => {
  const { profile, updateProfileData, showToast, setActiveView, integrityReport } = useApp();
  const [chartMode, setChartMode] = useState<number>(profile.settings.defaultChart || 0); // 0: Composed, 1: Bar, 2: Pie
  const [showBalanceLine, setShowBalanceLine] = useState(true);
  const [showFlowLines, setShowFlowLines] = useState(true);

  const plan = calculateProjections(profile);
  const today = todayStr();

  // Find balance for today
  let todayBalance = profile.settings.openingBalance || 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let criticalAlert: { date: string; reason: string } | null = null;
  const delayedItems: any[] = [];

  plan.forEach(e => {
    if (e.date <= today) todayBalance = e.balance;
    if (e.amt > 0) totalIncome += e.amt;
    if (e.amt < 0 && e.type !== 'savings') totalExpense += Math.abs(e.amt);
    if (e.criticalDelay && !criticalAlert) criticalAlert = { date: e.date, reason: e.label };
    if (e.isDelayed && e.date >= today && !e.criticalDelay) delayedItems.push(e);
  });

  const lastOccurrence = plan[plan.length - 1];
  const projectedBalance = lastOccurrence ? lastOccurrence.balance : profile.settings.openingBalance;
  const totalDebt = (profile.debts || []).reduce((acc, d) => acc + getRemainingDebtAmount(d, profile.overrides), 0);

  // Prepare Recharts Data
  const chartDataMap: Record<string, { date: string; label: string; balance: number; income: number; expense: number; debt: number }> = {};

  plan.forEach(e => {
    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!chartDataMap[e.date]) {
        chartDataMap[e.date] = {
          date: e.date,
          label: formatDateStr(e.date).substring(0, 5),
          balance: e.balance,
          income: 0,
          expense: 0,
          debt: 0,
        };
      }
      if (e.amt > 0 && e.type === 'income') chartDataMap[e.date].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') chartDataMap[e.date].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) chartDataMap[e.date].debt += Math.abs(e.amt);
      chartDataMap[e.date].balance = e.balance;
    }
  });

  const chartData = Object.values(chartDataMap);

  // Monthly Aggregation Data
  const monthlyDataMap: Record<string, { label: string; income: number; expense: number; debt: number }> = {};
  plan.forEach(e => {
    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      const monthPrefix = e.date.substring(0, 7); // YYYY-MM
      if (!monthlyDataMap[monthPrefix]) {
        monthlyDataMap[monthPrefix] = {
          label: monthPrefix,
          income: 0,
          expense: 0,
          debt: 0,
        };
      }
      if (e.amt > 0 && e.type === 'income') monthlyDataMap[monthPrefix].income += e.amt;
      if (e.amt < 0 && e.type === 'expense') monthlyDataMap[monthPrefix].expense += Math.abs(e.amt);
      if (e.amt < 0 && (e.type === 'debt' )) monthlyDataMap[monthPrefix].debt += Math.abs(e.amt);
    }
  });
  const monthlyData = Object.values(monthlyDataMap);

  // Net Cash Flow monthly breakdown for chart
  const netFlowMonthlyData = monthlyData.map(m => {
    const net = m.income - (m.expense + m.debt);
    return {
      label: m.label,
      netFlow: net,
      income: m.income,
      expense: m.expense + m.debt,
    };
  });

  // Pie chart categories distribution
  const pieCategories: Record<string, number> = {};
  plan.forEach(e => {
    if (e.amt < 0) {
      if (e.type === 'debt' && e.done) return;
      let cat = 'Deudas';
      if (e.type === 'expense') {
        cat = 'Gastos Fijos';
      } else if (e.type === 'savings') {
        cat = 'Ahorros';
      } else if (e.type === 'debt') {
        cat = e.ref?.name || 'Deudas';
      }
      pieCategories[cat] = (pieCategories[cat] || 0) + Math.abs(e.amt);
    }
  });

  const pieData = Object.keys(pieCategories).map(key => ({
    name: key,
    value: pieCategories[key],
  }));

  const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

  // Next 30 days pending items
  const next30Limit = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);
  const upcomingList = plan
    .filter(e => !e.done && e.originalDate <= next30Limit)
    .sort((a, b) => a.originalDate.localeCompare(b.originalDate));

  const handleUpdatePlanDates = (start: string, end: string) => {
    updateProfileData(draft => {
      draft.settings.planStart = start;
      draft.settings.planEnd = end;
    });
    showToast('Rango de fechas de proyección actualizado', '📅');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Alert Banner */}
      {criticalAlert ? (
        <div
          onClick={() => setActiveView('calendar')}
          className="p-4 bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-rose-100/80 transition-all shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                Alerta de Déficit Crítico
              </p>
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                El pago "{criticalAlert.reason}" genera un saldo negativo el {formatDateStr(criticalAlert.date)}.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-500" />
        </div>
      ) : (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Flujo Financiero Saludable
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Tus ingresos planificados cubren todos los compromisos proyectados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Saldo Disponible (Hoy)
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight mt-1">
              {formatCurrency(todayBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Colchón Mínimo: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(profile.settings.minBalance || 0)}</span>
            </p>
          </div>

          <div
            onClick={() => setChartMode(3)}
            className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4 cursor-pointer hover:opacity-90 transition-opacity"
            title="Haz clic para ver el Gráfico de Flujo de Caja Neto"
          >
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center sm:justify-end gap-1">
              Flujo de Caja Neto (Proyección) <span className="text-emerald-600 text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md">Ver Gráfica 📈</span>
            </span>
            <div className={`text-3xl sm:text-4xl font-black tracking-tight mt-1 ${
              (totalIncome - totalExpense) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {(totalIncome - totalExpense) >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ingresos ({formatCurrency(totalIncome)}) - Gastos ({formatCurrency(totalExpense)})
            </p>
          </div>
        </div>

        {/* Projection Chart Header */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Proyección Visual
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setChartMode(0)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartMode === 0
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Diario
              </button>
              <button
                onClick={() => setChartMode(1)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartMode === 1
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setChartMode(3)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartMode === 3
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                📈 Flujo Neto
              </button>
              <button
                onClick={() => setChartMode(2)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartMode === 2
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Categorías
              </button>
            </div>
          </div>

          {/* Date range inputs & series toggles */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4 justify-between items-stretch sm:items-center">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Inicio Plan</label>
                <input
                  type="date"
                  value={profile.settings.planStart}
                  onChange={e => handleUpdatePlanDates(e.target.value, profile.settings.planEnd)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Fin Plan</label>
                <input
                  type="date"
                  value={profile.settings.planEnd}
                  onChange={e => handleUpdatePlanDates(profile.settings.planStart, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {chartMode === 0 && (
              <div className="flex items-center gap-1.5 pt-1 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowFlowLines(!showFlowLines)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                    showFlowLines
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 line-through'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Ingresos/Gastos (Eje Izq.)
                </button>
                <button
                  type="button"
                  onClick={() => setShowBalanceLine(!showBalanceLine)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                    showBalanceLine
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 line-through'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Saldo (Eje Der.)
                </button>
              </div>
            )}
          </div>

          {/* Recharts Canvas */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 3 ? (
                <ComposedChart data={netFlowMonthlyData}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="netFlow"
                    name="Flujo de Caja Neto ($)"
                    stroke="#10b981"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#10b981' }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Ingresos"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Egresos"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              ) : chartMode === 2 ? (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              ) : chartMode === 1 ? (
                <ComposedChart data={monthlyData}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={true} />
                  <Line type="monotone" dataKey="expense" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={true} />
                  <Line type="monotone" dataKey="debt" name="Deudas" stroke="#f59e0b" strokeWidth={2} dot={true} />
                </ComposedChart>
              ) : (
                <ComposedChart data={chartData}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                  {showFlowLines && (
                    <YAxis
                      yAxisId="left"
                      stroke="#10b981"
                      fontSize={10}
                      tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                  )}
                  {showBalanceLine && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#2563eb"
                      fontSize={10}
                      tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                  )}
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />

                  {showFlowLines && (
                    <>
                      <Line yAxisId="left" type="monotone" dataKey="income" name="Ingresos (Eje Izq.)" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="expense" name="Gastos (Eje Izq.)" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </>
                  )}

                  {showBalanceLine && (
                    <Line
                      yAxisId={showFlowLines ? 'right' : 'left'}
                      type="monotone"
                      dataKey="balance"
                      name="Saldo Disponible (Eje Der.)"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                    />
                  )}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase">Total Ingresos</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase">Total Pagos</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Scale className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase">Flujo Neto</span>
          </div>
          <p className={`text-lg sm:text-xl font-extrabold ${(totalIncome - totalExpense) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase">Saldo Cierre</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(projectedBalance)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase">Deuda Global</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalDebt)}
          </p>
        </div>
      </div>

      {/* Capa de Integridad Financiera Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${
              integrityReport.status === 'HEALTHY' ? 'bg-emerald-600' : integrityReport.status === 'WARNING' ? 'bg-amber-600' : 'bg-rose-600'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Capa de Integridad Financiera
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                  integrityReport.status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                  integrityReport.status === 'WARNING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {integrityReport.status === 'HEALTHY' ? 'Saludable' : integrityReport.status === 'WARNING' ? 'Atención' : 'Riesgo Crítico'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verificación continua de partida doble, flujo preventivo y consistencia de saldos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Puntuación</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-50">{integrityReport.score}/100</p>
            </div>
          </div>
        </div>

        {/* Audit Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Double Entry Audit */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600" /> Doble Entrada
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                integrityReport.doubleEntryIssues.length === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
              }`}>
                {integrityReport.doubleEntryIssues.length === 0 ? 'Balanceado' : `${integrityReport.doubleEntryIssues.length} Descalce`}
              </span>
            </div>
            {integrityReport.doubleEntryIssues.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Sin descuadres entre pasivos y flujos.</p>
            ) : (
              <div className="space-y-1">
                {integrityReport.doubleEntryIssues.map(issue => (
                  <p key={issue.id} className="text-[11px] text-rose-600 dark:text-rose-400 font-medium leading-tight">
                    • {issue.title}: {issue.description}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Preventive Cash Flow Audit */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-600" /> Flujo Preventivo
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                integrityReport.preventiveWarnings.length === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
              }`}>
                {integrityReport.preventiveWarnings.length === 0 ? 'Protegido' : `${integrityReport.preventiveWarnings.length} Advertencia`}
              </span>
            </div>
            {integrityReport.preventiveWarnings.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Sin iliquidez ni quiebre de colchón.</p>
            ) : (
              <div className="space-y-1">
                {integrityReport.preventiveWarnings.slice(0, 2).map(w => (
                  <p key={w.id} className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-tight">
                    • {w.message}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Net Worth & Contradictions Audit */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" /> Balance Patrimonial
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                Neto: {formatCurrency(integrityReport.summary.netWorth)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Servicio de deuda: <strong className="text-slate-700 dark:text-slate-200">{integrityReport.summary.debtServiceRatio}%</strong> de ingresos.
            </p>
            {integrityReport.contradictions.length > 0 && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                • {integrityReport.contradictions[0].title}: {integrityReport.contradictions[0].detail}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onOpenCreate('income')}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> + Ingreso
          </button>
          <button
            onClick={() => onOpenCreate('expense')}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> + Gasto
          </button>
          <button
            onClick={() => onOpenCreate('debt')}
            className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> + Deuda
          </button>
          <button
            onClick={() => updateProfileData(() => {})}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Recalcular
          </button>
        </div>
      </div>

      {/* Upcoming 30-Day Timeline */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            Pendientes y Próximos 30 días
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {upcomingList.length} ítems
          </span>
        </div>

        {upcomingList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No hay compromisos pendientes registrados en los próximos 30 días.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {upcomingList.map((u, idx) => {
              const isOverdue = u.originalDate < today;
              return (
                <div
                  key={idx}
                  onClick={() => onOpenDetails(u.type, u.ref.id, u.originalDate, u.date)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isOverdue
                      ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {u.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isOverdue ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          ⚠️ Atrasado (Plan: {formatDateStr(u.originalDate)})
                        </span>
                      ) : (
                        <span>Proyectado: {formatDateStr(u.date)}</span>
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-extrabold ${
                        u.amt > 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {formatCurrency(Math.abs(u.amt))}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Saldo: {formatCurrency(u.balance)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
