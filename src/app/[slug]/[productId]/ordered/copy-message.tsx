'use client'

import { useState } from 'react'

/**
 * Instagram, Messenger and Telegram open an empty message box -- none of them
 * allow a link to fill one in. Rather than leave the buyer to describe the
 * order from memory, hand them the text and a button to copy it.
 */
export function CopyMessage({ message }: { message: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Blocked on insecure origins and in some in-app browsers. The text is
      // on screen either way, so it can still be selected by hand.
      setCopied(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl border-2 border-line bg-background p-3 text-left">
      <p className="whitespace-pre-line text-sm">{message}</p>
      <button type="button" onClick={copy} className="btn-secondary mt-3 w-full">
        {copied ? 'Copied' : 'Copy this message'}
      </button>
    </div>
  )
}
