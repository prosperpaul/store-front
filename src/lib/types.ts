/** Shapes of the rows in supabase/schema.sql. */

export type ProductStatus = 'available' | 'sold' | 'hidden'

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'paid'
  | 'delivered'
  | 'cancelled'

export type Seller = {
  id: string
  slug: string
  business_name: string
  whatsapp: string
  /** Other places buyers can reach her. Bare usernames, no @ or URL. */
  instagram: string | null
  facebook: string | null
  telegram: string | null
  /** Whether she'll take orders as a plain text message on her number. */
  accepts_sms: boolean
  logo_url: string | null
  delivery_note: string | null
  plan: string
  created_at: string
}

export type Product = {
  id: string
  seller_id: string
  name: string
  price: number
  size: string | null
  category: string | null
  description: string | null
  photos: string[]
  status: ProductStatus
  created_at: string
}

export type Customer = {
  id: string
  seller_id: string
  name: string | null
  phone: string
  opted_out: boolean
  first_seen: string
  last_order_at: string | null
}

export type Order = {
  id: string
  seller_id: string
  product_id: string | null
  customer_id: string | null
  status: OrderStatus
  note: string | null
  /** Which channel the buyer chose to reach the seller on. */
  channel: string
  created_at: string
}

export type WaitlistEntry = {
  id: string
  seller_id: string
  product_id: string | null
  customer_id: string
  notified_at: string | null
  created_at: string
}

export type Broadcast = {
  id: string
  seller_id: string
  product_ids: string[]
  message: string
  recipient_count: number
  created_at: string
}
