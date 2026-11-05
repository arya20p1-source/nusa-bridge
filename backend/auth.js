/**
 * ==========================================================================
 * NUSABRIDGE - AUTHENTICATION & AUTHORIZATION CORE
 * File: auth.js
 *
 * - Token sesi ditandatangani HMAC-SHA256 (server-side), bukan token palsu.
 * - Setiap request yang membawa token akan memuat ulang user dari database,
 *   sehingga perubahan role/status langsung berlaku dan role tidak bisa
 *   dipalsukan dari frontend.
 * - Menyediakan middleware requireAuth / requireRole untuk RBAC.
 * ==========================================================================
 */

const crypto = require('crypto');
const db = require('./database/db');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 hari
const RFQ_ACCESS_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 hari

// Utamakan AUTH_SECRET dari environment. Jika belum diisi, turunkan kunci
// stabil dari service key Supabase agar token tidak berubah setiap restart.
const RAW_SECRET =
  process.env.AUTH_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'nusabridge-development-secret';
const AUTH_SECRET = crypto.createHash('sha256').update(String(RAW_SECRET)).digest();
const RFQ_ACCESS_SECRET = crypto
  .createHash('sha256')
  .update(`${RAW_SECRET}:rfq-access`)
  .digest();

if (!process.env.AUTH_SECRET) {
  console.warn(
    '[Auth] AUTH_SECRET belum diatur. Token memakai kunci turunan dari SUPABASE_SERVICE_ROLE_KEY. ' +
      'Sebaiknya isi AUTH_SECRET di backend/.env untuk produksi.'
  );
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function fromBase64url(input) {
  return Buffer.from(String(input), 'base64url').toString('utf8');
}

function signPayload(payloadObject, secret) {
  const payload = base64url(JSON.stringify(payloadObject));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifyPayload(token, secret) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    givenBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(givenBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64url(payload));
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.exp && Date.now() > Number(parsed.exp)) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function normalizeAccountRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (['seller', 'exporter', 'eksportir', 'penjual'].includes(value)) return 'seller';
  if (['buyer', 'importer', 'importir', 'pembeli'].includes(value)) return 'buyer';
  if (['admin', 'administrator'].includes(value)) return 'admin';
  return value;
}

function roleOf(user) {
  return normalizeAccountRole(user && user.role) || 'guest';
}

function createToken(user) {
  const role = roleOf(user);
  return signPayload(
    {
      kind: 'session',
      sub: String(user.id),
      role,
      iat: Date.now(),
      exp: Date.now() + TOKEN_TTL_MS,
    },
    AUTH_SECRET
  );
}

function verifyToken(token) {
  const payload = verifyPayload(token, AUTH_SECRET);
  if (!payload || payload.kind !== 'session' || !payload.sub) return null;
  return payload;
}

function createRfqAccessToken(rfqId) {
  return signPayload(
    {
      kind: 'rfq-access',
      sub: String(rfqId),
      iat: Date.now(),
      exp: Date.now() + RFQ_ACCESS_TTL_MS,
    },
    RFQ_ACCESS_SECRET
  );
}

function verifyRfqAccessToken(token, rfqId) {
  const payload = verifyPayload(token, RFQ_ACCESS_SECRET);
  if (!payload || payload.kind !== 'rfq-access') return false;
  return String(payload.sub) === String(rfqId);
}

function extractToken(req) {
  const header = req.get ? req.get('authorization') || '' : '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (match) return match[1].trim();

  const alt = req.get ? req.get('x-auth-token') : '';
  if (alt) return String(alt).trim();

  return '';
}

/**
 * Middleware opsional: mengisi req.auth bila token valid.
 * Token tidak valid TIDAK otomatis dianggap user lain; request tetap anonim
 * dan endpoint yang dilindungi akan menolaknya lewat requireAuth.
 */
async function authenticate(req, res, next) {
  req.auth = null;
  req.authToken = '';
  req.authInvalid = false;
  req.authError = null;

  const token = extractToken(req);
  if (!token) return next();

  req.authToken = token;
  const payload = verifyToken(token);
  if (!payload) {
    req.authInvalid = true;
    return next();
  }

  try {
    const user = await db.findById('users', payload.sub);
    if (!user || user.deletedAt) {
      req.authInvalid = true;
      return next();
    }
    if (String(user.status || '').toLowerCase() === 'suspended') {
      req.authInvalid = true;
      return next();
    }
    req.auth = user;
  } catch (err) {
    req.authError = err;
  }

  return next();
}

function requireAuth(req, res, next) {
  if (req.auth) return next();

  if (req.authError) {
    return res.status(503).json({
      success: false,
      code: 'AUTH_UNAVAILABLE',
      message: 'Layanan autentikasi sedang tidak tersedia. Coba lagi.',
    });
  }

  return res.status(401).json({
    success: false,
    code: req.authInvalid ? 'INVALID_TOKEN' : 'AUTH_REQUIRED',
    message: req.authInvalid
      ? 'Sesi tidak valid atau sudah kedaluwarsa. Silakan masuk kembali.'
      : 'Anda harus masuk terlebih dahulu untuk mengakses data ini.',
  });
}

function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map(normalizeAccountRole).filter(Boolean);
  return (req, res, next) => {
    if (!req.auth) return requireAuth(req, res, next);
    if (!allowed.includes(roleOf(req.auth))) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: 'Role akun Anda tidak memiliki hak akses untuk tindakan ini.',
      });
    }
    return next();
  };
}

// ---------------------------------------------------------------------------
// Password (opsional, untuk akun yang memang mengatur password / admin)
// ---------------------------------------------------------------------------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [scheme, salt, expected] = String(stored || '').split('$');
    if (scheme !== 'scrypt' || !salt || !expected) return false;
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actual = crypto.scryptSync(String(password), salt, expectedBuffer.length);
    return (
      expectedBuffer.length === actual.length &&
      crypto.timingSafeEqual(expectedBuffer, actual)
    );
  } catch (_) {
    return false;
  }
}

module.exports = {
  TOKEN_TTL_MS,
  RFQ_ACCESS_TTL_MS,
  normalizeAccountRole,
  roleOf,
  createToken,
  verifyToken,
  createRfqAccessToken,
  verifyRfqAccessToken,
  extractToken,
  authenticate,
  requireAuth,
  requireRole,
  hashPassword,
  verifyPassword,
};
