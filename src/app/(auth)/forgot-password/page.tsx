import type { Metadata } from 'next'
import { ResetRequestForm } from './reset-request-form'

export const metadata: Metadata = { title: 'Forgot password' }

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">Forgot your password?</h1>
      <p className="mb-6 font-medium text-muted">
        Enter your email and we&rsquo;ll send you a link to set a new one.
      </p>
      <ResetRequestForm />
    </>
  )
}
