#!/usr/bin/env node
/**
 * ==========================================================================
 * NUSABRIDGE - BUAT / PROMOSIKAN AKUN ADMIN
 * File: scripts/create-admin.js
 *
 * Pemakaian (dari folder backend):
 *   npm run admin:create -- admin@perusahaan.id 'PasswordKuat123' 'Nama Admin'
 *
 * Script ini:
 *   - mencari user berdasarkan email;
 *   - mempromosikan user lama menjadi admin + status verified, atau
 *     membuat akun admin baru;
 *   - menyimpan hash scrypt (bukan password mentah);
 *   - tidak pernah mencetak password ke terminal.
 *
 * Gunakan NUSABRIDGE_DB=memory hanya untuk demo lokal.
 * ==========================================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../database/db');
const { hashPassword, normalizeAccountRole } = require('../auth');

async function main() {
  const [emailArg, password, nameArg] = process.argv.slice(2);
  const email = String(emailArg || '').trim().toLowerCase();
  const name = String(nameArg || 'Administrator NusaBridge').trim().slice(0, 160);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Email admin tidak valid. Contoh: npm run admin:create -- admin@perusahaan.id password123 "Nama Admin"');
  }
  if (!password || String(password).length < 8) {
    throw new Error('Password admin minimal 8 karakter.');
  }

  const passwordHash = hashPassword(password);
  const existing = await db.findOne(
    'users',
    (user) => !user.deletedAt && String(user.email || '').toLowerCase() === email
  );

  if (existing) {
    const currentRole = normalizeAccountRole(existing.role);
    const updated = await db.update('users', existing.id, {
      role: 'admin',
      status: 'verified',
      passwordHash,
      deletedAt: null,
    });
    console.log(`✅ Akun ${email} dipromosikan/diperbarui menjadi admin.`);
    console.log(`   ID: ${updated.id} | Role sebelumnya: ${currentRole}`);
  } else {
    const created = await db.create('users', {
      name,
      email,
      company: 'NusaBridge',
      role: 'admin',
      status: 'verified',
      plan: 'Internal Admin',
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Akun admin baru dibuat: ${email}`);
    console.log(`   ID: ${created.id}`);
  }

  console.log('🔐 Password disimpan sebagai hash scrypt. Jangan bagikan password admin.');
  console.log('   Login admin memerlukan email + password melalui POST /api/auth/login.');
}

main().catch((err) => {
  console.error('❌ Gagal membuat admin:', err.message);
  process.exitCode = 1;
});
