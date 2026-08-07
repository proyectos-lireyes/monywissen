import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateStr } from '../../utils/financialEngine';
import { Plus, Wallet, Globe, DollarSign, Settings2, Image as ImageIcon, Trash2 } from 'lucide-react';

interface SavingsViewProps {
  onOpenCreate: (type: 'saving') => void;
  onOpenEdit: (type: 'saving', index: number) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({ onOpenCreate, onOpenEdit }) => {
  const { profile, updateProfileData, showToast, convertAmount } = useApp();
  const [showPlatformsModal, setShowPlatformsModal] = useState(false);

  const savingsList = profile.savingsList || [];
  const platforms = profile.settings.savingPlatforms || [];

  let physicalTotal = profile.savings?.current || 0;
  let digitalTotal = profile.savings?.digital || 0;

  savingsList.forEach(x => {
    if (x.status === 'completed' || x.delivered) {
      const amt = convertAmount(x.amount, x.currency);
      if (x.savType === 'digital') digitalTotal += amt;
      else physicalTotal += amt;
    }
  });

  const globalTotal = physicalTotal + digitalTotal;

  const handleAdjustBase = () => {
    const physStr = prompt('Monto base ahorrado en EFECTIVO (Físico):', String(profile.savings?.current || 0));
    if (physStr === null) return;
    const digStr = prompt('Monto base ahorrado DIGITAL (Billeteras):', String(profile.savings?.digital || 0));
    if (digStr === null) return;

    updateProfileData(draft => {
      draft.savings = {
        current: parseFloat(physStr) || 0,
        digital: parseFloat(digStr) || 0,
      };
    });

    showToast('Base histórica de ahorros actualizada', '⚙️');
  };

  const handleAddPlatform = () => {
    const name = prompt('Nombre de la plataforma (Ej. Binance, Zinli, Facebank):');
    if (!name) return;

    updateProfileData(draft => {
      draft.settings.savingPlatforms = draft.settings.savingPlatforms || [];
      draft.settings.savingPlatforms.push({
        id: `sp_${Date.now()}`,
        name,
      });
    });

    showToast(`Plataforma "${name}" guardada`, '🌐');
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Ahorros y Divisas
            </h2>
            <p className="text-xs text-slate-400">
              Control de efectivo en dólares/euros y saldos digitales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlatformsModal(true)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" /> Plataformas
            </button>
            <button
              onClick={() => onOpenCreate('saving')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Registrar Compra
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
              Total Ahorrado
            </span>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(globalTotal)}
            </p>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
              Total Digital
            </span>
            <p className="text-base font-black text-blue-600 dark:text-blue-400">
              {formatCurrency(digitalTotal)}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
              Físico (Efectivo)
            </span>
            <p className="text-base font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(physicalTotal)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <button
            onClick={handleAdjustBase}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            ✎ Ajustar Base Histórica
          </button>
        </div>

        {/* Table of records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                <th className="pb-2.5">Fecha</th>
                <th className="pb-2.5">Tipo</th>
                <th className="pb-2.5">Concepto</th>
                <th className="pb-2.5">Comprobante</th>
                <th className="pb-2.5">Monto</th>
                <th className="pb-2.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {savingsList.map((item, idx) => {
                const platName = platforms.find(p => p.id === item.platformId)?.name || 'Plataforma';
                return (
                  <tr
                    key={item.id || idx}
                    onClick={() => onOpenEdit('saving', idx)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 text-slate-500">{formatDateStr(item.date)}</td>
                    <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                      {item.savType === 'digital' ? `🌐 ${platName}` : '💵 Efectivo'}
                    </td>
                    <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{item.person}</td>
                    <td className="py-3">
                      {item.receiptImg ? (
                        <a href={item.receiptImg} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                          <img src={item.receiptImg} alt="Comprobante" className="w-8 h-8 object-cover rounded-lg border border-slate-200 hover:scale-110 transition-transform" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Sin imagen</span>
                      )}
                    </td>
                    <td className="py-3 font-black text-emerald-600">{formatCurrency(convertAmount(item.amount, item.currency))}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.status === 'completed' || item.delivered ? '✅ Listo' : '⏳ Pendiente'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platforms Modal */}
      {showPlatformsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Plataformas Digitales
              </h3>
              <button onClick={() => setShowPlatformsModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <button
              onClick={handleAddPlatform}
              className="w-full py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl"
            >
              + Agregar Plataforma
            </button>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {platforms.map((p, idx) => (
                <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between group">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">🌐 {p.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        const newName = prompt('Editar nombre:', p.name);
                        if (newName) {
                          updateProfileData(draft => {
                            if (draft.settings.savingPlatforms) {
                               draft.settings.savingPlatforms[idx].name = newName;
                            }
                          });
                        }
                      }}
                      className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"
                    >
                      ✎
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`¿Eliminar ${p.name}?`)) {
                          updateProfileData(draft => {
                            if (draft.settings.savingPlatforms) {
                              draft.settings.savingPlatforms.splice(idx, 1);
                            }
                          });
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
