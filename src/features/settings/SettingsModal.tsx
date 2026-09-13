import React, { useState, useRef } from 'react';
import { ChallengeSettings } from '../../types';
import { StorageService } from '../../services/storageService';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Smartphone,
  X,
  Save,
  Music,
  Upload,
  Play,
  Square,
  Trash2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

interface SettingsModalProps {
  settings: ChallengeSettings;
  onSave: (updated: ChallengeSettings) => void;
  onClose: () => void;
  isFullPage?: boolean;
}

const PRESET_BGM_TRACKS = [
  { id: 'lofi-study', name: 'Lo-Fi Chill (90 BPM)', desc: 'Ambient beats' },
  { id: 'alpha-focus', name: 'Alpha Focus (75 BPM)', desc: 'Concentration sine' },
  { id: 'exam-groove', name: 'Exam Rush (120 BPM)', desc: 'Countdown rhythm' },
  { id: 'cyber-logic', name: 'Cyber Wave (105 BPM)', desc: 'Electronic synth' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  isFullPage = false,
}) => {
  const [formData, setFormData] = useState<ChallengeSettings>({
    bgmEnabled: true,
    bgmTrackId: 'lofi-study',
    ...settings,
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Audio file size must be less than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        customBgmDataUrl: dataUrl,
        customBgmName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePreviewAudio = () => {
    if (isPlayingAudio) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
    } else {
      if (!formData.customBgmDataUrl) return;
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(formData.customBgmDataUrl);
        audioPreviewRef.current.onended = () => setIsPlayingAudio(false);
      } else {
        audioPreviewRef.current.src = formData.customBgmDataUrl;
      }
      audioPreviewRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => console.warn('Preview error:', err));
    }
  };

  const handleRemoveCustomAudio = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setIsPlayingAudio(false);
    setFormData(prev => ({
      ...prev,
      customBgmDataUrl: undefined,
      customBgmName: undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    const updated = StorageService.saveSettings(formData);
    onSave(updated);
    onClose();
  };

  const content = (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 w-full shadow-2xl relative">
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {isFullPage && (
            <button
              type="button"
              onClick={() => {
                if (audioPreviewRef.current) audioPreviewRef.current.pause();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-2xl">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white">Settings</h1>
        </div>

        {!isFullPage && (
          <button
            onClick={() => {
              if (audioPreviewRef.current) audioPreviewRef.current.pause();
              onClose();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* BGM Video Background Music Section */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                Auto BGM
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[11px] font-bold text-slate-400">
                {formData.bgmEnabled !== false ? 'Enabled' : 'Disabled'}
              </span>
              <input
                type="checkbox"
                checked={formData.bgmEnabled !== false}
                onChange={e => setFormData(prev => ({ ...prev, bgmEnabled: e.target.checked }))}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </label>
          </div>

          {formData.bgmEnabled !== false && (
            <div className="space-y-3 pt-2 border-t border-slate-850">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Presets
                </label>
                <select
                  value={formData.bgmTrackId || 'lofi-study'}
                  onChange={e => setFormData(prev => ({ ...prev, bgmTrackId: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-rose-500 font-bold cursor-pointer"
                >
                  {PRESET_BGM_TRACKS.map(track => (
                    <option key={track.id} value={track.id}>
                      {track.name} — {track.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Custom Audio
                </label>

                {formData.customBgmDataUrl ? (
                  <div className="p-2.5 bg-slate-900 border border-rose-500/40 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs text-white font-medium truncate">
                        {formData.customBgmName || 'Custom Audio'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleTogglePreviewAudio}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        {isPlayingAudio ? <Square className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                        <span>{isPlayingAudio ? 'Stop' : 'Listen'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCustomAudio}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded-lg cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-slate-600 rounded-xl text-xs text-slate-300 font-bold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-rose-400" />
                    <span>Upload Audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Timer
          </label>
          <div className="flex items-center gap-2">
            {[5, 10, 15, 20, 30].map(sec => (
              <button
                type="button"
                key={sec}
                onClick={() => setFormData(prev => ({ ...prev, defaultTimer: sec }))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  formData.defaultTimer === sec
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-sm font-bold text-slate-200">Sound</span>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              formData.soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {formData.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-sm font-bold text-slate-200">Haptics</span>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, hapticsEnabled: !prev.hapticsEnabled }))}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              formData.hapticsEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            App URL
          </label>
          <input
            type="text"
            value={formData.appUrl}
            onChange={e => setFormData(prev => ({ ...prev, appUrl: e.target.value }))}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-sky-500"
            placeholder="https://byteprep.app"
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20 cursor-pointer mt-6 active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
      </form>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="w-full max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-6 animate-fadeIn">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-lg w-full max-h-[92vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};
