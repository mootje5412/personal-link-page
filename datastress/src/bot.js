const config = require('../config/config');
const userService = require('./services/userService');
const commandHandler = require('./handlers/commandHandler');
const callbackHandler = require('./handlers/callbackHandler');
const attackHandler = require('./handlers/attackHandler');
const { attackPattern, getBotCommands } = require('./utils/commands');

class DataStressBot {
  constructor() {
    this.bot = new (require('node-telegram-bot-api'))(config.botToken, {
      polling: config.polling
    });

    this.init();
  }

  async registerTelegramCommands() {
    try {
      await this.bot.setMyCommands(getBotCommands());
      console.log('Telegram commands registered.');
    } catch (error) {
      console.error('Failed to register commands:', error.message);
    }
  }

  init() {
    console.log(`${config.botName} is starting...`);

    this.registerTelegramCommands();

    this.bot.onText(/\/start(?:@\w+)?/i, (msg) => commandHandler.handleStart(this.bot, msg));
    this.bot.onText(/\/help(?:@\w+)?/i, (msg) => commandHandler.handleHelp(this.bot, msg));
    this.bot.onText(/\/account(?:@\w+)?/i, (msg) => commandHandler.handleAccount(this.bot, msg));
    this.bot.onText(/\/methods(?:@\w+)?/i, (msg) => commandHandler.handleMethods(this.bot, msg));

    this.bot.onText(/\/approve(?:@\w+)?\s+(\d+)/i, (msg, match) => {
      this.handleApprove(msg, Number(match[1]));
    });

    this.bot.onText(/\/reject(?:@\w+)?\s+(\d+)/i, (msg, match) => {
      this.handleReject(msg, Number(match[1]));
    });

    config.methods.forEach((method) => {
      this.bot.onText(attackPattern(method.command), (msg, match) => {
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
      console.log(`Owner ID: ${config.adminUserId}`);
    }
  }

  handleApprove(msg, paymentId) {
    const chatId = msg.chat.id;

    if (!userService.isOwner(msg.from.id)) {
      this.bot.sendMessage(chatId, 'Owner only.');
      return;
    }

    const payment = userService.confirmPayment(paymentId);
    const plan = config.plans.find((p) => p.id === payment?.plan_id);

    if (!payment) {
      this.bot.sendMessage(chatId, `Payment #${paymentId} not found.`);
      return;
    }

    this.bot.sendMessage(chatId, `Approved #${paymentId} for user ${payment.telegram_id}.`);

    this.bot.sendMessage(
      payment.telegram_id,
      `Plan activated: ${plan?.name || payment.plan_id}\nPayment ID: #${paymentId}\n\nUse /methods to see commands.`,
      { reply_markup: require('./utils/keyboards').backToMenuKeyboard() }
    ).catch(() => {});
  }

  handleReject(msg, paymentId) {
    const chatId = msg.chat.id;

    if (!userService.isOwner(msg.from.id)) {
      this.bot.sendMessage(chatId, 'Owner only.');
      return;
    }

    const payment = userService.rejectPayment(paymentId);

    if (!payment) {
      this.bot.sendMessage(chatId, `Payment #${paymentId} not found.`);
      return;
    }

    this.bot.sendMessage(chatId, `Rejected #${paymentId}.`);

    this.bot.sendMessage(
      payment.telegram_id,
      `Payment #${paymentId} rejected.\nContact owner if this is wrong.`,
      { reply_markup: require('./utils/keyboards').backToMenuKeyboard() }
    ).catch(() => {});
  }
}

module.exports = DataStressBot;
