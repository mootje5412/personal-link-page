from dataclasses import dataclass

import base58
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TokenAccountOpts

from config import LAMPORTS_PER_SOL, SOLANA_RPC_FALLBACKS, SOLANA_RPC_URL


@dataclass
class WalletInfo:
    pubkey: str
    balance_sol: float
    keypair: Keypair | None = None


def keypair_from_private_key(private_key_b58: str) -> Keypair:
    raw = base58.b58decode(private_key_b58.strip())
    if len(raw) == 64:
        return Keypair.from_bytes(raw)
    if len(raw) == 32:
        return Keypair.from_seed(raw)
    raise ValueError("Invalid private key. Paste your full base58 secret key.")


def validate_pubkey(pubkey: str) -> bool:
    try:
        Pubkey.from_string(pubkey)
        return True
    except Exception:
        return False


async def _with_rpc(coro_factory):
    rpcs = [SOLANA_RPC_URL] + [r for r in SOLANA_RPC_FALLBACKS if r != SOLANA_RPC_URL]
    last_err = None
    for rpc in rpcs:
        client = AsyncClient(rpc)
        try:
            return await coro_factory(client)
        except Exception as exc:
            last_err = exc
        finally:
            await client.close()
    raise last_err or RuntimeError("All RPCs failed")


async def get_balance_sol(pubkey: str) -> float:
    pk = Pubkey.from_string(pubkey)

    async def _fetch(client):
        resp = await client.get_balance(pk, commitment=Confirmed)
        return (resp.value or 0) / LAMPORTS_PER_SOL

    return await _with_rpc(_fetch)


async def get_token_balance_raw(owner_pubkey: str, token_mint: str) -> int:
    owner = Pubkey.from_string(owner_pubkey)
    mint = Pubkey.from_string(token_mint)

    async def _fetch(client):
        resp = await client.get_token_accounts_by_owner(
            owner, TokenAccountOpts(mint=mint), commitment=Confirmed,
        )
        if not resp.value:
            return 0
        total = 0
        for acct in resp.value:
            bal = await client.get_token_account_balance(acct.pubkey, commitment=Confirmed)
            if bal.value:
                total += int(bal.value.amount)
        return total

    return await _with_rpc(_fetch)


async def confirm_transaction(signature: str, timeout_sec: int = 60) -> bool:
    import asyncio

    async def _check(client):
        for _ in range(timeout_sec // 2):
            resp = await client.get_signature_statuses([signature])
            statuses = resp.value
            if statuses and statuses[0]:
                st = statuses[0]
                if st.err:
                    return False
                if st.confirmation_status in ("confirmed", "finalized") or st.confirmations is None:
                    return True
            await asyncio.sleep(2)
        return False

    try:
        return await _with_rpc(_check)
    except Exception:
        return False


async def get_wallet_info(pubkey: str, keypair: Keypair | None = None) -> WalletInfo:
    balance = await get_balance_sol(pubkey)
    return WalletInfo(pubkey=pubkey, balance_sol=balance, keypair=keypair)
