/**
 * Cek koneksi backend Express -> Supabase.
 * Jalankan: npm run db:check
 */
require('dotenv').config();

const db = require('./db-supabase');

(async () => {
  const tables = ['users', 'products', 'rfq', 'transactions'];
  let failed = 0;
  let productCount = 0;

  for (const table of tables) {
    try {
      const rows = await db.read(table);
      console.log(`OK    ${table.padEnd(13)} -> ${rows.length} baris`);
      if (table === 'products') productCount = rows.length;
    } catch (err) {
      failed += 1;
      console.error(`GAGAL ${table.padEnd(13)} -> ${err.message}`);
    }
  }

  if (productCount === 0) {
    failed += 1;
    console.error('GAGAL products      -> katalog kosong; jalankan database/setup.sql untuk memuat data awal.');
  }

  if (failed) {
    console.error('\nPastikan tabel dan data awal tersedia dengan menjalankan database/setup.sql');
    console.error('di Supabase SQL Editor, lalu jalankan ulang npm run db:check.');
    process.exit(1);
  }

  console.log('\nSupabase terhubung, semua tabel tersedia, dan katalog produk sudah terisi.');
})();
