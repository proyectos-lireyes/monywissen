import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none max-w-[90vw]">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-2.5 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 animate-bounce transition-all duration-300"
        >
          <span className="text-lg">{t.icon || '✅'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
