'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ToastInput {
  icon?: string;
  title: string;
  message?: string;
  variant?: 'celebrate' | 'info' | 'error';
}

interface Toast extends ToastInput {
  id: number;
}

const ToastContext = createContext<{ showToast: (t: ToastInput) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((t: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'fnf-celebrate rounded-xl p-4 shadow-lg border backdrop-blur-md',
              t.variant === 'error'
                ? 'bg-red-500/15 border-red-500/30 text-red-200'
                : t.variant === 'celebrate'
                ? 'bg-gradient-to-r from-fnf-purple/90 to-fnf-violet/90 border-white/10 text-white'
                : 'bg-fnf-surface border-purple-500/20 text-fnf-text'
            )}
          >
            <p className="font-heading font-semibold text-sm flex items-center gap-2">
              {t.icon && <span className="text-lg">{t.icon}</span>}
              {t.title}
            </p>
            {t.message && <p className="text-xs opacity-85 mt-1">{t.message}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
