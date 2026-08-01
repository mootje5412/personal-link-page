import asyncio
import os
import threading

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

MAX_RESULTS = 10
MESSAGE_LIMIT = 3900


def format_match(index: int, row: dict) -> str:
    lines = [f"{index}. {row.get('full_name') or 'Result'}"]
    for key, label in (
        ("identity_number", "TC"),
        ("phone", "Phone"),
        ("email", "Email"),
        ("city", "City"),
        ("country", "Country"),
        ("notes", "Notes"),
        ("details", "Details"),
    ):
        value = row.get(key)
        if not value:
            continue
        text = str(value)
        if len(text) > 160:
            text = text[:157] + "..."
        lines.append(f"   {label}: {text}")
    return "\n".join(lines)


def format_results_message(query: str, results: list[dict]) -> str:
    if not results:
        return f"No results for: {query}"

    header = f"Found {len(results)} result(s) for: {query}\n\n"
    body = "\n\n".join(format_match(index, row) for index, row in enumerate(results[:MAX_RESULTS], start=1))
    message = header + body
    if len(message) > MESSAGE_LIMIT:
        message = message[: MESSAGE_LIMIT - 3] + "..."
    return message


async def cmd_start(update: Update, _context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(
        "PaneliSearch is ready.\n\n"
        "Send a name, phone, email, or keyword to search."
    )


async def handle_search_message(update: Update, _context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text:
        return

    query = update.message.text.strip()
    if not query or query.startswith("/"):
        return

    from main import search_files

    await update.message.reply_chat_action("typing")
    loop = asyncio.get_running_loop()

    try:
        results = await loop.run_in_executor(None, lambda: search_files(query))
    except ValueError as error:
        await update.message.reply_text(str(error))
        return
    except Exception as error:
        await update.message.reply_text(f"Search error: {error}")
        return

    await update.message.reply_text(format_results_message(query, results))


async def run_bot(application: Application) -> None:
    async with application:
        await application.start()
        await application.updater.start_polling(
            drop_pending_updates=True,
            allowed_updates=Update.ALL_TYPES,
        )
        await asyncio.Event().wait()


def run_bot_polling() -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        print("Telegram bot disabled: set TELEGRAM_BOT_TOKEN in telegram.env", flush=True)
        return

    asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    application = Application.builder().token(token).build()
    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_search_message))
    print("PaneliSearch Telegram bot started", flush=True)
    try:
        loop.run_until_complete(run_bot(application))
    except Exception as error:
        print(f"Telegram bot error: {error}", flush=True)
    finally:
        loop.close()


def start_telegram_bot_thread() -> None:
    thread = threading.Thread(target=run_bot_polling, daemon=True, name="panelisearch-bot")
    thread.start()
