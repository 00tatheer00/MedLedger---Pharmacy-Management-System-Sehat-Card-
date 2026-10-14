'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { WifiOff } from 'lucide-react';

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

    // 2. Capture beforeinstallprompt event for install handling
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

      {children}
    </PWAContext.Provider>
  );
}
