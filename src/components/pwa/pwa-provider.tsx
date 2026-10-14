'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { WifiOff } from 'lucide-react';
import { UpdatePrompt } from './update-prompt';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  promptInstall: () => Promise<void>;
  dismissUpdate: () => void;
  applyUpdate: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isOnline: true,
  isUpdateAvailable: false,
  promptInstall: async () => {},
  dismissUpdate: () => {},
  applyUpdate: () => {},
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
  const mql =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(display-mode: standalone)')
      : null;
  mql?.addEventListener?.('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    mql?.removeEventListener?.('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getStandaloneServerSnapshot(): boolean {
  return false;
}

if (typeof window !== 'undefined') {
  (window as unknown as { __triggerUpdateAvailable?: () => void }).__triggerUpdateAvailable =
    () => {
      window.dispatchEvent(new CustomEvent('medledger:update-available'));
    };
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

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

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker?.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setIsUpdateAvailable(false);
  }, []);

  useEffect(() => {
    // 1. Service Worker Registration & Update Detection
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // If an updated worker is already waiting
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setIsUpdateAvailable(true);
          }

          // Listen for new worker installing & completing installation
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setIsUpdateAvailable(true);
                }
              });
            }
          });

          // Periodic check for SW update every 60s
          const swInterval = setInterval(() => {
            registration.update().catch(() => {});
          }, 60 * 1000);

          return () => clearInterval(swInterval);
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

  // 3. Deployment / App Version Polling (detects new Vercel builds while tabs stay open)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialVersion: string | null = null;
    let isCancelled = false;

    const checkAppVersion = async () => {
      try {
        const res = await fetch(`/api/version?_t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled || !data?.version) return;

        if (initialVersion === null) {
          initialVersion = data.version;
        } else if (initialVersion !== data.version) {
          setIsUpdateAvailable(true);
        }
      } catch {
        // Network failures ignored during polling
      }
    };

    // Check on startup
    checkAppVersion();

    // Check periodically every 60 seconds
    const intervalId = setInterval(checkAppVersion, 60 * 1000);

    // Check when user refocuses browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAppVersion();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkAppVersion);

    // Event listener and window bridge for manual testing/events
    const handleCustomUpdateTrigger = () => setIsUpdateAvailable(true);
    window.addEventListener('medledger:update-available', handleCustomUpdateTrigger);
    (window as unknown as { __triggerUpdateAvailable?: () => void }).__triggerUpdateAvailable =
      () => {
        setIsUpdateAvailable(true);
      };

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkAppVersion);
      window.removeEventListener('medledger:update-available', handleCustomUpdateTrigger);
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
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOnline,
        isUpdateAvailable,
        promptInstall,
        dismissUpdate,
        applyUpdate,
      }}
    >
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

      {/* Floating New Version Available Notification */}
      {isUpdateAvailable && <UpdatePrompt onUpdate={applyUpdate} onDismiss={dismissUpdate} />}

      {children}
    </PWAContext.Provider>
  );
}
