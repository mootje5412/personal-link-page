from dataclasses import dataclass

import base58
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed, Finalized

from config import LAMPORTS_PER_SOL, SOLANA_RPC_URL


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
    raise ValueError("Invalid private key length. Paste your full base58 secret key.")


def validate_pubkey(pubkey: str) -> bool:
    try:
        Pubkey.from_string(pubkey)
        return True
    except Exception:
        return False


async def _client() -> AsyncClient:
    return AsyncClient(SOLANA_RPC_URL)


async def get_balance_sol(pubkey: str) -> float:
    client = await _client()
    try:
        resp = await client.get_balance(Pubkey.from_string(pubkey), commitment=Confirmed)
        return (resp.value or 0) / LAMPORTS_PER_SOL
    finally:
        await client.close()


async def get_token_balance_raw(owner_pubkey: str, token_mint: str) -> int:
    """Get raw token balance (smallest units) from on-chain."""
    owner = Pubkey.from_string(owner_pubkey)
    mint = Pubkey.from_string(token_mint)
    from solana.rpc.types import TokenAccountOpts

    client = await _client()
    try:
        resp = await client.get_token_accounts_by_owner(
            owner,
            TokenAccountOpts(mint=mint),
            commitment=Confirmed,
        )
        if not resp.value:
            return 0
        total = 0
        for acct in resp.value:
            bal_resp = await client.get_token_account_balance(acct.pubkey, commitment=Confirmed)
            if bal_resp.value:
                total += int(bal_resp.value.amount)
        return total
    finally:
        await client.close()


async def confirm_transaction(signature: str, timeout_sec: int = 45) -> bool:
    import asyncio

    client = await _client()
    try:
        for _ in range(timeout_sec // 2):
            resp = await client.get_signature_statuses([signature])
            statuses = resp.value
            if statuses and statuses[0]:
                status = statuses[0]
                if status.err:
                    return False
                conf = status.confirmation_status
                if conf in ("confirmed", "finalized") or status.confirmations is None:
                    return True
            await asyncio.sleep(2)
        return False
    finally:
        await client.close()


async def get_wallet_info(pubkey: str, keypair: Keypair | None = None) -> WalletInfo:
    balance = await get_balance_sol(pubkey)
    return WalletInfo(pubkey=pubkey, balance_sol=balance, keypair=keypair)
