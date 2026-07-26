const { PAGE_SIZE, formatPageMessage } = require('../utils/formatResults');

class PaginationHandler {
  constructor() {
    this.sessions = new Map();
  }

  saveSession(chatId, session) {
    this.sessions.set(chatId, session);
  }

  getSession(chatId) {
    return this.sessions.get(chatId);
  }

  clearSession(chatId) {
    this.sessions.delete(chatId);
  }

  createKeyboard(page, totalPages) {
    const buttons = [];

    if (page > 0) {
      buttons.push({ text: '⬅️ Vorige', callback_data: `page_${page - 1}` });
    }

    buttons.push({ text: `${page + 1} / ${totalPages}`, callback_data: 'page_current' });

    if (page < totalPages - 1) {
      buttons.push({ text: 'Volgende ➡️', callback_data: `page_${page + 1}` });
    }

    return { inline_keyboard: [buttons] };
  }

  async sendResults(bot, chatId, query, results, page = 0, messageId = null, searchOptions = {}) {
    const formatted = formatPageMessage(query, results, page, searchOptions);
    const keyboard = this.createKeyboard(formatted.page, formatted.totalPages);

    this.saveSession(chatId, {
      query,
      results,
      page: formatted.page,
      messageId,
      broad: searchOptions.broad || false,
    });

    const messageOptions = {
      reply_markup: keyboard,
      disable_web_page_preview: true,
    };

    if (messageId) {
      await bot.editMessageText(formatted.text, {
        chat_id: chatId,
        message_id: messageId,
        ...messageOptions,
      });
      return messageId;
    }

    const sent = await bot.sendMessage(chatId, formatted.text, messageOptions);
    this.saveSession(chatId, {
      query,
      results,
      page: formatted.page,
      messageId: sent.message_id,
      broad: searchOptions.broad || false,
    });
    return sent.message_id;
  }

  async handleCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data === 'page_current') {
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (!data.startsWith('page_')) {
      return;
    }

    const page = Number.parseInt(data.replace('page_', ''), 10);
    const session = this.getSession(chatId);

    if (!session || Number.isNaN(page)) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Zoekopdracht verlopen. Zoek opnieuw.' });
      return;
    }

    try {
      await this.sendResults(
        bot,
        chatId,
        session.query,
        session.results,
        page,
        messageId,
        { broad: session.broad },
      );
      await bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Kon pagina niet laden.' });
    }
  }
}

module.exports = new PaginationHandler();
