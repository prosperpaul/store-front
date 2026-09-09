'use client'

import { useState } from 'react'

/**
 * The whole product depends on this link reaching an Instagram bio or a
 * WhatsApp status, so copying it is a first-class action rather than
 * something the seller has to select out of the address bar.
 */
export function ShareLink({ url, storeName }: { url: string; storeName: string }) {
  const [copied, setCopied] = useState(false)

  // Shown without the scheme -- shorter, and it's what she'd type anyway.
  const display = url.replace(/^https?:\/\//, '')

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard is blocked on insecure origins and some in-app browsers.
      // The link is on screen, so she can still select it by hand.
      setCopied(false)
    }
  }

  async function share() {
    // Android's share sheet: straight into WhatsApp, Instagram, anywhere.
    if (navigator.share) {
      try {
        await navigator.share({ title: storeName, url })
      } catch {
        // Cancelled -- nothing to do.
      }
      return
    }
    copy()
  }

  return (
    <div className="card mb-5 bg-surface p-4">
      <p className="text-sm font-bold uppercase tracking-wide text-muted">
        Your store link
      </p>
      <p className="mt-1 truncate text-lg font-extrabold display">{display}</p>

      <div className="mt-3.5 flex gap-2.5">
        <button type="button" onClick={copy} className="btn-secondary flex-1">
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button type="button" onClick={share} className="btn-accent flex-1">
          Share
        </button>
      </div>
    </div>
  )
}
