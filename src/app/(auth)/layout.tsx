import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
      <Link
        href="/"
        className="mb-8 text-center text-xl font-extrabold display"
      >
        social<span className="text-brand">storefront</span>
      </Link>

      <div className="card bg-surface p-5">{children}</div>
    </main>
  )
}
