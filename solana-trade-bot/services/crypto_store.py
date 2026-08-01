import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from config import BOT_SECRET_KEY


def _derive_key(user_id: int) -> bytes:
    if not BOT_SECRET_KEY:
        raise ValueError("BOT_SECRET_KEY is not set. Generate one and add it to .env")
    seed = f"{BOT_SECRET_KEY}:{user_id}".encode()
    digest = hashlib.sha256(seed).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_private_key(user_id: int, private_key_b58: str) -> str:
    f = Fernet(_derive_key(user_id))
    return f.encrypt(private_key_b58.encode()).decode()


def decrypt_private_key(user_id: int, encrypted: str) -> str:
    f = Fernet(_derive_key(user_id))
    try:
        return f.decrypt(encrypted.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Failed to decrypt wallet key") from exc
