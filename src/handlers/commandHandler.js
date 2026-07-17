const osintService = require('../services/osintService');

class CommandHandler {
  handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';
    
    const welcomeMessage = `Welcome to FindNow OSINT Bot

Hello ${firstName}. Send me anything and I will search for information from public sources.

What I can search:
- Usernames across social platforms
- Email addresses
- Phone numbers
- IP addresses
- General queries

Just type what you want to search and I'll provide you with links to multiple sources.

This bot only uses publicly available information.`;
    
    bot.sendMessage(chatId, welcomeMessage);
  }
}

module.exports = new CommandHandler();
