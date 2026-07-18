const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const commandHandler = require('./handlers/commandHandler');
const messageHandler = require('./handlers/messageHandler');
const paginationHandler = require('./handlers/paginationHandler');

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
    this.bot.onText(/\/prices/, (msg) => commandHandler.handlePrices(this.bot, msg));
    
    // Handle callback queries for pagination and pricing
    this.bot.on('callback_query', (query) => {
      if (query.data.startsWith('page_') || query.data === 'current') {
        paginationHandler.handleCallback(this.bot, query);
      } else if (query.data.startsWith('price_')) {
        commandHandler.handlePriceCallback(this.bot, query);
      } else if (query.data === 'back_to_prices') {
        commandHandler.handlePrices(this.bot, query.message);
        this.bot.answerCallbackQuery(query.id);
      }
    });
    
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
