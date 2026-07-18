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
    
    // Clear all sessions on startup
    paginationHandler.clearAllSessions();
    
    // Register command handlers
    this.bot.onText(/\/start/, (msg) => commandHandler.handleStart(this.bot, msg));
    this.bot.onText(/\/prices/, (msg) => commandHandler.handlePrices(this.bot, msg));
    this.bot.onText(/\/account/, (msg) => commandHandler.handleAccount(this.bot, msg));
    this.bot.onText(/\/myid/, (msg) => commandHandler.handleMyId(this.bot, msg));
    this.bot.onText(/\/machine (.+)/, (msg, match) => commandHandler.handleMachine(this.bot, msg, match));
    this.bot.onText(/\/download_(.+)/, (msg, match) => commandHandler.handleDownload(this.bot, msg, match));
    
    // Admin commands
    this.bot.onText(/\/grant (.+)/, (msg, match) => commandHandler.handleGrant(this.bot, msg, match));
    this.bot.onText(/\/grantid (.+)/, (msg, match) => commandHandler.handleGrantId(this.bot, msg, match));
    this.bot.onText(/\/revoke (.+)/, (msg, match) => commandHandler.handleRevoke(this.bot, msg, match));
    this.bot.onText(/\/users/, (msg) => commandHandler.handleListUsers(this.bot, msg));
    
    // Handle callback queries for pagination and pricing
    this.bot.on('callback_query', (query) => {
      if (query.data.startsWith('page_') || query.data === 'current') {
        paginationHandler.handleCallback(this.bot, query);
      } else if (query.data.startsWith('price_')) {
        commandHandler.handlePriceCallback(this.bot, query);
      } else if (query.data === 'back_to_prices') {
        commandHandler.handlePrices(this.bot, query.message);
        this.bot.answerCallbackQuery(query.id);
      } else if (query.data.startsWith('download_machine_')) {
        commandHandler.handleMachineDownloadCallback(this.bot, query);
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
    console.log('All previous sessions have been cleared');
  }

  start() {
    // Bot is already started via polling
  }
}

module.exports = FindNowBot;
