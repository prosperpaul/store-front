import type { Metadata } from 'next'
import { AuthForm } from '../auth-form'
import { signUp } from '../actions'

export const metadata: Metadata = { title: 'Create a store' }

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">Create your store</h1>
      <p className="mb-6 text-muted">
        Free while you set up. Takes about two minutes.
      </p>
      <AuthForm action={signUp} mode="signup" />
    </>
  )
}
