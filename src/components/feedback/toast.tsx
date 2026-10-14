'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalToastHandler: {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
} = {
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
};

export const toast = {
  success: (message: string, title?: string) => globalToastHandler.success(message, title),
  error: (message: string, title?: string) => globalToastHandler.error(message, title),
  info: (message: string, title?: string) => globalToastHandler.info(message, title),
  warning: (message: string, title?: string) => globalToastHandler.warning(message, title),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastItem = { id, type, message, title };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast],
  );

  const toastMethods = useMemo(
    () => ({
      success: (msg: string, t?: string) => addToast('success', msg, t),
      error: (msg: string, t?: string) => addToast('error', msg, t),
      info: (msg: string, t?: string) => addToast('info', msg, t),
      warning: (msg: string, t?: string) => addToast('warning', msg, t),
    }),
    [addToast],
  );

  useEffect(() => {
    globalToastHandler = toastMethods;
    return () => {
      globalToastHandler = null;
    };
  }, [toastMethods]);

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {/* Toast container floating at top-right */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 transition-all ${
              item.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950 shadow-emerald-900/10'
                : item.type === 'error'
                  ? 'bg-rose-50/95 border-rose-200 text-rose-950 shadow-rose-900/10'
                  : item.type === 'warning'
                    ? 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-amber-900/10'
                    : 'bg-sky-50/95 border-sky-200 text-sky-950 shadow-sky-900/10'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {item.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600" />}
              {item.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-600" />}
              {item.type === 'info' && <Info className="h-5 w-5 text-sky-600" />}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              {item.title && (
                <h5 className="text-xs font-bold leading-tight mb-0.5">{item.title}</h5>
              )}
              <p className="text-xs font-medium leading-relaxed opacity-90">{item.message}</p>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity"
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return toast;
  }
  return context.toast;
}
