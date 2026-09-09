import type { Metadata } from 'next'
import Image from 'next/image'
import { requireSeller } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { displayPhone, money, shortDate } from '@/lib/format'
import { StatusControl } from './status-control'
import type { OrderStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Orders' }

/** Shape of the joined row this page selects. */
type OrderRow = {
  id: string
  status: OrderStatus
  note: string | null
  created_at: string
  products: { name: string; price: number; photos: string[] } | null
  customers: { name: string | null; phone: string } | null
}

export default async function OrdersPage() {
  const { seller } = await requireSeller()

  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select(
      'id, status, note, created_at, products(name, price, photos), customers(name, phone)'
    )
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const orders = (data ?? []) as unknown as OrderRow[]

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-6">
      <h1 className="mb-5 text-3xl font-extrabold">Orders</h1>

      {orders.length === 0 ? (
        <div className="card px-5 py-10 text-center">
          <p className="mb-1 font-semibold">No orders yet</p>
          <p className="text-muted">
            When a buyer taps Order on your storefront, they land here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id} className="card-soft p-3">
              <div className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
                  {order.products?.photos?.[0] ? (
                    <Image
                      src={order.products.photos[0]}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[11px] text-muted">
                      No photo
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {/* The item can be deleted after the order was placed. */}
                    {order.products?.name ?? 'Item removed'}
                  </p>
                  {order.products && (
                    <p className="text-sm text-muted">
                      {money(Number(order.products.price))}
                    </p>
                  )}
                  <p className="mt-0.5 text-sm text-muted">
                    {shortDate(order.created_at)}
                  </p>
                </div>

                {order.customers && (
                  <a
                    href={`https://wa.me/${order.customers.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-quiet shrink-0 self-start"
                  >
                    Reply
                  </a>
                )}
              </div>

              <p className="mt-2 border-t-2 border-line-soft pt-2 text-sm">
                <span className="font-medium">
                  {order.customers?.name ?? 'Unknown buyer'}
                </span>
                {order.customers && (
                  <span className="text-muted">
                    {' '}
                    · {displayPhone(order.customers.phone)}
                  </span>
                )}
              </p>

              {order.note && (
                <p className="mt-1.5 rounded-xl bg-surface px-3 py-2 text-sm">
                  &ldquo;{order.note}&rdquo;
                </p>
              )}

              <div className="mt-2.5">
                <StatusControl orderId={order.id} status={order.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
