const osintService = require('../services/osintService');
const paginationHandler = require('./paginationHandler');

class MessageHandler {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    console.log(`Message from ${msg.from.first_name} (${msg.from.id}): ${messageText}`);

    const query = messageText.trim();
    
    bot.sendMessage(chatId, `Searching...`);

    let results;
    
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
    
    if (results && results.length > 0) {
      paginationHandler.sendPaginatedResults(bot, chatId, query, results, 0);
    } else {
      bot.sendMessage(chatId, 'No results found');
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
