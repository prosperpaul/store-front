import Link from 'next/link'

export default function StoreNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16 text-center">
      <h1 className="text-3xl font-extrabold">Store not found</h1>
      <p className="mt-2 text-muted">
        This link may be mistyped, or the store may have moved.
      </p>
      <Link href="/" className="btn-secondary mt-8">
        Go to social storefront
      </Link>
    </main>
  )
}
