const config = require('../../config/config');
const userService = require('../services/userService');
const searchService = require('../services/searchService');
const paginationHandler = require('./paginationHandler');
const {
  noAccessMessage,
  searchProgressMessage,
  escapeHtml
} = require('../utils/messages');

class MessageHandler {
  isOwner(userId) {
    return userId === config.ownerId;
  }

  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = msg.text.trim();

    if (!query) return;

    userService.registerUser(userId, msg.from.username, msg.from.first_name, msg.from.last_name);

    if (!this.isOwner(userId)) {
      const access = userService.checkAccess(userId);
      if (!access.hasAccess) {
        bot.sendMessage(chatId, noAccessMessage(access.message), { parse_mode: 'HTML' });
        return;
      }
    }

    paginationHandler.clearSession(chatId);

    const statusMsg = await bot.sendMessage(
      chatId,
      searchProgressMessage(query, 0),
      { parse_mode: 'HTML' }
    );

    let lastCount = 0;
    let lastEdit = 0;

    const onProgress = async (count) => {
      if (count === lastCount) return;

      const now = Date.now();
      if (now - lastEdit < 600) return;

      lastCount = count;
      lastEdit = now;

      await bot.editMessageText(searchProgressMessage(query, count), {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'HTML'
      }).catch(() => {});
    };

    try {
      const results = await searchService.mockSearch(query, onProgress);

      await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

      if (results.length === 0) {
        bot.sendMessage(
          chatId,
          `<b>No Results</b>\n\nQuery: <code>${escapeHtml(query)}</code>\n\nTry a different term.`,
          { parse_mode: 'HTML' }
        );
        return;
      }

      await paginationHandler.sendPage(bot, chatId, query, results, 0);
    } catch (error) {
      console.error('Search error:', error);
      bot.editMessageText(
        `<b>Search Failed</b>\n\nQuery: <code>${escapeHtml(query)}</code>`,
        {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'HTML'
        }
      ).catch(() => {
        bot.sendMessage(chatId, 'Search failed. Try again.');
      });
    }
  }
}

module.exports = new MessageHandler();
