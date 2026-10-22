/**
 * Script sekali-pakai: menghapus produk yang memakai gambar kembar
 * dengan produk lain — sisanya 50 produk, semua gambar unik 1:1.
 *
 * Aturan keep:
 *  - kopi : 10 produk pertama (gambar kopi-1..10) + 10 kopi terbaru
 *            (id prod_kopi_131..140, gambar kopi-11..20)
 *  - lainnya: keep first-occurrence tiap gambar
 *
 * Jalankan:  node scripts/dedupe-products.cjs   (dari folder frontend/)
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'data', 'products.js');

const src = fs.readFileSync(FILE, 'utf8');
const header = src.slice(0, src.indexOf('export const PRODUCTS_DATA'));
const replaced = src.replace('export const PRODUCTS_DATA', 'var PRODUCTS_DATA');
const PRODUCTS_DATA = new Function(`${replaced}; return PRODUCTS_DATA;`)();

const seenImg = new Set();
const kept = [];

for (const p of PRODUCTS_DATA) {
  const img = path.basename(p.image);
  const isNewCoffee = p.id >= 'prod_kopi_131'; // string id unik utk kopi baru
  const isOldFirstTenCoffee = p.category === 'kopi' && /^kopi-([1-9]|10)\.webp$/.test(img);

  if (p.category === 'kopi') {
    if ((isOldFirstTenCoffee || isNewCoffee) && !seenImg.has(img)) {
      seenImg.add(img);
      kept.push(p);
    }
    // kopi di luar aturan di atas = kembar gambar → dihapus
  } else {
    if (!seenImg.has(img)) {
      seenImg.add(img);
      kept.push(p);
    }
  }
}

fs.writeFileSync(FILE, `${header}export const PRODUCTS_DATA = ${JSON.stringify(kept, null, 2)};\n`, 'utf8');

const byCat = {};
for (const p of kept) byCat[p.category] = (byCat[p.category] || 0) + 1;
console.log('Sisa produk:', kept.length, JSON.stringify(byCat));
console.log('Gambar unik terpakai:', new Set(kept.map((p) => p.image)).size);
