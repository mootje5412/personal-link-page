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
          `🔍 <b>No results</b>\n\nQuery: <code>${escapeHtml(query)}</code>\n\nTry a different search term.`,
          { parse_mode: 'HTML' }
        );
        return;
      }

      if (!this.isOwner(userId)) {
        const usage = userService.useSearch(userId);
        if (usage) {
          await paginationHandler.sendPage(bot, chatId, query, results, 0);
          bot.sendMessage(
            chatId,
            `📊 Searches today: <b>${usage.used}/${usage.limit}</b> (${usage.remaining} remaining)`,
            { parse_mode: 'HTML' }
          );
          return;
        }
      }

      await paginationHandler.sendPage(bot, chatId, query, results, 0);
    } catch (error) {
      console.error('Search error:', error);
      bot.editMessageText(
        `❌ Search failed for <code>${escapeHtml(query)}</code>\n\nPlease try again.`,
        {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'HTML'
        }
      ).catch(() => {
        bot.sendMessage(chatId, '❌ Search failed. Please try again.');
      });
    }
  }
}

module.exports = new MessageHandler();
