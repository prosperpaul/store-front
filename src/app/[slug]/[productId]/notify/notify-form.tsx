'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { rememberBuyer, useRememberedBuyer } from '@/lib/remembered-buyer'
import { joinWaitlist, type NotifyState } from './actions'

export function NotifyForm({
  slug,
  productId,
  sellerName,
  category,
}: {
  slug: string
  productId: string
  sellerName: string
  category: string | null
}) {
  const remembered = useRememberedBuyer()

  const [state, formAction] = useActionState<NotifyState, FormData>(
    async (previous, formData) => {
      rememberBuyer(formData)
      return joinWaitlist(previous, formData)
    },
    {}
  )

  if (state.done) {
    return (
      <div className="mt-6">
        <p className="alert-notice">
          Done. {sellerName} will message you when something similar comes in.
        </p>
        <Link href={`/${slug}`} className="btn-secondary mt-4 w-full">
          Keep browsing
        </Link>
      </div>
    )
  }

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
          Only used to tell you about new{category ? ` ${category.toLowerCase()}` : ''}{' '}
          stock. You can ask {sellerName} to stop any time.
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

      <SubmitButton pendingLabel="Saving...">Tell me when it&rsquo;s in</SubmitButton>
    </form>
  )
}
