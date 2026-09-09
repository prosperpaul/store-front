'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { displayPhone, money } from '@/lib/format'
import {
  buildBroadcast,
  recordBroadcast,
  type Audience,
  type BroadcastState,
} from './actions'
import type { Product } from '@/lib/types'

const AUDIENCES: { value: Audience; label: string; detail: string }[] = [
  {
    value: 'waiting',
    label: 'People waiting for these',
    detail: 'Asked to be told when this category came back. Warmest list.',
  },
  {
    value: 'recent',
    label: 'Bought in the last 60 days',
    detail: 'Still remember you.',
  },
  { value: 'all', label: 'Everyone', detail: 'Every customer who has not opted out.' },
]

export function BroadcastComposer({
  products,
  storeName,
  storeUrl,
}: {
  products: Product[]
  storeName: string
  storeUrl: string
}) {
  // Composing a second drop has to start from a blank slate. Remounting on a
  // changed key is what clears the action state -- there's no reset for it.
  const [run, setRun] = useState(0)

  return (
    <ComposerRun
      key={run}
      products={products}
      storeName={storeName}
      storeUrl={storeUrl}
      onStartAnother={() => setRun((current) => current + 1)}
    />
  )
}

function ComposerRun({
  products,
  storeName,
  storeUrl,
  onStartAnother,
}: {
  products: Product[]
  storeName: string
  storeUrl: string
  onStartAnother: () => void
}) {
  const [state, formAction] = useActionState<BroadcastState, FormData>(
    buildBroadcast,
    {}
  )

  const [saveState, saveAction] = useActionState<{ saved?: boolean }, FormData>(
    async (_previous, formData) => {
      await recordBroadcast(formData)
      return { saved: true }
    },
    {}
  )

  const [selected, setSelected] = useState<string[]>([])
  const [audience, setAudience] = useState<Audience>('waiting')
  const [edited, setEdited] = useState<string | null>(null)
  const [sent, setSent] = useState<string[]>([])

  const chosen = products.filter((product) => selected.includes(product.id))

  // Redrafts as she picks items, until she types over it herself.
  const draft =
    edited ??
    [
      `New in at ${storeName}:`,
      '',
      ...chosen.map(
        (product) => `- ${product.name} - ${money(Number(product.price))}`
      ),
      chosen.length ? '' : null,
      `See them all: ${storeUrl}`,
    ]
      .filter((line) => line !== null)
      .join('\n')

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    )
  }

  // ---------- step 3: filed ----------
  if (saveState.saved) {
    return (
      <div className="card mt-6 px-5 py-8 text-center">
        <p className="font-semibold">Drop saved</p>
        <p className="mt-1 text-muted">
          Anyone you told won&rsquo;t be asked about this one again.
        </p>
        <button
          type="button"
          onClick={onStartAnother}
          className="btn-secondary mt-6 w-full"
        >
          Announce something else
        </button>
      </div>
    )
  }

  // ---------- step 2: work through the list ----------
  if (state.prepared) {
    const { message, recipients, productIds, waitlistIds } = state.prepared

    if (recipients.length === 0) {
      return (
        <div className="card mt-6 px-5 py-8 text-center">
          <p className="font-semibold">Nobody to message yet</p>
          <p className="mt-1 text-muted">
            No one on that list has a number we&rsquo;re allowed to use. Try a
            wider audience, or come back once you have more orders.
          </p>
        </div>
      )
    }

    return (
      <div className="mt-6">
        <div className="card p-4">
          <p className="text-sm text-muted">Your message</p>
          <p className="mt-1 whitespace-pre-line text-sm">{message}</p>
        </div>

        <p className="mt-5 font-semibold">
          {sent.length} of {recipients.length} sent
        </p>
        <p className="mb-3 text-sm text-muted">
          Tap each person. WhatsApp opens with the message ready &mdash; press
          send there, then come back.
        </p>

        <ul className="flex flex-col gap-2">
          {recipients.map((recipient) => {
            const done = sent.includes(recipient.id)

            return (
              <li key={recipient.id} className="card flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {recipient.name ?? displayPhone(recipient.phone)}
                  </p>
                  {recipient.name && (
                    <p className="truncate text-sm text-muted">
                      {displayPhone(recipient.phone)}
                    </p>
                  )}
                </div>

                <a
                  href={`https://wa.me/${recipient.phone}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    setSent((current) =>
                      current.includes(recipient.id)
                        ? current
                        : [...current, recipient.id]
                    )
                  }
                  className={`shrink-0 px-3 text-sm ${
                    done ? 'btn-secondary' : 'btn-primary'
                  }`}
                >
                  {done ? 'Sent' : 'Send'}
                </a>
              </li>
            )
          })}
        </ul>

        <form action={saveAction} className="mt-6">
          <input type="hidden" name="message" value={message} />
          <input type="hidden" name="recipient_count" value={sent.length} />
          <input type="hidden" name="product_ids" value={JSON.stringify(productIds)} />
          <input type="hidden" name="waitlist_ids" value={JSON.stringify(waitlistIds)} />
          <SubmitButton pendingLabel="Saving...">
            Done &mdash; save this drop
          </SubmitButton>
          <p className="hint text-center">
            Saves the record so waiting customers aren&rsquo;t asked twice.
          </p>
        </form>
      </div>
    )
  }

  // ---------- step 1: compose ----------
  return (
    <form action={formAction} className="mt-6 flex flex-col gap-6">
      {state.error && <p className="alert-error">{state.error}</p>}

      <div>
        <span className="label">What&rsquo;s new?</span>
        {products.length === 0 ? (
          <p className="text-sm text-muted">
            No available items to announce. Add one first.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {products.map((product) => (
              <li key={product.id}>
                <label className="card flex cursor-pointer items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    name="product_ids"
                    value={product.id}
                    checked={selected.includes(product.id)}
                    onChange={() => toggle(product.id)}
                    className="h-5 w-5 shrink-0 accent-brand"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{product.name}</span>
                    <span className="block text-sm text-muted">
                      {money(Number(product.price))}
                      {product.category ? ` · ${product.category}` : ' · no category'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <span className="label">Who should hear it?</span>
        <ul className="flex flex-col gap-2">
          {AUDIENCES.map((option) => (
            <li key={option.value}>
              <label className="card flex cursor-pointer items-start gap-3 p-3">
                <input
                  type="radio"
                  name="audience"
                  value={option.value}
                  checked={audience === option.value}
                  onChange={() => setAudience(option.value)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-sm text-muted">{option.detail}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="label" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          className="field min-h-40"
          value={draft}
          onChange={(e) => setEdited(e.target.value)}
          maxLength={1000}
          required
        />
        <p className="hint">
          {edited === null
            ? 'Written for you from the items above. Edit it freely.'
            : 'Your own wording.'}
          {edited !== null && (
            <>
              {' '}
              <button
                type="button"
                onClick={() => setEdited(null)}
                className="underline underline-offset-4"
              >
                Start over
              </button>
            </>
          )}
        </p>
      </div>

      <SubmitButton pendingLabel="Finding people...">
        See who gets this
      </SubmitButton>
    </form>
  )
}
