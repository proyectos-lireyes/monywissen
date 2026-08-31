import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  formatDateStr,
  todayStr,
  datesBetween,
  calculateProjections,
  getRemainingDebtAmount,
} from '../../utils/financialEngine';
import {
  TrendingUp,
  X,
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
  Calendar,
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
  const { profile, updateProfileData, showToast, setActiveView, integrityReport, exchangeRates, convertAmount } = useApp();
  const [chartMode, setChartMode] = useState<number>(profile.settings.defaultChart || 4); // 0: Composed, 1: Bar, 2: Pie
  const [showBalanceLine, setShowBalanceLine] = useState(true);
  const [showFlowLines, setShowFlowLines] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const toggleLine = (dataKey: string) => {
    setHiddenLines(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };
  const [adjustmentTarget, setAdjustmentTarget] = useState<string>('0');
  const [tempPlanStart, setTempPlanStart] = useState(profile.settings.planStart);
  const [tempOpeningBalanceStr, setTempOpeningBalanceStr] = useState(String(profile.settings.openingBalance || 0));

  const plan = calculateProjections(profile, exchangeRates);
  const [pinnedTooltip, setPinnedTooltip] = useState<any>(null);
  const [periodDetails, setPeriodDetails] = useState<any>(null);

  const handleAcceptOptimization = async (opt: any) => {
    const key = `${opt.itemType}_${opt.itemId}_${opt.originalDate}`;
    
    updateProfileData(draft => {
      if (!draft.overrides) draft.overrides = {};
      draft.overrides[key] = {
        ...(draft.overrides[key] || {}),
        actualDate: opt.suggestedDate,
        userPostponed: true,
      };
    });
    
    showToast(`Fecha optimizada al ${opt.suggestedDate}`, 'success');
  };

  const today = todayStr();

  // Find balance for today
  let todayBalance = 0;
  let projectedToday = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let criticalAlert: { date: string; reason: string } | null = null;
  const delayedItems: any[] = [];

  plan.forEach(e => { if(!e) return;
    if (e.done) todayBalance += e?.amt;
    if (e.date <= today) projectedToday += e?.amt;
    
    if (e?.amt > 0 && e.type !== 'compensation' && e.type !== 'opening_balance') totalIncome += e?.amt;
    if (e?.amt < 0 && e.type !== 'savings') totalExpense += Math.abs(e?.amt);
    if (e.criticalDelay && !criticalAlert) criticalAlert = { date: e.date, reason: e.label };
    if (e.isDelayed && e.date >= today && !e.criticalDelay) delayedItems.push(e);
  });

  const lastOccurrence = plan[plan.length - 1];
  const projectedBalance = lastOccurrence ? lastOccurrence.balance : (plan.length > 0 ? plan[0].balance : (profile.settings.openingBalance || 0));
  const totalDebt = (profile.debts || []).reduce((acc, d) => acc + convertAmount(getRemainingDebtAmount(d, profile.overrides, exchangeRates), d.currency), 0);

  // Prepare Recharts Data
  const chartDataMap: Record<string, { date: string; label: string; balance: number; income: number; expense: number; debt: number; totalEgresos: number; netAvailable: number; items: any[]; optimizedAdelantados?: number; optimizedAtrasados?: number; deficit?: number; plannedIncome: number; plannedEgresos: number; plannedNetFlow?: number;
  rescates?: number; }> = {};

  // Initialize all dates in range
  const allDates = datesBetween(profile.settings.planStart, profile.settings.planEnd);
  allDates.forEach(d => {
    chartDataMap[d] = {
      date: d,
      label: formatDateStr(d).substring(0, 5),
      balance: plan.length > 0 ? plan[0].balance : (profile.settings.openingBalance || 0), // Will be overridden
      income: 0,
      expense: 0,
      optimizedAdelantados: 0,
      optimizedAtrasados: 0,
      deficit: 0, debt: 0, rescates: 0,
      totalEgresos: 0,
      netAvailable: 0,
      plannedIncome: 0,
      plannedEgresos: 0,
      items: [],
    };
  });

  let runningBalance = plan.length > 0 ? plan[0].balance : (profile.settings.openingBalance || 0);

  plan.forEach(e => { if(!e) return;
    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      if (!chartDataMap[e.date]) {
        chartDataMap[e.date] = {
          date: e.date,
          label: formatDateStr(e.date).substring(0, 5),
          balance: e.balance,
          income: 0,
          expense: 0,
          optimizedAdelantados: 0,
          optimizedAtrasados: 0,
          deficit: 0, debt: 0, rescates: 0,
          totalEgresos: 0,
          netAvailable: 0,
          plannedIncome: 0,
          plannedEgresos: 0,
          items: [],
        };
      }
      if (e?.amt > 0 && (e.type === 'income')) chartDataMap[e.date].income += e?.amt;
      if (e.type === 'rescate_ahorros') chartDataMap[e.date].rescates = (chartDataMap[e.date].rescates || 0) + e?.amt;
      if (e?.amt < 0 && e.type === 'expense') chartDataMap[e.date].expense += Math.abs(e?.amt);
      if (e?.amt < 0 && (e.type === 'debt' )) chartDataMap[e.date].debt += Math.abs(e?.amt);
      chartDataMap[e.date].balance = e.balance;
      runningBalance = e.balance;
      chartDataMap[e.date].items.push(e);
    }
    // Also track planned (original) amounts
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      if (!chartDataMap[e.originalDate]) {
        chartDataMap[e.originalDate] = {
           date: e.originalDate,
           label: e.originalDate.substring(5, 10),
           balance: 0,
           income: 0, expense: 0, optimizedAdelantados: 0, optimizedAtrasados: 0, deficit: 0, debt: 0, rescates: 0, totalEgresos: 0, netAvailable: 0, plannedIncome: 0, plannedEgresos: 0, items: []
        };
      }
      if (e?.amt > 0 && (e.type === 'income')) {
         chartDataMap[e.originalDate].plannedIncome = (chartDataMap[e.originalDate].plannedIncome || 0) + e?.amt;
      }
      if (e?.amt < 0 && (e.type === 'expense' || e.type === 'debt')) {
         chartDataMap[e.originalDate].plannedEgresos = (chartDataMap[e.originalDate].plannedEgresos || 0) + Math.abs(e?.amt);
      }
    }
  });
  
  // Backfill balances for days with no events
  let lastBal = 0;
  allDates.forEach(d => {
    if (chartDataMap[d].items.length > 0) {
      lastBal = chartDataMap[d].balance;
    } else {
      chartDataMap[d].balance = lastBal;
    }
  });

  Object.values(chartDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; d.plannedNetFlow = (d.plannedIncome || 0) - (d.plannedEgresos || 0); });

  Object.values(chartDataMap).forEach((d: any) => {
    d.totalEgresos = d.expense + d.debt;
    d.preIncomeBalance = d.balance - d.income;
  });
  const chartData = Object.values(chartDataMap);

  // Monthly Aggregation Data
  

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-lg min-w-[200px]">
        <p className="font-bold text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">{label}</p>
        
        {payload.map((entry: any, index: number) => {
          let name = entry.name;
          if (name.includes('Flujo Neto')) name = 'Flujo del Período';
          if (name.includes('Eje')) name = name.replace(' (Eje Izq.)', '').replace(' (Eje Der.)', '');
          return (
          <div key={`item-${index}`} className="flex justify-between items-center text-xs mb-1" style={{ color: entry.color }}>
            <span className="font-semibold">{name}:</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.value)}</span>
          </div>
        )})}
        <div className="flex justify-between items-center text-xs mb-1 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800" style={{ color: '#3b82f6' }}>
          <span className="font-bold">Liquidez Final del Día (Saldo):</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.balance)}</span>
        </div>
        <div className="flex justify-between items-center text-xs mb-1 pt-1" style={{ color: '#0ea5e9' }}>
          <span className="font-bold">Ahorros Totales:</span>
          <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.savingsAccumulated || 0)}</span>
        </div>
        
        <div className="mt-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-2 rounded-lg text-center">
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">👆 Haz clic en la gráfica</p>
          <p className="text-[9px] text-blue-500/80 dark:text-blue-400/80 mt-0.5 leading-tight">(Haz clic en el punto azul, no en este recuadro)</p>
        </div>
      </div>
    );
  }
  return null;
};


const getWeekStart = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  const m = d.getUTCMonth() + 1;
  const da = d.getUTCDate();
  return `${d.getUTCFullYear()}-${m < 10 ? '0'+m : m}-${da < 10 ? '0'+da : da}`;
};

  // Biweekly Aggregation Data
  const getBiweeklyStart = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00Z');
    const m = d.getUTCMonth() + 1;
    const da = d.getUTCDate();
    const period = da <= 15 ? '01-15' : '16-31';
    return `${d.getUTCFullYear()}-${m < 10 ? '0'+m : m}-${period}`;
  };

  const biweeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; rescates?: number; savingsAccumulated?: number; totalEgresos?: number; netAvailable?: number; items: any[]; balance?: number; optimizedAdelantados?: number; optimizedAtrasados?: number; deficit?: number; plannedIncome?: number; plannedEgresos?: number; plannedNetFlow?: number; }> = {};
  plan.forEach(e => { if(!e) return;
    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      const prefix = getBiweeklyStart(e.date);
      if (!biweeklyDataMap[prefix]) {
        biweeklyDataMap[prefix] = {
          label: prefix.substring(5),
          income: 0,
          expense: 0,
          optimizedAdelantados: 0,
          optimizedAtrasados: 0,
          deficit: 0, debt: 0, rescates: 0,
          totalEgresos: 0,
          netAvailable: 0,
          plannedIncome: 0,
          plannedEgresos: 0,
          items: [],
        };
      }
      if (e?.amt > 0 && (e.type === 'income')) biweeklyDataMap[prefix].income += e?.amt;
      if (e.type === 'rescate_ahorros') biweeklyDataMap[prefix].rescates = (biweeklyDataMap[prefix].rescates || 0) + e?.amt;
      if (e?.amt < 0 && e.type === 'expense') biweeklyDataMap[prefix].expense += Math.abs(e?.amt);
      if (e?.amt < 0 && (e.type === 'debt' )) biweeklyDataMap[prefix].debt += Math.abs(e?.amt);
      biweeklyDataMap[prefix].items.push(e);
      if (e.pulledEarly) biweeklyDataMap[prefix].optimizedAdelantados += Math.abs(e?.amt);
      if (e.isDelayed && !e.insufficientFunds) biweeklyDataMap[prefix].optimizedAtrasados += Math.abs(e?.amt);
      if (e.insufficientFunds && e?.amt < 0) biweeklyDataMap[prefix].deficit += Math.abs(e?.amt);
      biweeklyDataMap[prefix].balance = e.balance;
      biweeklyDataMap[prefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origBiweekPrefix = getBiweeklyStart(e.originalDate);
      if (!biweeklyDataMap[origBiweekPrefix]) {
        biweeklyDataMap[origBiweekPrefix] = {
          label: origBiweekPrefix.substring(5),
          income: 0, expense: 0, optimizedAdelantados: 0, optimizedAtrasados: 0, deficit: 0, debt: 0, rescates: 0, totalEgresos: 0, netAvailable: 0, plannedIncome: 0, plannedEgresos: 0, items: [],
        };
      }
      if (e?.amt > 0 && (e.type === 'income')) biweeklyDataMap[origBiweekPrefix].plannedIncome = (biweeklyDataMap[origBiweekPrefix].plannedIncome || 0) + e?.amt;
      if (e?.amt < 0 && (e.type === 'expense' || e.type === 'debt')) biweeklyDataMap[origBiweekPrefix].plannedEgresos = (biweeklyDataMap[origBiweekPrefix].plannedEgresos || 0) + Math.abs(e?.amt);
    }
  });
  Object.values(biweeklyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; d.plannedNetFlow = (d.plannedIncome || 0) - (d.plannedEgresos || 0); });
  const biweeklyData = Object.values(biweeklyDataMap);

  // Weekly Aggregation Data
  const weeklyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; rescates?: number; savingsAccumulated?: number; totalEgresos?: number; netAvailable?: number; items: any[]; balance?: number; optimizedAdelantados?: number; optimizedAtrasados?: number; deficit?: number; plannedIncome?: number; plannedEgresos?: number; plannedNetFlow?: number; }> = {};
  plan.forEach(e => { if(!e) return;
    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      const weekPrefix = getWeekStart(e.date);
      if (!weeklyDataMap[weekPrefix]) {
        weeklyDataMap[weekPrefix] = {
          label: weekPrefix.substring(5,10),
          income: 0,
          expense: 0,
          optimizedAdelantados: 0,
          optimizedAtrasados: 0,
          deficit: 0, debt: 0, rescates: 0,
          totalEgresos: 0,
          netAvailable: 0,
          plannedIncome: 0,
          plannedEgresos: 0,
          items: [],
        };
      }
      if (e?.amt > 0 && (e.type === 'income')) weeklyDataMap[weekPrefix].income += e?.amt;
      if (e.type === 'rescate_ahorros') weeklyDataMap[weekPrefix].rescates = (weeklyDataMap[weekPrefix].rescates || 0) + e?.amt;
      if (e?.amt < 0 && e.type === 'expense') weeklyDataMap[weekPrefix].expense += Math.abs(e?.amt);
      if (e?.amt < 0 && (e.type === 'debt' )) weeklyDataMap[weekPrefix].debt += Math.abs(e?.amt);
      weeklyDataMap[weekPrefix].items.push(e);
      if (e.pulledEarly) weeklyDataMap[weekPrefix].optimizedAdelantados += Math.abs(e?.amt);
      if (e.isDelayed && !e.insufficientFunds) weeklyDataMap[weekPrefix].optimizedAtrasados += Math.abs(e?.amt);
      if (e.insufficientFunds && e?.amt < 0) weeklyDataMap[weekPrefix].deficit += Math.abs(e?.amt);
      weeklyDataMap[weekPrefix].balance = e.balance; // Keep last balance of the week
      weeklyDataMap[weekPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origWeekPrefix = getWeekStart(e.originalDate);
      if (!weeklyDataMap[origWeekPrefix]) {
        weeklyDataMap[origWeekPrefix] = {
          label: origWeekPrefix.substring(5,10),
          income: 0, expense: 0, optimizedAdelantados: 0, optimizedAtrasados: 0, deficit: 0, debt: 0, rescates: 0, totalEgresos: 0, netAvailable: 0, plannedIncome: 0, plannedEgresos: 0, items: [],
        };
      }
      if (e?.amt > 0 && (e.type === 'income')) weeklyDataMap[origWeekPrefix].plannedIncome = (weeklyDataMap[origWeekPrefix].plannedIncome || 0) + e?.amt;
      if (e?.amt < 0 && (e.type === 'expense' || e.type === 'debt')) weeklyDataMap[origWeekPrefix].plannedEgresos = (weeklyDataMap[origWeekPrefix].plannedEgresos || 0) + Math.abs(e?.amt);
    }
  });
  Object.values(weeklyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; d.plannedNetFlow = (d.plannedIncome || 0) - (d.plannedEgresos || 0); });
  const weeklyData = Object.values(weeklyDataMap);

  const monthlyDataMap: Record<string, { label: string; income: number; expense: number; debt: number; rescates?: number; savingsAccumulated?: number; totalEgresos?: number; netAvailable?: number; items: any[]; balance?: number; optimizedAdelantados?: number; optimizedAtrasados?: number; deficit?: number; plannedIncome?: number; plannedEgresos?: number; plannedNetFlow?: number; }> = {};
  plan.forEach(e => { if(!e) return;
    if (e.date >= profile.settings.planStart && e.date <= profile.settings.planEnd) {
      const monthPrefix = e.date.substring(0, 7); // YYYY-MM
      if (!monthlyDataMap[monthPrefix]) {
        monthlyDataMap[monthPrefix] = {
          label: monthPrefix,
          income: 0,
          expense: 0,
          optimizedAdelantados: 0,
          optimizedAtrasados: 0,
          deficit: 0, debt: 0, rescates: 0,
          totalEgresos: 0,
          netAvailable: 0,
          plannedIncome: 0,
          plannedEgresos: 0,
          items: [],
        };
      }
      if (e?.amt > 0 && (e.type === 'income')) monthlyDataMap[monthPrefix].income += e?.amt;
      if (e.type === 'rescate_ahorros') monthlyDataMap[monthPrefix].rescates = (monthlyDataMap[monthPrefix].rescates || 0) + e?.amt;
      if (e?.amt < 0 && e.type === 'expense') monthlyDataMap[monthPrefix].expense += Math.abs(e?.amt);
      if (e?.amt < 0 && (e.type === 'debt' )) monthlyDataMap[monthPrefix].debt += Math.abs(e?.amt);
      monthlyDataMap[monthPrefix].items.push(e);
      if (e.pulledEarly) monthlyDataMap[monthPrefix].optimizedAdelantados += Math.abs(e?.amt);
      if (e.isDelayed && !e.insufficientFunds) monthlyDataMap[monthPrefix].optimizedAtrasados += Math.abs(e?.amt);
      if (e.insufficientFunds && e?.amt < 0) monthlyDataMap[monthPrefix].deficit += Math.abs(e?.amt);
      monthlyDataMap[monthPrefix].balance = e.balance;
      monthlyDataMap[monthPrefix].savingsAccumulated = e.savingsAccumulated || 0;
    }
    if (e.originalDate >= profile.settings.planStart && e.originalDate <= profile.settings.planEnd) {
      const origMonthPrefix = e.originalDate.substring(0, 7);
      if (!monthlyDataMap[origMonthPrefix]) {
        monthlyDataMap[origMonthPrefix] = {
          label: origMonthPrefix,
          income: 0, expense: 0, optimizedAdelantados: 0, optimizedAtrasados: 0, deficit: 0, debt: 0, rescates: 0, totalEgresos: 0, netAvailable: 0, plannedIncome: 0, plannedEgresos: 0, items: [],
        };
      }
      if (e?.amt > 0 && (e.type === 'income')) monthlyDataMap[origMonthPrefix].plannedIncome = (monthlyDataMap[origMonthPrefix].plannedIncome || 0) + e?.amt;
      if (e?.amt < 0 && (e.type === 'expense' || e.type === 'debt')) monthlyDataMap[origMonthPrefix].plannedEgresos = (monthlyDataMap[origMonthPrefix].plannedEgresos || 0) + Math.abs(e?.amt);
    }
  });
  Object.values(monthlyDataMap).forEach(d => { d.totalEgresos = d.expense + d.debt; d.netAvailable = d.income - d.totalEgresos; d.plannedNetFlow = (d.plannedIncome || 0) - (d.plannedEgresos || 0); });
  const monthlyData = Object.values(monthlyDataMap);

  // Net Cash Flow monthly breakdown for chart
  const netFlowMonthlyData = monthlyData.map(m => {
    const net = m.income - (m.expense + m.debt);
    return {
      label: m.label,
      netFlow: net,
      income: m.income,
      expense: m.expense + m.debt,
      rescates: m.rescates,
      items: m.items,
      balance: m.balance,
      savingsAccumulated: m.savingsAccumulated,
    };
  });

  // Pie chart categories distribution
  const pieCategories: Record<string, number> = {};
  plan.forEach(e => { if(!e) return;
    if (e?.amt < 0) {
      if (e.type === 'debt' && e.done) return;
      let cat = 'Deudas';
      if (e.type === 'expense') {
        cat = 'Gastos Fijos';
      } else if (e.type === 'savings') {
        cat = 'Ahorros';
      } else if (e.type === 'debt') {
        cat = e.ref?.name || 'Deudas';
      }
      pieCategories[cat] = (pieCategories[cat] || 0) + Math.abs(e?.amt);
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
                El pago "{criticalAlert.reason}" {(profile.settings.minBalance || 0) > 0 ? 'rompe tu colchón de seguridad' : 'genera un saldo negativo'} el {formatDateStr(criticalAlert.date)}.
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {profile.settings.planStart > today ? 'Saldo Disponible (Inicio del Plan)' : 'Saldo Disponible (Hoy)'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight mt-1">
              {formatCurrency(todayBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Colchón Mínimo: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(profile.settings.minBalance || 0)}</span>
              <span className="mx-2">•</span>
              Proyectado: <span className="font-semibold text-slate-700 dark:text-slate-300" title="Saldo si todos los movimientos hasta hoy estuvieran marcados como pagados">{formatCurrency(projectedToday)}</span>
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

        
        
        {/* Deficit Alert Banner */}
        {(() => {
          const criticalDeficits = plan.filter(e => e.balance < 0 && chartDataMap[e.date]?.balance < 0 && e?.amt < 0 && !e.done);
          if (criticalDeficits.length === 0) return null;
          
          const uniqueDeficits = Array.from(new Map(criticalDeficits.map(item => [item.ref?.id, item])).values());
          
          return (
            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-3xl border border-rose-200 dark:border-rose-800/40 shadow-sm mt-4">
              <div className="flex items-start gap-3">
                <div className="bg-rose-100 dark:bg-rose-900/50 p-2 rounded-full shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600 dark:text-rose-400">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                    Alerta de Quiebre (Saldo menor a $0)
                  </h3>
                  <p className="text-xs text-rose-800 dark:text-rose-200/80 leading-relaxed">
                    El sistema detectó que tu <strong className="font-black">Saldo Acumulado (Disponible)</strong> caerá por debajo de cero. El Auto-Piloto no pudo reprogramar los siguientes gastos fijos (o faltan ingresos futuros). Considera <strong>reducirlos o eliminarlos</strong>:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {uniqueDeficits.map((opt: any, idx: number) => (
                      <div key={idx} 
                           onClick={() => onOpenDetails && opt.type !== 'opening_balance' && onOpenDetails(opt.type, opt.ref?.id, opt.originalDate, opt.date)}
                           className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-800/30 flex flex-col gap-1 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{opt.label}</span>
                          <span className="text-xs font-black text-rose-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(opt?.amt || 0))}</span>
                        </div>
                        <span className="text-[10px] text-rose-500 font-semibold text-right">
                           Quiebre: {opt.date} (Bal: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(opt.balance)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Projection Chart Header */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Proyección Visual
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setChartMode(5)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartMode === 5
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Quincenal
              </button>
              <button
                onClick={() => setChartMode(4)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartMode === 4
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Semanal
              </button>
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
            <button
              onClick={() => {
                updateProfileData(draft => { /* Force trigger re-render */ });
                showToast('Recalculando proyecciones...');
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Recalcular
            </button>
          </div>

          {/* Recharts Canvas */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const activeData = chartMode === 5 ? chartData : chartMode === 4 ? weeklyData : chartMode === 3 ? biweeklyData : (chartMode === 2 || chartMode === 1) ? monthlyData : chartData;
                return (
                  <ComposedChart data={activeData.map((d: any) => ({ ...d, preIncomeBalance: (d.balance || 0) - (d.income || 0), totalEgresos: (d.expense || 0) + (d.debt || 0) })) as any} onClick={(e) => { if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
                    <Legend onClick={(e) => toggleLine(e.dataKey as string)} wrapperStyle={{ fontSize: '11px', paddingTop: '4px', cursor: 'pointer' }} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="left" />
                    
                    <Bar hide={hiddenLines["deficit"]} dataKey="deficit" stackId="opt" yAxisId="left" fill="#991b1b" name="Déficit (Alerta)" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["rescates"]} dataKey="rescates" stackId="opt" yAxisId="left" fill="#0ea5e9" name="Rescate de Ahorros" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAdelantados"]} dataKey="optimizedAdelantados" stackId="opt" yAxisId="left" fill="#059669" name="Optimizados (Adelantados)" barSize={12} radius={[4,4,0,0]} />
                    <Bar hide={hiddenLines["optimizedAtrasados"]} dataKey="optimizedAtrasados" stackId="opt" yAxisId="left" fill="#d97706" name="Optimizados (Atrasados)" barSize={12} radius={[4,4,0,0]} />
                    
                    <Line hide={hiddenLines["income"]} type="monotone" dataKey="income" yAxisId="left" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["totalEgresos"]} type="monotone" dataKey="totalEgresos" yAxisId="left" name="Egresos (Gastos+Deudas)" stroke="#f43f5e" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                    <Line hide={hiddenLines["balance"]} type="monotone" dataKey="balance" yAxisId="left" name="Liquidez Final del Día" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                  </ComposedChart>
                );
              })()}
            </ResponsiveContainer>
          </div>
          
          <div className="h-40 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Acumulación de Ahorros</h4>
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const activeData = chartMode === 5 ? chartData : chartMode === 4 ? weeklyData : chartMode === 3 ? biweeklyData : (chartMode === 2 || chartMode === 1) ? monthlyData : chartData;
                return (
                  <ComposedChart data={activeData as any} onClick={(e) => { if (e && (e as any).activePayload && (e as any).activePayload[0]) setPeriodDetails((e as any).activePayload[0].payload); }}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#0ea5e9" fontSize={10} tickFormatter={val => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
                    <Line type="monotone" dataKey="savingsAccumulated" name="Ahorros" stroke="#0ea5e9" strokeWidth={2} dot={chartMode !== 0} activeDot={{ onClick: (props: any, e: any) => { if (e && e.stopPropagation) e.stopPropagation(); setPeriodDetails(props.payload); }, cursor: 'pointer', r: 6 }} />
                  </ComposedChart>
                );
              })()}
            </ResponsiveContainer>
                        </div>
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
                  onClick={() => { if (u.type !== 'opening_balance') onOpenDetails(u.type, u.ref.id, u.originalDate, u.date); }}
                  style={(!isOverdue && u.ref?.effectiveColor) ? {
                    borderLeftColor: u.ref.effectiveColor,
                    borderLeftWidth: '4px'
                  } : {}}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isOverdue
                      ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40'
                      : (!u.ref?.effectiveColor ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:border-slate-300' : 'bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800')
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
                    {/* Saldo oculto */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Configurar Inicio de Plan
              </h2>
              <button 
                onClick={() => setShowSetupModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                  Modificar estos valores <strong>no afectará</strong> el historial de tus deudas, ahorros, ni los pagos ya realizados. Solo recalcula tu proyección de saldo a partir de esta fecha base.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha de Inicio del Plan</label>
                     <button 
                        onClick={() => {
                           setTempPlanStart(today);
                        }}
                        className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold hover:bg-blue-200 transition-colors"
                     >
                        Usar Hoy
                     </button>
                  </div>
                  <input
                    type="date"
                    value={tempPlanStart}
                    onChange={(e) => {
                      setTempPlanStart(e.target.value);
                      setTempOpeningBalanceStr('0');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Al cambiar la fecha, el saldo se reinicia a 0 para que ingreses el saldo real de esa nueva fecha.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dinero Disponible (Saldo Base)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempOpeningBalanceStr}
                      onChange={(e) => setTempOpeningBalanceStr(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Déjalo vacío (0) para que el sistema calcule el monto necesario para cubrir gastos previos a tu primer ingreso.</p>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  updateProfileData(draft => {
                    draft.settings.planStart = tempPlanStart;
                    draft.settings.openingBalance = parseFloat(tempOpeningBalanceStr) || 0;
                    
                    // Clear past compensations just in case
                    if (draft.overrides) {
                      Object.keys(draft.overrides).forEach(k => {
                        if (k.startsWith('comp_')) {
                          delete draft.overrides[k];
                        }
                      });
                    }
                  });
                  setShowSetupModal(false);
                  showToast('Inicio de plan actualizado correctamente', '✅');
                }}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm hover:shadow-md"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
                Ajuste Automático de Saldo
              </h2>
              <button 
                onClick={() => setShowAdjustmentModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex gap-3">
                <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">
                  El sistema calculará la diferencia e inyectará una transacción única (ingreso o gasto) con fecha de hoy para que tu saldo disponible cuadre exactamente con lo que tienes en el bolsillo, conservando el historial.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Saldo Real Hoy</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={adjustmentTarget}
                      onChange={(e) => setAdjustmentTarget(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="Ej. 1.00"
                      step="0.01"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-500">Saldo Actual del Sistema:</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(todayBalance)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const targetNum = parseFloat(adjustmentTarget) || 0;
                  const diff = targetNum - todayBalance;
                  
                  if (Math.abs(diff) < 0.01) {
                     showToast('El saldo ya coincide', '👌');
                     setShowAdjustmentModal(false);
                     return;
                  }

                  updateProfileData(draft => {
                    const idTimestamp = Date.now();
                    if (diff > 0) {
                       const newId = `inc_adj_${idTimestamp}`;
                       draft.incomes.push({
                         id: newId,
                         name: 'Ajuste de Saldo (A Favor)',
                         amount: diff.toString(),
                         freq: 'one-time',
                         date: today,
                         currency: 'USD_BCV',
                       });
                       draft.overrides = draft.overrides || {};
                       draft.overrides[`income_${newId}_${today}`] = { done: true };
                    } else {
                       const newId = `exp_adj_${idTimestamp}`;
                       draft.expenses.push({
                         id: newId,
                         name: 'Ajuste de Saldo (En Contra)',
                         amount: Math.abs(diff).toString(),
                         freq: 'one-time',
                         date: today,
                         currency: 'USD_BCV',
                       });
                       draft.overrides = draft.overrides || {};
                       draft.overrides[`expense_${newId}_${today}`] = { done: true };
                    }
                  });
                  setShowAdjustmentModal(false);
                  showToast(`Ajuste de ${formatCurrency(Math.abs(diff))} inyectado`, '🪄');
                }}
                className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm hover:shadow-md"
              >
                Inyectar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Period Details Modal */}
      {periodDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Detalles del Período: {periodDetails.label}
              </h2>
              <button
                onClick={() => setPeriodDetails(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Ingresos</span>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(periodDetails.income)}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-2xl border border-rose-100 dark:border-rose-800/30">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Gastos + Deudas</span>
                  <p className="text-lg font-black text-rose-700 dark:text-rose-300">{formatCurrency(periodDetails.expense + periodDetails.debt)}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Transacciones del Período</span>
                {periodDetails.items && periodDetails.items.length > 0 ? (
                  <div className="space-y-2">
                    {periodDetails.items.filter((i: any) => i.type !== 'opening_balance').map((item: any, i: number) => (
                      <div key={i} onClick={() => { if (item.type !== 'opening_balance') { setPeriodDetails(null); onOpenDetails(item.type, item.ref.id, item.originalDate, item.date); } }} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.amt > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' :
                            item.type === 'debt' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' :
                            'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400'
                          }`}>
                            {item.amt > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                            <p className="text-[10px] font-medium text-slate-500">{item.date}</p>
                          </div>
                        </div>
                        <span className={`font-black ${
                          item.amt > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.amt > 0 ? '+' : ''}{formatCurrency(item.amt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">No hay transacciones en este período.</p>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setPeriodDetails(null)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
