/**
 * ==========================================================================
 * NUSABRIDGE - AUTHORIZATION HELPERS
 * File: authorization.js
 *
 * Semua pengecekan kepemilikan data dilakukan di sini dan dipanggil dari
 * route server. Tidak ada keputusan akses yang bergantung pada frontend.
 * ==========================================================================
 */

const db = require('./database/db');
const { roleOf } = require('./auth');

const USER_PUBLIC_FIELDS = [
  'id',
  'dbId',
  'name',
  'email',
  'company',
  'role',
  'nib',
  'npwp',
  'status',
  'plan',
  'logoUrl',
  'logo',
  'phone',
  'emailVerifiedAt',
  'lastLoginAt',
  'createdAt',
  'updatedAt',
];

function publicUser(user) {
  if (!user) return null;
  const result = {};
  for (const key of USER_PUBLIC_FIELDS) {
    if (user[key] !== undefined) result[key] = user[key];
  }
  return result;
}

function isAdmin(user) {
  return roleOf(user) === 'admin';
}

function isSeller(user) {
  return roleOf(user) === 'seller';
}

function isBuyer(user) {
  return roleOf(user) === 'buyer';
}

function sameId(a, b) {
  return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
}

/**
 * Cocokkan user dengan sebuah ID relasi. Di Supabase, relasi memakai id
 * internal (bigint); di memori memakai kode bisnis. Keduanya diterima.
 */
function userMatchesId(user, value) {
  if (!user) return false;
  return sameId(user.id, value) || sameId(user.dbId, value);
}

function ownsProduct(user, product) {
  if (!user || !product) return false;
  if (isAdmin(user)) return true;
  if (!isSeller(user)) return false;
  return userMatchesId(user, product.sellerId);
}

function buildProductIndex(products) {
  const index = new Map();
  for (const product of products || []) {
    if (!product) continue;
    index.set(String(product.id), product);
    if (product.dbId !== undefined && product.dbId !== null) {
      index.set(String(product.dbId), product);
    }
  }
  return index;
}

function productForRfq(rfq, productIndex) {
  if (!rfq || !productIndex || rfq.productId === null || rfq.productId === undefined) {
    return null;
  }
  return productIndex.get(String(rfq.productId)) || null;
}

function rfqBuyerMatches(user, rfq) {
  if (!user || !rfq) return false;
  if (userMatchesId(user, rfq.buyerUserId)) return true;

  // Data lama mungkin belum menyimpan buyer_user_id. Email hanya dipakai
  // sebagai fallback bila kolom relasi memang kosong.
  if (
    (rfq.buyerUserId === null || rfq.buyerUserId === undefined) &&
    user.email &&
    rfq.buyerEmail &&
    String(user.email).toLowerCase() === String(rfq.buyerEmail).toLowerCase()
  ) {
    return true;
  }
  return false;
}

function rfqSellerMatches(user, rfq, productIndex) {
  if (!user || !rfq) return false;
  if (userMatchesId(user, rfq.sellerId)) return true;
  const product = productForRfq(rfq, productIndex);
  return product ? userMatchesId(user, product.sellerId) : false;
}

function canViewRfq(user, rfq, productIndex) {
  if (!user || !rfq) return false;
  if (isAdmin(user)) return true;
  // Akses ditentukan oleh relasi data, bukan hanya label role. Ini tetap
  // membatasi buyer ke RFQ miliknya dan seller ke RFQ dari produknya, tetapi
  // tidak memutus akses bila satu akun berperan sebagai pembeli pada RFQ lain.
  if (rfqBuyerMatches(user, rfq)) return true;
  if (rfqSellerMatches(user, rfq, productIndex)) return true;
  return false;
}

function canAccessTransaction(user, transaction) {
  if (!user || !transaction) return false;
  if (isAdmin(user)) return true;
  return (
    userMatchesId(user, transaction.buyerId) ||
    userMatchesId(user, transaction.sellerId)
  );
}

/** Buang kolom internal yang tidak boleh keluar lewat API. */
function serializeRfq(rfq) {
  if (!rfq) return null;
  const clone = { ...rfq };
  delete clone.idempotencyKey;
  delete clone.requestHash;
  delete clone.deletedAt;
  delete clone.dbId;
  return clone;
}

function serializeTransaction(transaction) {
  if (!transaction) return null;
  const clone = { ...transaction };
  delete clone.deletedAt;
  delete clone.dbId;
  return clone;
}

async function writeAudit(req, { action, tableName, recordId = null, oldData = null, newData = null }) {
  try {
    const actor = req && req.auth;
    await db.create('audit_logs', {
      userId: actor ? actor.dbId ?? actor.id : null,
      action,
      tableName,
      recordId: recordId === null || recordId === undefined ? null : String(recordId),
      oldData,
      newData,
    });
  } catch (err) {
    // Audit tidak boleh menggagalkan operasi bisnis utama.
    console.warn('[Audit log]:', err.message);
  }
}

module.exports = {
  publicUser,
  isAdmin,
  isSeller,
  isBuyer,
  sameId,
  userMatchesId,
  ownsProduct,
  buildProductIndex,
  productForRfq,
  rfqBuyerMatches,
  rfqSellerMatches,
  canViewRfq,
  canAccessTransaction,
  serializeRfq,
  serializeTransaction,
  writeAudit,
};
