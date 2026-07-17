module.exports = {
  // Bot token
  botToken: process.env.TELEGRAM_BOT_TOKEN || '8805558047:AAEl9ldSVfLsCPXIjAQwhiiBCI_HotIt1R0',
  
  // Bot settings
  botName: 'FindNow OSINT Bot',
  version: '1.0.0',
  
  // Polling settings
  polling: {
    interval: 300,
    timeout: 10
  }
};
