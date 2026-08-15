import React, { useState } from 'react';
import { ChallengeSettings } from '../../types';
import { StorageService } from '../../services/storageService';
import { Settings as SettingsIcon, Volume2, VolumeX, Smartphone, X, Save } from 'lucide-react';

interface SettingsModalProps {
  settings: ChallengeSettings;
  onSave: (updated: ChallengeSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<ChallengeSettings>({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.saveSettings(formData);
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-2xl">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Challenge Settings</h2>
            <p className="text-slate-400 text-xs">Customize gameplay & audio preferences</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Default Timer Duration
            </label>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20, 30, 60].map(sec => (
                <button
                  type="button"
                  key={sec}
                  onClick={() => setFormData(prev => ({ ...prev, defaultTimer: sec }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    formData.defaultTimer === sec
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-sm font-bold text-slate-200">Sound Effects</span>
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
            <span className="text-sm font-bold text-slate-200">Haptic Feedback (Vibration)</span>
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
              App Practice / Download URL
            </label>
            <input
              type="text"
              value={formData.appUrl}
              onChange={e => setFormData(prev => ({ ...prev, appUrl: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-sky-500"
              placeholder="https://byteprep.cs"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20 cursor-pointer mt-6"
          >
            <Save className="w-4 h-4" />
            <span>SAVE PREFERENCES</span>
          </button>
        </form>
      </div>
    </div>
  );
};
