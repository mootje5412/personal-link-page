const config = require('../../config/config');

class PaymentService {
  getWallet(crypto) {
    const key = crypto.toLowerCase();
    return config.wallets[key] || null;
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

    const label = this.getCryptoLabel(crypto);

    return `Payment #${paymentId}
Plan: ${plan.name} | ${plan.price} EUR
Pay with: ${label}

Send ${plan.price} EUR in ${label} to:

<code>${wallet}</code>

Tap the address above to copy it.
Or use the Copy Address button below.

Then tap "I Have Sent Payment".
Owner approves manually.`;
  }

  getPaymentMessageOptions(plan, crypto, paymentId, keyboard) {
    return {
      parse_mode: 'HTML',
      reply_markup: keyboard,
      disable_web_page_preview: true
    };
  }

  formatOwnerPaymentAlert(payment, user, plan) {
    const wallet = this.getWallet(payment.crypto);

    return `New payment #${payment.id}
User: ${payment.telegram_id} (@${user?.username || 'none'})
Plan: ${plan?.name} | ${payment.amount_eur} EUR
Crypto: ${payment.crypto.toUpperCase()}
Wallet: ${wallet || 'n/a'}

/approve ${payment.id} or use buttons`;
  }
}

module.exports = new PaymentService();
