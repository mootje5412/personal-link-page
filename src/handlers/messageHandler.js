const odidoService = require('../services/odidoService');
const { formatResultsMessage } = require('../utils/formatResults');

class MessageHandler {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const query = msg.text.trim();

    if (!query) {
      return;
    }

    const loadingMsg = await bot.sendMessage(chatId, `Zoeken naar: ${query}\nEven geduld...`);

    try {
      await bot.sendChatAction(chatId, 'typing');
      const data = await odidoService.searchOdido(query);
      const message = formatResultsMessage(query, data);

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
      });
    } catch (error) {
      const errorText = error.message || 'Er ging iets mis bij het zoeken.';

      await bot.editMessageText(
        `Zoeken mislukt voor: ${query}\n\n${errorText}`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
        },
      );
    }
  }
}

module.exports = new MessageHandler();
