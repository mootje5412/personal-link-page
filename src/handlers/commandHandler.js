const apiService = require('../services/apiService');
const osintService = require('../services/osintService');
const userService = require('../services/userService');
const config = require('../../config/config');
const machinePaginationHandler = require('./machinePaginationHandler');
const { getMachineId, extractMachineUuid, isValidMachineUuid } = require('../utils/machineUtils');

class CommandHandler {
  formatMachineError(error) {
    if (error === 'Request timed out') {
      return 'Search timed out. Try a shorter query or try again.';
    }

    if (error === 'DB_ERROR') {
      return 'OsintCat database error for that query. Try just the username or hostname (e.g. /machine Ege).';
    }

    return error;
  }

  handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || 'there';
    
    // Register user in directory
    userService.registerUser(userId, msg.from.username, msg.from.first_name, msg.from.last_name);
    
    // Check if user has access
    const accessCheck = userService.checkAccess(userId);
    const userInfo = userService.getUserInfo(userId);
    
    let welcomeMessage = `Welcome to FindNow OSINT Bot

Hello ${firstName}. Send me anything and I will search for information from public sources.

What I can search:
- Usernames across social platforms
- Email addresses
- Phone numbers
- IP addresses
- General queries
- Machines and devices

Commands:
/start - Show this message
/myid - View your user ID
/machine <query> - Search for machines and devices
/prices - View pricing plans`;

    if (userInfo) {
      welcomeMessage += `\n/account - View your subscription`;
    }

    welcomeMessage += `\n\nJust type what you want to search and I'll provide you with comprehensive results.`;

    if (userInfo) {
      welcomeMessage += `\n\nYour Account:\nPlan: ${userInfo.plan}\nCredits: ${userInfo.credits_today}\nExpires: ${userInfo.expires_at}`;
    }
    
    bot.sendMessage(chatId, welcomeMessage);
  }

  handleAccount(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const userInfo = userService.getUserInfo(userId);
    
    if (!userInfo) {
      bot.sendMessage(chatId, `No Active Subscription

Your User ID: ${userId}

You don't have an active subscription.

Use /prices to view available plans and contact @strafbaar to purchase.`);
      return;
    }
    
    const accountMessage = `Your Account

User ID: ${userId}
Username: @${userInfo.username}
Plan: ${userInfo.plan}
Credits Today: ${userInfo.credits_today}
Expires In: ${userInfo.expires_in}
Expiry Date: ${userInfo.expires_at}

Contact @strafbaar for plan upgrades or renewals.`;
    
    bot.sendMessage(chatId, accountMessage);
  }

  handleMyId(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || 'No username';
    const firstName = msg.from.first_name || '';
    const lastName = msg.from.last_name || '';
    
    // Register user in directory
    userService.registerUser(userId, msg.from.username, msg.from.first_name, msg.from.last_name);
    
    const message = `Your Information

User ID: ${userId}
Username: @${username}
Name: ${firstName} ${lastName}

To purchase a subscription, contact @strafbaar`;
    
    bot.sendMessage(chatId, message);
  }

  handleGrant(bot, msg, match) {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;
    
    if (adminId !== config.ownerId) {
      bot.sendMessage(chatId, 'Unauthorized. Owner only command.');
      return;
    }
    
    const args = match[1].trim().split(' ');
    
    if (args.length !== 3) {
      const plans = userService.getPlans();
      let planList = 'Available Plans:\n\n';
      Object.keys(plans).forEach(key => {
        planList += `${key} - ${plans[key].name} (${plans[key].credits_per_day} credits/day) - ${plans[key].price}\n`;
      });
      
      bot.sendMessage(chatId, `Grant Access

Usage: /grant @username <plan> <days>

${planList}
Example: /grant @john123 premium 30

The user must have messaged the bot at least once.`);
      return;
    }
    
    let [username, plan, days] = args;
    
    // Remove @ symbol if present
    username = username.replace('@', '');
    
    // Look up user ID by username
    const userId = userService.findUserIdByUsername(username);
    
    if (!userId) {
      bot.sendMessage(chatId, `User @${username} not found.

The user must message the bot at least once before you can grant them access.

Once they do, try again:
/grant @${username} ${plan} ${days}`);
      return;
    }
    
    // Grant access
    const result = userService.grantAccess(userId, username, plan, days);
    bot.sendMessage(chatId, result.message);
  }

  handleGrantId(bot, msg, match) {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;
    
    if (adminId !== config.ownerId) {
      bot.sendMessage(chatId, 'Unauthorized. Owner only command.');
      return;
    }
    
    const args = match[1].trim().split(' ');
    
    if (args.length !== 3) {
      bot.sendMessage(chatId, 'Usage: /grantid <user_id> <plan> <days>');
      return;
    }
    
    const [userId, plan, days] = args;
    const username = 'user_' + userId; // Placeholder username
    
    const result = userService.grantAccess(userId, username, plan, days);
    bot.sendMessage(chatId, result.message);
  }

  handleRevoke(bot, msg, match) {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;
    
    if (adminId !== config.ownerId) {
      bot.sendMessage(chatId, 'Unauthorized. Owner only command.');
      return;
    }
    
    const userId = match[1].trim();
    const result = userService.revokeAccess(userId);
    bot.sendMessage(chatId, result.message);
  }

  handleListUsers(bot, msg) {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;
    
    if (adminId !== config.ownerId) {
      bot.sendMessage(chatId, 'Unauthorized. Owner only command.');
      return;
    }
    
    const users = userService.listAllUsers();
    
    if (users.length === 0) {
      bot.sendMessage(chatId, 'No users found.');
      return;
    }
    
    let message = `Active Users (${users.length})\n\n`;
    users.forEach((user, index) => {
      const status = user.expired ? '❌ EXPIRED' : '✅ Active';
      message += `${index + 1}. ID: ${user.userId}\n`;
      message += `   @${user.username}\n`;
      message += `   Plan: ${user.plan}\n`;
      message += `   Credits: ${user.credits}\n`;
      message += `   Expires: ${user.expires_in}\n`;
      message += `   ${status}\n\n`;
    });
    
    bot.sendMessage(chatId, message);
  }

  handlePrices(bot, msg) {
    const chatId = msg.chat.id;
    
    const priceMessage = `Pricing Plans

Choose your plan:`;
    
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '50 Credits/Day - 5 EUR',
            callback_data: 'price_50'
          }
        ],
        [
          {
            text: '150 Credits/Day - 10 EUR',
            callback_data: 'price_150'
          }
        ],
        [
          {
            text: '500 Credits/Day - 25 EUR',
            callback_data: 'price_500'
          }
        ]
      ]
    };
    
    bot.sendMessage(chatId, priceMessage, { reply_markup: keyboard });
  }

  handlePriceCallback(bot, query) {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    let plan = '';
    let price = '';
    
    if (data === 'price_50') {
      plan = '50 Credits/Day';
      price = '5 EUR';
    } else if (data === 'price_150') {
      plan = '150 Credits/Day';
      price = '10 EUR';
    } else if (data === 'price_500') {
      plan = '500 Credits/Day';
      price = '25 EUR';
    }
    
    const contactMessage = `Plan: ${plan}
Price: ${price}

To purchase, contact @strafbaar on Telegram`;
    
    bot.sendMessage(chatId, contactMessage);
    bot.answerCallbackQuery(query.id, { text: `Selected: ${plan}` });
  }

  async handleMachine(bot, msg, match) {
    const chatId = msg.chat.id;
    const query = match[1].trim();

    const statusMsg = await bot.sendMessage(chatId, `Machine Viewer\n\nSearching: ${query}...`);

    try {
      const machineResults = await osintService.machineSearch(query);

      if (machineResults.error) {
        bot.editMessageText(`Machine Viewer\n\nQuery: ${query}\nError: ${this.formatMachineError(machineResults.error)}`, {
          chat_id: chatId,
          message_id: statusMsg.message_id
        });
        return;
      }

      const machines = machinePaginationHandler.normalizeMachines(machineResults.machines || []);

      if (machines.length === 0) {
        bot.editMessageText(`Machine Viewer\n\nQuery: ${query}\nNo infected machines found.`, {
          chat_id: chatId,
          message_id: statusMsg.message_id
        });
        return;
      }

      await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
      machinePaginationHandler.sendPage(bot, chatId, query, machines, 0);
    } catch (error) {
      console.error('Machine search error:', error);
      bot.editMessageText(`Machine Viewer\n\nQuery: ${query}\nFailed. Please try again.`, {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }
  }

  async resolveMachineId(input) {
    const trimmed = String(input || '').trim();
    const uuid = extractMachineUuid(trimmed);

    if (uuid && isValidMachineUuid(uuid)) {
      return { machineId: uuid };
    }

    const searchResults = await apiService.searchMachines(trimmed);
    if (searchResults && searchResults.error) {
      return { error: searchResults.message };
    }

    const machines = searchResults.machines || searchResults.results || [];
    const matches = machines
      .map((machine) => ({ machine, machineId: getMachineId(machine) }))
      .filter((entry) => entry.machineId);

    if (matches.length === 1) {
      return { machineId: matches[0].machineId };
    }

    if (matches.length > 1) {
      return { multiple: matches };
    }

    return { error: 'No machine found. Use /machine <query> to search, then tap Download or send /download <uuid>.' };
  }

  async sendMachineDownload(bot, chatId, machineId, statusMessageId) {
    const downloadData = await apiService.downloadMachine(machineId);

    if (downloadData && downloadData.error) {
      const errorText = `Machine Download\n\nMachine ID: ${machineId}\nStatus: Error\n\n${downloadData.message}`;
      if (statusMessageId) {
        bot.editMessageText(errorText, { chat_id: chatId, message_id: statusMessageId });
      } else {
        bot.sendMessage(chatId, errorText);
      }
      return;
    }

    if (downloadData && downloadData.buffer) {
      if (statusMessageId) {
        bot.deleteMessage(chatId, statusMessageId).catch(() => {});
      }
      bot.sendDocument(chatId, downloadData.buffer, {}, {
        filename: downloadData.filename || `machine_${machineId}.zip`,
        contentType: downloadData.contentType || 'application/zip'
      });
      return;
    }

    const noDataText = `Machine Download\n\nMachine ID: ${machineId}\nStatus: No Data\n\nNo data available for this machine.`;
    if (statusMessageId) {
      bot.editMessageText(noDataText, { chat_id: chatId, message_id: statusMessageId });
    } else {
      bot.sendMessage(chatId, noDataText);
    }
  }

  async handleDownload(bot, msg, match) {
    const chatId = msg.chat.id;
    const rawInput = match[1].trim();

    const statusMsg = await bot.sendMessage(chatId, 'Downloading machine data...');

    try {
      const resolved = await this.resolveMachineId(rawInput);

      if (resolved.error) {
        bot.editMessageText(`Machine Download\n\nStatus: Error\n\n${resolved.error}`, {
          chat_id: chatId,
          message_id: statusMsg.message_id
        });
        return;
      }

      if (resolved.multiple) {
        bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
        bot.sendMessage(chatId, `Multiple machines found for "${rawInput}". Choose one to download:`);

        resolved.multiple.forEach(({ machine, machineId }, index) => {
          const name = machine.name || machine.hostname || `Machine ${index + 1}`;
          bot.sendMessage(chatId, `${name}\nID: ${machineId}`, {
            reply_markup: {
              inline_keyboard: [[{ text: 'Download Full Data', callback_data: `download_machine_${machineId}` }]]
            }
          });
        });
        return;
      }

      await this.sendMachineDownload(bot, chatId, resolved.machineId, statusMsg.message_id);
    } catch (error) {
      console.error('Download error:', error);
      bot.editMessageText('Failed to download machine data. Please try again.', {
        chat_id: chatId,
        message_id: statusMsg.message_id
      }).catch(() => {
        bot.sendMessage(chatId, 'Failed to download machine data');
      });
    }
  }

  async handleMachineDownloadCallback(bot, query) {
    const chatId = query.message.chat.id;
    const machineId = extractMachineUuid(query.data.replace('download_machine_', ''));

    bot.answerCallbackQuery(query.id, { text: 'Preparing download...' });

    if (!machineId || !isValidMachineUuid(machineId)) {
      bot.sendMessage(chatId, 'Invalid machine ID. Run /machine <query> and use the Download button.');
      return;
    }

    const downloadMsg = await bot.sendMessage(
      chatId,
      `Machine Download\n\nMachine ID: ${machineId}\nStatus: Downloading...\n\nPlease wait...`
    );

    try {
      await this.sendMachineDownload(bot, chatId, machineId, downloadMsg.message_id);
    } catch (error) {
      console.error('Download error:', error);
      bot.editMessageText(`Machine Download\n\nMachine ID: ${machineId}\nStatus: Failed\n\nDownload failed. Please try again.`, {
        chat_id: chatId,
        message_id: downloadMsg.message_id
      });
    }
  }
}

module.exports = new CommandHandler();
