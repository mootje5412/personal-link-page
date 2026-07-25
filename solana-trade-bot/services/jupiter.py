import asyncio
import logging

import httpx
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import TxOpts
from solders.transaction import VersionedTransaction

from config import MAX_PRICE_IMPACT_PCT, SOL_MINT, SOLANA_RPC_FALLBACKS, SOLANA_RPC_URL

logger = logging.getLogger(__name__)

JUPITER_QUOTE = "https://quote-api.jup.ag/v6/quote"
JUPITER_SWAP = "https://quote-api.jup.ag/v6/swap"


async def get_quote(input_mint: str, output_mint: str, amount: int, slippage_bps: int = 300) -> dict:
    params = {
        "inputMint": input_mint,
        "outputMint": output_mint,
        "amount": str(amount),
        "slippageBps": str(slippage_bps),
        "onlyDirectRoutes": "false",
    }
    last_err = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(JUPITER_QUOTE, params=params)
                if resp.status_code == 400:
                    raise ValueError(f"No route available")
                resp.raise_for_status()
                return resp.json()
        except Exception as exc:
            last_err = exc
            await asyncio.sleep(1 + attempt)
    raise ValueError(f"Quote failed: {last_err}")


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


async def _send_with_fallback(keypair, swap_data: dict) -> str:
    import base64

    raw_tx = base64.b64decode(swap_data["swapTransaction"])
    tx = VersionedTransaction.from_bytes(raw_tx)
    signed = VersionedTransaction(tx.message, [keypair])
    raw = bytes(signed)

    rpcs = [SOLANA_RPC_URL] + [r for r in SOLANA_RPC_FALLBACKS if r != SOLANA_RPC_URL]
    last_err = None
    for rpc in rpcs:
        client = AsyncClient(rpc)
        try:
            result = await client.send_raw_transaction(
                raw, opts=TxOpts(skip_preflight=False, max_retries=5),
            )
            return str(result.value)
        except Exception as exc:
            last_err = exc
            logger.warning("RPC %s failed: %s", rpc[:40], exc)
        finally:
            await client.close()
    raise ValueError(f"All RPCs failed: {last_err}")


async def swap_sol_for_token(keypair, token_mint: str, amount_lamports: int, slippage_bps: int = 300) -> tuple[str, dict]:
    quote = await get_quote(SOL_MINT, token_mint, amount_lamports, slippage_bps)
    impact = _price_impact_pct(quote)
    if impact > MAX_PRICE_IMPACT_PCT:
        raise ValueError(f"Price impact {impact:.1f}% too high (max {MAX_PRICE_IMPACT_PCT}%)")

    swap_data = await build_swap_transaction(quote, str(keypair.pubkey()))
    sig = await _send_with_fallback(keypair, swap_data)

    from services.wallet import confirm_transaction
    if not await confirm_transaction(sig):
        raise ValueError(f"TX not confirmed: {sig[:16]}...")

    return sig, {"quote": quote, "out_amount": int(quote.get("outAmount", 0)), "price_impact": impact}


async def swap_token_for_sol(keypair, token_mint: str, token_amount_raw: int, slippage_bps: int = 500) -> tuple[str, dict]:
    if token_amount_raw <= 0:
        raise ValueError("Nothing to sell")

    quote = await get_quote(token_mint, SOL_MINT, token_amount_raw, slippage_bps)
    impact = _price_impact_pct(quote)
    if impact > MAX_PRICE_IMPACT_PCT + 4:
        raise ValueError(f"Sell impact {impact:.1f}% too high")

    swap_data = await build_swap_transaction(quote, str(keypair.pubkey()))
    sig = await _send_with_fallback(keypair, swap_data)

    from services.wallet import confirm_transaction
    if not await confirm_transaction(sig):
        raise ValueError(f"Sell TX not confirmed")

    return sig, {"quote": quote, "out_lamports": int(quote.get("outAmount", 0)), "price_impact": impact}
