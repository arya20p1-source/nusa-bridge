/**
 * ==========================================================================
 * NUSABRIDGE - PENERJEMAH DATA PRODUK (ID -> EN)
 * File: src/data/productTranslations.js
 *
 * Satu sumber terjemahan untuk katalog, halaman domestik, dan NusaBridge AI.
 * Data Inggris disimpan di shared/product-translations.json agar frontend
 * dan backend memakai terjemahan yang sama.
 * ==========================================================================
 */

import TRANSLATIONS from '../../../shared/product-translations.json';

const PRODUCTS = TRANSLATIONS.products || {};
const SPEC_KEYS = TRANSLATIONS.specKeys || {};
const SPEC_VALUES = TRANSLATIONS.specValues || {};
const SHIPPING_TERMS = TRANSLATIONS.shippingTerms || {};
const ORIGIN_TERMS = TRANSLATIONS.originTerms || {};

const ORIGIN_KEYS = Object.keys(ORIGIN_TERMS).sort((a, b) => b.length - a.length);

export function localizeProductName(product, lang = 'id') {
  if (!product) return '';
  if (lang !== 'en') return product.name || '';
  return PRODUCTS[product.id]?.name || product.name || '';
}

export function localizeProductDesc(product, lang = 'id') {
  if (!product) return '';
  if (lang !== 'en') return product.desc || '';
  return PRODUCTS[product.id]?.desc || product.desc || '';
}

export function localizeSpecKey(key, lang = 'id') {
  if (lang !== 'en') return key;
  return SPEC_KEYS[key] || key;
}

export function localizeSpecValue(value, lang = 'id') {
  if (lang !== 'en') return value;
  return SPEC_VALUES[value] || value;
}

export function localizeShipping(value, lang = 'id') {
  if (!value || lang !== 'en') return value || '';
  return SHIPPING_TERMS[value] || value;
}

export function localizeOrigin(value, lang = 'id') {
  if (!value || lang !== 'en') return value || '';
  let result = String(value);
  ORIGIN_KEYS.forEach((key) => {
    if (result.includes(key)) {
      result = result.split(key).join(ORIGIN_TERMS[key]);
    }
  });
  return result;
}

/**
 * Mengembalikan salinan produk dengan field Inggris bila tersedia.
 * Dipakai agar komponen tidak perlu mengubah banyak tempat.
 */
export function localizeProduct(product, lang = 'id') {
  if (!product) return product;
  if (lang !== 'en') return product;
  return {
    ...product,
    name: localizeProductName(product, lang),
    desc: localizeProductDesc(product, lang),
    origin: localizeOrigin(product.origin, lang),
    shipping: localizeShipping(product.shipping, lang),
    specs: Array.isArray(product.specs)
      ? product.specs.map((spec) => ({
          ...spec,
          k: localizeSpecKey(spec.k, lang),
          v: localizeSpecValue(spec.v, lang),
        }))
      : product.specs,
  };
}

export default {
  localizeProduct,
  localizeProductName,
  localizeProductDesc,
  localizeSpecKey,
  localizeSpecValue,
  localizeShipping,
  localizeOrigin,
};
