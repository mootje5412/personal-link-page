const { getMachineId } = require('../utils/machineUtils');
const { buildMachineHeader, formatMachineCard } = require('../utils/resultFormatter');

class MachinePaginationHandler {
  constructor() {
    this.sessions = new Map();
    this.MACHINES_PER_PAGE = 3;

    setInterval(() => {
      const now = Date.now();
      for (const [chatId, session] of this.sessions.entries()) {
        if (now - session.timestamp > 5 * 60 * 1000) {
          this.sessions.delete(chatId);
        }
      }
    }, 30000);
  }

  clearSession(chatId) {
    this.sessions.delete(chatId);
  }

  normalizeMachines(rawMachines) {
    return rawMachines
      .map((machine) => ({
        id: getMachineId(machine),
        name: machine.name || machine.hostname || 'Unknown',
        file_count: machine.file_count,
        total_size: machine.total_size,
        imported_at: machine.imported_at
      }))
      .filter((machine) => machine.id);
  }

  buildKeyboard(machines, page, totalPages) {
    const keyboard = [];

    machines.forEach((machine) => {
      const label = machine.name.length > 28 ? `${machine.name.slice(0, 25)}...` : machine.name;
      keyboard.push([{
        text: `Download ${label}`,
        callback_data: `download_machine_${machine.id}`
      }]);
    });

    const nav = [];
    if (page > 0) {
      nav.push({ text: '◀ Prev', callback_data: `mpage_${page - 1}` });
    }
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: 'mcurrent' });
    if (page < totalPages - 1) {
      nav.push({ text: 'Next ▶', callback_data: `mpage_${page + 1}` });
    }

    if (nav.length > 0) {
      keyboard.push(nav);
    }

    return { inline_keyboard: keyboard };
  }

  buildMessage(query, machines, page, totalPages, totalResults, startIndex) {
    let message = `${buildMachineHeader(query, page, totalPages, totalResults)}\n\n`;

    machines.forEach((machine, index) => {
      message += `${formatMachineCard(startIndex + index + 1, machine)}\n\n`;
    });

    message += 'Tap a download button below to get the full ZIP archive.';
    return message.trim();
  }

  sendPage(bot, chatId, query, allMachines, page = 0, messageId = null) {
    const totalPages = Math.max(1, Math.ceil(allMachines.length / this.MACHINES_PER_PAGE));
    const safePage = Math.min(Math.max(page, 0), totalPages - 1);
    const start = safePage * this.MACHINES_PER_PAGE;
    const pageMachines = allMachines.slice(start, start + this.MACHINES_PER_PAGE);

    this.sessions.set(chatId, {
      query,
      machines: allMachines,
      page: safePage,
      timestamp: Date.now()
    });

    const message = this.buildMessage(query, pageMachines, safePage, totalPages, allMachines.length, start);
    const keyboard = this.buildKeyboard(pageMachines, safePage, totalPages);

    if (messageId) {
      return bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboard,
        disable_web_page_preview: true
      });
    }

    return bot.sendMessage(chatId, message, {
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
  }

  handleCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data === 'mcurrent') {
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (!data.startsWith('mpage_')) {
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    const page = parseInt(data.split('_')[1], 10);
    const session = this.sessions.get(chatId);

    if (!session) {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Session expired. Run /machine again.',
        show_alert: true
      });
      return;
    }

    this.sendPage(bot, chatId, session.query, session.machines, page, messageId);
    bot.answerCallbackQuery(callbackQuery.id);
  }
}

module.exports = new MachinePaginationHandler();
