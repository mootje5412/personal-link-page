require('dotenv').config();

module.exports = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  botName: 'DataStress',
  adminUserId: Number(process.env.ADMIN_USER_ID) || 0,

  wallets: {
    btc: process.env.WALLET_BTC || 'bc1qexamplebtcaddress',
    eth: process.env.WALLET_ETH || '0xExampleEthAddress',
    ltc: process.env.WALLET_LTC || 'ltc1qexampleltcaddress',
    usdt: process.env.WALLET_USDT || '0xExampleUsdtAddress'
  },

  plans: [
    { id: 1, name: 'Starter', maxDuration: 60, price: 5, concurrent: 1 },
    { id: 2, name: 'Basic', maxDuration: 120, price: 10, concurrent: 1 },
    { id: 3, name: 'Standard', maxDuration: 300, price: 20, concurrent: 1 },
    { id: 4, name: 'Plus', maxDuration: 600, price: 35, concurrent: 1 },
    { id: 5, name: 'Pro', maxDuration: 900, price: 50, concurrent: 1 },
    { id: 6, name: 'Advanced', maxDuration: 1200, price: 75, concurrent: 1 },
    { id: 7, name: 'Elite', maxDuration: 1800, price: 100, concurrent: 1 },
    { id: 8, name: 'Ultimate', maxDuration: 3000, price: 150, concurrent: 1 }
  ],

  methods: [
    { id: 'udp', name: 'UDP-FLOOD', description: 'UDP packet flood for bandwidth testing' },
    { id: 'tcp', name: 'TCP-SYN', description: 'TCP SYN flood for connection limit testing' },
    { id: 'http', name: 'HTTP-GET', description: 'HTTP GET request flood for web server testing' },
    { id: 'http-post', name: 'HTTP-POST', description: 'HTTP POST request flood for API testing' },
    { id: 'dns', name: 'DNS-AMP', description: 'DNS amplification simulation for resolver testing' },
    { id: 'icmp', name: 'ICMP-FLOOD', description: 'ICMP ping flood for latency testing' },
    { id: 'slowloris', name: 'SLOWLORIS', description: 'Slow connection hold for thread exhaustion testing' },
    { id: 'mixed', name: 'MIXED', description: 'Combined method rotation for comprehensive testing' }
  ],

  polling: {
    interval: 300,
    timeout: 10
  },

  dbPath: './database/users.db',
  attacksCsvPath: './data/attacks.csv'
};
