from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ConversationHandler, MessageHandler, filters

from handlers.callbacks import handle_callback
from handlers.commands import (
    cmd_cancel,
    cmd_court,
    cmd_email,
    cmd_help,
    cmd_name,
    cmd_npd,
    cmd_phone,
    cmd_ssn,
    cmd_start,
    cmd_status,
)
from handlers.conversations import (
    ADDRESS_CITY,
    ADDRESS_STATE,
    ADDRESS_STREET,
    ADDRESS_ZIP,
    address_city,
    address_state,
    address_street,
    address_zip,
    begin_address_flow,
    begin_search_flow,
    cancel_conversation,
    handle_search_input,
)

SEARCH_INPUT = 1


def build_application(token: str) -> Application:
    app = Application.builder().token(token).build()

    search_conversation = ConversationHandler(
        entry_points=[
            CallbackQueryHandler(begin_search_flow, pattern=r"^search_(ssn|name|npd|court|phone|email|address)$"),
        ],
        states={
            SEARCH_INPUT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_search_input),
            ],
        },
        fallbacks=[
            CommandHandler("cancel", cancel_conversation),
            CallbackQueryHandler(cancel_conversation, pattern=r"^search_cancel$"),
        ],
        allow_reentry=True,
        name="search_flow",
        persistent=False,
    )

    address_conversation = ConversationHandler(
        entry_points=[CommandHandler("address", begin_address_flow)],
        states={
            ADDRESS_STREET: [MessageHandler(filters.TEXT & ~filters.COMMAND, address_street)],
            ADDRESS_CITY: [MessageHandler(filters.TEXT & ~filters.COMMAND, address_city)],
            ADDRESS_STATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, address_state)],
            ADDRESS_ZIP: [MessageHandler(filters.TEXT & ~filters.COMMAND, address_zip)],
        },
        fallbacks=[
            CommandHandler("cancel", cancel_conversation),
            CallbackQueryHandler(cancel_conversation, pattern=r"^search_cancel$"),
        ],
        allow_reentry=True,
        name="address_flow",
        persistent=False,
    )

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("cancel", cmd_cancel))
    app.add_handler(CommandHandler("ssn", cmd_ssn))
    app.add_handler(CommandHandler("name", cmd_name))
    app.add_handler(CommandHandler("npd", cmd_npd))
    app.add_handler(CommandHandler("court", cmd_court))
    app.add_handler(CommandHandler("phone", cmd_phone))
    app.add_handler(CommandHandler("email", cmd_email))
    app.add_handler(address_conversation)
    app.add_handler(search_conversation)
    app.add_handler(CallbackQueryHandler(handle_callback))

    return app
