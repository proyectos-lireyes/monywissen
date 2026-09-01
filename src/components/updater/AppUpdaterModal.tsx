import React from 'react';
import { Download, RefreshCw, CheckCircle2, Sparkles, X, ArrowDownCircle, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';

declare const __APP_VERSION__: string;

interface AppUpdaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion?: string;
}

export const AppUpdaterModal: React.FC<AppUpdaterModalProps> = ({
  isOpen,
  onClose,
  currentVersion = typeof __APP_VERSION__ !== 'undefined' ? `v${__APP_VERSION__}` : 'v1.0.0',
}) => {
  const { updateState, startBackgroundUpdateDownload, setActiveView, showToast } = useApp();

  if (!isOpen) return null;

  const { isDownloading, progress, downloadSpeed, downloadedMB, totalMB, isCompleted, latestVersion, downloadUrl } = updateState;

  const handleInstall = () => {
    showToast('Descargando APK de Android...', '📲');
    if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
      window.open(downloadUrl, '_system');
    } else {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Monywissen-${latestVersion}.apk`;
      a.click();
    }
  };

  const handleGoToSettings = () => {
    onClose();
    setActiveView('settings');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                ¡Nueva Versión {latestVersion}!
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Versión actual instalada: <span className="font-bold">{currentVersion}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Release Notes */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider">
            ✨ Novedades de la versión:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <li>Recordatorios automáticos de pago a las 8:00 AM.</li>
            <li>Solicitudes de préstamo P2P directas con datos de pago.</li>
            <li>Mejores detalles en la agenda de contactos con código QR real.</li>
            <li>Descargas de APK en segundo plano por conexiones lentas.</li>
          </ul>
        </div>

        {/* Download & Progress Section */}
        {isDownloading || isCompleted ? (
          <div className="space-y-3 p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                )}
                {isCompleted ? 'Descarga Completada' : 'Descargando en segundo plano...'}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                {progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
              <span>{downloadedMB} MB de {totalMB} MB</span>
              {!isCompleted && <span>Velocidad: {downloadSpeed}</span>}
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {isCompleted ? (
            <button
              type="button"
              onClick={handleInstall}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <ArrowDownCircle className="w-4 h-4" /> Instalar APK Ahora
            </button>
          ) : isDownloading ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGoToSettings}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-500" /> Ir a Ajustes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all text-center"
              >
                Cerrar (Sigue en segundo plano)
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold transition-colors"
              >
                Más tarde
              </button>
              <button
                type="button"
                onClick={startBackgroundUpdateDownload}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" /> Descargar Actualización
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
