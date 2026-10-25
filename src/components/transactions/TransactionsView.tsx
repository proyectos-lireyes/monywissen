import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateStr, sanitizeDocId } from '../../utils/financialEngine';
import { Plus, ArrowLeftRight, Undo2, Filter, X, Check } from 'lucide-react';

interface TransactionsViewProps {
  onOpenCreate: (type: 'income' | 'expense' | 'debt' | 'saving', forceOneTime?: boolean, initialIncomeId?: string) => void;
  onOpenEdit: (type: 'income' | 'expense', index: number) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenCreate,
  onOpenEdit,
}) => {
  const { profile, canUndo, undoLastTransaction, convertAmount, updateProfileData, showToast } = useApp();
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const oneTimeIncomes = (profile.incomes || [])
    .map((item, idx) => ({ ...item, realType: 'income' as const, originalIdx: idx }))
    .filter(i => i.freq === 'one-time');

  const oneTimeExpenses = (profile.expenses || [])
    .map((item, idx) => ({ ...item, realType: 'expense' as const, originalIdx: idx }))
    .filter(e => e.freq === 'one-time');

  const allOneTime = [...oneTimeIncomes, ...oneTimeExpenses]
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
            {filteredOneTime.map((item, idx) => {
              const itemKey = `${item.realType}_${item.id}_${item.date}`;
              const sanitizedKey = `${item.realType}_${sanitizeDocId(item.name, item.id)}_${item.date}`;
              const ov = profile.overrides?.[itemKey] || profile.overrides?.[sanitizedKey];
              const isDone = Boolean(ov?.done ?? (item as any).done);
              
              return (
                <div
                  key={item.id || idx}
                  onClick={() => onOpenEdit(item.realType, item.originalIdx)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isDone 
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextDone = !isDone;
                        updateProfileData(draft => {
                          draft.overrides = draft.overrides || {};
                          draft.overrides[itemKey] = { ...(draft.overrides[itemKey] || {}), done: nextDone };
                          if (sanitizedKey !== itemKey) {
                            draft.overrides[sanitizedKey] = { ...(draft.overrides[sanitizedKey] || {}), done: nextDone };
                          }
                          if (item.realType === 'income' && draft.incomes[item.originalIdx]) {
                            (draft.incomes[item.originalIdx] as any).done = nextDone;
                          } else if (item.realType === 'expense' && draft.expenses[item.originalIdx]) {
                            (draft.expenses[item.originalIdx] as any).done = nextDone;
                          }
                        });
                        showToast(nextDone ? 'Marcado como listo' : 'Marcado como pendiente', '✅');
                      }}
                      className={`p-2 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300 hover:text-emerald-500 hover:border-emerald-200'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div>
                      <p className={`text-xs font-bold ${isDone ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-slate-100'}`}>
                        {item.name}
                        {isDone && <span className="ml-2 text-[9px] font-black uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">Listo</span>}
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
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-xs font-black ${
                          item.realType === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        } ${isDone ? 'opacity-60' : ''}`}
                      >
                        {item.realType === 'income' ? '+' : '-'}{item.amount.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2})} {(item as any).currency && (item as any).currency !== 'USD_BCV' ? (item as any).currency : 'USD'}
                      </span>
                      {(item as any).currency && (item as any).currency !== 'USD_BCV' && (
                         <span className="text-[9px] text-slate-400">
                           ≈ {formatCurrency(convertAmount(item.amount, (item as any).currency))}
                         </span>
                      )}
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 mt-1">
                        🏦 {profile.incomes.find(i => i.id === item.incomeId)?.name || 'Cuenta Principal'}
                      </span>
                    </div>
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
