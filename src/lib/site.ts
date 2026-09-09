/**
 * Absolute base URL of this deployment. Needed because order messages and
 * link previews have to carry a full URL -- a buyer pastes them into
 * WhatsApp, where a relative path means nothing.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/+$/, '')

  // Vercel sets this automatically on preview deployments.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  return 'http://localhost:3000'
}

/** Full public URL of a seller's storefront. */
export function storefrontUrl(slug: string): string {
  return `${siteUrl()}/${slug}`
}

/** Full public URL of a single item. */
export function productUrl(slug: string, productId: string): string {
  return `${siteUrl()}/${slug}/${productId}`
}
