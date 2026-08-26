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
```bash
npm run dev
```
http://localhost:3000

## Project layout

```
supabase/schema.sql        tables, security rules, storage bucket
src/lib/types.ts           TypeScript shapes of each table
src/lib/supabase/
  client.ts                for Client Components
  server.ts                for Server Components / Actions (respects RLS)
  admin.ts                 service role -- server only, for buyer writes
src/middleware.ts          refreshes login sessions, guards /dashboard
```

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
- [ ] **Phase 2** -- store setup + product CRUD + photo upload
- [ ] **Phase 3** -- public storefront + WhatsApp order button
- [ ] **Phase 4** -- buyer capture into customers/orders
- [ ] **Phase 5** -- sold + waitlist + broadcast composer
- [ ] **Phase 6** -- mobile polish, onboard 5 test sellers
- [ ] **Phase 7** -- Paystack billing

Build mobile-first. Sellers work from mid-range Android phones, not laptops.
