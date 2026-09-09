'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'product-photos'
const MAX_PHOTOS = 5
const MAX_EDGE = 1400 // px on the longest side
const QUALITY = 0.82

/**
 * Shrinks a photo in the browser before upload. A phone camera JPEG is often
 * 4-8 MB; sellers pay for that data and wait for it on 3G. This gets a listing
 * photo down to roughly 200-400 KB with no visible loss at storefront size.
 */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))

  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  )

  // If the browser refused, or shrinking somehow made it bigger, keep the original.
  return blob && blob.size < file.size ? blob : file
}

export function PhotoUploader({
  userId,
  initialPhotos,
}: {
  userId: string
  initialPhotos: string[]
}) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    // Let the same file be picked again after a remove.
    event.target.value = ''

    const room = MAX_PHOTOS - photos.length
    if (room <= 0) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`)
      return
    }

    setBusy(true)
    setError(null)

    const supabase = createClient()
    const uploaded: string[] = []

    for (const file of files.slice(0, room)) {
      try {
        const blob = await downscale(file)
        // Storage RLS only allows writes inside a folder named for the user id.
        const path = `${userId}/${crypto.randomUUID()}.jpg`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

        if (uploadError) {
          setError(uploadError.message)
          break
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(path)
        uploaded.push(publicUrl)
      } catch {
        setError("That photo couldn't be read. Try another one.")
      }
    }

    if (uploaded.length) setPhotos((current) => [...current, ...uploaded])
    setBusy(false)
  }

  function remove(url: string) {
    // Only dropped from the listing -- the file is cleaned up when the
    // product is deleted, so a mis-tap here is recoverable.
    setPhotos((current) => current.filter((photo) => photo !== url))
  }

  return (
    <div>
      <span className="label">Photos</span>

      <input type="hidden" name="photos" value={JSON.stringify(photos)} />

      {photos.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2">
          {photos.map((url, index) => (
            <li key={url} className="relative aspect-square">
              <Image
                src={url}
                alt={`Photo ${index + 1}`}
                fill
                sizes="33vw"
                className="rounded-xl border-2 border-line object-cover"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-sm text-background"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => inputRef.current?.click()}
        disabled={busy || photos.length >= MAX_PHOTOS}
      >
        {busy
          ? 'Uploading...'
          : photos.length
            ? 'Add another photo'
            : 'Add photos'}
      </button>

      {error && <p className="hint text-danger">{error}</p>}
      <p className="hint">
        First photo is the cover. Up to {MAX_PHOTOS}; they&rsquo;re shrunk before
        upload to save your data.
      </p>
    </div>
  )
}
