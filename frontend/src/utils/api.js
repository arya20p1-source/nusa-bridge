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

export function apiUrl(path = '') {
  if (!API_BASE) return path || '/';
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
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

  return fetch(apiUrl(path), {
    ...options,
    headers,
  });
}
