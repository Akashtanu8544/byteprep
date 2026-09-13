import React, { useState, useEffect } from 'react';
import { BrandKitConfig } from '../../types';
import { BrandKitService, DEFAULT_BRAND_KIT } from '../../services/brandKitService';
import {
  Palette,
  Check,
  RotateCcw,
  X,
  Globe,
  Smartphone,
  Send,
  Instagram,
  Youtube,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Save,
  Layers,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { BytePrepLogo } from '../../components/BytePrepLogo';

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: BrandKitConfig) => void;
  isFullPage?: boolean;
}

const PLATFORM_PRESETS = [

  {
    name: "YouTube Shorts Pro (Red Neon)",
    config: {
      brandName: "BytePrep Shorts",
      brandTagline: "Ultimate 10s Computer Science Crack Prep",
      primaryColor: "#ef4444", // YouTube Red
      secondaryColor: "#0f172a",
      accentColor: "#facc15", // gold
      showWatermark: true,
      defaultCtaText: "🔴 Subscribe to @BytePrepCS on YouTube for full crash courses!",
      defaultOutroDuration: 4
    }
  },
  {
    name: "Instagram Reels (Pink Modern)",
    config: {
      brandName: "BytePrep Instagram",
      brandTagline: "Bite-Sized CS PYQs & Rapid Brain Hacks",
      primaryColor: "#ec4899", // Instagram Pink
      secondaryColor: "#8b5cf6", // Violet
      accentColor: "#f43f5e",
      showWatermark: true,
      defaultCtaText: "📸 Follow @byteprep_cs for daily infographics & smart reels!",
      defaultOutroDuration: 3
    }
  },
  {
    name: "TikTok Tech (Green Terminal)",
    config: {
      brandName: "Terminal Bytes",
      brandTagline: "Compile Exam Success. Code. Test. Win.",
      primaryColor: "#10b981", // Green
      secondaryColor: "#020617", // Cyber Dark
      accentColor: "#38bdf8", // Cyber Blue
      showWatermark: true,
      defaultCtaText: "💻 Like & bookmark if you learned something new! #compsci",
      defaultOutroDuration: 3
    }
  },
  {
    name: "Telegram Quiz Hub (Simple Sky)",
    config: {
      brandName: "CS Bot Channel",
      brandTagline: "Interactive MCQ Quizzes & Community Doubt Solving",
      primaryColor: "#3390ec", // Telegram Blue
      secondaryColor: "#182533",
      accentColor: "#eab308",
      showWatermark: false,
      defaultCtaText: "📲 Join @BytePrepCS on Telegram to practice 5,000+ mock questions!",
      defaultOutroDuration: 4
    }
  }
];

export const BrandKitModal: React.FC<BrandKitModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  isFullPage = false,
}) => {
  const [config, setConfig] = useState<BrandKitConfig>(BrandKitService.getBrandKit());
  const [savedToast, setSavedToast] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [toastMsg, setToastMsg] = useState('Saved!');

  useEffect(() => {
    if (isOpen) {
      setConfig(BrandKitService.getBrandKit());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (customConfig?: BrandKitConfig) => {
    const toSave = customConfig || config;
    const updated = BrandKitService.saveBrandKit(toSave);
    setToastMsg('Saved!');
    setSavedToast(true);
    if (onSaved) onSaved(updated);
    setTimeout(() => {
      setSavedToast(false);
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('Reset to factory defaults?')) {
      const def = BrandKitService.resetToDefault();
      setConfig(def);
      handleSave(def);
      setToastMsg('Reset Defaults');
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1200);
    }
  };

  // Safe file reader & image compressor to fit base64 in local storage nicely
  const compressAndSetImage = (file: File, key: 'logoDataUrl' | 'backgroundImageUrl' | 'liveImageToVideoUrl') => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = key === 'logoDataUrl' ? 240 : 640;
        const MAX_HEIGHT = key === 'logoDataUrl' ? 240 : 640;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65); // 65% quality jpeg for compact storage
        
        const updated = {
          ...config,
          [key]: compressedBase64
        };
        setConfig(updated);
        handleSave(updated);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleClearAsset = (key: 'logoDataUrl' | 'backgroundImageUrl' | 'liveImageToVideoUrl') => {
    const updated = {
      ...config,
      [key]: ''
    };
    setConfig(updated);
    handleSave(updated);
  };

  const handleApplyPreset = (preset: typeof PLATFORM_PRESETS[0]) => {
    const updated = {
      ...config,
      ...preset.config
    };
    setConfig(updated);
    handleSave(updated);
    setToastMsg(`Applied ${preset.name}!`);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1200);
  };

  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const templates = config.savedTemplates || [];
    const templateId = `temp-${Date.now()}`;
    const newTemplate = {
      id: templateId,
      name: newTemplateName.trim(),
      config: {
        brandName: config.brandName,
        brandTagline: config.brandTagline,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
        defaultCtaText: config.defaultCtaText,
        showWatermark: config.showWatermark,
        logoDataUrl: config.logoDataUrl,
        backgroundImageUrl: config.backgroundImageUrl,
        liveImageToVideoUrl: config.liveImageToVideoUrl,
        defaultOutroDuration: config.defaultOutroDuration,
        websiteUrl: config.websiteUrl,
        playStoreUrl: config.playStoreUrl,
        telegramUrl: config.telegramUrl,
        instagramHandle: config.instagramHandle,
        youtubeHandle: config.youtubeHandle,
      }
    };

    const updated = {
      ...config,
      savedTemplates: [...templates, newTemplate]
    };

    setConfig(updated);
    BrandKitService.saveBrandKit(updated);
    setNewTemplateName('');
    setToastMsg(`Saved Custom Template "${newTemplate.name}"!`);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1200);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const templates = config.savedTemplates || [];
    const updated = {
      ...config,
      savedTemplates: templates.filter(t => t.id !== id)
    };
    setConfig(updated);
    BrandKitService.saveBrandKit(updated);
  };

  const handleApplyCustomTemplate = (tmpl: any) => {
    const updated = {
      ...config,
      ...tmpl.config
    };
    setConfig(updated);
    handleSave(updated);
    setToastMsg(`Applied Template: ${tmpl.name}`);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1200);
  };

  const cardContent = (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full p-5 sm:p-7 shadow-2xl space-y-6 relative flex flex-col">
      {/* Toast Notifier */}
      {savedToast && (
        <div className="absolute top-4 right-4 z-50 bg-emerald-500 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          {isFullPage && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2.5 bg-gradient-to-tr from-rose-500 to-amber-500 text-white rounded-2xl shadow-lg shadow-rose-500/10">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">Brand Kit</h1>
          </div>
        </div>
        {!isFullPage && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form & Studio Columns */}
      <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Preset and Saved Templates manager (4 Cols) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Preset Themes */}
              <div className="bg-slate-950 border border-slate-850/80 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Presets
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {PLATFORM_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs font-bold text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        {idx === 0 && <Youtube className="w-4 h-4 text-rose-500" />}
                        {idx === 1 && <Instagram className="w-4 h-4 text-pink-500" />}
                        {idx === 2 && <Sparkles className="w-4 h-4 text-emerald-500" />}
                        {idx === 3 && <Send className="w-4 h-4 text-sky-500" />}
                        <span className="truncate">{preset.name}</span>
                      </div>
                      <Check className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Templates */}
              <div className="bg-slate-950 border border-slate-850/80 rounded-2xl p-4 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" />
                  Templates
                </span>

                <form onSubmit={handleSaveAsTemplate} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={e => setNewTemplateName(e.target.value)}
                      placeholder="Template Name..."
                      className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={!newTemplateName.trim()}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Save Active Configuration as Template"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {(!config.savedTemplates || config.savedTemplates.length === 0) ? (
                    <p className="text-[10px] text-slate-500 text-center py-4">No custom templates saved yet.</p>
                  ) : (
                    config.savedTemplates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => handleApplyCustomTemplate(tmpl)}
                        className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer hover:border-amber-500/50 transition-colors"
                      >
                        <span className="truncate">{tmpl.name}</span>
                        <button
                          onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                          className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right side: Active Brand customization & media uploads (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Core Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    Brand / Display Name
                  </label>
                  <input
                    type="text"
                    value={config.brandName}
                    onChange={e => {
                      const updated = { ...config, brandName: e.target.value };
                      setConfig(updated);
                      handleSave(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tagline / Mission</label>
                  <input
                    type="text"
                    value={config.brandTagline}
                    onChange={e => {
                      const updated = { ...config, brandTagline: e.target.value };
                      setConfig(updated);
                      handleSave(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Upload Assets Section */}
              <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4.5 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  Assets
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* APP LOGO */}
                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col justify-between items-center space-y-3.5 relative">
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block">Logo</span>

                    <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
                      {config.logoDataUrl ? (
                        <img src={config.logoDataUrl} alt="App Logo" className="w-full h-full object-contain" />
                      ) : (
                        <BytePrepLogo size={36} />
                      )}
                    </div>

                    <div className="flex gap-1.5 w-full">
                      <label className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 font-bold px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => e.target.files && compressAndSetImage(e.target.files[0], 'logoDataUrl')}
                          className="hidden"
                        />
                      </label>
                      {config.logoDataUrl && (
                        <button
                          onClick={() => handleClearAsset('logoDataUrl')}
                          className="p-1.5 bg-rose-950/30 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BACKGROUND IMAGE OVERLAY */}
                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col justify-between items-center space-y-3.5 relative">
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block">Backdrop</span>

                    <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
                      {config.backgroundImageUrl ? (
                        <img src={config.backgroundImageUrl} alt="Bg Overlay" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-700" />
                      )}
                    </div>

                    <div className="flex gap-1.5 w-full">
                      <label className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 font-bold px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => e.target.files && compressAndSetImage(e.target.files[0], 'backgroundImageUrl')}
                          className="hidden"
                        />
                      </label>
                      {config.backgroundImageUrl && (
                        <button
                          onClick={() => handleClearAsset('backgroundImageUrl')}
                          className="p-1.5 bg-rose-950/30 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* LIVE IMAGE TO VIDEO GENERATOR */}
                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col justify-between items-center space-y-3.5 relative">
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block">Motion Asset</span>

                    <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
                      {config.liveImageToVideoUrl ? (
                        <div className="relative w-full h-full">
                          <img src={config.liveImageToVideoUrl} alt="Live to Video Asset" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <span className="text-[8px] bg-slate-950/80 text-emerald-400 px-1 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">Motion Active</span>
                          </div>
                        </div>
                      ) : (
                        <VideoIcon className="w-6 h-6 text-slate-700" />
                      )}
                    </div>

                    <div className="flex gap-1.5 w-full">
                      <label className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 font-bold px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => e.target.files && compressAndSetImage(e.target.files[0], 'liveImageToVideoUrl')}
                          className="hidden"
                        />
                      </label>
                      {config.liveImageToVideoUrl && (
                        <button
                          onClick={() => handleClearAsset('liveImageToVideoUrl')}
                          className="p-1.5 bg-rose-950/30 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Scheme and watermarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Brand Colors */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">Palette</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold block">Primary</span>
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={e => {
                          const updated = { ...config, primaryColor: e.target.value };
                          setConfig(updated);
                          handleSave(updated);
                        }}
                        className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold block">Secondary</span>
                      <input
                        type="color"
                        value={config.secondaryColor}
                        onChange={e => {
                          const updated = { ...config, secondaryColor: e.target.value };
                          setConfig(updated);
                          handleSave(updated);
                        }}
                        className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold block">Accent</span>
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={e => {
                          const updated = { ...config, accentColor: e.target.value };
                          setConfig(updated);
                          handleSave(updated);
                        }}
                        className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Promotional CTA, Watermark & Outro Duration */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Watermark</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-850 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-white">Brand Watermark Overlay</div>
                        <div className="text-[10px] text-slate-400">
                          {config.logoDataUrl ? 'Displays uploaded logo icon' : `Displays @${config.brandName || 'BytePrepCS'} handle`}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showWatermark !== false}
                        onChange={e => {
                          const updated = { ...config, showWatermark: e.target.checked };
                          setConfig(updated);
                          handleSave(updated);
                        }}
                        className="w-4 h-4 accent-rose-500 cursor-pointer"
                      />
                    </div>

                    {config.showWatermark !== false && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Position</label>
                          <select
                            value={config.watermarkPosition || 'bottom-right'}
                            onChange={e => {
                              const updated = { ...config, watermarkPosition: e.target.value as any };
                              setConfig(updated);
                              handleSave(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-lg p-1.5 outline-none"
                          >
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                          </select>
                        </div>

                        <div className="p-2 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Outro Screen</label>
                          <select
                            value={config.defaultOutroDuration || 4}
                            onChange={e => {
                              const updated = { ...config, defaultOutroDuration: Number(e.target.value) };
                              setConfig(updated);
                              handleSave(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-lg p-1.5 outline-none"
                          >
                            <option value={2}>2 seconds</option>
                            <option value={3}>3 seconds</option>
                            <option value={4}>4 seconds</option>
                            <option value={5}>5 seconds</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Social URLs & CTA */}
              <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4.5 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Links
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 block">Website URL</span>
                    <input
                      type="text"
                      value={config.websiteUrl}
                      onChange={e => {
                        const updated = { ...config, websiteUrl: e.target.value };
                        setConfig(updated);
                        handleSave(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 block">Play Store URL / Handle</span>
                    <input
                      type="text"
                      value={config.playStoreUrl}
                      onChange={e => {
                        const updated = { ...config, playStoreUrl: e.target.value };
                        setConfig(updated);
                        handleSave(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">Promotional CTA Video Text Overlay</span>
                  <textarea
                    rows={2}
                    value={config.defaultCtaText}
                    onChange={e => {
                      const updated = { ...config, defaultCtaText: e.target.value };
                      setConfig(updated);
                      handleSave(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500 font-medium leading-relaxed"
                  />
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
          >
            Save
          </button>
        </div>

      </div>
    );

    if (isFullPage) {
      return (
        <div className="w-full max-w-5xl mx-auto py-4 sm:py-6 px-3 sm:px-6 animate-fadeIn">
          {cardContent}
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <div className="max-w-4xl w-full max-h-[90vh] flex flex-col my-auto">
          {cardContent}
        </div>
      </div>
    );
  };
