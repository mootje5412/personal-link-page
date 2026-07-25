import httpx

JUPITER_QUOTE = "https://quote-api.jup.ag/v6/quote"
JUPITER_SWAP = "https://quote-api.jup.ag/v6/swap"


async def get_quote(input_mint: str, output_mint: str, amount_lamports: int, slippage_bps: int = 300) -> dict:
    params = {
        "inputMint": input_mint,
        "outputMint": output_mint,
        "amount": str(amount_lamports),
        "slippageBps": str(slippage_bps),
        "onlyDirectRoutes": "false",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(JUPITER_QUOTE, params=params)
        resp.raise_for_status()
        return resp.json()


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


async def swap_sol_for_token(keypair, token_mint: str, amount_lamports: int, slippage_bps: int = 300) -> tuple[str, dict]:
    from config import SOL_MINT

    quote = await get_quote(SOL_MINT, token_mint, amount_lamports, slippage_bps)
    swap_data = await build_swap_transaction(quote, str(keypair.pubkey()))

    import base64

    from solana.rpc.async_api import AsyncClient
    from solana.rpc.types import TxOpts
    from solders.transaction import VersionedTransaction

    from config import SOLANA_RPC_URL

    raw_tx = base64.b64decode(swap_data["swapTransaction"])
    tx = VersionedTransaction.from_bytes(raw_tx)
    signed = VersionedTransaction(tx.message, [keypair])

    client = AsyncClient(SOLANA_RPC_URL)
    try:
        result = await client.send_raw_transaction(bytes(signed), opts=TxOpts(skip_preflight=False, max_retries=3))
        sig = str(result.value)
        out_amount = int(quote.get("outAmount", 0))
        return sig, {"quote": quote, "out_amount": out_amount}
    finally:
        await client.close()


async def swap_token_for_sol(keypair, token_mint: str, token_amount_raw: int, slippage_bps: int = 500) -> tuple[str, dict]:
    from config import SOL_MINT, SOLANA_RPC_URL

    quote = await get_quote(token_mint, SOL_MINT, token_amount_raw, slippage_bps)
    swap_data = await build_swap_transaction(quote, str(keypair.pubkey()))

    import base64

    from solana.rpc.async_api import AsyncClient
    from solana.rpc.types import TxOpts
    from solders.transaction import VersionedTransaction

    raw_tx = base64.b64decode(swap_data["swapTransaction"])
    tx = VersionedTransaction.from_bytes(raw_tx)
    signed = VersionedTransaction(tx.message, [keypair])

    client = AsyncClient(SOLANA_RPC_URL)
    try:
        result = await client.send_raw_transaction(bytes(signed), opts=TxOpts(skip_preflight=False, max_retries=3))
        sig = str(result.value)
        out_lamports = int(quote.get("outAmount", 0))
        return sig, {"quote": quote, "out_lamports": out_lamports}
    finally:
        await client.close()
