import React, { useState } from 'react';
import {
  BackupStudioService,
  BackupPayload,
  RestoreDiffSummary,
} from '../../services/backupStudioService';
import { ExportService } from '../../services/exportService';
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  RefreshCw,
  FolderDown,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface BackupStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete?: () => void;
}

export const BackupStudioModal: React.FC<BackupStudioModalProps> = ({
  isOpen,
  onClose,
  onRestoreComplete,
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [uploadedBackup, setUploadedBackup] = useState<BackupPayload | null>(null);
  const [diffSummary, setDiffSummary] = useState<RestoreDiffSummary | null>(null);
  const [restoreMode, setRestoreMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const blob = await BackupStudioService.createFullBackup();
      const dateStr = new Date().toISOString().split('T')[0];
      ExportService.triggerDownload(blob, `BytePrep_Studio_Full_Backup_${dateStr}.zip`);
      setStatusMessage({
        text: 'Backup package generated and downloaded successfully!',
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: `Backup failed: ${err.message}`, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMessage(null);

    try {
      const payload = await BackupStudioService.parseBackupFile(file);
      const diff = BackupStudioService.inspectDiff(payload);
      setUploadedBackup(payload);
      setDiffSummary(diff);
    } catch (err: any) {
      setStatusMessage({ text: `Error reading backup file: ${err.message}`, type: 'error' });
    }
  };

  const handleExecuteRestore = async () => {
    if (!uploadedBackup) return;
    setIsRestoring(true);
    setStatusMessage(null);

    try {
      const res = await BackupStudioService.executeRestore(uploadedBackup, restoreMode);
      if (res.success) {
        setStatusMessage({ text: res.message, type: 'success' });
        setUploadedBackup(null);
        setDiffSummary(null);
        if (onRestoreComplete) onRestoreComplete();
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Restore error: ${err.message}`, type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-6 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Backup & Restore Studio</h2>
              <p className="text-xs text-slate-400">
                1-Click full backup & non-destructive restore with diff inspection.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action Blocks: Export Backup vs Restore Backup */}
        <div className="space-y-4">
          {/* Export Box */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <FolderDown className="w-4 h-4 text-sky-400" />
                <span>Export Full Studio Backup (.zip)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Exports manifest, questions, content packs, campaigns, brand kit, and CTA library.
              </p>
            </div>

            <button
              onClick={handleDownloadBackup}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 fill-current" />
              <span>{isExporting ? 'Generating...' : 'Download ZIP'}</span>
            </button>
          </div>

          {/* Import / Restore Box */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Restore Backup Package</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Upload a previously exported <code>.zip</code> or <code>.json</code> backup file.
              </p>
            </div>

            <input
              type="file"
              accept=".zip,.json"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />

            {/* Diff Inspection Card */}
            {diffSummary && (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-400 uppercase">Backup Manifest Verified</span>
                  <span className="text-slate-400">Created: {diffSummary.backupCreatedAt.slice(0, 10)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Questions In Backup</div>
                    <div className="text-base font-black text-white">
                      {diffSummary.backupQuestions} <span className="text-emerald-400 text-xs font-normal">(+{diffSummary.newQuestionsCount} new)</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Content Packs In Backup</div>
                    <div className="text-base font-black text-white">{diffSummary.backupPacks}</div>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Restoration Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRestoreMode('MERGE')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        restoreMode === 'MERGE'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Merge (Keep Existing)
                    </button>
                    <button
                      onClick={() => setRestoreMode('REPLACE')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        restoreMode === 'REPLACE'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Replace All Data
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRestoring ? 'Restoring Database...' : `Execute ${restoreMode} Restore`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
