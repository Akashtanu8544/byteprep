import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';
import {
  generateQuizWithGemini,
  generateDsssbTgtDailyQuiz,
  suggestSeriesTitlesWithGemini,
  generatePostCaptionsWithGemini,
} from './server/geminiService';

dotenv.config();

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // Only handle /api/ endpoints
        if (!url.startsWith('/api/')) {
          return next();
        }

        // 1. DSSSB TGT PYQ Daily Quiz Generation (10 Qs)
        if ((url === '/api/telegram/generate-dsssb-daily' || url === '/api/ai/generate-dsssb-daily') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const questions = await generateDsssbTgtDailyQuiz(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, questions, total: questions.length }));
            } catch (err: any) {
              console.log('DSSSB TGT PYQ Generator Notice:', err?.message || err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Failed to generate DSSSB TGT questions' }));
            }
          });
          return;
        }

        // 2. Standard Gemini Quiz Generator
        if (url === '/api/generate-quiz' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const questions = await generateQuizWithGemini(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, questions }));
            } catch (err: any) {
              console.log('Gemini API Notice:', err?.message || err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Generation failed' }));
            }
          });
          return;
        }

        // 3. AI Series Title Suggestions
        if (url === '/api/ai/suggest-series-titles' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const suggestions = await suggestSeriesTitlesWithGemini(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, suggestions }));
            } catch (err: any) {
              console.log('Suggest Series Titles Notice:', err?.message || err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Failed to suggest titles' }));
            }
          });
          return;
        }

        // 4. AI Multi-Platform Post Metadata
        if (url === '/api/ai/generate-post-metadata' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const metadata = await generatePostCaptionsWithGemini(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, metadata }));
            } catch (err: any) {
              console.log('Generate Post Metadata Notice:', err?.message || err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Failed to generate metadata' }));
            }
          });
          return;
        }

        // 5. Telegram Bot Connection Test
        if (url === '/api/telegram/test-bot' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { botToken, chatId } = JSON.parse(body || '{}');
              if (!botToken) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Bot Token is required.' }));
              }
              const cleanBotToken = String(botToken).trim().replace(/^bot/i, '').replace(/[\s\r\n]+/g, '');
              const meRes = await fetch(`https://api.telegram.org/bot${cleanBotToken}/getMe`);
              const meData: any = await meRes.json().catch(() => ({}));
              if (!meRes.ok || !meData.ok) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: false,
                  error: meData.description || 'Unauthorized: Invalid Bot Token. Please copy from @BotFather.'
                }));
              }
              const botInfo = {
                id: meData.result.id,
                username: meData.result.username ? `@${meData.result.username}` : 'Bot',
                firstName: meData.result.first_name,
              };
              let chatInfo: any = null;
              if (chatId && String(chatId).trim()) {
                let cleanChatId = String(chatId).trim().replace(/[\s\r\n]+/g, '');
                cleanChatId = cleanChatId.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, '');
                if (!/^-?\d+$/.test(cleanChatId) && !cleanChatId.startsWith('@')) {
                  cleanChatId = '@' + cleanChatId;
                }
                const chatRes = await fetch(`https://api.telegram.org/bot${cleanBotToken}/getChat?chat_id=${encodeURIComponent(cleanChatId)}`);
                const chatData: any = await chatRes.json().catch(() => ({}));
                if (!chatRes.ok || !chatData.ok) {
                  let hint = chatData.description || 'Could not access chat';
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({
                    success: true,
                    bot: botInfo,
                    chatError: hint,
                    chatResolvedId: cleanChatId
                  }));
                }
                chatInfo = {
                  id: chatData.result.id,
                  title: chatData.result.title || chatData.result.username || 'Chat',
                  type: chatData.result.type,
                };
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                bot: botInfo,
                chat: chatInfo,
                message: `Bot ${botInfo.username} connected successfully!`
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Connection test failed' }));
            }
          });
          return;
        }

        // 6. Telegram Bot Send Poll Proxy
        if (url === '/api/telegram/post-poll' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { botToken, chatId, question, options, correctAnswer, explanation, isAnonymous } = JSON.parse(body || '{}');
              const cleanBotToken = String(botToken || '').trim().replace(/^bot/i, '').replace(/[\s\r\n]+/g, '');
              let cleanChatId = String(chatId || '').trim().replace(/[\s\r\n]+/g, '');
              cleanChatId = cleanChatId.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, '');
              if (!/^-?\d+$/.test(cleanChatId) && !cleanChatId.startsWith('@')) {
                cleanChatId = '@' + cleanChatId;
              }
              const isChannel = cleanChatId.startsWith('@') || cleanChatId.startsWith('-100');
              const resolvedIsAnonymous = isChannel ? true : (isAnonymous !== false);

              let correctIndex = typeof correctAnswer === 'number' ? correctAnswer : parseInt(String(correctAnswer), 10);
              if (isNaN(correctIndex) || correctIndex < 0) correctIndex = 0;

              const cleanOptions = (Array.isArray(options) ? options : []).slice(0, 10).map((opt: any) => String(opt || '').trim().slice(0, 95));
              const cleanQuestion = String(question || '').trim().slice(0, 290);
              const cleanExplanation = String(explanation || '').trim().slice(0, 195);

              const tgRes = await fetch(`https://api.telegram.org/bot${cleanBotToken}/sendPoll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: cleanChatId,
                  question: cleanQuestion,
                  options: cleanOptions,
                  is_anonymous: resolvedIsAnonymous,
                  type: 'quiz',
                  correct_option_id: correctIndex,
                  explanation: cleanExplanation || undefined,
                })
              });
              const tgData: any = await tgRes.json().catch(() => ({}));
              if (tgRes.ok && tgData.ok) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  message: 'Successfully posted interactive quiz to Telegram!',
                  poll: tgData.result,
                }));
              } else {
                res.statusCode = tgRes.status || 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: tgData.description || 'Telegram API rejected the poll.',
                }));
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Telegram delivery failed' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
