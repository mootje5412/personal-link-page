const OdidoZoekerBot = require('./src/bot');

console.log('Gezochte Mensen Odido Zoeker wordt gestart...');
const bot = new OdidoZoekerBot();
bot.start();

process.on('SIGINT', () => {
  console.log('\nBot wordt afgesloten...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nBot wordt afgesloten...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  if (error.message.includes('ETELEGRAM') || error.message.includes('409 Conflict')) {
    console.error('Er draait al een andere bot-instantie. Stop die eerst met: pkill -9 -f "node index.js"');
    process.exit(1);
  }

  console.error('Onverwachte fout:', error);
});
