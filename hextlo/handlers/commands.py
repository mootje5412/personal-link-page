from telegram import Update
from telegram.ext import ContextTypes

from utils.formatting import format_welcome


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    first_name = update.effective_user.first_name if update.effective_user else "there"
    await message.reply_text(format_welcome(first_name))
