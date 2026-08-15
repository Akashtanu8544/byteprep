import React, { useState } from 'react';
import {
  X,
  Puzzle,
  Download,
  Zap,
  Share2,
  Smartphone,
  Webhook,
  ExternalLink,
  Copy,
  CheckCircle2,
  Sparkles,
  Youtube,
  Instagram,
  Facebook,
  QrCode,
  ArrowRight,
  Info,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { generateExtensionZip } from './extensionFiles';

interface SocialPostMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle?: string;
  currentCaption?: string;
  currentHashtags?: string;
  videoUrl?: string;
  videoBlob?: Blob;
}

export const SocialPostMethodsModal: React.FC<SocialPostMethodsModalProps> = ({
  isOpen,
  onClose,
  currentTitle = '10 Sec Computer Science Challenge #01',
  currentCaption = 'Can you solve this computer science challenge in 10 seconds? Drop your answer below!',
  currentHashtags = '#BytePrep #ComputerScience #Shorts #CodingChallenge',
  videoUrl,
  videoBlob,
}) => {
  const [activeTab, setActiveTab] = useState<'extension' | 'fastlaunch' | 'mobile' | 'webhook'>('extension');
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadExtensionZip = async () => {
    setIsDownloadingZip(true);
    try {
      const blob = await generateExtensionZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'byteprep-autoposter-extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate extension zip:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleFastLaunch = (platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok') => {
    const fullText = `${currentTitle}\n\n${currentCaption}\n\n${currentHashtags}`;
    navigator.clipboard.writeText(fullText);
    setCopiedKey('fastlaunch_copied');

    // If videoBlob or videoUrl exists, trigger download of video
    if (videoBlob || videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl || (videoBlob ? URL.createObjectURL(videoBlob) : '');
      a.download = `${currentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // Direct platform upload URLs
    const urls: Record<string, string> = {
      youtube: 'https://studio.youtube.com/channel/mine/videos/upload?d=ud',
      instagram: 'https://www.instagram.com/',
      facebook: 'https://business.facebook.com/latest/reels_composer',
      tiktok: 'https://www.tiktok.com/creator-center/upload',
    };

    window.open(urls[platform], '_blank');
  };

  // Sync with Chrome extension if active
  const handleSyncToExtension = () => {
    window.postMessage(
      {
        type: 'BYTEPREP_DISPATCH_TO_EXTENSION',
        payload: {
          formattedTitle: currentTitle,
          caption: currentCaption,
          hashtags: currentHashtags,
          timestamp: Date.now(),
        },
      },
      '*'
    );
    setCopiedKey('synced_extension');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Social Posting Methods & Extension</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                  100% Reliable
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose the best method to post YouTube Shorts, Instagram Reels, TikTok & FB Reels without OAuth blocks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'extension', name: 'Chrome Extension', icon: Puzzle, color: 'text-rose-400' },
            { id: 'fastlaunch', name: '1-Click Fast Launcher', icon: Zap, color: 'text-amber-400' },
            { id: 'mobile', name: 'Mobile Phone QR', icon: Smartphone, color: 'text-sky-400' },
            { id: 'webhook', name: 'Webhooks & Zapier', icon: Webhook, color: 'text-purple-400' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700 font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: CHROME EXTENSION */}
          {activeTab === 'extension' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Highlight Hero Card */}
              <div className="p-5 bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-slate-950 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-black text-white">BytePrep Social Auto-Poster Extension</h3>
                  </div>
                  <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                    Auto-fills Title, Description, #Shorts Tags, and upload settings directly on YouTube Studio, Instagram Web, Facebook Reels, and TikTok in 1-click.
                  </p>
                </div>
                <button
                  onClick={handleDownloadExtensionZip}
                  disabled={isDownloadingZip}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingZip ? 'Zipping Extension...' : 'DOWNLOAD EXTENSION (.ZIP)'}</span>
                </button>
              </div>

              {/* 30-Second Setup Instructions */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>How to Install in 30 Seconds (Chrome / Edge / Brave)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs">1</span>
                    <p className="font-bold text-white">Download & Unzip</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Click the button above to download <code className="text-rose-300 font-mono">byteprep-autoposter-extension.zip</code> and extract it anywhere on your PC/Mac.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">2</span>
                    <p className="font-bold text-white">Open Extensions</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Go to <code className="text-amber-300 font-mono">chrome://extensions</code> in your browser and turn on <b>Developer mode</b> (top right toggle).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">3</span>
                    <p className="font-bold text-white">Click "Load Unpacked"</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Click <b>Load unpacked</b> &rarr; select the unzipped folder. Done! The floating Auto-Filler is now live on YouTube, IG, FB & TikTok.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Sync Trigger */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-200">Current Video Package Ready to Sync</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                    {currentTitle}
                  </p>
                </div>
                <button
                  onClick={handleSyncToExtension}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'synced_extension' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Synced to Extension!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sync to Extension</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: 1-CLICK FAST LAUNCHER & SMART CLIPBOARD */}
          {activeTab === 'fastlaunch' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-950/70 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Zap className="w-4 h-4" />
                  <span>Zero-OAuth Fast Launcher (No token expiration, no domain errors)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click any platform below: It automatically downloads the MP4 video with the challenge name, copies the full Title & Description to your clipboard, and launches the upload page. Just drag-and-drop the video and press <b>Ctrl+V</b>!
                </p>
              </div>

              {/* 4 Platform Fast Launch Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* YouTube */}
                <button
                  onClick={() => handleFastLaunch('youtube')}
                  className="p-4 bg-slate-950 hover:bg-slate-900 border border-red-500/40 rounded-2xl transition-all text-left group cursor-pointer shadow-lg shadow-red-500/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                      <Youtube className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white group-hover:text-red-400 transition-colors">
                        Launch YouTube Studio
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Download MP4 + Auto-Copy Title & Open Upload
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>

                {/* Instagram */}
                <button
                  onClick={() => handleFastLaunch('instagram')}
                  className="p-4 bg-slate-950 hover:bg-slate-900 border border-pink-500/40 rounded-2xl transition-all text-left group cursor-pointer shadow-lg shadow-pink-500/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white group-hover:text-pink-400 transition-colors">
                        Launch Instagram Web
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Download MP4 + Auto-Copy Caption & Open Reels
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>

                {/* TikTok */}
                <button
                  onClick={() => handleFastLaunch('tiktok')}
                  className="p-4 bg-slate-950 hover:bg-slate-900 border border-cyan-500/40 rounded-2xl transition-all text-left group cursor-pointer shadow-lg shadow-cyan-500/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors">
                        Launch TikTok Studio
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Download MP4 + Auto-Copy Tags & Open Upload
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleFastLaunch('facebook')}
                  className="p-4 bg-slate-950 hover:bg-slate-900 border border-blue-500/40 rounded-2xl transition-all text-left group cursor-pointer shadow-lg shadow-blue-500/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Facebook className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white group-hover:text-blue-400 transition-colors">
                        Launch Meta Reels Composer
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Download MP4 + Auto-Copy Text & Open Composer
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>
              </div>

              {/* Quick Copy Helpers */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                <p className="text-xs font-bold text-slate-300">Quick Manual Copy Toolbar:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => copyToClipboard(currentTitle, 'title')}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Copy Title</span>
                    {copiedKey === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  <button
                    onClick={() => copyToClipboard(currentCaption, 'caption')}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Copy Description</span>
                    {copiedKey === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  <button
                    onClick={() => copyToClipboard(currentHashtags, 'tags')}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Copy Hashtags</span>
                    {copiedKey === 'tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MOBILE PHONE QR CODE */}
          {activeTab === 'mobile' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-xl shrink-0 flex items-center justify-center">
                  {/* Generated QR Code for Mobile Upload */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      window.location.href
                    )}`}
                    alt="Scan with mobile"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    <h4 className="text-sm font-black text-white">Scan & Post from Mobile in 5 Seconds</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Most creators post directly from their phone. Open your camera app, scan this QR code to load the challenge short on your iPhone or Android, save to Photos, and tap <b>Share &rarr; Instagram Reels / TikTok / YouTube Shorts</b>.
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                      ✓ Zero Login Issues
                    </span>
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                      ✓ Native Sound Effects
                    </span>
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                      ✓ Direct In-App Trending Music
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WEBHOOKS & ZAPIER / MAKE */}
          {activeTab === 'webhook' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-950/70 border border-purple-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Webhook className="w-4 h-4" />
                  <span>24/7 Hands-Free Automation via Zapier, Make.com, n8n, or Buffer</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Connect your Make.com or Zapier webhook. Whenever you render or schedule a challenge, BytePrep automatically sends the video payload with title, caption, hashtags, and question data to publish automatically on your schedule.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Sample Webhook JSON Payload:</label>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          {
                            event: 'byteprep.autopost',
                            title: currentTitle,
                            caption: currentCaption,
                            hashtags: currentHashtags.split(' '),
                            timestamp: new Date().toISOString(),
                          },
                          null,
                          2
                        ),
                        'webhook_json'
                      )
                    }
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'webhook_json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900/90 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
{`{
  "event": "byteprep.autopost",
  "title": "${currentTitle}",
  "caption": "${currentCaption}",
  "hashtags": ["#BytePrep", "#ComputerScience", "#Shorts"],
  "timestamp": "${new Date().toISOString()}"
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>All methods are 100% free of OAuth domain limits.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
