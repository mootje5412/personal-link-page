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
      bot.editMessageText('DATASTRESS MENU\n────────────────────\nSelect an option:', {
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
      bot.sendMessage(
        chatId,
        `SELECT PAYMENT METHOD
────────────────────
Plan:  ${plan.name}
Price: ${plan.price} EUR

With what do you wanna pay?`,
        { reply_markup: cryptoKeyboard(planId) }
      );
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
      bot.answerCallbackQuery(query.id, { text: 'Payment not found' });
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
      bot.answerCallbackQuery(query.id, { text: 'Already submitted' });
      bot.sendMessage(
        chatId,
        `PAYMENT PENDING
────────────────────
Payment ID: #${paymentId}
Status:     Awaiting owner approval

The owner is reviewing your payment.`,
        { reply_markup: backToMenuKeyboard() }
      );
      return;
    }

    if (payment.status === 'rejected') {
      bot.answerCallbackQuery(query.id, { text: 'Payment was rejected' });
      return;
    }

    const submitted = userService.submitPaymentForReview(paymentId);
    const plan = config.plans.find((p) => p.id === payment.plan_id);
    const user = userService.getUser(telegramId);

    if (!submitted) {
      bot.answerCallbackQuery(query.id, { text: 'Could not submit payment' });
      return;
    }

    bot.answerCallbackQuery(query.id, { text: 'Submitted for review' });

    bot.editMessageText(
      `${query.message.text}\n\n────────────────────\nStatus: Awaiting owner approval\nPayment ID: #${paymentId}`,
      {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: { inline_keyboard: [[{ text: 'Back to Menu', callback_data: 'menu_main' }]] }
      }
    ).catch(() => {});

    bot.sendMessage(
      chatId,
      `PAYMENT SUBMITTED
────────────────────
Payment ID: #${paymentId}
Plan:       ${plan?.name || payment.plan_id}
Amount:     ${payment.amount_eur} EUR
Crypto:     ${payment.crypto.toUpperCase()}
Status:     Pending owner verification
────────────────────
Your plan will activate once the owner
confirms your payment was received.

Keep Payment ID: #${paymentId}`,
      { reply_markup: backToMenuKeyboard() }
    );

    if (config.adminUserId) {
      bot.sendMessage(
        config.adminUserId,
        paymentService.formatOwnerPaymentAlert(submitted, user, plan),
        { reply_markup: ownerApprovalKeyboard(paymentId) }
      ).catch(() => {});
    }

    return;
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
      bot.answerCallbackQuery(query.id, { text: 'Already processed or not found' });
      return;
    }

    bot.answerCallbackQuery(query.id, { text: 'Approved' });

    bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: `Approved #${paymentId}`, callback_data: 'menu_main' }]] },
      { chat_id: chatId, message_id: query.message.message_id }
    ).catch(() => {});

    bot.sendMessage(
      chatId,
      `PAYMENT APPROVED
────────────────────
Payment ID: #${paymentId}
User:       ${payment.telegram_id}
Plan:       ${plan?.name || payment.plan_id}
Status:     Activated`
    );

    bot.sendMessage(
      payment.telegram_id,
      `PLAN ACTIVATED
────────────────────
Payment ID: #${paymentId}
Plan:       ${plan?.name || payment.plan_id}
Duration:   ${plan?.maxDuration || 'N/A'}s max
Concurrent: ${plan?.concurrent || 1} slot${plan?.concurrent > 1 ? 's' : ''}
────────────────────
Your payment was verified and approved.

Launch attacks using slash commands:
  /udp ip port duration
  /help for full list`,
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
      bot.answerCallbackQuery(query.id, { text: 'Already processed or not found' });
      return;
    }

    bot.answerCallbackQuery(query.id, { text: 'Rejected' });

    bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: `Rejected #${paymentId}`, callback_data: 'menu_main' }]] },
      { chat_id: chatId, message_id: query.message.message_id }
    ).catch(() => {});

    bot.sendMessage(
      chatId,
      `PAYMENT REJECTED
────────────────────
Payment ID: #${paymentId}
User:       ${payment.telegram_id}`
    );

    bot.sendMessage(
      payment.telegram_id,
      `PAYMENT REJECTED
────────────────────
Payment ID: #${paymentId}

Your payment could not be verified.
Contact the owner if you believe this is an error.`,
      { reply_markup: backToMenuKeyboard() }
    ).catch(() => {});
  }

  editOrSendMethods(bot, chatId, messageId) {
    const lines = config.methods.map((m) => `  /${m.command} - ${m.name}`);
    const message = `AVAILABLE METHODS\n────────────────────\n\n${lines.join('\n')}\n\nTap a method for details:`;

    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: require('../utils/keyboards').methodsKeyboard()
    }).catch(() => {
      commandHandler.sendMethods(bot, chatId);
    });
  }

  editOrSendPlans(bot, chatId, messageId) {
    const message = `SUBSCRIPTION PLANS\n────────────────────\nAll plans include every method.\nPlans above 70 EUR include extra concurrent slots.\n\nSelect a plan:`;

    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: require('../utils/keyboards').plansKeyboard()
    }).catch(() => {
      commandHandler.sendPlans(bot, chatId);
    });
  }
}

module.exports = new CallbackHandler();
