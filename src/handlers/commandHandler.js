class CommandHandler {
  handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';
    
    const welcomeMessage = `Welcome to FindNow OSINT Bot

Hello ${firstName}. Send me anything and I will search for information from public sources.

What I can search:
- Usernames across social platforms
- Email addresses
- Phone numbers
- IP addresses
- General queries

Just type what you want to search and I'll provide you with links to multiple sources.

Commands:
/start - Show this message
/prices - View pricing plans

This bot only uses publicly available information.`;
    
    bot.sendMessage(chatId, welcomeMessage);
  }

  handlePrices(bot, msg) {
    const chatId = msg.chat.id;
    
    const priceMessage = `FindNow OSINT Bot - Premium Plans

Unlock unlimited searches with our premium subscription plans.

Choose the plan that fits your needs:`;
    
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '⚡ STARTER - 50 Credits/Day',
            callback_data: 'price_50'
          }
        ],
        [
          {
            text: '🔥 PROFESSIONAL - 150 Credits/Day',
            callback_data: 'price_150'
          }
        ],
        [
          {
            text: '💎 PREMIUM - 500 Credits/Day',
            callback_data: 'price_500'
          }
        ],
        [
          {
            text: '📞 Contact Support',
            url: 'https://t.me/strafbaar'
          }
        ]
      ]
    };
    
    bot.sendMessage(chatId, priceMessage, { reply_markup: keyboard });
  }

  handlePriceCallback(bot, query) {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    let planName = '';
    let planEmoji = '';
    let credits = '';
    let price = '';
    let features = '';
    
    if (data === 'price_50') {
      planName = 'STARTER';
      planEmoji = '⚡';
      credits = '50 credits per day';
      price = '5 EUR/month';
      features = 'Perfect for casual users\nBasic OSINT searches\nEmail & username lookups';
    } else if (data === 'price_150') {
      planName = 'PROFESSIONAL';
      planEmoji = '🔥';
      credits = '150 credits per day';
      price = '10 EUR/month';
      features = 'Ideal for professionals\nAdvanced searches\nMultiple API sources\nPriority support';
    } else if (data === 'price_500') {
      planName = 'PREMIUM';
      planEmoji = '💎';
      credits = '500 credits per day';
      price = '25 EUR/month';
      features = 'Best for power users\nUnlimited daily searches\nAll API sources\nPriority support\nFastest results';
    }
    
    const contactMessage = `${planEmoji} ${planName} PLAN

Credits: ${credits}
Price: ${price}

Features:
${features}

To activate this plan:
1. Contact @strafbaar on Telegram
2. Mention the ${planName} plan
3. Complete payment
4. Get instant activation

Ready to upgrade? Message @strafbaar now!`;
    
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📞 Contact @strafbaar',
            url: 'https://t.me/strafbaar'
          }
        ],
        [
          {
            text: '◀️ Back to Plans',
            callback_data: 'back_to_prices'
          }
        ]
      ]
    };
    
    bot.sendMessage(chatId, contactMessage, { reply_markup: keyboard });
    bot.answerCallbackQuery(query.id, { text: `${planEmoji} ${planName} Plan Selected` });
  }
}

module.exports = new CommandHandler();
