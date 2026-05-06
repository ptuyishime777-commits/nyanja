import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Cropper from 'react-easy-crop'
import type { Area, MediaSize } from 'react-easy-crop'
import {
  exportCropToJpegBlob,
  exportWholeImageScaledToJpegBlob,
} from '../../services/imageCropExport'
import { Button } from '../../widgets/Button'

export type AspectPreset =
  | 'shop'
  | 'square'
  | 'portrait'
  | 'banner'
  | 'original'

const PRESET_BTN: {
  key: AspectPreset
  label: string
  ratio: number | null
}[] = [
  { key: 'shop', label: '4:5 (shop)', ratio: 4 / 5 },
  { key: 'square', label: '1:1', ratio: 1 },
  { key: 'portrait', label: '3:4', ratio: 3 / 4 },
  { key: 'banner', label: '16:9', ratio: 16 / 9 },
  { key: 'original', label: 'Photo shape', ratio: null },
]

type Props = {
  file: File
  onCancel: () => void
  /** JPEG Blob from canvas (never base64). May be async (e.g. upload). */
  onComplete: (jpegBlob: Blob) => void | Promise<void>
  /** Optional queue label: "Photo 2 of 3" */
  progress?: { current: number; total: number }
  /** When parent is uploading to storage (0–100); shows after crop export. */
  uploadProgressPct?: number | null
}

export function ProductImageCropDialog({
  file,
  onCancel,
  onComplete,
  progress,
  uploadProgressPct,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation] = useState(0)

  const [naturalAspect, setNaturalAspect] = useState<number>(4 / 5)

  const [preset, setPreset] = useState<AspectPreset>('shop')
  const aspect =
    preset === 'original'
      ? naturalAspect
      : (PRESET_BTN.find((p) => p.key === preset)?.ratio ?? 4 / 5)

  const [croppedPx, setCroppedPx] = useState<Area | null>(null)
  const [maxEdge, setMaxEdge] = useState(1400)
  const [busy, setBusy] = useState(false)

  /** Lock scroll under crop overlay (mounted in document.body). */
  useEffect(() => {
    if (typeof document === 'undefined') return
    const body = document.body
    if (!body) return
    const prev = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const u = URL.createObjectURL(file)
    setPreviewUrl(u)
    return () => {
      URL.revokeObjectURL(u)
    }
  }, [file])

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedPx(croppedAreaPixels)
  }, [])

  const syncPixels = useCallback((_: Area, pixels: Area) => {
    setCroppedPx(pixels)
  }, [])

  const onMediaLoaded = useCallback((ms: MediaSize) => {
    const a = ms.naturalWidth / ms.naturalHeight
    if (a > 0 && Number.isFinite(a)) {
      setNaturalAspect(a)
    }
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }, [preset])

  const apply = async () => {
    if (!previewUrl) {
      window.alert('Still loading… try again in a moment.')
      return
    }
    setBusy(true)
    try {
      let blob: Blob
      const croppedValid =
        croppedPx != null && croppedPx.width > 8 && croppedPx.height > 8
      try {
        if (croppedValid) {
          blob = await exportCropToJpegBlob(
            previewUrl,
            croppedPx,
            maxEdge,
          )
        } else {
          blob = await exportWholeImageScaledToJpegBlob(previewUrl, maxEdge)
        }
      } catch {
        blob = await exportWholeImageScaledToJpegBlob(previewUrl, maxEdge)
      }
      await Promise.resolve(onComplete(blob))
    } catch {
      window.alert(
        'Could not process this photo. Try JPG or PNG from your gallery.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (
    typeof document === 'undefined' ||
    !document.body ||
    !previewUrl
  ) {
    return null
  }

  const portalTarget = document.body

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-ink/50 p-3 backdrop-blur-sm sm:items-center dark:bg-black/60">
      <div
        className="flex max-h-[min(640px,calc(100dvh-1.5rem))] w-full max-w-lg flex-col overflow-hidden rounded-[1.35rem] border border-ink/10 bg-surface shadow-2xl dark:border-cream/12 dark:bg-dark-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
        onWheelCapture={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-ink/10 px-4 py-3 dark:border-cream/10">
          {progress && progress.total > 0 ? (
            <p className="mb-2 rounded-lg bg-cream/50 px-2.5 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-deep dark:bg-dark-elevated dark:text-rose">
              Cropping photo {progress.current} of {progress.total}
            </p>
          ) : null}
          <h2 id="crop-title" className="font-display text-lg font-semibold text-ink dark:text-cream">
            Crop & size photo
          </h2>
          <p className="mt-0.5 text-xs text-muted dark:text-dark-muted">
            Drag the photo into place, zoom with slider or pinch/scroll, then confirm to add it to the product.
          </p>
        </header>

        {/** Explicit height avoids invisible crop area when nested layouts / Tailwind arbitrary min() behaves oddly */}
        <div
          className="relative shrink-0 border-b border-ink/8 bg-neutral-950 dark:border-cream/10"
          style={{
            height: 'min(380px, 56dvh)',
            width: '100%',
          }}
        >
          <Cropper
            image={previewUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            minZoom={1}
            maxZoom={10}
            showGrid={true}
            zoomWithScroll={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onCropAreaChange={syncPixels}
            onMediaLoaded={onMediaLoaded}
            cropShape="rect"
            objectFit="contain"
            restrictPosition={true}
            style={{
              containerStyle: {
                position: 'relative',
                width: '100%',
                height: '100%',
              },
              cropAreaStyle: {
                cursor: 'move',
              },
            }}
          />
        </div>

        <div className="max-h-[40vh] space-y-3 overflow-y-auto px-4 py-3">
          <div className="space-y-1.5">
            <label className="flex justify-between text-xs font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              <span>Zoom</span>
              <span aria-hidden>{Math.round(zoom * 100)}%</span>
            </label>
            <input
              type="range"
              aria-label="Zoom"
              min={1}
              max={10}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-rose-deep dark:accent-rose"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              Crop proportion
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESET_BTN.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    preset === p.key
                      ? 'bg-ink text-cream dark:bg-cream dark:text-ink'
                      : 'bg-cream/50 text-muted ring-1 ring-ink/10 dark:bg-dark-elevated dark:text-dark-muted dark:ring-cream/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex justify-between text-xs font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              <span>Max saved size, longer edge</span>
              <span>{maxEdge}px</span>
            </label>
            <input
              type="range"
              aria-label="Maximum export pixel size"
              min={480}
              max={2000}
              step={40}
              value={maxEdge}
              onChange={(e) => setMaxEdge(Number(e.target.value))}
              className="w-full accent-rose-deep dark:accent-rose"
            />
            <p className="text-[11px] text-muted dark:text-dark-muted">
              Smaller values keep uploads lighter. Images are compressed and sent
              to Supabase Storage, not stored as base64.
            </p>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap gap-2 border-t border-ink/10 bg-surface px-4 py-3 dark:border-cream/10 dark:bg-dark-surface">
          <Button type="button" variant="ghost" className="!min-h-11" onClick={onCancel} disabled={busy}>
            Discard photo
          </Button>
          <Button
            type="button"
            variant="primary"
            className="min-w-0 flex-1 !min-h-11"
            onClick={() => void apply()}
            disabled={busy}
          >
            {busy && uploadProgressPct != null && uploadProgressPct >= 0
              ? `Uploading… ${uploadProgressPct}%`
              : busy
                ? 'Processing…'
                : 'Confirm & add photo'}
          </Button>
        </footer>
      </div>
    </div>,
    portalTarget,
  )
}
