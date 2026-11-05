/**
 * ==========================================================================
 * NUSABRIDGE - ORDER / RFQ SERVICE (IDEMPOTENT)
 * File: order-service.js
 *
 * Membuat RFQ dengan penjagaan duplikasi berlapis:
 *   1. Validasi & normalisasi payload di server.
 *   2. Idempotency key (dari header Idempotency-Key atau body idempotencyKey).
 *      Jika klien tidak mengirim key, server membuat key otomatis dari isi
 *      request + jendela waktu 5 menit, sehingga request identik yang datang
 *      bersamaan tetap tidak membuat dua RFQ.
 *   3. Tabel idempotency_keys (klaim atomik) untuk request yang sedang
 *      diproses / sudah selesai.
 *   4. Unique index pada rfqs (buyer + idempotency_key) sebagai pengaman
 *      terakhir di level database.
 *
 * File ini tidak melakukan pengecekan role. Route yang memanggilnya sudah
 * menjalankan middleware autentikasi dan otorisasi.
 * ==========================================================================
 */

const crypto = require('crypto');
const db = require('./database/db');
const { createRfqAccessToken } = require('./auth');

const INCOTERMS = ['FOB', 'CIF', 'CNF', 'EXW'];
const MAX_KEY_LENGTH = 128;
const MIN_KEY_LENGTH = 8;
const AUTO_KEY_WINDOW_MS = 5 * 60 * 1000;
const PROCESSING_RETRY_SECONDS = 1;

const PROCESS_LABELS = {
  submitted: 'RFQ diterima',
  review: 'Menunggu peninjauan dan penawaran',
  quoted: 'Penawaran dikirim',
  approved: 'Pesanan disetujui',
  rejected: 'RFQ ditolak',
  cancelled: 'RFQ dibatalkan',
};

const PROCESS_FLOW = ['submitted', 'review', 'quoted', 'approved'];

class OrderError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.name = 'OrderError';
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/** Serialisasi deterministik supaya hash request tidak berubah karena urutan key. */
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        if (value[key] !== undefined) acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function hashRequest(payload) {
  return sha256(JSON.stringify(canonicalize(payload)));
}

function cleanText(value, maxLength) {
  return String(value === null || value === undefined ? '' : value)
    .trim()
    .slice(0, maxLength);
}

function cleanOptionalText(value, maxLength) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function parseIdempotencyKey(raw) {
  const value = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!value) return { key: '', explicit: false, invalid: false };

  if (
    value.length < MIN_KEY_LENGTH ||
    value.length > MAX_KEY_LENGTH ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  ) {
    return { key: '', explicit: true, invalid: true };
  }
  return { key: value, explicit: true, invalid: false };
}

function automaticKey(scope, requestHash) {
  const bucket = Math.floor(Date.now() / AUTO_KEY_WINDOW_MS);
  return `auto_${sha256(`${scope}|${requestHash}|${bucket}`).slice(0, 48)}`;
}

function buyerScope(user, buyerEmail) {
  if (user) {
    const identity = user.dbId !== undefined && user.dbId !== null ? user.dbId : user.id;
    return `user:${identity}`;
  }
  return `guest:${String(buyerEmail || '').toLowerCase()}`;
}

function buildProcess(existingProcess, status, at) {
  const existing = Array.isArray(existingProcess) ? existingProcess : [];
  const byKey = new Map(
    existing
      .filter((step) => step && step.key)
      .map((step) => [String(step.key), { ...step }])
  );

  const steps = PROCESS_FLOW.map((key) => {
    const previous = byKey.get(key);
    return {
      key,
      label: (previous && previous.label) || PROCESS_LABELS[key],
      status: (previous && previous.status) || 'waiting',
      at: (previous && previous.at) || null,
    };
  });

  const targetIndex =
    status === 'approved'
      ? PROCESS_FLOW.indexOf('approved')
      : status === 'quoted'
        ? PROCESS_FLOW.indexOf('quoted')
        : status === 'review'
          ? PROCESS_FLOW.indexOf('review')
          : PROCESS_FLOW.indexOf('submitted');

  if (status === 'cancelled' || status === 'rejected') {
    steps[0] = { ...steps[0], status: 'done', at: steps[0].at || at };
    // Pertahankan langkah yang memang sudah selesai sebelumnya.
    steps.forEach((step, index) => {
      if (index > 0 && step.status === 'done' && !step.at) step.at = at;
    });
    const terminalKey = status;
    const terminal = {
      key: terminalKey,
      label: PROCESS_LABELS[terminalKey],
      status: 'done',
      at,
    };
    const terminalIndex = steps.findIndex((step) => step.key === terminalKey);
    if (terminalIndex === -1) steps.push(terminal);
    else steps[terminalIndex] = terminal;
    return steps;
  }

  return steps.map((step, index) => {
    if (index <= targetIndex) {
      return { ...step, status: 'done', at: step.at || at };
    }
    return { ...step, status: step.status === 'done' ? 'done' : 'waiting' };
  });
}

async function findProduct(productId) {
  const raw = cleanText(productId, 120);
  if (!raw) return { raw: '', product: null };
  try {
    const product = await db.findById('products', raw);
    if (!product || product.deletedAt) return { raw, product: null };
    return { raw, product };
  } catch (err) {
    console.warn('[RFQ] Gagal membaca produk:', err.message);
    return { raw, product: null };
  }
}

/**
 * Validasi input dan susun data RFQ yang siap disimpan.
 * Email/nama untuk user login selalu diambil dari akun, bukan dari body,
 * supaya buyer tidak bisa mengaku sebagai pengguna lain.
 */
async function buildRfqDraft(req) {
  const body = req.body || {};
  const user = req.auth || null;

  const productInfo = await findProduct(body.productId);
  const product = productInfo.product;

  const fallbackEmail = user ? user.email : body.buyerEmail;
  const buyerEmail = cleanText(fallbackEmail, 240).toLowerCase();

  if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    throw new OrderError(
      400,
      'INVALID_BUYER_EMAIL',
      'Email kontak buyer wajib diisi dengan format yang valid.'
    );
  }

  const productName = cleanText(body.productName || (product && product.name), 200);
  if (!productName) {
    throw new OrderError(
      400,
      'INVALID_PRODUCT_NAME',
      'Nama produk wajib diisi (maksimal 200 karakter).'
    );
  }

  const quantity = Number(body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new OrderError(
      400,
      'INVALID_QUANTITY',
      'Jumlah pesanan harus berupa angka lebih dari 0.'
    );
  }

  const destinationPort = cleanText(
    body.destinationPort || body.buyerCountry || (product && product.portOfLoading),
    120
  );
  if (!destinationPort) {
    throw new OrderError(
      400,
      'INVALID_DESTINATION',
      'Pelabuhan tujuan wajib diisi (maksimal 120 karakter).'
    );
  }

  const incoterms = cleanText(
    body.targetIncoterms || (product && product.incoterms) || 'FOB',
    10
  ).toUpperCase();
  if (!INCOTERMS.includes(incoterms)) {
    throw new OrderError(
      400,
      'INVALID_INCOTERMS',
      'Pilihan Incoterms tidak valid.'
    );
  }

  const rawPrice = body.targetPriceUSD !== undefined && body.targetPriceUSD !== null
    ? body.targetPriceUSD
    : product && product.price;
  const targetPriceUSD = Number(rawPrice);
  if (!Number.isFinite(targetPriceUSD) || targetPriceUSD < 0) {
    throw new OrderError(
      400,
      'INVALID_PRICE',
      'Harga acuan produk tidak valid.'
    );
  }

  const unit = cleanText(body.unit || (product && product.unit) || 'unit', 20) || 'unit';
  const buyerName = cleanText(
    (user && (user.name || user.company)) || body.buyerName || buyerEmail.split('@')[0],
    160
  );
  const buyerCompany = cleanText(
    (user && user.company) || body.buyerCompany,
    200
  );
  const now = new Date().toISOString();

  const draft = {
    buyerName,
    buyerCompany,
    buyerEmail,
    buyerCountry: destinationPort,
    destinationPort,
    productId: product ? product.id : null,
    productName,
    quantity,
    unit,
    targetIncoterms: incoterms,
    targetPriceUSD,
    totalValueUSD: Number((targetPriceUSD * quantity).toFixed(2)),
    currency: 'USD',
    status: 'submitted',
    sellerId: product ? product.sellerId ?? null : null,
    process: buildProcess([], 'submitted', now),
    createdAt: now,
  };

  if (user) {
    draft.buyerUserId = user.dbId !== undefined && user.dbId !== null ? user.dbId : user.id;
  }

  const normalizedForHash = {
    productId: productInfo.raw || null,
    productName,
    quantity,
    unit,
    targetIncoterms: incoterms,
    destinationPort,
    targetPriceUSD,
    buyerEmail,
  };

  return {
    draft,
    buyerEmail,
    buyerUserId: user
      ? user.dbId !== undefined && user.dbId !== null
        ? user.dbId
        : user.id
      : null,
    scope: buyerScope(user, buyerEmail),
    requestHash: hashRequest(normalizedForHash),
  };
}

function resolveIdempotencyKey(req, context, explicitHeaderKey) {
  const fromHeader = parseIdempotencyKey(
    explicitHeaderKey !== undefined && explicitHeaderKey !== null
      ? explicitHeaderKey
      : req.get('idempotency-key')
  );
  if (fromHeader.invalid) {
    throw new OrderError(
      400,
      'INVALID_IDEMPOTENCY_KEY',
      'Header Idempotency-Key harus berupa 8-128 karakter huruf, angka, titik, titik dua, garis bawah, atau tanda hubung.'
    );
  }

  const fromBody = parseIdempotencyKey((req.body || {}).idempotencyKey);
  if (fromBody.invalid) {
    throw new OrderError(
      400,
      'INVALID_IDEMPOTENCY_KEY',
      'idempotencyKey harus berupa 8-128 karakter huruf, angka, titik, titik dua, garis bawah, atau tanda hubung.'
    );
  }

  const explicit = fromHeader.key || fromBody.key;
  return {
    key: explicit || automaticKey(context.scope, context.requestHash),
    explicit: Boolean(explicit),
  };
}

function accessTokenFor(req, rfq) {
  if (req.auth || !rfq) return null;
  return createRfqAccessToken(rfq.id);
}

async function replayWithRecord(record, req) {
  let rfq = null;
  if (record && record.resourceId !== null && record.resourceId !== undefined) {
    try {
      rfq = await db.findById('rfq', record.resourceId);
    } catch (err) {
      console.warn('[RFQ replay] Gagal membaca RFQ tersimpan:', err.message);
    }
  }
  if (!rfq && record && record.responseBody && record.responseBody.rfq) {
    rfq = record.responseBody.rfq;
  }
  if (!rfq) {
    throw new OrderError(
      409,
      'IDEMPOTENCY_STALE',
      'Permintaan dengan Idempotency-Key ini sudah tercatat, tetapi data RFQ tidak dapat dimuat. Hubungi admin dengan nomor idempotency tersebut.'
    );
  }

  return {
    status: 'replayed',
    httpStatus: 200,
    rfq,
    accessToken: accessTokenFor(req, rfq),
  };
}

async function replayWithRfq(rfq, req) {
  return {
    status: 'replayed',
    httpStatus: 200,
    rfq,
    accessToken: accessTokenFor(req, rfq),
  };
}

/**
 * Buat RFQ secara idempotent.
 *
 * @returns {Promise<{status:'created'|'replayed', httpStatus:number, rfq:object, accessToken:string|null}>}
 */
async function createRfqIdempotent(req) {
  const context = await buildRfqDraft(req);
  const { key, explicit } = resolveIdempotencyKey(req, context);
  const { scope, requestHash, buyerUserId, buyerEmail, draft } = context;

  // 1) Cek RFQ yang sudah ada dengan key yang sama. Ini juga menutup kasus
  //    migrasi lama yang belum memiliki tabel idempotency_keys.
  let existing = null;
  try {
    existing = await db.findRfqByIdempotencyKey({ key, buyerUserId, buyerEmail });
  } catch (err) {
    console.warn('[RFQ] Gagal memeriksa idempotency RFQ:', err.message);
  }

  if (existing) {
    if (existing.requestHash && existing.requestHash !== requestHash) {
      throw new OrderError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'Idempotency-Key yang sama dipakai untuk isi permintaan yang berbeda.'
      );
    }
    return replayWithRfq(existing, req);
  }

  // 2) Klaim key secara atomik.
  let claim;
  try {
    claim = await db.claimIdempotency({
      scope,
      key,
      requestHash,
      endpoint: 'POST /api/rfq',
    });
  } catch (err) {
    throw new OrderError(
      503,
      'IDEMPOTENCY_UNAVAILABLE',
      `Penjagaan duplikasi pesanan sedang tidak tersedia: ${err.message}`
    );
  }

  if (claim.status === 'conflict') {
    throw new OrderError(
      409,
      'IDEMPOTENCY_CONFLICT',
      'Idempotency-Key yang sama dipakai untuk isi permintaan yang berbeda.'
    );
  }

  if (claim.status === 'processing') {
    throw new OrderError(
      409,
      'REQUEST_IN_PROGRESS',
      'Permintaan dengan Idempotency-Key ini masih diproses. Tunggu sebentar lalu coba lagi.',
      { retryAfter: PROCESSING_RETRY_SECONDS }
    );
  }

  if (claim.status === 'replay') {
    return replayWithRecord(claim.record, req);
  }

  // 3) Setelah klaim berhasil, cek lagi RFQ yang mungkin sudah dibuat oleh
  //    proses sebelumnya (mis. klaim dipulihkan setelah timeout 30 detik).
  try {
    existing = await db.findRfqByIdempotencyKey({ key, buyerUserId, buyerEmail });
  } catch (err) {
    console.warn('[RFQ] Gagal memeriksa ulang idempotency RFQ:', err.message);
  }
  if (existing) {
    if (existing.requestHash && existing.requestHash !== requestHash) {
      throw new OrderError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'Idempotency-Key yang sama dipakai untuk isi permintaan yang berbeda.'
      );
    }
    try {
      await db.completeIdempotency({
        scope,
        key,
        responseStatus: 200,
        responseBody: { rfq: existing },
        resourceType: 'rfq',
        resourceId: existing.id,
      });
    } catch (err) {
      console.warn('[RFQ] Gagal menandai idempotency selesai:', err.message);
    }
    return replayWithRfq(existing, req);
  }

  // 4) Simpan RFQ.
  let rfq;
  try {
    rfq = await db.create('rfq', {
      ...draft,
      idempotencyKey: key,
      requestHash,
    });
  } catch (err) {
    const duplicate =
      err.code === '23505' || /duplicate key|unique constraint/i.test(err.message || '');

    if (duplicate) {
      const found = await db.findRfqByIdempotencyKey({ key, buyerUserId, buyerEmail });
      if (found) {
        if (found.requestHash && found.requestHash !== requestHash) {
          throw new OrderError(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Idempotency-Key yang sama dipakai untuk isi permintaan yang berbeda.'
          );
        }
        return replayWithRfq(found, req);
      }
    }

    try {
      await db.releaseIdempotency(scope, key);
    } catch (releaseError) {
      console.warn('[RFQ] Gagal melepas idempotency:', releaseError.message);
    }

    if (duplicate) {
      throw new OrderError(
        409,
        'DUPLICATE_REJECTED',
        'RFQ dengan pembeli dan kunci yang sama sudah tercatat. Muat ulang data RFQ Anda.'
      );
    }

    throw new OrderError(
      500,
      'RFQ_CREATE_FAILED',
      `RFQ gagal disimpan: ${err.message}`
    );
  }

  // 5) Tandai key selesai. Kegagalan menandai tidak boleh menghapus RFQ yang
  //    sudah sah; request berikutnya akan menemukannya lewat pengecekan rfqs.
  try {
    await db.completeIdempotency({
      scope,
      key,
      responseStatus: 201,
      responseBody: { rfq },
      resourceType: 'rfq',
      resourceId: rfq.id,
    });
  } catch (err) {
    console.warn('[RFQ] Gagal menyelesaikan idempotency:', err.message);
  }

  return {
    status: 'created',
    httpStatus: 201,
    rfq,
    accessToken: accessTokenFor(req, rfq),
    idempotencyKey: explicit ? key : null,
  };
}

module.exports = {
  OrderError,
  INCOTERMS,
  PROCESS_FLOW,
  PROCESS_LABELS,
  buildProcess,
  buildRfqDraft,
  hashRequest,
  canonicalize,
  parseIdempotencyKey,
  automaticKey,
  createRfqIdempotent,
};
