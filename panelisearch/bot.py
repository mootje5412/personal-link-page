import asyncio
import os
import threading

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

MAX_RESULTS = 10
MESSAGE_LIMIT = 3900


def format_match(index: int, row: dict) -> str:
    source = row.get("source", "unknown")
    file_type = row.get("type", "")

    if file_type == "csv":
        data = row.get("data", {})
        name = " ".join(
            str(data.get(key, ""))
            for key in ("first_name", "last_name", "name")
            if data.get(key)
        ).strip()
        lines = [f"{index}. {name or 'Record'} ({source})"]
        for key in ("phone", "email", "city"):
            if data.get(key):
                lines.append(f"   {key.title()}: {data[key]}")
        return "\n".join(lines)

    if file_type == "txt":
        text = str(row.get("text", ""))
        if len(text) > 160:
            text = text[:157] + "..."
        return f"{index}. [{source}] {text}"

    if file_type == "json":
        data = row.get("data", {})
        if isinstance(data, dict):
            title = data.get("name") or data.get("email") or "JSON record"
            lines = [f"{index}. {title} ({source})"]
            for key in ("phone", "email"):
                if data.get(key):
                    lines.append(f"   {key.title()}: {data[key]}")
            return "\n".join(lines)
        return f"{index}. JSON match ({source})"

    return f"{index}. Match in {source}"


def format_results_message(query: str, results: list[dict]) -> str:
    if not results:
        return f"No results for: {query}"

    header = f"PaneliSearch found {len(results)} result(s) for: {query}\n\n"
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
        "Send any text to search the database:\n"
        "• Name: John Smith\n"
        "• Phone: 5551234567\n"
        "• Email: john.smith@email.com\n"
        "• Any keyword from csv, txt, or json files"
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
