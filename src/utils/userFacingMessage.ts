/**
 * Keep customer-facing copy short and non-technical; log diagnostics separately.
 */

const GENERIC_ORDER =
  'We could not complete your order. Please try again in a moment.'

export function friendlyCheckoutError(raw: string): string {
  const t = raw.trim()
  if (!t) return GENERIC_ORDER
  const low = t.toLowerCase()

  /* Known safe copy from app logic — show as returned */
  const allowPhrases = [
    'your bag is empty',
    'you must be signed in',
    'incorrect email',
    'password',
    'please confirm',
    'account is disabled',
    'checkout is unavailable',
    'supabase is not configured',
    'inventory',
    'stock',
    'left (you have',
    'no longer available',
    'one item in your bag',
  ]
  if (allowPhrases.some((k) => low.includes(k))) return t

  /* Hide infra / Postgres / RLS leakage */
  const hidePatterns = [
    'row-level security',
    'rls',
    'violates ',
    'constraint',
    'permission denied',
    'schema cache',
    'postgresql',
    'pgrst',
    'infinity recursion',
    'could not find the',
    'column of ',
    'invalid input syntax for type',
    '_fkey',
  ]
  if (hidePatterns.some((k) => low.includes(k))) return GENERIC_ORDER

  /* Very long strings are usually API dumps */
  if (t.length > 240) return GENERIC_ORDER

  return t
}

export function logDevOnly(label: string, detail: unknown) {
  if (!import.meta.env.DEV) return
  console.warn(`[Nyanja] ${label}`, detail)
}

/** Shown when auth session exists but profile rows did not sync (avoid raw API text). */
export const FRIENDLY_PROFILE_SYNC_FAIL =
  'We could not load your account. Please sign out and try signing in again.'
