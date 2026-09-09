'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { rememberBuyer, useRememberedBuyer } from '@/lib/remembered-buyer'
import { placeOrder, type OrderState } from './actions'

export function OrderForm({
  slug,
  productId,
  sellerName,
}: {
  slug: string
  productId: string
  sellerName: string
}) {
  const remembered = useRememberedBuyer()

  const [state, formAction] = useActionState<OrderState, FormData>(
    async (previous, formData) => {
      rememberBuyer(formData)
      return placeOrder(previous, formData)
    },
    {}
  )

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      {state.error && <p className="alert-error">{state.error}</p>}

      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="product_id" value={productId} />

      {remembered.phone && (
        <p className="alert-notice">Welcome back. We filled in your details.</p>
      )}

      <div>
        <label className="label" htmlFor="phone">
          Your WhatsApp number
        </label>
        {/*
          Uncontrolled, with key so the remembered value lands after hydration
          without the field fighting the buyer for control of its contents.
        */}
        <input
          id="phone"
          name="phone"
          key={`phone-${remembered.phone ?? ''}`}
          defaultValue={remembered.phone ?? ''}
          className="field"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0801 234 5678"
          required
        />
        <p className="hint">
          Shared with {sellerName} so she can confirm your order.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="name">
          Your name <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="name"
          name="name"
          key={`name-${remembered.name ?? ''}`}
          defaultValue={remembered.name ?? ''}
          className="field"
          autoComplete="name"
          placeholder="Ada"
          maxLength={60}
        />
      </div>

      <div>
        <label className="label" htmlFor="note">
          Anything to add? <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          className="field min-h-20"
          maxLength={300}
          placeholder="Do you have this in blue?"
        />
      </div>

      <SubmitButton pendingLabel="Opening WhatsApp...">
        Send order on WhatsApp
      </SubmitButton>
    </form>
  )
}
