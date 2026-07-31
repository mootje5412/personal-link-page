const config = require('../../config/config');
const userService = require('../services/userService');
const attackHandler = require('./attackHandler');
const { formatMethodsList } = require('../utils/commands');
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

    const plan = userService.getActivePlan(msg.from.id);
    const planLine = plan
      ? plan.isOwner
        ? 'Plan: Owner (unlimited)'
        : `Plan: ${plan.name} | ${plan.maxDuration}s | ${plan.concurrent}c`
      : 'Plan: none';

    bot.sendMessage(
      chatId,
      `DataStress\n\nHi ${firstName}.\n${planLine}\n\n/methods - all attacks\n/help - quick guide\n\nEducational use only.`,
      { reply_markup: mainMenuKeyboard() }
    );
  }

  handleHelp(bot, msg) {
    const chatId = msg.chat.id;
    const plan = userService.getActivePlan(msg.from.id);

    let text = `Format: /method ip port duration\n\n${formatMethodsList()}\n\nExample:\n/udp 1.2.3.4 80 60`;

    if (plan) {
      text += `\n\nYour max: ${plan.isOwner ? 'unlimited' : `${plan.maxDuration}s | ${plan.concurrent}c`}`;
    } else {
      text += '\n\nNo plan yet. Buy one under Plans.';
    }

    bot.sendMessage(chatId, text, { reply_markup: backToMenuKeyboard() });
  }

  handleMethods(bot, msg) {
    this.sendMethods(bot, msg.chat.id);
  }

  handleAccount(bot, msg) {
    this.sendAccount(bot, msg.chat.id, msg.from.id);
  }

  sendAccount(bot, chatId, telegramId) {
    const user = userService.getUser(telegramId);
    const plan = userService.getActivePlan(telegramId);

    let text = `Account\nID: ${telegramId}\nUser: ${user?.username ? `@${user.username}` : 'none'}`;

    if (plan?.isOwner) {
      text += '\nRole: Owner\nLimits: unlimited';
    } else if (plan) {
      text += `\nPlan: ${plan.name}\nMax: ${plan.maxDuration}s\nConcurrent: ${plan.concurrent}\nExpires: ${new Date(plan.expires_at).toLocaleDateString()}`;
    } else {
      text += '\nPlan: none';
    }

    bot.sendMessage(chatId, text, { reply_markup: backToMenuKeyboard() });
  }

  sendMainMenu(bot, chatId) {
    bot.sendMessage(chatId, 'Menu', { reply_markup: mainMenuKeyboard() });
  }

  sendMethods(bot, chatId) {
    bot.sendMessage(
      chatId,
      `Methods\n\nLayer 4: /udp /tcp /icmp /dns\nLayer 7: /http /post /slowloris /browser /cloudflare\n\nTap a method:`,
      { reply_markup: methodsKeyboard() }
    );
  }

  sendCommandsHelp(bot, chatId, telegramId) {
    attackHandler.sendCommandsHelp(bot, chatId, telegramId);
  }

  sendPlans(bot, chatId) {
    bot.sendMessage(chatId, 'Plans. All methods included. 70+ EUR plans get extra concurrent slots.', {
      reply_markup: plansKeyboard()
    });
  }

  sendPlanDetail(bot, chatId, planId) {
    const plan = config.plans.find((p) => p.id === planId);

    if (!plan) {
      bot.sendMessage(chatId, 'Not found.', { reply_markup: backToMenuKeyboard() });
      return;
    }

    bot.sendMessage(
      chatId,
      `${plan.name}\n${plan.maxDuration}s max | ${plan.concurrent}c | ${plan.price} EUR`,
      { reply_markup: planDetailKeyboard(planId) }
    );
  }
}

module.exports = new CommandHandler();
