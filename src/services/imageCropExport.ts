import type { Area } from 'react-easy-crop'

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('LOAD'))
    if (/^https?:\/\//.test(src)) {
      img.crossOrigin = 'anonymous'
    }
    img.src = src
  })
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('TO_BLOB_FAIL'))
      },
      'image/jpeg',
      quality,
    )
  })
}

/**
 * Rasterize crop from source (blob URL / remote URL) → JPEG Blob,
 * enforcing a max longest edge after crop (resize). No base64.
 */
export async function exportCropToJpegBlob(
  imageSrc: string,
  croppedAreaPixels: Area,
  maxOutputEdge = 1400,
  quality = 0.82,
): Promise<Blob> {
  const img = await loadImage(imageSrc)
  let sx = Math.round(croppedAreaPixels.x)
  let sy = Math.round(croppedAreaPixels.y)
  let sw = Math.round(croppedAreaPixels.width)
  let sh = Math.round(croppedAreaPixels.height)

  sx = Math.max(0, Math.min(img.naturalWidth - 1, sx))
  sy = Math.max(0, Math.min(img.naturalHeight - 1, sy))
  sw = Math.max(1, Math.min(img.naturalWidth - sx, sw))
  sh = Math.max(1, Math.min(img.naturalHeight - sy, sh))

  let outW = sw
  let outH = sh
  const longest = Math.max(outW, outH)
  if (longest > maxOutputEdge) {
    const scale = maxOutputEdge / longest
    outW = Math.max(1, Math.round(outW * scale))
    outH = Math.max(1, Math.round(outH * scale))
  }

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CANVAS_CTX')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)

  try {
    return await canvasToJpegBlob(canvas, quality)
  } catch {
    throw new Error('CANVAS_TAINT_OR_EXPORT_FAIL')
  }
}

/** Full-frame resize when crop pixels aren't available yet (fallback). */
export async function exportWholeImageScaledToJpegBlob(
  imageSrc: string,
  maxOutputEdge = 1400,
  quality = 0.82,
): Promise<Blob> {
  const img = await loadImage(imageSrc)
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w < 1 || h < 1) throw new Error('INVALID_NATURAL')

  const longest = Math.max(w, h)
  if (longest > maxOutputEdge) {
    const scale = maxOutputEdge / longest
    w = Math.max(1, Math.round(w * scale))
    h = Math.max(1, Math.round(h * scale))
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CANVAS_CTX')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h)

  try {
    return await canvasToJpegBlob(canvas, quality)
  } catch {
    throw new Error('CANVAS_TAINT_OR_EXPORT_FAIL')
  }
}

/**
 * Extra pass: re-encode JPEG to tighten file size (same dimensions cap).
 */
export async function recompressJpegBlob(
  blob: Blob,
  maxOutputEdge = 1600,
  quality = 0.78,
): Promise<Blob> {
  const url = URL.createObjectURL(blob)
  try {
    return await exportWholeImageScaledToJpegBlob(url, maxOutputEdge, quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
