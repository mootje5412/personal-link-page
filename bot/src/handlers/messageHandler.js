const config = require('../../config/config');
const userService = require('../services/userService');
const searchService = require('../services/searchService');
const paginationHandler = require('./paginationHandler');
const PLANS = require('../../config/plans');
const {
  noAccessMessage,
  searchProgressMessage,
  errorMessage,
  noResultsMessage
} = require('../utils/messages');
const { supportKeyboard } = require('../utils/keyboards');

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

    const startTime = Date.now();

    const pushProgress = async (count, status, types) => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (count === lastCount && status === lastStatus && elapsed === lastElapsed) return;

      const now = Date.now();
      if (now - lastEdit < 600 && status === lastStatus) return;

      lastCount = count;
      lastStatus = status;
      lastElapsed = elapsed;
      lastEdit = now;

      await bot.editMessageText(searchProgressMessage(query, count, { status, elapsed, types }), {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'HTML'
      }).catch(() => {});
    };

    let lastCount = 0;
    let lastStatus = null;
    let lastElapsed = -1;
    let lastEdit = 0;

    const heartbeat = setInterval(() => {
      pushProgress(lastCount, lastStatus).catch(() => {});
    }, 4000);

    const onProgress = async (count, status, types) => {
      await pushProgress(count, status, types);
    };

    try {
      const { results, meta } = await searchService.search(query, onProgress);

      await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

      if (results.length === 0) {
        bot.sendMessage(chatId, noResultsMessage(query, meta), {
          parse_mode: 'HTML',
          reply_markup: supportKeyboard()
        });
        return;
      }

      await paginationHandler.sendPage(bot, chatId, query, results, 0, meta.sourceCounts || {});
    } catch (error) {
      console.error('Search error:', error);
      const text = errorMessage('Search Failed', `Could not complete search for your query.`);

      bot.editMessageText(text, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'HTML',
        reply_markup: supportKeyboard()
      }).catch(() => {
        bot.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: supportKeyboard() });
      });
    } finally {
      clearInterval(heartbeat);
    }
  }
}

module.exports = new MessageHandler();
