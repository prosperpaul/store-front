import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { requireSeller } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { money } from '@/lib/format'
import { storefrontUrl } from '@/lib/site'
import { ShareLink } from './share-link'
import { setProductStatus } from './products/actions'
import type { Product } from '@/lib/types'

export const metadata: Metadata = { title: 'Your items' }

const STATUS_LABEL: Record<Product['status'], string> = {
  available: 'Available',
  sold: 'Sold',
  hidden: 'Hidden',
}

export default async function DashboardPage() {
  const { seller } = await requireSeller()

  const supabase = await createClient()
  const [{ data }, { data: waiting }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false }),
    // Who's waiting on what, so a sold item can show its own demand.
    supabase
      .from('waitlist')
      .select('product_id')
      .eq('seller_id', seller.id)
      .is('notified_at', null),
  ])

  const products = (data ?? []) as Product[]

  const waitingCounts = new Map<string, number>()
  for (const row of (waiting ?? []) as { product_id: string | null }[]) {
    if (!row.product_id) continue
    waitingCounts.set(row.product_id, (waitingCounts.get(row.product_id) ?? 0) + 1)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Your items</h1>
        <Link href="/dashboard/products/new" className="btn-primary">
          Add item
        </Link>
      </div>

      <ShareLink
        url={storefrontUrl(seller.slug)}
        storeName={seller.business_name}
      />

      {products.length === 0 ? (
        <div className="card px-5 py-10 text-center">
          <p className="mb-1 font-semibold">No items yet</p>
          <p className="mb-6 text-muted">
            Add your first item and your storefront is ready to share.
          </p>
          <Link href="/dashboard/products/new" className="btn-primary">
            Add my first item
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((product) => (
            <li key={product.id} className="card-soft flex gap-3 p-3">
              <Link
                href={`/dashboard/products/${product.id}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-line bg-surface"
              >
                {product.photos[0] ? (
                  <Image
                    src={product.photos[0]}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-muted">
                    No photo
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="block truncate font-bold"
                >
                  {product.name}
                </Link>
                <p className="font-bold text-brand">
                  {money(Number(product.price))}
                  {product.size && (
                    <span className="font-medium text-muted"> · {product.size}</span>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`badge ${
                      product.status === 'available'
                        ? 'bg-brand text-brand-ink'
                        : 'bg-surface text-muted'
                    }`}
                  >
                    {STATUS_LABEL[product.status]}
                  </span>
                  {waitingCounts.has(product.id) && (
                    // Demand, shown where restocking decisions get made.
                    <span className="badge bg-accent text-accent-ink">
                      {waitingCounts.get(product.id)} waiting
                    </span>
                  )}
                </p>
              </div>

              <form action={setProductStatus} className="flex shrink-0 items-center">
                <input type="hidden" name="id" value={product.id} />
                <input
                  type="hidden"
                  name="status"
                  value={product.status === 'sold' ? 'available' : 'sold'}
                />
                <button type="submit" className="btn-quiet">
                  {product.status === 'sold' ? 'Relist' : 'Mark sold'}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
