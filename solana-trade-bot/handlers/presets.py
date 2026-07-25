"""One-tap trading presets."""

PRESETS = {
    "safe": {
        "label": "Safe",
        "desc": "Small trades, tight stops, elite coins only",
        "trade_sol": 0.02,
        "stop_loss_pct": 10,
        "take_profit_pct": 30,
        "trailing_stop_pct": 8,
        "max_positions": 2,
        "min_ai_score": 85,
    },
    "balanced": {
        "label": "Balanced",
        "desc": "Recommended for most users",
        "trade_sol": 0.05,
        "stop_loss_pct": 15,
        "take_profit_pct": 50,
        "trailing_stop_pct": 10,
        "max_positions": 3,
        "min_ai_score": 75,
    },
    "degen": {
        "label": "Degen",
        "desc": "Bigger trades, wider stops, more positions",
        "trade_sol": 0.1,
        "stop_loss_pct": 20,
        "take_profit_pct": 100,
        "trailing_stop_pct": 15,
        "max_positions": 5,
        "min_ai_score": 70,
    },
}


def preset_summary(key: str) -> str:
    p = PRESETS[key]
    return (
        f"{p['trade_sol']} SOL/trade | Stop -{p['stop_loss_pct']}% | Target +{p['take_profit_pct']}%\n"
        f"Max {p['max_positions']} positions | Min score {p['min_ai_score']}/100"
    )
