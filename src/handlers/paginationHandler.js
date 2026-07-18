class PaginationHandler {
  constructor() {
    this.sessions = new Map();
    this.ITEMS_PER_PAGE = 10;
    
    // Clear all sessions on startup
    console.log('Pagination handler initialized - all sessions cleared');
    
    // Clear sessions after 2 minutes of inactivity
    setInterval(() => {
      const now = Date.now();
      for (const [chatId, session] of this.sessions.entries()) {
        if (now - session.timestamp > 2 * 60 * 1000) {
          this.sessions.delete(chatId);
          console.log(`Cleared session for chat ${chatId}`);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  clearSession(chatId) {
    this.sessions.delete(chatId);
    console.log(`Manually cleared session for chat ${chatId}`);
  }

  clearAllSessions() {
    this.sessions.clear();
    console.log('All sessions cleared');
  }

  sendPaginatedResults(bot, chatId, query, results, page = 0) {
    const totalPages = Math.ceil(results.length / this.ITEMS_PER_PAGE);
    const start = page * this.ITEMS_PER_PAGE;
    const end = start + this.ITEMS_PER_PAGE;
    const pageResults = results.slice(start, end);

    this.sessions.set(chatId, { 
      query, 
      results, 
      page,
      timestamp: Date.now()
    });

    let message = `Results for: ${query}\n`;
    message += `Page ${page + 1} of ${totalPages}\n`;
    message += `Total results: ${results.length}\n\n`;

    pageResults.forEach((item, index) => {
      const globalIndex = start + index + 1;
      message += `${globalIndex}. ${item}\n\n`;
    });

    const keyboard = this.createKeyboard(page, totalPages);

    bot.sendMessage(chatId, message, {
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
  }

  createKeyboard(page, totalPages) {
    const buttons = [];

    if (page > 0) {
      buttons.push({
        text: 'Back',
        callback_data: `page_${page - 1}`
      });
    }

    buttons.push({
      text: `${page + 1}/${totalPages}`,
      callback_data: 'current'
    });

    if (page < totalPages - 1) {
      buttons.push({
        text: 'Next',
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

    if (data.startsWith('page_')) {
      const page = parseInt(data.split('_')[1]);
      const session = this.sessions.get(chatId);

      if (!session) {
        bot.answerCallbackQuery(callbackQuery.id, { 
          text: 'Session expired. Please search again.',
          show_alert: true 
        });
        return;
      }

      const totalPages = Math.ceil(session.results.length / this.ITEMS_PER_PAGE);
      const start = page * this.ITEMS_PER_PAGE;
      const end = start + this.ITEMS_PER_PAGE;
      const pageResults = session.results.slice(start, end);

      session.page = page;
      session.timestamp = Date.now(); // Update timestamp on interaction

      let message = `Results for: ${session.query}\n`;
      message += `Page ${page + 1} of ${totalPages}\n`;
      message += `Total results: ${session.results.length}\n\n`;

      pageResults.forEach((item, index) => {
        const globalIndex = start + index + 1;
        message += `${globalIndex}. ${item}\n\n`;
      });

      const keyboard = this.createKeyboard(page, totalPages);

      bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboard,
        disable_web_page_preview: true
      });

      bot.answerCallbackQuery(callbackQuery.id);
    }
  }
}

module.exports = new PaginationHandler();
