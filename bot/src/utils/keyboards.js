function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🔍 How It Works', callback_data: 'menu_how' },
        { text: '🤖 AI Search', callback_data: 'menu_ai' }
      ],
      [
        { text: '💎 Pricing', callback_data: 'menu_pricing' },
        { text: '👤 My Account', callback_data: 'menu_account' }
      ],
      [
        { text: '🆔 My User ID', callback_data: 'menu_myid' }
      ]
    ]
  };
}

function backToStartKeyboard() {
  return {
    inline_keyboard: [[{ text: '« Back to Menu', callback_data: 'menu_start' }]]
  };
}

function pricingKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '50 searches/day — €5', callback_data: 'price_50' }],
      [{ text: '150 searches/day — €10', callback_data: 'price_150' }],
      [{ text: '500 searches/day — €25', callback_data: 'price_500' }],
      [{ text: '« Back to Menu', callback_data: 'menu_start' }]
    ]
  };
}

function paginationKeyboard(page, totalPages) {
  const row = [];

  if (page > 0) {
    row.push({ text: '◀ Prev', callback_data: `page_${page - 1}` });
  }

  row.push({ text: `${page + 1} / ${totalPages}`, callback_data: 'page_current' });

  if (page < totalPages - 1) {
    row.push({ text: 'Next ▶', callback_data: `page_${page + 1}` });
  }

  return { inline_keyboard: [row] };
}

module.exports = {
  mainMenuKeyboard,
  backToStartKeyboard,
  pricingKeyboard,
  paginationKeyboard
};
