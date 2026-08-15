import React, { useState } from 'react';
import { NormalizedQuestion } from '../../types';
import {
  Send,
  Copy,
  Check,
  Sparkles,
  Share2,
  Bot,
  ExternalLink,
  MessageSquare,
  Youtube,
  Facebook,
  CheckCircle2,
  HelpCircle,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface PollPostMakerProps {
  question: NormalizedQuestion;
  onQuestionChange?: (question: NormalizedQuestion) => void;
}

export const PollPostMaker: React.FC<PollPostMakerProps> = ({ question }) => {
  const [platform, setPlatform] = useState<'telegram' | 'youtube' | 'facebook' | 'whatsapp'>('telegram');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Telegram Direct Bot Integration State
  const [botToken, setBotToken] = useState<string>(() => localStorage.getItem('BYTEPREP_TG_BOT_TOKEN') || '');
  const [chatId, setChatId] = useState<string>(() => localStorage.getItem('BYTEPREP_TG_CHAT_ID') || '');
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Formatting helpers
  const correctOptionLetter = String.fromCharCode(65 + question.correctAnswer);
  const correctOptionText = question.options[question.correctAnswer] || '';

  // 1. Telegram Native Quiz / Text Format
  const tgQuizText = `🎯 *QUIZ OF THE DAY | ${question.exam.toUpperCase()}*
📚 *Subject:* ${question.subject} (${question.topic})

❓ *Q: ${question.question}*

${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━
💡 *Answer:* ||Option ${correctOptionLetter} - ${correctOptionText}||
📖 *Explanation:* ||${question.explanation || 'Refer to standard CS textbook.'}||

🚀 *Practice 1000+ PYQs on BytePrep:*
📲 Search *BytePrep TGT PGT CS* on Play Store
🌐 Visit: https://dsssbpyq.online

⚡ *Powered By BytePrep TGT PGT CS*
#${question.subject.replace(/[^a-zA-Z0-9]/g, '')} #DSSSB #PGTCS #TGTCS #BytePrep`;

  // 2. YouTube Community Tab Poll Format
  const ytCommunityText = `🔥 Daily CS MCQ Challenge! Can you solve this? 👇

❓ ${question.question}

(Vote in the poll below!)

👇 Detailed Explanation & Notes:
✅ Answer: Option ${correctOptionLetter} (${correctOptionText})
💡 Why: ${question.explanation}

🚀 Download 'BytePrep TGT PGT CS' app on Play Store for timed quizzes & daily tests!
🌐 Web practice: https://dsssbpyq.online

⚡ Powered By BytePrep TGT PGT CS
#ComputerScience #DSSSB #KVS #NVS #BytePrep`;

  // 3. Facebook / LinkedIn Group Interactive Post Format
  const fbPostText = `🧠 QUESTION OF THE DAY | ${question.exam} (${question.subject})

${question.question}

🔹 A) ${question.options[0]}
🔹 B) ${question.options[1]}
🔹 C) ${question.options[2]}
🔹 D) ${question.options[3]}

👉 Drop your answer (A, B, C, or D) in the comments before checking! 💬

────────────────────────
✅ CORRECT ANSWER: Option ${correctOptionLetter} (${correctOptionText})
📘 EXPLANATION: ${question.explanation}

📲 Practice unlimited chapterwise PYQs & 10s Flash Challenges:
Search "BytePrep TGT PGT CS" on Google Play Store
🌐 Website: https://dsssbpyq.online

⚡ Powered By BytePrep TGT PGT CS
#TGTCS #PGTCS #DSSSB2026 #KVSCS #ComputerTeacher #BytePrep`;

  // 4. WhatsApp Group Broadcast Format
  const waPostText = `*📚 BYTEPREP DAILY CS QUIZ*
*Exam:* ${question.exam} | *Topic:* ${question.topic}

*Q: ${question.question}*

A) ${question.options[0]}
B) ${question.options[1]}
C) ${question.options[2]}
D) ${question.options[3]}

*Reply with your answer!* ⏱️

*Correct Answer & Solution:*
Option *${correctOptionLetter}* - ${correctOptionText}
_${question.explanation}_

📱 Practice on App: Search *BytePrep TGT PGT CS* on Play Store
🌐 https://dsssbpyq.online

⚡ *Powered By BytePrep TGT PGT CS*`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleSaveTgConfig = () => {
    localStorage.setItem('BYTEPREP_TG_BOT_TOKEN', botToken.trim());
    localStorage.setItem('BYTEPREP_TG_CHAT_ID', chatId.trim());
    setShowConfig(false);
    setPushResult({
      success: true,
      message: 'Telegram credentials saved successfully on your device!',
    });
    setTimeout(() => setPushResult(null), 3000);
  };

  // Direct Auto Push to Telegram via Bot API sendPoll / sendMessage
  const handlePushTelegram = async (mode: 'quiz_poll' | 'text_message') => {
    if (!botToken.trim() || !chatId.trim()) {
      setShowConfig(true);
      setPushResult({
        success: false,
        message: 'Please configure your Telegram Bot Token & Channel/Chat ID first.',
      });
      return;
    }

    setIsPushing(true);
    setPushResult(null);

    try {
      if (mode === 'quiz_poll') {
        // Use Telegram sendPoll endpoint with type="quiz"
        const cleanQuestion = `[${question.subject}] ${question.question}`.slice(0, 300);
        const optionsList = question.options.slice(0, 10).map(o => o.slice(0, 100));
        const cleanExplanation = `${question.explanation} • Powered By BytePrep TGT PGT CS (dsssbpyq.online)`.slice(0, 200);

        const payload = {
          chat_id: chatId.trim(),
          question: cleanQuestion,
          options: JSON.stringify(optionsList),
          is_anonymous: false,
          type: 'quiz',
          correct_option_id: question.correctAnswer,
          explanation: cleanExplanation,
          explanation_parse_mode: 'HTML',
        };

        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));

        const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendPoll`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.ok) {
          setPushResult({
            success: true,
            message: `🎉 Successfully pushed native Quiz Poll to ${chatId}!`,
          });
        } else {
          throw new Error(data.description || 'Failed to send poll');
        }
      } else {
        // Send rich formatted text message with Powered by BytePrep
        const payload = {
          chat_id: chatId.trim(),
          text: tgQuizText,
          parse_mode: 'Markdown',
        };

        const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.ok) {
          setPushResult({
            success: true,
            message: `🎉 Successfully posted formatted Question & Solution to ${chatId}!`,
          });
        } else {
          throw new Error(data.description || 'Failed to send message');
        }
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        message: `Telegram API Error: ${err.message}`,
      });
    } finally {
      setIsPushing(false);
    }
  };

  const currentFormattedText =
    platform === 'telegram'
      ? tgQuizText
      : platform === 'youtube'
      ? ytCommunityText
      : platform === 'facebook'
      ? fbPostText
      : waPostText;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Share2 className="w-4 h-4" />
            </span>
            <h3 className="text-white font-black text-base sm:text-lg tracking-tight">
              Auto Poll & Quiz Post Maker
            </h3>
            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black">
              1-CLICK COPY / PUSH
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            Auto-generate and publish engaging MCQ Polls for Telegram, YouTube Community, Facebook & WhatsApp groups.
          </p>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-sky-400" />
          <span>{botToken ? 'Telegram Connected' : 'Setup Bot'}</span>
        </button>
      </div>

      {/* Telegram Bot Setup Drawer */}
      {showConfig && (
        <div className="bg-slate-950 border border-sky-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
              <Bot className="w-4 h-4" />
              <span>Telegram Bot Direct Auto-Push Settings</span>
            </div>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Get token from @BotFather</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Telegram Bot Token
              </label>
              <input
                type="text"
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNO..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Channel / Group Username or ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={e => setChatId(e.target.value)}
                placeholder="@my_channel or -100123456789"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              *Add your bot as Administrator in your channel with post permissions.
            </span>
            <button
              onClick={handleSaveTgConfig}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
            >
              Save Credentials
            </button>
          </div>
        </div>
      )}

      {/* Push Status Alert */}
      {pushResult && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            pushResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {pushResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{pushResult.message}</span>
          </div>
          <button
            onClick={() => setPushResult(null)}
            className="text-[11px] underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Platform Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'telegram', name: 'Telegram Quiz / Poll', icon: Send, color: 'text-sky-400' },
          { id: 'youtube', name: 'YouTube Community', icon: Youtube, color: 'text-rose-400' },
          { id: 'facebook', name: 'Facebook / LinkedIn', icon: Facebook, color: 'text-blue-400' },
          { id: 'whatsapp', name: 'WhatsApp Groups', icon: MessageSquare, color: 'text-emerald-400' },
        ].map(p => {
          const Icon = p.icon;
          const isActive = platform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-950 border border-sky-400 text-white shadow-lg shadow-sky-500/10'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${p.color}`} />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Content Preview Box */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2 text-xs font-black text-slate-300">
            <span>Live Output Preview</span>
            <span className="text-[10px] text-slate-500 font-normal">
              (Includes &apos;Powered By BytePrep TGT PGT CS&apos;)
            </span>
          </div>

          <button
            onClick={() => copyToClipboard(currentFormattedText, platform)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
          >
            {copiedType === platform ? (
              <Check className="w-3.5 h-3.5 text-emerald-950" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedType === platform ? 'Copied Post!' : '1-Click Copy Post'}</span>
          </button>
        </div>

        <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-1 select-all">
          {currentFormattedText}
        </pre>
      </div>

      {/* Platform Specific Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {platform === 'telegram' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => handlePushTelegram('quiz_poll')}
              disabled={isPushing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>{isPushing ? 'Pushing to Telegram...' : 'Auto Push Quiz Poll (Bot)'}</span>
            </button>

            <button
              onClick={() => handlePushTelegram('text_message')}
              disabled={isPushing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Send Full Post (Bot)</span>
            </button>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent('https://dsssbpyq.online')}&text=${encodeURIComponent(tgQuizText)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Telegram App</span>
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Formatted for instant copy-pasting to {platform.toUpperCase()}!</span>
          </div>
        )}

        <button
          onClick={() => copyToClipboard(currentFormattedText, 'all')}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {copiedType === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copy Clean Text</span>
        </button>
      </div>
    </div>
  );
};
