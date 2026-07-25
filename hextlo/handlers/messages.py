from telegram import Update
from telegram.ext import ContextTypes

from bot.keyboards.pagination import pagination_keyboard
from handlers.search_session import load_search_session, save_search_session
from services.registry import run_detected_search
from utils.detector import detect_search, format_detection_hint
from utils.formatting import format_search_page


async def handle_text_search(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message or not message.text:
        return

    text = message.text.strip()
    if not text or text.startswith("/"):
        return

    detected = detect_search(text)
    if not detected:
        await message.reply_text(format_detection_hint())
        return

    label = detected.label or "records"
    await message.reply_chat_action("typing")
    status = await message.reply_text(f"Searching {label.lower()}...")
    user_id = update.effective_user.id if update.effective_user else 0
    response = await run_detected_search(detected, user_id)
    save_search_session(context, response)
    await status.edit_text(
        format_search_page(response, page=0),
        reply_markup=pagination_keyboard(0, response.count),
    )


async def handle_page_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query or not query.data:
        return

    if query.data == "pg:noop":
        await query.answer()
        return

    try:
        page = int(query.data.split(":", 1)[1])
    except (IndexError, ValueError):
        await query.answer("Invalid page.")
        return

    response = load_search_session(context)
    if not response:
        await query.answer("Search expired. Send a new query.")
        return

    await query.answer()
    await query.edit_message_text(
        format_search_page(response, page=page),
        reply_markup=pagination_keyboard(page, response.count),
    )
