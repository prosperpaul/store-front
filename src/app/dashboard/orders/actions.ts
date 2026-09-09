'use server'

import { revalidatePath } from 'next/cache'
import { requireSeller } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/lib/types'

const STATUSES: OrderStatus[] = [
  'new',
  'confirmed',
  'paid',
  'delivered',
  'cancelled',
]

/**
 * Moves an order along. Without this every order sat at "new" forever and the
 * list became useless the moment it got busy.
 */
export async function setOrderStatus(formData: FormData) {
  const { seller } = await requireSeller()

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '') as OrderStatus

  if (!id || !STATUSES.includes(status)) return

  const supabase = await createClient()
  await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .eq('seller_id', seller.id)

  revalidatePath('/dashboard/orders')
}
