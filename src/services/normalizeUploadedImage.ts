import heic2any from 'heic2any'

function looksLikeHeic(file: File): boolean {
  const t = file.type.toLowerCase()
  if (t === 'image/heic' || t === 'image/heif') return true
  return /\.(heic|heif)$/i.test(file.name)
}

/**
 * Turns HEIC/HEIF uploads into JPEG `File`s for canvas / react-easy-crop.
 */
export async function normalizeImageUploadFile(file: File): Promise<File> {
  if (!looksLikeHeic(file)) return file

  try {
    const out = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    })
    const blob = Array.isArray(out) ? out[0]! : out
    const base = file.name.replace(/\.(heic|heif)$/i, '') || 'photo'
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
  } catch {
    throw new Error('HEIC_CONVERT')
  }
}
