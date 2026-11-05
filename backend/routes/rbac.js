/**
 * ==========================================================================
 * NUSABRIDGE - RBAC & ORDER MANAGEMENT ROUTES
 * File: routes/rbac.js
 *
 * Semua keputusan akses dilakukan di server:
 *   - buyer : hanya RFQ/transaksi miliknya sendiri.
 *   - seller: hanya produk & RFQ/transaksi dari toko miliknya.
 *   - admin : seluruh data + manajemen user dan verifikasi seller.
 *
 * Router ini dipasang di /api oleh server.js. Route publik katalog tetap
 * ditangani server.js, sedangkan route di bawah selalu memakai middleware
 * autentikasi (dan role) yang sesuai.
 * ==========================================================================
 */

const express = require('express');
const db = require('../database/db');
const { requireAuth, requireRole, hashPassword, normalizeAccountRole, roleOf } = require('../auth');
const {
  publicUser,
  isAdmin,
  isBuyer,
  isSeller,
  ownsProduct,
  buildProductIndex,
  rfqBuyerMatches,
  canViewRfq,
  canAccessTransaction,
  serializeRfq,
  serializeTransaction,
  writeAudit,
} = require('../authorization');
const {
  OrderError,
  INCOTERMS,
  buildProcess,
  createRfqIdempotent,
} = require('../order-service');

const router = express.Router();

const USER_ROLES = ['seller', 'buyer', 'admin'];
const USER_STATUSES = ['pending', 'verified', 'rejected', 'suspended'];
const PRODUCT_STATUSES = ['draft', 'published', 'archived'];
const RFQ_STATUSES = ['submitted', 'review', 'quoted', 'approved', 'rejected', 'cancelled'];
const FINAL_RFQ_STATUSES = ['approved', 'rejected', 'cancelled'];
const SELLER_RFQ_STATUSES = ['review', 'quoted', 'rejected'];

function httpError(status, code, message, extra = {}) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.extra = extra;
  return error;
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function sendError(res, status, code, message, extra = {}) {
  return res.status(status).json({ success: false, code, message, ...extra });
}

function parsePositiveInt(value, fallback, max = 1000) {
  const number = parseInt(value, 10);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(number, max);
}

function cleanText(value, maxLength) {
  return String(value === null || value === undefined ? '' : value)
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value) {
  return cleanText(value, 240).toLowerCase();
}

function isFinalRfqStatus(status) {
  return FINAL_RFQ_STATUSES.includes(String(status || '').toLowerCase());
}

// -------------------------------------------------------------------------
// PRODUK
// -------------------------------------------------------------------------
function parseNumberField(value, field, { min = 0, exclusiveMin = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || (exclusiveMin ? number <= min : number < min)) {
    throw httpError(
      400,
      'INVALID_PRODUCT_FIELD',
      `Nilai ${field} tidak valid.`
    );
  }
  return number;
}

function parseStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 40);
}

function collectProductUpdates(body, options = {}) {
  const { create = false, admin = false, user = null } = options;
  const input = body && typeof body === 'object' ? body : {};
  const updates = {};

  const requireText = (key, label, max) => {
    const value = cleanText(input[key], max);
    if (!value) {
      if (create || input[key] !== undefined) {
        throw httpError(400, 'INVALID_PRODUCT_FIELD', `${label} wajib diisi.`);
      }
      return;
    }
    updates[key] = value;
  };

  requireText('name', 'Nama produk', 200);
  requireText('category', 'Kategori', 80);
  requireText('unit', 'Satuan', 20);
  requireText('origin', 'Daerah asal', 120);

  if (create || input.price !== undefined) {
    if (input.price === undefined || input.price === null || input.price === '') {
      throw httpError(400, 'INVALID_PRODUCT_FIELD', 'Harga wajib diisi.');
    }
    updates.price = parseNumberField(input.price, 'price');
  }

  if (create || input.moq !== undefined) {
    if (input.moq === undefined || input.moq === null || input.moq === '') {
      throw httpError(400, 'INVALID_PRODUCT_FIELD', 'MOQ wajib diisi.');
    }
    updates.moq = parseNumberField(input.moq, 'moq', { min: 0, exclusiveMin: true });
  }

  if (input.currency !== undefined) {
    updates.currency = cleanText(input.currency, 10).toUpperCase() || 'USD';
  }
  if (input.hsCode !== undefined) updates.hsCode = cleanText(input.hsCode, 40) || null;
  if (input.image !== undefined) updates.image = cleanText(input.image, 500) || null;
  if (input.shipping !== undefined) updates.shipping = cleanText(input.shipping, 200) || null;
  if (input.portOfLoading !== undefined) {
    updates.portOfLoading = cleanText(input.portOfLoading, 120) || null;
  }
  if (input.incoterms !== undefined) {
    const incoterms = cleanText(input.incoterms, 10).toUpperCase();
    if (!INCOTERMS.includes(incoterms)) {
      throw httpError(400, 'INVALID_PRODUCT_FIELD', 'Incoterms produk tidak valid.');
    }
    updates.incoterms = incoterms;
  }
  if (input.desc !== undefined || input.description !== undefined) {
    updates.desc = cleanText(input.desc ?? input.description, 5000) || null;
  }
  if (input.gallery !== undefined) updates.gallery = parseStringArray(input.gallery);
  if (input.certs !== undefined) updates.certs = parseStringArray(input.certs);
  if (input.specs !== undefined) {
    updates.specs = Array.isArray(input.specs)
      ? input.specs
          .filter((spec) => spec && typeof spec === 'object')
          .map((spec) => ({
            k: cleanText(spec.k, 120),
            v: cleanText(spec.v, 300),
          }))
          .filter((spec) => spec.k && spec.v)
          .slice(0, 40)
      : [];
  }
  if (input.weightKg !== undefined) {
    updates.weightKg = input.weightKg === null || input.weightKg === ''
      ? null
      : parseNumberField(input.weightKg, 'weightKg', { min: 0, exclusiveMin: true });
  }
  if (input.volumeM3 !== undefined) {
    updates.volumeM3 = input.volumeM3 === null || input.volumeM3 === ''
      ? null
      : parseNumberField(input.volumeM3, 'volumeM3', { min: 0, exclusiveMin: true });
  }
  if (input.stock !== undefined) updates.stock = parseNumberField(input.stock, 'stock');

  if (input.status !== undefined) {
    const status = cleanText(input.status, 20).toLowerCase();
    if (!PRODUCT_STATUSES.includes(status)) {
      throw httpError(400, 'INVALID_PRODUCT_STATUS', 'Status produk tidak valid.');
    }
    updates.status = status;
  } else if (create) {
    updates.status = admin ? 'published' : 'draft';
  }

  if (admin) {
    if (input.verifiedExporter !== undefined) {
      updates.verifiedExporter = Boolean(input.verifiedExporter);
    }
    if (input.sellerId !== undefined) {
      updates.sellerId = cleanText(input.sellerId, 120) || null;
    }
  } else if (create) {
    updates.verifiedExporter = false;
    updates.sellerId =
      user && user.dbId !== undefined && user.dbId !== null ? user.dbId : user && user.id;
  }

  return updates;
}

async function loadProductsForUser(user, { ownOnly = false } = {}) {
  const products = await db.read('products');
  const visible = products.filter((product) => !product.deletedAt);
  if (!ownOnly) return visible;
  return visible.filter((product) => ownsProduct(user, product));
}

async function createProduct(req, res) {
  const user = req.auth;
  const admin = isAdmin(user);
  const updates = collectProductUpdates(req.body, { create: true, admin, user });
  const product = await db.create('products', { ...updates, createdAt: new Date().toISOString() });
  await writeAudit(req, {
    action: 'product.create',
    tableName: 'products',
    recordId: product.id,
    newData: product,
  });
  return res.status(201).json({ success: true, product });
}

async function updateProduct(req, res) {
  const user = req.auth;
  const admin = isAdmin(user);
  const product = await db.findById('products', req.params.id);
  if (!product || product.deletedAt) {
    return sendError(res, 404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
  }
  if (!ownsProduct(user, product)) {
    return sendError(res, 403, 'FORBIDDEN_PRODUCT', 'Anda tidak memiliki hak akses ke produk ini.');
  }

  const updates = collectProductUpdates(req.body, { create: false, admin, user });
  if (!admin && updates.sellerId !== undefined) delete updates.sellerId;

  const updated = await db.update('products', product.id, updates);
  await writeAudit(req, {
    action: 'product.update',
    tableName: 'products',
    recordId: product.id,
    oldData: product,
    newData: updated,
  });
  return res.json({ success: true, product: updated });
}

async function deleteProduct(req, res) {
  const user = req.auth;
  const product = await db.findById('products', req.params.id);
  if (!product || product.deletedAt) {
    return sendError(res, 404, 'PRODUCT_NOT_FOUND', 'Produk tidak ditemukan.');
  }
  if (!ownsProduct(user, product)) {
    return sendError(res, 403, 'FORBIDDEN_PRODUCT', 'Anda tidak memiliki hak akses ke produk ini.');
  }

  const deletedAt = new Date().toISOString();
  const updated = await db.update('products', product.id, {
    deletedAt,
    status: 'archived',
  });
  await writeAudit(req, {
    action: 'product.delete',
    tableName: 'products',
    recordId: product.id,
    oldData: product,
    newData: updated,
  });
  return res.json({ success: true, message: 'Produk berhasil diarsipkan.', product: updated });
}

router.get('/seller/products', requireRole('seller', 'admin'), asyncHandler(async (req, res) => {
  const products = await loadProductsForUser(req.auth, { ownOnly: true });
  res.json({ success: true, count: products.length, products });
}));

router.post('/products', requireRole('seller', 'admin'), asyncHandler(createProduct));
router.post('/seller/products', requireRole('seller', 'admin'), asyncHandler(createProduct));
router.patch('/products/:id', requireRole('seller', 'admin'), asyncHandler(updateProduct));
router.put('/products/:id', requireRole('seller', 'admin'), asyncHandler(updateProduct));
router.patch('/seller/products/:id', requireRole('seller', 'admin'), asyncHandler(updateProduct));
router.put('/seller/products/:id', requireRole('seller', 'admin'), asyncHandler(updateProduct));
router.delete('/products/:id', requireRole('seller', 'admin'), asyncHandler(deleteProduct));
router.delete('/seller/products/:id', requireRole('seller', 'admin'), asyncHandler(deleteProduct));

// -------------------------------------------------------------------------
// RFQ / PESANAN
// -------------------------------------------------------------------------
async function loadRfqContext() {
  const [rfqs, products] = await Promise.all([db.read('rfq'), db.read('products')]);
  return {
    rfqs: rfqs.filter((rfq) => !rfq.deletedAt),
    productIndex: buildProductIndex(products.filter((product) => !product.deletedAt)),
  };
}

function filterRfqs(rfqs, req, { admin = false } = {}) {
  const user = req.auth;
  const status = cleanText(req.query.status, 30).toLowerCase();
  const search = cleanText(req.query.search || req.query.q, 120).toLowerCase();

  return rfqs
    .filter((rfq) => (admin && isAdmin(user) ? true : canViewRfq(user, rfq, req.productIndex)))
    .filter((rfq) => (status && status !== 'all' ? String(rfq.status).toLowerCase() === status : true))
    .filter((rfq) => {
      if (!search) return true;
      return [rfq.id, rfq.productName, rfq.buyerName, rfq.buyerEmail, rfq.buyerCompany, rfq.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function paginate(items, req) {
  const page = parsePositiveInt(req.query.page, 1, 100000);
  const limit = parsePositiveInt(req.query.limit, 50, 200);
  const start = (page - 1) * limit;
  return {
    page,
    limit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
    items: items.slice(start, start + limit),
  };
}

async function listRfqs(req, res, { admin = false } = {}) {
  const context = await loadRfqContext();
  const visible = filterRfqs(context.rfqs, { ...req, productIndex: context.productIndex }, { admin });
  const result = paginate(visible, req);
  return res.json({
    success: true,
    count: visible.length,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    limit: result.limit,
    rfqs: result.items.map(serializeRfq),
  });
}

async function getRfq(req, res) {
  const rfq = await db.findById('rfq', req.params.id);
  if (!rfq || rfq.deletedAt) {
    return sendError(res, 404, 'RFQ_NOT_FOUND', 'RFQ tidak ditemukan.');
  }

  const context = await loadRfqContext();
  let allowed = Boolean(req.auth && canViewRfq(req.auth, rfq, context.productIndex));
  let viaAccessToken = false;

  if (!allowed) {
    const { verifyRfqAccessToken } = require('../auth');
    const token =
      req.get('x-rfq-access-token') ||
      req.get('x-access-token') ||
      req.query.accessToken ||
      req.query.access_token ||
      '';
    if (token && verifyRfqAccessToken(token, rfq.id)) {
      allowed = true;
      viaAccessToken = true;
    }
  }

  if (!allowed) {
    if (req.auth) {
      return sendError(res, 403, 'FORBIDDEN_RFQ', 'Anda tidak memiliki hak akses ke RFQ ini.');
    }
    return sendError(
      res,
      401,
      'RFQ_ACCESS_REQUIRED',
      'Akses RFQ memerlukan login atau token akses RFQ yang diberikan saat pengajuan.'
    );
  }

  return res.json({
    success: true,
    rfq: serializeRfq(rfq),
    access: viaAccessToken ? 'guest-token' : roleOf(req.auth),
  });
}

async function patchRfq(req, res) {
  const user = req.auth;
  const rfq = await db.findById('rfq', req.params.id);
  if (!rfq || rfq.deletedAt) {
    return sendError(res, 404, 'RFQ_NOT_FOUND', 'RFQ tidak ditemukan.');
  }

  const context = await loadRfqContext();
  if (!canViewRfq(user, rfq, context.productIndex)) {
    return sendError(res, 403, 'FORBIDDEN_RFQ', 'Anda tidak memiliki hak akses ke RFQ ini.');
  }

  const body = req.body || {};
  const admin = isAdmin(user);
  const buyer = isBuyer(user);
  const seller = isSeller(user);
  const now = new Date().toISOString();
  const updates = {};
  let nextStatus = body.status !== undefined ? cleanText(body.status, 30).toLowerCase() : null;

  if (nextStatus && !RFQ_STATUSES.includes(nextStatus)) {
    return sendError(res, 400, 'INVALID_RFQ_STATUS', 'Status RFQ tidak valid.');
  }

  if (buyer && !admin) {
    if (nextStatus !== 'cancelled') {
      return sendError(
        res,
        403,
        'FORBIDDEN_RFQ_UPDATE',
        'Buyer hanya dapat membatalkan RFQ miliknya sendiri.'
      );
    }
    if (
      ['quotedPriceUSD', 'quotedTotalUSD', 'validUntil', 'notes', 'process'].some(
        (key) => body[key] !== undefined
      )
    ) {
      return sendError(
        res,
        403,
        'FORBIDDEN_RFQ_UPDATE',
        'Buyer tidak dapat mengubah penawaran atau data internal RFQ.'
      );
    }
    if (isFinalRfqStatus(rfq.status)) {
      return sendError(res, 409, 'RFQ_ALREADY_FINAL', 'RFQ ini sudah berada pada status akhir.');
    }
  }

  if (seller && !admin) {
    if (nextStatus && !SELLER_RFQ_STATUSES.includes(nextStatus)) {
      return sendError(
        res,
        403,
        'FORBIDDEN_RFQ_STATUS',
        'Seller hanya dapat mengubah status menjadi review, quoted, atau rejected.'
      );
    }
    if (isFinalRfqStatus(rfq.status) && nextStatus !== rfq.status) {
      return sendError(res, 409, 'RFQ_ALREADY_FINAL', 'RFQ ini sudah berada pada status akhir.');
    }
  }

  if (body.quotedPriceUSD !== undefined) {
    const price = Number(body.quotedPriceUSD);
    if (!Number.isFinite(price) || price < 0) {
      return sendError(res, 400, 'INVALID_QUOTE', 'Harga penawaran tidak valid.');
    }
    updates.quotedPriceUSD = price;
    updates.quotedAt = now;
    if (body.quotedTotalUSD === undefined) {
      const quantity = Number(rfq.quantity) || 0;
      updates.quotedTotalUSD = Number((price * quantity).toFixed(2));
    }
  }

  if (body.quotedTotalUSD !== undefined) {
    const total = Number(body.quotedTotalUSD);
    if (!Number.isFinite(total) || total < 0) {
      return sendError(res, 400, 'INVALID_QUOTE', 'Total penawaran tidak valid.');
    }
    updates.quotedTotalUSD = total;
  }

  if (body.validUntil !== undefined) {
    if (body.validUntil === null || body.validUntil === '') {
      updates.validUntil = null;
    } else {
      const date = new Date(body.validUntil);
      if (Number.isNaN(date.getTime())) {
        return sendError(res, 400, 'INVALID_VALID_UNTIL', 'Tanggal berlaku penawaran tidak valid.');
      }
      updates.validUntil = date.toISOString();
    }
  }

  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== 'string') {
      return sendError(res, 400, 'INVALID_NOTES', 'Catatan RFQ harus berupa teks.');
    }
    updates.notes = body.notes === null ? null : cleanText(body.notes, 4000) || null;
  }

  if (!nextStatus && updates.quotedPriceUSD !== undefined && !buyer) {
    nextStatus = 'quoted';
  }

  if (nextStatus) {
    updates.status = nextStatus;
    updates.process = buildProcess(rfq.process, nextStatus, now);
  }

  if (!admin && body.process !== undefined) {
    return sendError(
      res,
      403,
      'FORBIDDEN_RFQ_UPDATE',
      'Hanya admin yang dapat mengubah riwayat proses secara langsung.'
    );
  }
  if (admin && body.process !== undefined) {
    if (!Array.isArray(body.process)) {
      return sendError(res, 400, 'INVALID_PROCESS', 'Riwayat proses RFQ harus berupa array.');
    }
    updates.process = body.process;
  }

  if (!Object.keys(updates).length) {
    return sendError(res, 400, 'NO_RFQ_CHANGES', 'Tidak ada perubahan RFQ yang dikirim.');
  }

  const updated = await db.update('rfq', rfq.id, updates);
  await writeAudit(req, {
    action: 'rfq.update',
    tableName: 'rfqs',
    recordId: rfq.id,
    oldData: rfq,
    newData: updated,
  });

  return res.json({ success: true, rfq: serializeRfq(updated) });
}

async function cancelRfq(req, res) {
  const rfq = await db.findById('rfq', req.params.id);
  if (!rfq || rfq.deletedAt) {
    return sendError(res, 404, 'RFQ_NOT_FOUND', 'RFQ tidak ditemukan.');
  }

  const user = req.auth;
  const admin = isAdmin(user);
  if (!admin) {
    // Hanya pembeli pemilik RFQ yang boleh membatalkan; seller mengelola
    // status lewat PATCH dan tidak boleh membatalkan pesanan buyer.
    if (!rfqBuyerMatches(user, rfq)) {
      return sendError(res, 403, 'FORBIDDEN_RFQ', 'Anda hanya dapat membatalkan RFQ milik sendiri.');
    }
  }

  if (isFinalRfqStatus(rfq.status)) {
    return sendError(res, 409, 'RFQ_ALREADY_FINAL', 'RFQ ini sudah berada pada status akhir.');
  }

  const now = new Date().toISOString();
  const updated = await db.update('rfq', rfq.id, {
    status: 'cancelled',
    process: buildProcess(rfq.process, 'cancelled', now),
    updatedAt: now,
  });

  await writeAudit(req, {
    action: 'rfq.cancel',
    tableName: 'rfqs',
    recordId: rfq.id,
    oldData: rfq,
    newData: updated,
  });

  return res.json({ success: true, rfq: serializeRfq(updated) });
}

// Endpoint publik (guest) memakai autentikasi opsional dari middleware global.
router.post('/rfq', asyncHandler(async (req, res) => {
  try {
    const result = await createRfqIdempotent(req);
    if (result.status === 'created') {
      await writeAudit(req, {
        action: 'rfq.create',
        tableName: 'rfqs',
        recordId: result.rfq.id,
        newData: result.rfq,
      });
    }

    const payload = {
      success: true,
      message:
        result.status === 'replayed'
          ? 'RFQ ini sudah tercatat sebelumnya. Tidak ada pesanan ganda yang dibuat.'
          : 'Permintaan RFQ berhasil dicatat.',
      replayed: result.status === 'replayed',
      rfq: serializeRfq(result.rfq),
    };

    if (result.accessToken) {
      payload.accessToken = result.accessToken;
      payload.accessTokenHeader = 'X-RFQ-Access-Token';
      payload.accessNote =
        'Simpan token akses ini untuk memeriksa status RFQ sebagai tamu. Token tidak ditampilkan lagi.';
    }

    return res.status(result.httpStatus).json(payload);
  } catch (err) {
    if (err instanceof OrderError) {
      const headers = {};
      if (err.extra && err.extra.retryAfter) headers['Retry-After'] = String(err.extra.retryAfter);
      return res.status(err.status).set(headers).json({
        success: false,
        code: err.code,
        message: err.message,
        ...(err.extra || {}),
      });
    }
    throw err;
  }
}));

router.get('/rfq', requireAuth, asyncHandler((req, res) => listRfqs(req, res)));
router.get('/rfq/:id', asyncHandler(getRfq));
router.patch('/rfq/:id', requireAuth, asyncHandler(patchRfq));
router.put('/rfq/:id', requireAuth, asyncHandler(patchRfq));
router.post('/rfq/:id/cancel', requireAuth, asyncHandler(cancelRfq));
router.get('/buyer/rfqs', requireRole('buyer', 'admin'), asyncHandler((req, res) => listRfqs(req, res)));
router.get('/seller/rfqs', requireRole('seller', 'admin'), asyncHandler((req, res) => listRfqs(req, res)));
router.get('/admin/rfqs', requireRole('admin'), asyncHandler((req, res) => listRfqs(req, res, { admin: true })));

// -------------------------------------------------------------------------
// TRANSAKSI ESCROW
// -------------------------------------------------------------------------
async function listTransactions(req, res) {
  const user = req.auth;
  const transactions = (await db.read('transactions')).filter((trx) => !trx.deletedAt);
  const visible = transactions.filter((trx) => canAccessTransaction(user, trx));
  const status = cleanText(req.query.status, 30).toLowerCase();
  const filtered = status && status !== 'all'
    ? visible.filter((trx) => String(trx.status).toLowerCase() === status)
    : visible;
  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const result = paginate(filtered, req);

  res.json({
    success: true,
    count: filtered.length,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    limit: result.limit,
    transactions: result.items.map(serializeTransaction),
  });
}

router.get('/transactions', requireAuth, asyncHandler(listTransactions));
router.get('/transactions/:id', requireAuth, asyncHandler(async (req, res) => {
  const transaction = await db.findById('transactions', req.params.id);
  if (!transaction || transaction.deletedAt) {
    return sendError(res, 404, 'TRANSACTION_NOT_FOUND', 'Transaksi tidak ditemukan.');
  }
  if (!canAccessTransaction(req.auth, transaction)) {
    return sendError(res, 403, 'FORBIDDEN_TRANSACTION', 'Anda tidak memiliki hak akses ke transaksi ini.');
  }
  return res.json({ success: true, transaction: serializeTransaction(transaction) });
}));

// -------------------------------------------------------------------------
// ADMIN - MANAJEMEN USER
// -------------------------------------------------------------------------
function userFilters(req) {
  const role = normalizeAccountRole(req.query.role);
  const status = cleanText(req.query.status, 30).toLowerCase();
  const search = cleanText(req.query.search || req.query.q, 120).toLowerCase();

  return (user) => {
    if (user.deletedAt) return false;
    if (role && role !== 'all' && roleOf(user) !== role) return false;
    if (status && status !== 'all' && String(user.status || '').toLowerCase() !== status) return false;
    if (!search) return true;
    return [user.id, user.name, user.email, user.company, user.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  };
}

router.get('/admin/users', requireRole('admin'), asyncHandler(async (req, res) => {
  const users = (await db.read('users')).filter(userFilters(req));
  users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const result = paginate(users, req);
  res.json({
    success: true,
    count: users.length,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    limit: result.limit,
    users: result.items.map(publicUser),
  });
}));

router.get('/admin/users/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const user = await db.findById('users', req.params.id);
  if (!user || user.deletedAt) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
  }
  return res.json({ success: true, user: publicUser(user) });
}));

router.patch('/admin/users/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const target = await db.findById('users', req.params.id);
  if (!target || target.deletedAt) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
  }

  const body = req.body || {};
  const updates = {};

  if (body.name !== undefined) {
    const name = cleanText(body.name, 160);
    if (!name) return sendError(res, 400, 'INVALID_USER_FIELD', 'Nama pengguna wajib diisi.');
    updates.name = name;
  }
  if (body.company !== undefined) updates.company = cleanText(body.company, 200) || null;
  if (body.email !== undefined) {
    const email = normalizeEmail(body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendError(res, 400, 'INVALID_USER_FIELD', 'Email pengguna tidak valid.');
    }
    const duplicate = await db.findOne(
      'users',
      (user) =>
        !user.deletedAt &&
        normalizeEmail(user.email) === email &&
        String(user.id) !== String(target.id)
    );
    if (duplicate) {
      return sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'Email sudah dipakai pengguna lain.');
    }
    updates.email = email;
  }
  if (body.role !== undefined) {
    const role = normalizeAccountRole(body.role);
    if (!USER_ROLES.includes(role)) {
      return sendError(res, 400, 'INVALID_USER_ROLE', 'Role pengguna tidak valid.');
    }
    if (String(target.id) === String(req.auth.id) && role !== 'admin') {
      return sendError(
        res,
        400,
        'CANNOT_DEMOTE_SELF',
        'Admin tidak dapat menurunkan role akunnya sendiri.'
      );
    }
    updates.role = role;
  }
  if (body.status !== undefined) {
    const status = cleanText(body.status, 30).toLowerCase();
    if (!USER_STATUSES.includes(status)) {
      return sendError(res, 400, 'INVALID_USER_STATUS', 'Status pengguna tidak valid.');
    }
    if (String(target.id) === String(req.auth.id) && status === 'suspended') {
      return sendError(
        res,
        400,
        'CANNOT_SUSPEND_SELF',
        'Admin tidak dapat menangguhkan akunnya sendiri.'
      );
    }
    updates.status = status;
  }
  if (body.nib !== undefined) updates.nib = cleanText(body.nib, 40) || null;
  if (body.npwp !== undefined) updates.npwp = cleanText(body.npwp, 40) || null;
  if (body.plan !== undefined) updates.plan = cleanText(body.plan, 120) || null;
  if (body.phone !== undefined) updates.phone = cleanText(body.phone, 40) || null;
  if (body.logoUrl !== undefined) updates.logoUrl = cleanText(body.logoUrl, 500) || null;

  if (body.password !== undefined) {
    const password = String(body.password || '');
    if (password.length < 8) {
      return sendError(
        res,
        400,
        'WEAK_PASSWORD',
        'Password minimal 8 karakter untuk akun yang memiliki password.'
      );
    }
    updates.passwordHash = hashPassword(password);
  }

  if (!Object.keys(updates).length) {
    return sendError(res, 400, 'NO_USER_CHANGES', 'Tidak ada perubahan pengguna yang dikirim.');
  }

  const updated = await db.update('users', target.id, updates);
  await writeAudit(req, {
    action: 'user.update',
    tableName: 'users',
    recordId: target.id,
    oldData: publicUser(target),
    newData: publicUser(updated),
  });

  return res.json({ success: true, user: publicUser(updated) });
}));

router.delete('/admin/users/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const target = await db.findById('users', req.params.id);
  if (!target || target.deletedAt) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
  }
  if (String(target.id) === String(req.auth.id)) {
    return sendError(res, 400, 'CANNOT_DELETE_SELF', 'Admin tidak dapat menghapus akunnya sendiri.');
  }

  const updated = await db.update('users', target.id, {
    status: 'suspended',
    deletedAt: new Date().toISOString(),
  });
  await writeAudit(req, {
    action: 'user.delete',
    tableName: 'users',
    recordId: target.id,
    oldData: publicUser(target),
    newData: publicUser(updated),
  });
  return res.json({ success: true, message: 'Akun berhasil dinonaktifkan.', user: publicUser(updated) });
}));

async function setSellerVerification(req, res, status) {
  const target = await db.findById('users', req.params.id);
  if (!target || target.deletedAt) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
  }
  if (roleOf(target) !== 'seller') {
    return sendError(res, 400, 'NOT_A_SELLER', 'Akun ini bukan akun seller/eksportir.');
  }

  const updated = await db.update('users', target.id, { status });
  await writeAudit(req, {
    action: 'seller.verify',
    tableName: 'users',
    recordId: target.id,
    oldData: publicUser(target),
    newData: publicUser(updated),
  });
  return res.json({
    success: true,
    message:
      status === 'verified'
        ? 'Seller berhasil diverifikasi.'
        : 'Verifikasi seller ditolak.',
    user: publicUser(updated),
  });
}

router.post('/admin/sellers/:id/verify', requireRole('admin'), asyncHandler((req, res) =>
  setSellerVerification(req, res, 'verified')
));
router.post('/admin/sellers/:id/reject', requireRole('admin'), asyncHandler((req, res) =>
  setSellerVerification(req, res, 'rejected')
));
router.post('/admin/users/:id/verify', requireRole('admin'), asyncHandler((req, res) =>
  setSellerVerification(req, res, 'verified')
));

// -------------------------------------------------------------------------
// ADMIN - AUDIT LOG
// -------------------------------------------------------------------------
router.get('/admin/audit-logs', requireRole('admin'), asyncHandler(async (req, res) => {
  const logs = await db.read('audit_logs');
  const action = cleanText(req.query.action, 80).toLowerCase();
  const tableName = cleanText(req.query.tableName || req.query.table, 80).toLowerCase();
  const userId = cleanText(req.query.userId, 120);

  const filtered = logs
    .filter((log) => (action && action !== 'all' ? String(log.action || '').toLowerCase() === action : true))
    .filter((log) =>
      tableName && tableName !== 'all'
        ? String(log.tableName || '').toLowerCase() === tableName
        : true
    )
    .filter((log) =>
      userId ? String(log.userId ?? '') === userId || String(log.user_id ?? '') === userId : true
    )
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const result = paginate(filtered, req);
  res.json({
    success: true,
    count: filtered.length,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    limit: result.limit,
    logs: result.items,
  });
}));

module.exports = router;
