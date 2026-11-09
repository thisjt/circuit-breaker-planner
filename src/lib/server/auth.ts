/**
 * Cryptographic helpers for Cloudflare R2 Plan Author Edit Tokens & Passphrase Protection.
 * Runs in Cloudflare Workers / Node.js using the standard Web Crypto API.
 */

export function generateEditToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassphrase(
  passphrase: string,
  saltHex?: string
): Promise<{ hash: string; salt: string }> {
  const salt = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const saltStr = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');

  const enc = new TextEncoder();
  const data = enc.encode(`${passphrase}:${saltStr}`);
  const digestBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(digestBuffer), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

  return { hash, salt: saltStr };
}

export async function verifyPassphrase(
  passphrase: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  if (!passphrase || !storedHash || !storedSalt) return false;
  const { hash } = await hashPassphrase(passphrase, storedSalt);
  return hash === storedHash;
}

