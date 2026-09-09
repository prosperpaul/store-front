'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { PhotoUploader } from './photo-uploader'
import { createProduct, updateProduct, deleteProduct, type ProductState } from './actions'
import type { Product } from '@/lib/types'

export function ProductForm({
  userId,
  product,
}: {
  userId: string
  product: Product | null
}) {
  const action = product ? updateProduct : createProduct
  const [state, formAction] = useActionState<ProductState, FormData>(action, {})

  return (
    <>
      <form action={formAction} className="flex flex-col gap-5">
        {state.error && <p className="alert-error">{state.error}</p>}
        {product && <input type="hidden" name="id" value={product.id} />}

        <PhotoUploader userId={userId} initialPhotos={product?.photos ?? []} />

        <div>
          <label className="label" htmlFor="name">
            Item name
          </label>
          <input
            id="name"
            name="name"
            className="field"
            defaultValue={product?.name ?? ''}
            placeholder="Vintage denim jacket"
            maxLength={80}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="price">
            Price (₦)
          </label>
          <input
            id="price"
            name="price"
            className="field"
            type="text"
            inputMode="decimal"
            defaultValue={product ? String(product.price) : ''}
            placeholder="4500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="size">
              Size
            </label>
            <input
              id="size"
              name="size"
              className="field"
              defaultValue={product?.size ?? ''}
              placeholder="M / 42"
            />
          </div>
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              name="category"
              className="field"
              defaultValue={product?.category ?? ''}
              placeholder="Jackets"
            />
          </div>
        </div>
        <p className="-mt-3 text-sm text-muted">
          Category is how we match buyers to your next drop, so keep it simple
          and reuse the same words.
        </p>

        <div>
          <label className="label" htmlFor="description">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            className="field min-h-24"
            defaultValue={product?.description ?? ''}
            maxLength={500}
            placeholder="Barely worn. No stains, no tears."
          />
        </div>

        <div>
          <label className="label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="field"
            defaultValue={product?.status ?? 'available'}
          >
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="hidden">Hidden from store</option>
          </select>
        </div>

        <SubmitButton>{product ? 'Save changes' : 'Add to store'}</SubmitButton>

        <Link href="/dashboard" className="btn-secondary w-full">
          Cancel
        </Link>
      </form>

      {product && (
        <form action={deleteProduct} className="mt-8 border-t-2 border-line-soft pt-6">
          <input type="hidden" name="id" value={product.id} />
          <button type="submit" className="btn-danger w-full">
            Delete this item
          </button>
          <p className="hint text-center">
            Deleting removes it and its photos for good. To keep the record,
            mark it sold instead.
          </p>
        </form>
      )}
    </>
  )
}
