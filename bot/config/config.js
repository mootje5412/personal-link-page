require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

module.exports = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  ownerId: Number(process.env.OWNER_ID || 8073205490),
  botName: 'ApexSearch',
  version: '1.4.0',
  supportContact: '@strafbaar',
  supportUrl: 'https://t.me/strafbaar',
  itemsPerPage: 10,
  paymentMethods: ['Crypto (BTC, ETH, LTC, USDT)', 'PayPal', 'Bank Transfer'],
  intelApiKey: process.env.INTEL_API_KEY,
  intelBaseUrl: process.env.INTEL_BASE_URL || 'https://www.osintcat.net/api',
  apiTimeoutMs: Number(process.env.API_TIMEOUT_MS || 30000),
  breachTimeoutMs: Number(process.env.BREACH_TIMEOUT_MS || 60000),
  stealerTimeoutMs: Number(process.env.STEALER_TIMEOUT_MS || 90000),
  stealerRetries: Number(process.env.STEALER_RETRIES || 0),
  searchMaxWaitMs: Number(process.env.SEARCH_MAX_WAIT_MS || 95000),
  fastSourceTimeoutMs: Number(process.env.FAST_SOURCE_TIMEOUT_MS || 25000),
  machineSearchTimeoutMs: 45000,
  footprintPollMs: 2000,
  footprintMaxWaitMs: 30000,
  polling: {
    interval: 300,
    params: {
      timeout: 10
    }
  }
};
