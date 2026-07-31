module.exports = {
  botToken: '8938024759:AAFzKBp3tDRLTHup7SSpKyoH6WJMnmof7Hs',
  botName: 'DataStress',
  adminUserId: 8073205490,

  wallets: {
    btc: 'bc1plp7yfcwkp7hfxu3jcvpnmy0qamp6t3g0tlzs0zfd0wn55z8xqjhq2msvdg',
    eth: '0x1d6D74DbBE9fd6Ce87908De394633bc0Ecc64AC1'
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
    { id: 'udp', command: 'udp', name: 'UDP', layer: 4, description: 'UDP flood' },
    { id: 'tcp', command: 'tcp', name: 'TCP', layer: 4, description: 'TCP SYN flood' },
    { id: 'icmp', command: 'icmp', name: 'ICMP', layer: 4, description: 'ICMP flood' },
    { id: 'dns', command: 'dns', name: 'DNS', layer: 4, description: 'DNS amp' },
    { id: 'http', command: 'http', name: 'HTTP', layer: 7, description: 'HTTP GET flood' },
    { id: 'post', command: 'post', name: 'POST', layer: 7, description: 'HTTP POST flood' },
    { id: 'slowloris', command: 'slowloris', name: 'SLOWLORIS', layer: 7, description: 'Slowloris hold' },
    { id: 'browser', command: 'browser', name: 'BROWSER', layer: 7, description: 'Browser flood' },
    { id: 'cloudflare', command: 'cloudflare', name: 'CLOUDFLARE', layer: 7, description: 'CF bypass flood' }
  ],

  polling: {
    interval: 300,
    timeout: 10
  },

  dbPath: './database/users.db',
  attacksCsvPath: './data/attacks.csv'
};
