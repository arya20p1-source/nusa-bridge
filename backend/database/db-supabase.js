/**
 * ==========================================================================
 * NUSABRIDGE - SUPABASE (POSTGRESQL) DATABASE ADAPTER
 * File: database/db-supabase.js
 * Deskripsi: Menghubungkan backend Express ke database Supabase.
 *
 * Tabel yang dipakai:
 *   users        -> data akun pengguna
 *   products     -> katalog produk ekspor
 *   rfqs         -> RFQ / pesanan masuk
 *   transactions -> kontrak & escrow
 *
 * Struktur ID (lihat database/reset-supabase.sql):
 *   id   = bigint identity, Primary Key internal
 *   code = text unik, ID bisnis yang dipakai aplikasi
 *          (mis. prod_kopi_001, rfq_001, use_179..., tx_2026_089)
 *
 * Adapter ini memetakan code <-> id supaya kode aplikasi dan frontend tidak
 * perlu diubah: dari sisi aplikasi, field `id` tetap berisi kode bisnis.
 *
 * Kunci akses diambil dari backend/.env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (RAHASIA - hanya untuk server)
 * ==========================================================================
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

// Nama tabel di kode (logis) -> nama tabel asli di Supabase
const TABLES = {
  users: 'users',
  products: 'products',
  rfq: 'rfqs',
  transactions: 'transactions',
  plans: 'plans',
  vouchers: 'vouchers',
  voucher_claims: 'voucher_claims',
  subscriptions: 'subscriptions',
  payments: 'payments',
  kyc_verifications: 'kyc_verifications',
  documents: 'documents',
  shipments: 'shipments',
  shipment_segments: 'shipment_segments',
  shipment_events: 'shipment_events',
  transport_options: 'transport_options',
  transport_quotes: 'transport_quotes',
  notifications: 'notifications',
  ai_chat_sessions: 'ai_chat_sessions',
  ai_chat_messages: 'ai_chat_messages',
  audit_logs: 'audit_logs',
  idempotency_keys: 'idempotency_keys',
  sessions: 'sessions',
  password_resets: 'password_resets',
  email_verifications: 'email_verifications',
  rfq_messages: 'rfq_messages',
  escrow_events: 'escrow_events',
  app_settings: 'app_settings',
  exchange_rates: 'exchange_rates',
  product_categories: 'product_categories',
};

// Tabel opsional: fitur tetap berjalan dengan fallback bila migrasi belum ada.
const OPTIONAL_TABLES = new Set(['idempotency_keys']);

// Prefix untuk membuat code otomatis saat aplikasi menambah data baru.
const ID_PREFIX = {
  users: 'use',
  plans: 'plan',
  vouchers: 'voucher',
  products: 'prod',
  rfq: 'rfq',
  transactions: 'tx',
  shipments: 'shp',
  documents: 'doc',
  transport_options: 'trn',
  product_categories: 'cat',
};

// Tabel yang memakai pasangan kolom id (identity) + code (ID bisnis).
const CODE_TABLES = new Set([
  'users',
  'plans',
  'vouchers',
  'products',
  'rfqs',
  'transactions',
  'shipments',
  'documents',
  'transport_options',
  'product_categories',
]);

// Tabel yang punya kolom updated_at (dipakai trigger set_updated_at).
const UPDATED_AT_TABLES = new Set([
  'users',
  'plans',
  'vouchers',
  'products',
  'rfqs',
  'transactions',
  'shipments',
  'documents',
  'subscriptions',
  'payments',
  'transport_options',
  'app_settings',
  'exchange_rates',
  'product_categories',
  'idempotency_keys',
]);

function hasValue(value) {
  return Boolean(value && !/(YOUR_|PROJECT-REF|PLACEHOLDER)/i.test(value));
}

// Nama field di kode (camelCase) -> nama kolom Supabase (snake_case)
const COLUMN_MAP = {
  users: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    logoUrl: 'logo_url',
    emailVerifiedAt: 'email_verified_at',
    lastLoginAt: 'last_login_at',
  },
  products: {
    desc: 'description',
    hsCode: 'hs_code',
    verifiedExporter: 'verified_exporter',
    portOfLoading: 'port_of_loading',
    weightKg: 'weight_kg',
    volumeM3: 'volume_m3',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  rfqs: {
    buyerName: 'buyer_name',
    buyerCompany: 'buyer_company',
    buyerCountry: 'buyer_country',
    buyerEmail: 'buyer_email',
    buyerPhone: 'buyer_phone',
    buyerUserId: 'buyer_user_id',
    sellerId: 'seller_id',
    productId: 'product_id',
    productName: 'product_name',
    targetIncoterms: 'target_incoterms',
    targetPriceUSD: 'target_price_usd',
    totalValueUSD: 'total_value_usd',
    quotedPriceUSD: 'quoted_price_usd',
    quotedTotalUSD: 'quoted_total_usd',
    quotedAt: 'quoted_at',
    validUntil: 'valid_until',
    aiAnalysis: 'ai_analysis',
    destinationPort: 'destination_port',
    process: 'process',
    idempotencyKey: 'idempotency_key',
    requestHash: 'request_hash',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  transactions: {
    contractNo: 'contract_no',
    contractValueUSD: 'contract_value_usd',
    escrowTotalUSD: 'escrow_total_usd',
    escrowReleasedUSD: 'escrow_released_usd',
    escrowRemainingUSD: 'escrow_remaining_usd',
    escrowStages: 'escrow_stages',
    vesselName: 'vessel_name',
    rfqId: 'rfq_id',
    sellerId: 'seller_id',
    buyerId: 'buyer_id',
    productId: 'product_id',
    productName: 'product_name',
    contractDate: 'contract_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

const supabase = createClient(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_KEY || 'missing-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function ensureConfigured() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di backend/.env (lihat database/CARA-PASANG.md).'
    );
  }
}

function toSnakeCase(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function toCamelCase(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function physicalTable(table) {
  return TABLES[table] || table;
}

function usesCode(table) {
  return CODE_TABLES.has(table);
}

/** Filter kolom untuk mencari satu baris: pakai code untuk ID bisnis. */
function idFilter(table, id) {
  const value = String(id);
  if (usesCode(table) && !/^\d+$/.test(value)) {
    return { column: 'code', value };
  }
  return { column: 'id', value };
}

/** Ubah objek aplikasi (camelCase) -> baris Supabase (snake_case) */
function toRow(table, item) {
  const physical = physicalTable(table);
  const map = COLUMN_MAP[physical] || {};
  const row = {};

  for (const [key, value] of Object.entries(item)) {
    if (value === undefined || key === 'dbId') continue;
    if (key === 'id' && usesCode(physical)) {
      row.code = String(value);
      continue;
    }
    row[map[key] || toSnakeCase(key)] = value;
  }
  return row;
}

/** Ubah baris Supabase (snake_case) -> objek aplikasi (camelCase) */
function toObject(table, row) {
  const physical = physicalTable(table);
  const map = COLUMN_MAP[physical] || {};
  const reverse = Object.fromEntries(
    Object.entries(map).map(([camel, snake]) => [snake, camel])
  );

  const obj = {};
  for (const [key, value] of Object.entries(row)) {
    // `code` tidak diekspos terpisah; nilainya dipakai sebagai `id` aplikasi.
    if (key === 'code' && usesCode(physical)) continue;
    obj[reverse[key] || toCamelCase(key)] = value;
  }

  if (usesCode(physical)) {
    obj.id = row.code ?? row.id;
    obj.dbId = row.id;
  }
  return obj;
}

/** Cari ID internal produk dari code bisnis (mis. prod_kopi_001). */
async function resolveProductId(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);

  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('code', text)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mencari produk ${text}: ${error.message}`);
  }
  return data ? data.id : null;
}

/** Cari ID internal user dari code bisnis (mis. usr_001 / use_...). */
async function resolveUserId(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('code', text)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mencari pengguna ${text}: ${error.message}`);
  }
  return data ? data.id : null;
}

/** Cari ID internal RFQ dari code bisnis (mis. rfq_001). */
async function resolveRfqId(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);

  const { data, error } = await supabase
    .from('rfqs')
    .select('id')
    .eq('code', text)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mencari RFQ ${text}: ${error.message}`);
  }
  return data ? data.id : null;
}

function isDuplicateError(error) {
  return Boolean(
    error &&
      (error.code === '23505' ||
        /duplicate key|already exists|unique constraint/i.test(error.message || ''))
  );
}

function isMissingTableError(error) {
  return Boolean(
    error &&
      (error.code === '42P01' ||
        /relation .* does not exist|could not find the table|schema cache/i.test(
          error.message || ''
        ))
  );
}

function isMissingColumnError(error, columnName) {
  return Boolean(
    error &&
      (error.code === '42703' ||
        new RegExp(`column .*${columnName}|'${columnName}'`, 'i').test(error.message || ''))
  );
}

class SupabaseDatabase {
  get configured() {
    return hasValue(SUPABASE_URL) && hasValue(SUPABASE_KEY);
  }

  get provider() {
    return this.configured
      ? 'Supabase PostgreSQL (configured)'
      : 'Supabase (belum dikonfigurasi)';
  }

  async healthCheck() {
    const tables = Object.entries(TABLES);
    if (!this.configured) {
      return {
        configured: false,
        connected: false,
        ready: false,
        tables: tables.map(([name, table]) => ({ name, table, available: false })),
      };
    }

    const results = await Promise.all(
      tables.map(async ([name, table]) => {
        const { count, error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });
        const available = !error && count !== null;
        return { name, table, available, rowCount: available ? count : null };
      })
    );

    return {
      configured: true,
      connected: results.some((table) => table.available),
      ready: results.every((table) => table.available || OPTIONAL_TABLES.has(table.name)) &&
        results.find((table) => table.name === 'products').rowCount > 0,
      tables: results,
    };
  }

  /** Ambil semua baris dari sebuah tabel */
  async read(table) {
    ensureConfigured();
    const physical = physicalTable(table);
    // Produk dipertahankan urut sesuai seed; tabel lain yang terbaru di atas.
    const ascending = physical === 'products';

    const { data, error } = await supabase
      .from(physical)
      .select('*')
      .order('created_at', { ascending })
      .limit(1000);

    if (error) {
      throw new Error(`Gagal membaca tabel ${physical}: ${error.message}`);
    }
    return (data || []).map((row) => toObject(table, row));
  }

  /** Cari banyak data dengan filter fungsi */
  async find(table, filterFn = null) {
    const data = await this.read(table);
    if (!filterFn) return data;
    return data.filter(filterFn);
  }

  /** Cari satu data berdasarkan ID bisnis (code) atau ID internal */
  async findById(table, id) {
    ensureConfigured();
    const physical = physicalTable(table);
    const filter = idFilter(physical, id);

    const { data, error } = await supabase
      .from(physical)
      .select('*')
      .eq(filter.column, filter.value)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal mencari ${physical} id ${id}: ${error.message}`);
    }
    return data ? toObject(table, data) : null;
  }

  /** Cari satu data dengan predikat */
  async findOne(table, filterFn) {
    const data = await this.read(table);
    return data.find(filterFn) || null;
  }

  /** Tambah data baru (code otomatis bila tidak ada) */
  async create(table, item) {
    ensureConfigured();
    const physical = physicalTable(table);
    const prefix = ID_PREFIX[table] || 'row';

    const payload = {
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
    };
    delete payload.id;
    delete payload.dbId;

    // Hanya tabel dengan kolom `code` yang memakai ID bisnis.
    if (usesCode(physical)) {
      payload.code =
        item.code ||
        item.id ||
        `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    // Kolom yang tidak ada di schema baru.
    if (physical === 'users') delete payload.password;

    // Relasi memakai id internal (bigint), sedangkan aplikasi memakai code.
    if (physical === 'rfqs') {
      if (payload.productId !== undefined) {
        payload.productId = await resolveProductId(payload.productId);
      }
      if (payload.buyerUserId !== undefined) {
        payload.buyerUserId = await resolveUserId(payload.buyerUserId);
      }
      if (payload.sellerId !== undefined) {
        payload.sellerId = await resolveUserId(payload.sellerId);
      }
      // Form lama hanya mengirim buyerCountry; destination_port wajib di schema.
      if (!payload.destinationPort && payload.buyerCountry) {
        payload.destinationPort = payload.buyerCountry;
      }
    }

    if (physical === 'products' && payload.sellerId !== undefined) {
      payload.sellerId = await resolveUserId(payload.sellerId);
    }

    if (physical === 'transactions') {
      if (payload.rfqId !== undefined) payload.rfqId = await resolveRfqId(payload.rfqId);
      if (payload.buyerId !== undefined) payload.buyerId = await resolveUserId(payload.buyerId);
      if (payload.sellerId !== undefined) payload.sellerId = await resolveUserId(payload.sellerId);
      if (payload.productId !== undefined) payload.productId = await resolveProductId(payload.productId);
    }

    const insert = async (body) =>
      supabase.from(physical).insert(toRow(table, body)).select().single();

    let { data, error } = await insert(payload);

    // Kompatibilitas sebelum migrasi RBAC dijalankan: kolom idempotency
    // belum ada. Pesanan tetap dibuat; penjagaan proses tetap berjalan di
    // adapter idempotency. Setelah migrasi dijalankan, jalur utama aktif.
    if (
      error &&
      physical === 'rfqs' &&
      (isMissingColumnError(error, 'idempotency_key') ||
        isMissingColumnError(error, 'request_hash'))
    ) {
      delete payload.idempotencyKey;
      delete payload.requestHash;
      ({ data, error } = await insert(payload));
    }

    if (error) {
      const wrapped = new Error(`Gagal menambah data ke ${physical}: ${error.message}`);
      wrapped.code = error.code;
      wrapped.details = error.details;
      wrapped.cause = error;
      throw wrapped;
    }
    return toObject(table, data);
  }

  /** Perbarui data berdasarkan ID bisnis (code) atau ID internal */
  async update(table, id, updates) {
    ensureConfigured();
    const physical = physicalTable(table);

    const payload = { ...updates };
    if (UPDATED_AT_TABLES.has(physical)) {
      payload.updatedAt = new Date().toISOString();
    }
    delete payload.id;
    delete payload.dbId;

    if (physical === 'rfqs') {
      if (payload.productId !== undefined) {
        payload.productId = await resolveProductId(payload.productId);
      }
      if (payload.buyerUserId !== undefined) {
        payload.buyerUserId = await resolveUserId(payload.buyerUserId);
      }
      if (payload.sellerId !== undefined) {
        payload.sellerId = await resolveUserId(payload.sellerId);
      }
    }

    if (physical === 'products' && payload.sellerId !== undefined) {
      payload.sellerId = await resolveUserId(payload.sellerId);
    }

    const filter = idFilter(physical, id);
    const { data, error } = await supabase
      .from(physical)
      .update(toRow(table, payload))
      .eq(filter.column, filter.value)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal memperbarui ${physical} id ${id}: ${error.message}`);
    }
    return data ? toObject(table, data) : null;
  }

  /** Hapus data berdasarkan ID bisnis (code) atau ID internal */
  async delete(table, id) {
    ensureConfigured();
    const physical = physicalTable(table);
    const filter = idFilter(physical, id);

    const { data, error } = await supabase
      .from(physical)
      .delete()
      .eq(filter.column, filter.value)
      .select('id');

    if (error) {
      throw new Error(`Gagal menghapus ${physical} id ${id}: ${error.message}`);
    }
    return (data || []).length > 0;
  }

  // -------------------------------------------------------------------------
  // IDEMPOTENCY (mencegah duplikasi pesanan saat request bersamaan)
  // -------------------------------------------------------------------------
  _fallbackIdempotency() {
    if (!this._idempotencyFallback) this._idempotencyFallback = new Map();
    return this._idempotencyFallback;
  }

  _fallbackKey(scope, key) {
    return `${scope}\u0000${key}`;
  }

  _fallbackClaim({ scope, key, requestHash, endpoint }) {
    const map = this._fallbackIdempotency();
    const mapKey = this._fallbackKey(scope, key);
    const now = Date.now();
    const existing = map.get(mapKey);

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
      map.set(mapKey, record);
      return { status: 'claimed', record: { ...record } };
    }

    if (existing.requestHash !== requestHash) {
      return { status: 'conflict', record: { ...existing } };
    }
    if (existing.status === 'completed') {
      return { status: 'replay', record: { ...existing } };
    }

    const lockedAt = new Date(existing.lockedAt || existing.createdAt || 0).getTime();
    if (now - lockedAt > 30000) {
      existing.status = 'processing';
      existing.lockedAt = new Date(now).toISOString();
      existing.requestHash = requestHash;
      existing.updatedAt = new Date(now).toISOString();
      return { status: 'claimed', record: { ...existing } };
    }
    return { status: 'processing', record: { ...existing } };
  }

  async claimIdempotency({ scope, key, requestHash, endpoint = '' }) {
    ensureConfigured();
    if (this._idempotencyTableMissing) {
      return this._fallbackClaim({ scope, key, requestHash, endpoint });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('idempotency_keys')
      .insert({
        scope,
        idempotency_key: key,
        request_hash: requestHash,
        endpoint,
        status: 'processing',
        locked_at: now,
      })
      .select()
      .single();

    if (!error) {
      return { status: 'claimed', record: toObject('idempotency_keys', data) };
    }

    if (isMissingTableError(error)) {
      this._idempotencyTableMissing = true;
      console.warn(
        '[Idempotency] Tabel idempotency_keys belum ada. Jalankan database/rbac-idempotency.sql. ' +
          'Sementara memakai penjagaan proses.'
      );
      return this._fallbackClaim({ scope, key, requestHash, endpoint });
    }

    if (!isDuplicateError(error)) {
      throw new Error(`Gagal mengunci idempotency key: ${error.message}`);
    }

    const existing = await this.getIdempotency(scope, key);
    if (!existing) {
      throw new Error('Idempotency key duplikat tetapi data kunci tidak ditemukan.');
    }
    if (existing.requestHash !== requestHash) {
      return { status: 'conflict', record: existing };
    }
    if (existing.status === 'completed') {
      return { status: 'replay', record: existing };
    }

    const lockedAt = new Date(existing.lockedAt || existing.createdAt || 0).getTime();
    if (Date.now() - lockedAt > 30000) {
      const { data: updated, error: updateError } = await supabase
        .from('idempotency_keys')
        .update({ status: 'processing', locked_at: now, request_hash: requestHash })
        .eq('scope', scope)
        .eq('idempotency_key', key)
        .eq('status', 'processing')
        .select()
        .maybeSingle();

      if (!updateError && updated) {
        return { status: 'claimed', record: toObject('idempotency_keys', updated) };
      }
    }

    return { status: 'processing', record: existing };
  }

  async getIdempotency(scope, key) {
    ensureConfigured();
    if (this._idempotencyTableMissing) {
      return this._fallbackIdempotency().get(this._fallbackKey(scope, key)) || null;
    }

    const { data, error } = await supabase
      .from('idempotency_keys')
      .select('*')
      .eq('scope', scope)
      .eq('idempotency_key', key)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        this._idempotencyTableMissing = true;
        return this._fallbackIdempotency().get(this._fallbackKey(scope, key)) || null;
      }
      throw new Error(`Gagal membaca idempotency key: ${error.message}`);
    }
    return data ? toObject('idempotency_keys', data) : null;
  }

  async completeIdempotency({
    scope,
    key,
    responseStatus,
    responseBody,
    resourceType = null,
    resourceId = null,
  }) {
    ensureConfigured();
    const safeResourceId =
      resourceId === null || resourceId === undefined ? null : String(resourceId);

    if (this._idempotencyTableMissing) {
      const record = this._fallbackIdempotency().get(this._fallbackKey(scope, key));
      if (!record) return null;
      Object.assign(record, {
        status: 'completed',
        responseStatus,
        responseBody: JSON.parse(JSON.stringify(responseBody)),
        resourceType,
        resourceId: safeResourceId,
        updatedAt: new Date().toISOString(),
      });
      return { ...record };
    }

    const { data, error } = await supabase
      .from('idempotency_keys')
      .update({
        status: 'completed',
        response_status: responseStatus,
        response_body: responseBody,
        resource_type: resourceType,
        resource_id: safeResourceId,
        updated_at: new Date().toISOString(),
      })
      .eq('scope', scope)
      .eq('idempotency_key', key)
      .select()
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        this._idempotencyTableMissing = true;
        return this.completeIdempotency({
          scope,
          key,
          responseStatus,
          responseBody,
          resourceType,
          resourceId,
        });
      }
      throw new Error(`Gagal menyelesaikan idempotency key: ${error.message}`);
    }
    return data ? toObject('idempotency_keys', data) : null;
  }

  async releaseIdempotency(scope, key) {
    ensureConfigured();
    if (this._idempotencyTableMissing) {
      const map = this._fallbackIdempotency();
      const mapKey = this._fallbackKey(scope, key);
      const record = map.get(mapKey);
      if (record && record.status === 'processing') {
        map.delete(mapKey);
        return true;
      }
      return false;
    }

    const { error } = await supabase
      .from('idempotency_keys')
      .delete()
      .eq('scope', scope)
      .eq('idempotency_key', key)
      .eq('status', 'processing');

    if (error) {
      if (isMissingTableError(error)) {
        this._idempotencyTableMissing = true;
        return this.releaseIdempotency(scope, key);
      }
      throw new Error(`Gagal melepas idempotency key: ${error.message}`);
    }
    return true;
  }

  async findRfqByIdempotencyKey({ key, buyerUserId, buyerEmail }) {
    ensureConfigured();
    let data;
    try {
      const result = await supabase
        .from('rfqs')
        .select('*')
        .eq('idempotency_key', key)
        .limit(20);
      if (result.error) throw result.error;
      data = result.data;
    } catch (error) {
      if (
        isMissingTableError(error) ||
        isMissingColumnError(error, 'idempotency_key')
      ) {
        return null;
      }
      throw new Error(`Gagal mencari RFQ idempotency: ${error.message}`);
    }

    const rows = (data || []).map((row) => toObject('rfq', row));
    return (
      rows.find((row) => {
        if (buyerUserId !== null && buyerUserId !== undefined) {
          return String(row.buyerUserId) === String(buyerUserId);
        }
        return (
          String(row.buyerEmail || '').toLowerCase() ===
          String(buyerEmail || '').toLowerCase()
        );
      }) || null
    );
  }

  /** Query produk: search, filter kategori, sorting, pagination */
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
      items.sort(
        (a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
      );
    } else if (sort === 'price-high') {
      items.sort(
        (a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
      );
    } else if (sort === 'moq-low') {
      items.sort(
        (a, b) => (parseFloat(a.moq) || 0) - (parseFloat(b.moq) || 0)
      );
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

module.exports = new SupabaseDatabase();
module.exports.TABLES = TABLES;
module.exports.COLUMN_MAP = COLUMN_MAP;
module.exports.toRow = toRow;
module.exports.toObject = toObject;
