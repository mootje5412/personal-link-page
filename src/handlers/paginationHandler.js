const { buildHeader, formatCategoryBlock, CATEGORY_LABELS } = require('../utils/resultFormatter');

class PaginationHandler {
  constructor() {
    this.sessions = new Map();
    this.ITEMS_PER_PAGE = 8;
    this.MAX_MESSAGE_LENGTH = 3900;
    this.MAX_ITEM_LENGTH = 500;

    setInterval(() => {
      const now = Date.now();
      for (const [chatId, session] of this.sessions.entries()) {
        if (now - session.timestamp > 5 * 60 * 1000) {
          this.sessions.delete(chatId);
        }
      }
    }, 30000);
  }

  clearSession(chatId) {
    this.sessions.delete(chatId);
  }

  clearAllSessions() {
    this.sessions.clear();
  }

  normalizeResult(item) {
    if (typeof item === 'string') {
      return { category: 'result', text: item };
    }
    return item;
  }

  truncateText(text) {
    if (text.length <= this.MAX_ITEM_LENGTH) {
      return text;
    }
    return `${text.substring(0, this.MAX_ITEM_LENGTH)}\n...(truncated)`;
  }

  formatResultBlock(index, result) {
    const entry = this.normalizeResult(result);
    const text = this.truncateText(entry.text || '');
    return formatCategoryBlock(index, entry.category, text);
  }

  buildPageMessage(query, pageResults, page, totalPages, totalResults, startIndex) {
    let message = `${buildHeader(query, page, totalPages, totalResults)}\n\n`;

    for (let index = 0; index < pageResults.length; index += 1) {
      const block = `${this.formatResultBlock(startIndex + index + 1, pageResults[index])}\n\n`;

      if (message.length + block.length > this.MAX_MESSAGE_LENGTH) {
        message += 'More results on the next page.';
        break;
      }

      message += block;
    }

    return message.trim();
  }

  buildDownloadRow(pageResults, startIndex) {
    const row = [];

    pageResults.forEach((result, index) => {
      const entry = this.normalizeResult(result);
      if (!entry.machineId) {
        return;
      }

      const label = CATEGORY_LABELS[entry.category] || 'DL';
      row.push({
        text: `Download #${startIndex + index + 1}`,
        callback_data: `download_machine_${entry.machineId}`
      });
    });

    if (row.length === 0) {
      return null;
    }

    return row.slice(0, 3);
  }

  createKeyboard(page, totalPages, pageResults = [], startIndex = 0) {
    const keyboard = [];
    const downloadRow = this.buildDownloadRow(pageResults, startIndex);

    if (downloadRow) {
      keyboard.push(downloadRow);
    }

    const nav = [];
    if (page > 0) {
      nav.push({ text: '◀ Prev', callback_data: `page_${page - 1}` });
    }
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: 'current' });
    if (page < totalPages - 1) {
      nav.push({ text: 'Next ▶', callback_data: `page_${page + 1}` });
    }

    keyboard.push(nav);

    return { inline_keyboard: keyboard };
  }

  sendPaginatedResults(bot, chatId, query, results, page = 0) {
    const totalPages = Math.max(1, Math.ceil(results.length / this.ITEMS_PER_PAGE));
    const safePage = Math.min(page, totalPages - 1);
    const start = safePage * this.ITEMS_PER_PAGE;
    const pageResults = results.slice(start, start + this.ITEMS_PER_PAGE);

    this.sessions.set(chatId, {
      query,
      results,
      page: safePage,
      timestamp: Date.now()
    });

    const message = this.buildPageMessage(query, pageResults, safePage, totalPages, results.length, start);
    const keyboard = this.createKeyboard(safePage, totalPages, pageResults, start);

    return bot.sendMessage(chatId, message, {
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
  }

  handleCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data === 'current') {
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (!data.startsWith('page_')) {
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    const page = parseInt(data.split('_')[1], 10);
    const session = this.sessions.get(chatId);

    if (!session) {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Session expired. Search again.',
        show_alert: true
      });
      return;
    }

    const totalPages = Math.max(1, Math.ceil(session.results.length / this.ITEMS_PER_PAGE));
    const safePage = Math.min(Math.max(page, 0), totalPages - 1);
    const start = safePage * this.ITEMS_PER_PAGE;
    const pageResults = session.results.slice(start, start + this.ITEMS_PER_PAGE);

    session.page = safePage;
    session.timestamp = Date.now();

    const message = this.buildPageMessage(
      session.query,
      pageResults,
      safePage,
      totalPages,
      session.results.length,
      start
    );
    const keyboard = this.createKeyboard(safePage, totalPages, pageResults, start);

    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
      disable_web_page_preview: true
    });

    bot.answerCallbackQuery(callbackQuery.id);
  }
}

module.exports = new PaginationHandler();
