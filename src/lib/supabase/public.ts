import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cookie-free anon client for the public storefront.
 *
 * The cookie-based server client would make every storefront render dynamic,
 * and buyers arriving from an Instagram bio deserve a cached page. This one
 * reads no session at all, so `/[slug]` can be statically rendered and
 * refreshed on demand when the seller edits an item.
 *
 * It still goes through Row Level Security as an anonymous visitor, which
 * means it can only ever see sellers and their available/sold products.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
