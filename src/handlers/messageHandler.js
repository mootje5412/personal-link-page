const odidoService = require('../services/odidoService');
const paginationHandler = require('./paginationHandler');
const { extractResults, formatEmptyMessage } = require('../utils/formatResults');

class MessageHandler {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const query = msg.text.trim();

    if (!query) {
      return;
    }

    paginationHandler.clearSession(chatId);

    const loadingMsg = await bot.sendMessage(chatId, `🔍 Zoeken naar: ${query}\n\nEven geduld...`);

    try {
      await bot.sendChatAction(chatId, 'typing');
      const data = await odidoService.searchOdido(query);
      const results = extractResults(data);

      if (!results.length) {
        await bot.editMessageText(formatEmptyMessage(query, data), {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
        });
        return;
      }

      await paginationHandler.sendResults(
        bot,
        chatId,
        query,
        results,
        0,
        loadingMsg.message_id,
      );
    } catch (error) {
      const errorText = error.message || 'Er ging iets mis bij het zoeken.';

      await bot.editMessageText(
        `❌ Zoeken mislukt voor: ${query}\n\n${errorText}`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
        },
      );
    }
  }
}

module.exports = new MessageHandler();
