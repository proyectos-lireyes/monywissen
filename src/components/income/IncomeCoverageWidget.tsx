import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateStr, todayStr, calculateIncomeCoverageAnalysis } from '../../utils/financialEngine';
import { ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Calendar, CreditCard, DollarSign, Wallet, ArrowRight, Info } from 'lucide-react';
import { IncomePeriodCoverage } from '../../types';

interface IncomeCoverageWidgetProps {
  compact?: boolean;
  selectedMonth?: number; // 0-indexed month (0 = Jan)
  selectedYear?: number;
}

export const IncomeCoverageWidget: React.FC<IncomeCoverageWidgetProps> = ({ 
  compact = false,
  selectedMonth,
  selectedYear
}) => {
  const { profile, exchangeRates } = useApp();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const today = todayStr();

  // Run income coverage analysis
  const periods = useMemo(() => {
    return calculateIncomeCoverageAnalysis(profile, exchangeRates);
  }, [profile, exchangeRates]);

  // Find the index of the active period based on selectedMonth/Year or today
  const activePeriodIndex = useMemo(() => {
    if (!periods || periods.length === 0) return 0;

    if (selectedMonth !== undefined && selectedYear !== undefined) {
      const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      // Find period whose incomeDate starts in this month or spans into this month
      const idx = periods.findIndex(p => {
        if (p.incomeDate.startsWith(monthPrefix)) return true;
        if (p.nextIncomeDate && p.incomeDate <= `${monthPrefix}-31` && p.nextIncomeDate >= `${monthPrefix}-01`) {
          return true;
        }
        return false;
      });
      if (idx !== -1) return idx;
    }
    
    // Fallback: find first period where nextIncomeDate >= today or incomeDate >= today
    const idx = periods.findIndex((p) => {
      if (p.nextIncomeDate) {
        return p.incomeDate <= today && p.nextIncomeDate >= today;
      }
      return p.incomeDate >= today;
    });

    return idx !== -1 ? idx : 0;
  }, [periods, today, selectedMonth, selectedYear]);

  // Sync selectedIndex when selectedMonth / selectedYear or periods change
  useEffect(() => {
    setSelectedIndex(activePeriodIndex);
  }, [activePeriodIndex]);

  // Keep selectedIndex in bounds
  const activeIndex = selectedIndex < periods.length ? selectedIndex : 0;
  const currentPeriod: IncomePeriodCoverage | undefined = periods[activeIndex];

  if (!periods || periods.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs text-center py-6">
        <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Sin Ingresos Registrados</p>
        <p className="text-[11px] text-slate-400 mt-1">Registra al menos un ingreso fijo para calcular si cubre tus gastos entre fechas de pago.</p>
      </div>
    );
  }

  if (!currentPeriod) return null;

  const isCovered = currentPeriod.isCoveredByIncome;
  const isCoveredWithBal = currentPeriod.isCoveredWithBalance;
  const isDeficit = !isCoveredWithBal;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Header & Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${
            isCovered 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
              : isCoveredWithBal
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
          }`}>
            {isCovered ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Cobertura entre Ingresos
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Análisis de suficiencia del ingreso hasta el siguiente pago
            </p>
          </div>
        </div>

        {/* Cycle Dropdown if multiple periods exist */}
        {periods.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="bg-transparent text-xs font-extrabold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              {periods.map((p, idx) => (
                <option key={p.incomeDate + idx} value={idx}>
                  Cycle: {formatDateStr(p.incomeDate)} ➔ {p.nextIncomeDate ? formatDateStr(p.nextIncomeDate) : 'Fin de Plan'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Income Card */}
        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            📥 Ingreso del Ciclo
          </span>
          <p className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {formatCurrency(currentPeriod.totalIncomeAmount)}
          </p>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 truncate mt-0.5 font-medium">
            {currentPeriod.incomeNames.join(', ')} ({formatDateStr(currentPeriod.incomeDate)})
          </p>
        </div>

        {/* Expenses Required Card */}
        <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            💸 Gastos a Cubrir
          </span>
          <p className="text-base font-black text-slate-800 dark:text-slate-100 mt-1">
            {formatCurrency(currentPeriod.totalEgresos)}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
            <span>Fijos: {formatCurrency(currentPeriod.totalGastosFijos)}</span>
            <span>•</span>
            <span>Deudas: {formatCurrency(currentPeriod.totalDeudas)}</span>
          </div>
        </div>

        {/* Result / Surplus / Deficit Card */}
        <div className={`p-3 border rounded-2xl ${
          isCovered
            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
            : isCoveredWithBal
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
            : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
        }`}>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
            isCovered ? 'text-emerald-600 dark:text-emerald-400' : isCoveredWithBal ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isCovered ? '✅ Excedente Libre' : isCoveredWithBal ? '🟡 Cobertura con Saldo' : '🚨 Faltante / Déficit'}
          </span>
          <p className={`text-base font-black mt-1 ${
            isCovered ? 'text-emerald-700 dark:text-emerald-300' : isCoveredWithBal ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300'
          }`}>
            {isCovered 
              ? `+${formatCurrency(currentPeriod.surplusIncome)}`
              : isCoveredWithBal
              ? `+${formatCurrency(currentPeriod.surplusTotal)} (con saldo)`
              : `-${formatCurrency(currentPeriod.shortfallTotal)}`}
          </p>
          <p className={`text-[10px] font-bold mt-0.5 ${
            isCovered ? 'text-emerald-600 dark:text-emerald-400' : isCoveredWithBal ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            Cobertura Directa: {currentPeriod.incomeCoveragePct}%
          </p>
        </div>
      </div>

      {/* Progress Gauge Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
          <span>Capacidad del Ingreso ({currentPeriod.incomeCoveragePct}%)</span>
          <span>Siguiente Pago: {currentPeriod.nextIncomeDate ? formatDateStr(currentPeriod.nextIncomeDate) : 'Fin de Periodo'}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isCovered
                ? 'bg-emerald-500'
                : isCoveredWithBal
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(currentPeriod.incomeCoveragePct, 100)}%` }}
          />
        </div>
      </div>

      {/* Natural Language Verdict Banner */}
      <div className={`p-3.5 rounded-2xl text-xs font-medium border ${
        isCovered
          ? 'bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
          : isCoveredWithBal
          ? 'bg-amber-500/10 border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
          : 'bg-rose-500/10 border-rose-200/60 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
      }`}>
        {isCovered ? (
          <p>
            <strong>✅ Ingreso Suficiente:</strong> Tu ingreso de <strong>{formatCurrency(currentPeriod.totalIncomeAmount)}</strong> del {formatDateStr(currentPeriod.incomeDate)} cubre con holgura los <strong>{formatCurrency(currentPeriod.totalEgresos)}</strong> requeridos hasta el próximo ingreso ({currentPeriod.nextIncomeDate ? formatDateStr(currentPeriod.nextIncomeDate) : 'fin de periodo'}). Te quedan <strong>{formatCurrency(currentPeriod.surplusIncome)}</strong> disponibles.
          </p>
        ) : isCoveredWithBal ? (
          <p>
            <strong>🟡 Cubierto con Saldo Acumulado:</strong> Tu ingreso directo de <strong>{formatCurrency(currentPeriod.totalIncomeAmount)}</strong> solo cubre el {currentPeriod.incomeCoveragePct}% de los <strong>{formatCurrency(currentPeriod.totalEgresos)}</strong> del ciclo. Sin embargo, combinándolo con tu saldo previo disponible (<strong>{formatCurrency(currentPeriod.balanceBeforeIncome)}</strong>), logras cubrir todos los compromisos antes del próximo pago.
          </p>
        ) : (
          <p>
            <strong>🚨 Alerta de Déficit:</strong> Tu ingreso de <strong>{formatCurrency(currentPeriod.totalIncomeAmount)}</strong> es insuficiente para los <strong>{formatCurrency(currentPeriod.totalEgresos)}</strong> requeridos antes del próximo ingreso ({currentPeriod.nextIncomeDate ? formatDateStr(currentPeriod.nextIncomeDate) : 'fin de periodo'}). Te faltarán <strong>{formatCurrency(currentPeriod.shortfallTotal)}</strong>.
            {currentPeriod.outOfMoneyDate && (
              <span className="block mt-1 font-bold text-rose-700 dark:text-rose-300">
                ⚠️ Se proyecta que te quedarás sin liquidez el día {formatDateStr(currentPeriod.outOfMoneyDate)}.
              </span>
            )}
          </p>
        )}
      </div>

      {/* Accordion Toggle for Detailed Items */}
      {!compact && (
        <div className="pt-1">
          <button
            onClick={() => setShowDetails(prev => !prev)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              Ver los {currentPeriod.itemsInPeriod.length} compromisos de este ciclo ({formatDateStr(currentPeriod.incomeDate)} al {currentPeriod.nextIncomeDate ? formatDateStr(currentPeriod.nextIncomeDate) : 'fin'})
            </span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-2.5 space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {currentPeriod.itemsInPeriod.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-2 text-center">No hay gastos programados en este ciclo.</p>
              ) : (
                currentPeriod.itemsInPeriod.map((item, idx) => (
                  <div
                    key={(item.ref?.id || 'item') + '_' + (item.targetDate || item.date || item.originalDate) + '_' + idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {item.label}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {formatDateStr(item.targetDate || item.date || item.originalDate)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {item.type === 'expense' ? 'Gasto Fijo' : item.type === 'debt' ? 'Cuota Deuda' : 'Ahorro'}
                      </span>
                    </div>

                    <span className="font-black text-rose-600 dark:text-rose-400">
                      -{formatCurrency(Math.abs(item.amt))}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
