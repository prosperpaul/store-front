import type { Metadata } from 'next'
import { requireSeller } from '@/lib/auth'
import { ProductForm } from '../product-form'

export const metadata: Metadata = { title: 'Add an item' }

export default async function NewProductPage() {
  const { user } = await requireSeller()

  return (
    <div className="mx-auto w-full max-w-md px-5 py-6">
      <h1 className="mb-6 text-3xl font-extrabold">Add an item</h1>
      <ProductForm userId={user.id} product={null} />
    </div>
  )
}
