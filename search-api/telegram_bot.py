import asyncio
import os
import threading

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

MAX_RESULTS = 15
MESSAGE_LIMIT = 3900


def format_result(index: int, row: dict) -> str:
    name = row.get("full_name") or f"{row.get('first_name', '')} {row.get('last_name', '')}".strip()
    lines = [f"{index}. {name}"]
    if row.get("identity_number"):
        lines.append(f"   TC: {row['identity_number']}")
    if row.get("phone"):
        lines.append(f"   Phone: {row['phone']}")
    if row.get("email"):
        lines.append(f"   Email: {row['email']}")
    if row.get("city"):
        lines.append(f"   City: {row['city']}")
    if row.get("notes"):
        note = str(row["notes"])
        if len(note) > 120:
            note = note[:117] + "..."
        lines.append(f"   Notes: {note}")
    return "\n".join(lines)


def format_results_message(query: str, results: list[dict]) -> str:
    found = len(results)
    if found == 0:
        return f"No results for: {query}"

    header = f"Found {found} result(s) for: {query}\n\n"
    body_parts: list[str] = []
    for index, row in enumerate(results[:MAX_RESULTS], start=1):
        body_parts.append(format_result(index, row))

    body = "\n\n".join(body_parts)
    if found > MAX_RESULTS:
        body += f"\n\n... and {found - MAX_RESULTS} more result(s)"

    message = header + body
    if len(message) > MESSAGE_LIMIT:
        message = message[: MESSAGE_LIMIT - 3] + "..."
    return message


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(
        "Search bot ready.\n\n"
        "Send any query and I search automatically:\n"
        "• Name: Mootje bicep\n"
        "• Phone: 905544784243\n"
        "• Email: email@example.com\n"
        "• TC ID: 23480340824\n\n"
        "api made by Ami.192 on signal"
    )


async def handle_search_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text:
        return

    query = update.message.text.strip()
    if not query or query.startswith("/"):
        return

    from fastapi import HTTPException

    from main import INDEX_BUILDING, INDEX_READY, search

    if INDEX_BUILDING.is_set() or not INDEX_READY.is_set():
        await update.message.reply_text("Database is still loading. Try again in a few minutes.")
        return

    await update.message.reply_chat_action("typing")
    loop = asyncio.get_running_loop()

    try:
        results, _parsed = await loop.run_in_executor(None, lambda: search(query))
    except HTTPException as error:
        await update.message.reply_text(str(error.detail))
        return
    except ValueError as error:
        await update.message.reply_text(str(error))
        return
    except Exception as error:
        await update.message.reply_text(f"Search error: {error}")
        return

    await update.message.reply_text(format_results_message(query, results))


def run_bot_polling() -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        print("Telegram bot disabled: set TELEGRAM_BOT_TOKEN in telegram.env", flush=True)
        return

    application = Application.builder().token(token).build()
    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_search_message))
    print("Telegram bot started (send /start)", flush=True)
    application.run_polling(drop_pending_updates=True, allowed_updates=Update.ALL_TYPES)


def start_telegram_bot_thread() -> None:
    thread = threading.Thread(target=run_bot_polling, daemon=True, name="telegram-bot")
    thread.start()
