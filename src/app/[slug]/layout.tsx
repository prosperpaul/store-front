import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSellerBySlug } from '@/lib/storefront'
import { StorefrontHeader } from './header'
import { OwnerBar } from './owner-bar'

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const seller = await getSellerBySlug(slug)

  if (!seller) notFound()

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <OwnerBar />
      <StorefrontHeader seller={seller} />

      <div className="flex-1">{children}</div>

      <footer className="mt-10 border-t-2 border-line bg-surface px-5 py-7 text-center text-sm font-medium text-muted">
        <Link href="/" className="underline decoration-2 underline-offset-4">
          Powered by social storefront
        </Link>
      </footer>
    </div>
  )
}
