from telegram import Update
from telegram.ext import ContextTypes

from models.search import SEARCH_LABELS
from services.registry import run_detected_search
from utils.detector import detect_search, format_detection_hint
from utils.formatting import format_search_response


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

    label = SEARCH_LABELS.get(detected.search_type, "Search")
    await message.reply_chat_action("typing")
    status = await message.reply_text(f"Searching {label.lower()}...")
    user_id = update.effective_user.id if update.effective_user else 0
    response = await run_detected_search(detected, user_id)
    await status.edit_text(format_search_response(response))
