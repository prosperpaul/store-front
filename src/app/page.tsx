import Link from 'next/link'
import { getUser } from '@/lib/auth'

export default async function Home() {
  const user = await getUser()

  return (
    <main className="flex-1">
      {/* ---------- hero ---------- */}
      <section className="mx-auto w-full max-w-2xl px-5 pb-10 pt-12">
        <p className="badge w-fit bg-accent text-accent-ink">
          For Instagram &amp; WhatsApp sellers
        </p>

        <h1 className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
          Stop retyping
          <br />
          <span className="bg-brand px-2 text-brand-ink">the same</span>
          <br />
          price all day.
        </h1>

        <p className="mt-6 max-w-md text-lg font-medium leading-relaxed">
          Post each item once. Buyers tap it and WhatsApp opens with the order
          already written &mdash; and every order quietly builds your customer
          list.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:max-w-xs">
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              Go to my dashboard
            </Link>
          ) : (
            <>
              <Link href="/signup" className="btn-primary">
                Create my store &mdash; free
              </Link>
              <Link href="/login" className="btn-secondary">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      {/*
        The demo. This is the whole product in one glance: a shop on the left,
        the message it writes on the right. Worth more than any description --
        and it's built from the same components the real thing uses, so it
        can't drift into promising something the app doesn't do.
      */}
      <section className="border-y-2 border-line bg-surface py-12">
        <div className="mx-auto w-full max-w-2xl px-5">
          <h2 className="text-center text-2xl font-extrabold">
            One tap. Order written.
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <Phone label="Your shop">
              <div className="flex items-center gap-2 border-b-2 border-line px-3 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-line bg-accent text-xs font-extrabold text-accent-ink">
                  A
                </span>
                <span className="truncate text-sm font-extrabold display">
                  Ada&rsquo;s Thrift
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3">
                {SAMPLE_ITEMS.map((item) => (
                  <div key={item.name}>
                    <div
                      className={`aspect-square rounded-lg border-2 border-line ${item.tone}`}
                    />
                    <p className="mt-1 truncate text-[11px] font-bold">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-bold text-brand">{item.price}</p>
                  </div>
                ))}
              </div>

              <div className="px-3 pb-3">
                <div className="rounded-lg border-2 border-line bg-brand py-1.5 text-center text-[11px] font-extrabold text-brand-ink">
                  Order on WhatsApp
                </div>
              </div>
            </Phone>

            {/* Points down when the columns stack on a phone. */}
            <div
              aria-hidden="true"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-accent text-xl font-extrabold text-accent-ink"
              style={{ boxShadow: '3px 3px 0 var(--shadow-hard)' }}
            >
              <span className="sm:hidden">↓</span>
              <span className="hidden sm:inline">→</span>
            </div>

            <Phone label="Their WhatsApp">
              <div className="flex items-center gap-2 border-b-2 border-line px-3 py-2.5">
                <span className="h-7 w-7 rounded-full border-2 border-line bg-surface" />
                <span className="truncate text-sm font-bold">Ada&rsquo;s Thrift</span>
              </div>

              <div className="p-3">
                <div className="rounded-xl rounded-br-sm border-2 border-line bg-brand/20 p-2.5 text-[11px] font-medium leading-relaxed">
                  Hi Ada&rsquo;s Thrift, I&rsquo;d like to order:
                  <br />
                  <br />
                  Denim jacket (M) - ₦4,500
                  <br />
                  <br />
                  See it here: adasthrift.shop/denim
                </div>
                <p className="mt-2 text-right text-[10px] font-bold text-muted">
                  already typed ✓
                </p>
              </div>
            </Phone>
          </div>
        </div>
      </section>

      {/* ---------- the part sellers don't get from a link-in-bio ---------- */}
      <section className="mx-auto w-full max-w-2xl px-5 py-12">
        <h2 className="text-3xl font-extrabold leading-tight">
          Every order remembers
          <br />
          who bought it.
        </h2>

        <p className="mt-4 max-w-md font-medium leading-relaxed text-muted">
          So when new stock lands you message the twelve people who wanted
          exactly this &mdash; not a &ldquo;happy new week&rdquo; blast to
          everyone you&rsquo;ve ever spoken to.
        </p>

        <div className="card mt-6 divide-y-2 divide-line-soft">
          {SAMPLE_CUSTOMERS.map((customer) => (
            <div key={customer.name} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{customer.name}</p>
                <p className="truncate text-sm text-muted">{customer.detail}</p>
              </div>
              {customer.tag && (
                <span className="badge shrink-0 bg-accent text-accent-ink">
                  {customer.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- close ---------- */}
      <section className="border-t-2 border-line bg-surface px-5 py-12">
        <div className="mx-auto w-full max-w-md text-center">
          <h2 className="text-3xl font-extrabold leading-tight">
            Your shop, on one link.
          </h2>
          <p className="mt-3 font-medium text-muted">
            No app to download. Works on the phone you already have.
          </p>

          <div className="mt-7">
            <Link
              href={user ? '/dashboard' : '/signup'}
              className="btn-primary w-full"
            >
              {user ? 'Go to my dashboard' : 'Create my store — free'}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

/** A phone-shaped frame, so the two panels read as screens rather than boxes. */
function Phone({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <div
        className="mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl border-2 border-line bg-background"
        style={{ boxShadow: '4px 4px 0 var(--shadow-hard)' }}
      >
        {children}
      </div>
    </div>
  )
}

// Flat colour blocks rather than photos: nothing to load, and no pretending
// we have stock imagery of someone's actual shop.
const SAMPLE_ITEMS = [
  { name: 'Denim jacket', price: '₦4,500', tone: 'bg-brand/25' },
  { name: 'Silk scarf', price: '₦2,000', tone: 'bg-accent/40' },
  { name: 'Tote bag', price: '₦3,200', tone: 'bg-surface' },
  { name: 'Sneakers', price: '₦9,000', tone: 'bg-brand/15' },
]

const SAMPLE_CUSTOMERS = [
  { name: 'Chidera', detail: '3 orders · Today', tag: 'Waiting' },
  { name: 'Blessing', detail: '1 order · Yesterday', tag: null },
  { name: '0803 111 2222', detail: '2 orders · 12 Mar', tag: 'Waiting' },
]
