from dataclasses import dataclass

import base58
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed

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


async def get_balance_sol(pubkey: str) -> float:
    client = AsyncClient(SOLANA_RPC_URL)
    try:
        resp = await client.get_balance(Pubkey.from_string(pubkey), commitment=Confirmed)
        lamports = resp.value or 0
        return lamports / LAMPORTS_PER_SOL
    finally:
        await client.close()


async def get_wallet_info(pubkey: str, keypair: Keypair | None = None) -> WalletInfo:
    balance = await get_balance_sol(pubkey)
    return WalletInfo(pubkey=pubkey, balance_sol=balance, keypair=keypair)
