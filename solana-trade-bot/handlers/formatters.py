"""Clean text formatters — no emojis."""

from datetime import datetime, timezone

from services.entry_filter import entry_quality_label, validate_entry
from services.scanner import MemeCoin

from handlers.presets import PRESETS
from services.risk import format_risk_summary


def greeting(name: str | None) -> str:
    hour = datetime.now(timezone.utc).hour
    if 5 <= hour < 12:
        period = "Good morning"
    elif 12 <= hour < 18:
        period = "Good afternoon"
    else:
        period = "Good evening"
    if name:
        return f"{period}, {name}."
    return f"{period}."


def short_address(pubkey: str) -> str:
    if len(pubkey) <= 16:
        return pubkey
    return f"{pubkey[:6]}...{pubkey[-4:]}"


def performance_label(win_rate: float, sol_pnl: float) -> str:
    if win_rate >= 60 and sol_pnl > 0:
        return "Strong"
    if win_rate >= 50 and sol_pnl >= 0:
        return "Profitable"
    if win_rate >= 40:
        return "Mixed"
    if sol_pnl < -0.05:
        return "Needs adjustment"
    return "Getting started"


def format_usd(val: float) -> str:
    if val >= 1_000_000:
        return f"${val / 1_000_000:.2f}M"
    if val >= 1_000:
        return f"${val:,.0f}"
    return f"${val:.2f}"


def format_price(val: float) -> str:
    if val >= 1:
        return f"${val:.4f}"
    if val >= 0.0001:
        return f"${val:.6f}"
    return f"${val:.8f}"


def format_pct(val: float) -> str:
    return f"{val:+.1f}%"


def format_age(hours: float) -> str:
    if hours >= 999:
        return "Unknown"
    if hours < 1:
        return f"{int(hours * 60)}m"
    if hours < 48:
        return f"{hours:.1f}h"
    return f"{hours / 24:.1f}d"


def format_buy_ratio(buys: int, sells: int) -> str:
    total = buys + sells
    if total <= 0:
        return "No data"
    pct = buys / total * 100
    return f"{pct:.0f}% buys ({buys}B / {sells}S)"


def hold_duration(opened_at: str | None) -> str:
    if not opened_at:
        return "Unknown"
    try:
        opened = datetime.fromisoformat(opened_at.replace("Z", "+00:00"))
        hours = (datetime.now(timezone.utc) - opened).total_seconds() / 3600
        return format_age(hours)
    except Exception:
        return "Unknown"


def entry_status(coin: MemeCoin, min_score: float) -> tuple[str, str]:
    ok, reason = validate_entry(coin, min_score)
    if ok:
        return "PASS", entry_quality_label(coin)
    return "BLOCKED", reason


def format_coin_brief(coin: MemeCoin, min_score: float, rank: int | None = None) -> str:
    verdict = getattr(coin, "ai_verdict", "WATCH")
    ok, entry_note = entry_status(coin, min_score)
    prefix = f"{rank}. " if rank else ""
    signal = coin.ai_signals[0] if coin.ai_signals else "Mixed signals"
    entry_tag = "Ready" if ok == "PASS" else f"Blocked: {entry_note}"
    return (
        f"{prefix}<b>${coin.symbol}</b> — {verdict} ({coin.ai_score}/100)\n"
        f"  {format_price(coin.price_usd)} | 5m {format_pct(coin.price_change_m5)} | "
        f"1h {format_pct(coin.price_change_h1)} | 24h {format_pct(coin.price_change_h24)}\n"
        f"  Liq {format_usd(coin.liquidity_usd)} | Vol {format_usd(coin.volume_24h)} | "
        f"Age {format_age(coin.age_hours)}\n"
        f"  {signal} | Entry: {entry_tag}"
    )


def format_coin_detail(coin: MemeCoin, min_score: float, user: dict | None = None) -> str:
    verdict = getattr(coin, "ai_verdict", "WATCH")
    ok, entry_note = entry_status(coin, min_score)
    signals = "\n".join(f"  - {s}" for s in coin.ai_signals[:5]) or "  - Mixed signals"

    lines = [
        f"<b>${coin.symbol}</b> — {coin.name}",
        f"Verdict: <b>{verdict}</b> | AI Score: <b>{coin.ai_score}/100</b>",
        "",
        "<b>Price</b>",
        f"Now: {format_price(coin.price_usd)}",
        f"5m: {format_pct(coin.price_change_m5)} | 1h: {format_pct(coin.price_change_h1)} | "
        f"6h: {format_pct(coin.price_change_h6)} | 24h: {format_pct(coin.price_change_h24)}",
        "",
        "<b>Market</b>",
        f"Liquidity: {format_usd(coin.liquidity_usd)}",
        f"Volume 24h: {format_usd(coin.volume_24h)} | 1h: {format_usd(coin.volume_1h)}",
        f"Market cap: {format_usd(coin.market_cap)} | FDV: {format_usd(coin.fdv)}",
        f"Age: {format_age(coin.age_hours)} | DEX: {coin.dex or 'unknown'}",
        "",
        "<b>Order Flow</b>",
        f"1h: {format_buy_ratio(coin.buys_1h, coin.sells_1h)}",
        f"24h: {format_buy_ratio(coin.buys_24h, coin.sells_24h)}",
        "",
        "<b>AI Analysis</b>",
        signals,
        "",
        "<b>Entry Check</b>",
        f"Status: {'PASS — good to buy' if ok == 'PASS' else f'BLOCKED — {entry_note}'}",
        f"Quality: {entry_quality_label(coin)}",
        f"Your min score: {min_score}/100",
    ]

    if user:
        lines.extend([
            "",
            "<b>Your Rules</b>",
            f"Trade size: {float(user.get('trade_sol', 0.05))} SOL",
            f"Stop: -{float(user.get('stop_loss_pct', 15))}% | "
            f"Target: +{float(user.get('take_profit_pct', 50))}% | "
            f"Trail: -{float(user.get('trailing_stop_pct', 10))}% from peak",
        ])

    lines.append(f"\n<a href='{coin.url}'>View chart on DexScreener</a>")
    return "\n".join(lines)


def format_scan_results(
    ranked: list[MemeCoin],
    min_score: float,
    buys: list[MemeCoin],
) -> str:
    if not ranked:
        return "No quality coins found. Try again in a minute."

    best = buys[0] if buys else ranked[0]
    verdict = getattr(best, "ai_verdict", "WATCH")
    ok, entry_note = entry_status(best, min_score)
    why = "; ".join(best.ai_signals[:3]) if best.ai_signals else "Mixed signals"

    lines = [
        "<b>AI Market Scan</b>",
        f"{len(ranked)} coins analyzed | Your min score: {min_score}/100",
        "",
        f"<b>BEST BUY: ${best.symbol}</b>",
        f"{verdict} | Score {best.ai_score}/100 | Entry: {'Ready' if ok == 'PASS' else entry_note}",
        f"Price {format_price(best.price_usd)}",
        f"5m {format_pct(best.price_change_m5)} | 1h {format_pct(best.price_change_h1)} | "
        f"24h {format_pct(best.price_change_h24)}",
        f"Liq {format_usd(best.liquidity_usd)} | Vol {format_usd(best.volume_24h)} | "
        f"MCap {format_usd(best.market_cap)}",
        f"Flow 1h: {format_buy_ratio(best.buys_1h, best.sells_1h)}",
        f"Why: {why}",
        f"<a href='{best.url}'>Chart</a>",
        "",
        "<b>Top Ranked</b>",
    ]

    shown = {best.mint}
    rank = 1
    for c in ranked:
        if c.mint in shown:
            continue
        if len(shown) >= 8:
            break
        rank += 1
        lines.append(format_coin_brief(c, min_score, rank))
        shown.add(c.mint)

    avoid = [c for c in ranked if getattr(c, "ai_verdict", "") == "AVOID"][:3]
    if avoid:
        lines.extend(["", "<b>Avoid</b>"])
        for c in avoid:
            reason = c.ai_signals[0] if c.ai_signals else "Low score"
            lines.append(f"${c.symbol} — {c.ai_score}/100 — {reason}")

    lines.append("\nTap Details on any coin for full breakdown, or Buy to trade.")
    return "\n".join(lines)


def format_position_line(pos: dict, detail: dict) -> str:
    pnl = detail["pnl_pct"]
    tag = "UP" if pnl >= 0 else "DOWN"
    return (
        f"<b>${pos['token_symbol']}</b> [{tag}] {format_pct(pnl)}\n"
        f"  Entry {format_price(detail['entry_price'])} -> Now {format_price(detail['current_price'])}\n"
        f"  {detail['sol_in']:.4f} SOL in -> ~{detail['est_sol']:.4f} SOL | Hold {detail['hold_time']}\n"
        f"  Stop in {detail['to_stop']:+.1f}% | Target in {detail['to_target']:+.1f}% | "
        f"Peak drop {detail['from_peak']:+.1f}%"
    )


def format_position_detail(pos: dict, detail: dict, user: dict) -> str:
    pnl = detail["pnl_pct"]
    tag = "PROFIT" if pnl >= 0 else "LOSS"
    live = detail.get("live_note", "")

    lines = [
        f"<b>${pos['token_symbol']}</b> — Open Position [{tag}]",
        f"PnL: {format_pct(pnl)} ({detail['unrealized_sol']:+.4f} SOL)",
        "",
        "<b>Entry</b>",
        f"Price: {format_price(detail['entry_price'])} | Amount: {detail['sol_in']:.4f} SOL",
        f"AI score at buy: {float(pos.get('ai_score') or 0):.0f}/100",
        f"Opened: {detail['hold_time']} ago",
        "",
        "<b>Live</b>",
        f"Current: {format_price(detail['current_price'])} | Est. value: {detail['est_sol']:.4f} SOL",
        f"Peak: {format_price(detail['peak_price'])} | Drop from peak: {format_pct(detail['from_peak'])}",
        "",
        "<b>Exit Levels</b>",
        f"Stop loss (-{float(user.get('stop_loss_pct', 15))}%): {detail['to_stop']:+.1f}% away",
        f"Take profit (+{float(user.get('take_profit_pct', 50))}%): {detail['to_target']:+.1f}% away",
        f"Trailing stop (-{float(user.get('trailing_stop_pct', 10))}% from peak): "
        f"{detail['trail_buffer']:+.1f}% buffer",
    ]

    if live:
        lines.extend(["", "<b>Market Now</b>", live])

    if detail.get("chart_url"):
        lines.append(f"\n<a href='{detail['chart_url']}'>Chart</a>")

    return "\n".join(lines)


def format_autotrade_status(status: dict, autotrade_on: bool) -> str:
    if not autotrade_on:
        return "Auto trade: Off"

    state = status.get("state", "idle")
    lines = ["<b>Auto Trade Status</b>"]

    labels = {
        "bought": "Last action: bought",
        "holding": "Holding 1 coin — no new buys until exit",
        "scanning": "Scanning for the single best coin",
        "waiting": "Waiting for an elite setup",
        "swap_failed": "Swap failed — retrying",
        "low_balance": "Low balance — paused",
        "capital_cap": "Capital cap reached — protecting balance",
        "max_positions": "Already in a trade",
        "no_wallet_key": "Wallet key missing",
        "error": "Error",
    }
    lines.append(f"State: {labels.get(state, state)}")

    if status.get("scanned"):
        lines.append(f"Last scan: {status['scanned']} coins")
    if status.get("candidates") is not None:
        lines.append(f"Ready to buy: {status['candidates']} coin(s)")
    if status.get("top_pick"):
        lines.append(f"Top pick: {status['top_pick']}")
    if status.get("focus_coin"):
        lines.append(f"Holding: {status['focus_coin']}")
    if status.get("last_buy"):
        lines.append(f"Last buy: ${status['last_buy']}")
    if status.get("last_error"):
        lines.append(f"Issue: {status['last_error']}")
    if status.get("blocked"):
        lines.append("Blocked examples:")
        for b in status["blocked"]:
            lines.append(f"  - {b}")

    return "\n".join(lines)


def format_dashboard(
    user: dict,
    stats: dict,
    best: dict,
    bal: float,
    unrealized: dict | None,
    positions: list[dict],
    position_details: list[dict],
    autotrade_status: dict | None = None,
) -> str:
    autotrade = "Running" if user.get("autotrade") else "Paused"
    mode_label = PRESETS.get(user.get("risk_mode") or "balanced", PRESETS["balanced"])["label"]
    perf = performance_label(stats["win_rate"], stats.get("sol_pnl", 0))

    invested = unrealized["invested_sol"] if unrealized else 0.0
    pos_value = unrealized["current_sol"] if unrealized else 0.0
    unreal_sol = unrealized["unrealized_sol"] if unrealized else 0.0
    unreal_pct = unrealized["unrealized_pct"] if unrealized else 0.0
    total_value = bal + pos_value
    combined_pnl = stats.get("sol_pnl", 0) + unreal_sol

    lines = [
        "<b>Dashboard</b>",
        "",
        f"Bot: {autotrade} | Mode: {mode_label}",
    ]

    if user.get("wallet_pubkey"):
        lines.append(f"Wallet: <code>{short_address(user['wallet_pubkey'])}</code>")
        lines.append(format_risk_summary(bal, float(user.get("trade_sol", 0.02)), invested))

    lines.extend([
        "",
        "<b>Portfolio</b>",
        f"SOL balance: {bal:.4f} SOL",
        f"In positions: {invested:.4f} SOL invested -> ~{pos_value:.4f} SOL",
        f"Total est. value: {total_value:.4f} SOL",
        f"Unrealized: {unreal_sol:+.4f} SOL ({format_pct(unreal_pct)})",
        f"Realized: {stats.get('sol_pnl', 0):+.4f} SOL",
        f"Combined PnL: {combined_pnl:+.4f} SOL",
        "",
        f"Performance: {perf}",
        "",
        "<b>Trading Stats</b>",
        f"Closed trades: {stats['total_trades']} ({stats['wins']}W / {stats['losses']}L)",
        f"Win rate: {stats['win_rate']}% | Avg PnL: {format_pct(stats['avg_pnl'])}",
        f"Open positions: {stats['open_positions']} / 1 (one coin focus)",
    ])

    if position_details:
        lines.extend(["", "<b>Open Positions</b>"])
        for pos, detail in zip(positions, position_details):
            lines.append(format_position_line(pos, detail))

    if best.get("best_symbol"):
        lines.extend([
            "",
            "<b>Records</b>",
            f"Best: ${best['best_symbol']} ({format_pct(best['best_pnl'])})",
        ])
        if best.get("worst_symbol"):
            lines.append(f"Worst: ${best['worst_symbol']} ({format_pct(best['worst_pnl'])})")

    lines.extend([
        "",
        "<b>Active Rules</b>",
        f"Trade size: {float(user.get('trade_sol', 0.05))} SOL",
        f"Stop: -{float(user.get('stop_loss_pct', 15))}% | "
        f"Target: +{float(user.get('take_profit_pct', 50))}% | "
        f"Trail: -{float(user.get('trailing_stop_pct', 10))}%",
        f"Min AI score: {float(user.get('min_ai_score', 75))}/100",
    ])

    if autotrade_status is not None:
        lines.extend(["", format_autotrade_status(autotrade_status, bool(user.get("autotrade")))])

    return "\n".join(lines)


def format_trade_history(trades: list[dict]) -> str:
    if not trades:
        return "<b>No trades yet.</b>\n\nStart auto trade or run Best Buys to begin."

    import json

    lines = ["<b>Recent Trades</b>", ""]
    for t in trades:
        action = t["action"]
        sig = t.get("tx_signature") or ""
        link = f" <a href='https://solscan.io/tx/{sig}'>tx</a>" if sig else ""
        extra_parts = []

        try:
            d = json.loads(t.get("details") or "{}")
            if action == "SELL":
                if d.get("pnl_pct") is not None:
                    extra_parts.append(format_pct(float(d["pnl_pct"])))
                if d.get("sol_pnl") is not None:
                    extra_parts.append(f"{float(d['sol_pnl']):+.4f} SOL")
                if d.get("reason"):
                    extra_parts.append(str(d["reason"]))
            elif action == "BUY" and d.get("ai_score") is not None:
                extra_parts.append(f"score {float(d['ai_score']):.0f}/100")
        except Exception:
            pass

        extra = f" ({', '.join(extra_parts)})" if extra_parts else ""
        lines.append(
            f"{action} <b>${t['token_symbol']}</b>{extra}\n"
            f"  {float(t['amount_sol']):.4f} SOL{link}"
        )

    return "\n".join(lines)
