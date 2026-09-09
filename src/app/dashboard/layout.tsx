import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from './nav'

/**
 * /dashboard/setup lives under this layout too, so we only require a logged-in
 * user here -- not a finished store. Without a seller row we render the page
 * bare, otherwise setup would redirect to itself forever.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: seller } = await supabase
    .from('sellers')
    .select('slug, business_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!seller) return <>{children}</>

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b-2 border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-5 py-3.5">
          <Link
            href="/dashboard"
            className="truncate text-lg font-extrabold display"
          >
            {seller.business_name}
          </Link>
          {/*
            Same tab on purpose: juggling tabs on a phone is how you lose
            people. The owner bar on the storefront brings her back.
          */}
          <Link href={`/${seller.slug}`} className="btn-quiet shrink-0">
            View store
          </Link>
        </div>
      </header>

      {/* pb leaves room for the fixed bottom nav on phones */}
      <div className="flex-1 pb-24">{children}</div>

      <DashboardNav />
    </div>
  )
}
