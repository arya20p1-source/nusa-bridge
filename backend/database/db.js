/**
 * ==========================================================================
 * NUSABRIDGE - DATABASE ADAPTER SELECTOR
 * File: database/db.js
 * Deskripsi: Pakai Supabase bila kredensial tersedia; jika tidak, pakai
 * database memori agar demo tetap berjalan (katalog, akun, dan RFQ).
 *
 * NUSABRIDGE_DB=memory dapat dipakai untuk memaksa database memori
 * (dipakai oleh test otomatis agar tidak menyentuh data produksi).
 * ==========================================================================
 */

const supabase = require('./db-supabase');
const memory = require('./db-memory');

const forceMemory = String(process.env.NUSABRIDGE_DB || '').toLowerCase() === 'memory';
const database = forceMemory || !supabase.configured ? memory : supabase;

module.exports = database;
module.exports.usingMemoryFallback = database === memory;
