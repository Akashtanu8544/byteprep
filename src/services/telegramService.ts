export interface TelegramTestResult {
  success: boolean;
  bot?: {
    id: number;
    username: string;
    firstName: string;
  };
  chat?: {
    id: number | string;
    title: string;
    type: string;
  };
  chatError?: string;
  error?: string;
}

export interface TelegramPollParams {
  botToken: string;
  chatId: string;
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation?: string;
  isAnonymous?: boolean;
}

export class TelegramService {
  /**
   * Sanitizes Bot Token (strips leading 'bot', spaces, tabs, newlines)
   */
  static cleanToken(rawToken: string): string {
    return String(rawToken || '')
      .trim()
      .replace(/^bot/i, '')
      .replace(/[\s\r\n\t]+/g, '');
  }

  /**
   * Sanitizes Chat ID or Channel Handle
   * handles:
   * - "mychannel" -> "@mychannel"
   * - "https://t.me/mychannel" -> "@mychannel"
   * - "t.me/mychannel" -> "@mychannel"
   * - "-1001234567890" -> "-1001234567890"
   */
  static cleanChatId(rawId: string): string {
    let clean = String(rawId || '')
      .trim()
      .replace(/[\s\r\n\t]+/g, '');
    
    clean = clean.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, '');
    
    // If it's not a numeric ID and doesn't start with @, prepend @
    if (!/^-?\d+$/.test(clean) && !clean.startsWith('@') && clean.length > 0) {
      clean = '@' + clean;
    }
    return clean;
  }

  /**
   * Translates Telegram API error descriptions into clear, actionable advice
   */
  static formatTelegramError(desc: string, chatId: string, botUsername?: string): string {
    const d = desc || '';
    if (d.includes('Unauthorized') || d.includes('Not Found') && d.includes('bot')) {
      return 'Invalid Bot Token. Please check that you copied the complete token from @BotFather without missing characters.';
    }
    if (d.includes('chat not found')) {
      return `Channel or chat "${chatId}" not found. Verify your channel username spelling. If it's a private channel, make sure the bot is an Administrator first, or use the numerical Chat ID (e.g. -100...).`;
    }
    if (d.includes('bot is not a member') || d.includes('Forbidden: bot was kicked') || d.includes('chat_admin_required')) {
      return `The bot ${botUsername ? `(${botUsername}) ` : ''}is not an Administrator in "${chatId}". In Telegram: Open Channel Settings > Administrators > Add Administrator > search for your bot and add it with "Post Messages" enabled.`;
    }
    if (d.includes('not enough rights') || d.includes('have no rights to send a message') || d.includes('CHAT_WRITE_FORBIDDEN')) {
      return `The bot is in "${chatId}" but does not have "Post Messages" permission. Please open Channel Settings > Administrators > select your bot > enable "Post Messages".`;
    }
    if (d.includes('non-anonymous polls')) {
      return 'Telegram channels require polls to be Anonymous. Please ensure the "Anonymous Poll" toggle is enabled.';
    }
    if (d.includes('options') || d.includes('too many') || d.includes('too few')) {
      return 'Telegram requires between 2 and 10 answer options, each under 100 characters.';
    }
    return d;
  }

  /**
   * Tests Bot Token and Channel access with dual fallback (Backend API -> Direct Telegram API)
   */
  static async testConnection(rawToken: string, rawChatId?: string): Promise<TelegramTestResult> {
    const token = this.cleanToken(rawToken);
    const chatId = this.cleanChatId(rawChatId || '');

    if (!token) {
      return { success: false, error: 'Bot API Token is required.' };
    }

    // Try backend proxy first
    try {
      const response = await fetch('/api/telegram/test-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token, chatId }),
      });

      const text = await response.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (response.ok && data.success) {
            return data;
          }
          if (data.error) {
            return { success: false, error: data.error, bot: data.bot, chatError: data.chatError };
          }
        } catch {
          // JSON parse failed, proceed to direct fallback
        }
      }
    } catch {
      // Backend request failed (network or server restarted), proceed to direct Telegram API
    }

    // Direct Browser to Telegram API fallback
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meRes.json();

      if (!meRes.ok || !meData.ok) {
        const desc = meData.description || 'Unauthorized: Invalid Bot Token.';
        return { success: false, error: this.formatTelegramError(desc, chatId) };
      }

      const botInfo = {
        id: meData.result.id,
        username: meData.result.username ? `@${meData.result.username}` : 'Bot',
        firstName: meData.result.first_name,
      };

      if (chatId) {
        const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`);
        const chatData = await chatRes.json();

        if (!chatRes.ok || !chatData.ok) {
          const chatErr = this.formatTelegramError(chatData.description || 'Chat not accessible', chatId, botInfo.username);
          return {
            success: true,
            bot: botInfo,
            chatError: chatErr,
          };
        }

        return {
          success: true,
          bot: botInfo,
          chat: {
            id: chatData.result.id,
            title: chatData.result.title || chatData.result.username || 'Chat',
            type: chatData.result.type,
          },
        };
      }

      return {
        success: true,
        bot: botInfo,
      };
    } catch (directErr: any) {
      return {
        success: false,
        error: `Could not reach Telegram servers (${directErr.message || 'Check your internet connection'}).`,
      };
    }
  }

  private static inflightPolls = new Map<string, Promise<{ success: boolean; error?: string; result?: any }>>();
  private static recentPollPosts = new Map<string, { timestamp: number; result: any }>();

  /**
   * Posts Quiz Poll with strict deduplication and dual fallback (Backend proxy -> Direct Telegram API)
   */
  static async postQuizPoll(params: TelegramPollParams): Promise<{ success: boolean; error?: string; result?: any }> {
    const token = this.cleanToken(params.botToken);
    const chatId = this.cleanChatId(params.chatId);

    if (!token || !chatId) {
      return { success: false, error: 'Both Bot Token and Channel/Chat ID are required.' };
    }

    const cleanQuestion = String(params.question || '').trim().replace(/\s+/g, ' ');
    const dedupKey = `${chatId}::${cleanQuestion.toLowerCase().slice(0, 120)}`;

    // 1. Guard against rapid duplicate calls within 15 seconds (e.g. double click or rapid re-trigger)
    const recent = this.recentPollPosts.get(dedupKey);
    if (recent && Date.now() - recent.timestamp < 15000) {
      console.warn(`[TelegramService] Prevented duplicate poll posting within 15s window: "${cleanQuestion.slice(0, 50)}..."`);
      return recent.result;
    }

    // 2. Guard against concurrent in-flight calls for the exact same question to the same chat
    if (this.inflightPolls.has(dedupKey)) {
      console.warn(`[TelegramService] In-flight poll request already active for: "${cleanQuestion.slice(0, 50)}...", awaiting existing request`);
      return await this.inflightPolls.get(dedupKey)!;
    }

    const postPromise = (async () => {
      // Try backend proxy first
      let backendHandled = false;
      try {
        const response = await fetch('/api/telegram/post-poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            botToken: token,
            chatId,
          }),
        });

        backendHandled = true;
        const text = await response.text();
        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (response.ok && (data.success || data.ok)) {
          const res = { success: true, result: data.poll || data.result };
          this.recentPollPosts.set(dedupKey, { timestamp: Date.now(), result: res });
          return res;
        }

        const errMsg = data.error || data.description || (data.result && data.result.description);
        return {
          success: false,
          error: errMsg || `Telegram delivery failed with status ${response.status}`,
        };
      } catch (proxyNetErr: any) {
        // Backend request network failed (offline or container proxy not ready)
        console.warn('Telegram backend proxy unavailable, attempting direct browser fallback:', proxyNetErr?.message);
      }

      // If backend responded with an HTTP response (even an error), DO NOT double-post to Telegram!
      if (backendHandled) {
        return { success: false, error: 'Telegram proxy failed to deliver poll.' };
      }

      // Direct Browser to Telegram API fallback ONLY if backend proxy was completely unreachable
      try {
        let qText = cleanQuestion;
        if (qText.length > 300) qText = qText.slice(0, 297) + '...';

        const cleanOptions = (params.options || []).slice(0, 10).map(opt => {
          let trimmed = String(opt || '').trim();
          if (trimmed.length > 100) trimmed = trimmed.slice(0, 97) + '...';
          return trimmed || 'Option';
        });

        if (cleanOptions.length < 2) {
          return { success: false, error: 'Telegram requires at least 2 answer choices.' };
        }

        let cleanExplanation = String(params.explanation || '').trim();
        if (cleanExplanation.length > 200) cleanExplanation = cleanExplanation.slice(0, 197) + '...';

        let correctIndex = 0;
        if (typeof params.correctAnswer === 'number') {
          correctIndex = params.correctAnswer;
        } else if (typeof params.correctAnswer === 'string') {
          const trimmed = params.correctAnswer.trim().toUpperCase();
          if (/^\d+$/.test(trimmed)) correctIndex = parseInt(trimmed, 10);
          else if (trimmed === 'A' || trimmed === 'OPTION A') correctIndex = 0;
          else if (trimmed === 'B' || trimmed === 'OPTION B') correctIndex = 1;
          else if (trimmed === 'C' || trimmed === 'OPTION C') correctIndex = 2;
          else if (trimmed === 'D' || trimmed === 'OPTION D') correctIndex = 3;
          else {
            const idx = cleanOptions.findIndex(o => o.toLowerCase() === trimmed.toLowerCase());
            if (idx !== -1) correctIndex = idx;
          }
        }
        correctIndex = Math.max(0, Math.min(cleanOptions.length - 1, correctIndex));

        const isChannel = chatId.startsWith('@') || chatId.startsWith('-100');
        const resolvedIsAnonymous = isChannel ? true : (params.isAnonymous !== false);

        const targetUrl = `https://api.telegram.org/bot${token}/sendPoll`;
        const directRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            question: qText,
            options: cleanOptions,
            is_anonymous: resolvedIsAnonymous,
            type: 'quiz',
            correct_option_id: correctIndex,
            explanation: cleanExplanation || undefined,
          }),
        });

        const directData = await directRes.json();
        if (directRes.ok && directData.ok) {
          const res = { success: true, result: directData.result };
          this.recentPollPosts.set(dedupKey, { timestamp: Date.now(), result: res });
          return res;
        }

        const desc = directData.description || 'Telegram API rejected the poll.';
        return {
          success: false,
          error: this.formatTelegramError(desc, chatId),
        };
      } catch (directErr: any) {
        return {
          success: false,
          error: `Network error reaching Telegram: ${directErr.message || 'Please check connection'}.`,
        };
      }
    })();

    this.inflightPolls.set(dedupKey, postPromise);
    try {
      return await postPromise;
    } finally {
      this.inflightPolls.delete(dedupKey);
    }
  }
}
