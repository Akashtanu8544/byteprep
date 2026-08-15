import React from 'react';
import { Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + / or ⌘ + /', description: 'Show Keyboard Shortcuts Cheatsheet' },
    { key: 'Ctrl + K or ⌘ + K', description: 'Quick Focus Search in Question Bank' },
    { key: 'Ctrl + E or ⌘ + E', description: 'Export Current Content / Video / Pack' },
    { key: 'Space', description: 'Play / Pause Video Preview' },
    { key: 'R', description: 'Pick Random Question from Bank' },
    { key: 'H', description: 'Toggle Hinglish / English Mode' },
    { key: 'F', description: 'Run AI Fact Check & Quality Shield' },
    { key: 'Escape', description: 'Close any active modal or view' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-black text-white">Creator Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
            >
              <span className="text-slate-300 font-medium">{sc.description}</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 text-sky-400 rounded-md font-mono text-[11px] font-bold">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
