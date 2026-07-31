const config = require('../../config/config');

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: 'Methods', callback_data: 'menu_methods' }],
      [{ text: 'Plans', callback_data: 'menu_plans' }],
      [{ text: 'Attack Commands', callback_data: 'menu_commands' }],
      [{ text: 'My Account', callback_data: 'menu_account' }]
    ]
  };
}

function backToMenuKeyboard() {
  return {
    inline_keyboard: [[{ text: 'Back to Menu', callback_data: 'menu_main' }]]
  };
}

function plansKeyboard() {
  const rows = config.plans.map((plan) => [
    {
      text: `${plan.name} | ${plan.maxDuration}s | ${plan.concurrent}c | ${plan.price} EUR`,
      callback_data: `plan_${plan.id}`
    }
  ]);

  rows.push([{ text: 'Back to Menu', callback_data: 'menu_main' }]);

  return { inline_keyboard: rows };
}

function planDetailKeyboard(planId) {
  return {
    inline_keyboard: [
      [{ text: 'Pay', callback_data: `pay_${planId}` }],
      [{ text: 'Back to Plans', callback_data: 'menu_plans' }]
    ]
  };
}

function cryptoKeyboard(planId) {
  return {
    inline_keyboard: [
      [
        { text: 'BTC', callback_data: `crypto_${planId}_btc` },
        { text: 'ETH', callback_data: `crypto_${planId}_eth` }
      ],
      [
        { text: 'LTC', callback_data: `crypto_${planId}_ltc` },
        { text: 'USDT', callback_data: `crypto_${planId}_usdt` }
      ],
      [{ text: 'Back', callback_data: `plan_${planId}` }]
    ]
  };
}

function paymentConfirmKeyboard(paymentId) {
  return {
    inline_keyboard: [
      [{ text: 'I Have Sent Payment', callback_data: `confirm_pay_${paymentId}` }],
      [{ text: 'Back to Menu', callback_data: 'menu_main' }]
    ]
  };
}

function ownerApprovalKeyboard(paymentId) {
  return {
    inline_keyboard: [
      [
        { text: 'Approve', callback_data: `owner_approve_${paymentId}` },
        { text: 'Reject', callback_data: `owner_reject_${paymentId}` }
      ]
    ]
  };
}

function methodsKeyboard() {
  const rows = config.methods.map((method) => [
    { text: method.name, callback_data: `method_${method.id}` }
  ]);

  rows.push([{ text: 'Back to Menu', callback_data: 'menu_main' }]);

  return { inline_keyboard: rows };
}

module.exports = {
  mainMenuKeyboard,
  backToMenuKeyboard,
  plansKeyboard,
  planDetailKeyboard,
  cryptoKeyboard,
  paymentConfirmKeyboard,
  ownerApprovalKeyboard,
  methodsKeyboard
};
