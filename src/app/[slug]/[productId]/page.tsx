import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getSellerBySlug,
  getStorefrontProduct,
} from '@/lib/storefront'
import { money } from '@/lib/format'
import { productUrl } from '@/lib/site'
import { similarItemLink } from '@/lib/whatsapp'
import { availableChannels } from '@/lib/channels'
import { PhotoCarousel } from './photo-carousel'

export const revalidate = 3600

type ItemParams = { params: Promise<{ slug: string; productId: string }> }

/** Shared by the page and its metadata; cache() keeps it to one round trip. */
async function load(slug: string, productId: string) {
  const seller = await getSellerBySlug(slug)
  if (!seller) return null

  const product = await getStorefrontProduct(seller.id, productId)
  if (!product) return null

  return { seller, product }
}

export async function generateMetadata({ params }: ItemParams): Promise<Metadata> {
  const { slug, productId } = await params
  const found = await load(slug, productId)

  if (!found) return { title: 'Item not found' }

  const { seller, product } = found
  const title = `${product.name} - ${money(Number(product.price))}`
  const description =
    product.description ?? `Available from ${seller.business_name}. Order on WhatsApp.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: productUrl(slug, product.id),
      type: 'website',
      // The photo is what sells the item in a WhatsApp link preview.
      images: product.photos.length ? [product.photos[0]] : undefined,
    },
  }
}

export default async function ProductPage({ params }: ItemParams) {
  const { slug, productId } = await params
  const found = await load(slug, productId)

  if (!found) notFound()

  const { seller, product } = found
  const sold = product.status === 'sold'

  // WhatsApp is the headline button; the rest sit under it.
  const others = availableChannels(seller).filter((c) => c.id !== 'whatsapp')

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-6">
      <Link href={`/${slug}`} className="text-sm text-muted underline underline-offset-4">
        &larr; All items
      </Link>

      {product.photos.length > 0 ? (
        <PhotoCarousel photos={product.photos} name={product.name} />
      ) : (
        <div className="mt-4 flex aspect-square items-center justify-center rounded-2xl border-2 border-line bg-surface font-medium text-muted">
          No photo
        </div>
      )}

      <div className="mt-6">
        <h1 className="text-3xl font-extrabold leading-tight">{product.name}</h1>

        <p className="mt-2 inline-block rounded-xl border-2 border-line bg-accent px-3 py-1 text-xl font-extrabold text-accent-ink">
          {money(Number(product.price))}
        </p>

        {(product.size || product.category) && (
          <p className="mt-3 font-medium text-muted">
            {[product.size, product.category].filter(Boolean).join(' · ')}
          </p>
        )}

        {sold && (
          <p className="mt-4 rounded-xl border-2 border-line bg-surface px-3.5 py-2.5 font-bold">
            This one is sold.
          </p>
        )}

        {product.description && (
          <p className="mt-4 whitespace-pre-line leading-relaxed">
            {product.description}
          </p>
        )}

        {seller.delivery_note && (
          <p className="mt-5 rounded-xl border-2 border-line-soft bg-surface px-3.5 py-2.5 text-sm font-medium">
            {seller.delivery_note}
          </p>
        )}
      </div>

      {/*
        Sticky so the order button is always under the buyer's thumb, however
        far down the description they've scrolled.
      */}
      <div className="sticky bottom-0 -mx-5 mt-8 border-t-2 border-line bg-background/95 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
        {sold ? (
          // Waitlist first: it's the one that keeps paying off after today.
          <div className="flex flex-col gap-2">
            <Link
              href={`/${slug}/${product.id}/notify`}
              className="btn-primary w-full"
            >
              Tell me when it&rsquo;s back
            </Link>
            <a
              href={similarItemLink(seller, product)}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full"
            >
              Ask for something similar
            </a>
          </div>
        ) : (
          <>
            <Link
              href={`/${slug}/${product.id}/order`}
              className="btn-primary w-full"
            >
              Order on WhatsApp
            </Link>

            {/*
              A buyer who came from Instagram would rather answer there. Each
              of these records the same order -- only the last hop differs.
            */}
            {others.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-center text-sm font-medium text-muted">
                  or order through
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {others.map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/${slug}/${product.id}/order?via=${channel.id}`}
                      className="btn-quiet"
                    >
                      {channel.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <p className="hint text-center">
          {sold
            ? `${seller.business_name} will message you when similar stock lands.`
            : 'Opens WhatsApp with your order already typed.'}
        </p>
      </div>
    </main>
  )
}
