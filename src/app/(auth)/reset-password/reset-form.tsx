'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { PasswordField } from '@/components/password-field'
import { updatePassword, type AuthState } from '../actions'

export function ResetForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    updatePassword,
    {}
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <p className="alert-error">{state.error}</p>}

      <PasswordField
        label="New password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters."
      />

      <SubmitButton pendingLabel="Saving...">Set new password</SubmitButton>
    </form>
  )
}
