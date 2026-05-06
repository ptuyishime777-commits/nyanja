import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const rawAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSupabaseConfigured(): boolean {
  return Boolean(rawUrl?.trim() && rawAnon?.trim())
}

if (!isSupabaseConfigured()) {
  console.warn(
    '[Nyanja] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Configure .env for database access.',
  )
}

/**
 * Newer @supabase/supabase-js validates the URL and throws if it is empty.
 * When env is missing we still construct a client with inert placeholders so
 * the module loads; all real calls must be gated with `isSupabaseConfigured()`.
 */
const url = isSupabaseConfigured() ? rawUrl!.trim() : 'http://127.0.0.1:1'
const anon = isSupabaseConfigured() ? rawAnon!.trim() : 'sb-placeholder-anon-key'

const configured = isSupabaseConfigured()

export const supabase: SupabaseClient = createClient(url, anon, {
  auth: {
    persistSession: configured,
    autoRefreshToken: configured,
    detectSessionInUrl: configured,
  },
})
