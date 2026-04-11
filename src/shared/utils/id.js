/**
 * Generates a UUID v4.
 * crypto.randomUUID() requires a secure context (HTTPS), so it fails when
 * accessing the dev server via a LAN IP on mobile. This fallback uses
 * crypto.getRandomValues() which works in non-secure contexts too.
 */
export function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 UUID using getRandomValues (available in all contexts)
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const n = parseInt(c, 10);
    return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
  });
}
