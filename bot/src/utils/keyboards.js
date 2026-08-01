const PLANS = require('../../config/plans');

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: 'How It Works', callback_data: 'menu_how' },
        { text: 'AI Search', callback_data: 'menu_ai' }
      ],
      [
        { text: 'Prices', callback_data: 'menu_pricing' },
        { text: 'My Account', callback_data: 'menu_account' }
      ],
      [
        { text: 'My ID', callback_data: 'menu_myid' },
        { text: 'Support', url: 'https://t.me/strafbaar' }
      ]
    ]
  };
}

function backToStartKeyboard() {
  return {
    inline_keyboard: [
      [{ text: 'Back to Menu', callback_data: 'menu_start' }],
      [{ text: 'Contact Support', url: 'https://t.me/strafbaar' }]
    ]
  };
}

function pricingKeyboard() {
  return {
    inline_keyboard: [
      [{ text: `Basic — €${PLANS.basic.price}/month`, callback_data: 'price_basic' }],
      [{ text: `Premium — €${PLANS.premium.price}/month`, callback_data: 'price_premium' }],
      [{ text: 'Contact @strafbaar', url: 'https://t.me/strafbaar' }],
      [{ text: 'Back to Menu', callback_data: 'menu_start' }]
    ]
  };
}

function supportKeyboard() {
  return {
    inline_keyboard: [[{ text: 'DM @strafbaar', url: 'https://t.me/strafbaar' }]]
  };
}

function paginationKeyboard(page, totalPages, prefix = 'page') {
  const row = [];

  if (page > 0) {
    row.push({ text: 'Prev', callback_data: `${prefix}_${page - 1}` });
  }

  row.push({ text: `${page + 1} / ${totalPages}`, callback_data: `${prefix}_current` });

  if (page < totalPages - 1) {
    row.push({ text: 'Next', callback_data: `${prefix}_${page + 1}` });
  }

  return { inline_keyboard: [row] };
}

module.exports = {
  mainMenuKeyboard,
  backToStartKeyboard,
  pricingKeyboard,
  supportKeyboard,
  paginationKeyboard
};
