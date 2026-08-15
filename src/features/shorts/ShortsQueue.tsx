import React, { useState, useRef } from 'react';
import { QueueItem, ShortConfig } from '../../types';
import { exportShortVideo, RenderControl } from './videoRenderer';
import { StorageService } from '../../services/storageService';
import JSZip from 'jszip';
import {
  Play,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  X,
  Copy,
  Check,
  StopCircle,
  Archive,
  Zap,
} from 'lucide-react';
import { generateViralContent } from './captionGenerator';

interface ShortsQueueProps {
  queue: QueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
}

export const ShortsQueue: React.FC<ShortsQueueProps> = ({ queue, setQueue }) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const activeControlRef = useRef<RenderControl | null>(null);
  const shouldStopRef = useRef<boolean>(false);

  const processQueue = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    shouldStopRef.current = false;

    for (let i = 0; i < queue.length; i++) {
      if (shouldStopRef.current) break;

      const item = queue[i];
      if (item.status === 'completed') continue;

      // Update status to rendering
      setQueue(prev =>
        prev.map((q, idx) => (idx === i ? { ...q, status: 'rendering', progress: 0 } : q))
      );

      try {
        await new Promise<void>((resolve) => {
          const control = exportShortVideo(item.config, {
            onProgress: (progress) => {
              setQueue(prev =>
                prev.map((q, idx) => (idx === i ? { ...q, progress } : q))
              );
            },
            onComplete: (blob, videoUrl) => {
              activeControlRef.current = null;
              setQueue(prev =>
                prev.map((q, idx) =>
                  idx === i ? { ...q, status: 'completed', progress: 100, blob, videoUrl } : q
                )
              );
              StorageService.recordShortGenerated(
                item.question.id,
                item.config.hookText,
                item.config.themeId
              );
              resolve();
            },
            onError: (err) => {
              activeControlRef.current = null;
              setQueue(prev =>
                prev.map((q, idx) =>
                  idx === i ? { ...q, status: 'failed', error: err } : q
                )
              );
              resolve(); // Continue queue on error
            },
          });

          activeControlRef.current = control;
        });
      } catch (e) {
        console.error('Queue processing error', e);
      }
    }

    setIsProcessing(false);
    activeControlRef.current = null;
  };

  const handleStopQueue = () => {
    shouldStopRef.current = true;
    if (activeControlRef.current) {
      activeControlRef.current.cancel();
      activeControlRef.current = null;
    }
    setIsProcessing(false);
  };

  const handleDownload = (item: QueueItem) => {
    if (!item.blob) return;
    const link = document.createElement('a');
    const url = item.videoUrl || URL.createObjectURL(item.blob);
    link.href = url;
    const sanitizedSubject = item.question.subject.replace(/[^a-zA-Z0-9]/g, '_');
    const ext = item.blob.type.includes('mp4') ? 'mp4' : 'webm';
    link.download = `BytePrep_CS_${sanitizedSubject}_${item.question.id}.${ext}`;
    link.click();
    StorageService.recordShortDownloaded(item.question.id);
  };

  const handleDownloadAllZip = async () => {
    const completed = queue.filter(q => q.status === 'completed' && q.blob);
    if (completed.length === 0) return;

    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folder = zip.folder('BytePrep_Shorts_Batch');

      completed.forEach((item, idx) => {
        const sanitizedSubject = item.question.subject.replace(/[^a-zA-Z0-9]/g, '_');
        const ext = item.blob!.type.includes('mp4') ? 'mp4' : 'webm';
        const filename = `${String(idx + 1).padStart(2, '0')}_${sanitizedSubject}_${item.question.id}.${ext}`;
        if (folder && item.blob) {
          folder.file(filename, item.blob);
          const viral = generateViralContent(item.question, item.config.hookText);
          folder.file(
            `${String(idx + 1).padStart(2, '0')}_${sanitizedSubject}_caption.txt`,
            viral.youtubeCaption
          );
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `BytePrep_Shorts_Batch_${Date.now()}.zip`;
      link.click();
    } catch (e) {
      console.error('Failed to create ZIP', e);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyCaption = (item: QueueItem) => {
    const viral = generateViralContent(item.question, item.config.hookText);
    navigator.clipboard.writeText(viral.youtubeCaption);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  if (queue.length === 0) {
    return null;
  }

  const completedCount = queue.filter(q => q.status === 'completed').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-black text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Generated Videos & Render Queue ({queue.length})</span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Render all pending items with anti-hang protection. ({completedCount}/{queue.length} completed)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isProcessing ? (
            <button
              id="queue-render-all-btn"
              onClick={processQueue}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RENDER ALL ({queue.filter(q => q.status !== 'completed').length})</span>
            </button>
          ) : (
            <button
              onClick={handleStopQueue}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span>STOP QUEUE</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/25 transition-all cursor-pointer disabled:opacity-50"
              title="One-Click Download: Save all completed videos and viral captions in a single ZIP file"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PACKING ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ONE-CLICK DOWNLOAD ALL ({completedCount})</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={clearQueue}
            disabled={isProcessing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Clear Queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {queue.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl gap-3 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-xs font-mono font-bold text-slate-500 w-7 shrink-0">
                #{String(idx + 1).padStart(2, '0')}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-white text-xs sm:text-sm font-bold truncate">
                  {item.question.question}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 font-bold rounded-md border border-sky-500/20">
                    {item.question.subject}
                  </span>
                  <span>•</span>
                  <span className="text-slate-300 font-semibold">{item.config.hookText}</span>
                  <span>•</span>
                  <span className="text-slate-500">{item.config.themeId}</span>
                  <span>•</span>
                  <span className="text-amber-400">{item.config.durationMode || 'viral'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              {item.status === 'pending' && (
                <span className="text-xs font-bold text-slate-400 px-2.5 py-1 bg-slate-800 rounded-xl border border-slate-700">
                  Ready to Render
                </span>
              )}

              {item.status === 'rendering' && (
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="bg-sky-400 h-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-sky-400 font-bold">
                    {item.progress}%
                  </span>
                </div>
              )}

              {item.status === 'completed' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.videoUrl && (
                    <button
                      onClick={() => setPreviewVideoUrl(item.videoUrl!)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      title="Play / Preview Video"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>Preview</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyCaption(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    title="Copy Caption & Tags"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{copiedId === item.id ? 'Copied' : 'Caption'}</span>
                  </button>

                  <button
                    onClick={() => handleDownload(item)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                    title="Download Separate Video File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}

              {item.status === 'failed' && (
                <span className="flex items-center gap-1 text-xs font-bold text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed</span>
                </span>
              )}

              <button
                onClick={() => removeItem(item.id)}
                disabled={isProcessing && item.status === 'rendering'}
                className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">Video Preview</span>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-slate-800">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewVideoUrl;
                  link.download = `BytePrep_CS_Short_${Date.now()}.webm`;
                  link.click();
                }}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download This Video</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
