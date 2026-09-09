'use client'

import { setOrderStatus } from './actions'
import type { OrderStatus } from '@/lib/types'

/**
 * The usual path is new -> confirmed -> paid -> delivered, so the next step
 * gets its own button. Everything else stays available in the menu, because
 * real orders don't always go in order.
 */
const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: 'confirmed', label: 'Confirm' },
  confirmed: { to: 'paid', label: 'Mark paid' },
  paid: { to: 'delivered', label: 'Mark delivered' },
}

const ALL: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'paid', label: 'Paid' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function StatusControl({
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus
}) {
  const next = NEXT_STEP[status]

  return (
    <div className="flex items-center gap-2">
      {next && (
        <form action={setOrderStatus}>
          <input type="hidden" name="id" value={orderId} />
          <input type="hidden" name="status" value={next.to} />
          <button type="submit" className="btn-quiet">
            {next.label}
          </button>
        </form>
      )}

      <form action={setOrderStatus} className="flex-1">
        <input type="hidden" name="id" value={orderId} />
        <select
          name="status"
          defaultValue={status}
          // Submits on change so there's no separate confirm tap.
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          aria-label="Order status"
          className="min-h-10 w-full rounded-lg border-2 border-line-soft bg-background px-2 text-sm font-bold"
        >
          {ALL.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </form>
    </div>
  )
}
