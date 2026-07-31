const config = require('../../config/config');
const userService = require('../services/userService');
const attackHandler = require('./attackHandler');
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
        ? 'Plan: Owner (Unlimited)'
        : `Plan: ${plan.name} (${plan.maxDuration}s | ${plan.concurrent}c)`
      : 'Plan: None';

    const welcomeMessage = `DATASTRESS
Educational Network Stress Testing
────────────────────
Hello ${firstName}.

DataStress is built for authorized load testing and
network stress analysis on systems you own or have
explicit permission to test.

${planLine}

Features:
  - 8 attack methods via slash commands
  - Plans from 60s to 3000s (EUR pricing)
  - Crypto payments with owner verification

Commands:
  /start    Main menu
  /help     Full command list
  /account  Your subscription
  /methods  Available methods

Use the buttons below to get started.`;

    bot.sendMessage(chatId, welcomeMessage, { reply_markup: mainMenuKeyboard() });
  }

  handleHelp(bot, msg) {
    const chatId = msg.chat.id;
    const plan = userService.getActivePlan(msg.from.id);

    const methodLines = config.methods
      .map((m) => `  /${m.command} <ip> <port> <duration>  -  ${m.name}`)
      .join('\n');

    let helpMessage = `DATASTRESS HELP
────────────────────
General:
  /start     Main menu
  /help      This message
  /account   Your subscription
  /methods   View all methods

Attack format:
  /method ip port duration

Methods:
${methodLines}

Examples:
  /udp 192.168.1.1 80 60
  /tcp 10.0.0.5 443 120
  /http 127.0.0.1 8080 30`;

    if (plan) {
      helpMessage += `\n\nYour limits:
  Duration:   ${plan.isOwner ? 'Unlimited' : `${plan.maxDuration}s`}
  Concurrent: ${plan.isOwner ? 'Unlimited' : plan.concurrent}`;
    } else {
      helpMessage += '\n\nNo active plan. Purchase one under Plans.';
    }

    bot.sendMessage(chatId, helpMessage, { reply_markup: backToMenuKeyboard() });
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

    let message = `YOUR ACCOUNT
────────────────────
User ID:   ${telegramId}
Username:  ${user?.username ? `@${user.username}` : 'Not set'}`;

    if (plan?.isOwner) {
      message += `
Role:      Owner
Duration:  Unlimited
Concurrent: Unlimited
Expires:   Never`;
    } else if (plan) {
      message += `
Plan:      ${plan.name}
Duration:  ${plan.maxDuration}s max
Concurrent: ${plan.concurrent} slot${plan.concurrent > 1 ? 's' : ''}
Expires:   ${new Date(plan.expires_at).toLocaleString()}`;
    } else {
      message += `
Plan:      None

Purchase a plan and wait for owner approval.`;
    }

    bot.sendMessage(chatId, message, { reply_markup: backToMenuKeyboard() });
  }

  sendMainMenu(bot, chatId) {
    bot.sendMessage(chatId, 'DATASTRESS MENU\n────────────────────\nSelect an option:', {
      reply_markup: mainMenuKeyboard()
    });
  }

  sendMethods(bot, chatId) {
    const lines = config.methods.map(
      (m) => `  /${m.command}\n  ${m.name} - ${m.description}`
    );

    const message = `AVAILABLE METHODS
────────────────────

${lines.join('\n\n')}

Usage: /method ip port duration`;

    bot.sendMessage(chatId, message, { reply_markup: methodsKeyboard() });
  }

  sendCommandsHelp(bot, chatId, telegramId) {
    attackHandler.sendCommandsHelp(bot, chatId, telegramId);
  }

  sendMethodDetail(bot, chatId, methodId) {
    const method = config.methods.find((m) => m.id === methodId);

    if (!method) {
      bot.sendMessage(chatId, 'Method not found.', { reply_markup: backToMenuKeyboard() });
      return;
    }

    const message = `${method.name}
────────────────────
${method.description}

Command:
  /${method.command} <ip> <port> <duration>

Example:
  /${method.command} 192.168.1.1 80 60`;

    bot.sendMessage(chatId, message, { reply_markup: backToMenuKeyboard() });
  }

  sendPlans(bot, chatId) {
    const message = `SUBSCRIPTION PLANS
────────────────────
All plans include every method.
Plans above 70 EUR include extra concurrent slots.

Select a plan:`;

    bot.sendMessage(chatId, message, { reply_markup: plansKeyboard() });
  }

  sendPlanDetail(bot, chatId, planId) {
    const plan = config.plans.find((p) => p.id === planId);

    if (!plan) {
      bot.sendMessage(chatId, 'Plan not found.', { reply_markup: backToMenuKeyboard() });
      return;
    }

    const premiumNote = plan.price > 70 ? '\nPremium: Extra concurrent slots included' : '';

    const message = `${plan.name.toUpperCase()} PLAN
────────────────────
Max Duration:  ${plan.maxDuration} seconds
Concurrent:    ${plan.concurrent} slot${plan.concurrent > 1 ? 's' : ''}
All Methods:   Included
Price:         ${plan.price} EUR${premiumNote}
────────────────────
Tap Pay to proceed. Owner verifies all payments.`;

    bot.sendMessage(chatId, message, { reply_markup: planDetailKeyboard(planId) });
  }
}

module.exports = new CommandHandler();
