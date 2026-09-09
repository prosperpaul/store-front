import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSellerBySlug, getStorefrontProducts } from '@/lib/storefront'
import { money } from '@/lib/format'
import { storefrontUrl } from '@/lib/site'

// Cached and served fast to buyers arriving from a bio link. Seller edits
// call revalidatePath, so this ceiling is just a backstop.
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const seller = await getSellerBySlug(slug)

  if (!seller) return { title: 'Store not found' }

  const description =
    seller.delivery_note ?? `Shop ${seller.business_name} and order on WhatsApp.`

  return {
    title: { absolute: seller.business_name },
    description,
    // Sellers share this link on WhatsApp and Instagram, so the preview card
    // is the first thing most buyers ever see of the store.
    openGraph: {
      title: seller.business_name,
      description,
      url: storefrontUrl(slug),
      type: 'website',
      images: seller.logo_url ? [seller.logo_url] : undefined,
    },
  }
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const seller = await getSellerBySlug(slug)

  if (!seller) notFound()

  const products = await getStorefrontProducts(seller.id)

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-6">
      {products.length === 0 ? (
        <p className="card px-5 py-12 text-center font-medium text-muted">
          Nothing listed yet. Check back soon.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((product, index) => {
            const sold = product.status === 'sold'

            return (
              <li key={product.id}>
                <Link href={`/${slug}/${product.id}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-line bg-surface">
                    {product.photos[0] ? (
                      <Image
                        src={product.photos[0]}
                        alt={product.name}
                        fill
                        sizes="(min-width: 640px) 200px, 45vw"
                        className={`object-cover ${sold ? 'opacity-40 grayscale' : ''}`}
                        // The first row is above the fold on a phone.
                        priority={index < 2}
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm font-medium text-muted">
                        No photo
                      </span>
                    )}

                    {sold && (
                      <span className="badge absolute left-2 top-2 bg-background">
                        Sold
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 truncate font-bold leading-tight">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-brand">
                    {money(Number(product.price))}
                    {product.size && (
                      <span className="font-medium text-muted"> · {product.size}</span>
                    )}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
