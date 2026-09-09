'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireSeller } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { ProductStatus } from '@/lib/types'

export type ProductState = { error?: string }

const STATUSES: ProductStatus[] = ['available', 'sold', 'hidden']

const PHOTO_BUCKET = 'product-photos'

/** Photo URLs arrive as a JSON array in a hidden input from the uploader. */
function readPhotos(formData: FormData): string[] {
  try {
    const parsed = JSON.parse(String(formData.get('photos') ?? '[]'))
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === 'string') : []
  } catch {
    return []
  }
}

function readFields(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const rawPrice = String(formData.get('price') ?? '').replace(/[^\d.]/g, '')
  const price = Number(rawPrice)
  const status = String(formData.get('status') ?? 'available') as ProductStatus

  return {
    name,
    price,
    size: String(formData.get('size') ?? '').trim() || null,
    category: String(formData.get('category') ?? '').trim() || null,
    description: String(formData.get('description') ?? '').trim() || null,
    photos: readPhotos(formData),
    status: STATUSES.includes(status) ? status : ('available' as ProductStatus),
  }
}

function validate(fields: ReturnType<typeof readFields>): string | null {
  if (!fields.name) return 'Give the item a name.'
  if (!Number.isFinite(fields.price) || fields.price <= 0) {
    return 'Enter a price, e.g. 4500.'
  }
  if (fields.price > 99_999_999) return 'That price is too high.'
  return null
}

export async function createProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { seller } = await requireSeller()

  const fields = readFields(formData)
  const problem = validate(fields)
  if (problem) return { error: problem }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .insert({ ...fields, seller_id: seller.id })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  // 'layout' so the item's own page refreshes too, not just the grid.
  revalidatePath(`/${seller.slug}`, 'layout')
  redirect('/dashboard')
}

export async function updateProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { seller } = await requireSeller()

  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing item.' }

  const fields = readFields(formData)
  const problem = validate(fields)
  if (problem) return { error: problem }

  const supabase = await createClient()
  // RLS already scopes this to her rows; the seller_id filter makes that
  // explicit so a leaked id still can't touch someone else's item.
  const { error } = await supabase
    .from('products')
    .update(fields)
    .eq('id', id)
    .eq('seller_id', seller.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  // 'layout' so the item's own page refreshes too, not just the grid.
  revalidatePath(`/${seller.slug}`, 'layout')
  redirect('/dashboard')
}

/** Quick status flip from the item list (mark sold / relist / hide). */
export async function setProductStatus(formData: FormData) {
  const { seller } = await requireSeller()

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '') as ProductStatus
  if (!id || !STATUSES.includes(status)) return

  const supabase = await createClient()
  await supabase
    .from('products')
    .update({ status })
    .eq('id', id)
    .eq('seller_id', seller.id)

  revalidatePath('/dashboard')
  // 'layout' so the item's own page refreshes too, not just the grid.
  revalidatePath(`/${seller.slug}`, 'layout')
}

export async function deleteProduct(formData: FormData) {
  const { seller } = await requireSeller()

  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('photos')
    .eq('id', id)
    .eq('seller_id', seller.id)
    .maybeSingle()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('seller_id', seller.id)

  if (error) return

  // Don't leave orphaned images sitting in the bucket.
  const paths = (product?.photos ?? [])
    .map((url: string) => storagePathFromUrl(url))
    .filter((path: string | null): path is string => Boolean(path))

  if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths)

  revalidatePath('/dashboard')
  // 'layout' so the item's own page refreshes too, not just the grid.
  revalidatePath(`/${seller.slug}`, 'layout')
  redirect('/dashboard')
}

/**
 * "https://x.supabase.co/storage/v1/object/public/product-photos/<uid>/a.jpg"
 * -> "<uid>/a.jpg". Returns null for anything not in our bucket.
 */
function storagePathFromUrl(url: string): string | null {
  const marker = `/${PHOTO_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  const path = url.slice(index + marker.length)
  return path ? decodeURIComponent(path) : null
}
