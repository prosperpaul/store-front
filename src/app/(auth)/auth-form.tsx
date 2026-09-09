'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import type { AuthState } from './actions'

export function AuthForm({
  action,
  mode,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>
  mode: 'signin' | 'signup'
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {})
  const isSignUp = mode === 'signup'

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.notice && <p className="alert-notice">{state.notice}</p>}

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

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          minLength={isSignUp ? 8 : undefined}
          required
        />
        {isSignUp && <p className="hint">At least 8 characters.</p>}
      </div>

      <SubmitButton pendingLabel={isSignUp ? 'Creating...' : 'Signing in...'}>
        {isSignUp ? 'Create my store' : 'Sign in'}
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        {isSignUp ? 'Already selling with us? ' : 'New here? '}
        <Link
          href={isSignUp ? '/login' : '/signup'}
          className="font-semibold text-foreground underline underline-offset-4"
        >
          {isSignUp ? 'Sign in' : 'Create a store'}
        </Link>
      </p>
    </form>
  )
}
