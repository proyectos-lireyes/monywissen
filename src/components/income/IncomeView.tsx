import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/financialEngine';
import { Plus, TrendingUp, Edit2, Trash2 } from 'lucide-react';

interface IncomeViewProps {
  onOpenCreate: (type: 'income', forceOneTime?: boolean) => void;
  onOpenEdit: (type: 'income', index: number) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({ onOpenCreate, onOpenEdit }) => {
  const { profile } = useApp();
  const recurrentIncomes = (profile.incomes || []).filter(i => i.freq !== 'one-time');

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Ingresos Recurrentes
            </h2>
            <p className="text-xs text-slate-400">
              Sueldos, honorarios y entradas de dinero periódicas.
            </p>
          </div>
          <button
            onClick={() => onOpenCreate('income')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>

        {recurrentIncomes.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">
              No hay ingresos recurrentes registrados. Haz clic en "+ Nuevo" para agregar tu salario.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="pb-2.5">Nombre</th>
                  <th className="pb-2.5">Monto</th>
                  <th className="pb-2.5">Frecuencia</th>
                  <th className="pb-2.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {recurrentIncomes.map((item, idx) => {
                  const realIndex = profile.incomes.findIndex(i => i.id === item.id);
                  return (
                    <tr
                      key={item.id || idx}
                      onClick={() => onOpenEdit('income', realIndex)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </td>
                      <td className="py-3 font-black text-emerald-600">
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
        )}
      </div>
    </div>
  );
};
