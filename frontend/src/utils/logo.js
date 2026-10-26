/**
 * Helper logo/avatar pengguna.
 * - getInitials: fallback huruf awal nama usaha saat belum ada logo.
 * - readLogoFile: baca file gambar, kecilkan ke 256x256, simpan sebagai data URL
 *   supaya aman dimasukkan ke localStorage (tidak cepat penuh).
 */

export const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB
const LOGO_OUTPUT_SIZE = 256;

const LEGAL_PREFIX = /^(cv|pt|ud|pd|koperasi|firma|fa)\.?$/i;

export function getInitials(name = '') {
  const clean = String(name).trim();
  if (!clean) return 'NB';

  const words = clean.split(/\s+/).filter(Boolean);
  const meaningful = words.filter((word) => !LEGAL_PREFIX.test(word));
  const picked = meaningful.length ? meaningful : words;

  if (picked.length === 1) return picked[0].slice(0, 2).toUpperCase();
  return `${picked[0][0]}${picked[1][0]}`.toUpperCase();
}

export function validateLogoFile(file) {
  if (!file) throw new Error('Pilih file logo terlebih dahulu.');
  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('File logo harus berupa gambar (PNG, JPG, WebP, atau SVG).');
  }
  if (file.size > MAX_LOGO_SIZE) {
    throw new Error('Ukuran logo maksimal 5 MB.');
  }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file logo.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('File gambar tidak bisa dibuka.'));
    img.src = src;
  });
}

export async function readLogoFile(file) {
  validateLogoFile(file);

  const raw = await readAsDataUrl(file);

  // SVG / gambar yang gagal di-render tetap dipakai apa adanya.
  try {
    const img = await loadImage(raw);
    const size = LOGO_OUTPUT_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return raw;

    // object-fit: cover -> isi lingkaran tanpa gambar gepeng.
    const scale = Math.max(size / img.width, size / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    ctx.drawImage(img, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);

    return canvas.toDataURL('image/webp', 0.9);
  } catch (_) {
    return raw;
  }
}
