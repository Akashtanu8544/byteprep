import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare, Sparkles } from 'lucide-react';
import { PwaService } from '../services/pwaService';

export const PwaInstallPrompt: React.FC = () => {
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    const standalone = PwaService.isStandalone();
    setIsStandalone(standalone);
    if (standalone) return;

    // Check iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const checkDismissed = localStorage.getItem('bp_pwa_prompt_dismissed');
    if (checkDismissed) {
      const dismissTime = parseInt(checkDismissed, 10);
      // Dismiss for 24 hours
      if (Date.now() - dismissTime < 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }

    const unsubscribe = PwaService.subscribeInstallPrompt((ready) => {
      setCanInstall(ready);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    const res = await PwaService.triggerInstall();
    if (res === 'accepted') {
      setIsDismissed(true);
    } else if (res === 'unsupported') {
      // Fallback
      alert('To install: Tap your browser menu (⋮) and tap "Install app" or "Add to Home Screen".');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('bp_pwa_prompt_dismissed', Date.now().toString());
  };

  if (isStandalone || isDismissed) return null;
  if (!canInstall && !isIos) return null;

  return (
    <>
      {/* Mobile Floating Install Pill / Banner */}
      <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-slideUp">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 p-3.5 rounded-2xl shadow-2xl shadow-sky-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Install BytePrep App</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Faster offline study & 1-tap mobile access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-gradient-to-r from-sky-400 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black text-white">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Follow these simple steps in Safari to add BytePrep to your home screen:
            </p>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <span>Tap the <Share className="w-3.5 h-3.5 inline text-sky-400 mx-1" /> <strong>Share</strong> icon in Safari bottom bar</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <span>Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-sky-400 mx-1" /> <strong>Add to Home Screen</strong></span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                  3
                </span>
                <span>Tap <strong>Add</strong> in the top right corner</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-sky-500 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
