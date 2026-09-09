import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireSeller } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '../product-form'
import type { Product } from '@/lib/types'

export const metadata: Metadata = { title: 'Edit item' }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, seller } = await requireSeller()

  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('seller_id', seller.id)
    .maybeSingle()

  if (!product) notFound()

  return (
    <div className="mx-auto w-full max-w-md px-5 py-6">
      <h1 className="mb-6 text-3xl font-extrabold">Edit item</h1>
      <ProductForm userId={user.id} product={product as Product} />
    </div>
  )
}
