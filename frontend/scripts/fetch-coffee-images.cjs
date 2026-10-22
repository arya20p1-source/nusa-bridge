/**
 * Script sekali-pakai: mencari & mengunduh foto kopi asli dari Wikimedia
 * Commons (File namespace), dinormalkan ke webp 480x316.
 * Jalankan:  node scripts/fetch-coffee-images.cjs   (dari folder frontend/)
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'products');
const API = 'https://commons.wikimedia.org/w/api.php';

// [nama file output, daftar query pencarian Commons (diurutkan prioritas)]
const TARGETS = [
  ['kopi-12', ['coffee plantation Indonesia', 'coffee farm terrace', 'coffee plantation']],
  ['kopi-13', ['roasted coffee beans', 'coffee beans roasted close up', 'coffee beans']],
  ['kopi-14', ['green coffee beans raw', 'raw coffee beans drying', 'unroasted coffee']],
  ['kopi-15', ['coffee cherries harvest', 'coffee cherries red', 'coffea arabica cherries']],
  ['kopi-16', ['coffee drying beds', 'coffee beans drying sun', 'coffee drying']],
  ['kopi-17', ['coffee sacks beans', 'jute bag coffee beans', 'coffee bags']],
  ['kopi-18', ['coffee grinder beans', 'ground coffee espresso', 'coffee portafilter']],
  ['kopi-19', ['coffee cup latte art', 'coffee cup overhead', 'espresso cup']],
  ['kopi-20', ['coffee roaster machine', 'coffee roasting', 'coffee roaster']],
];

async function searchCommonsFile(query) {
  const s = await fetch(`${API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json`).then((r) => r.json());
  const hits = (s.query && s.query.search) || [];
  for (const hit of hits) {
    // Lewati SVG / peta / berkas non-foto
    if (/\.(svg|svg\.png|pdf|gif)$/i.test(hit.title)) continue;
    const titles = encodeURIComponent(hit.title);
    const p = await fetch(`${API}?action=query&titles=${titles}&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json`).then((r) => r.json());
    const pages = p.query && p.query.pages;
    if (pages) {
      const first = Object.values(pages)[0];
      if (first && first.imageinfo && first.imageinfo[0] && first.imageinfo[0].thumburl) {
        return { title: hit.title.replace(/^File:/, ''), url: first.imageinfo[0].thumburl };
      }
    }
  }
  return null;
}

async function main() {
  const log = [];
  for (const [name, queries] of TARGETS) {
    // Jeda kecil antar target agar kena rate-limit Wikimedia
    await new Promise((r) => setTimeout(r, 900));
    let info = null;
    for (const q of queries) {
      try { info = await searchCommonsFile(q); } catch (e) { info = null; }
      if (info) break;
    }
    if (!info) { log.push(`${name}.webp  GAGAL (${queries[0]})`); continue; }
    const buf = Buffer.from(await fetch(info.url).then((r) => r.arrayBuffer()));
    const out = await sharp(buf)
      .resize(480, 316, { fit: 'cover', kernel: 'lanczos3' })
      .sharpen({ sigma: 0.8 })
      .webp({ quality: 84 })
      .toBuffer();
    const tmp = path.join(OUT_DIR, `${name}.tmp.webp`);
    fs.writeFileSync(tmp, out);
    fs.renameSync(tmp, path.join(OUT_DIR, `${name}.webp`));
    log.push(`${name}.webp  <- "${info.title}"`);
  }
  console.log(log.join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
