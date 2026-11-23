export const ADMIN_GATE_COOKIE = 'eraiiz_admin_gate';

export function adminGateToken() {
  return String(process.env.ADMIN_GATE_TOKEN || '').trim();
}

/** Edge-safe constant-time string compare */
export function safeEqualString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

/**
 * Cookie value is a deterministic fingerprint of the gate token.
 * Uses a lightweight FNV-1a style mix + length salt so we don't need Node crypto in Edge middleware.
 */
export function fingerprintAdminGateToken(token: string) {
  const input = `eraiiz-admin-gate:v1:${token}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const prefix = (hash >>> 0).toString(16).padStart(8, '0');
  // Include enough of a scrambled token length marker to reduce trivial collisions
  let scramble = 0;
  for (let i = 0; i < token.length; i += 1) {
    scramble = (scramble * 33 + token.charCodeAt(i)) >>> 0;
  }
  return `${prefix}${scramble.toString(16).padStart(8, '0')}${token.length.toString(16).padStart(4, '0')}`;
}

export function expectedAdminGateCookie() {
  const token = adminGateToken();
  if (!token) return '';
  return fingerprintAdminGateToken(token);
}

export function hasValidAdminGateCookie(value?: string | null) {
  const expected = expectedAdminGateCookie();
  if (!expected || !value) return false;
  return safeEqualString(value, expected);
}
