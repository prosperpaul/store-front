import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSellerBySlug, getStorefrontProduct } from '@/lib/storefront'
import { PENDING_ORDER_COOKIE } from '@/lib/orders'
import { orderMessage } from '@/lib/whatsapp'
import { CHANNELS, channelLink, isChannelId } from '@/lib/channels'
import { CopyMessage } from './copy-message'
import { money } from '@/lib/format'
import { OpenWhatsApp } from './open-whatsapp'

export const metadata: Metadata = { title: 'Order sent', robots: { index: false } }

export default async function OrderedPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>
}) {
  const { slug, productId } = await params

  const seller = await getSellerBySlug(slug)
  if (!seller) notFound()

  const product = await getStorefrontProduct(seller.id, productId)
  if (!product) notFound()

  // Falls back to a note-less WhatsApp link if the cookie has expired or
  // someone reaches this page directly -- they still get a working chat.
  const cookieStore = await cookies()
  const raw = cookieStore.get(PENDING_ORDER_COOKIE)?.value

  let link = channelLink(seller, 'whatsapp', orderMessage(seller, product))
  let channel = CHANNELS.whatsapp
  let pasteMessage: string | null = null

  if (raw) {
    try {
      const pending = JSON.parse(raw) as {
        link?: string
        channel?: string
        message?: string | null
      }
      if (pending.link) link = pending.link
      if (pending.channel && isChannelId(pending.channel)) {
        channel = CHANNELS[pending.channel]
      }
      pasteMessage = pending.message ?? null
    } catch {
      // Malformed cookie: the WhatsApp fallback above still works.
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <div className="card bg-surface p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-line bg-brand text-2xl text-brand-ink">
          ✓
        </span>

        <h1 className="mt-4 text-2xl font-extrabold">
          {channel.prefills ? 'Order sent' : 'Order saved'}
        </h1>
        <p className="mt-2 font-medium text-muted">
          {channel.prefills
            ? `${channel.label} should be opening with your message to ${seller.business_name}. Press send there to confirm it.`
            : `${seller.business_name} has your order. ${channel.label} can't fill the message in for you, so paste this into the chat.`}
        </p>

        <p className="mt-4 rounded-xl border-2 border-line bg-background px-3.5 py-2.5 text-sm font-bold">
          {product.name} · {money(Number(product.price))}
        </p>

        {pasteMessage && <CopyMessage message={pasteMessage} />}

        <div className="mt-5">
          <OpenWhatsApp link={link} label={`Open ${channel.label}`} />
        </div>
      </div>

      {/* The way back in. Without this the buyer's journey just ends here. */}
      <div className="mt-6 flex flex-col gap-3">
        <Link href={`/${slug}`} className="btn-accent w-full">
          Keep shopping
        </Link>
        <Link href={`/${slug}/${product.id}`} className="btn-secondary w-full">
          Back to this item
        </Link>
      </div>
    </main>
  )
}
