const config = require('../../config/config');
const userService = require('../services/userService');
const machineSearchService = require('../services/machineSearchService');
const machinePaginationHandler = require('./machinePaginationHandler');
const {
  welcomeMessage,
  howItWorksMessage,
  aiSearchMessage,
  pricingMessage,
  planDetailMessage,
  apisMessage,
  premiumRequiredMessage,
  machineProgressMessage,
  errorMessage,
  noResultsMessage,
  machineNoResultsMessage,
  escapeHtml,
  purchaseLine
} = require('../utils/messages');
const {
  mainMenuKeyboard,
  backToStartKeyboard,
  pricingKeyboard,
  supportKeyboard
} = require('../utils/keyboards');
const PLANS = require('../../config/plans');

class CommandHandler {
  isOwner(userId) {
    return userId === config.ownerId;
  }

  sendStart(bot, chatId, firstName) {
    return bot.sendMessage(chatId, welcomeMessage(firstName), {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard()
    });
  }

  handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'User';

    userService.registerUser(msg.from.id, msg.from.username, msg.from.first_name, msg.from.last_name);
    this.sendStart(bot, chatId, firstName);
  }

  handleAccount(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const info = userService.getAccountInfo(userId);

    if (!info) {
      bot.sendMessage(
        chatId,
        [
          '<b>Account</b>',
          '',
          `User ID: <code>${userId}</code>`,
          '',
          'No active subscription.',
          '',
          'Use /prices to view plans.',
          '',
          purchaseLine()
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: backToStartKeyboard() }
      );
      return;
    }

    bot.sendMessage(
      chatId,
      [
        '<b>Account</b>',
        '',
        `User ID: <code>${userId}</code>`,
        `Username: @${escapeHtml(info.username || 'unknown')}`,
        `Plan: <b>${escapeHtml(info.plan)}</b>`,
        `Searches: <b>${info.searches}</b>`,
        `Machine Viewer: <b>${info.machine_viewer ? 'active' : 'not included'}</b>`,
        `Expires in: <b>${info.days_left} days</b>`,
        `Expiry: <b>${escapeHtml(info.expires_at)}</b>`
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: backToStartKeyboard() }
    );
  }

  handleMyId(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username ? `@${msg.from.username}` : 'none';

    userService.registerUser(userId, msg.from.username, msg.from.first_name, msg.from.last_name);

    bot.sendMessage(
      chatId,
      [
        '<b>Your ID</b>',
        '',
        `User ID: <code>${userId}</code>`,
        `Username: ${escapeHtml(username)}`,
        `Name: ${escapeHtml([msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') || 'N/A')}`,
        '',
        'Send this ID to purchase access.',
        '',
        purchaseLine()
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: backToStartKeyboard() }
    );
  }

  handlePrices(bot, msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, pricingMessage(), {
      parse_mode: 'HTML',
      reply_markup: pricingKeyboard()
    });
  }

  handleApis(bot, msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, apisMessage(), {
      parse_mode: 'HTML',
      reply_markup: backToStartKeyboard()
    });
  }

  handleGrant(bot, msg, match) {
    const chatId = msg.chat.id;

    if (!this.isOwner(msg.from.id)) {
      bot.sendMessage(chatId, 'Owner only.');
      return;
    }

    const args = match[1].trim().split(/\s+/);

    if (args.length !== 3) {
      bot.sendMessage(
        chatId,
        [
          '<b>Grant Access</b>',
          '',
          '<b>Usage</b>',
          '<code>/grant @username &lt;plan&gt; &lt;days&gt;</code>',
          '<code>/grant &lt;user_id&gt; &lt;plan&gt; &lt;days&gt;</code>',
          '',
          '<b>Plans</b>',
          `<code>basic</code> — unlimited searches (€${PLANS.basic.price}/month)`,
          `<code>premium</code> — unlimited + Machine Viewer (€${PLANS.premium.price}/month)`,
          '',
          '<b>Examples</b>',
          '<code>/grant @john basic 30</code>',
          '<code>/grant 123456789 premium 30</code>',
          '',
          'User must have messaged the bot at least once.'
        ].join('\n'),
        { parse_mode: 'HTML' }
      );
      return;
    }

    const [target, plan, days] = args;
    let userId;
    let username;

    if (target.startsWith('@')) {
      username = target.replace('@', '');
      userId = userService.findUserIdByUsername(username);
      if (!userId) {
        bot.sendMessage(
          chatId,
          `User @${escapeHtml(username)} not found. They must message the bot first.`,
          { parse_mode: 'HTML' }
        );
        return;
      }
    } else if (/^\d+$/.test(target)) {
      userId = target;
      username = userService.directory[target]?.username || `user_${target}`;
    } else {
      bot.sendMessage(chatId, 'Invalid target. Use @username or numeric user ID.');
      return;
    }

    const result = userService.grantAccess(userId, username, plan, days);
    bot.sendMessage(chatId, result.message, { parse_mode: 'HTML' });
  }

  handleRevoke(bot, msg, match) {
    const chatId = msg.chat.id;

    if (!this.isOwner(msg.from.id)) {
      bot.sendMessage(chatId, 'Owner only.');
      return;
    }

    const target = match[1].trim();
    let userId = target;

    if (target.startsWith('@')) {
      userId = userService.findUserIdByUsername(target.replace('@', ''));
      if (!userId) {
        bot.sendMessage(chatId, 'User not found.');
        return;
      }
    }

    const result = userService.revokeAccess(userId);
    bot.sendMessage(chatId, result.message, { parse_mode: 'HTML' });
  }

  handleUsers(bot, msg) {
    const chatId = msg.chat.id;

    if (!this.isOwner(msg.from.id)) {
      bot.sendMessage(chatId, 'Owner only.');
      return;
    }

    const users = userService.listUsers();

    if (users.length === 0) {
      bot.sendMessage(chatId, 'No users with active access.');
      return;
    }

    const lines = [`<b>Active Users</b> (${users.length})\n`];

    users.forEach((user, i) => {
      const status = user.expired ? 'EXPIRED' : 'Active';
      lines.push(
        `<b>${i + 1}.</b> <code>${user.userId}</code>`,
        `   @${escapeHtml(user.username)}`,
        `   Plan: ${escapeHtml(user.plan)}`,
        `   Machine: ${user.machine}`,
        `   Expires: ${escapeHtml(user.expires_in)} [${status}]`,
        ''
      );
    });

    bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML' });
  }

  async handleMachine(bot, msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1].trim();

    userService.registerUser(userId, msg.from.username, msg.from.first_name, msg.from.last_name);

    if (!this.isOwner(userId) && !userService.hasMachineAccess(userId)) {
      bot.sendMessage(chatId, premiumRequiredMessage(), { parse_mode: 'HTML', reply_markup: pricingKeyboard() });
      return;
    }

    machinePaginationHandler.clearSession(chatId);

    const statusMsg = await bot.sendMessage(chatId, machineProgressMessage(query), {
      parse_mode: 'HTML'
    });

    try {
      const machines = await machineSearchService.searchMachines(query);

      await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

      if (machines.length === 0) {
        bot.sendMessage(chatId, machineNoResultsMessage(query), {
          parse_mode: 'HTML',
          reply_markup: supportKeyboard()
        });
        return;
      }

      await machinePaginationHandler.sendPage(bot, chatId, query, machines, 0);
    } catch (error) {
      console.error('Machine search error:', error);
      const text = errorMessage('Machine Search Failed', 'Could not complete machine lookup.');

      bot.editMessageText(text, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'HTML',
        reply_markup: supportKeyboard()
      }).catch(() => {
        bot.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: supportKeyboard() });
      });
    }
  }

  handleMenuCallback(bot, query) {
    const chatId = query.message.chat.id;
    const data = query.data;
    const firstName = query.from.first_name || 'User';

    const handlers = {
      menu_start: () => this.sendStart(bot, chatId, firstName),
      menu_how: () => bot.editMessageText(howItWorksMessage(), {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: backToStartKeyboard()
      }),
      menu_ai: () => bot.editMessageText(aiSearchMessage(), {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: backToStartKeyboard()
      }),
      menu_pricing: () => bot.editMessageText(pricingMessage(), {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: pricingKeyboard()
      }),
      menu_account: () => {
        bot.answerCallbackQuery(query.id);
        this.handleAccount(bot, { chat: { id: chatId }, from: query.from });
        return null;
      },
      menu_myid: () => {
        bot.answerCallbackQuery(query.id);
        this.handleMyId(bot, { chat: { id: chatId }, from: query.from });
        return null;
      }
    };

    const handler = handlers[data];
    if (!handler) {
      bot.answerCallbackQuery(query.id);
      return;
    }

    const result = handler();
    if (result !== null) {
      bot.answerCallbackQuery(query.id).catch(() => {});
    }
  }

  handlePriceCallback(bot, query) {
    const chatId = query.message.chat.id;
    const planId = query.data.replace('price_', '');

    if (!userService.getPlan(planId)) {
      bot.answerCallbackQuery(query.id);
      return;
    }

    bot.sendMessage(chatId, planDetailMessage(planId), {
      parse_mode: 'HTML',
      reply_markup: backToStartKeyboard()
    });

    bot.answerCallbackQuery(query.id, { text: `${planId} plan` });
  }
}

module.exports = new CommandHandler();
