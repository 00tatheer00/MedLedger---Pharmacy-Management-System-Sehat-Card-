'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { Download, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  promptInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isOnline: true,
  promptInstall: async () => {},
});

export function usePWA() {
  return useContext(PWAContext);
}

// External store for online / offline status
function subscribeOnline(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function getOnlineServerSnapshot(): boolean {
  return true;
}

// External store for standalone (PWA installed) status
function subscribeStandalone(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener?.('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    mql.removeEventListener?.('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getStandaloneServerSnapshot(): boolean {
  return false;
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);

  // Synchronize browser online and standalone state without cascading effect renders
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot,
  );
  const isInstalled = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot,
  );

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] ServiceWorker registration failed:', error);
        });
    }

    // 2. Capture beforeinstallprompt event for custom install banner
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.error('[PWA] Error prompting install:', err);
    }
  };

  return (
    <PWAContext.Provider value={{ isInstallable, isInstalled, isOnline, promptInstall }}>
      {/* Real-time Offline Warning Banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 font-bold px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>
            Hospital Network Offline — Working with cached pharmacy data (انٹرنیٹ منقطع ہے)
          </span>
        </div>
      )}

      {/* Floating PWA Install Prompt Banner (Only when installable and not dismissed) */}
      {isInstallable && !dismissedPrompt && !isInstalled && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-navy text-white p-4 rounded-2xl border-2 border-primary/50 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-primary text-white shrink-0 shadow-sm font-black text-sm">
              ML
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-extrabold text-white leading-tight truncate">
                Install MedLedger App
              </h4>
              <p className="text-[11px] text-teal-light font-medium" dir="rtl">
                ایپ انسٹال کریں • تیز رفتار اور آف لائن
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={promptInstall}
              className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setDismissedPrompt(true)}
              className="text-text-on-dark-muted hover:text-white p-1 rounded-md transition-colors"
              aria-label="Dismiss install banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {children}
    </PWAContext.Provider>
  );
}
