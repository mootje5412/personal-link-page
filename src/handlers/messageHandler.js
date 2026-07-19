const osintService = require('../services/osintService');
const paginationHandler = require('./paginationHandler');
const userService = require('../services/userService');
const config = require('../../config/config');

class MessageHandler {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text;

    console.log(`New search from ${msg.from.first_name} (${msg.from.id}): ${messageText}`);

    userService.registerUser(userId, msg.from.username, msg.from.first_name, msg.from.last_name);

    const isOwner = userId === config.ownerId;

    if (!isOwner) {
      const accessCheck = userService.checkAccess(userId);

      if (!accessCheck.hasAccess) {
        bot.sendMessage(chatId, `Access Denied

${accessCheck.message}

Use /prices to view available plans and contact @strafbaar to purchase a subscription.`);
        return;
      }
    }

    paginationHandler.clearSession(chatId);

    const query = messageText.trim();
    const searchMsg = await bot.sendMessage(chatId, `Searching for: ${query}\n\nPlease wait...`);

    try {
      const results = await osintService.search(query);

      bot.deleteMessage(chatId, searchMsg.message_id).catch(() => {});

      if (results && results.length > 0) {
        if (!isOwner) {
          const creditInfo = userService.useCredit(userId);
          if (creditInfo) {
            console.log(`User ${userId} used credit: ${creditInfo.used}/${creditInfo.used + creditInfo.remaining}`);
          }
        }

        paginationHandler.sendPaginatedResults(bot, chatId, query, results, 0);
      } else {
        bot.sendMessage(chatId, `No results found for: ${query}`);
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
