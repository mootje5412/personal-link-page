import asyncio
import base64
import logging

import httpx
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import TxOpts
from solders.transaction import VersionedTransaction

from config import MAX_PRICE_IMPACT_PCT, SOL_MINT, SOLANA_RPC_URL

logger = logging.getLogger(__name__)

JUPITER_QUOTE = "https://quote-api.jup.ag/v6/quote"
JUPITER_SWAP = "https://quote-api.jup.ag/v6/swap"
JUPITER_PRICE = "https://api.jup.ag/price/v2"


async def get_quote(input_mint: str, output_mint: str, amount: int, slippage_bps: int = 350) -> dict:
    params = {
        "inputMint": input_mint,
        "outputMint": output_mint,
        "amount": str(amount),
        "slippageBps": str(slippage_bps),
        "onlyDirectRoutes": "false",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(JUPITER_QUOTE, params=params)
        if resp.status_code == 400:
            raise ValueError(f"No swap route: {resp.text[:200]}")
        resp.raise_for_status()
        return resp.json()


def _price_impact_pct(quote: dict) -> float:
    try:
        return abs(float(quote.get("priceImpactPct") or 0))
    except (TypeError, ValueError):
        return 0.0


async def build_swap_transaction(quote: dict, user_pubkey: str) -> dict:
    payload = {
        "quoteResponse": quote,
        "userPublicKey": user_pubkey,
        "wrapAndUnwrapSol": True,
        "dynamicComputeUnitLimit": True,
        "prioritizationFeeLamports": "auto",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(JUPITER_SWAP, json=payload)
        resp.raise_for_status()
        return resp.json()


async def _send_signed_tx(keypair, swap_data: dict) -> str:
    raw_tx = base64.b64decode(swap_data["swapTransaction"])
    tx = VersionedTransaction.from_bytes(raw_tx)
    signed = VersionedTransaction(tx.message, [keypair])

    client = AsyncClient(SOLANA_RPC_URL)
    try:
        result = await client.send_raw_transaction(
            bytes(signed),
            opts=TxOpts(skip_preflight=False, max_retries=5),
        )
        return str(result.value)
    finally:
        await client.close()


async def swap_sol_for_token(keypair, token_mint: str, amount_lamports: int, slippage_bps: int = 350) -> tuple[str, dict]:
    quote = await get_quote(SOL_MINT, token_mint, amount_lamports, slippage_bps)
    impact = _price_impact_pct(quote)
    if impact > MAX_PRICE_IMPACT_PCT:
        raise ValueError(f"Price impact too high: {impact:.1f}% (max {MAX_PRICE_IMPACT_PCT}%)")

    swap_data = await build_swap_transaction(quote, str(keypair.pubkey()))
    sig = await _send_signed_tx(keypair, swap_data)

    from services.wallet import confirm_transaction
    confirmed = await confirm_transaction(sig)
    if not confirmed:
        raise ValueError(f"Transaction not confirmed: {sig}")

    return sig, {
        "quote": quote,
        "out_amount": int(quote.get("outAmount", 0)),
        "price_impact": impact,
    }


async def swap_token_for_sol(keypair, token_mint: str, token_amount_raw: int, slippage_bps: int = 600) -> tuple[str, dict]:
    if token_amount_raw <= 0:
        raise ValueError("No tokens to sell")

    quote = await get_quote(token_mint, SOL_MINT, token_amount_raw, slippage_bps)
    impact = _price_impact_pct(quote)
    if impact > MAX_PRICE_IMPACT_PCT + 5:
        raise ValueError(f"Sell price impact too high: {impact:.1f}%")

    swap_data = await build_swap_transaction(quote, str(keypair.pubkey()))
    sig = await _send_signed_tx(keypair, swap_data)

    from services.wallet import confirm_transaction
    confirmed = await confirm_transaction(sig)
    if not confirmed:
        raise ValueError(f"Sell tx not confirmed: {sig}")

    return sig, {
        "quote": quote,
        "out_lamports": int(quote.get("outAmount", 0)),
        "price_impact": impact,
    }


async def get_sol_price_usd() -> float:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(JUPITER_PRICE, params={"ids": SOL_MINT})
            data = resp.json().get("data", {})
            return float(data.get(SOL_MINT, {}).get("price", 0))
    except Exception:
        return 0.0
