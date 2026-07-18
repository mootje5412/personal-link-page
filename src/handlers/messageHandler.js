const osintService = require('../services/osintService');
const paginationHandler = require('./paginationHandler');
const userService = require('../services/userService');

class MessageHandler {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text;

    console.log(`New search from ${msg.from.first_name} (${msg.from.id}): ${messageText}`);

    // Check user access
    const accessCheck = userService.checkAccess(userId);
    
    if (!accessCheck.hasAccess) {
      bot.sendMessage(chatId, `Access Denied

${accessCheck.message}

Use /prices to view available plans and contact @strafbaar to purchase a subscription.`);
      return;
    }

    // Clear any existing session for this chat
    paginationHandler.clearSession(chatId);

    const query = messageText.trim();
    
    const searchMsg = await bot.sendMessage(chatId, `Searching for: ${query}\n\nPlease wait...`);

    let results;
    
    try {
      if (this.isEmail(query)) {
        results = await osintService.emailSearch(query);
      } else if (this.isIP(query)) {
        results = await osintService.ipSearch(query);
      } else if (this.isPhone(query)) {
        results = await osintService.phoneSearch(query);
      } else if (this.isUsername(query)) {
        results = await osintService.usernameSearch(query);
      } else {
        results = await osintService.generalSearch(query);
      }
      
      // Delete the searching message
      bot.deleteMessage(chatId, searchMsg.message_id).catch(() => {});
      
      if (results && results.length > 0) {
        // Use a credit for successful search
        const creditInfo = userService.useCredit(userId);
        
        paginationHandler.sendPaginatedResults(bot, chatId, query, results, 0);
        
        if (creditInfo) {
          console.log(`User ${userId} used credit: ${creditInfo.used}/${creditInfo.used + creditInfo.remaining}`);
        }
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

  isEmail(text) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  }

  isIP(text) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(text);
  }

  isPhone(text) {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(text.replace(/\s/g, ''));
  }

  isUsername(text) {
    const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
    return usernameRegex.test(text) && !text.includes(' ');
  }
}

module.exports = new MessageHandler();
