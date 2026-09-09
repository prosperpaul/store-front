import Image from 'next/image'
import Link from 'next/link'
import { storeChatLink } from '@/lib/whatsapp'
import type { Seller } from '@/lib/types'

export function StorefrontHeader({ seller }: { seller: Seller }) {
  return (
    <header className="border-b-2 border-line bg-surface">
      <div className="mx-auto w-full max-w-2xl px-5 py-6">
        <div className="flex items-center gap-3.5">
          {seller.logo_url ? (
            <Image
              src={seller.logo_url}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-full border-2 border-line object-cover"
            />
          ) : (
            // No logo yet: her initial, set like a stamped mark.
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-line bg-accent text-2xl font-extrabold text-accent-ink display">
              {seller.business_name.trim().charAt(0).toUpperCase()}
            </span>
          )}

          <Link
            href={`/${seller.slug}`}
            className="min-w-0 flex-1 truncate text-2xl font-extrabold leading-tight display"
          >
            {seller.business_name}
          </Link>

          <a
            href={storeChatLink(seller)}
            target="_blank"
            rel="noreferrer"
            className="btn-accent shrink-0 px-3.5 text-sm"
          >
            Chat
          </a>
        </div>

        {seller.delivery_note && (
          <p className="mt-4 rounded-xl border-2 border-line bg-background px-3.5 py-2.5 text-sm font-medium">
            {seller.delivery_note}
          </p>
        )}
      </div>
    </header>
  )
}
