import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ArrowRightLeft, DollarSign, RefreshCw, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/financialEngine';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({ isOpen, onClose }) => {
  const { exchangeRates, convertAmount, showToast } = useApp();
  const [inputVal, setInputVal] = useState<string>('100');
  const [inputCurr, setInputCurr] = useState<string>('USD_BCV');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const bsRate = exchangeRates['BS'] || 0.02325;
  const bsPerUsd = (1 / bsRate).toFixed(2);
  const eurRate = exchangeRates['EUR_BCV'] || 1.08;
  const eurPerBs = (1 / bsRate * eurRate).toFixed(2);

  const numVal = parseFloat(inputVal) || 0;
  
  // Convert input value to base USD first
  const baseUsd = convertAmount(numVal, inputCurr);

  // Equivalents in each currency
  const equivUsd = baseUsd;
  const equivBs = baseUsd / bsRate;
  const equivEur = baseUsd / eurRate;
  const equivUsdt = baseUsd;

  const handleCopy = (valText: string, key: string) => {
    navigator.clipboard.writeText(valText);
    setCopiedKey(key);
    showToast(`Copiado: ${valText}`, '📋');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Tasas y Conversión de Divisas
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                Oficial Banco Central de Venezuela (BCV)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
        {/* Official Rates Summary Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Dólar BCV ($)</span>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
              1 USD = {bsPerUsd} Bs
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Euro BCV (€)</span>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
              1 EUR = {eurPerBs} Bs
            </p>
          </div>
        </div>

        {/* Calculator / Interactive Equivalences */}
        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
            🔢 Conversor Instantáneo Multimoneda
          </span>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Monto a Convertir</label>
              <input
                type="number"
                step="any"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Moneda Base</label>
              <select
                value={inputCurr}
                onChange={e => setInputCurr(e.target.value)}
                className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="USD_BCV">$ USD</option>
                <option value="BS">Bs Bolívares</option>
                <option value="EUR_BCV">€ Euro</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Equivalencias Calculadas:</span>

            <div className="grid grid-cols-1 gap-1.5">
              {/* USD */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Dólares ($ USD)</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    ${equivUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(`$${equivUsd.toFixed(2)}`, 'usd')}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Copiar monto"
                >
                  {copiedKey === 'usd' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* BS */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Bolívares (Bs)</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {equivBs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(`${equivBs.toFixed(2)} Bs`, 'bs')}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Copiar monto"
                >
                  {copiedKey === 'bs' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* EUR */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Euros (€ EUR)</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    €{equivEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(`€${equivEur.toFixed(2)}`, 'eur')}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Copiar monto"
                >
                  {copiedKey === 'eur' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* USDT */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">USDT (Crypto)</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {equivUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(`${equivUsdt.toFixed(2)} USDT`, 'usdt')}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Copiar monto"
                >
                  {copiedKey === 'usdt' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
        >
          Entendido
        </button>
        </div>
      </div>
    </div>
  );
};
