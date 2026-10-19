/**
 * ==========================================================================
 * NUSABRIDGE - JAVASCRIPT DATABASE ENGINE (LIGHTWEIGHT JSON-STORE)
 * File: database/db.js
 * Deskripsi: Mesin database berbasis JavaScript native (Node.js fs/promises)
 * 
 * Keunggulan untuk Kompetisi GTNIC 2026:
 * 1. 100% JavaScript (Tanpa dependensi server database eksternal seperti MySQL/MongoDB)
 * 2. Cepat, ringan, dan portabel (Cukup clone dan jalankan)
 * 3. File data persisten dalam format JSON (users, products, rfq, transactions)
 * 4. Mendukung Querying, Search, Filtering, Pagination, dan Operasi CRUD Lengkap
 * ==========================================================================
 */

const fs = require('fs/promises');
const path = require('path');

const DB_DIR = __dirname;

class JsDatabase {
  constructor() {
    this.cache = {};
  }

  getFilePath(table) {
    return path.join(DB_DIR, `${table}.json`);
  }

  /**
   * Membaca seluruh data dari tabel JSON
   */
  async read(table) {
    try {
      const filePath = this.getFilePath(table);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content || '[]');
      this.cache[table] = data;
      return data;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Jika file belum ada, buat file kosong []
        await this.write(table, []);
        return [];
      }
      console.error(`[DB Error] Gagal membaca tabel ${table}:`, err.message);
      return [];
    }
  }

  /**
   * Menulis data array ke tabel JSON secara persisten
   */
  async write(table, data) {
    try {
      const filePath = this.getFilePath(table);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      this.cache[table] = data;
      return true;
    } catch (err) {
      console.error(`[DB Error] Gagal menulis tabel ${table}:`, err.message);
      return false;
    }
  }

  /**
   * Mencari semua data dengan filter fungsi
   */
  async find(table, filterFn = null) {
    const data = await this.read(table);
    if (!filterFn) return data;
    return data.filter(filterFn);
  }

  /**
   * Mencari satu data berdasarkan ID
   */
  async findById(table, id) {
    const data = await this.read(table);
    return data.find(item => String(item.id) === String(id)) || null;
  }

  /**
   * Mencari satu data dengan predikat
   */
  async findOne(table, filterFn) {
    const data = await this.read(table);
    return data.find(filterFn) || null;
  }

  /**
   * Menambahkan data baru (Auto ID jika tidak tersedia)
   */
  async create(table, item) {
    const data = await this.read(table);
    const newItem = {
      id: item.id || `${table.slice(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      ...item
    };
    data.unshift(newItem);
    await this.write(table, data);
    return newItem;
  }

  /**
   * Memperbarui data berdasarkan ID
   */
  async update(table, id, updates) {
    const data = await this.read(table);
    const index = data.findIndex(item => String(item.id) === String(id));
    if (index === -1) return null;

    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.write(table, data);
    return data[index];
  }

  /**
   * Menghapus data berdasarkan ID
   */
  async delete(table, id) {
    const data = await this.read(table);
    const filtered = data.filter(item => String(item.id) !== String(id));
    if (filtered.length === data.length) return false;
    await this.write(table, filtered);
    return true;
  }

  /**
   * Fitur Query Khusus Produk (Search, Filter Kategori, Sorting, Pagination)
   */
  async queryProducts({ category = 'all', search = '', page = 1, limit = 12, sort = 'featured' }) {
    let items = await this.read('products');

    // 1. Filter Kategori
    if (category && category !== 'all') {
      items = items.filter(p => p.category === category);
    }

    // 2. Filter Search Keyword
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.origin && p.origin.toLowerCase().includes(q)) ||
        (p.hsCode && p.hsCode.toLowerCase().includes(q)) ||
        (p.desc && p.desc.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    if (sort === 'price-low') {
      items.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sort === 'price-high') {
      items.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sort === 'moq-low') {
      items.sort((a, b) => (parseFloat(a.moq) || 0) - (parseFloat(b.moq) || 0));
    }

    // 4. Pagination
    const total = items.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 12);
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (pageNum - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      total,
      page: pageNum,
      totalPages,
      limit: pageSize,
      category,
      products: paginatedItems
    };
  }
}

module.exports = new JsDatabase();
