from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler

from bot.keyboards.menus import SEARCH_PROMPTS, SEARCH_TYPE_BY_CALLBACK, cancel_keyboard, main_menu_keyboard
from handlers.commands import _execute_search
from models.search import SearchType
from utils.formatting import format_api_status, format_help
from utils.validators import normalize_ssn, validate_email, validate_name, validate_phone

SEARCH_INPUT = 1
ADDRESS_STREET, ADDRESS_CITY, ADDRESS_STATE, ADDRESS_ZIP = range(10, 14)


async def begin_search_flow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    if not query or not query.data:
        return ConversationHandler.END

    await query.answer()
    search_type = SEARCH_TYPE_BY_CALLBACK.get(query.data)
    if not search_type:
        return ConversationHandler.END

    if search_type == SearchType.ADDRESS:
        return await begin_address_flow(update, context)

    context.user_data["active_search"] = search_type.value
    prompt = SEARCH_PROMPTS[search_type]
    await query.edit_message_text(prompt, reply_markup=cancel_keyboard())
    return SEARCH_INPUT


async def begin_address_flow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    context.user_data["active_search"] = SearchType.ADDRESS.value
    context.user_data["address"] = {}

    message = update.effective_message
    callback = update.callback_query

    text = "Address Search\n\nStep 1/4 — Send the street address:"
    markup = cancel_keyboard()

    if callback:
        await callback.answer()
        await callback.edit_message_text(text, reply_markup=markup)
    elif message:
        await message.reply_text(text, reply_markup=markup)

    return ADDRESS_STREET


async def handle_search_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    message = update.effective_message
    if not message or not message.text:
        return SEARCH_INPUT

    raw_type = context.user_data.get("active_search")
    if not raw_type:
        await message.reply_text("No active search. Use /start to pick a module.")
        return ConversationHandler.END

    search_type = SearchType(raw_type)
    text = message.text.strip()
    extra: dict[str, str] = {}

    try:
        if search_type == SearchType.SSN:
            text = normalize_ssn(text)
        elif search_type == SearchType.NAME:
            first_name, last_name = validate_name(text)
            extra = {"first_name": first_name, "last_name": last_name}
        elif search_type == SearchType.PHONE:
            text = validate_phone(text)
        elif search_type == SearchType.EMAIL:
            text = validate_email(text)
    except ValueError as error:
        await message.reply_text(str(error), reply_markup=cancel_keyboard())
        return SEARCH_INPUT

    context.user_data.clear()
    await _execute_search(update, context, search_type, text, extra=extra)
    await message.reply_text("Search complete. Pick another module:", reply_markup=main_menu_keyboard())
    return ConversationHandler.END


async def address_street(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    message = update.effective_message
    if not message or not message.text:
        return ADDRESS_STREET

    context.user_data.setdefault("address", {})["street"] = message.text.strip()
    await message.reply_text("Step 2/4 — City:", reply_markup=cancel_keyboard())
    return ADDRESS_CITY


async def address_city(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    message = update.effective_message
    if not message or not message.text:
        return ADDRESS_CITY

    context.user_data.setdefault("address", {})["city"] = message.text.strip()
    await message.reply_text("Step 3/4 — State (2-letter code, e.g. CA):", reply_markup=cancel_keyboard())
    return ADDRESS_STATE


async def address_state(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    message = update.effective_message
    if not message or not message.text:
        return ADDRESS_STATE

    context.user_data.setdefault("address", {})["state"] = message.text.strip()
    await message.reply_text("Step 4/4 — ZIP code:", reply_markup=cancel_keyboard())
    return ADDRESS_ZIP


async def address_zip(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    message = update.effective_message
    if not message or not message.text:
        return ADDRESS_ZIP

    address_data = context.user_data.get("address", {})
    try:
        from utils.validators import validate_address_parts

        parts = validate_address_parts(
            address_data.get("street", ""),
            address_data.get("city", ""),
            address_data.get("state", ""),
            message.text.strip(),
        )
    except ValueError as error:
        await message.reply_text(str(error), reply_markup=cancel_keyboard())
        return ADDRESS_ZIP

    query = f"{parts['street']}, {parts['city']}, {parts['state']} {parts['zip']}"
    context.user_data.clear()
    await _execute_search(update, context, SearchType.ADDRESS, query, extra=parts)
    await message.reply_text("Search complete. Pick another module:", reply_markup=main_menu_keyboard())
    return ConversationHandler.END


async def cancel_conversation(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(
            "Search cancelled.",
            reply_markup=main_menu_keyboard(),
        )
    elif update.effective_message:
        await update.effective_message.reply_text(
            "Search cancelled.",
            reply_markup=main_menu_keyboard(),
        )

    return ConversationHandler.END
