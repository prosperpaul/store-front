'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'

/**
 * A way back to the dashboard for a signed-in seller previewing her store.
 *
 * The check runs in the browser, on the presence of Supabase's auth cookie,
 * specifically so the storefront itself stays cacheable -- reading the session
 * on the server would make every buyer's visit dynamic, which is exactly the
 * cost we avoided in the first place.
 *
 * Buyers are never signed in, so they never see this.
 */
function subscribe() {
  // Nothing to listen to: a session doesn't change while a storefront is open.
  return () => {}
}

function getSnapshot(): boolean {
  try {
    return /(^|;\s*)sb-/.test(document.cookie)
  } catch {
    return false
  }
}

function getServerSnapshot(): boolean {
  return false
}

export function OwnerBar() {
  const signedIn = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!signedIn) return null

  return (
    <div className="border-b-2 border-line bg-brand text-brand-ink">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-5 py-2">
        <span className="text-sm font-bold">You&rsquo;re viewing your store</span>
        <Link href="/dashboard" className="shrink-0 text-sm font-bold">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
