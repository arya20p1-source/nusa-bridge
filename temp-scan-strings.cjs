const fs = require('fs');
const path = require('path');

const root = 'frontend/src';
const wordRe = /\b(dan|yang|untuk|dengan|atau|tidak|belum|sudah|akan|dari|pada|adalah|ini|itu|bisa|dapat|Anda|anda|saya|kami|kita|produk|harga|pesan|kirim|masuk|keluar|daftar|lihat|selengkapnya|kembali|halaman|unggulan|tersedia|tambah|hapus|simpan|atur|bahasa|inggris|indonesia|cari|semua|pilih|kosong|wajib|harus|gratis|paling|baru|jumlah|total|kategori|asal|waktu|hari|bulan|tahun|menit|jam)\b/i;
const skip = /(translations\.js|products\.js|solusiReply\.js|smartReply\.js|aiText\.js|downloadHtmlFile\.js)$/;

const out = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.jsx?$/.test(e.name) || skip.test(p)) continue;
    const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
    lines.forEach((l, i) => {
      const t = l.trim();
      if (!t || t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
      if (/<T\s+k=/.test(l)) return;
      if (/t\('/.test(l)) return;
      if (wordRe.test(l) && t.length > 20) out.push(`${p}:${i + 1}: ${t.slice(0, 160)}`);
    });
  }
}
walk(root);
console.log(out.join('\n'));
console.log('\nTOTAL:', out.length);
