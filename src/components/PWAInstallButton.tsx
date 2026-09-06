import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6600] to-[#e65c00] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#ff6600]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Install Decibel Android / Desktop App"
      >
        <Smartphone className="w-4 h-4" />
        <span>Install Android App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-all cursor-pointer border border-white/10"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#141418] border border-white/10 p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#ff6600]" />
                Install Decibel on iOS
              </h3>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <p>1. Tap the <strong className="text-white">Share</strong> icon in Safari toolbar.</p>
                <p>2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-[#ff6600] py-2 text-sm font-semibold text-white hover:bg-[#e65c00]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={() => {
        alert("To install Decibel on Android or Desktop, open the browser menu (⋮) and tap 'Add to Home Screen' or 'Install App'.");
      }}
      className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90 transition-all cursor-pointer border border-white/10"
      title="Install App"
    >
      <Smartphone className="w-3.5 h-3.5 text-[#ff6600]" />
      <span className="hidden sm:inline">Get App</span>
    </button>
  );
};
