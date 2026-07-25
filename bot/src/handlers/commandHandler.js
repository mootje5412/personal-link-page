const config = require('../../config/config');
const userService = require('../services/userService');
const {
  welcomeMessage,
  howItWorksMessage,
  aiSearchMessage,
  pricingMessage,
  escapeHtml
} = require('../utils/messages');
const {
  mainMenuKeyboard,
  backToStartKeyboard,
  pricingKeyboard
} = require('../utils/keyboards');

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
    const userId = msg.from.id;
    const firstName = msg.from.first_name || 'there';

    userService.registerUser(userId, msg.from.username, msg.from.first_name, msg.from.last_name);
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
          '👤 <b>Your Account</b>',
          '',
          `User ID: <code>${userId}</code>`,
          '',
          '❌ No active subscription.',
          '',
          'Use /prices or contact the owner to get access.'
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: backToStartKeyboard() }
      );
      return;
    }

    bot.sendMessage(
      chatId,
      [
        '👤 <b>Your Account</b>',
        '',
        `User ID: <code>${userId}</code>`,
        `Username: @${escapeHtml(info.username || 'unknown')}`,
        `Searches today: <b>${escapeHtml(info.searches_today)}</b>`,
        `Expires in: <b>${info.days_left} days</b>`,
        `Expiry date: <b>${escapeHtml(info.expires_at)}</b>`
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
        '🆔 <b>Your Information</b>',
        '',
        `User ID: <code>${userId}</code>`,
        `Username: ${escapeHtml(username)}`,
        `Name: ${escapeHtml([msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') || 'N/A')}`,
        '',
        '<i>Share your User ID with the owner to get access.</i>'
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

  handleGrant(bot, msg, match) {
    const chatId = msg.chat.id;

    if (!this.isOwner(msg.from.id)) {
      bot.sendMessage(chatId, '🚫 Owner only command.');
      return;
    }

    const args = match[1].trim().split(/\s+/);

    if (args.length !== 3) {
      bot.sendMessage(
        chatId,
        [
          '🔑 <b>Grant Access</b>',
          '',
          '<b>Usage:</b>',
          '<code>/grant @username &lt;searches_per_day&gt; &lt;days&gt;</code>',
          '<code>/grant &lt;user_id&gt; &lt;searches_per_day&gt; &lt;days&gt;</code>',
          '',
          '<b>Examples:</b>',
          '<code>/grant @john 50 30</code> → 50 searches/day for 30 days',
          '<code>/grant 123456789 150 7</code> → 150 searches/day for 7 days',
          '',
          'The user must have messaged the bot at least once.'
        ].join('\n'),
        { parse_mode: 'HTML' }
      );
      return;
    }

    let [target, searchesPerDay, days] = args;
    let userId;
    let username;

    if (target.startsWith('@')) {
      username = target.replace('@', '');
      userId = userService.findUserIdByUsername(username);
      if (!userId) {
        bot.sendMessage(
          chatId,
          `❌ User @${escapeHtml(username)} not found.\n\nThey must message the bot first, then try again.`,
          { parse_mode: 'HTML' }
        );
        return;
      }
    } else if (/^\d+$/.test(target)) {
      userId = target;
      username = userService.directory[target]?.username || `user_${target}`;
    } else {
      bot.sendMessage(chatId, '❌ Invalid target. Use @username or numeric user ID.');
      return;
    }

    const result = userService.grantAccess(userId, username, searchesPerDay, days);
    bot.sendMessage(chatId, result.message, { parse_mode: 'HTML' });
  }

  handleRevoke(bot, msg, match) {
    const chatId = msg.chat.id;

    if (!this.isOwner(msg.from.id)) {
      bot.sendMessage(chatId, '🚫 Owner only command.');
      return;
    }

    const target = match[1].trim();
    let userId = target;

    if (target.startsWith('@')) {
      userId = userService.findUserIdByUsername(target.replace('@', ''));
      if (!userId) {
        bot.sendMessage(chatId, '❌ User not found.');
        return;
      }
    }

    const result = userService.revokeAccess(userId);
    bot.sendMessage(chatId, result.message, { parse_mode: 'HTML' });
  }

  handleUsers(bot, msg) {
    const chatId = msg.chat.id;

    if (!this.isOwner(msg.from.id)) {
      bot.sendMessage(chatId, '🚫 Owner only command.');
      return;
    }

    const users = userService.listUsers();

    if (users.length === 0) {
      bot.sendMessage(chatId, '📋 No users with active access.');
      return;
    }

    const lines = [`📋 <b>Active Users</b> (${users.length})\n`];

    users.forEach((user, i) => {
      const status = user.expired ? '❌ EXPIRED' : '✅ Active';
      lines.push(
        `<b>${i + 1}.</b> ID <code>${user.userId}</code>`,
        `   @${escapeHtml(user.username)}`,
        `   Searches: ${escapeHtml(user.searches)}`,
        `   Expires: ${escapeHtml(user.expires_in)} ${status}`,
        ''
      );
    });

    bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML' });
  }

  handleMenuCallback(bot, query) {
    const chatId = query.message.chat.id;
    const data = query.data;
    const firstName = query.from.first_name || 'there';

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
    const plans = {
      price_50: { name: 'Basic', searches: 50, price: '€5/month' },
      price_150: { name: 'Standard', searches: 150, price: '€10/month' },
      price_500: { name: 'Premium', searches: 500, price: '€25/month' }
    };

    const plan = plans[query.data];
    if (!plan) {
      bot.answerCallbackQuery(query.id);
      return;
    }

    bot.sendMessage(
      chatId,
      [
        `💎 <b>${plan.name} Plan</b>`,
        '',
        `Searches: <b>${plan.searches}/day</b>`,
        `Price: <b>${escapeHtml(plan.price)}</b>`,
        '',
        'Contact the owner with your User ID to purchase.'
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: backToStartKeyboard() }
    );

    bot.answerCallbackQuery(query.id, { text: `${plan.name} selected` });
  }
}

module.exports = new CommandHandler();
