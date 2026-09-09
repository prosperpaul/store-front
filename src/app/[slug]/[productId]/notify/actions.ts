'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSellerBySlug, getStorefrontProduct } from '@/lib/storefront'
import { isPlausiblePhone, normalisePhone } from '@/lib/format'

export type NotifyState = { error?: string; done?: boolean }

/**
 * Puts a buyer on the waitlist for a sold item.
 *
 * Same shape as placeOrder: service role, because buyers aren't logged in,
 * and so nothing from the form is trusted for anything that matters.
 *
 * Unlike an order this does NOT hand off to WhatsApp -- there's nothing for
 * the seller to confirm yet. The buyer stays on the page and gets told
 * they'll hear when something similar lands.
 */
export async function joinWaitlist(
  _prev: NotifyState,
  formData: FormData
): Promise<NotifyState> {
  const slug = String(formData.get('slug') ?? '')
  const productId = String(formData.get('product_id') ?? '')
  const rawPhone = String(formData.get('phone') ?? '')
  const name = String(formData.get('name') ?? '').trim().slice(0, 60)

  const phone = normalisePhone(rawPhone)
  if (!isPlausiblePhone(phone)) {
    return { error: 'Enter a WhatsApp number we can reach you on, e.g. 0801 234 5678.' }
  }

  const seller = await getSellerBySlug(slug)
  if (!seller) return { error: 'This store is no longer available.' }

  const product = await getStorefrontProduct(seller.id, productId)
  if (!product) return { error: 'This item is no longer available.' }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('customers')
    .select('id, name, opted_out')
    .eq('seller_id', seller.id)
    .eq('phone', phone)
    .maybeSingle()

  let customerId: string

  if (existing) {
    customerId = existing.id
    // Asking to be told about new stock is itself a request to be contacted,
    // so it clears a previous opt-out -- but only because they just asked.
    await admin
      .from('customers')
      .update({ name: name || existing.name, opted_out: false })
      .eq('id', existing.id)
  } else {
    const { data: created, error } = await admin
      .from('customers')
      .insert({ seller_id: seller.id, phone, name: name || null })
      .select('id')
      .single()

    if (error || !created) {
      return { error: 'Could not save that. Please try again.' }
    }
    customerId = created.id
  }

  // The table is unique on (product_id, customer_id), so asking twice is
  // harmless -- ignoreDuplicates turns the second ask into a no-op.
  const { error: waitlistError } = await admin
    .from('waitlist')
    .upsert(
      { seller_id: seller.id, product_id: product.id, customer_id: customerId },
      { onConflict: 'product_id,customer_id', ignoreDuplicates: true }
    )

  if (waitlistError) {
    return { error: 'Could not save that. Please try again.' }
  }

  return { done: true }
}
