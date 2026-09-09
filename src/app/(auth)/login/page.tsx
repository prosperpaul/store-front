import type { Metadata } from 'next'
import { AuthForm } from '../auth-form'
import { signIn } from '../actions'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">Welcome back</h1>
      <p className="mb-6 font-medium text-muted">Sign in to manage your store.</p>

      {/* Set by /auth/confirm when an emailed link is stale or already used. */}
      {error === 'link' && (
        <p className="alert-error mb-4">
          That link didn&rsquo;t work &mdash; it may have expired or already
          been used. Sign in below, or request a new one.
        </p>
      )}

      <AuthForm action={signIn} mode="signin" />
    </>
  )
}
