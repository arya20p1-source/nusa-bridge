/**
 * ==========================================================================
 * NUSABRIDGE - GENERATOR SQL LANJUTAN
 * File: database/generate-lanjutan.js
 *
 * Menghasilkan database/lanjutan.sql dari schema.sql + seed.sql.
 *
 * Bedanya dengan reset-supabase.sql:
 *   - TIDAK menghapus tabel yang sudah ada
 *   - Memakai "create table if not exists" dan "create index if not exists"
 *   - Aman dijalankan ulang
 *   - Tetap membuat 28 tabel, index, trigger, RLS, dan data contoh
 *
 * Jalankan: node database/generate-lanjutan.js
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');

const dir = __dirname;
const schema = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');
const seed = fs.readFileSync(path.join(dir, 'seed.sql'), 'utf8');

// --------------------------------------------------------------------------
// 1. DDL tabel + index (bagian 2 di schema.sql)
// --------------------------------------------------------------------------
const ddlStart = schema.indexOf('-- 2.1 USERS');
const ddlEnd = schema.indexOf(
  '-- ==========================================================================\n-- 3. TRIGGER'
);

if (ddlStart === -1 || ddlEnd === -1) {
  throw new Error('Bagian DDL tidak ditemukan di schema.sql');
}

let ddl = schema.slice(ddlStart, ddlEnd).trimEnd();

ddl = ddl
  .replace(/^create table public\./gm, 'create table if not exists public.')
  .replace(/^create unique index /gm, 'create unique index if not exists ')
  .replace(/^create index /gm, 'create index if not exists ');

// --------------------------------------------------------------------------
// 2. Trigger updated_at (bagian 3 di schema.sql)
// --------------------------------------------------------------------------
const triggerStart = schema.indexOf(
  'create or replace function public.set_updated_at'
);
const triggerEnd = schema.indexOf(
  '-- ==========================================================================\n-- 4. ROW LEVEL SECURITY'
);

if (triggerStart === -1 || triggerEnd === -1) {
  throw new Error('Bagian trigger tidak ditemukan di schema.sql');
}

let triggers = schema.slice(triggerStart, triggerEnd).trimEnd();

triggers = triggers.replace(
  /create trigger (\w+) before update on (public\.\w+)/g,
  'drop trigger if exists $1 on $2;\ncreate trigger $1 before update on $2'
);

// --------------------------------------------------------------------------
// 3. RLS (bagian 4 di schema.sql)
// --------------------------------------------------------------------------
const rlsStart = schema.indexOf(
  'alter table public.users               enable row level security;'
);
const rlsEnd = schema.indexOf(
  '-- ==========================================================================\ncommit;'
);

if (rlsStart === -1 || rlsEnd === -1) {
  throw new Error('Bagian RLS tidak ditemukan di schema.sql');
}

let rls = schema.slice(rlsStart, rlsEnd).trimEnd();

rls = rls.replace(
  /create policy ("[^"]+")\s*\n\s*on (public\.\w+)/g,
  'drop policy if exists $1 on $2;\ncreate policy $1\n  on $2'
);

// --------------------------------------------------------------------------
// 4. Seed data (isi seed.sql tanpa begin/commit)
// --------------------------------------------------------------------------
let seedBody = seed.slice(seed.indexOf('begin;') + 'begin;'.length);
seedBody = seedBody.slice(0, seedBody.lastIndexOf('commit;')).trim();

// --------------------------------------------------------------------------
// 5. Susun file akhir
// --------------------------------------------------------------------------
const out = `-- ==========================================================================
-- NUSABRIDGE - SQL LANJUTAN (LENGKAPI 28 TABEL TANPA HAPUS DATA LAMA)
-- File: database/lanjutan.sql
--
-- CARA PAKAI:
--   1. Buka Supabase -> SQL Editor -> New query
--   2. Copy SELURUH isi file ini
--   3. Klik Run
--   4. Jalankan: select table_name from information_schema.tables
--      where table_schema = 'public' order by table_name;
--
-- FILE INI AMAN:
--   - Tidak menghapus tabel yang sudah ada
--   - Memakai "create table if not exists"
--   - Bisa dijalankan ulang tanpa error
--
-- Isi:
--   - 28 tabel: 4 tabel inti (users, products, rfqs, transactions)
--     + 24 tabel pendukung (plans, vouchers, shipments, dst.)
--   - Index, trigger updated_at, dan RLS
--   - Data contoh: 50 produk, 3 akun, 2 RFQ, 1 transaksi, escrow, dll.
-- ==========================================================================

begin;

-- ==========================================================================
-- 1. TABEL + INDEX
-- ==========================================================================

${ddl}

-- ==========================================================================
-- 2. TRIGGER UPDATED_AT
-- ==========================================================================

${triggers}

-- ==========================================================================
-- 3. ROW LEVEL SECURITY
-- ==========================================================================

${rls}

-- ==========================================================================
-- 4. HAK AKSES (grant)
-- ==========================================================================

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- ==========================================================================
-- 5. DATA CONTOH
-- ==========================================================================

${seedBody}

commit;

notify pgrst, 'reload schema';

-- Selesai.
`;

fs.writeFileSync(path.join(dir, 'lanjutan.sql'), out);

console.log('OK: ' + path.join(dir, 'lanjutan.sql'));
console.log('Baris: ' + out.split('\n').length);
console.log('Tabel: ' + (out.match(/create table if not exists public\./g) || []).length);
console.log('Index: ' + (out.match(/create (unique )?index if not exists /g) || []).length);
console.log('Trigger: ' + (out.match(/create trigger /g) || []).length);
console.log('Policy: ' + (out.match(/create policy /g) || []).length);
console.log('Insert: ' + (out.match(/insert into public\./g) || []).length);
