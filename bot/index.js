const FindNowBot = require('./src/bot');

console.log('Starting FindNow Telegram Bot...');
new FindNowBot();

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  if (error.message.includes('ETELEGRAM') || error.message.includes('409 Conflict')) {
    console.error('Another bot instance is running. Kill it first.');
    process.exit(1);
  }
  console.error('Uncaught exception:', error);
});
