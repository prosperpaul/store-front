'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { downscale, PHOTO_BUCKET } from '@/lib/image'

/** Logos display small, so they don't need listing-photo resolution. */
const LOGO_EDGE = 400

export function LogoUploader({
  userId,
  initialLogo,
  businessName,
}: {
  userId: string
  initialLogo: string | null
  businessName: string
}) {
  const [logo, setLogo] = useState<string | null>(initialLogo)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initial = businessName.trim().charAt(0).toUpperCase() || '?'

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setBusy(true)
    setError(null)

    try {
      const blob = await downscale(file, LOGO_EDGE)
      // Storage RLS only allows writes inside a folder named for the user id.
      const path = `${userId}/logo-${crypto.randomUUID()}.jpg`

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

      if (uploadError) {
        setError(uploadError.message)
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
        setLogo(publicUrl)
      }
    } catch {
      setError("That image couldn't be read. Try another one.")
    }

    setBusy(false)
  }

  return (
    <div>
      <span className="label">Logo</span>

      <input type="hidden" name="logo_url" value={logo ?? ''} />

      <div className="flex items-center gap-4">
        {logo ? (
          <Image
            src={logo}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full border-2 border-line object-cover"
          />
        ) : (
          // Same stamped initial the storefront falls back to, so she can see
          // exactly what buyers get if she skips this.
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-line bg-accent text-2xl font-extrabold text-accent-ink display">
            {initial}
          </span>
        )}

        <div className="flex flex-1 flex-col gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? 'Uploading...' : logo ? 'Change logo' : 'Add a logo'}
          </button>

          {logo && (
            <button
              type="button"
              className="btn-quiet"
              onClick={() => setLogo(null)}
              disabled={busy}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {error && <p className="hint text-danger">{error}</p>}
      <p className="hint">Optional. Without one we use your first letter.</p>
    </div>
  )
}
