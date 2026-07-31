const DataStressBot = require('./src/bot');

console.log('Starting DataStress bot...');

try {
  new DataStressBot();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

process.on('SIGINT', () => {
  console.log('\nDataStress bot shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nDataStress bot shutting down...');
  process.exit(0);
});
