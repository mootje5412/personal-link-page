from telegram import InlineKeyboardButton, InlineKeyboardMarkup

from utils.formatting import page_count


def pagination_keyboard(page: int, total: int) -> InlineKeyboardMarkup | None:
    pages = page_count(total)
    if pages <= 1:
        return None

    current = min(max(page, 0), pages - 1)
    row: list[InlineKeyboardButton] = []

    if current > 0:
        row.append(InlineKeyboardButton("◀ Prev", callback_data=f"pg:{current - 1}"))

    row.append(InlineKeyboardButton(f"{current + 1}/{pages}", callback_data="pg:noop"))

    if current < pages - 1:
        row.append(InlineKeyboardButton("Next ▶", callback_data=f"pg:{current + 1}"))

    return InlineKeyboardMarkup([row])
