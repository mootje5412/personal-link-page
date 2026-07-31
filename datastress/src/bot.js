const config = require('../config/config');
const userService = require('./services/userService');
const commandHandler = require('./handlers/commandHandler');
const callbackHandler = require('./handlers/callbackHandler');
const attackHandler = require('./handlers/attackHandler');

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
    this.bot.onText(/\/methods/, (msg) => commandHandler.handleMethods(this.bot, msg));

    this.bot.onText(/\/approve (\d+)/, (msg, match) => {
      this.handleApprove(msg, Number(match[1]));
    });

    this.bot.onText(/\/reject (\d+)/, (msg, match) => {
      this.handleReject(msg, Number(match[1]));
    });

    config.methods.forEach((method) => {
      const pattern = new RegExp(`\\/${method.command}\\s+(\\S+)\\s+(\\d+)\\s+(\\d+)`, 'i');
      this.bot.onText(pattern, (msg, match) => {
        attackHandler.handleAttackCommand(this.bot, msg, match, method);
      });
    });

    this.bot.on('callback_query', (query) => {
      callbackHandler.handleCallback(this.bot, query);
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
    if (config.adminUserId) {
      console.log(`Owner ID: ${config.adminUserId} (unlimited access)`);
    }
  }

  handleApprove(msg, paymentId) {
    const chatId = msg.chat.id;

    if (!userService.isOwner(msg.from.id)) {
      this.bot.sendMessage(chatId, 'Unauthorized. Owner only.');
      return;
    }

    const payment = userService.confirmPayment(paymentId);
    const plan = config.plans.find((p) => p.id === payment?.plan_id);

    if (!payment) {
      this.bot.sendMessage(chatId, `Payment #${paymentId} not found or already processed.`);
      return;
    }

    this.bot.sendMessage(
      chatId,
      `PAYMENT APPROVED
────────────────────
Payment ID: #${paymentId}
User:       ${payment.telegram_id}
Plan:       ${plan?.name || payment.plan_id}`
    );

    this.bot.sendMessage(
      payment.telegram_id,
      `PLAN ACTIVATED
────────────────────
Payment ID: #${paymentId}
Plan:       ${plan?.name || payment.plan_id}
Duration:   ${plan?.maxDuration || 'N/A'}s max
Concurrent: ${plan?.concurrent || 1} slot${plan?.concurrent > 1 ? 's' : ''}
────────────────────
Your payment was verified.

Use /help to see attack commands.`,
      { reply_markup: require('./utils/keyboards').backToMenuKeyboard() }
    ).catch(() => {});
  }

  handleReject(msg, paymentId) {
    const chatId = msg.chat.id;

    if (!userService.isOwner(msg.from.id)) {
      this.bot.sendMessage(chatId, 'Unauthorized. Owner only.');
      return;
    }

    const payment = userService.rejectPayment(paymentId);

    if (!payment) {
      this.bot.sendMessage(chatId, `Payment #${paymentId} not found or already processed.`);
      return;
    }

    this.bot.sendMessage(chatId, `Payment #${paymentId} rejected.`);

    this.bot.sendMessage(
      payment.telegram_id,
      `PAYMENT REJECTED
────────────────────
Payment ID: #${paymentId}

Your payment could not be verified.`,
      { reply_markup: require('./utils/keyboards').backToMenuKeyboard() }
    ).catch(() => {});
  }
}

module.exports = DataStressBot;
