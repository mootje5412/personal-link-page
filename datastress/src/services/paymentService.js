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

    return `PAYMENT DETAILS
────────────────────
Payment ID:  #${paymentId}
Plan:        ${plan.name}
Duration:    ${plan.maxDuration}s max
Concurrent:  ${plan.concurrent} slot${plan.concurrent > 1 ? 's' : ''}
Price:       ${plan.price} EUR
Crypto:      ${label}
────────────────────

Send exactly ${plan.price} EUR in ${crypto.toUpperCase()} to:

${wallet}

────────────────────
Save Payment ID: #${paymentId}

After sending, tap "I Have Sent Payment".
The owner will verify your payment before activation.`;
  }

  formatOwnerPaymentAlert(payment, user, plan) {
    return `NEW PAYMENT REQUEST
────────────────────
Payment ID:  #${payment.id}
User:        ${payment.telegram_id}
Username:    @${user?.username || 'none'}
Name:        ${user?.first_name || 'Unknown'}
Plan:        ${plan?.name || payment.plan_id}
Amount:      ${payment.amount_eur} EUR
Crypto:      ${payment.crypto.toUpperCase()}
Status:      Awaiting verification
────────────────────

Verify the payment was received, then approve or reject.`;
  }
}

module.exports = new PaymentService();
