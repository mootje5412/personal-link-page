from telegram import Update
from telegram.ext import ContextTypes

from bot.keyboards.menus import main_menu_keyboard
from config.settings import settings
from utils.formatting import format_api_status, format_help


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query or not query.data:
        return

    data = query.data

    if data == "menu_help":
        await query.answer()
        await query.edit_message_text(format_help(), reply_markup=main_menu_keyboard())
        return

    if data == "menu_status":
        await query.answer()
        api_map = {
            "SSN": bool(settings.ssn_api_url),
            "Name": bool(settings.name_api_url),
            "NPD": bool(settings.npd_api_url),
            "Court": bool(settings.court_api_url),
            "Phone": bool(settings.phone_api_url),
            "Email": bool(settings.email_api_url),
            "Address": bool(settings.address_api_url),
        }
        await query.edit_message_text(format_api_status(api_map), reply_markup=main_menu_keyboard())
        return
