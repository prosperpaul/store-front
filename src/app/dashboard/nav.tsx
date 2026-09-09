'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Thumb-reachable bottom bar -- sellers work one-handed on a phone.
 *
 * Icons carry as much of the meaning as the labels: five words at 12px is
 * hard to scan, and this has to be findable by someone who isn't hunting.
 */
const TABS = [
  {
    href: '/dashboard',
    label: 'Items',
    // Adding an item lives on the Items page itself, so it needs no tab.
    match: ['/dashboard', '/dashboard/products'],
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    href: '/dashboard/orders',
    label: 'Orders',
    match: ['/dashboard/orders'],
    icon: (
      <>
        <path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4Z" />
        <path d="M4 6h16" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
  },
  {
    href: '/dashboard/broadcast',
    label: 'Drops',
    match: ['/dashboard/broadcast'],
    icon: (
      <>
        <path d="m3 11 18-5v12L3 13v-2Z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </>
    ),
  },
  {
    href: '/dashboard/customers',
    label: 'People',
    match: ['/dashboard/customers'],
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    href: '/dashboard/settings',
    // "Settings" reads like preferences. This is where her business details
    // live, so it says so.
    label: 'My store',
    match: ['/dashboard/settings'],
    icon: (
      <>
        <path d="M3 9h18l-1.5-5.5a1 1 0 0 0-1-.75H5.5a1 1 0 0 0-1 .75Z" />
        <path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-2xl">
        {TABS.map((tab) => {
          const active = tab.match.some((prefix) =>
            prefix === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(prefix)
          )

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold sm:text-xs ${
                active ? 'text-foreground' : 'text-muted'
              }`}
            >
              {/* A painted bar rather than a colour change -- readable at a glance. */}
              {active && (
                <span className="absolute inset-x-3 top-0 h-1 rounded-b bg-brand" />
              )}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 2.5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-6 w-6"
              >
                {tab.icon}
              </svg>
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
