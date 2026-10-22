/**
 * Script sekali-pakai: men-generate 10 varian visual yang benar-benar berbeda
 * per kategori (dari 1 foto dasar), supaya 30 produk per kategori tidak
 * menampilkan foto identik berulang.
 * Variasi: hue + saturasi + terang + zoom/crop anchor + flip.
 * Jalankan:  node scripts/generate-product-images.cjs   (dari folder frontend/)
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC_DIR = path.join(__dirname, '..', 'public', 'assets', 'products');
const CATEGORIES = ['kopi', 'rempah', 'kriya', 'tekstil', 'makanan', 'perkebunan'];

// 10 resep varian (indeks 1..10) — makin jauh urutannya makin kontras bedanya
const RECEPTS = [
  { n: 1,  hue: 0,   sat: 1.0,  bri: 1.0,  flip: false, zoom: 1.0,  anchor: 'C' },
  { n: 2,  hue: 18,  sat: 1.12, bri: 1.03, flip: true,  zoom: 1.06, anchor: 'C' },
  { n: 3,  hue: -32, sat: 1.05, bri: 0.94, flip: false, zoom: 1.1,  anchor: 'LT' },
  { n: 4,  hue: 12,  sat: 0.8,  bri: 1.12, flip: true,  zoom: 1.08, anchor: 'RB' },
  { n: 5,  hue: 45,  sat: 1.22, bri: 0.9,  flip: false, zoom: 1.14, anchor: 'C' },
  { n: 6,  hue: -20, sat: 1.18, bri: 1.06, flip: true,  zoom: 1.05, anchor: 'RT' },
  { n: 7,  hue: 80,  sat: 1.28, bri: 1.04, flip: false, zoom: 1.18, anchor: 'LB' },
  { n: 8,  hue: -60, sat: 0.9,  bri: 0.88, flip: true,  zoom: 1.12, anchor: 'C' },
  { n: 9,  hue: 25,  sat: 0.65, bri: 1.14, flip: false, zoom: 1.22, anchor: 'C' },
  { n: 10, hue: -85, sat: 1.35, bri: 0.85, flip: true,  zoom: 1.08, anchor: 'LT' },
];

async function main() {
  for (const cat of CATEGORIES) {
    const base = path.join(SRC_DIR, `${cat}-1.webp`);
    // Baca foto dasar ke buffer murni via fs (bukan via sharp) agar tidak ada
    // file descriptor terbuka yang bikin rename/overwrite kena EPERM Windows
    const baseBuf = fs.readFileSync(base);
    // Metadata pun dari buffer — sharp tidak pernah menyentuh file ini
    const meta = await sharp(baseBuf).metadata();

    for (const r of RECEPTS) {
      let pipe = sharp(baseBuf);
      if (r.zoom > 1) {
        const wr = Math.max(16, Math.floor(meta.width / r.zoom));
        const hr = Math.max(16, Math.floor(meta.height / r.zoom));
        let left = 0, top = 0;
        if (r.anchor === 'C')  { left = Math.floor((meta.width - wr) / 2); top = Math.floor((meta.height - hr) / 2); }
        if (r.anchor === 'LT') { left = 0; top = 0; }
        if (r.anchor === 'RB') { left = meta.width - wr; top = meta.height - hr; }
        if (r.anchor === 'RT') { left = meta.width - wr; top = 0; }
        if (r.anchor === 'LB') { left = 0; top = meta.height - hr; }
        pipe = pipe.extract({ left, top, width: wr, height: hr });
      }
      pipe = pipe.modulate({ hue: r.hue, saturation: r.sat, brightness: r.bri });
      if (r.flip) pipe = pipe.flop();

      // Naikkan resolusi 4x (120x79 -> 480x316) + sharpen ringan agar
      // tidak blur saat ditampilkan besar di kartu katalog
      const outW = meta.width * 4;
      const outH = meta.height * 4;
      pipe = pipe.resize(outW, outH, { fit: 'cover', kernel: 'lanczos3' }).blur(0.4).sharpen({ sigma: 1.1, m1: 0.8, m2: 0.4 });

      const buf = await pipe.webp({ quality: 82 }).toBuffer();
      // Tulis ke temp lalu rename — menhindari UNKNOWN saat menimpa file yang
      // sama/terkunci sesaat di Windows
      const tmp = path.join(SRC_DIR, `${cat}-${r.n}.tmp.webp`);
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, path.join(SRC_DIR, `${cat}-${r.n}.webp`));
    }
    console.log(`${cat}-1..10.webp selesai (base ${meta.width}x${meta.height})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
