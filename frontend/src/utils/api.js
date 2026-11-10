/**
 * Base URL backend.
 *
 * - Localhost / deploy satu domain: biarkan kosong -> fetch('/api/...') lewat
 *   proxy Vite atau server Express yang juga menyajikan frontend.
 * - Deploy frontend & backend terpisah (Vercel + Render/Railway):
 *   isi VITE_API_URL, contoh: https://nusabridge-api.onrender.com
 */
const rawBase = import.meta.env.VITE_API_URL || '';

export const API_BASE = rawBase.trim().replace(/\/+$/, '');

// Backend demo lokal. Dipakai sebagai cadangan ketika frontend disajikan oleh
// hosting statis (GitHub Pages, Vercel, Netlify, Live Server, dan sejenisnya)
// yang tidak meneruskan /api ke Express. Hosting statis menjawab POST /api
// dengan 404/405, sehingga tanpa cadangan ini formulir seperti RFQ terlihat
// "tidak bisa" walaupun backend sebenarnya hidup di port 5000.
const LOCAL_BACKEND = 'http://localhost:5000';
const RUNTIME_BASE_KEY = 'nusabridge_api_base';

function runtimeBase() {
  try {
    const saved = localStorage.getItem(RUNTIME_BASE_KEY);
    return saved ? saved.trim().replace(/\/+$/, '') : '';
  } catch (_) {
    return '';
  }
}

function fallbackBase() {
  if (API_BASE) return '';
  const saved = runtimeBase();
  if (saved) return saved;
  if (typeof window === 'undefined') return '';

  const { hostname, port } = window.location;
  // Backend Express juga menyajikan frontend pada port yang sama.
  if (port === '5000') return '';
  // Vite dev/preview sudah punya proxy /api sendiri.
  const loopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (loopback && (port === '3000' || port === '4173')) return '';
  return LOCAL_BACKEND;
}

export function apiUrl(path = '') {
  if (!API_BASE) return path || '/';
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function joinBase(base, path = '') {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

// Status yang menandakan permintaan tidak pernah sampai ke Express: hosting
// statis membalas 404/405, sedangkan proxy membalas 502/503/504 saat backend
// mati. Status bisnis dari backend (400/401/403/409/422) tidak diulang.
const UNREACHABLE_STATUS = new Set([404, 405, 502, 503, 504]);

function isUnreachableResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  // Respons JSON tetap berasal dari Express, jadi error bisnis seperti 404
  // "RFQ tidak ditemukan" tidak boleh diulang ke backend lain.
  if (contentType.includes('application/json')) return false;
  return UNREACHABLE_STATUS.has(response.status) || contentType.includes('text/html');
}

/**
 * Fetch ke API dengan cadangan otomatis ke backend lokal.
 *
 * Urutan: VITE_API_URL (bila diisi) -> origin saat ini -> backend lokal.
 * Cadangan hanya dipakai saat server tampak tidak menjangkau Express, jadi
 * error valid dari backend tetap dikembalikan apa adanya.
 */
export async function apiFetch(path, options = {}) {
  const primaryUrl = apiUrl(path);
  const altBase = fallbackBase();
  const altUrl = altBase ? joinBase(altBase, path) : '';

  try {
    const response = await fetch(primaryUrl, options);
    if (!altUrl || altUrl === primaryUrl) return response;
    // Netlify/Live Server kadang membalas 200 berisi index.html untuk POST
    // /api. Respons seperti itu tidak mungkin berasal dari Express.
    if (!isUnreachableResponse(response)) return response;
    return await fetch(altUrl, options);
  } catch (error) {
    if (!altUrl || altUrl === primaryUrl) throw error;
    return fetch(altUrl, options);
  }
}

const SESSION_KEY = 'nusabridge_session';

/** Ambil token sesi asli yang disimpan AppContext setelah login backend. */
export function getAuthToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return '';
    const session = JSON.parse(raw);
    return session && typeof session.token === 'string' ? session.token : '';
  } catch (_) {
    return '';
  }
}

/**
 * Fetch ke API dengan menambahkan Authorization: Bearer <token> bila ada.
 * Header ini tidak pernah dipakai untuk menentukan role di frontend; server
 * tetap memuat ulang user dari database.
 */
export async function authFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return apiFetch(path, {
    ...options,
    headers,
  });
}
