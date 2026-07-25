module.exports = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: '12,50',
    currency: 'EUR',
    period: 'month',
    searches: 'unlimited',
    machineViewer: false,
    features: [
      'Unlimited OSINT searches',
      'Breach & stealer databases',
      'Email, phone, IP, username lookup',
      'Paginated results'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: '25,00',
    currency: 'EUR',
    period: 'month',
    searches: 'unlimited',
    machineViewer: true,
    features: [
      'Everything in Basic',
      'Machine Viewer access',
      '/machine command',
      'Stealer machine lookup',
      'Priority support'
    ]
  }
};
