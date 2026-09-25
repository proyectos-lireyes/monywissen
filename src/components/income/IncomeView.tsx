import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  todayStr,
  calculateProjections,
  calculateIncomeAccountBalances,
} from '../../utils/financialEngine';
import {
  TrendingUp,
  Plus,
  Trash2,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface IncomeViewProps {
  onOpenCreate: (type: 'income', forceOneTime?: boolean) => void;
  onOpenEdit: (type: 'income', index: number) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({ onOpenCreate, onOpenEdit }) => {
  const { profile, convertAmount, updateProfileData, showToast, exchangeRates } = useApp();
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string; assignedCount: number } | null>(null);

  // Compute projection plan to get up-to-date inflows and outflows per account
  const plan = calculateProjections(profile, exchangeRates);
  const accountBalances = calculateIncomeAccountBalances(profile, plan, convertAmount, todayStr());

  let todayBalanceFromPlan = 0;
  plan.forEach(e => {
    if (!e) return;
    const isOpening = e.type === 'opening_balance';
    const isPastOrToday = e.date <= todayStr() || (e.targetDate && e.targetDate <= todayStr());
    const affectsCash = !e.noAffectBalance;
    if (e.done && affectsCash && (isOpening || isPastOrToday)) {
      todayBalanceFromPlan += e?.amt;
    }
  });

  // Aggregate stats
  const totalAvailableToday = accountBalances.length > 0 
    ? accountBalances.reduce((acc, a) => acc + a.availableToday, 0)
    : todayBalanceFromPlan;
  const totalInflows = accountBalances.reduce((acc, a) => acc + a.totalInflowsToDate, 0);
  const totalOutflows = accountBalances.reduce((acc, a) => acc + a.totalOutflowsToDate, 0);

  const handleDelete = (id: string, name: string) => {
    const assignedCount = (profile.expenses || []).filter(e => e.incomeId === id).length +
      (profile.debts || []).filter(d => d.incomeId === id).length +
      (profile.savingsList || []).filter(s => s.incomeId === id).length;

    setAccountToDelete({ id, name, assignedCount });
  };

  const handleConfirmDelete = () => {
    if (!accountToDelete) return;
    const { id, name } = accountToDelete;

    updateProfileData(draft => {
      draft.incomes = (draft.incomes || []).filter(i => i.id !== id);

      // Cleanly unbind future default incomeId from items
      (draft.expenses || []).forEach(e => {
        if (e.incomeId === id) e.incomeId = undefined;
      });
      (draft.debts || []).forEach(d => {
        if (d.incomeId === id) d.incomeId = undefined;
      });
      (draft.savingsList || []).forEach(s => {
        if (s.incomeId === id) s.incomeId = undefined;
      });
    });
    showToast(`Cuenta "${name}" eliminada`, '🗑️');
    setAccountToDelete(null);
  };

  return (
    <div id="income-accounts-view" className="space-y-5 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            Cuentas de Ingresos
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Cada ingreso funciona como una cuenta independiente con saldo acumulativo tras restar los gastos y pagos que se debitan de ella.
          </p>
        </div>
        <button
          id="btn-new-income-account"
          onClick={() => onOpenCreate('income')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nueva Cuenta / Ingreso
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Disponible Total Hoy
            </span>
            <span className={`text-base font-black ${totalAvailableToday >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(totalAvailableToday)}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Ingresos Recibidos (Acumulado)
            </span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(totalInflows)}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Egresos Pagados (Acumulado)
            </span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(totalOutflows)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Accounts Table & List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Cuentas y Balances Disponibles
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {accountBalances.length} {accountBalances.length === 1 ? 'cuenta' : 'cuentas'}
          </span>
        </div>

        {accountBalances.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No tienes cuentas de ingreso registradas
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Agrega tu sueldo o ingresos recurrentes. Cada uno se convertirá en una cuenta donde podrás asociar tus gastos.
            </p>
            <button
              onClick={() => onOpenCreate('income')}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Agregar Primer Ingreso
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4">Cuenta / Ingreso</th>
                  <th className="py-3 px-4">Monto Recurrente</th>
                  <th className="py-3 px-4 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-black">
                    Disponible Hoy
                  </th>
                  <th className="py-3 px-4">Egresos Asignados</th>
                  <th className="py-3 px-4">Próximo Ingreso</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {accountBalances.map((acc) => {
                  const isRequiredFundAccount = acc.id === 'required_starting_fund';
                  const realIndex = (profile.incomes || []).findIndex(i => i.id === acc.id);
                  const isExpanded = expandedAccountId === acc.id;

                  // Find strictly assigned items to display on demand (no auto-default assignment)
                  const assignedExpenses = (profile.expenses || []).filter(e => e.incomeId === acc.id);
                  const assignedDebts = (profile.debts || []).filter(d => d.incomeId === acc.id);
                  const assignedSavings = (profile.savingsList || []).filter(s => s.incomeId === acc.id);
                  const paidMovements = acc.paidMovements || [];

                  return (
                    <React.Fragment key={acc.id}>
                      <tr className={`transition-colors ${isRequiredFundAccount ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}>
                        <td
                          onClick={() => {
                            if (!isRequiredFundAccount) onOpenEdit('income', realIndex);
                          }}
                          className={`py-3.5 px-4 group ${!isRequiredFundAccount ? 'cursor-pointer' : ''}`}
                          title={!isRequiredFundAccount ? 'Toca para editar cuenta' : 'Fondo Requerido del Plan'}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isRequiredFundAccount ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-sm block ${isRequiredFundAccount ? 'text-amber-900 dark:text-amber-200' : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'} transition-colors`}>
                                  {acc.name}
                                </span>
                                {isRequiredFundAccount && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-md">
                                    Fondo Sistema
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 capitalize">
                                {isRequiredFundAccount
                                  ? 'Fondo inicial para cubrir gastos previos'
                                  : acc.freq === 'biweekly' ? `Quincenal (${acc.day || '15-30'})`
                                  : acc.freq === 'weekly' ? `Semanal (Día ${acc.day || '1'})`
                                  : acc.freq === 'monthly' ? `Mensual (Día ${acc.day || '1'})`
                                  : acc.freq === 'bimonthly' ? `Bimensual (Día ${acc.day || '1'})`
                                  : acc.freq === 'quarterly' ? `Trimestral (Día ${acc.day || '1'})`
                                  : acc.freq === 'four-monthly' ? `Cuatrimestral (Día ${acc.day || '1'})`
                                  : acc.freq === 'semiannual' ? `Semestral (Día ${acc.day || '1'})`
                                  : acc.freq === 'annual' ? `Anual (Día ${acc.day || '1'})`
                                  : acc.freq}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td
                          onClick={() => {
                            if (!isRequiredFundAccount) onOpenEdit('income', realIndex);
                          }}
                          className={`py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 ${!isRequiredFundAccount ? 'cursor-pointer hover:text-blue-600' : ''} transition-colors`}
                          title={!isRequiredFundAccount ? 'Toca para editar monto' : 'Monto del fondo'}
                        >
                          {formatCurrency(convertAmount(acc.amount, acc.currency))}
                        </td>

                        {/* Columna Disponible Hoy */}
                        <td className="py-3.5 px-4 bg-emerald-50/30 dark:bg-emerald-950/20">
                          <div className="space-y-0.5">
                            <span className={`text-sm font-black inline-block px-2 py-0.5 rounded-lg ${
                              acc.availableToday > 0
                                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40'
                                : acc.availableToday === 0
                                ? 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                                : 'text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-900/40'
                            }`}>
                              {formatCurrency(acc.availableToday)}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Entradas: {formatCurrency(acc.totalInflowsToDate)} · Salidas: {formatCurrency(acc.totalOutflowsToDate)}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setExpandedAccountId(isExpanded ? null : acc.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <span>{(acc.assignedItemsCount || paidMovements.length || 0)} movimientos</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {acc.nextIncomeDate ? (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                              {acc.nextIncomeDate}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isRequiredFundAccount ? (
                              <button
                                onClick={() => handleDelete(acc.id, acc.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar cuenta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-xs text-amber-500 font-bold px-2 py-1">🪙</span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row with assigned items & paid movements */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-800/40">
                          <td colSpan={6} className="p-4 space-y-4">
                            {/* Historial de Pagos Efectuados desde esta Cuenta */}
                            <div>
                              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                💸 Pagos y Egresos Débitados de {acc.name} ({paidMovements.length}):
                              </span>
                              {paidMovements.length === 0 ? (
                                <p className="text-xs text-slate-400 italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                  Aún no se han realizado pagos debitados de esta cuenta. Al marcar un gasto, cuota o ahorro como pagado, puedes elegir debitarlo de aquí.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {paidMovements.map((mov, idx) => (
                                    <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs shadow-2xs">
                                      <div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[170px]" title={mov.label}>
                                          {mov.label}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          {mov.date} · {mov.type === 'debt' ? '💳 Cuota' : mov.type === 'savings' ? '💰 Ahorro' : '📉 Gasto'}
                                        </span>
                                      </div>
                                      <span className="font-black text-rose-600 dark:text-rose-400 shrink-0">
                                        -{formatCurrency(mov.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Egresos y Compromisos Fijos Asignados a esta cuenta */}
                            <div>
                              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">
                                📋 Compromisos fijos asignados a {acc.name} ({assignedExpenses.length + assignedDebts.length + assignedSavings.length}):
                              </span>

                              {assignedExpenses.length === 0 && assignedDebts.length === 0 && assignedSavings.length === 0 ? (
                                <p className="text-xs text-slate-400 italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                  No hay compromisos fijos pre-asignados a esta cuenta. Puedes asignar gastos específicos desde el formulario o indicar la cuenta al momento de pagar.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {assignedExpenses.map(exp => (
                                    <div key={exp.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs shadow-2xs">
                                      <div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{exp.name}</span>
                                        <span className="text-[10px] text-slate-400">Gasto ({exp.freq || 'mensual'})</span>
                                      </div>
                                      <span className="font-black text-slate-900 dark:text-slate-100">
                                        {formatCurrency(convertAmount(exp.amount, exp.currency))}
                                      </span>
                                    </div>
                                  ))}
                                  {assignedDebts.map(d => (
                                    <div key={d.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs shadow-2xs">
                                      <div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{d.name}</span>
                                        <span className="text-[10px] text-slate-400">Deuda / Cuota</span>
                                      </div>
                                      <span className="font-black text-slate-900 dark:text-slate-100">
                                        {formatCurrency(convertAmount(d.amount || d.balance || 0, d.currency))}
                                      </span>
                                    </div>
                                  ))}
                                  {assignedSavings.map(s => (
                                    <div key={s.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs shadow-2xs">
                                      <div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{s.person || 'Ahorro'}</span>
                                        <span className="text-[10px] text-slate-400">Ahorro</span>
                                      </div>
                                      <span className="font-black text-emerald-600">
                                        {formatCurrency(convertAmount(s.amount, s.currency))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Confirmation Modal for Deleting Account */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Eliminar Cuenta de Ingreso
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              ¿Seguro que deseas eliminar la cuenta de ingreso <strong>"{accountToDelete.name}"</strong>?
            </p>
            {accountToDelete.assignedCount > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                ⚠️ Atención: Tiene <strong>{accountToDelete.assignedCount}</strong> gasto(s)/deuda(s) asignados a esta cuenta. El historial de pagos realizados permanecerá intacto.
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
