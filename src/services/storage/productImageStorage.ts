import { supabase } from '../../lib/supabaseClient'

export const PRODUCT_IMAGES_BUCKET = 'product-images'

/** Public URL pattern for this project (object/public/{bucket}/...) */
export function getPublicObjectUrlForPath(storagePath: string): string {
  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(storagePath)
  return data.publicUrl
}

/** Match Supabase public URLs for our bucket; returns path inside bucket (no bucket prefix). */
export function tryParseProductImageStoragePath(
  url: string,
): string | null {
  const u = url.trim()
  if (!u || u.startsWith('data:')) return null

  try {
    const parsed = new URL(u)
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`
    const idx = parsed.pathname.indexOf(marker)
    if (idx === -1) return null
    const rest = parsed.pathname.slice(idx + marker.length)
    return decodeURIComponent(rest.replace(/^\/+/, '')) || null
  } catch {
    return null
  }
}

export function isManagedProductImageUrl(url: string): boolean {
  return tryParseProductImageStoragePath(url) != null
}

export function collectManagedPaths(
  urls: readonly string[],
): string[] {
  const paths: string[] = []
  for (const url of urls) {
    const p = tryParseProductImageStoragePath(url)
    if (p) paths.push(p)
  }
  return paths
}

export async function removeProductImageObjects(paths: string[]) {
  if (paths.length === 0) return { error: null as null }
  const unique = [...new Set(paths)]
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(unique)
  return { error }
}

function sanitizeFolderSegment(raw: string): string {
  const t = raw.trim() || 'pending'
  return t.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80) || 'pending'
}

export function buildProductImageObjectPath(productKey: string): string {
  const folder = sanitizeFolderSegment(productKey)
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${folder}/${id}.jpg`
}

/**
 * Upload JPEG blob via XMLHttpRequest for upload progress (Supabase client upload has no progress).
 */
export async function uploadProductImageJpeg(
  blob: Blob,
  productKey: string,
  onProgress?: (percent: number) => void,
): Promise<{ publicUrl: string; path: string }> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!baseUrl || !anonKey) {
    throw new Error('Supabase is not configured.')
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not signed in. Sign in as an admin to upload photos.')
  }

  const path = buildProductImageObjectPath(productKey)
  const encodedPath = path
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')
  const endpoint = `${baseUrl.replace(/\/$/, '')}/storage/v1/object/${PRODUCT_IMAGES_BUCKET}/${encodedPath}`

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint)
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
    xhr.setRequestHeader('apikey', anonKey)
    xhr.setRequestHeader('Content-Type', 'image/jpeg')
    xhr.setRequestHeader('x-upsert', 'false')
    onProgress?.(0)
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        const pct = Math.round((ev.loaded / Math.max(ev.total, 1)) * 100)
        onProgress(Math.min(100, pct))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else {
        let msg = `Upload failed (${xhr.status})`
        try {
          const j = JSON.parse(xhr.responseText) as { message?: string }
          if (j.message) msg = j.message
        } catch {
          /* ignore */
        }
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(blob)
  })

  if (onProgress) onProgress(100)
  return { publicUrl: getPublicObjectUrlForPath(path), path }
}
