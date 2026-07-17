const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your bot token from @BotFather
const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

console.log('Bot is running...');

// Listen for any kind of message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  console.log(`Received message from ${msg.from.first_name}: ${messageText}`);

  // Send a message back to the chat
  bot.sendMessage(chatId, `You said: ${messageText}`);
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'there';
  
  bot.sendMessage(
    chatId,
    `Hello ${firstName}! 👋\n\nWelcome to the bot! Send me any message and I'll echo it back to you.\n\nAvailable commands:\n/start - Start the bot\n/help - Get help\n/info - Get bot info`
  );
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(
    chatId,
    `📚 Help Menu:\n\n/start - Start the bot\n/help - Show this help message\n/info - Get information about the bot\n\nJust send me any text and I'll respond!`
  );
});

// Handle /info command
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(
    chatId,
    `ℹ️ Bot Information:\n\nThis is a simple Telegram bot created with Node.js.\nIt can respond to messages and commands.\n\nCreated with node-telegram-bot-api`
  );
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});
