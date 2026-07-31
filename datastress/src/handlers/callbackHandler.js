const config = require('../../config/config');
const userService = require('../services/userService');
const paymentService = require('../services/paymentService');
const commandHandler = require('./commandHandler');
const {
  mainMenuKeyboard,
  backToMenuKeyboard,
  cryptoKeyboard,
  paymentConfirmKeyboard,
  ownerApprovalKeyboard
} = require('../utils/keyboards');

class CallbackHandler {
  handleCallback(bot, query) {
    const chatId = query.message.chat.id;
    const telegramId = query.from.id;
    const data = query.data;

    userService.registerUser(query.from);

    if (data === 'menu_main') {
      bot.answerCallbackQuery(query.id);
      bot.editMessageText('Menu', {
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

    if (data === 'menu_commands') {
      bot.answerCallbackQuery(query.id);
      commandHandler.sendCommandsHelp(bot, chatId, telegramId);
      return;
    }

    if (data.startsWith('method_')) {
      bot.answerCallbackQuery(query.id);
      commandHandler.sendMethodDetail(bot, chatId, data.replace('method_', ''));
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
      `Plan active: ${plan?.name}\nPayment ID: #${paymentId}\n\n/methods for commands`,
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

  editOrSendMethods(bot, chatId, messageId) {
    const { formatMethodsList } = require('../utils/commands');
    const message = `Methods\n\n${formatMethodsList()}`;

    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: require('../utils/keyboards').methodsKeyboard()
    }).catch(() => {
      commandHandler.sendMethods(bot, chatId);
    });
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
