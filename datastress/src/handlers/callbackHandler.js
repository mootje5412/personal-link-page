const config = require('../../config/config');
const userService = require('../services/userService');
const paymentService = require('../services/paymentService');
const attackService = require('../services/attackService');
const commandHandler = require('./commandHandler');
const {
  mainMenuKeyboard,
  backToMenuKeyboard,
  cryptoKeyboard,
  paymentConfirmKeyboard
} = require('../utils/keyboards');

const attackSessions = new Map();

class CallbackHandler {
  handleCallback(bot, query) {
    const chatId = query.message.chat.id;
    const telegramId = query.from.id;
    const data = query.data;

    userService.registerUser(query.from);

    if (data === 'menu_main') {
      bot.answerCallbackQuery(query.id);
      bot.editMessageText('DataStress Menu\n\nSelect an option:', {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: mainMenuKeyboard()
      });
      return;
    }

    if (data === 'menu_methods') {
      bot.answerCallbackQuery(query.id);
      this.editOrSendMethods(bot, chatId, query.message.message_id);
      return;
    }

    if (data === 'menu_plans') {
      bot.answerCallbackQuery(query.id);
      this.editOrSendPlans(bot, chatId, query.message.message_id);
      return;
    }

    if (data === 'menu_account') {
      bot.answerCallbackQuery(query.id);
      commandHandler.sendAccount(bot, chatId, telegramId);
      return;
    }

    if (data === 'menu_attack') {
      bot.answerCallbackQuery(query.id);
      this.startAttackFlow(bot, chatId, telegramId, query.from);
      return;
    }

    if (data.startsWith('method_')) {
      const methodId = data.replace('method_', '');
      bot.answerCallbackQuery(query.id);
      commandHandler.sendMethodDetail(bot, chatId, methodId);
      return;
    }

    if (data.startsWith('plan_')) {
      const planId = Number(data.replace('plan_', ''));
      bot.answerCallbackQuery(query.id);
      commandHandler.sendPlanDetail(bot, chatId, planId);
      return;
    }

    if (data.startsWith('pay_')) {
      const planId = Number(data.replace('pay_', ''));
      const plan = config.plans.find((p) => p.id === planId);

      if (!plan) {
        bot.answerCallbackQuery(query.id, { text: 'Plan not found' });
        return;
      }

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, `With what do you wanna pay?\n\nPlan: ${plan.name} - ${plan.price} EUR`, {
        reply_markup: cryptoKeyboard(planId)
      });
      return;
    }

    if (data.startsWith('crypto_')) {
      const parts = data.replace('crypto_', '').split('_');
      const planId = Number(parts[0]);
      const crypto = parts[1];
      const plan = config.plans.find((p) => p.id === planId);

      if (!plan) {
        bot.answerCallbackQuery(query.id, { text: 'Plan not found' });
        return;
      }

      const paymentId = userService.createPayment(telegramId, planId, crypto, plan.price);
      const message = paymentService.formatPaymentMessage(plan, crypto, paymentId);

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, message, {
        reply_markup: paymentConfirmKeyboard(paymentId)
      });
      return;
    }

    if (data.startsWith('confirm_pay_')) {
      const paymentId = Number(data.replace('confirm_pay_', ''));
      const payment = userService.getPayment(paymentId);

      if (!payment) {
        bot.answerCallbackQuery(query.id, { text: 'Payment not found' });
        return;
      }

      if (payment.telegram_id !== telegramId) {
        bot.answerCallbackQuery(query.id, { text: 'Unauthorized' });
        return;
      }

      if (payment.status === 'confirmed') {
        bot.answerCallbackQuery(query.id, { text: 'Already confirmed' });
        bot.sendMessage(
          chatId,
          `Payment Already Active\n\nPayment ID: #${paymentId}\nYour plan is already activated.`,
          { reply_markup: backToMenuKeyboard() }
        );
        return;
      }

      const confirmed = userService.confirmPayment(paymentId);
      const plan = config.plans.find((p) => p.id === payment.plan_id);

      if (confirmed) {
        bot.answerCallbackQuery(query.id, { text: 'Plan activated' });

        bot.editMessageText(
          `${query.message.text}\n\nStatus: Confirmed\nPayment ID: #${paymentId}`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: [[{ text: 'Back to Menu', callback_data: 'menu_main' }]] }
          }
        ).catch(() => {});

        bot.sendMessage(
          chatId,
          `Payment Confirmed

Payment ID: #${paymentId}
Plan: ${plan?.name || payment.plan_id}
Amount: ${payment.amount_eur} EUR
Crypto: ${payment.crypto.toUpperCase()}

Your plan has been activated automatically.
Use Launch Attack from the main menu to begin testing.`,
          { reply_markup: backToMenuKeyboard() }
        );

        if (config.adminUserId) {
          bot.sendMessage(
            config.adminUserId,
            `Payment Auto-Confirmed

Payment ID: #${paymentId}
User: ${telegramId} (@${query.from.username || 'none'})
Plan: ${plan?.name || payment.plan_id}
Amount: ${payment.amount_eur} EUR
Crypto: ${payment.crypto.toUpperCase()}

Manual approve if needed: /approve ${paymentId}`
          ).catch(() => {});
        }
      } else {
        bot.answerCallbackQuery(query.id, { text: 'Activation failed - contact owner' });

        bot.editMessageText(
          `${query.message.text}\n\nStatus: Pending manual approval\nPayment ID: #${paymentId}`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: { inline_keyboard: [[{ text: 'Back to Menu', callback_data: 'menu_main' }]] }
          }
        ).catch(() => {});

        bot.sendMessage(
          chatId,
          `Payment Received - Manual Review Required

Payment ID: #${paymentId}
Plan: ${plan?.name || payment.plan_id}
Amount: ${payment.amount_eur} EUR
Crypto: ${payment.crypto.toUpperCase()}

Auto-activation failed. Give the owner your Payment ID: #${paymentId}`
        );

        if (config.adminUserId) {
          bot.sendMessage(
            config.adminUserId,
            `Payment Needs Manual Approval

Payment ID: #${paymentId}
User: ${telegramId} (@${query.from.username || 'none'})
Plan: ${plan?.name || payment.plan_id}
Amount: ${payment.amount_eur} EUR
Crypto: ${payment.crypto.toUpperCase()}

Approve: /approve ${paymentId}`
          ).catch(() => {});
        }
      }

      return;
    }

    bot.answerCallbackQuery(query.id);
  }

  editOrSendMethods(bot, chatId, messageId) {
    const lines = config.methods.map((m) => `- ${m.name}: ${m.description}`);
    const message = `Available Methods\n\n${lines.join('\n')}\n\nTap a method for details:`;

    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: require('../utils/keyboards').methodsKeyboard()
    }).catch(() => {
      commandHandler.sendMethods(bot, chatId);
    });
  }

  editOrSendPlans(bot, chatId, messageId) {
    const message = `Subscription Plans\n\nAll plans include access to all methods. Duration limits apply per attack.\n\nSelect a plan to view details and pay:`;

    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: require('../utils/keyboards').plansKeyboard()
    }).catch(() => {
      commandHandler.sendPlans(bot, chatId);
    });
  }

  startAttackFlow(bot, chatId, telegramId, from) {
    const plan = userService.getActivePlan(telegramId);

    if (!plan) {
      bot.sendMessage(
        chatId,
        'No Active Plan\n\nYou need an active subscription to launch attacks.\n\nGo to Plans to purchase one.',
        { reply_markup: backToMenuKeyboard() }
      );
      return;
    }

    attackSessions.set(telegramId, { step: 'target', plan });

    bot.sendMessage(
      chatId,
      `Launch Attack\n\nActive Plan: ${plan.name}\nMax Duration: ${plan.maxDuration}s\n\nSend target in this format:\n\nhost port method duration\n\nExample:\n192.168.1.1 80 http 60\n\nAvailable methods: ${config.methods.map((m) => m.id).join(', ')}`
    );
  }

  handleMessage(bot, msg) {
    const telegramId = msg.from.id;
    const chatId = msg.chat.id;
    const session = attackSessions.get(telegramId);

    if (!session) {
      return false;
    }

    const parts = msg.text.trim().split(/\s+/);

    if (parts.length < 4) {
      bot.sendMessage(chatId, 'Invalid format. Use: host port method duration\n\nExample: 192.168.1.1 80 http 60');
      return true;
    }

    const [target, portStr, method, durationStr] = parts;
    const port = Number(portStr);
    const duration = Number(durationStr);
    const plan = session.plan;

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      bot.sendMessage(chatId, 'Invalid port. Must be between 1 and 65535.');
      return true;
    }

    if (!Number.isInteger(duration) || duration < 1) {
      bot.sendMessage(chatId, 'Invalid duration. Must be a positive number.');
      return true;
    }

    if (duration > plan.maxDuration) {
      bot.sendMessage(chatId, `Duration exceeds your plan limit of ${plan.maxDuration}s.`);
      return true;
    }

    const validMethod = config.methods.find((m) => m.id === method.toLowerCase());

    if (!validMethod) {
      bot.sendMessage(chatId, `Unknown method "${method}". Available: ${config.methods.map((m) => m.id).join(', ')}`);
      return true;
    }

    attackSessions.delete(telegramId);

    const statusMsg = bot.sendMessage(chatId, `Launching attack...\n\nTarget: ${target}:${port}\nMethod: ${validMethod.name}\nDuration: ${duration}s`);

    statusMsg.then((sent) => {
      const attack = attackService.launchAttack({
        telegramId,
        username: msg.from.username,
        target,
        port,
        method: validMethod.name,
        duration
      });

      bot.editMessageText(
        `Attack Completed\n\nTarget: ${target}:${port}\nMethod: ${validMethod.name}\nDuration: ${duration}s\nStatus: ${attack.status}\nTimestamp: ${attack.timestamp}\n\nLogged to attacks.csv`,
        { chat_id: chatId, message_id: sent.message_id, reply_markup: backToMenuKeyboard() }
      );
    });

    return true;
  }
}

module.exports = new CallbackHandler();
