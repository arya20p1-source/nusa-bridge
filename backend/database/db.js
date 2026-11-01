/**
 * ==========================================================================
 * NUSABRIDGE - DATABASE ADAPTER SELECTOR
 * File: database/db.js
 * Deskripsi: Pakai Supabase bila kredensial tersedia; jika tidak, pakai
 * database memori agar demo tetap berjalan (katalog, akun, dan RFQ).
 * ==========================================================================
 */

const supabase = require('./db-supabase');
const memory = require('./db-memory');

const database = supabase.configured ? supabase : memory;

module.exports = database;
module.exports.usingMemoryFallback = database === memory;
