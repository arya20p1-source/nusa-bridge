/**
 * ==========================================================================
 * NUSABRIDGE - SUPABASE (POSTGRESQL) DATABASE ADAPTER
 * File: database/db-supabase.js
 * Deskripsi: Menghubungkan backend Express ke database Supabase.
 *
 * Tabel yang dipakai:
 *   login        -> data akun pengguna
 *   products     -> katalog produk ekspor
 *   orderan      -> RFQ / pesanan masuk
 *   transactions -> kontrak & escrow
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
  users: 'login',
  products: 'products',
  rfq: 'orderan',
  transactions: 'transactions',
};

function hasValue(value) {
  return Boolean(value && !/(YOUR_|PROJECT-REF|PLACEHOLDER)/i.test(value));
}

// Nama field di kode (camelCase) -> nama kolom Supabase (snake_case)
const COLUMN_MAP = {
  login: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  products: {
    desc: 'description',
    hsCode: 'hs_code',
    verifiedExporter: 'verified_exporter',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  orderan: {
    buyerName: 'buyer_name',
    buyerCompany: 'buyer_company',
    buyerCountry: 'buyer_country',
    productId: 'product_id',
    productName: 'product_name',
    targetIncoterms: 'target_incoterms',
    targetPriceUSD: 'target_price_usd',
    totalValueUSD: 'total_value_usd',
    aiAnalysis: 'ai_analysis',
    buyerEmail: 'buyer_email',
    process: 'process',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  transactions: {
    contractNo: 'contract_no',
    contractValueUSD: 'contract_value_usd',
    escrowStages: 'escrow_stages',
    vesselName: 'vessel_name',
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
      'Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di backend/.env (lihat PASANG-SUPABASE.md).'
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

/** Ubah objek aplikasi (camelCase) -> baris Supabase (snake_case) */
function toRow(table, item) {
  const map = COLUMN_MAP[physicalTable(table)] || {};
  const reverse = Object.fromEntries(
    Object.entries(map).map(([camel, snake]) => [camel, snake])
  );

  const row = {};
  for (const [key, value] of Object.entries(item)) {
    if (value === undefined) continue;
    row[reverse[key] || toSnakeCase(key)] = value;
  }
  return row;
}

/** Ubah baris Supabase (snake_case) -> objek aplikasi (camelCase) */
function toObject(table, row) {
  const map = COLUMN_MAP[physicalTable(table)] || {};
  const reverse = Object.fromEntries(
    Object.entries(map).map(([camel, snake]) => [snake, camel])
  );

  const obj = {};
  for (const [key, value] of Object.entries(row)) {
    obj[reverse[key] || toCamelCase(key)] = value;
  }
  return obj;
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
      ready: results.every((table) => table.available) &&
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

  /** Cari satu data berdasarkan ID */
  async findById(table, id) {
    ensureConfigured();
    const physical = physicalTable(table);
    const { data, error } = await supabase
      .from(physical)
      .select('*')
      .eq('id', String(id))
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

  /** Tambah data baru (auto ID bila tidak ada) */
  async create(table, item) {
    ensureConfigured();
    const physical = physicalTable(table);
    const prefix = table.slice(0, 3);

    const payload = {
      id:
        item.id ||
        `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      ...item,
    };

    const { data, error } = await supabase
      .from(physical)
      .insert(toRow(table, payload))
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal menambah data ke ${physical}: ${error.message}`);
    }
    return toObject(table, data);
  }

  /** Perbarui data berdasarkan ID */
  async update(table, id, updates) {
    ensureConfigured();
    const physical = physicalTable(table);

    const row = toRow(table, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from(physical)
      .update(row)
      .eq('id', String(id))
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal memperbarui ${physical} id ${id}: ${error.message}`);
    }
    return data ? toObject(table, data) : null;
  }

  /** Hapus data berdasarkan ID */
  async delete(table, id) {
    ensureConfigured();
    const physical = physicalTable(table);

    const { data, error } = await supabase
      .from(physical)
      .delete()
      .eq('id', String(id))
      .select('id');

    if (error) {
      throw new Error(`Gagal menghapus ${physical} id ${id}: ${error.message}`);
    }
    return (data || []).length > 0;
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
