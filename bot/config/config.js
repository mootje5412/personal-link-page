require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

module.exports = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  ownerId: Number(process.env.OWNER_ID || 8073205490),
  botName: 'FindNow',
  version: '1.0.0',
  itemsPerPage: 10,
  polling: {
    interval: 300,
    params: {
      timeout: 10
    }
  }
};
