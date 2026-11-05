/**
 * ==========================================================================
 * NUSABRIDGE - RBAC, OWNERSHIP, & IDEMPOTENCY TESTS
 * File: test/rbac.test.js
 *
 * Dijalankan dengan `npm test` dari folder backend. Test selalu memakai
 * database memori (NUSABRIDGE_DB=memory) supaya tidak menyentuh Supabase.
 * ==========================================================================
 */

process.env.NUSABRIDGE_DB = 'memory';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'nusabridge-test-secret';
process.env.DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'TestAdmin#2026';

const assert = require('node:assert/strict');
const { test, before, after, beforeEach } = require('node:test');
const http = require('node:http');

const app = require('../server');
const db = require('../database/db');

const ADMIN_EMAIL = 'admin@nusabridge.id';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD;

let server;
let baseUrl;
let uniqueCounter = 0;

const runId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

before(async () => {
  assert.equal(db.provider, 'In-memory demo fallback (tanpa Supabase)');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  await db.resetTransientData();
});

async function api(path, { method = 'GET', token, body, headers = {} } = {}) {
  const requestHeaders = { ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined && requestHeaders['Content-Type'] === undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data, headers: response.headers };
}

function uniqueEmail(label) {
  uniqueCounter += 1;
  return `${label}.${runId}.${uniqueCounter}@nusabridge.test`;
}

async function register(role, label) {
  const email = uniqueEmail(label || role);
  const password = 'TestPass#2026';
  const response = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: `Test ${role} ${uniqueCounter}`,
      email,
      password,
      company: `PT Test ${role} ${uniqueCounter}`,
      role,
    },
  });
  assert.equal(response.status, 201, JSON.stringify(response.data));
  assert.equal(response.data.success, true);
  assert.equal(response.data.user.role, role);
  // Password/hash tidak boleh bocor ke klien.
  assert.equal(response.data.user.passwordHash, undefined);
  return {
    email,
    password,
    user: response.data.user,
    token: response.data.token,
  };
}

async function login(email, password) {
  return api('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

async function adminToken() {
  const response = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(response.status, 200, JSON.stringify(response.data));
  assert.equal(response.data.user.role, 'admin');
  return response.data.token;
}

async function createProduct(seller, overrides = {}) {
  const response = await api('/api/seller/products', {
    method: 'POST',
    token: seller.token,
    body: {
      name: `Test Product ${uniqueCounter} ${Math.random().toString(36).slice(2, 7)}`,
      category: 'kopi',
      unit: 'kg',
      origin: 'Gayo, Aceh',
      price: 9.5,
      moq: 100,
      status: 'published',
      ...overrides,
    },
  });
  assert.equal(response.status, 201, JSON.stringify(response.data));
  assert.equal(response.data.success, true);
  return response.data.product;
}

function rfqBody(product, overrides = {}) {
  return {
    productId: product ? product.id : undefined,
    productName: product ? product.name : `RFQ Product ${uniqueCounter}`,
    quantity: 250,
    unit: 'kg',
    targetPriceUSD: 9.5,
    targetIncoterms: 'FOB',
    buyerCountry: 'Hamburg',
    buyerEmail: 'guest.buyer@nusabridge.test',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// AUTHENTICATION
// ---------------------------------------------------------------------------
test('registrasi menolak role admin dan role tidak dikenal', async () => {
  const adminAttempt = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Fake Admin',
      email: uniqueEmail('fake-admin'),
      password: 'TestPass#2026',
      role: 'admin',
    },
  });
  assert.equal(adminAttempt.status, 400);
  assert.equal(adminAttempt.data.code, 'ADMIN_ROLE_FORBIDDEN');

  const unknownAttempt = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Unknown Role',
      email: uniqueEmail('unknown-role'),
      password: 'TestPass#2026',
      role: 'superuser',
    },
  });
  assert.equal(unknownAttempt.status, 400);
  assert.equal(unknownAttempt.data.code, 'INVALID_ROLE');
});

test('login admin wajib password yang benar', async () => {
  const withoutPassword = await login(ADMIN_EMAIL, '');
  assert.equal(withoutPassword.status, 401);
  assert.equal(withoutPassword.data.code, 'INVALID_CREDENTIALS');

  const wrongPassword = await login(ADMIN_EMAIL, 'salah-password');
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongPassword.data.code, 'INVALID_CREDENTIALS');

  const ok = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.role, 'admin');
  assert.equal(ok.data.user.passwordHash, undefined);
  assert.ok(ok.data.token);
});

test('akun dengan password tidak bisa login hanya dengan email', async () => {
  const buyer = await register('buyer', 'password-buyer');

  const withoutPassword = await login(buyer.email, '');
  assert.equal(withoutPassword.status, 401);
  assert.equal(withoutPassword.data.code, 'INVALID_CREDENTIALS');

  const wrongPassword = await login(buyer.email, 'SalahPassword#2026');
  assert.equal(wrongPassword.status, 401);

  const correct = await login(buyer.email, buyer.password);
  assert.equal(correct.status, 200);
  assert.equal(correct.data.user.role, 'buyer');
});

test('registrasi baru wajib password, akun lama tanpa password tetap bisa login', async () => {
  const withoutPassword = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Tanpa Password',
      email: uniqueEmail('no-password'),
      role: 'buyer',
    },
  });
  assert.equal(withoutPassword.status, 400);
  assert.equal(withoutPassword.data.code, 'WEAK_PASSWORD');

  // Akun seed lama belum memiliki passwordHash; jalur email-only dipertahankan.
  const legacy = await login('budi@kopinusantara.id', '');
  assert.equal(legacy.status, 200);
  assert.equal(legacy.data.user.role, 'seller');

  // Email yang belum terdaftar tidak boleh membuat akun/sesi otomatis.
  const unknown = await login(uniqueEmail('unknown-login'), '');
  assert.equal(unknown.status, 401);
  assert.equal(unknown.data.code, 'INVALID_CREDENTIALS');
});

test('token palsu/rusak ditolak dan tidak memberi role apa pun', async () => {
  const admin = await adminToken();
  const tampered = `${admin.slice(0, -2)}xx`;

  const noToken = await api('/api/admin/users');
  assert.equal(noToken.status, 401);
  assert.equal(noToken.data.code, 'AUTH_REQUIRED');

  const invalid = await api('/api/admin/users', { token: tampered });
  assert.equal(invalid.status, 401);
  assert.equal(invalid.data.code, 'INVALID_TOKEN');

  const me = await api('/api/auth/me', { token: 'not.a.valid.token' });
  assert.equal(me.status, 401);
});

test('role dari server tidak bisa dinaikkan lewat body request', async () => {
  const buyer = await register('buyer', 'role-buyer');

  // Endpoint admin tetap menolak buyer; role tidak pernah dibaca dari body.
  const response = await api('/api/admin/users', { token: buyer.token });
  assert.equal(response.status, 403);
  assert.equal(response.data.code, 'FORBIDDEN_ROLE');

  const productAttempt = await api('/api/products', {
    method: 'POST',
    token: buyer.token,
    body: {
      name: 'Escalated Product',
      category: 'kopi',
      unit: 'kg',
      origin: 'Aceh',
      price: 1,
      moq: 1,
      role: 'admin',
    },
  });
  assert.equal(productAttempt.status, 403);
  assert.equal(productAttempt.data.code, 'FORBIDDEN_ROLE');
});

// ---------------------------------------------------------------------------
// RFQ: IDEMPOTENCY, DUPLIKASI, & TOKEN TAMU
// ---------------------------------------------------------------------------
test('RFQ tamu mengembalikan token akses dan hanya bisa dibaca dengan token itu', async () => {
  const key = `guest-key-${uniqueCounter}-${Date.now()}`;
  const created = await api('/api/rfq', {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: rfqBody(null, { productName: `Guest RFQ ${key}` }),
  });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  assert.equal(created.data.success, true);
  assert.equal(created.data.replayed, false);
  assert.ok(created.data.rfq.id);
  assert.ok(created.data.accessToken);
  assert.equal(created.data.rfq.idempotencyKey, undefined);

  const denied = await api(`/api/rfq/${created.data.rfq.id}`);
  assert.equal(denied.status, 401);
  assert.equal(denied.data.code, 'RFQ_ACCESS_REQUIRED');

  const allowed = await api(`/api/rfq/${created.data.rfq.id}`, {
    headers: { 'X-RFQ-Access-Token': created.data.accessToken },
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.data.access, 'guest-token');
  assert.equal(allowed.data.rfq.id, created.data.rfq.id);

  // Token tamu untuk RFQ lain tidak boleh dipakai.
  const otherKey = `${key}-other`;
  const other = await api('/api/rfq', {
    method: 'POST',
    headers: { 'Idempotency-Key': otherKey },
    body: rfqBody(null, { productName: `Guest RFQ ${otherKey}` }),
  });
  assert.equal(other.status, 201);
  const crossRead = await api(`/api/rfq/${other.data.rfq.id}`, {
    headers: { 'X-RFQ-Access-Token': created.data.accessToken },
  });
  assert.equal(crossRead.status, 401);
});

test('Idempotency-Key yang sama mengembalikan RFQ yang sama, bukan pesanan ganda', async () => {
  const key = `replay-key-${Date.now()}`;
  const body = rfqBody(null, { productName: `Replay RFQ ${key}` });

  const first = await api('/api/rfq', {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body,
  });
  assert.equal(first.status, 201);

  const second = await api('/api/rfq', {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body,
  });
  assert.equal(second.status, 200);
  assert.equal(second.data.replayed, true);
  assert.equal(second.data.rfq.id, first.data.rfq.id);
  assert.ok(second.data.accessToken);

  const conflict = await api('/api/rfq', {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: { ...body, quantity: 999 },
  });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.data.code, 'IDEMPOTENCY_CONFLICT');
});

test('request RFQ bersamaan dengan key yang sama hanya menghasilkan satu RFQ', async () => {
  const buyer = await register('buyer', 'race-buyer');
  const key = `race-key-${Date.now()}`;
  const body = rfqBody(null, {
    productName: `Concurrent RFQ ${key}`,
    buyerEmail: buyer.email,
  });

  const send = () => api('/api/rfq', {
    method: 'POST',
    token: buyer.token,
    headers: { 'Idempotency-Key': key },
    body,
  });

  const [first, second] = await Promise.all([send(), send()]);
  const statuses = [first.status, second.status].sort((a, b) => a - b);

  // Satu request membuat RFQ. Request lain boleh replay (200) atau menunggu
  // (409 REQUEST_IN_PROGRESS); keduanya tidak boleh membuat RFQ kedua.
  assert.ok(
    (statuses[0] === 200 && statuses[1] === 201) ||
      (statuses[0] === 201 && statuses[1] === 409),
    `status tak terduga: ${statuses.join(',')}`
  );

  const pending = [first, second].find((result) => result.status === 409);
  if (pending) {
    assert.equal(pending.data.code, 'REQUEST_IN_PROGRESS');
    const retry = await send();
    assert.equal(retry.status, 200);
    assert.equal(retry.data.replayed, true);
  }

  const list = await api(
    `/api/buyer/rfqs?search=${encodeURIComponent(`Concurrent RFQ ${key}`)}`,
    { token: buyer.token }
  );
  assert.equal(list.status, 200);
  assert.equal(list.data.rfqs.length, 1);
  assert.equal(list.data.rfqs[0].productName, `Concurrent RFQ ${key}`);
});

test('RFQ ganda tidak membuat pesanan kedua dan tidak mengubah stok produk', async () => {
  const seller = await register('seller', 'stock-seller');
  const buyer = await register('buyer', 'stock-buyer');
  const product = await createProduct(seller, { stock: 500, status: 'published' });
  const key = `stock-key-${Date.now()}`;
  const body = rfqBody(product, {
    quantity: 120,
    buyerEmail: buyer.email,
    productName: product.name,
  });

  const send = () => api('/api/rfq', {
    method: 'POST',
    token: buyer.token,
    headers: { 'Idempotency-Key': key },
    body,
  });

  const [first, second] = await Promise.all([send(), send()]);
  const pending = [first, second].find((result) => result.status === 409);
  if (pending) {
    assert.equal(pending.data.code, 'REQUEST_IN_PROGRESS');
    const retry = await send();
    assert.equal(retry.status, 200);
    assert.equal(retry.data.replayed, true);
  }

  // Hanya satu RFQ yang tercatat, dan stok/status produk tidak ikut berubah
  // karena RFQ adalah permintaan penawaran, bukan pemotongan stok otomatis.
  const rfqs = await api(
    `/api/seller/rfqs?search=${encodeURIComponent(product.name)}`,
    { token: seller.token }
  );
  assert.equal(rfqs.status, 200);
  assert.equal(rfqs.data.rfqs.length, 1);
  assert.equal(rfqs.data.rfqs[0].quantity, 120);

  const products = await api('/api/seller/products', { token: seller.token });
  const stored = products.data.products.find((item) => String(item.id) === String(product.id));
  assert.ok(stored);
  assert.equal(stored.stock, 500);
  assert.equal(stored.status, 'published');
});

test('RFQ identik tanpa Idempotency-Key tetap tidak terduplikasi', async () => {
  const buyer = await register('buyer', 'auto-key-buyer');
  const productName = `Auto Key RFQ ${Date.now()}`;
  const body = rfqBody(null, { productName, buyerEmail: buyer.email });

  const send = () => api('/api/rfq', { method: 'POST', token: buyer.token, body });
  const [first, second] = await Promise.all([send(), send()]);

  const pending = [first, second].find((result) => result.status === 409);
  if (pending) {
    assert.equal(pending.data.code, 'REQUEST_IN_PROGRESS');
    const retry = await send();
    assert.equal(retry.status, 200);
    assert.equal(retry.data.replayed, true);
  }

  const list = await api(
    `/api/buyer/rfqs?search=${encodeURIComponent(productName)}`,
    { token: buyer.token }
  );
  assert.equal(list.status, 200);
  assert.equal(list.data.rfqs.length, 1);
});

test('validasi server menolak payload RFQ yang tidak lengkap', async () => {
  const buyer = await register('buyer', 'invalid-buyer');
  const missingQty = await api('/api/rfq', {
    method: 'POST',
    token: buyer.token,
    headers: { 'Idempotency-Key': `invalid-key-${Date.now()}` },
    body: rfqBody(null, { quantity: 0 }),
  });
  assert.equal(missingQty.status, 400);
  assert.equal(missingQty.data.code, 'INVALID_QUANTITY');

  const shortKey = await api('/api/rfq', {
    method: 'POST',
    token: buyer.token,
    headers: { 'Idempotency-Key': 'short' },
    body: rfqBody(null, { productName: `Short Key ${Date.now()}` }),
  });
  assert.equal(shortKey.status, 400);
  assert.equal(shortKey.data.code, 'INVALID_IDEMPOTENCY_KEY');
});

// ---------------------------------------------------------------------------
// BUYER
// ---------------------------------------------------------------------------
test('buyer hanya melihat dan membatalkan RFQ miliknya', async () => {
  const buyerOne = await register('buyer', 'buyer-one');
  const buyerTwo = await register('buyer', 'buyer-two');

  const created = await api('/api/rfq', {
    method: 'POST',
    token: buyerOne.token,
    headers: { 'Idempotency-Key': `buyer-key-${Date.now()}` },
    body: rfqBody(null, {
      productName: `Owned RFQ ${Date.now()}`,
      buyerEmail: buyerOne.email,
    }),
  });
  assert.equal(created.status, 201);
  const rfqId = created.data.rfq.id;

  const ownView = await api(`/api/rfq/${rfqId}`, { token: buyerOne.token });
  assert.equal(ownView.status, 200);
  assert.equal(ownView.data.access, 'buyer');

  const otherView = await api(`/api/rfq/${rfqId}`, { token: buyerTwo.token });
  assert.equal(otherView.status, 403);
  assert.equal(otherView.data.code, 'FORBIDDEN_RFQ');

  const ownList = await api('/api/buyer/rfqs', { token: buyerOne.token });
  assert.equal(ownList.status, 200);
  assert.equal(ownList.data.rfqs.length, 1);

  const otherList = await api('/api/buyer/rfqs', { token: buyerTwo.token });
  assert.equal(otherList.status, 200);
  assert.equal(otherList.data.rfqs.length, 0);

  const forbiddenUpdate = await api(`/api/rfq/${rfqId}`, {
    method: 'PATCH',
    token: buyerOne.token,
    body: { quotedPriceUSD: 1 },
  });
  assert.equal(forbiddenUpdate.status, 403);
  assert.equal(forbiddenUpdate.data.code, 'FORBIDDEN_RFQ_UPDATE');

  const canceled = await api(`/api/rfq/${rfqId}/cancel`, {
    method: 'POST',
    token: buyerOne.token,
  });
  assert.equal(canceled.status, 200);
  assert.equal(canceled.data.rfq.status, 'cancelled');

  const cancelByOther = await api(`/api/rfq/${rfqId}/cancel`, {
    method: 'POST',
    token: buyerTwo.token,
  });
  assert.equal(cancelByOther.status, 403);
});

// ---------------------------------------------------------------------------
// SELLER: PRODUK & RFQ
// ---------------------------------------------------------------------------
test('buyer tidak dapat mengelola produk, seller hanya mengelola produknya sendiri', async () => {
  const sellerOne = await register('seller', 'seller-one');
  const sellerTwo = await register('seller', 'seller-two');
  const buyer = await register('buyer', 'product-buyer');

  const forbiddenCreate = await api('/api/products', {
    method: 'POST',
    token: buyer.token,
    body: {
      name: 'Buyer Product',
      category: 'kopi',
      unit: 'kg',
      origin: 'Aceh',
      price: 10,
      moq: 10,
    },
  });
  assert.equal(forbiddenCreate.status, 403);
  assert.equal(forbiddenCreate.data.code, 'FORBIDDEN_ROLE');

  const product = await createProduct(sellerOne, {
    name: `Owned Product ${uniqueCounter}`,
  });
  assert.equal(String(product.sellerId), String(sellerOne.user.id));

  const ownList = await api('/api/seller/products', { token: sellerOne.token });
  assert.equal(ownList.status, 200);
  assert.ok(ownList.data.products.some((item) => item.id === product.id));

  const otherList = await api('/api/seller/products', { token: sellerTwo.token });
  assert.equal(otherList.status, 200);
  assert.ok(!otherList.data.products.some((item) => item.id === product.id));

  const otherUpdate = await api(`/api/products/${product.id}`, {
    method: 'PATCH',
    token: sellerTwo.token,
    body: { price: 99 },
  });
  assert.equal(otherUpdate.status, 403);
  assert.equal(otherUpdate.data.code, 'FORBIDDEN_PRODUCT');

  const otherDelete = await api(`/api/products/${product.id}`, {
    method: 'DELETE',
    token: sellerTwo.token,
  });
  assert.equal(otherDelete.status, 403);

  const ownUpdate = await api(`/api/products/${product.id}`, {
    method: 'PATCH',
    token: sellerOne.token,
    body: { price: 11.25, status: 'published' },
  });
  assert.equal(ownUpdate.status, 200);
  assert.equal(ownUpdate.data.product.price, 11.25);

  const ownDelete = await api(`/api/products/${product.id}`, {
    method: 'DELETE',
    token: sellerOne.token,
  });
  assert.equal(ownDelete.status, 200);
  assert.equal(ownDelete.data.product.status, 'archived');

  // Produk terarsip tidak tampil lagi di katalog publik.
  const catalog = await api('/api/products?search=' + encodeURIComponent(product.name));
  assert.equal(catalog.status, 200);
  assert.ok(!catalog.data.products.some((item) => item.id === product.id));
});

test('produk draft tidak bocor ke publik tetapi dapat dilihat pemilik dan admin', async () => {
  const seller = await register('seller', 'draft-seller');
  const draft = await createProduct(seller, { status: 'draft' });

  const publicView = await api(`/api/products/${draft.id}`);
  assert.equal(publicView.status, 404);

  const ownerView = await api(`/api/products/${draft.id}`, { token: seller.token });
  assert.equal(ownerView.status, 200);
  assert.equal(ownerView.data.product.id, draft.id);

  const admin = await adminToken();
  const adminView = await api(`/api/products/${draft.id}`, { token: admin });
  assert.equal(adminView.status, 200);
});

test('seller hanya melihat RFQ dari produknya sendiri', async () => {
  const sellerOne = await register('seller', 'rfq-seller-one');
  const sellerTwo = await register('seller', 'rfq-seller-two');
  const buyer = await register('buyer', 'rfq-buyer');
  const product = await createProduct(sellerOne, { name: `RFQ Seller Product ${uniqueCounter}` });

  const created = await api('/api/rfq', {
    method: 'POST',
    token: buyer.token,
    headers: { 'Idempotency-Key': `seller-rfq-key-${Date.now()}` },
    body: rfqBody(product, { productName: `Seller RFQ ${Date.now()}`, buyerEmail: buyer.email }),
  });
  assert.equal(created.status, 201, JSON.stringify(created.data));

  const ownerList = await api('/api/seller/rfqs', { token: sellerOne.token });
  assert.equal(ownerList.status, 200);
  assert.ok(ownerList.data.rfqs.some((item) => item.id === created.data.rfq.id));

  const otherList = await api('/api/seller/rfqs', { token: sellerTwo.token });
  assert.equal(otherList.status, 200);
  assert.ok(!otherList.data.rfqs.some((item) => item.id === created.data.rfq.id));

  const otherView = await api(`/api/rfq/${created.data.rfq.id}`, { token: sellerTwo.token });
  assert.equal(otherView.status, 403);

  const quote = await api(`/api/rfq/${created.data.rfq.id}`, {
    method: 'PATCH',
    token: sellerOne.token,
    body: { status: 'quoted', quotedPriceUSD: 12.5 },
  });
  assert.equal(quote.status, 200);
  assert.equal(quote.data.rfq.status, 'quoted');
  assert.equal(quote.data.rfq.quotedPriceUSD, 12.5);

  const invalidSellerStatus = await api(`/api/rfq/${created.data.rfq.id}`, {
    method: 'PATCH',
    token: sellerOne.token,
    body: { status: 'approved' },
  });
  assert.equal(invalidSellerStatus.status, 403);
  assert.equal(invalidSellerStatus.data.code, 'FORBIDDEN_RFQ_STATUS');
});

// ---------------------------------------------------------------------------
// TRANSAKSI
// ---------------------------------------------------------------------------
test('transaksi hanya terlihat oleh buyer/seller terkait dan admin', async () => {
  const sellerOne = await register('seller', 'trx-seller-one');
  const sellerTwo = await register('seller', 'trx-seller-two');
  const buyerOne = await register('buyer', 'trx-buyer-one');
  const buyerTwo = await register('buyer', 'trx-buyer-two');
  const admin = await adminToken();

  const transaction = await db.create('transactions', {
    buyerId: buyerOne.user.id,
    sellerId: sellerOne.user.id,
    status: 'escrow',
    amountUSD: 5000,
    createdAt: new Date().toISOString(),
  });

  const buyerList = await api('/api/transactions', { token: buyerOne.token });
  assert.equal(buyerList.status, 200);
  assert.ok(buyerList.data.transactions.some((item) => item.id === transaction.id));

  const otherBuyerList = await api('/api/transactions', { token: buyerTwo.token });
  assert.equal(otherBuyerList.status, 200);
  assert.ok(!otherBuyerList.data.transactions.some((item) => item.id === transaction.id));

  const sellerList = await api('/api/transactions', { token: sellerOne.token });
  assert.equal(sellerList.status, 200);
  assert.ok(sellerList.data.transactions.some((item) => item.id === transaction.id));

  const otherSellerList = await api('/api/transactions', { token: sellerTwo.token });
  assert.equal(otherSellerList.status, 200);
  assert.ok(!otherSellerList.data.transactions.some((item) => item.id === transaction.id));

  const adminList = await api('/api/transactions', { token: admin });
  assert.equal(adminList.status, 200);
  assert.ok(adminList.data.transactions.some((item) => item.id === transaction.id));

  const forbiddenDetail = await api(`/api/transactions/${transaction.id}`, {
    token: buyerTwo.token,
  });
  assert.equal(forbiddenDetail.status, 403);
  assert.equal(forbiddenDetail.data.code, 'FORBIDDEN_TRANSACTION');

  const allowedDetail = await api(`/api/transactions/${transaction.id}`, {
    token: sellerOne.token,
  });
  assert.equal(allowedDetail.status, 200);
});

// ---------------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------------
test('admin dapat mengelola user dan memverifikasi seller', async () => {
  const admin = await adminToken();
  const seller = await register('seller', 'verify-seller');
  const buyer = await register('buyer', 'admin-managed');

  const list = await api('/api/admin/users?role=seller&search=' + encodeURIComponent(seller.email), {
    token: admin,
  });
  assert.equal(list.status, 200);
  assert.ok(list.data.users.some((user) => user.id === seller.user.id));
  assert.ok(!list.data.users.some((user) => user.id === buyer.user.id));
  assert.ok(list.data.users.every((user) => user.passwordHash === undefined));

  const rejected = await api(`/api/admin/sellers/${seller.user.id}/reject`, {
    method: 'POST',
    token: admin,
  });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.data.user.status, 'rejected');

  const verified = await api(`/api/admin/sellers/${seller.user.id}/verify`, {
    method: 'POST',
    token: admin,
  });
  assert.equal(verified.status, 200);
  assert.equal(verified.data.user.status, 'verified');

  const promoted = await api(`/api/admin/users/${buyer.user.id}`, {
    method: 'PATCH',
    token: admin,
    body: { role: 'seller', company: 'Promoted Buyer Co' },
  });
  assert.equal(promoted.status, 200);
  assert.equal(promoted.data.user.role, 'seller');
  assert.equal(promoted.data.user.company, 'Promoted Buyer Co');

  const selfDemote = await api('/api/admin/users/' + (await api('/api/auth/me', { token: admin })).data.user.id, {
    method: 'PATCH',
    token: admin,
    body: { role: 'buyer' },
  });
  assert.equal(selfDemote.status, 400);
  assert.equal(selfDemote.data.code, 'CANNOT_DEMOTE_SELF');
});

test('admin dapat mengelola produk dan RFQ seluruh toko', async () => {
  const admin = await adminToken();
  const seller = await register('seller', 'admin-product-seller');
  const otherSeller = await register('seller', 'admin-product-other');
  const buyer = await register('buyer', 'admin-product-buyer');

  const createdProduct = await api('/api/products', {
    method: 'POST',
    token: admin,
    body: {
      name: `Admin Assigned Product ${uniqueCounter}`,
      category: 'rempah',
      unit: 'kg',
      origin: 'Maluku',
      price: 14,
      moq: 50,
      sellerId: seller.user.id,
      verifiedExporter: true,
    },
  });
  assert.equal(createdProduct.status, 201, JSON.stringify(createdProduct.data));
  assert.equal(createdProduct.data.product.status, 'published');
  assert.equal(String(createdProduct.data.product.sellerId), String(seller.user.id));

  // Produk yang ditugaskan admin langsung terlihat di toko seller tersebut,
  // tetapi tidak di toko seller lain.
  const sellerProducts = await api('/api/seller/products', { token: seller.token });
  assert.ok(
    sellerProducts.data.products.some((item) => item.id === createdProduct.data.product.id)
  );
  const otherProducts = await api('/api/seller/products', { token: otherSeller.token });
  assert.ok(
    !otherProducts.data.products.some((item) => item.id === createdProduct.data.product.id)
  );

  const sellerUpdate = await api(`/api/products/${createdProduct.data.product.id}`, {
    method: 'PATCH',
    token: seller.token,
    body: { price: 15.5 },
  });
  assert.equal(sellerUpdate.status, 200);

  const createdRfq = await api('/api/rfq', {
    method: 'POST',
    token: buyer.token,
    headers: { 'Idempotency-Key': `admin-rfq-key-${Date.now()}` },
    body: rfqBody(createdProduct.data.product, {
      productName: `Admin Managed RFQ ${Date.now()}`,
      buyerEmail: buyer.email,
    }),
  });
  assert.equal(createdRfq.status, 201, JSON.stringify(createdRfq.data));

  const adminRfqs = await api('/api/admin/rfqs', { token: admin });
  assert.equal(adminRfqs.status, 200);
  assert.ok(adminRfqs.data.rfqs.some((item) => item.id === createdRfq.data.rfq.id));

  const ownerRfqs = await api('/api/seller/rfqs', { token: seller.token });
  assert.ok(ownerRfqs.data.rfqs.some((item) => item.id === createdRfq.data.rfq.id));

  const adminPatch = await api(`/api/rfq/${createdRfq.data.rfq.id}`, {
    method: 'PATCH',
    token: admin,
    body: { status: 'approved', quotedPriceUSD: 15.5, notes: 'Disetujui admin.' },
  });
  assert.equal(adminPatch.status, 200, JSON.stringify(adminPatch.data));
  assert.equal(adminPatch.data.rfq.status, 'approved');
  assert.equal(adminPatch.data.rfq.quotedPriceUSD, 15.5);

  const adminDelete = await api(`/api/products/${createdProduct.data.product.id}`, {
    method: 'DELETE',
    token: admin,
  });
  assert.equal(adminDelete.status, 200);

  const buyerAdminList = await api('/api/admin/rfqs', { token: buyer.token });
  assert.equal(buyerAdminList.status, 403);
  assert.equal(buyerAdminList.data.code, 'FORBIDDEN_ROLE');

  const guestList = await api('/api/rfq');
  assert.equal(guestList.status, 401);
  assert.equal(guestList.data.code, 'AUTH_REQUIRED');

  const buyerSellerList = await api('/api/seller/rfqs', { token: buyer.token });
  assert.equal(buyerSellerList.status, 403);
});

test('akun yang ditangguhkan kehilangan akses walau token lama masih ada', async () => {
  const admin = await adminToken();
  const seller = await register('seller', 'suspend-seller');

  const beforeSuspend = await api('/api/auth/me', { token: seller.token });
  assert.equal(beforeSuspend.status, 200);

  const suspended = await api(`/api/admin/users/${seller.user.id}`, {
    method: 'PATCH',
    token: admin,
    body: { status: 'suspended' },
  });
  assert.equal(suspended.status, 200);

  const afterSuspend = await api('/api/auth/me', { token: seller.token });
  assert.equal(afterSuspend.status, 401);
  assert.equal(afterSuspend.data.code, 'INVALID_TOKEN');

  const loginAttempt = await login(seller.email, seller.password);
  assert.equal(loginAttempt.status, 403);
  assert.equal(loginAttempt.data.code, 'ACCOUNT_SUSPENDED');
});

test('admin dapat melihat audit log untuk operasi yang tercatat', async () => {
  const admin = await adminToken();
  const seller = await register('seller', 'audit-seller');
  const product = await createProduct(seller, {
    name: `Audit Product ${uniqueCounter}`,
  });

  const updated = await api(`/api/products/${product.id}`, {
    method: 'PATCH',
    token: seller.token,
    body: { price: 10.75 },
  });
  assert.equal(updated.status, 200, JSON.stringify(updated.data));

  const logs = await api('/api/admin/audit-logs?table=products', { token: admin });
  assert.equal(logs.status, 200);
  assert.ok(logs.data.logs.length >= 1);
  assert.ok(logs.data.logs.some((log) => log.action === 'product.create'));
  assert.ok(logs.data.logs.some((log) => log.action === 'product.update'));
  assert.ok(
    logs.data.logs.every(
      (log) => log.newData === null || log.newData.passwordHash === undefined
    )
  );

  const guestLogs = await api('/api/admin/audit-logs');
  assert.equal(guestLogs.status, 401);

  const buyer = await register('buyer', 'audit-buyer');
  const forbiddenLogs = await api('/api/admin/audit-logs', { token: buyer.token });
  assert.equal(forbiddenLogs.status, 403);
});
