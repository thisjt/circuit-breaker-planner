/**
 * Cryptographic helpers for Cloudflare R2 Plan Author Edit Tokens & Passphrase Protection.
 * Uses Web Crypto API (supported natively in Cloudflare Workers and Node.js 18+).
 */

export const PBKDF2_ITERATIONS = 100_000;
export const PBKDF2_KEY_LEN_BYTES = 32; // 256 bits
export const MIN_PASSPHRASE_LENGTH = 4;

export function generateEditToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Derives a cryptographic hash using PBKDF2-HMAC-SHA256 with 100,000 iterations and a 128-bit salt.
 */
export async function hashPassphrase(
  passphrase: string,
  saltHex?: string
): Promise<{ hash: string; salt: string }> {
  const salt = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const saltStr = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    PBKDF2_KEY_LEN_BYTES * 8
  );

  const hash = Array.from(new Uint8Array(derivedBits), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

  return { hash: `pbkdf2$${PBKDF2_ITERATIONS}$${hash}`, salt: saltStr };
}

/**
 * Verifies a passphrase against stored hash with constant-time comparison
 * and backward compatibility for legacy single-round SHA-256 hashes.
 */
export async function verifyPassphrase(
  passphrase: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  if (!passphrase || !storedHash || !storedSalt) return false;

  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    const iterations = parseInt(parts[1], 10) || PBKDF2_ITERATIONS;
    const expectedHash = parts[2];

    const salt = new Uint8Array(storedSalt.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      PBKDF2_KEY_LEN_BYTES * 8
    );

    const computedHash = Array.from(new Uint8Array(derivedBits), (b) =>
      b.toString(16).padStart(2, '0')
    ).join('');

    return timingSafeEqual(computedHash, expectedHash);
  }

  // Legacy fallback: single-round SHA-256
  const enc = new TextEncoder();
  const data = enc.encode(`${passphrase}:${storedSalt}`);
  const digestBuffer = await crypto.subtle.digest('SHA-256', data);
  const computedHash = Array.from(new Uint8Array(digestBuffer), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

  return timingSafeEqual(computedHash, storedHash);
}
