const ApexSearchBot = require('./src/bot');

console.log('Starting ApexSearch Bot...');
new ApexSearchBot();

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
