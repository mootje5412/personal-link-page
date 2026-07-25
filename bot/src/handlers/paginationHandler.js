const config = require('../../config/config');
const {
  resultsHeader,
  formatResultBlock
} = require('../utils/messages');
const { paginationKeyboard } = require('../utils/keyboards');

class PaginationHandler {
  constructor() {
    this.sessions = new Map();

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

  buildPageMessage(query, results, page) {
    const perPage = config.itemsPerPage;
    const totalPages = Math.max(1, Math.ceil(results.length / perPage));
    const safePage = Math.min(page, totalPages - 1);
    const start = safePage * perPage;
    const pageResults = results.slice(start, start + perPage);

    let message = resultsHeader(query, safePage, totalPages, results.length);

    pageResults.forEach((result, i) => {
      message += '\n\n' + formatResultBlock(start + i + 1, result);
    });

    return { message, safePage, totalPages, pageResults, start };
  }

  sendPage(bot, chatId, query, results, page = 0) {
    const { message, safePage, totalPages } = this.buildPageMessage(query, results, page);

    this.sessions.set(chatId, {
      query,
      results,
      page: safePage,
      timestamp: Date.now()
    });

    return bot.sendMessage(chatId, message, {
      parse_mode: 'MarkdownV2',
      reply_markup: totalPages > 1 ? paginationKeyboard(safePage, totalPages) : undefined,
      disable_web_page_preview: true
    });
  }

  handleCallback(bot, query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    if (data === 'page_current') {
      bot.answerCallbackQuery(query.id);
      return;
    }

    if (!data.startsWith('page_')) {
      bot.answerCallbackQuery(query.id);
      return;
    }

    const page = parseInt(data.split('_')[1], 10);
    const session = this.sessions.get(chatId);

    if (!session) {
      bot.answerCallbackQuery(query.id, {
        text: 'Session expired. Search again.',
        show_alert: true
      });
      return;
    }

    const { message, safePage, totalPages } = this.buildPageMessage(
      session.query,
      session.results,
      page
    );

    session.page = safePage;
    session.timestamp = Date.now();

    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: totalPages > 1 ? paginationKeyboard(safePage, totalPages) : undefined,
      disable_web_page_preview: true
    }).catch(() => {});

    bot.answerCallbackQuery(query.id);
  }
}

module.exports = new PaginationHandler();
