import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScanSuccess(decodedText);
      },
      (err) => {
        // Ignoramos errores constantes de escaneo (es normal cuando no hay un QR en la vista)
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-sm w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            Escanear QR
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 bg-slate-900">
          <div id="qr-reader" className="w-full bg-black rounded-xl overflow-hidden [&>div]:border-none [&>video]:object-cover" />
        </div>
        
        <div className="p-4 text-center bg-slate-50 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Apunta la cámara al código QR de otro usuario para agregarlo.
          </p>
        </div>
      </div>
    </div>
  );
};
