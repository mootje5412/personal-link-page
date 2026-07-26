module.exports = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '8764014963:AAG0jNyg3ItMAda73oJPcjgpvCvCZ3RdNYI',
  odidoApiKey: process.env.ODIDO_API_KEY || 'd1880ff59709750dfa2bd520d3db929f8fb8da724bed1e6200e23f420d6bd207',
  odidoApiUrl: process.env.ODIDO_API_URL || 'https://zopztlo.zopzstress.st/api/v1/full_odido',
  botName: 'Gezochte Mensen Odido Zoeker',
  version: '1.0.0',
  polling: {
    interval: 300,
    timeout: 10,
  },
};
