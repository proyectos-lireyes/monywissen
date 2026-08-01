import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateStr, todayStr } from '../../utils/financialEngine';
import { Plus, CreditCard, Edit2, CheckCircle, Clock } from 'lucide-react';

interface ExpensesViewProps {
  onOpenCreate: (type: 'expense', forceOneTime?: boolean) => void;
  onOpenEdit: (type: 'expense', index: number) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenCreate, onOpenEdit }) => {
  const { profile } = useApp();
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const today = todayStr();
  const recurrentExpenses = (profile.expenses || []).filter(e => e.freq !== 'one-time');

  const activeExpenses = recurrentExpenses.filter(e => !e.end || e.end >= today);
  const completedExpenses = recurrentExpenses.filter(e => e.end && e.end < today);

  const renderTable = (items: typeof recurrentExpenses) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
            <th className="pb-2.5">Nombre</th>
            <th className="pb-2.5">Cuota</th>
            <th className="pb-2.5">Frecuencia</th>
            <th className="pb-2.5 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
          {items.map(item => {
            const realIndex = profile.expenses.findIndex(e => e.id === item.id);
            return (
              <tr
                key={item.id}
                onClick={() => onOpenEdit('expense', realIndex)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                  {item.name}
                </td>
                <td className="py-3 font-black text-blue-600">
                  {formatCurrency(item.amount)}
                </td>
                <td className="py-3 text-slate-500 capitalize">
                  {item.freq === 'biweekly' ? 'Quincenal' : item.freq}
                </td>
                <td className="py-3 text-right">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Gastos Fijos
            </h2>
            <p className="text-xs text-slate-400">
              Pagos recurrentes como alquiler, servicios, suscripciones.
            </p>
          </div>
          <button
            onClick={() => onOpenCreate('expense')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => setTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              tab === 'active'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Activos ({activeExpenses.length})
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              tab === 'completed'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Finalizados ({completedExpenses.length})
          </button>
        </div>

        {tab === 'active' ? (
          activeExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No hay gastos fijos activos.
            </p>
          ) : (
            renderTable(activeExpenses)
          )
        ) : completedExpenses.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No hay gastos fijos finalizados.
          </p>
        ) : (
          renderTable(completedExpenses)
        )}
      </div>
    </div>
  );
};
