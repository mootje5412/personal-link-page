module.exports = {
  botToken: '8938024759:AAFzKBp3tDRLTHup7SSpKyoH6WJMnmof7Hs',
  botName: 'DataStress',
  adminUserId: 8073205490,

  wallets: {
    btc: 'bc1qexamplebtcaddress',
    eth: '0xExampleEthAddress',
    ltc: 'ltc1qexampleltcaddress',
    usdt: '0xExampleUsdtAddress'
  },

  ownerPlan: {
    name: 'Owner',
    maxDuration: 999999,
    concurrent: 999,
    unlimited: true
  },

  plans: [
    { id: 1, name: 'Starter', maxDuration: 60, price: 5, concurrent: 1 },
    { id: 2, name: 'Basic', maxDuration: 120, price: 10, concurrent: 1 },
    { id: 3, name: 'Standard', maxDuration: 300, price: 20, concurrent: 1 },
    { id: 4, name: 'Plus', maxDuration: 600, price: 35, concurrent: 1 },
    { id: 5, name: 'Pro', maxDuration: 900, price: 50, concurrent: 1 },
    { id: 6, name: 'Advanced', maxDuration: 1200, price: 75, concurrent: 2 },
    { id: 7, name: 'Elite', maxDuration: 1800, price: 100, concurrent: 3 },
    { id: 8, name: 'Ultimate', maxDuration: 3000, price: 150, concurrent: 4 }
  ],

  methods: [
    { id: 'udp', command: 'udp', name: 'UDP-FLOOD', description: 'UDP packet flood for bandwidth testing' },
    { id: 'tcp', command: 'tcp', name: 'TCP-SYN', description: 'TCP SYN flood for connection limit testing' },
    { id: 'http', command: 'http', name: 'HTTP-GET', description: 'HTTP GET request flood for web server testing' },
    { id: 'http-post', command: 'httppost', name: 'HTTP-POST', description: 'HTTP POST request flood for API testing' },
    { id: 'dns', command: 'dns', name: 'DNS-AMP', description: 'DNS amplification simulation for resolver testing' },
    { id: 'icmp', command: 'icmp', name: 'ICMP-FLOOD', description: 'ICMP ping flood for latency testing' },
    { id: 'slowloris', command: 'slowloris', name: 'SLOWLORIS', description: 'Slow connection hold for thread exhaustion testing' },
    { id: 'mixed', command: 'mixed', name: 'MIXED', description: 'Combined method rotation for comprehensive testing' }
  ],

  polling: {
    interval: 300,
    timeout: 10
  },

  dbPath: './database/users.db',
  attacksCsvPath: './data/attacks.csv'
};
