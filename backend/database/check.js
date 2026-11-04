/**
 * Cek koneksi backend Express -> Supabase.
 * Jalankan: npm run db:check
 */
require('dotenv').config();

const db = require('./db-supabase');

(async () => {
  const tables = Object.keys(db.TABLES);
  let failed = 0;
  let productCount = 0;

  for (const table of tables) {
    try {
      const rows = await db.read(table);
      console.log(`OK    ${table.padEnd(22)} -> ${rows.length} baris`);
      if (table === 'products') productCount = rows.length;
    } catch (err) {
      failed += 1;
      console.error(`GAGAL ${table.padEnd(22)} -> ${err.message}`);
    }
  }

  if (productCount === 0) {
    failed += 1;
    console.error('GAGAL products              -> katalog kosong; jalankan database/lanjutan.sql untuk memuat data awal.');
  }

  if (failed) {
    console.error('\nPastikan tabel dan data awal tersedia dengan menjalankan database/lanjutan.sql');
    console.error('di Supabase SQL Editor, lalu jalankan ulang npm run db:check.');
    console.error('Jika database masih kosong dan ingin mulai dari nol, pakai database/reset-supabase.sql.');
    process.exit(1);
  }

  console.log('\nSupabase terhubung, semua tabel tersedia, dan katalog produk sudah terisi.');
})();
