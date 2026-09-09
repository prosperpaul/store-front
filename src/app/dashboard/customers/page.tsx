import type { Metadata } from 'next'
import { requireSeller } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { displayPhone, shortDate } from '@/lib/format'
import { setOptedOut } from './actions'

export const metadata: Metadata = { title: 'Customers' }

type CustomerRow = {
  id: string
  name: string | null
  phone: string
  opted_out: boolean
  first_seen: string
  last_order_at: string | null
  orders: { count: number }[]
}

export default async function CustomersPage() {
  const { seller } = await requireSeller()

  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, name, phone, opted_out, first_seen, last_order_at, orders(count)')
    .eq('seller_id', seller.id)
    .order('last_order_at', { ascending: false, nullsFirst: false })
    .limit(200)

  const customers = (data ?? []) as unknown as CustomerRow[]
  const reachable = customers.filter((c) => !c.opted_out).length

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-6">
      <h1 className="text-3xl font-extrabold">Customers</h1>
      <p className="mb-5 mt-1 text-muted">
        {customers.length === 0
          ? 'Built automatically from your orders.'
          : `${reachable} you can message${
              customers.length - reachable > 0
                ? `, ${customers.length - reachable} opted out`
                : ''
            }.`}
      </p>

      {customers.length === 0 ? (
        <div className="card px-5 py-10 text-center">
          <p className="mb-1 font-semibold">No customers yet</p>
          <p className="text-muted">
            Every order adds the buyer here, so you can tell them about your
            next drop instead of blasting everyone.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {customers.map((customer) => {
            const orderCount = customer.orders?.[0]?.count ?? 0

            return (
              <li key={customer.id} className="card-soft p-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {customer.name ?? displayPhone(customer.phone)}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {customer.name ? `${displayPhone(customer.phone)} · ` : ''}
                      {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                      {customer.last_order_at
                        ? ` · ${shortDate(customer.last_order_at)}`
                        : ''}
                    </p>
                  </div>

                  {customer.opted_out && (
                    <span className="badge shrink-0 border-line-soft bg-surface text-muted">
                      Opted out
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex gap-2">
                  {!customer.opted_out && (
                    <a
                      href={`https://wa.me/${customer.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-quiet flex-1"
                    >
                      Message
                    </a>
                  )}

                  {/* Buyers ask to stop inside WhatsApp, so she records it here. */}
                  <form action={setOptedOut} className="flex-1">
                    <input type="hidden" name="id" value={customer.id} />
                    <input
                      type="hidden"
                      name="opted_out"
                      value={customer.opted_out ? 'false' : 'true'}
                    />
                    <button
                      type="submit"
                      className={`btn-quiet w-full ${
                        customer.opted_out ? '' : 'text-danger'
                      }`}
                    >
                      {customer.opted_out ? 'Allow messages' : 'Stop messaging'}
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
