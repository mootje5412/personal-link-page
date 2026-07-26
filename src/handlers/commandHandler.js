const config = require('../../config/config');

const WELCOME_MESSAGE = (firstName) => `Hoi ${firstName}, welkom bij ${config.botName}

Zoek eenvoudig naar gegevens via Odido.

Prijs: 20 euro per maand

Hoe het werkt:
Stuur een naam, telefoonnummer of andere zoekterm en ik zoek direct voor je.

Abonnement kopen:
Stuur een bericht naar @strafbaar of @jacksb06 op Telegram om toegang te kopen.`;

class CommandHandler {
  handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'daar';

    bot.sendMessage(chatId, WELCOME_MESSAGE(firstName));
  }
}

module.exports = new CommandHandler();
