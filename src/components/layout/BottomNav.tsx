import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, Calendar, TrendingUp, CreditCard, Building2, Users, ArrowLeftRight } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView } = useApp();

  const items = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'calendar', label: 'Plan', icon: Calendar },
    { id: 'transactions', label: 'Transacciones', icon: ArrowLeftRight },
    { id: 'expenses', label: 'Gastos', icon: CreditCard },
    { id: 'debts', label: 'Deudas', icon: Building2 },
    { id: 'shared', label: 'MonyShared', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800  flex justify-around items-center px-1 py-1.5 pb-safe">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
