const config = require('../../config/config');

class PaymentService {
  getWallet(crypto) {
    const key = crypto.toLowerCase();
    const wallet = config.wallets[key];

    if (!wallet) {
      return null;
    }

    return wallet;
  }

  getCryptoLabel(crypto) {
    const labels = {
      btc: 'BTC',
      eth: 'ETH'
    };
    return labels[crypto.toLowerCase()] || crypto.toUpperCase();
  }

  formatPaymentMessage(plan, crypto, paymentId) {
    const wallet = this.getWallet(crypto);

    if (!wallet) {
      return `Payment #${paymentId}\nInvalid payment method. Use BTC or ETH.`;
    }

    return `Payment #${paymentId}
Plan: ${plan.name} | ${plan.price} EUR
Pay with: ${this.getCryptoLabel(crypto)}

Send ${plan.price} EUR in ${this.getCryptoLabel(crypto)} to:

${wallet}

Then tap "I Have Sent Payment".
Owner approves manually.`;
  }

  formatOwnerPaymentAlert(payment, user, plan) {
    return `New payment #${payment.id}
User: ${payment.telegram_id} (@${user?.username || 'none'})
Plan: ${plan?.name} | ${payment.amount_eur} EUR
Crypto: ${payment.crypto.toUpperCase()}

/approve ${payment.id} or use buttons`;
  }
}

module.exports = new PaymentService();
