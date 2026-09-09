import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StoreForm } from './store-form'
import type { Seller } from '@/lib/types'

export const metadata: Metadata = { title: 'Set up your store' }

export default async function SetupPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Setup is a one-time step. Editing later happens at /dashboard/settings.
  if (seller) redirect('/dashboard/settings')

  return (
    <main className="mx-auto w-full max-w-md px-5 py-8">
      <h1 className="mb-1 text-3xl font-extrabold">Set up your store</h1>
      <p className="mb-6 text-muted">
        Four answers and your storefront is live.
      </p>
      <StoreForm seller={seller as Seller | null} userId={user.id} submitLabel="Create my store" />
    </main>
  )
}
