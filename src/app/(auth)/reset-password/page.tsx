import type { Metadata } from 'next'
import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { ResetForm } from './reset-form'

export const metadata: Metadata = { title: 'Set a new password', robots: { index: false } }

export default async function ResetPasswordPage() {
  // Reaching here means the emailed link was exchanged for a session at
  // /auth/confirm. Without one the link was stale, already used, or someone
  // typed the URL in directly.
  const user = await getUser()

  if (!user) {
    return (
      <>
        <h1 className="mb-1 text-3xl font-extrabold">Link expired</h1>
        <p className="mb-6 font-medium text-muted">
          Reset links only work once, and not for long. Ask for a fresh one.
        </p>
        <Link href="/forgot-password" className="btn-primary w-full">
          Send me a new link
        </Link>
      </>
    )
  }

  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">Set a new password</h1>
      <p className="mb-6 font-medium text-muted">
        Signed in as {user.email}. Pick something you&rsquo;ll remember.
      </p>
      <ResetForm />
    </>
  )
}
