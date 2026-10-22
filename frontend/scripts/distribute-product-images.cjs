/**
 * Script sekali-pakai: sebar ulang gambar 120 produk agar tidak berulang
 * berdekatan. Tiap kategori (30 produk) kini memutar 10 varian gambar
 * round-robin -> tiap gambar maksimal 3x, dan produk bersebelahan
 * selalu memakai gambar berbeda.
 * Jalankan:  node scripts/distribute-product-images.cjs   (dari folder frontend/)
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'data', 'products.js');
const src = fs.readFileSync(FILE, 'utf8');

// Eksekusi isi file (ESM export -> variable lokal) untuk mengambil datanya
const header = src.slice(0, src.indexOf('export const PRODUCTS_DATA'));
const body = src.slice(src.indexOf('export const PRODUCTS_DATA'));
const replaced = body.replace('export const PRODUCTS_DATA', 'var PRODUCTS_DATA');
const PRODUCTS_DATA = new Function(
  `${replaced}; return PRODUCTS_DATA;`
)();

// Pemetaan katalog kategori -> keluarga aset gambar
const FAMILY = {
  kopi: 'kopi',
  rempah: 'rempah',
  kriya: 'kriya',
  tekstil: 'tekstil',
  makanan: 'makanan',
  lainnya: 'perkebunan',
};

const counters = {};
const before = {};
const after = [];

const data = PRODUCTS_DATA.map((p, i) => {
  const fam = FAMILY[p.category] || 'perkebunan';
  counters[fam] = counters[fam] == null ? 0 : counters[fam];
  const n = (counters[fam] % 10) + 1; // round-robin 1..10
  counters[fam]++;
  before[p.image] = (before[p.image] || 0) + 1;
  const img = `/assets/products/${fam}-${n}.webp`;
  after.push(img);
  return { ...p, image: img };
});

const headerText = header || '/**\n * NUSABRIDGE - 120 PRODUK KOMODITAS EKSPOR TERVERIFIKASI KYC HUB\n * Kategori: Kopi Ekspor (30), Rempah & Hasil Alam (30), Kriya (30), Tekstil (30)\n */\n';
fs.writeFileSync(FILE, `${headerText}export const PRODUCTS_DATA = ${JSON.stringify(data, null, 2)};\n`, 'utf8');

const uniq = new Set(after).size;
const dist = {};
after.forEach((a) => { dist[a] = (dist[a] || 0) + 1; });
const overlaps = Object.entries(dist).filter(([, c]) => c > 3);
console.log(`Total produk: ${data.length}`);
console.log(`Gambar unik terpakai: ${uniq}`);
console.log(`Gambar dipakai >3x: ${overlaps.length}`);
console.log(`Sebelumnya (contoh 3 terbanyak): ${Object.entries(before).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} x${v}`).join(', ')}`);
