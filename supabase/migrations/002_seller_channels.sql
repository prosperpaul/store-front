-- ============================================================
-- Buyer-chosen contact channels
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- Handles for the other places a seller can be reached. All optional; a
-- storefront only shows buttons for the ones she has filled in.
alter table sellers add column if not exists instagram text;
alter table sellers add column if not exists facebook  text;
alter table sellers add column if not exists telegram  text;

-- Whether she'll take orders as a plain text message on her WhatsApp number.
alter table sellers add column if not exists accepts_sms boolean not null default false;

-- Which channel a buyer actually chose. Worth recording: it tells a seller
-- where her customers really are, which is the sort of thing she'd otherwise
-- only be guessing at.
alter table orders add column if not exists channel text not null default 'whatsapp'
  check (channel in ('whatsapp','sms','instagram','facebook','telegram'));
