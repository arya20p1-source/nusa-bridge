/**
 * ==========================================================================
 * NUSABRIDGE - IN-MEMORY DATABASE FALLBACK
 * File: database/db-memory.js
 * Deskripsi: Menjalankan API demo tanpa Supabase.
 *
 * Data disimpan di memori proses, jadi perubahan (akun, RFQ) akan hilang
 * saat server di-restart. Katalog produk dibaca dari products-fallback.json
 * agar hasilnya sama dengan katalog frontend.
 * ==========================================================================
 */

const crypto = require('crypto');
const PRODUCTS = require('./products-fallback.json');

function hashDemoPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'Admin#2026';

const SEED_USERS = [
  {
    id: 'usr_admin_001',
    name: 'Administrator NusaBridge',
    email: 'admin@nusabridge.id',
    company: 'NusaBridge',
    role: 'admin',
    nib: null,
    npwp: null,
    status: 'verified',
    plan: 'Internal Admin',
    passwordHash: hashDemoPassword(DEMO_ADMIN_PASSWORD),
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'use_1792387445560_531',
    name: 'Admin NusaBridge',
    email: 'owner@bisnis.id',
    company: 'NusaBridge Demo',
    role: 'seller',
    nib: '1294801928415',
    npwp: '01.861.639.0-012.000',
    status: 'verified',
    plan: 'Free Trial (1 Bulan)',
    createdAt: '2026-10-19T05:24:05.556Z',
  },
  {
    id: 'usr_001',
    name: 'Budi Santoso',
    email: 'budi@kopinusantara.id',
    company: 'CV Kopi Nusantara Mandiri',
    role: 'seller',
    nib: '1294801928415',
    npwp: '01.234.567.8-012.000',
    status: 'verified',
    plan: 'Paket 5 Bulan',
    createdAt: '2026-10-15T08:00:00.000Z',
  },
  {
    id: 'usr_002',
    name: 'Heinrich Schmidt',
    email: 'h.schmidt@nordictrade.de',
    company: 'Nordic Coffee Importers GmbH',
    role: 'buyer',
    nib: null,
    npwp: null,
    status: 'verified',
    plan: null,
    createdAt: '2026-10-16T10:30:00.000Z',
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function idPrefix(table) {
  return { users: 'use', products: 'prod', rfq: 'rfq', transactions: 'trx' }[table] || 'row';
}

class MemoryDatabase {
  constructor() {
    this.tables = {
      users: clone(SEED_USERS),
      products: clone(PRODUCTS),
      rfq: [],
      transactions: [],
      audit_logs: [],
      idempotency_keys: [],
    };
  }

  get configured() {
    return false;
  }

  get provider() {
    return 'In-memory demo fallback (tanpa Supabase)';
  }

  async healthCheck() {
    return {
      configured: false,
      connected: true,
      ready: true,
      tables: Object.entries(this.tables).map(([name, rows]) => ({
        name,
        table: name,
        available: true,
        rowCount: rows.length,
      })),
    };
  }

  async read(table) {
    return clone(this.tables[table] || []);
  }

  async find(table, filterFn = null) {
    const rows = await this.read(table);
    return filterFn ? rows.filter(filterFn) : rows;
  }

  async findById(table, id) {
    const rows = this.tables[table] || [];
    const found = rows.find((row) => String(row.id) === String(id));
    return found ? clone(found) : null;
  }

  async findOne(table, filterFn) {
    const rows = this.tables[table] || [];
    const found = rows.find(filterFn);
    return found ? clone(found) : null;
  }

  async create(table, item) {
    const rows = this.tables[table] || (this.tables[table] = []);

    // Penjaga duplikasi di level database-memori: kombinasi scope + idempotency
    // key yang sama tidak boleh menghasilkan baris RFQ kedua.
    if (table === 'rfq' && item.idempotencyKey) {
      const existing = rows.find(
        (row) =>
          row.idempotencyKey === item.idempotencyKey &&
          ((item.buyerUserId !== undefined &&
            String(row.buyerUserId) === String(item.buyerUserId)) ||
            (!item.buyerUserId &&
              String(row.buyerEmail || '').toLowerCase() ===
                String(item.buyerEmail || '').toLowerCase()))
      );
      if (existing) return clone(existing);
    }

    const payload = {
      id:
        item.id ||
        `${idPrefix(table)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      ...item,
    };

    // Produk baru di akhir agar urutan katalog stabil; data lain di atas.
    if (table === 'products') rows.push(payload);
    else rows.unshift(payload);

    return clone(payload);
  }

  async update(table, id, updates) {
    const rows = this.tables[table] || [];
    const index = rows.findIndex((row) => String(row.id) === String(id));
    if (index === -1) return null;

    rows[index] = {
      ...rows[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return clone(rows[index]);
  }

  async delete(table, id) {
    const rows = this.tables[table] || [];
    const index = rows.findIndex((row) => String(row.id) === String(id));
    if (index === -1) return false;
    rows.splice(index, 1);
    return true;
  }

  // -------------------------------------------------------------------------
  // IDEMPOTENCY (dipakai untuk mencegah duplikasi pesanan)
  // -------------------------------------------------------------------------
  async claimIdempotency({ scope, key, requestHash, endpoint = '' }) {
    const rows = this.tables.idempotency_keys || (this.tables.idempotency_keys = []);
    const now = Date.now();
    const existing = rows.find(
      (row) => row.scope === scope && row.idempotencyKey === key
    );

    if (!existing) {
      const record = {
        id: `idem_${now}_${Math.floor(Math.random() * 1000)}`,
        scope,
        idempotencyKey: key,
        requestHash,
        endpoint,
        status: 'processing',
        responseStatus: null,
        responseBody: null,
        resourceType: null,
        resourceId: null,
        lockedAt: new Date(now).toISOString(),
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      };
      rows.push(record);
      return { status: 'claimed', record: clone(record) };
    }

    if (existing.requestHash !== requestHash) {
      return { status: 'conflict', record: clone(existing) };
    }
    if (existing.status === 'completed') {
      return { status: 'replay', record: clone(existing) };
    }

    const lockedAt = new Date(existing.lockedAt || existing.createdAt || 0).getTime();
    if (now - lockedAt > 30000) {
      existing.status = 'processing';
      existing.lockedAt = new Date(now).toISOString();
      existing.requestHash = requestHash;
      existing.updatedAt = new Date(now).toISOString();
      return { status: 'claimed', record: clone(existing) };
    }

    return { status: 'processing', record: clone(existing) };
  }

  async getIdempotency(scope, key) {
    const rows = this.tables.idempotency_keys || [];
    const found = rows.find(
      (row) => row.scope === scope && row.idempotencyKey === key
    );
    return found ? clone(found) : null;
  }

  async completeIdempotency({
    scope,
    key,
    responseStatus,
    responseBody,
    resourceType = null,
    resourceId = null,
  }) {
    const rows = this.tables.idempotency_keys || [];
    const existing = rows.find(
      (row) => row.scope === scope && row.idempotencyKey === key
    );
    if (!existing) return null;
    Object.assign(existing, {
      status: 'completed',
      responseStatus,
      responseBody: clone(responseBody),
      resourceType,
      resourceId: resourceId === null || resourceId === undefined ? null : String(resourceId),
      updatedAt: new Date().toISOString(),
    });
    return clone(existing);
  }

  async releaseIdempotency(scope, key) {
    const rows = this.tables.idempotency_keys || [];
    const index = rows.findIndex(
      (row) => row.scope === scope && row.idempotencyKey === key && row.status === 'processing'
    );
    if (index === -1) return false;
    rows.splice(index, 1);
    return true;
  }

  async findRfqByIdempotencyKey({ key, buyerUserId, buyerEmail }) {
    const rows = this.tables.rfq || [];
    const found = rows.find((row) => {
      if (row.idempotencyKey !== key) return false;
      if (buyerUserId !== null && buyerUserId !== undefined) {
        return String(row.buyerUserId) === String(buyerUserId);
      }
      return (
        String(row.buyerEmail || '').toLowerCase() ===
        String(buyerEmail || '').toLowerCase()
      );
    });
    return found ? clone(found) : null;
  }

  /** Khusus test: kosongkan data transaksi tanpa menyentuh katalog/seed user. */
  async resetTransientData() {
    this.tables.rfq = [];
    this.tables.transactions = [];
    this.tables.audit_logs = [];
    this.tables.idempotency_keys = [];
  }

  async queryProducts({
    category = 'all',
    search = '',
    page = 1,
    limit = 12,
    sort = 'featured',
  }) {
    let items = await this.read('products');

    // Katalog publik tidak menampilkan produk yang sudah diarsipkan/dihapus.
    items = items.filter(
      (product) => !product.deletedAt && (!product.status || product.status === 'published')
    );

    if (category && category !== 'all') {
      items = items.filter((p) => p.category === category);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.origin && p.origin.toLowerCase().includes(q)) ||
          (p.hsCode && p.hsCode.toLowerCase().includes(q)) ||
          (p.desc && p.desc.toLowerCase().includes(q))
      );
    }

    if (sort === 'price-low') {
      items.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sort === 'price-high') {
      items.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sort === 'moq-low') {
      items.sort((a, b) => (parseFloat(a.moq) || 0) - (parseFloat(b.moq) || 0));
    }

    const total = items.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 12);
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (pageNum - 1) * pageSize;

    return {
      total,
      page: pageNum,
      totalPages,
      limit: pageSize,
      category,
      products: items.slice(startIndex, startIndex + pageSize),
    };
  }
}

module.exports = new MemoryDatabase();
