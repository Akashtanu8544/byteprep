// PWA Service to handle Service Worker registration and Install Prompts
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners: Array<(canInstall: boolean) => void> = [];

export class PwaService {
  /**
   * Registers the Service Worker
   */
  static registerServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('BytePrep PWA ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.log('BytePrep PWA ServiceWorker registration skipped/failed:', error);
          });
      });

      // Capture beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        listeners.forEach((cb) => cb(true));
      });

      window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        listeners.forEach((cb) => cb(false));
        console.log('BytePrep PWA installed successfully');
      });
    }
  }

  /**
   * Subscribes to changes in install availability
   */
  static subscribeInstallPrompt(callback: (canInstall: boolean) => void): () => void {
    listeners.push(callback);
    callback(!!deferredPrompt);
    return () => {
      const idx = listeners.indexOf(callback);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  /**
   * Returns whether the install prompt is currently deferred and ready
   */
  static canPromptInstall(): boolean {
    return !!deferredPrompt;
  }

  /**
   * Checks if running inside standalone PWA mode
   */
  static isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  /**
   * Triggers native install dialog
   */
  static async triggerInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
    if (!deferredPrompt) {
      return 'unsupported';
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        deferredPrompt = null;
        listeners.forEach((cb) => cb(false));
        return 'accepted';
      } else {
        return 'dismissed';
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
      return 'unsupported';
    }
  }
}
