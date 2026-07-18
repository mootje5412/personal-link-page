const FindNowBot = require('./src/bot');
const { execSync } = require('child_process');

// Kill any existing bot processes before starting
try {
  console.log('Checking for existing bot processes...');
  execSync('pkill -f "node index.js" || true', { stdio: 'ignore' });
  console.log('Cleared any existing processes.');
  
  // Wait a moment for processes to fully terminate
  setTimeout(() => {
    // Start the bot
    const bot = new FindNowBot();
    bot.start();
  }, 1000);
} catch (error) {
  console.log('No existing processes found. Starting bot...');
  const bot = new FindNowBot();
  bot.start();
}

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
    console.error('Another bot instance is running. Exiting...');
    process.exit(1);
  } else {
    console.error('Uncaught exception:', error);
  }
});
