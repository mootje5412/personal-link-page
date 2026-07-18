const apiService = require('../services/apiService');
const userService = require('../services/userService');
const config = require('../../config/config');

class CommandHandler {
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
    
    const statusMsg = await bot.sendMessage(chatId, `Machine Search\n\nSearching for: ${query}\nPlease wait...`);
    
    try {
      const machineResults = await apiService.searchMachines(query);
      
      if (machineResults && machineResults.error) {
        const errorMsg = `Machine Search\n\nQuery: ${query}\nStatus: Error\n\n${machineResults.message}\n\nNote: Make sure your server IP (109.71.252.128) is whitelisted in OSINT Cat dashboard for machine viewer access.`;
        bot.editMessageText(errorMsg, {
          chat_id: chatId,
          message_id: statusMsg.message_id
        });
        return;
      }
      
      if (machineResults && machineResults.results && machineResults.results.length > 0) {
        bot.deleteMessage(chatId, statusMsg.message_id);
        
        const totalResults = machineResults.results.length;
        bot.sendMessage(chatId, `Machine Search Results\n\nFound ${totalResults} machine(s) for: ${query}`);
        
        machineResults.results.forEach((machine, index) => {
          let machineInfo = `Machine ${index + 1} of ${totalResults}\n\n`;
          
          // Build machine info with better formatting
          Object.keys(machine).forEach((key) => {
            const value = machine[key];
            if (value !== null && value !== undefined) {
              if (key === 'id' || key === 'machine_id') {
                machineInfo += `ID: ${value}\n`;
              } else if (typeof value === 'string') {
                machineInfo += `${key}: ${value}\n`;
              } else if (typeof value === 'number') {
                machineInfo += `${key}: ${value}\n`;
              } else if (Array.isArray(value)) {
                machineInfo += `${key}: ${value.join(', ')}\n`;
              }
            }
          });
          
          const machineId = machine.id || machine.machine_id || index;
          
          // Create keyboard with download button
          const keyboard = {
            inline_keyboard: [
              [
                {
                  text: 'Download Full Data',
                  callback_data: `download_machine_${machineId}`
                }
              ]
            ]
          };
          
          bot.sendMessage(chatId, machineInfo || 'No details available', { reply_markup: keyboard });
        });
      } else {
        bot.editMessageText(`Machine Search\n\nQuery: ${query}\nStatus: No Results\n\nNo machines found matching your query.`, {
          chat_id: chatId,
          message_id: statusMsg.message_id
        });
      }
    } catch (error) {
      console.error('Machine search error:', error);
      bot.editMessageText(`Machine Search\n\nQuery: ${query}\nStatus: Failed\n\nAn error occurred. Please try again.`, {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }
  }

  async handleDownload(bot, msg, match) {
    const chatId = msg.chat.id;
    const machineId = match[1];
    
    bot.sendMessage(chatId, `Downloading machine data...`);
    
    try {
      const downloadData = await apiService.downloadMachine(machineId);
      
      if (downloadData && downloadData.error) {
        bot.sendMessage(chatId, `Error: ${downloadData.message}`);
        return;
      }
      
      if (downloadData) {
        const formattedData = typeof downloadData === 'string' ? downloadData : JSON.stringify(downloadData, null, 2);
        
        if (formattedData.length > 4000) {
          // Send as file if too long
          const buffer = Buffer.from(formattedData, 'utf-8');
          bot.sendDocument(chatId, buffer, {}, {
            filename: `machine_${machineId}.json`,
            contentType: 'application/json'
          });
        } else {
          bot.sendMessage(chatId, `Machine Data:\n\n${formattedData}`);
        }
      } else {
        bot.sendMessage(chatId, 'No data available for this machine');
      }
    } catch (error) {
      console.error('Download error:', error);
      bot.sendMessage(chatId, 'Failed to download machine data');
    }
  }

  async handleMachineDownloadCallback(bot, query) {
    const chatId = query.message.chat.id;
    const machineId = query.data.replace('download_machine_', '');
    
    bot.answerCallbackQuery(query.id, { text: 'Preparing download...' });
    
    const downloadMsg = await bot.sendMessage(chatId, `Machine Download\n\nMachine ID: ${machineId}\nStatus: Downloading...\n\nPlease wait...`);
    
    try {
      const downloadData = await apiService.downloadMachine(machineId);
      
      if (downloadData && downloadData.error) {
        bot.editMessageText(`Machine Download\n\nMachine ID: ${machineId}\nStatus: Error\n\n${downloadData.message}`, {
          chat_id: chatId,
          message_id: downloadMsg.message_id
        });
        return;
      }
      
      if (downloadData) {
        const formattedData = typeof downloadData === 'string' ? downloadData : JSON.stringify(downloadData, null, 2);
        
        bot.deleteMessage(chatId, downloadMsg.message_id);
        
        if (formattedData.length > 4000) {
          bot.sendMessage(chatId, `Machine Download\n\nMachine ID: ${machineId}\nSize: ${formattedData.length} bytes\n\nDownloading as file...`);
          
          const buffer = Buffer.from(formattedData, 'utf-8');
          bot.sendDocument(chatId, buffer, {}, {
            filename: `machine_${machineId}.json`,
            contentType: 'application/json'
          });
        } else {
          bot.sendMessage(chatId, `Machine Download\n\nMachine ID: ${machineId}\n\n${formattedData}`);
        }
      } else {
        bot.editMessageText(`Machine Download\n\nMachine ID: ${machineId}\nStatus: No Data\n\nNo data available for this machine.`, {
          chat_id: chatId,
          message_id: downloadMsg.message_id
        });
      }
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
