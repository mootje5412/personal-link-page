const config = require('../../config/config');

class PaymentService {
  getWallet(crypto) {
    return config.wallets[crypto.toLowerCase()] || null;
  }

  getCryptoLabel(crypto) {
    const labels = {
      btc: 'Bitcoin (BTC)',
      eth: 'Ethereum (ETH)',
      ltc: 'Litecoin (LTC)',
      usdt: 'Tether (USDT)'
    };
    return labels[crypto.toLowerCase()] || crypto.toUpperCase();
  }

  formatPaymentMessage(plan, crypto) {
    const wallet = this.getWallet(crypto);
    const label = this.getCryptoLabel(crypto);

    return `Payment Details

Plan: ${plan.name}
Max Duration: ${plan.maxDuration}s
Price: ${plan.price} EUR
Method: ${label}

Send exactly ${plan.price} EUR equivalent in ${crypto.toUpperCase()} to:

${wallet}

After sending, press "I Have Sent Payment" below.
Your payment will be reviewed and your plan activated shortly.`;
  }
}

module.exports = new PaymentService();
