import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeImageProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}

export const QRCodeImage: React.FC<QRCodeImageProps> = ({
  value,
  size = 200,
  className = 'w-36 h-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2 shadow-xs',
  alt = 'Código QR',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => {
        setDataUrl(url);
        setError(false);
      })
      .catch(err => {
        console.error('Error generando código QR real:', err);
        setError(true);
      });
  }, [value, size]);

  if (error || !dataUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold ${className}`}>
        Cargando QR...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      className={className}
    />
  );
};
