import Link from 'next/link'
import { getUser } from '@/lib/auth'

export default async function Home() {
  const user = await getUser()

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <p className="badge mb-6 w-fit bg-accent text-accent-ink">
        For Instagram &amp; WhatsApp sellers
      </p>

      <h1 className="text-5xl font-extrabold leading-[0.95] tracking-tight">
        Your shop,
        <br />
        on <span className="bg-brand px-2 text-brand-ink">one link</span>.
      </h1>

      <p className="mt-5 text-lg font-medium leading-relaxed">
        Post your items once. Buyers tap and WhatsApp opens with the order
        already typed &mdash; and every order quietly builds your customer list.
      </p>

      <div className="mt-9 flex flex-col gap-3">
        {user ? (
          <Link href="/dashboard" className="btn-primary">
            Go to my dashboard
          </Link>
        ) : (
          <>
            <Link href="/signup" className="btn-primary">
              Create my store
            </Link>
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
          </>
        )}
      </div>

      <p className="mt-10 border-t-2 border-line-soft pt-5 text-sm font-medium text-muted">
        No app to download. Works on the phone you already have.
      </p>
    </main>
  )
}
