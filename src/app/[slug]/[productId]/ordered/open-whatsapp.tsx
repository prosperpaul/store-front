'use client'

import { useEffect } from 'react'

/**
 * Opens WhatsApp once, then gets out of the way.
 *
 * The guard matters: on some Android browsers, coming back from WhatsApp
 * re-runs the page instead of restoring it, and without this the buyer would
 * be thrown straight back into WhatsApp every time they tried to return --
 * trapped, unable to reach the store again.
 */
export function OpenWhatsApp({
  link,
  label = 'Open WhatsApp',
}: {
  link: string
  label?: string
}) {
  useEffect(() => {
    const key = `ss-opened:${link}`

    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // Storage blocked -- open once and rely on the button below afterwards.
    }

    window.location.href = link
  }, [link])

  // Always rendered, so there's a way through even if the hand-off is blocked.
  return (
    <a href={link} target="_blank" rel="noreferrer" className="btn-primary w-full">
      {label}
    </a>
  )
}
