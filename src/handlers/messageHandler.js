const odidoService = require('../services/odidoService');
const paginationHandler = require('./paginationHandler');
const { formatEmptyMessage } = require('../utils/formatResults');

class MessageHandler {
  async handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const query = msg.text.trim();

    if (!query) {
      return;
    }

    paginationHandler.clearSession(chatId);

    const loadingMsg = await bot.sendMessage(
      chatId,
      `🔍 Zoeken naar: ${query}\n\nNaam, e-mail, domein, telefoon...\nEven geduld...`,
    );

    try {
      await bot.sendChatAction(chatId, 'typing');
      const search = await odidoService.searchOdido(query);

      if (!search.results.length) {
        await bot.editMessageText(formatEmptyMessage(query), {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
        });
        return;
      }

      await paginationHandler.sendResults(
        bot,
        chatId,
        query,
        search.results,
        0,
        loadingMsg.message_id,
        { broad: search.broad },
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
