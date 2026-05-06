/** Browser-local SHA-256 hex digest for demo accounts (not a substitute for server-side auth). */
export async function hashPassword(plain: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(plain),
  )
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(
  plain: string,
  storedHash: string,
): Promise<boolean> {
  const h = await hashPassword(plain)
  return h === storedHash
}
