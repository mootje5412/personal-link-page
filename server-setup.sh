#!/bin/bash

# FindNow Bot Server Setup Script
# Run this script on your server: 109.71.252.128

echo "=== FindNow OSINT Bot Setup ==="
echo ""

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Create bot directory
BOT_DIR="/root/findnow-bot"
mkdir -p $BOT_DIR
cd $BOT_DIR

echo "Creating bot files..."

# Create directory structure
mkdir -p config src/handlers src/services

# Create config
cat > config/config.js << 'EOFCONFIG'
module.exports = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '8805558047:AAEl9ldSVfLsCPXIjAQwhiiBCI_HotIt1R0',
  osintCatApiKey: 'de4d6ed2-74e9-46b7-96b0-dce6a25f0e55',
  osintCatBaseUrl: 'https://www.osintcat.net/api',
  botName: 'FindNow OSINT Bot',
  version: '1.0.0',
  polling: {
    interval: 300,
    timeout: 10
  }
};
EOFCONFIG

# Create main bot file
cat > src/bot.js << 'EOFBOT'
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const commandHandler = require('./handlers/commandHandler');
const messageHandler = require('./handlers/messageHandler');
const paginationHandler = require('./handlers/paginationHandler');

class FindNowBot {
  constructor() {
    this.bot = new TelegramBot(config.botToken, { 
      polling: config.polling 
    });
    this.init();
  }

  init() {
    console.log(\`\${config.botName} v\${config.version} is starting...\`);
    
    this.bot.onText(/\/start/, (msg) => commandHandler.handleStart(this.bot, msg));
    
    this.bot.on('callback_query', (query) => {
      paginationHandler.handleCallback(this.bot, query);
    });
    
    this.bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      messageHandler.handleMessage(this.bot, msg);
    });

    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error.code);
      console.error(error.message);
    });

    console.log('Bot is running and ready!');
  }

  start() {}
}

module.exports = FindNowBot;
EOFBOT

# Create command handler
cat > src/handlers/commandHandler.js << 'EOFCMD'
const osintService = require('../services/osintService');

class CommandHandler {
  handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';
    
    const welcomeMessage = \`Welcome to FindNow OSINT Bot

Hello \${firstName}. Send me anything and I will search for information from public sources.

What I can search:
- Usernames across social platforms
- Email addresses
- Phone numbers
- IP addresses
- General queries

Just type what you want to search and I'll provide you with links to multiple sources.

This bot only uses publicly available information.\`;
    
    bot.sendMessage(chatId, welcomeMessage);
  }
}

module.exports = new CommandHandler();
EOFCMD

# Create message handler
cat > src/handlers/messageHandler.js << 'EOFMSG'
const osintService = require('../services/osintService');
const paginationHandler = require('./paginationHandler');

class MessageHandler {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    console.log(\`Message from \${msg.from.first_name} (\${msg.from.id}): \${messageText}\`);

    const query = messageText.trim();
    
    bot.sendMessage(chatId, \`Searching...\`);

    let results;
    
    if (this.isEmail(query)) {
      results = await osintService.emailSearch(query);
    } else if (this.isIP(query)) {
      results = await osintService.ipSearch(query);
    } else if (this.isPhone(query)) {
      results = await osintService.phoneSearch(query);
    } else if (this.isUsername(query)) {
      results = await osintService.usernameSearch(query);
    } else {
      results = await osintService.generalSearch(query);
    }
    
    if (results && results.length > 0) {
      paginationHandler.sendPaginatedResults(bot, chatId, query, results, 0);
    } else {
      bot.sendMessage(chatId, 'No results found');
    }
  }

  isEmail(text) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  }

  isIP(text) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(text);
  }

  isPhone(text) {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(text.replace(/\s/g, ''));
  }

  isUsername(text) {
    const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
    return usernameRegex.test(text) && !text.includes(' ');
  }
}

module.exports = new MessageHandler();
EOFMSG

# Pagination handler - continued in next section due to length
cat > src/handlers/paginationHandler.js << 'EOFPAGE'
class PaginationHandler {
  constructor() {
    this.sessions = new Map();
    this.ITEMS_PER_PAGE = 10;
  }

  sendPaginatedResults(bot, chatId, query, results, page = 0) {
    const totalPages = Math.ceil(results.length / this.ITEMS_PER_PAGE);
    const start = page * this.ITEMS_PER_PAGE;
    const end = start + this.ITEMS_PER_PAGE;
    const pageResults = results.slice(start, end);

    this.sessions.set(chatId, { query, results, page });

    let message = \`Results for: \${query}\n\`;
    message += \`Page \${page + 1} of \${totalPages}\n\`;
    message += \`Total results: \${results.length}\n\n\`;

    pageResults.forEach((item, index) => {
      const globalIndex = start + index + 1;
      message += \`\${globalIndex}. \${item}\n\n\`;
    });

    const keyboard = this.createKeyboard(page, totalPages);

    bot.sendMessage(chatId, message, {
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
  }

  createKeyboard(page, totalPages) {
    const buttons = [];

    if (page > 0) {
      buttons.push({
        text: 'Back',
        callback_data: \`page_\${page - 1}\`
      });
    }

    buttons.push({
      text: \`\${page + 1}/\${totalPages}\`,
      callback_data: 'current'
    });

    if (page < totalPages - 1) {
      buttons.push({
        text: 'Next',
        callback_data: \`page_\${page + 1}\`
      });
    }

    return {
      inline_keyboard: [buttons]
    };
  }

  handleCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data === 'current') {
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('page_')) {
      const page = parseInt(data.split('_')[1]);
      const session = this.sessions.get(chatId);

      if (session) {
        const totalPages = Math.ceil(session.results.length / this.ITEMS_PER_PAGE);
        const start = page * this.ITEMS_PER_PAGE;
        const end = start + this.ITEMS_PER_PAGE;
        const pageResults = session.results.slice(start, end);

        session.page = page;

        let message = \`Results for: \${session.query}\n\`;
        message += \`Page \${page + 1} of \${totalPages}\n\`;
        message += \`Total results: \${session.results.length}\n\n\`;

        pageResults.forEach((item, index) => {
          const globalIndex = start + index + 1;
          message += \`\${globalIndex}. \${item}\n\n\`;
        });

        const keyboard = this.createKeyboard(page, totalPages);

        bot.editMessageText(message, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: keyboard,
          disable_web_page_preview: true
        });

        bot.answerCallbackQuery(callbackQuery.id);
      }
    }
  }
}

module.exports = new PaginationHandler();
EOFPAGE

echo "Bot files created successfully!"
echo ""
echo "To start the bot, run: cd $BOT_DIR && npm install && npm start"
