const config = require('../../config/config');
const userService = require('../services/userService');
const {
  mainMenuKeyboard,
  backToMenuKeyboard,
  plansKeyboard,
  planDetailKeyboard,
  cryptoKeyboard,
  paymentConfirmKeyboard,
  methodsKeyboard
} = require('../utils/keyboards');

class CommandHandler {
  handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'User';

    userService.registerUser(msg.from);

    const welcomeMessage = `DataStress - Educational Network Stress Testing

Hello ${firstName}.

DataStress is an educational platform for learning about network load testing and stress analysis. Use it only on systems you own or have explicit written permission to test.

Features:
- Multiple attack methods for research
- Tiered plans with duration limits (60s to 3000s)
- Crypto payment support

Important:
This tool is strictly for educational and authorized testing purposes. Unauthorized use against third-party systems is illegal.

Select an option below:`;

    bot.sendMessage(chatId, welcomeMessage, { reply_markup: mainMenuKeyboard() });
  }

  handleHelp(bot, msg) {
    const chatId = msg.chat.id;

    const helpMessage = `DataStress Commands

/start - Main menu
/help - Show this help
/account - View your account

Use the inline buttons to browse methods, plans, and launch tests.`;

    bot.sendMessage(chatId, helpMessage, { reply_markup: backToMenuKeyboard() });
  }

  handleAccount(bot, msg) {
    this.sendAccount(bot, msg.chat.id, msg.from.id);
  }

  sendAccount(bot, chatId, telegramId) {
    const user = userService.getUser(telegramId);
    const plan = userService.getActivePlan(telegramId);

    let message = `Your Account

User ID: ${telegramId}
Username: ${user?.username ? `@${user.username}` : 'Not set'}
`;

    if (plan) {
      message += `
Active Plan: ${plan.name}
Max Duration: ${plan.maxDuration}s
Concurrent Slots: ${plan.concurrent}
Expires: ${new Date(plan.expires_at).toLocaleString()}`;
    } else {
      message += `
Active Plan: None

Purchase a plan to launch stress tests.`;
    }

    bot.sendMessage(chatId, message, { reply_markup: backToMenuKeyboard() });
  }

  sendMainMenu(bot, chatId) {
    const message = `DataStress Menu

Select an option:`;

    bot.sendMessage(chatId, message, { reply_markup: mainMenuKeyboard() });
  }

  sendMethods(bot, chatId) {
    const lines = config.methods.map((m) => `- ${m.name}: ${m.description}`);
    const message = `Available Methods

${lines.join('\n')}

Tap a method for details:`;

    bot.sendMessage(chatId, message, { reply_markup: methodsKeyboard() });
  }

  sendMethodDetail(bot, chatId, methodId) {
    const method = config.methods.find((m) => m.id === methodId);

    if (!method) {
      bot.sendMessage(chatId, 'Method not found.', { reply_markup: backToMenuKeyboard() });
      return;
    }

    const message = `Method: ${method.name}

${method.description}

Use this method when launching an attack from the main menu.`;

    bot.sendMessage(chatId, message, { reply_markup: backToMenuKeyboard() });
  }

  sendPlans(bot, chatId) {
    const message = `Subscription Plans

All plans include access to all methods. Duration limits apply per attack.

Select a plan to view details and pay:`;

    bot.sendMessage(chatId, message, { reply_markup: plansKeyboard() });
  }

  sendPlanDetail(bot, chatId, planId) {
    const plan = config.plans.find((p) => p.id === planId);

    if (!plan) {
      bot.sendMessage(chatId, 'Plan not found.', { reply_markup: backToMenuKeyboard() });
      return;
    }

    const message = `Plan: ${plan.name}

Max Attack Duration: ${plan.maxDuration} seconds
Concurrent Slots: ${plan.concurrent}
All Methods Included: Yes
Price: ${plan.price} EUR

Tap Pay to proceed with payment.`;

    bot.sendMessage(chatId, message, { reply_markup: planDetailKeyboard(planId) });
  }
}

module.exports = new CommandHandler();
