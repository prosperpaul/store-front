import type { Metadata } from 'next'
import { AuthForm } from '../auth-form'
import { signIn } from '../actions'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">Welcome back</h1>
      <p className="mb-6 text-muted">Sign in to manage your store.</p>
      <AuthForm action={signIn} mode="signin" />
    </>
  )
}
