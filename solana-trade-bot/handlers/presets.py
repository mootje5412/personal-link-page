"""One-tap trading presets — single coin focus, small size."""

PRESETS = {
    "safe": {
        "label": "Safe",
        "desc": "Smallest size, 1 coin only, elite picks",
        "trade_sol": 0.01,
        "stop_loss_pct": 8,
        "take_profit_pct": 25,
        "trailing_stop_pct": 6,
        "max_positions": 1,
        "min_ai_score": 85,
    },
    "balanced": {
        "label": "Balanced",
        "desc": "Recommended — 1 coin, small trades, tight exits",
        "trade_sol": 0.02,
        "stop_loss_pct": 12,
        "take_profit_pct": 35,
        "trailing_stop_pct": 8,
        "max_positions": 1,
        "min_ai_score": 80,
    },
    "degen": {
        "label": "Degen",
        "desc": "Still 1 coin only, slightly larger size",
        "trade_sol": 0.03,
        "stop_loss_pct": 15,
        "take_profit_pct": 50,
        "trailing_stop_pct": 10,
        "max_positions": 1,
        "min_ai_score": 78,
    },
}


def preset_summary(key: str) -> str:
    p = PRESETS[key]
    return (
        f"{p['trade_sol']} SOL/trade | Stop -{p['stop_loss_pct']}% | Target +{p['take_profit_pct']}%\n"
        f"1 coin at a time | Min score {p['min_ai_score']}/100"
    )
