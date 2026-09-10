'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { PENDING_ORDER_COOKIE } from '@/lib/orders'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSellerBySlug, getStorefrontProduct } from '@/lib/storefront'
import { isPlausiblePhone, normalisePhone } from '@/lib/format'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { orderMessage } from '@/lib/whatsapp'
import { CHANNELS, channelLink, isChannelId, type ChannelId } from '@/lib/channels'

export type OrderState = { error?: string }

/** Ignore a second submit of the same item by the same buyer within this window. */
const DOUBLE_TAP_WINDOW_MS = 2 * 60 * 1000

const MAX_NOTE = 300

/**
 * Records the buyer, records the order, then hands off to WhatsApp.
 *
 * This is the only public entry point that uses the service-role key, because
 * buyers are never logged in and RLS blocks anonymous writes. So nothing here
 * trusts the form for anything that matters: the seller comes from the slug,
 * the product is re-read from the storefront (which still goes through RLS,
 * so a hidden item can't be ordered), and seller_id is taken from those --
 * never from the submitted data.
 */
export async function placeOrder(
  _prev: OrderState,
  formData: FormData
): Promise<OrderState> {
  const slug = String(formData.get('slug') ?? '')
  const productId = String(formData.get('product_id') ?? '')
  const rawPhone = String(formData.get('phone') ?? '')
  const name = String(formData.get('name') ?? '').trim().slice(0, 60)
  const note = String(formData.get('note') ?? '').trim().slice(0, MAX_NOTE)

  const requested = String(formData.get('via') ?? 'whatsapp')
  const channel: ChannelId = isChannelId(requested) ? requested : 'whatsapp'

  const phone = normalisePhone(rawPhone)
  if (!isPlausiblePhone(phone)) {
    return { error: 'Enter a WhatsApp number we can reach you on, e.g. 0801 234 5678.' }
  }

  // This writes with the service role key, so it's the one door worth
  // watching. A real buyer orders a handful of times an hour at most.
  const limit = rateLimit(await clientKey('order'), 10, 60 * 60 * 1000)
  if (!limit.allowed) {
    return { error: 'Too many orders from this device. Please try again later.' }
  }

  const seller = await getSellerBySlug(slug)
  if (!seller) return { error: 'This store is no longer available.' }

  const product = await getStorefrontProduct(seller.id, productId)
  if (!product) return { error: 'This item is no longer available.' }
  if (product.status !== 'available') {
    return { error: 'Sorry -- this one has just been sold.' }
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  // ---- the customer: the whole point of the product ----
  const { data: existing } = await admin
    .from('customers')
    .select('id, name')
    .eq('seller_id', seller.id)
    .eq('phone', phone)
    .maybeSingle()

  let customerId: string

  if (existing) {
    customerId = existing.id
    await admin
      .from('customers')
      // opted_out is deliberately never written here. Someone who asked to
      // stop being messaged stays opted out even if they order again.
      .update({ name: name || existing.name, last_order_at: now })
      .eq('id', existing.id)
  } else {
    const { data: created, error } = await admin
      .from('customers')
      .insert({
        seller_id: seller.id,
        phone,
        name: name || null,
        last_order_at: now,
      })
      .select('id')
      .single()

    if (error || !created) {
      return { error: 'Could not save your order. Please try again.' }
    }
    customerId = created.id
  }

  // ---- the order ----
  // Buyers double-tap on slow connections; don't log that as two orders.
  const since = new Date(Date.now() - DOUBLE_TAP_WINDOW_MS).toISOString()
  const { data: recent } = await admin
    .from('orders')
    .select('id')
    .eq('customer_id', customerId)
    .eq('product_id', product.id)
    .gte('created_at', since)
    .maybeSingle()

  if (!recent) {
    await admin.from('orders').insert({
      seller_id: seller.id,
      product_id: product.id,
      customer_id: customerId,
      note: note || null,
      // Records where her customers actually are, which she'd otherwise be
      // guessing at.
      channel,
    })
  }

  // Hand the finished link to the confirmation page in a short-lived cookie
  // rather than the URL -- the buyer's note can be long, and it has no
  // business sitting in their address bar or browser history.
  const message = orderMessage(seller, product, note || null)

  const cookieStore = await cookies()
  cookieStore.set(
    PENDING_ORDER_COOKIE,
    JSON.stringify({
      link: channelLink(seller, channel, message),
      channel,
      // Instagram, Messenger and Telegram open an empty box, so the
      // confirmation page offers this text to copy instead.
      message: CHANNELS[channel].prefills ? null : message,
    }),
    { maxAge: 300, httpOnly: true, sameSite: 'lax', path: '/' }
  )

  // Land them on our own page, which then opens the chat. Redirecting
  // straight out left them with nothing to come back to.
  redirect(`/${slug}/${product.id}/ordered`)
}
