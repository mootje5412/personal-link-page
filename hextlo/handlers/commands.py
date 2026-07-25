from telegram import Update
from telegram.ext import ContextTypes

from bot.keyboards.menus import main_menu_keyboard
from config.settings import settings
from models.search import SearchType
from services.registry import run_search
from utils.formatting import format_api_status, format_help, format_search_response, format_welcome
from utils.validators import (
    normalize_ssn,
    validate_address_parts,
    validate_email,
    validate_name,
    validate_phone,
)


async def _execute_search(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    search_type: SearchType,
    query: str,
    extra: dict | None = None,
) -> None:
    message = update.effective_message
    if not message:
        return

    await message.reply_chat_action("typing")
    user_id = update.effective_user.id if update.effective_user else 0
    response = await run_search(search_type, query, user_id, extra=extra)
    await message.reply_text(format_search_response(response))


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    first_name = update.effective_user.first_name if update.effective_user else "there"
    await message.reply_text(
        format_welcome(first_name),
        reply_markup=main_menu_keyboard(),
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await message.reply_text(format_help(), reply_markup=main_menu_keyboard())


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    api_map = {
        "SSN": bool(settings.ssn_api_url),
        "Name": bool(settings.name_api_url),
        "NPD": bool(settings.npd_api_url),
        "Court": bool(settings.court_api_url),
        "Phone": bool(settings.phone_api_url),
        "Email": bool(settings.email_api_url),
        "Address": bool(settings.address_api_url),
    }
    await message.reply_text(format_api_status(api_map), reply_markup=main_menu_keyboard())


async def cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    context.user_data.clear()
    await message.reply_text("Search cancelled.", reply_markup=main_menu_keyboard())


async def cmd_ssn(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    args = context.args or []
    if not args:
        await message.reply_text("Usage: /ssn 123-45-6789")
        return

    try:
        ssn = normalize_ssn(" ".join(args))
    except ValueError as error:
        await message.reply_text(str(error))
        return

    await _execute_search(update, context, SearchType.SSN, ssn)


async def cmd_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    args = context.args or []
    if len(args) < 2:
        await message.reply_text("Usage: /name John Smith")
        return

    query = " ".join(args)
    try:
        first_name, last_name = validate_name(query)
    except ValueError as error:
        await message.reply_text(str(error))
        return

    await _execute_search(
        update,
        context,
        SearchType.NAME,
        query,
        extra={"first_name": first_name, "last_name": last_name},
    )


async def cmd_npd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    args = context.args or []
    if not args:
        await message.reply_text("Usage: /npd John Smith")
        return

    await _execute_search(update, context, SearchType.NPD, " ".join(args))


async def cmd_court(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    args = context.args or []
    if not args:
        await message.reply_text("Usage: /court John Smith")
        return

    await _execute_search(update, context, SearchType.COURT, " ".join(args))


async def cmd_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    args = context.args or []
    if not args:
        await message.reply_text("Usage: /phone +15551234567")
        return

    try:
        phone = validate_phone(" ".join(args))
    except ValueError as error:
        await message.reply_text(str(error))
        return

    await _execute_search(update, context, SearchType.PHONE, phone)


async def cmd_email(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    args = context.args or []
    if not args:
        await message.reply_text("Usage: /email user@example.com")
        return

    try:
        email = validate_email(args[0])
    except ValueError as error:
        await message.reply_text(str(error))
        return

    await _execute_search(update, context, SearchType.EMAIL, email)

