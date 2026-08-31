import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  CreditCard,
  Building2,
  Wallet,
  ArrowLeftRight,
  Users,
  Settings,
  X,
  Calculator,
  Printer
} from 'lucide-react';

interface DrawerNavProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF?: () => void;
}

export const DrawerNav: React.FC<DrawerNavProps> = ({ isOpen, onClose, onExportPDF }) => {
  const { activeView, setActiveView, exchangeRates, updateState } = useApp();
  
  const [activeCurr, setActiveCurr] = useState<string>('USD');
  const [rawInput, setRawInput] = useState<string>('1');

  const navItems = [
    { id: 'savings', label: 'Ahorros y Divisas', icon: Wallet },
    { id: 'income', label: 'Ingresos Recurrentes', icon: TrendingUp },
    { id: 'settings', label: 'Ajustes del Sistema', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setActiveView(id);
    onClose();
  };

  const safeRate = (curr: string) => exchangeRates[curr] || 1;

  const handleInputChange = (curr: string, value: string) => {
    setActiveCurr(curr);
    setRawInput(value);
  };
  
  const getDisplayValue = (curr: string) => {
    if (rawInput === '') return '';
    if (activeCurr === curr) return rawInput; 
    
    const num = parseFloat(rawInput);
    if (isNaN(num)) return '';
    
    let baseUsd = 0;
    if (activeCurr === 'USD') baseUsd = num;
    else if (activeCurr === 'USDT') baseUsd = num / safeRate('USDT');
    else if (activeCurr === 'BS') baseUsd = num / safeRate('BS');
    else if (activeCurr === 'EUR') baseUsd = num / safeRate('EUR_BCV');
    
    let val = 0;
    if (curr === 'USD') val = baseUsd;
    else if (curr === 'USDT') val = baseUsd * safeRate('USDT');
    else if (curr === 'BS') val = baseUsd * safeRate('BS');
    else if (curr === 'EUR') val = baseUsd * safeRate('EUR_BCV');
    
    return Number(val.toFixed(2)).toString();
  };

  const clearCalc = () => setRawInput('');
  
  const isUpdateAvailable = !updateState?.isCompleted;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-[300px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col pt-[env(safe-area-inset-top)] shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 shrink-0">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                Monywissen
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Asistente Financiero Activo
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 custom-scrollbar">
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {onExportPDF && (
                <button
                  onClick={() => {
                      onExportPDF();
                      onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Imprimir Reporte</span>
                </button>
            )}
          </nav>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                
              </div>
              {rawInput !== '' && (
                <button onClick={clearCalc} className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-md transition-colors">
                  Limpiar
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1">Bolívares (Bs)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Bs</span>
                  <input
                    type="number"
                    step="any"
                    value={getDisplayValue('BS')}
                    onChange={e => handleInputChange('BS', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1">Dólares ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    value={getDisplayValue('USD')}
                    onChange={e => handleInputChange('USD', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1">Tether (USDT)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₮</span>
                  <input
                    type="number"
                    step="any"
                    value={getDisplayValue('USDT')}
                    onChange={e => handleInputChange('USDT', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1">Euros (€)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">€</span>
                  <input
                    type="number"
                    step="any"
                    value={getDisplayValue('EUR')}
                    onChange={e => handleInputChange('EUR', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-center text-slate-400 font-medium pt-1">
              Última actualización: Hoy, 08:00 AM
            </p>
          </div>
        </div>

        <div className="p-4 shrink-0 border-t border-slate-100 dark:border-slate-800 text-center">
          {isUpdateAvailable ? (
            <button
              type="button"
              onClick={() => handleSelect('settings')}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              Buscar Actualizaciones 🚀
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-semibold">
              Monywissen v1.2.5
            </span>
          )}
        </div>
      </aside>
    </>
  );
};
