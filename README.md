# social-storefront

A storefront + repeat-customer tool for Instagram / WhatsApp sellers.

Each seller gets a public page at `/<slug>`. Buyers tap an item and WhatsApp
opens with the order already typed. Every order quietly builds the seller's
customer list -- which is what later powers targeted "new stock" messages
instead of blind "happy new week" blasts.

## Setup (do this once)

### 1. Create a Supabase project
- Go to https://supabase.com -> New project (free tier is fine)
- Pick a region close to your users
- Save the database password somewhere safe

### 2. Create the tables
- Supabase Dashboard -> **SQL Editor** -> **New query**
- Paste the whole of `supabase/schema.sql` and click **Run**
- Check **Table Editor** -- you should see 6 tables and a `product-photos` bucket

### 3. Add your keys
```bash
cp .env.local.example .env.local
```
Fill it in from Supabase Dashboard -> **Project Settings** -> **API**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key -- **secret** |

> The service role key bypasses all security rules. Never put it in a
> `NEXT_PUBLIC_` variable, never paste it in the browser, never commit it.

### 4. Run it

This project uses [pnpm](https://pnpm.io). If you don't have it:
`corepack enable` (bundled with Node) or `npm i -g pnpm`.

```bash
pnpm install
pnpm dev
```
http://localhost:3000

## Project layout

```
supabase/schema.sql        tables, security rules, storage bucket
src/lib/types.ts           TypeScript shapes of each table
src/lib/auth.ts            requireUser / requireSeller guards
src/lib/format.ts          naira, slugs, WhatsApp number normalising
src/lib/whatsapp.ts        builds the pre-typed wa.me order messages
src/lib/storefront.ts      public reads, deduped per request
src/lib/site.ts            absolute URLs for links and previews
src/lib/supabase/
  client.ts                for Client Components
  server.ts                for Server Components / Actions (respects RLS)
  admin.ts                 service role -- server only, for buyer writes
src/proxy.ts               refreshes login sessions, guards /dashboard
src/app/(auth)/            sign up, sign in, sign out
src/app/dashboard/
  setup/                   first-run store details (also reused by settings)
  products/                add / edit / delete items, photo upload
src/app/[slug]/            the public storefront
  [productId]/             one item, with the WhatsApp order button
  [productId]/order/       captures the buyer, then hands off to WhatsApp
  [productId]/notify/      waitlist sign-up on a sold item
```

### How broadcasts work

There is no WhatsApp Business API here, so nothing is sent on the seller's
behalf. The composer picks the audience, drafts the message, and hands her a
list she taps through -- each tap opens WhatsApp with the message already
typed. Saving the drop marks those waitlist entries notified so the same
people aren't pestered next time.

`opted_out` is honoured by every audience. Buyers ask to stop inside WhatsApp
where we can't see it, so the seller records it on the People tab.

### How buyer capture works

A `wa.me` click tells us nothing -- WhatsApp sends no callback -- so the
buyer's number can only come from asking. Ordering therefore goes through one
short step before WhatsApp opens. It asks for a number (name and note are
optional) and remembers the buyer in their own browser, so their second order
is a single tap.

That step is the only public code path that uses the service role key, since
buyers aren't logged in and RLS blocks anonymous writes. It trusts nothing
from the form: the seller comes from the slug, the item is re-read through
RLS, and `seller_id` is derived from those rather than submitted.

> Next.js 16 renamed `middleware` to `proxy`. Same behaviour, new filename.

## Data model

| Table | Holds |
|---|---|
| `sellers` | one row per business; `slug` is the public URL |
| `products` | items; `status` is available / sold / hidden |
| `customers` | **the asset** -- captured from orders, has `opted_out` |
| `orders` | who ordered what |
| `waitlist` | people who tapped "notify me" on a sold item |
| `broadcasts` | record of drop messages sent |

Security rule: a seller can only ever touch rows where `seller_id` is her own.
Buyers are never logged in, so buyer writes (customer, order, waitlist) go
through server routes using the service role key.

## Build order

- [x] **Phase 1** -- setup, schema, auth plumbing
- [x] **Phase 2** -- store setup + product CRUD + photo upload
- [x] **Phase 3** -- public storefront + WhatsApp order button
- [x] **Phase 4** -- buyer capture into customers/orders
- [x] **Phase 5** -- sold + waitlist + broadcast composer
- [ ] **Phase 6** -- mobile polish, onboard 5 test sellers
- [ ] **Phase 7** -- Paystack billing

Build mobile-first. Sellers work from mid-range Android phones, not laptops.
