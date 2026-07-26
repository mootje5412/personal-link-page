const config = require('../../config/config');

const WELCOME_MESSAGE = (firstName) => `Hoi ${firstName}, welkom bij ${config.botName}

Zoek eenvoudig naar gegevens via Odido.

Prijs: 20 euro per maand

Je kunt zoeken met:
• Naam — Hoenson of Jan de Vries
• E-mail — test@gmail.com
• Domein — odido.nl of gmail.com
• Telefoon — 0612345678
• Gebruikersnaam — test.user

Stuur gewoon je zoekterm en ik zoek direct voor je.

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
