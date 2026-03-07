/**
 * ChaCha20-Poly1305 AEAD encryption for Sahayak kiosk.
 *
 * Wire format: base64( 12-byte-nonce || ciphertext+poly1305-tag )
 * Same format as the Python backend (cryptography library).
 *
 * Key: VITE_ENCRYPTION_KEY env var — 64 hex chars (32 bytes).
 * This is baked into the bundle at build time by Vite.
 */
import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/ciphers/webcrypto';

const HEX_KEY = import.meta.env.VITE_ENCRYPTION_KEY || '';

if (!HEX_KEY || HEX_KEY.length !== 64) {
  console.error(
    '[crypto] VITE_ENCRYPTION_KEY must be 64 hex chars. ' +
    'Set it in kiosk/.env or pass as a Docker build arg.'
  );
}

/** Convert 64-char hex string to Uint8Array (32 bytes). */
const KEY = new Uint8Array(
  (HEX_KEY.match(/.{2}/g) || []).map(b => parseInt(b, 16))
);

/**
 * Encrypt a JS object with ChaCha20-Poly1305.
 * Returns { payload: "<base64 nonce+ciphertext>" } ready to JSON.stringify.
 */
export function encrypt(obj) {
  const nonce = randomBytes(12);
  const plaintext = new TextEncoder().encode(JSON.stringify(obj));
  const cipher = chacha20poly1305(KEY, nonce);
  const ct = cipher.encrypt(plaintext);          // ciphertext + 16-byte tag

  // Combine: nonce (12 B) | ciphertext+tag
  const combined = new Uint8Array(12 + ct.length);
  combined.set(nonce, 0);
  combined.set(ct, 12);

  // Base64 encode
  const b64 = btoa(String.fromCharCode(...combined));
  return { payload: b64 };
}

/**
 * Decrypt a response object that has a `.payload` field.
 * If the object has no `.payload`, returns it unchanged (unencrypted fallback).
 */
export function decrypt(obj) {
  if (!obj || typeof obj.payload !== 'string') return obj;

  const combined = Uint8Array.from(atob(obj.payload), c => c.charCodeAt(0));
  const nonce = combined.slice(0, 12);
  const ct    = combined.slice(12);

  const cipher = chacha20poly1305(KEY, nonce);
  const plaintext = cipher.decrypt(ct);
  return JSON.parse(new TextDecoder().decode(plaintext));
}
