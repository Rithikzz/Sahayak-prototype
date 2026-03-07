"""
ChaCha20-Poly1305 AEAD encryption/decryption utility.

Wire format: base64( 12-byte-nonce || ciphertext || 16-byte-poly1305-tag )
The nonce is generated fresh per message using os.urandom (CSPRNG).
"""
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

_HEX_KEY = os.getenv("ENCRYPTION_KEY", "")

if len(_HEX_KEY) != 64:
    raise RuntimeError(
        f"ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). "
        f"Got {len(_HEX_KEY)} chars. "
        "Generate one with: python3 -c \"import secrets; print(secrets.token_hex(32))\""
    )

_KEY_BYTES = bytes.fromhex(_HEX_KEY)
_CHACHA = ChaCha20Poly1305(_KEY_BYTES)


def encrypt(data: bytes) -> str:
    """
    Encrypt *data* bytes with ChaCha20-Poly1305.
    Returns base64url-safe string of: nonce (12 B) || ciphertext+tag.
    """
    nonce = os.urandom(12)          # 96-bit random nonce — never reused
    ct = _CHACHA.encrypt(nonce, data, None)   # aad = None
    return base64.b64encode(nonce + ct).decode()


def decrypt(payload: str) -> bytes:
    """
    Decrypt a base64 payload produced by :func:`encrypt`.
    Raises ``ValueError`` if the tag is invalid (tampered / bad key).
    """
    raw = base64.b64decode(payload)
    nonce, ct = raw[:12], raw[12:]
    return _CHACHA.decrypt(nonce, ct, None)
