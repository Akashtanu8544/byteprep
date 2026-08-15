import React, { useState } from 'react';
import { BrandKitConfig } from '../../types';
import { BrandKitService, DEFAULT_BRAND_KIT } from '../../services/brandKitService';
import { Palette, Check, RotateCcw, X, ExternalLink, Globe, Smartphone, Send, Instagram, Youtube, Sparkles } from 'lucide-react';
import { BytePrepLogo } from '../../components/BytePrepLogo';

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: BrandKitConfig) => void;
}

export const BrandKitModal: React.FC<BrandKitModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [config, setConfig] = useState<BrandKitConfig>(BrandKitService.getBrandKit());
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = BrandKitService.saveBrandKit(config);
    setSavedToast(true);
    if (onSaved) onSaved(updated);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Reset Brand Kit configuration to factory defaults?')) {
      const def = BrandKitService.resetToDefault();
      setConfig(def);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-2xl">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">BytePrep Brand Kit</h2>
              <p className="text-xs text-slate-400">
                Centralized branding for all video renders, flashcards, thumbnails, and social captions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
          {/* Brand Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Brand Name</label>
              <input
                type="text"
                value={config.brandName}
                onChange={e => setConfig({ ...config, brandName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Tagline / Mission</label>
              <input
                type="text"
                value={config.brandTagline}
                onChange={e => setConfig({ ...config, brandTagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Social & Product URLs */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider">Product & Social Links</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" /> Website URL
                </label>
                <input
                  type="text"
                  value={config.websiteUrl}
                  onChange={e => setConfig({ ...config, websiteUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Play Store Link / App Name
                </label>
                <input
                  type="text"
                  value={config.playStoreUrl}
                  onChange={e => setConfig({ ...config, playStoreUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-400" /> Telegram Channel URL
                </label>
                <input
                  type="text"
                  value={config.telegramUrl}
                  onChange={e => setConfig({ ...config, telegramUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram Handle
                </label>
                <input
                  type="text"
                  value={config.instagramHandle}
                  onChange={e => setConfig({ ...config, instagramHandle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Promotional Call-to-Action (CTA) */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider">Promotional Call-To-Action</h3>
            <textarea
              rows={2}
              value={config.defaultCtaText}
              onChange={e => setConfig({ ...config, defaultCtaText: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500 font-medium leading-relaxed"
              placeholder="e.g. Practice more Computer Science questions with BytePrep TGT PGT CS."
            />
          </div>

          {/* Color Palette */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Primary Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-slate-300">{config.primaryColor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Secondary Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={config.secondaryColor}
                  onChange={e => setConfig({ ...config, secondaryColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-slate-300">{config.secondaryColor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Accent Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={e => setConfig({ ...config, accentColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-slate-300">{config.accentColor}</span>
              </div>
            </div>
          </div>

          {/* Watermark & Outro Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <div className="text-xs font-bold text-white">Enable Watermark Tag</div>
                <div className="text-[10px] text-slate-400">Displays brand pill in renders</div>
              </div>
              <input
                type="checkbox"
                checked={config.showWatermark}
                onChange={e => setConfig({ ...config, showWatermark: e.target.checked })}
                className="w-4 h-4 accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Outro Screen Duration (sec)</label>
              <input
                type="number"
                min={2}
                max={10}
                value={config.defaultOutroDuration}
                onChange={e => setConfig({ ...config, defaultOutroDuration: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              {savedToast ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Brand Kit</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
