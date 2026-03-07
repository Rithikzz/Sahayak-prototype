/**
 * ChaCha20-Poly1305 AEAD encryption for Sahayak admin portal.
 * Identical logic to kiosk/src/utils/crypto.js — same key, same wire format.
 */
import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/ciphers/webcrypto';

const HEX_KEY = import.meta.env.VITE_ENCRYPTION_KEY || '';

if (!HEX_KEY || HEX_KEY.length !== 64) {
  console.error(
    '[crypto] VITE_ENCRYPTION_KEY must be 64 hex chars. ' +
    'Set it in Sahayak_admin/.env or pass as a Docker build arg.'
  );
}

const KEY = new Uint8Array(
  (HEX_KEY.match(/.{2}/g) || []).map(b => parseInt(b, 16))
);

export function encrypt(obj) {
  const nonce = randomBytes(12);
  const plaintext = new TextEncoder().encode(JSON.stringify(obj));
  const cipher = chacha20poly1305(KEY, nonce);
  const ct = cipher.encrypt(plaintext);

  const combined = new Uint8Array(12 + ct.length);
  combined.set(nonce, 0);
  combined.set(ct, 12);

  const b64 = btoa(String.fromCharCode(...combined));
  return { payload: b64 };
}

export function decrypt(obj) {
  if (!obj || typeof obj.payload !== 'string') return obj;

  const combined = Uint8Array.from(atob(obj.payload), c => c.charCodeAt(0));
  const nonce = combined.slice(0, 12);
  const ct    = combined.slice(12);

  const cipher = chacha20poly1305(KEY, nonce);
  const plaintext = cipher.decrypt(ct);
  return JSON.parse(new TextDecoder().decode(plaintext));
}
