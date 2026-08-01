from telegram.ext import Application, CallbackQueryHandler, CommandHandler, MessageHandler, filters

from handlers.commands import cmd_apistatus, cmd_grant, cmd_myid, cmd_revoke, cmd_start, cmd_users
from handlers.messages import handle_page_callback, handle_text_search


def build_application(token: str) -> Application:
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("myid", cmd_myid))
    app.add_handler(CommandHandler("grant", cmd_grant))
    app.add_handler(CommandHandler("revoke", cmd_revoke))
    app.add_handler(CommandHandler("apistatus", cmd_apistatus))
    app.add_handler(CommandHandler("users", cmd_users))
    app.add_handler(CallbackQueryHandler(handle_page_callback, pattern=r"^pg:"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_search))
    return app
