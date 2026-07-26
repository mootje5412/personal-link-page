const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const commandHandler = require('./handlers/commandHandler');
const messageHandler = require('./handlers/messageHandler');
const paginationHandler = require('./handlers/paginationHandler');

class OdidoZoekerBot {
  constructor() {
    this.bot = new TelegramBot(config.botToken, {
      polling: config.polling,
    });
    this.init();
  }

  init() {
    console.log(`${config.botName} v${config.version} wordt gestart...`);

    this.bot.onText(/^\/start(?:@\w+)?(?:\s|$)/i, (msg) => {
      commandHandler.handleStart(this.bot, msg);
    });

    this.bot.onText(/^\/toegang(?:@\w+)?(?:\s([\s\S]*))?$/i, (msg, match) => {
      commandHandler.handleToegang(this.bot, msg, match);
    });

    this.bot.on('callback_query', (query) => {
      if (query.data.startsWith('page_')) {
        paginationHandler.handleCallback(this.bot, query);
      }
    });

    this.bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) {
        return;
      }

      messageHandler.handleMessage(this.bot, msg);
    });

    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error.code);
      console.error(error.message);

      if (error.code === 'ETELEGRAM' && String(error.message).includes('409 Conflict')) {
        console.error('Er draait al een andere bot-instantie op dit token. Deze instantie stopt.');
        this.bot.stopPolling();
        process.exit(1);
      }
    });

    console.log('Bot is actief en klaar voor zoekopdrachten.');
  }

  start() {
    // Polling start automatisch via de constructor.
  }
}

module.exports = OdidoZoekerBot;
