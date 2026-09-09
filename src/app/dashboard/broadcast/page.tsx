import type { Metadata } from 'next'
import { requireSeller } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { storefrontUrl } from '@/lib/site'
import { shortDate } from '@/lib/format'
import { BroadcastComposer } from './composer'
import type { Product } from '@/lib/types'

export const metadata: Metadata = { title: 'Announce a drop' }

type PastBroadcast = {
  id: string
  message: string
  recipient_count: number
  created_at: string
}

export default async function BroadcastPage() {
  const { seller } = await requireSeller()
  const supabase = await createClient()

  const [{ data: products }, { data: past }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('seller_id', seller.id)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('broadcasts')
      .select('id, message, recipient_count, created_at')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const previous = (past ?? []) as PastBroadcast[]

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-6">
      <h1 className="text-3xl font-extrabold">Announce a drop</h1>
      <p className="mt-1 text-muted">
        Tell the right people what just landed, instead of blasting everyone.
      </p>

      <BroadcastComposer
        products={(products ?? []) as Product[]}
        storeName={seller.business_name}
        storeUrl={storefrontUrl(seller.slug)}
      />

      {previous.length > 0 && (
        <section className="mt-10 border-t-2 border-line-soft pt-6">
          <h2 className="mb-3 font-semibold">Recent drops</h2>
          <ul className="flex flex-col gap-2">
            {previous.map((broadcast) => (
              <li key={broadcast.id} className="card-soft p-3">
                <p className="text-sm text-muted">
                  {shortDate(broadcast.created_at)} · sent to{' '}
                  {broadcast.recipient_count}
                </p>
                <p className="mt-1 line-clamp-2 text-sm">{broadcast.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
