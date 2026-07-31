const config = require('../config/config');
const userService = require('./services/userService');
const commandHandler = require('./handlers/commandHandler');
const callbackHandler = require('./handlers/callbackHandler');

class DataStressBot {
  constructor() {
    this.bot = new (require('node-telegram-bot-api'))(config.botToken, {
      polling: config.polling
    });

    this.init();
  }

  init() {
    console.log(`${config.botName} is starting...`);

    this.bot.onText(/\/start/, (msg) => commandHandler.handleStart(this.bot, msg));
    this.bot.onText(/\/help/, (msg) => commandHandler.handleHelp(this.bot, msg));
    this.bot.onText(/\/account/, (msg) => commandHandler.handleAccount(this.bot, msg));

    this.bot.onText(/\/approve (\d+)/, (msg, match) => {
      this.handleApprove(msg, Number(match[1]));
    });

    this.bot.on('callback_query', (query) => {
      callbackHandler.handleCallback(this.bot, query);
    });

    this.bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      callbackHandler.handleMessage(this.bot, msg);
    });

    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error.code, error.message);

      if (error.code === 'ETELEGRAM' && String(error.message).includes('409 Conflict')) {
        console.error('Another bot instance is already polling this token.');
        this.bot.stopPolling();
        process.exit(1);
      }
    });

    console.log('DataStress bot is running.');
  }

  handleApprove(msg, paymentId) {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;

    if (adminId !== config.adminUserId) {
      this.bot.sendMessage(chatId, 'Unauthorized. Admin only.');
      return;
    }

    const payment = userService.confirmPayment(paymentId);

    if (!payment) {
      this.bot.sendMessage(chatId, `Payment #${paymentId} not found or already processed.`);
      return;
    }

    this.bot.sendMessage(chatId, `Payment #${paymentId} approved. Plan activated for user ${payment.telegram_id}.`);

    this.bot.sendMessage(
      payment.telegram_id,
      `Payment Approved\n\nYour plan has been activated.\nReference: #${paymentId}\n\nUse Launch Attack from the main menu to begin testing.`
    ).catch(() => {});
  }
}

module.exports = DataStressBot;
