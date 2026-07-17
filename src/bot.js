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
    console.log(`${config.botName} v${config.version} is starting...`);
    
    // Register command handlers
    this.bot.onText(/\/start/, (msg) => commandHandler.handleStart(this.bot, msg));
    
    // Handle regular messages
    this.bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      messageHandler.handleMessage(this.bot, msg);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error.code);
      console.error(error.message);
    });

    console.log('Bot is running and ready!');
  }

  start() {
    // Bot is already started via polling
  }
}

module.exports = FindNowBot;
