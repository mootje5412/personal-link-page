from telegram import InlineKeyboardButton, InlineKeyboardMarkup

from models.search import SearchType

SEARCH_TYPE_BY_CALLBACK = {
    "search_ssn": SearchType.SSN,
    "search_name": SearchType.NAME,
    "search_npd": SearchType.NPD,
    "search_court": SearchType.COURT,
    "search_phone": SearchType.PHONE,
    "search_email": SearchType.EMAIL,
    "search_address": SearchType.ADDRESS,
}

SEARCH_PROMPTS = {
    SearchType.SSN: "Send the SSN to look up (e.g. 123-45-6789):",
    SearchType.NAME: "Send the full name (e.g. John Smith):",
    SearchType.NPD: "Send a name or NPD record ID:",
    SearchType.COURT: "Send a name or case number:",
    SearchType.PHONE: "Send the phone number:",
    SearchType.EMAIL: "Send the email address:",
    SearchType.ADDRESS: "Send the street address (we'll ask for city/state/ZIP next):",
}


def main_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("SSN Lookup", callback_data="search_ssn"),
                InlineKeyboardButton("Name Search", callback_data="search_name"),
            ],
            [
                InlineKeyboardButton("NPD Records", callback_data="search_npd"),
                InlineKeyboardButton("Court Records", callback_data="search_court"),
            ],
            [
                InlineKeyboardButton("Phone", callback_data="search_phone"),
                InlineKeyboardButton("Email", callback_data="search_email"),
            ],
            [InlineKeyboardButton("Address Search", callback_data="search_address")],
            [
                InlineKeyboardButton("API Status", callback_data="menu_status"),
                InlineKeyboardButton("Help", callback_data="menu_help"),
            ],
        ]
    )


def cancel_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("Cancel", callback_data="search_cancel")]])
