'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { requestPasswordReset, type AuthState } from '../actions'

export function ResetRequestForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {}
  )

  // Once the mail is away there's nothing useful left to do on this page.
  if (state.notice) {
    return (
      <div>
        <p className="alert-notice">{state.notice}</p>
        <Link href="/login" className="btn-secondary mt-4 w-full">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <p className="alert-error">{state.error}</p>}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="field"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="you@example.com"
          required
        />
      </div>

      <SubmitButton pendingLabel="Sending...">Send reset link</SubmitButton>

      <Link href="/login" className="text-center text-sm font-bold text-muted">
        Back to sign in
      </Link>
    </form>
  )
}
