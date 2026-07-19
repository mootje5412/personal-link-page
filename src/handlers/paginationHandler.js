class PaginationHandler {
  constructor() {
    this.sessions = new Map();
    this.ITEMS_PER_PAGE = 5;
    this.MAX_MESSAGE_LENGTH = 3900;
    this.MAX_ITEM_LENGTH = 700;

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

  truncateItem(item) {
    if (typeof item !== 'string') {
      return String(item);
    }
    if (item.length <= this.MAX_ITEM_LENGTH) {
      return item;
    }
    return `${item.substring(0, this.MAX_ITEM_LENGTH)}\n...(truncated)`;
  }

  buildPageMessage(query, pageResults, page, totalPages, totalResults, startIndex) {
    let message = `Results for: ${query}\n`;
    message += `Page ${page + 1} of ${totalPages} | Total: ${totalResults}\n`;
    message += `${'─'.repeat(28)}\n\n`;

    for (let index = 0; index < pageResults.length; index += 1) {
      const item = pageResults[index];
      const globalIndex = startIndex + index + 1;
      const block = `[${globalIndex}]\n${this.truncateItem(item)}\n\n`;

      if (message.length + block.length > this.MAX_MESSAGE_LENGTH) {
        message += '\n...message limit reached. Use Next for more results.';
        break;
      }

      message += block;
    }

    return message.trim();
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
    const keyboard = this.createKeyboard(safePage, totalPages);

    return bot.sendMessage(chatId, message, {
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
  }

  createKeyboard(page, totalPages) {
    const buttons = [];

    if (page > 0) {
      buttons.push({
        text: '◀ Back',
        callback_data: `page_${page - 1}`
      });
    }

    buttons.push({
      text: `${page + 1}/${totalPages}`,
      callback_data: 'current'
    });

    if (page < totalPages - 1) {
      buttons.push({
        text: 'Next ▶',
        callback_data: `page_${page + 1}`
      });
    }

    return {
      inline_keyboard: [buttons]
    };
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
    const keyboard = this.createKeyboard(safePage, totalPages);

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
