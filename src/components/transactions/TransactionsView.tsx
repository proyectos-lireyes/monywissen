import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateStr } from '../../utils/financialEngine';
import { Plus, ArrowLeftRight, Edit2, Undo2, Filter, X } from 'lucide-react';

interface TransactionsViewProps {
  onOpenCreate: (type: 'income' | 'expense', forceOneTime?: boolean) => void;
  onOpenEdit: (type: 'income' | 'expense', index: number) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenCreate,
  onOpenEdit,
}) => {
  const { profile, canUndo, undoLastTransaction, convertAmount } = useApp();
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const oneTimeIncomes = (profile.incomes || [])
    .map((item, idx) => ({ ...item, realType: 'income' as const, originalIdx: idx }))
    .filter(i => i.freq === 'one-time');

  const oneTimeExpenses = (profile.expenses || [])
    .map((item, idx) => ({ ...item, realType: 'expense' as const, originalIdx: idx }))
    .filter(e => e.freq === 'one-time');

  const allOneTime = [...oneTimeIncomes, ...oneTimeExpenses]
    .filter(item => {
      const d = item.date || '';
      return d >= profile.settings.planStart && d <= profile.settings.planEnd;
    })
    .sort((a, b) => {
    const dA = a.date || '';
    const dB = b.date || '';
    return dB.localeCompare(dA);
  });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allOneTime.forEach(item => {
      if ((item as any).tags) {
        (item as any).tags.forEach((t: string) => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [allOneTime]);

  const filteredOneTime = allOneTime.filter(item => {
    if (!tagFilter) return true;
    const itemTags = (item as any).tags || [];
    return itemTags.includes(tagFilter);
  });

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              Transacciones Únicas
            </h2>
            <p className="text-xs text-slate-400">
              Movimientos puntuales de una sola vez que no se repiten.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canUndo && (
              <button
                onClick={undoLastTransaction}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Deshacer
              </button>
            )}
            <button
              onClick={() => onOpenCreate('income', true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + Ingreso Único
            </button>
            <button
              onClick={() => onOpenCreate('expense', true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + Gasto Único
            </button>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filtrar por Etiqueta:
            </span>
            {tagFilter && (
              <button
                onClick={() => setTagFilter(null)}
                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  tagFilter === tag 
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {filteredOneTime.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No hay transacciones únicas registradas.
          </p>
        ) : (
          <div className="space-y-2">
            {filteredOneTime.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => onOpenEdit(item.realType, item.originalIdx)}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatDateStr(item.date)} • {item.desc || 'Sin detalle'}
                  </p>
                  {(item as any).tags && (item as any).tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(item as any).tags.map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[9px] font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-xs font-black ${
                        item.realType === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {item.realType === 'income' ? '+' : '-'}{formatCurrency(item.amount)} {(item as any).currency && (item as any).currency !== 'USD_BCV' ? (item as any).currency : ''}
                    </span>
                    {(item as any).currency && (item as any).currency !== 'USD_BCV' && (
                       <span className="text-[9px] text-slate-400">
                         ≈ {formatCurrency(convertAmount(item.amount, (item as any).currency))}
                       </span>
                    )}
                  </div>
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
