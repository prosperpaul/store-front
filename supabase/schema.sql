-- ============================================================
-- social-storefront : database schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- SELLERS ----------
-- One row per seller. id matches the Supabase auth user id.
create table if not exists sellers (
  id            uuid primary key references auth.users(id) on delete cascade,
  slug          text unique not null,          -- yourapp.com/<slug>
  business_name text not null,
  whatsapp      text not null,                 -- full intl format, e.g. 2348012345678
  logo_url      text,
  delivery_note text,
  plan          text not null default 'trial',
  created_at    timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references sellers(id) on delete cascade,
  name        text not null,
  price       numeric(12,2) not null,
  size        text,
  category    text,                            -- used to match waitlist people
  description text,
  photos      text[] not null default '{}',
  status      text not null default 'available'
              check (status in ('available','sold','hidden')),
  created_at  timestamptz not null default now()
);
create index if not exists products_seller_idx on products (seller_id, status, created_at desc);

-- ---------- CUSTOMERS ----------
-- The asset. Captured automatically when a buyer places an order.
create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references sellers(id) on delete cascade,
  name          text,
  phone         text not null,
  opted_out     boolean not null default false, -- never message these people again
  first_seen    timestamptz not null default now(),
  last_order_at timestamptz,
  unique (seller_id, phone)
);
create index if not exists customers_seller_idx on customers (seller_id, last_order_at desc);

-- ---------- ORDERS ----------
create table if not exists orders (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references sellers(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  status      text not null default 'new'
              check (status in ('new','confirmed','paid','delivered','cancelled')),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists orders_seller_idx on orders (seller_id, created_at desc);

-- ---------- WAITLIST ----------
-- "Notify me when similar arrives" on a sold item.
create table if not exists waitlist (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references sellers(id) on delete cascade,
  product_id  uuid references products(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  notified_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (product_id, customer_id)
);

-- ---------- BROADCASTS ----------
create table if not exists broadcasts (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references sellers(id) on delete cascade,
  product_ids     uuid[] not null default '{}',
  message         text not null,
  recipient_count int not null default 0,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Rule: a seller only ever touches her own rows.
-- Buyers never write directly -- buyer writes go through our
-- server routes using the service role key.
-- ============================================================
alter table sellers    enable row level security;
alter table products   enable row level security;
alter table customers  enable row level security;
alter table orders     enable row level security;
alter table waitlist   enable row level security;
alter table broadcasts enable row level security;

-- Storefronts are public: anyone can read a seller and her live products.
drop policy if exists "public can view sellers" on sellers;
create policy "public can view sellers" on sellers
  for select using (true);

drop policy if exists "seller manages own row" on sellers;
create policy "seller manages own row" on sellers
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "public can view listed products" on products;
create policy "public can view listed products" on products
  for select using (status in ('available','sold'));

drop policy if exists "seller manages own products" on products;
create policy "seller manages own products" on products
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

-- Private tables: seller-only, no public access at all.
drop policy if exists "seller manages own customers" on customers;
create policy "seller manages own customers" on customers
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "seller manages own orders" on orders;
create policy "seller manages own orders" on orders
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "seller manages own waitlist" on waitlist;
create policy "seller manages own waitlist" on waitlist
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "seller manages own broadcasts" on broadcasts;
create policy "seller manages own broadcasts" on broadcasts
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

-- ---------- STORAGE ----------
-- Bucket for product photos. Public read, seller-only write.
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

drop policy if exists "public can view product photos" on storage.objects;
create policy "public can view product photos" on storage.objects
  for select using (bucket_id = 'product-photos');

drop policy if exists "seller uploads own photos" on storage.objects;
create policy "seller uploads own photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "seller deletes own photos" on storage.objects;
create policy "seller deletes own photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
