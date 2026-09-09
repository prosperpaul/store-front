import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSellerBySlug, getStorefrontProduct } from '@/lib/storefront'
import { money } from '@/lib/format'
import { OrderForm } from './order-form'

export const revalidate = 3600

// A checkout step has no business in search results or link previews.
export const metadata: Metadata = { title: 'Your order', robots: { index: false } }

export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>
}) {
  const { slug, productId } = await params

  const seller = await getSellerBySlug(slug)
  if (!seller) notFound()

  const product = await getStorefrontProduct(seller.id, productId)
  if (!product) notFound()

  // Nothing to order on a sold item -- send them back to the item, which
  // offers to ask about something similar instead.
  if (product.status !== 'available') {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold">This one is sold</h1>
        <p className="mt-2 text-muted">
          It went while you were looking. {seller.business_name} may have
          something similar.
        </p>
        <Link href={`/${slug}/${product.id}`} className="btn-secondary mt-6 w-full">
          Back to the item
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <Link
        href={`/${slug}/${product.id}`}
        className="text-sm text-muted underline underline-offset-4"
      >
        &larr; Back to the item
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold">Almost there</h1>
      <p className="mt-1 text-muted">
        One detail, then WhatsApp opens with your order already typed.
      </p>

      <div className="card mt-5 flex items-center gap-3 p-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
          {product.photos[0] ? (
            <Image
              src={product.photos[0]}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-muted">
              No photo
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{product.name}</p>
          <p className="text-muted">
            {money(Number(product.price))}
            {product.size ? ` · ${product.size}` : ''}
          </p>
        </div>
      </div>

      <OrderForm
        slug={slug}
        productId={product.id}
        sellerName={seller.business_name}
      />
    </main>
  )
}
