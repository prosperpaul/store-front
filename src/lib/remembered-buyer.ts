'use client'

import { useSyncExternalStore } from 'react'

/**
 * A buyer's details, kept in their own browser so a second order -- or a
 * "tell me when similar arrives" -- doesn't ask them to type it all again.
 *
 * Never leaves the device except as a normal form submission.
 */
const STORAGE_KEY = 'ss-buyer'

export type RememberedBuyer = { name?: string; phone?: string }

const NOBODY: RememberedBuyer = {}

// useSyncExternalStore demands a referentially stable snapshot, so the parsed
// value is cached and only rebuilt when the raw string actually changes.
let cachedRaw: string | null = null
let cachedBuyer: RememberedBuyer = NOBODY

function getSnapshot(): RememberedBuyer {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== cachedRaw) {
      cachedRaw = raw
      cachedBuyer = raw ? (JSON.parse(raw) as RememberedBuyer) : NOBODY
    }
    return cachedBuyer
  } catch {
    // Private mode, blocked storage, or corrupt JSON -- just ask again.
    return NOBODY
  }
}

/** There is no localStorage while server rendering, so nobody is remembered. */
function getServerSnapshot(): RememberedBuyer {
  return NOBODY
}

function subscribe(onChange: () => void) {
  // Only fires for changes made in other tabs, which is enough: these forms
  // never write to storage while they're on screen.
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

export function useRememberedBuyer(): RememberedBuyer {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Remember them at the moment they act -- the only point where we know the
 * details are ones they stand behind.
 */
export function rememberBuyer(formData: FormData): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: String(formData.get('name') ?? ''),
        phone: String(formData.get('phone') ?? ''),
      })
    )
  } catch {
    // Remembering is a convenience, not a requirement.
  }
}
