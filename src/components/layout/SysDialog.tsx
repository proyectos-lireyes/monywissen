import React from 'react';
import { X } from 'lucide-react';

interface SysDialogProps {
  isOpen: boolean;
  title: string;
  message?: React.ReactNode;
  input?: boolean;
  inputValue?: string;
  inputType?: string;
  inputPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
  onConfirm: (val: string) => void;
  onClose: () => void;
}

export const SysDialog: React.FC<SysDialogProps> = ({
  isOpen,
  title,
  message,
  input = false,
  inputValue = '',
  inputType = 'text',
  inputPlaceholder = '',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  hideCancel = false,
  onConfirm,
  onClose,
}) => {
  const [val, setVal] = React.useState(inputValue);

  React.useEffect(() => {
    setVal(inputValue);
  }, [inputValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {message && (
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            {message}
          </div>
        )}

        {input && (
          <div>
            <input
              type={inputType}
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          {!hideCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm(val);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
