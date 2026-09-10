import { money } from '@/lib/format'
import { productUrl } from '@/lib/site'
import type { Product, Seller } from '@/lib/types'

/**
 * wa.me is the official click-to-chat format and works from the mobile app,
 * WhatsApp Web and the desktop app. The number must be full international
 * digits with no +, spaces or dashes -- which is what we store.
 */
function chatLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

/**
 * The order message a buyer sends. It has to survive being read by a busy
 * seller in a crowded inbox, so it leads with the item, states the price
 * back, and carries the link she can open to see exactly which one it is.
 */
export function orderMessage(
  seller: Seller,
  product: Product,
  note?: string | null
): string {
  const size = product.size ? ` (${product.size})` : ''

  const lines = [
    `Hi ${seller.business_name}, I'd like to order:`,
    '',
    `${product.name}${size} - ${money(Number(product.price))}`,
  ]

  if (note) lines.push('', note)

  // The link goes last, introduced by text ending in a space.
  //
  // Line breaks don't reliably survive into the WhatsApp message, and when
  // they vanish whatever follows the URL gets swallowed into it -- a buyer's
  // note turned a working link into a 404. Nothing follows it now, and the
  // space before it survives even if the newline doesn't.
  lines.push('', `See it here: ${productUrl(seller.slug, product.id)}`)

  return lines.join('\n')
}

export function orderLink(
  seller: Seller,
  product: Product,
  note?: string | null
): string {
  return chatLink(seller.whatsapp, orderMessage(seller, product, note))
}

/**
 * For an item that's already gone. Keeps the seller in the conversation
 * instead of losing the buyer at a dead end.
 */
export function similarItemLink(seller: Seller, product: Product): string {
  const category = product.category ? ` ${product.category.toLowerCase()}` : ''

  return chatLink(
    seller.whatsapp,
    `Hi ${seller.business_name}, I saw "${product.name}" is sold. Do you have similar${category} in stock?`
  )
}

/** Plain "talk to the shop" link used in the storefront header. */
export function storeChatLink(seller: Seller): string {
  return chatLink(seller.whatsapp, `Hi ${seller.business_name}, I have a question about your store.`)
}
