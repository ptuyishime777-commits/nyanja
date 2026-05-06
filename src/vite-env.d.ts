/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare global {
  interface Window {
    /** Set by inline script in index.html — holds the deferred Chromium install prompt. */
    __NYANJA_BIP__?: Event | null
  }

  /** Inline script dispatch when the deferred Chromium install prompt is stored. */
  interface WindowEventMap {
    'nyanja:bip': Event
    'nyanja:installed': Event
  }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}
