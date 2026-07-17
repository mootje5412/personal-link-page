const FindNowBot = require('./src/bot');

// Start the bot
const bot = new FindNowBot();
bot.start();

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Bot is shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Bot is shutting down...');
  process.exit(0);
});
