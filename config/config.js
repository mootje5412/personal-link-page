module.exports = {
  // Bot token
  botToken: process.env.TELEGRAM_BOT_TOKEN || '8805558047:AAEl9ldSVfLsCPXIjAQwhiiBCI_HotIt1R0',
  
  // OSINT Cat API
  osintCatApiKey: 'de4d6ed2-74e9-46b7-96b0-dce6a25f0e55',
  osintCatBaseUrl: 'https://www.osintcat.net/api',
  
  // Snusbase API
  snusbaseApiKey: 'sbmeovhou6ecsn9fd9wcwnwwvvwnc',
  snusbaseBaseUrl: 'https://api-experimental.snusbase.com',
  
  // Bot settings
  botName: 'FindNow OSINT Bot',
  version: '1.0.0',
  
  // Polling settings
  polling: {
    interval: 300,
    timeout: 10
  }
};
