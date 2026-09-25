import React, { useState } from 'react';
import { ShieldCheck, Lock, CloudUpload, X, Check } from 'lucide-react';

interface CloudSyncAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  userEmail?: string;
}

export const CloudSyncAgreementModal: React.FC<CloudSyncAgreementModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  userEmail,
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!acceptedTerms) return;
    onAccept();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <ShieldCheck className="w-6 h-6" />
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Acuerdo de Confidencialidad
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand & Subtitle */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-900/50">
            <CloudUpload className="w-3.5 h-3.5" /> MonyWissen Private Cloud Sync
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Respaldo y Sincronización Privada en la Nube
          </p>
        </div>

        {/* Agreement Text Box */}
        <div className="p-4 bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/40 rounded-2xl text-xs text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
          <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-orange-600 shrink-0" />
            Garantía de Privacidad y Acceso Exclusivo
          </p>
          <p>
            Al activar la Sincronización en la Nube, tu información financiera (ingresos, gastos, deudas, metas y cuentas) se resguardará de forma cifrada en la base de datos privada de MonyWissen en Firebase.
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <li>
              <strong>Privacidad Total:</strong> Tus datos son accesibles <strong>únicamente por ti</strong> mediante las credenciales de tu cuenta ({userEmail || 'tu usuario'}).
            </li>
            <li>
              <strong>Sin Acceso a Terceros:</strong> Ninguna otra persona, aplicación ni tercero comercializará, compartirá ni analizará tus registros financieros.
            </li>
            <li>
              <strong>Control Absoluto:</strong> Puedes cambiar al Modo Solo Local (Lite) o solicitar la eliminación total de tus respaldos en cualquier momento.
            </li>
          </ul>
        </div>

        {/* Checkbox Acceptance */}
        <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-orange-300 transition-all">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-slate-300"
          />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
            He leído y acepto los acuerdos de confidencialidad para el resguardo de mi información en la nube privada de MonyWissen.
          </span>
        </label>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!acceptedTerms}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Check className="w-4 h-4" /> Aceptar y Activar
          </button>
        </div>
      </div>
    </div>
  );
};
