const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const apiClient = require('./services/apiClient');
const commandHandler = require('./handlers/commandHandler');
const messageHandler = require('./handlers/messageHandler');
const paginationHandler = require('./handlers/paginationHandler');
const machinePaginationHandler = require('./handlers/machinePaginationHandler');

class ApexSearchBot {
  constructor() {
    if (!config.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is missing. Set it in bot/.env');
    }

    this.bot = new TelegramBot(config.botToken, { polling: config.polling });
    this.registerHandlers();
  }

  registerHandlers() {
    console.log(`${config.botName} v${config.version} starting...`);
    console.log(`Owner ID: ${config.ownerId}`);

    paginationHandler.clearAllSessions();
    machinePaginationHandler.clearAllSessions();

    this.bot.onText(/\/start/, (msg) => commandHandler.handleStart(this.bot, msg));
    this.bot.onText(/\/account/, (msg) => commandHandler.handleAccount(this.bot, msg));
    this.bot.onText(/\/myid/, (msg) => commandHandler.handleMyId(this.bot, msg));
    this.bot.onText(/\/prices/, (msg) => commandHandler.handlePrices(this.bot, msg));
    this.bot.onText(/\/machine (.+)/, (msg, match) => commandHandler.handleMachine(this.bot, msg, match));
    this.bot.onText(/\/grant (.+)/, (msg, match) => commandHandler.handleGrant(this.bot, msg, match));
    this.bot.onText(/\/revoke (.+)/, (msg, match) => commandHandler.handleRevoke(this.bot, msg, match));
    this.bot.onText(/\/users/, (msg) => commandHandler.handleUsers(this.bot, msg));

    this.bot.on('callback_query', (query) => {
      const data = query.data;

      if (data.startsWith('page_')) {
        paginationHandler.handleCallback(this.bot, query);
        return;
      }

      if (data.startsWith('mpage_')) {
        machinePaginationHandler.handleCallback(this.bot, query);
        return;
      }

      if (data.startsWith('menu_')) {
        commandHandler.handleMenuCallback(this.bot, query);
        return;
      }

      if (data.startsWith('price_')) {
        commandHandler.handlePriceCallback(this.bot, query);
      }
    });

    this.bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      messageHandler.handleMessage(this.bot, msg).catch((error) => {
        console.error('Unhandled message error:', error);
        this.bot.sendMessage(
          msg.chat.id,
          require('./utils/messages').errorMessage('Error', 'Something went wrong processing your request.'),
          { parse_mode: 'HTML', reply_markup: require('./utils/keyboards').supportKeyboard() }
        ).catch(() => {});
      });
    });

    process.on('unhandledRejection', (error) => {
      console.error('Unhandled rejection:', error);
    });

    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error.code, error.message);

      if (error.code === 'ETELEGRAM' && String(error.message).includes('409 Conflict')) {
        console.error('Another instance is already polling this token. Stopping.');
        this.bot.stopPolling();
        process.exit(1);
      }
    });

    this.checkApiHealth().catch((error) => {
      console.error('API health check failed:', error.message);
    });

    console.log('Bot is running and ready.');
  }

  async checkApiHealth() {
    if (!config.intelApiKey) {
      console.warn('INTEL_API_KEY is not set. Searches will fail until configured.');
      return;
    }

    const health = await apiClient.healthCheck();
    if (!health.ok) {
      if (isAuthBlocked(health.message)) {
        console.error(`API BLOCKED: ${health.message}`);
        console.error('Whitelist this server IP with the API provider or contact support.');
      } else {
        console.warn(`API health check warning: ${health.message}`);
      }
      return;
    }

    console.log('API connection OK.');
  }
}

function isAuthBlocked(message) {
  const lower = String(message || '').toLowerCase();
  return lower.includes('whitelist') || lower.includes('unauthorized');
}

module.exports = ApexSearchBot;
