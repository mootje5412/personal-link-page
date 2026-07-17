const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const commandHandler = require('./handlers/commandHandler');
const messageHandler = require('./handlers/messageHandler');

class FindNowBot {
  constructor() {
    this.bot = new TelegramBot(config.botToken, { 
      polling: config.polling 
    });
    this.init();
  }

  init() {
    console.log(`🚀 ${config.botName} v${config.version} is starting...`);
    
    // Register command handlers
    this.bot.onText(/\/start/, (msg) => commandHandler.handleStart(this.bot, msg));
    this.bot.onText(/\/help/, (msg) => commandHandler.handleHelp(this.bot, msg));
    this.bot.onText(/\/search (.+)/, (msg, match) => commandHandler.handleSearch(this.bot, msg, match));
    this.bot.onText(/\/username (.+)/, (msg, match) => commandHandler.handleUsername(this.bot, msg, match));
    this.bot.onText(/\/email (.+)/, (msg, match) => commandHandler.handleEmail(this.bot, msg, match));
    this.bot.onText(/\/phone (.+)/, (msg, match) => commandHandler.handlePhone(this.bot, msg, match));
    this.bot.onText(/\/ip (.+)/, (msg, match) => commandHandler.handleIP(this.bot, msg, match));
    
    // Handle regular messages
    this.bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      messageHandler.handleMessage(this.bot, msg);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('❌ Polling error:', error.code);
      console.error(error.message);
    });

    console.log('✅ Bot is running and ready to receive messages!');
  }

  start() {
    // Bot is already started via polling
  }
}

module.exports = FindNowBot;
