const config = require('../../config/config');
const accessService = require('../services/accessService');

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
    const access = accessService.hasAccess(msg.from);

    let message = WELCOME_MESSAGE(firstName);

    if (access.admin) {
      message += '\n\n🔑 Je bent beheerder — je hebt altijd toegang.';
    } else if (access.allowed) {
      message += `\n\n✅ Je hebt toegang tot ${accessService.formatDate(access.expiresAt)} (${access.daysLeft} dagen resterend).`;
    } else {
      message += '\n\n❌ Je hebt nog geen actieve toegang.';
    }

    bot.sendMessage(chatId, message);
  }

  handleToegang(bot, msg, match) {
    const chatId = msg.chat.id;
    const args = (match[1] || '').trim();

    if (!accessService.isAdmin(msg.from)) {
      bot.sendMessage(chatId, '❌ Alleen @strafbaar en @jacksb06 kunnen toegang beheren.');
      return;
    }

    if (!args) {
      bot.sendMessage(
        chatId,
        '🔑 Toegang beheren\n\n'
          + 'Geef toegang:\n/toegang @gebruiker\n/toegang gebruikersnaam\n/toegang 123456789\n\n'
          + 'Toegang intrekken:\n/toegang weg @gebruiker\n\n'
          + `Toegang duurt ${config.accessDays} dagen en verloopt daarna automatisch.`,
      );
      return;
    }

    const parts = args.split(/\s+/);
    const isRevoke = parts[0].toLowerCase() === 'weg';
    const target = isRevoke ? parts.slice(1).join(' ') : args;
    const result = isRevoke
      ? accessService.revokeAccess(msg.from, target)
      : accessService.grantAccess(msg.from, target);

    bot.sendMessage(chatId, result.message);
  }
}

module.exports = new CommandHandler();
