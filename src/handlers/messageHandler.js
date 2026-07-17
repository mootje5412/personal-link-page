const osintService = require('../services/osintService');

class MessageHandler {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    console.log(`📨 Message from ${msg.from.first_name} (${msg.from.id}): ${messageText}`);

    const query = messageText.trim();
    
    // Check if it looks like an email
    if (this.isEmail(query)) {
      bot.sendMessage(chatId, `📧 Searching for email...`);
      const results = await osintService.emailSearch(query);
      bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
      return;
    }

    // Check if it looks like an IP address
    if (this.isIP(query)) {
      bot.sendMessage(chatId, `🌐 Analyzing IP address...`);
      const results = await osintService.ipSearch(query);
      bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
      return;
    }

    // Check if it looks like a phone number
    if (this.isPhone(query)) {
      bot.sendMessage(chatId, `📱 Searching phone number...`);
      const results = await osintService.phoneSearch(query);
      bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
      return;
    }

    // Check if it's a single word (possible username)
    if (this.isUsername(query)) {
      bot.sendMessage(chatId, `👤 Searching username...`);
      const results = await osintService.usernameSearch(query);
      bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
      return;
    }

    // Default: general search
    bot.sendMessage(chatId, `🔍 Searching...`);
    const results = await osintService.generalSearch(query);
    bot.sendMessage(chatId, results, { parse_mode: 'Markdown', disable_web_page_preview: true });
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
