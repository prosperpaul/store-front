'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { slugify } from '@/lib/format'
import { LogoUploader } from './logo-uploader'
import { saveStore, type StoreState } from './actions'
import type { Seller } from '@/lib/types'

export function StoreForm({
  seller,
  userId,
  submitLabel,
}: {
  seller: Seller | null
  userId: string
  submitLabel: string
}) {
  const [state, formAction] = useActionState<StoreState, FormData>(saveStore, {})

  const [name, setName] = useState(seller?.business_name ?? '')
  const [slug, setSlug] = useState(seller?.slug ?? '')
  // Until she edits the link herself, keep it following the business name.
  const [slugTouched, setSlugTouched] = useState(Boolean(seller))

  const shownSlug = slugify(slugTouched ? slug : name)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && <p className="alert-error">{state.error}</p>}

      <LogoUploader
        userId={userId}
        initialLogo={seller?.logo_url ?? null}
        businessName={name}
      />

      <div>
        <label className="label" htmlFor="business_name">
          Business name
        </label>
        <input
          id="business_name"
          name="business_name"
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ada's Thrift Store"
          maxLength={60}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="slug">
          Your store link
        </label>
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-sm text-muted">/</span>
          <input
            id="slug"
            name="slug"
            className="field"
            value={slugTouched ? slug : shownSlug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="adas-thrift-store"
            required
          />
        </div>
        <p className="hint">
          Buyers will visit <span className="font-medium text-foreground">/{shownSlug || '...'}</span>.
          This is the link you put in your Instagram bio and WhatsApp status.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="whatsapp">
          WhatsApp number
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          className="field"
          type="tel"
          inputMode="tel"
          defaultValue={seller?.whatsapp ?? ''}
          placeholder="0801 234 5678"
          required
        />
        <p className="hint">Orders open a chat with this number.</p>
      </div>

      {/*
        Everything here is optional. A buyer arriving from Instagram often
        wants to reply where they already are, so each handle she adds is one
        more place an order can start.
      */}
      <fieldset className="card-soft p-4">
        <legend className="px-1 text-sm font-bold">
          Where else can buyers reach you?
        </legend>

        <label className="mt-1 flex items-start gap-3">
          <input
            type="checkbox"
            name="accepts_sms"
            value="yes"
            defaultChecked={seller?.accepts_sms ?? false}
            className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
          />
          <span className="text-sm font-medium">
            Accept orders by text message on the same number
          </span>
        </label>

        <div className="mt-4">
          <label className="label" htmlFor="instagram">
            Instagram username
          </label>
          <input
            id="instagram"
            name="instagram"
            className="field"
            defaultValue={seller?.instagram ?? ''}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="adasthriftstore"
          />
        </div>

        <div className="mt-3">
          <label className="label" htmlFor="facebook">
            Facebook page username
          </label>
          <input
            id="facebook"
            name="facebook"
            className="field"
            defaultValue={seller?.facebook ?? ''}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="adasthriftstore"
          />
        </div>

        <div className="mt-3">
          <label className="label" htmlFor="telegram">
            Telegram username
          </label>
          <input
            id="telegram"
            name="telegram"
            className="field"
            defaultValue={seller?.telegram ?? ''}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="adasthriftstore"
          />
        </div>

        <p className="hint">
          Paste the @name or the whole profile link &mdash; we&rsquo;ll tidy it
          up. Only WhatsApp and text can carry the order already typed; the
          others open an empty chat, so buyers get the message to paste.
        </p>
      </fieldset>

      <div>
        <label className="label" htmlFor="delivery_note">
          Delivery note <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="delivery_note"
          name="delivery_note"
          className="field min-h-24"
          defaultValue={seller?.delivery_note ?? ''}
          maxLength={200}
          placeholder="Lagos delivery ₦2,000. Nationwide 2-4 days."
        />
        <p className="hint">Shown on your storefront so buyers stop asking.</p>
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  )
}
