'use server'

import { revalidatePath } from 'next/cache'
import { requireSeller } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Marks a customer as not to be messaged, or lets them back in.
 *
 * Buyers ask to stop inside WhatsApp, where we can't see it, so the seller
 * records it here. Everything in the broadcast composer reads this flag.
 */
export async function setOptedOut(formData: FormData) {
  const { seller } = await requireSeller()

  const id = String(formData.get('id') ?? '')
  const optedOut = String(formData.get('opted_out') ?? '') === 'true'
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from('customers')
    .update({ opted_out: optedOut })
    .eq('id', id)
    .eq('seller_id', seller.id)

  revalidatePath('/dashboard/customers')
}
