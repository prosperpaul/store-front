'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

/**
 * Remembers who a seller has already messaged during a drop.
 *
 * Working through fifty recipients by hand takes a while, and a phone will
 * happily discard the tab behind WhatsApp. Without this she'd come back to a
 * blank list with no idea where she'd got to.
 */
const PREFIX = 'ss-drop:'

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function readRaw(key: string): string {
  try {
    return localStorage.getItem(PREFIX + key) ?? '[]'
  } catch {
    return '[]'
  }
}

/**
 * Identifies one drop by what it actually is -- these recipients, this
 * message -- so editing either starts a fresh count rather than inheriting
 * ticks from a different send.
 */
export function progressKey(productIds: string[], message: string): string {
  let hash = 0
  const seed = `${productIds.join(',')}|${message}`

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0 // keep it a 32-bit int
  }

  return Math.abs(hash).toString(36)
}

export function useSentProgress(key: string) {
  // The raw string is the snapshot: strings compare by value, so React sees a
  // stable value between renders without any caching of its own.
  const getSnapshot = useMemo(() => () => readRaw(key), [key])
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => '[]')

  const sent = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [raw])

  const markSent = useCallback(
    (id: string) => {
      try {
        const current = JSON.parse(readRaw(key)) as string[]
        if (current.includes(id)) return

        localStorage.setItem(PREFIX + key, JSON.stringify([...current, id]))
        emit()
      } catch {
        // Storage blocked -- ticks just won't persist. Sending still works.
      }
    },
    [key]
  )

  return { sent, markSent }
}
