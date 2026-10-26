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
