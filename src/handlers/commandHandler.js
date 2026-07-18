const apiService = require('../services/apiService');

class CommandHandler {
  handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';
    
    const welcomeMessage = `Welcome to FindNow OSINT Bot

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
/machine <query> - Search for machines and devices
/prices - View pricing plans

Just type what you want to search and I'll provide you with comprehensive results.

This bot only uses publicly available information.`;
    
    bot.sendMessage(chatId, welcomeMessage);
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
    
    const statusMsg = await bot.sendMessage(chatId, `Searching machines for: ${query}\n\nScanning databases...`);
    
    try {
      const machineResults = await apiService.searchMachines(query);
      
      if (machineResults && machineResults.error) {
        bot.editMessageText(`Machine Search Error\n\n${machineResults.message}`, {
          chat_id: chatId,
          message_id: statusMsg.message_id
        });
        return;
      }
      
      if (machineResults && machineResults.results && machineResults.results.length > 0) {
        bot.deleteMessage(chatId, statusMsg.message_id);
        
        const results = [];
        machineResults.results.forEach((machine) => {
          let machineInfo = '';
          
          // Build machine info
          Object.keys(machine).forEach((key) => {
            const value = machine[key];
            if (value !== null && value !== undefined && key !== 'id' && key !== 'machine_id') {
              if (typeof value === 'string' || typeof value === 'number') {
                machineInfo += `${key}: ${value}\n`;
              }
            }
          });
          
          const machineId = machine.id || machine.machine_id;
          
          // Create keyboard for this machine
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
          
          const message = `Machine Found\n\n${machineInfo || 'No details available'}`;
          bot.sendMessage(chatId, message, { reply_markup: keyboard });
        });
      } else {
        bot.editMessageText(`No machines found for: ${query}`, {
          chat_id: chatId,
          message_id: statusMsg.message_id
        });
      }
    } catch (error) {
      console.error('Machine search error:', error);
      bot.editMessageText(`Search failed. Please try again.`, {
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
    
    bot.answerCallbackQuery(query.id, { text: 'Downloading...' });
    bot.sendMessage(chatId, `Preparing download for machine ${machineId}...`);
    
    try {
      const downloadData = await apiService.downloadMachine(machineId);
      
      if (downloadData && downloadData.error) {
        bot.sendMessage(chatId, `Download Error\n\n${downloadData.message}`);
        return;
      }
      
      if (downloadData) {
        const formattedData = typeof downloadData === 'string' ? downloadData : JSON.stringify(downloadData, null, 2);
        
        if (formattedData.length > 4000) {
          const buffer = Buffer.from(formattedData, 'utf-8');
          bot.sendDocument(chatId, buffer, {}, {
            filename: `machine_${machineId}.json`,
            contentType: 'application/json'
          });
        } else {
          bot.sendMessage(chatId, `Machine ${machineId} Data\n\n${formattedData}`);
        }
      } else {
        bot.sendMessage(chatId, 'No data available for download');
      }
    } catch (error) {
      console.error('Download error:', error);
      bot.sendMessage(chatId, 'Download failed');
    }
  }
}

module.exports = new CommandHandler();
