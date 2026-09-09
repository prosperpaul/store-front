import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import type { Product, Seller } from '@/lib/types'

/**
 * Wrapped in React's cache() so a page and its generateMetadata share one
 * query per request instead of hitting Supabase twice for the same row.
 */
export const getSellerBySlug = cache(async (slug: string): Promise<Seller | null> => {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('sellers')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  return (data as Seller) ?? null
})

/**
 * Everything the storefront shows. Hidden items are filtered out by RLS
 * (the anon policy only exposes available/sold), and sold ones sink to the
 * bottom so buyers hit things they can actually buy first.
 */
export const getStorefrontProducts = cache(
  async (sellerId: string): Promise<Product[]> => {
    const supabase = createPublicClient()

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .in('status', ['available', 'sold'])
      .order('created_at', { ascending: false })

    const products = (data ?? []) as Product[]

    return products.sort((a, b) => {
      if (a.status === b.status) return 0
      return a.status === 'sold' ? 1 : -1
    })
  }
)

export const getStorefrontProduct = cache(
  async (sellerId: string, productId: string): Promise<Product | null> => {
    const supabase = createPublicClient()

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('id', productId)
      .in('status', ['available', 'sold'])
      .maybeSingle()

    return (data as Product) ?? null
  }
)
