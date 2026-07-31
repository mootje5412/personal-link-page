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

  formatPaymentMessage(plan, crypto, paymentId) {
    const wallet = this.getWallet(crypto);
    const label = this.getCryptoLabel(crypto);

    return `Payment Details

Payment ID: #${paymentId}
Plan: ${plan.name}
Max Duration: ${plan.maxDuration}s
Concurrent: 1
Price: ${plan.price} EUR
Method: ${label}

Send exactly ${plan.price} EUR equivalent in ${crypto.toUpperCase()} to:

${wallet}

Save your Payment ID: #${paymentId}
If auto-activation fails, contact the owner with this ID.

After sending, press "I Have Sent Payment" below.
Your plan will be activated automatically.`;
  }
}

module.exports = new PaymentService();
