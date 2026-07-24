module.exports = {
  // Bot token
  botToken: process.env.TELEGRAM_BOT_TOKEN || '8805558047:AAEl9ldSVfLsCPXIjAQwhiiBCI_HotIt1R0',
  
  // OSINT Cat API
  osintCatApiKey: 'de4d6ed2-74e9-46b7-96b0-dce6a25f0e55',
  osintCatBaseUrl: 'https://www.osintcat.net/api',
  
  // Snusbase API
  snusbaseApiKey: 'sbmeovhou6ecsn9fd9wcwnwwvvwnc',
  snusbaseBaseUrl: 'https://api.snusbase.com',

  // SeekAF API (see-know.xyz — see-know.ru redirects here)
  seekAfApiKey: process.env.SEEKAF_API_KEY || 'seek-aca7290de18a199818c43abec7d9b22a354066f4d2659b91',
  seekAfBaseUrl: process.env.SEEKAF_BASE_URL || 'https://see-know.xyz/api/v1',
  seekAfEnabled: true,
  seekAfSearchLimit: 50,
  seekAfStealerLimit: 50,
  seekAfUseDeepSearch: false,
  seekAfStealerDeep: true,
  seekAfTimeoutFast: 12000,
  seekAfTimeoutDeep: 45000,
  seekAfTimeoutStealer: 25000,
  seekAfUserAgent: 'FindNow-OSINT-Bot/1.0',
  
  apiTimeoutMs: 8000,
  machineSearchTimeoutMs: 45000,
  botName: 'FindNow OSINT Bot',
  version: '1.0.0',
  
  // Owner settings
  ownerId: 8073205490,
  
  // Polling settings
  polling: {
    interval: 300,
    timeout: 10
  }
};
