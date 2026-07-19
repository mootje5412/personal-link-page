const osintService = require('../services/osintService');
const paginationHandler = require('./paginationHandler');
const userService = require('../services/userService');
const config = require('../../config/config');

class MessageHandler {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text;

    userService.registerUser(userId, msg.from.username, msg.from.first_name, msg.from.last_name);

    const isOwner = userId === config.ownerId;

    if (!isOwner) {
      const accessCheck = userService.checkAccess(userId);

      if (!accessCheck.hasAccess) {
        bot.sendMessage(chatId, `Access Denied

${accessCheck.message}

Use /prices to view plans or contact @strafbaar to purchase.`);
        return;
      }
    }

    paginationHandler.clearSession(chatId);

    const query = messageText.trim();
    const searchMsg = await bot.sendMessage(chatId, `FindNow OSINT\n\nSearching: ${query}\nChecking breach, stealer, and OSINT sources...`);

    let lastCount = 0;
    let lastEdit = 0;

    const updateProgress = async (results) => {
      if (results.length === lastCount) {
        return;
      }

      lastCount = results.length;
      const now = Date.now();
      if (now - lastEdit < 700) {
        return;
      }

      lastEdit = now;
      await bot.editMessageText(
        `FindNow OSINT\n\nSearching: ${query}\nFound ${results.length} result${results.length === 1 ? '' : 's'} so far...`,
        { chat_id: chatId, message_id: searchMsg.message_id }
      ).catch(() => {});
    };

    try {
      const results = await osintService.search(query, updateProgress);

      await bot.deleteMessage(chatId, searchMsg.message_id).catch(() => {});

      if (results && results.length > 0) {
        if (!isOwner) {
          userService.useCredit(userId);
        }

        await paginationHandler.sendPaginatedResults(bot, chatId, query, results, 0);
      } else {
        bot.sendMessage(chatId, `FindNow OSINT\n\nNo results for: ${query}\n\nTry another query or use /machine <name> for stealer machines.`);
      }
    } catch (error) {
      console.error('Search error:', error);
      bot.editMessageText(`Search failed for: ${query}\n\nPlease try again.`, {
        chat_id: chatId,
        message_id: searchMsg.message_id
      }).catch(() => {
        bot.sendMessage(chatId, `Search failed for: ${query}\n\nPlease try again.`);
      });
    }
  }
}

module.exports = new MessageHandler();
