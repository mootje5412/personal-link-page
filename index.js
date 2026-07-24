const FindNowBot = require('./src/bot');

// Start the bot immediately
console.log('Starting FindNow Bot...');
const bot = new FindNowBot();
bot.start();

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nBot is shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nBot is shutting down...');
  process.exit(0);
});

// Prevent multiple instances
process.on('uncaughtException', (error) => {
  if (error.message.includes('ETELEGRAM') || error.message.includes('409 Conflict')) {
    console.error('Another bot instance is running. Please kill it first with: pkill -9 -f "node index.js"');
    process.exit(1);
  } else {
    console.error('Uncaught exception:', error);
  }
});
