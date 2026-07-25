from telegram import Update
from telegram.ext import ContextTypes

from config.settings import settings
from services.api_health import check_all_apis
from services.access import (
    access_required_message,
    get_access_info,
    grant_access,
    has_access,
    is_owner,
    list_subscribers,
    register_user,
    revoke_access,
)
from utils.formatting import format_welcome


def _track_user(update: Update) -> int:
    user = update.effective_user
    if not user:
        return 0
    register_user(user.id, user.username, user.first_name)
    return user.id


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    user_id = _track_user(update)
    first_name = update.effective_user.first_name if update.effective_user else "there"
    text = format_welcome(first_name)

    info = get_access_info(user_id, settings.owner_id)
    if info:
        text += f"\n\n{info['days_left']} days left"
    elif not is_owner(user_id, settings.owner_id):
        text += f"\n\nNo access · your ID: {user_id}"

    await message.reply_text(text)


async def cmd_myid(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message or not update.effective_user:
        return

    user_id = _track_user(update)
    username = update.effective_user.username or "none"
    await message.reply_text(
        f"Your User ID: {user_id}\n"
        f"Username: @{username}\n\n"
        f"HexTLO access is $5/month.\n"
        "Send this ID to the owner to get access."
    )


async def cmd_grant(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message or not update.effective_user:
        return

    admin_id = update.effective_user.id
    if not is_owner(admin_id, settings.owner_id):
        await message.reply_text("Unauthorized. Owner only.")
        return

    args = context.args or []
    if len(args) != 2:
        await message.reply_text(
            "Grant access\n"
            "────────────────────────────\n\n"
            "Usage: /grant <user_id> <days>\n\n"
            "Example: /grant 123456789 30\n\n"
            "Pricing: $5/month (~30 days)"
        )
        return

    try:
        user_id = int(args[0])
        days = int(args[1])
    except ValueError:
        await message.reply_text("User ID and days must be numbers.")
        return

    if days < 1:
        await message.reply_text("Days must be at least 1.")
        return

    result = grant_access(user_id, days)
    await message.reply_text(result)


async def cmd_revoke(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message or not update.effective_user:
        return

    if not is_owner(update.effective_user.id, settings.owner_id):
        await message.reply_text("Unauthorized. Owner only.")
        return

    args = context.args or []
    if len(args) != 1:
        await message.reply_text("Usage: /revoke <user_id>")
        return

    try:
        user_id = int(args[0])
    except ValueError:
        await message.reply_text("User ID must be a number.")
        return

    await message.reply_text(revoke_access(user_id))


async def cmd_apistatus(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message or not update.effective_user:
        return

    if not is_owner(update.effective_user.id, settings.owner_id):
        await message.reply_text("Unauthorized. Owner only.")
        return

    await message.reply_chat_action("typing")
    rows = await check_all_apis()
    lines = ["API Status", "────────────────────────────"]
    for label, ok, msg, count in rows:
        status = "online" if ok else "offline"
        extra = f" ({count} hits)" if ok and count else ""
        if not ok:
            extra = f" — {msg}"
        lines.append(f"{label}: {status}{extra}")
    await message.reply_text("\n".join(lines))


async def cmd_users(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message or not update.effective_user:
        return

    if not is_owner(update.effective_user.id, settings.owner_id):
        await message.reply_text("Unauthorized. Owner only.")
        return

    rows = list_subscribers()
    if not rows:
        await message.reply_text("No subscribers yet.")
        return

    lines = ["Active subscribers\n────────────────────────────"]
    for row in rows[:30]:
        status = "active" if row["active"] else "expired"
        lines.append(
            f"ID {row['user_id']} (@{row['username']}) — {row['days_left']}d left [{status}]"
        )
    await message.reply_text("\n".join(lines))
