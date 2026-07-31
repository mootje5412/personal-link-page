const config = require('../../config/config');

class PaymentService {
  getWallet(crypto) {
    return config.wallets[crypto.toLowerCase()] || null;
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

    return `Payment #${paymentId}
Plan: ${plan.name} | ${plan.price} EUR
Pay with: ${this.getCryptoLabel(crypto)}

Send ${plan.price} EUR to:
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
