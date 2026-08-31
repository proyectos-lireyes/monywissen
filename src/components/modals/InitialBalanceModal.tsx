import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateProjections, datesBetween, todayStr } from '../../utils/financialEngine';
import { Wallet, Check, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/financialEngine';
import { motion } from 'motion/react';

export const InitialBalanceModal: React.FC = () => {
  const { profile, updateProfileData, exchangeRates, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [requiredCapital, setRequiredCapital] = useState(0);
  const [firstIncomeDate, setFirstIncomeDate] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>('');

  useEffect(() => {
    if (profile.settings.openingBalance === undefined) {
      // Calculate first income date and required capital
      const startD = profile.settings.planStart || todayStr();
      const endD = profile.settings.planEnd || new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10);
      
      const allDatesList = datesBetween(startD, endD);
      // We don't want to run the full engine, let's just run it with openingBalance=0 to see the deficit
      // Actually, if we just use the calculated 'Fondo Requerido para Iniciar', it's in the plan.
      const testProfile = { ...profile, settings: { ...profile.settings, openingBalance: 0 } };
      const plan = calculateProjections(testProfile, exchangeRates);
      
      let reqCap = 0;
      let firstInc = null;
      let minBalance = 0;
      let currentBal = 0;
      
      for (const e of plan) {
          if (!e) continue;
          if (e.type === 'income' && (e.amt || 0) > 0 && e.label !== 'Fondo Requerido para Iniciar') {
              if (!firstInc) firstInc = e.date;
          }
      }
      
      for (const e of plan) {
          if (!e) continue;
          if (firstInc && e.date > firstInc) break;
          if (e.label === 'Fondo Requerido para Iniciar') continue; // skip this injected one
          
          if ((e.amt || 0) < 0 && e.type !== 'savings') {
              currentBal += e.amt;
          } else if ((e.amt || 0) > 0) {
              currentBal += e.amt;
          }
          if (currentBal < minBalance) minBalance = currentBal;
          if (e.type === 'income' && (e.amt || 0) > 0) break;
      }
      
      const calcReqCap = Math.abs(minBalance) + (profile.settings.minBalance || 0);
      setRequiredCapital(calcReqCap);
      setFirstIncomeDate(firstInc);
      
      if (calcReqCap > 0) {
          setUserBalance(String(calcReqCap));
      } else {
          setUserBalance('0');
      }

      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [profile.settings.openingBalance, profile, exchangeRates]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const amt = parseFloat(userBalance);
    if (isNaN(amt)) {
      showToast('Ingresa un monto válido', '⚠️');
      return;
    }
    updateProfileData(draft => {
      draft.settings.openingBalance = amt;
    });
    showToast('Saldo inicial configurado correctamente', '✅');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Capital Inicial Requerido</h2>
          
          {requiredCapital > 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  Hemos analizado tus próximos compromisos antes de tu primer ingreso proyectado ({firstIncomeDate ? firstIncomeDate : 'sin fecha programada'}).
                </p>
              </div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 ml-8">
                Para cubrir estos gastos y mantener tu colchón mínimo, necesitas comenzar con al menos:
              </p>
              <div className="text-center text-3xl font-black text-amber-700 dark:text-amber-500 py-2">
                {formatCurrency(requiredCapital)}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 text-left">
              <p className="text-sm text-emerald-900 dark:text-emerald-200">
                Tus ingresos cubren tus próximos compromisos. Puedes iniciar con $0 o el saldo que tengas disponible en tus cuentas.
              </p>
            </div>
          )}

          <div className="text-left pt-4">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
              ¿Con cuánto saldo disponible cuentas hoy?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={userBalance}
                onChange={e => setUserBalance(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-black text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-4 mt-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-5 h-5" />
            Confirmar Saldo Inicial
          </button>
        </div>
      </motion.div>
    </div>
  );
};
