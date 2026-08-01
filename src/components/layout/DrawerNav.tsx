import React from 'react';
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
  X
} from 'lucide-react';

interface DrawerNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DrawerNav: React.FC<DrawerNavProps> = ({ isOpen, onClose }) => {
  const { activeView, setActiveView } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Cronograma', icon: Calendar },
    { id: 'income', label: 'Ingresos', icon: TrendingUp },
    { id: 'expenses', label: 'Gastos Fijos', icon: CreditCard },
    { id: 'debts', label: 'Deudas', icon: Building2 },
    { id: 'savings', label: 'Ahorros y Divisas', icon: Wallet },
    { id: 'transactions', label: 'Transacciones Únicas', icon: ArrowLeftRight },
    { id: 'shared', label: 'MonyShared', icon: Users },
    { id: 'settings', label: 'Ajustes del Sistema', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setActiveView(id);
    onClose();
  };

  return (
    <>
      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out p-4 flex flex-col justify-between shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
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
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => handleSelect('settings')}
            className="text-[11px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors"
          >
            Monywissen v1.2.5 • Buscar Actualizaciones 🚀
          </button>
        </div>
      </aside>
    </>
  );
};
