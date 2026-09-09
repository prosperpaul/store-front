'use server'

import { revalidatePath } from 'next/cache'
import { requireSeller } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type Recipient = { id: string; name: string | null; phone: string }

export type BroadcastState = {
  error?: string
  prepared?: {
    message: string
    productIds: string[]
    waitlistIds: string[]
    recipients: Recipient[]
  }
}

export type Audience = 'all' | 'waiting' | 'recent'

/** How far back "recent buyers" reaches. */
const RECENT_DAYS = 60

const MAX_MESSAGE = 1000

/**
 * Works out who should hear about a drop, and returns them for the seller to
 * send to. Nothing is sent from here: without the WhatsApp Business API we
 * can't message anyone on her behalf, so she taps through the list and each
 * tap opens WhatsApp with the message already typed.
 *
 * opted_out is honoured in every branch. That flag is the only thing standing
 * between this feature and the blind blasting it exists to replace.
 */
export async function buildBroadcast(
  _prev: BroadcastState,
  formData: FormData
): Promise<BroadcastState> {
  const { seller } = await requireSeller()

  const message = String(formData.get('message') ?? '').trim().slice(0, MAX_MESSAGE)
  const audience = String(formData.get('audience') ?? 'all') as Audience
  const productIds = formData.getAll('product_ids').map(String).filter(Boolean)

  if (!message) return { error: 'Write the message you want to send.' }

  const supabase = await createClient()

  if (audience === 'waiting') {
    if (productIds.length === 0) {
      return { error: 'Pick at least one item so we know who is waiting for it.' }
    }

    // Which categories is this drop in?
    const { data: chosen } = await supabase
      .from('products')
      .select('category')
      .eq('seller_id', seller.id)
      .in('id', productIds)

    const categories = new Set(
      (chosen ?? [])
        .map((p: { category: string | null }) => p.category?.toLowerCase())
        .filter(Boolean)
    )

    if (categories.size === 0) {
      return {
        error:
          'None of the chosen items have a category, so nobody can be matched. Add a category to the item first.',
      }
    }

    const { data: waiting } = await supabase
      .from('waitlist')
      .select('id, products(category), customers(id, name, phone, opted_out)')
      .eq('seller_id', seller.id)
      .is('notified_at', null)

    type WaitingRow = {
      id: string
      products: { category: string | null } | null
      customers: { id: string; name: string | null; phone: string; opted_out: boolean } | null
    }

    const matched = ((waiting ?? []) as unknown as WaitingRow[]).filter(
      (row) =>
        row.customers &&
        !row.customers.opted_out &&
        row.products?.category &&
        categories.has(row.products.category.toLowerCase())
    )

    return {
      prepared: {
        message,
        productIds,
        waitlistIds: matched.map((row) => row.id),
        recipients: dedupe(
          matched.map((row) => ({
            id: row.customers!.id,
            name: row.customers!.name,
            phone: row.customers!.phone,
          }))
        ),
      },
    }
  }

  let query = supabase
    .from('customers')
    .select('id, name, phone')
    .eq('seller_id', seller.id)
    .eq('opted_out', false)

  if (audience === 'recent') {
    const since = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString()
    query = query.gte('last_order_at', since)
  }

  const { data: customers, error } = await query.order('last_order_at', {
    ascending: false,
    nullsFirst: false,
  })

  if (error) return { error: error.message }

  return {
    prepared: {
      message,
      productIds,
      waitlistIds: [],
      recipients: (customers ?? []) as Recipient[],
    },
  }
}

/** One customer can be waiting on several items; only message them once. */
function dedupe(recipients: Recipient[]): Recipient[] {
  const seen = new Set<string>()
  return recipients.filter((recipient) => {
    if (seen.has(recipient.id)) return false
    seen.add(recipient.id)
    return true
  })
}

/**
 * Files the drop once the seller has worked through the list, so the next
 * broadcast doesn't pester the same waiting people again.
 */
export async function recordBroadcast(formData: FormData) {
  const { seller } = await requireSeller()

  const message = String(formData.get('message') ?? '').slice(0, MAX_MESSAGE)
  const recipientCount = Number(formData.get('recipient_count') ?? 0)

  let productIds: string[] = []
  let waitlistIds: string[] = []
  try {
    productIds = JSON.parse(String(formData.get('product_ids') ?? '[]'))
    waitlistIds = JSON.parse(String(formData.get('waitlist_ids') ?? '[]'))
  } catch {
    // Fall through with empty arrays -- the broadcast record still stands.
  }

  const supabase = await createClient()

  await supabase.from('broadcasts').insert({
    seller_id: seller.id,
    product_ids: productIds,
    message,
    recipient_count: Number.isFinite(recipientCount) ? recipientCount : 0,
  })

  if (waitlistIds.length) {
    await supabase
      .from('waitlist')
      .update({ notified_at: new Date().toISOString() })
      .eq('seller_id', seller.id)
      .in('id', waitlistIds)
  }

  revalidatePath('/dashboard/broadcast')
}
