-- ==========================================================================
-- NUSABRIDGE - SUPABASE DATABASE SCHEMA
-- File: database/schema.sql
--
-- CARA PAKAI:
-- 1. Buka dashboard Supabase -> SQL Editor -> New query
-- 2. Tempel SELURUH isi file ini, lalu klik "Run"
-- 3. Setelah sukses, jalankan database/seed.sql (data contoh)
--
-- CATATAN PENTING:
-- - File ini TIDAK menghapus data. Tabel yang sudah ada hanya ditambah
--   kolom yang belum ada.
-- - Jika tabel lama kamu punya struktur yang jauh berbeda (mis. kolom id
--   bertipe uuid, atau kolom wajib/not null yang tidak dipakai aplikasi),
--   hapus dulu tabel itu lewat Table Editor (pastikan kosong), lalu Run lagi.
--
-- RESET CEPAT (hapus 4 tabel lalu buat ulang) - HANYA jika datanya kosong:
-- drop table if exists public.login cascade;
-- drop table if exists public.products cascade;
-- drop table if exists public.orderan cascade;
-- drop table if exists public.transactions cascade;
-- ==========================================================================

-- ==========================================================================
-- 1. LOGIN (akun pengguna)
-- ==========================================================================
create table if not exists public.login (
  id          text primary key,
  name        text,
  email       text unique,
  company     text,
  role        text,
  nib         text,
  npwp        text,
  status      text,
  plan        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

alter table public.login add column if not exists name       text;
alter table public.login add column if not exists email      text;
alter table public.login add column if not exists company    text;
alter table public.login add column if not exists role       text;
alter table public.login add column if not exists nib        text;
alter table public.login add column if not exists npwp       text;
alter table public.login add column if not exists status     text;
alter table public.login add column if not exists plan       text;
alter table public.login add column if not exists created_at timestamptz not null default now();
alter table public.login add column if not exists updated_at timestamptz;

-- ==========================================================================
-- 2. PRODUCTS (katalog produk ekspor)
-- ==========================================================================
create table if not exists public.products (
  id                 text primary key,
  name               text,
  category           text,
  price              numeric,
  unit               text,
  moq                numeric,
  origin             text,
  hs_code            text,
  image              text,
  description        text,
  specs              jsonb default '[]'::jsonb,
  certs              jsonb default '[]'::jsonb,
  shipping           text,
  verified_exporter  boolean default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz
);

alter table public.products add column if not exists name              text;
alter table public.products add column if not exists category          text;
alter table public.products add column if not exists price             numeric;
alter table public.products add column if not exists unit              text;
alter table public.products add column if not exists moq               numeric;
alter table public.products add column if not exists origin            text;
alter table public.products add column if not exists hs_code           text;
alter table public.products add column if not exists image             text;
alter table public.products add column if not exists description       text;
alter table public.products add column if not exists specs             jsonb default '[]'::jsonb;
alter table public.products add column if not exists certs             jsonb default '[]'::jsonb;
alter table public.products add column if not exists shipping          text;
alter table public.products add column if not exists verified_exporter boolean default true;
alter table public.products add column if not exists created_at        timestamptz not null default now();
alter table public.products add column if not exists updated_at        timestamptz;

-- ==========================================================================
-- 3. ORDERAN (RFQ / pesanan masuk)
-- ==========================================================================
create table if not exists public.orderan (
  id                text primary key,
  buyer_name        text,
  buyer_company     text,
  buyer_email       text,
  buyer_country     text,
  product_id        text,
  product_name      text,
  quantity          numeric,
  unit              text,
  target_incoterms  text,
  target_price_usd  numeric,
  total_value_usd   numeric,
  status            text,
  ai_analysis       jsonb,
  process           jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz
);

alter table public.orderan add column if not exists buyer_name       text;
alter table public.orderan add column if not exists buyer_company    text;
alter table public.orderan add column if not exists buyer_email      text;
alter table public.orderan add column if not exists buyer_country    text;
alter table public.orderan add column if not exists product_id       text;
alter table public.orderan add column if not exists product_name     text;
alter table public.orderan add column if not exists quantity         numeric;
alter table public.orderan add column if not exists unit             text;
alter table public.orderan add column if not exists target_incoterms text;
alter table public.orderan add column if not exists target_price_usd numeric;
alter table public.orderan add column if not exists total_value_usd  numeric;
alter table public.orderan add column if not exists status           text;
alter table public.orderan add column if not exists ai_analysis      jsonb;
alter table public.orderan add column if not exists process          jsonb not null default '[]'::jsonb;
alter table public.orderan add column if not exists created_at       timestamptz not null default now();
alter table public.orderan add column if not exists updated_at       timestamptz;

-- ==========================================================================
-- 4. TRANSACTIONS (kontrak & escrow)
-- ==========================================================================
create table if not exists public.transactions (
  id                  text primary key,
  contract_no         text,
  exporter            text,
  buyer               text,
  product             text,
  volume              text,
  incoterms           text,
  contract_value_usd  numeric,
  escrow_stages       jsonb default '[]'::jsonb,
  vessel_name         text,
  eta                 text,
  status              text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz
);

alter table public.transactions add column if not exists contract_no        text;
alter table public.transactions add column if not exists exporter           text;
alter table public.transactions add column if not exists buyer              text;
alter table public.transactions add column if not exists product            text;
alter table public.transactions add column if not exists volume             text;
alter table public.transactions add column if not exists incoterms          text;
alter table public.transactions add column if not exists contract_value_usd numeric;
alter table public.transactions add column if not exists escrow_stages      jsonb default '[]'::jsonb;
alter table public.transactions add column if not exists vessel_name        text;
alter table public.transactions add column if not exists eta                text;
alter table public.transactions add column if not exists status             text;
alter table public.transactions add column if not exists created_at         timestamptz not null default now();
alter table public.transactions add column if not exists updated_at         timestamptz;

-- ==========================================================================
-- 5. INDEX (mempercepat pencarian)
-- ==========================================================================
create index if not exists products_category_idx on public.products (category);
create index if not exists products_name_idx     on public.products (name);
create index if not exists login_email_idx       on public.login (lower(email));
create index if not exists orderan_status_idx    on public.orderan (status);
create index if not exists orderan_created_idx   on public.orderan (created_at desc);
create index if not exists transactions_created_idx on public.transactions (created_at desc);

-- ==========================================================================
-- 6. KEAMANAN (RLS)
-- Backend memakai SERVICE ROLE KEY yang otomatis melewati RLS.
-- Dengan RLS aktif dan tanpa policy, anon key TIDAK bisa membaca data.
-- ==========================================================================
alter table public.login        enable row level security;
alter table public.products     enable row level security;
alter table public.orderan      enable row level security;
alter table public.transactions enable row level security;

-- ==========================================================================
-- 7. RELOAD SCHEMA CACHE (agar REST API langsung mengenali tabel baru)
-- ==========================================================================
notify pgrst, 'reload schema';
