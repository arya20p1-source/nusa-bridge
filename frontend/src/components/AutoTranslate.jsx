import { useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { AUTO_EN } from '../i18n/autoEn.js';
import { apiUrl } from '../utils/api.js';

/**
 * ==========================================================================
 * AUTO TRANSLATE UI (ID -> EN)
 * --------------------------------------------------------------------------
 * Saat bahasa aktif = EN, seluruh teks statis di halaman diterjemahkan:
 *   1. Teks yang ada di kamus cepat (autoEn.js) -> langsung.
 *   2. Teks lain -> dikumpulkan lalu diterjemahkan sekali oleh Gemini
 *      (POST /api/translate) dan disimpan di localStorage agar tidak
 *      memanggil API berulang kali.
 * Saat kembali ke ID, semua teks asli dikembalikan.
 * ==========================================================================
 */

const CACHE_KEY = 'nb_autotrans_en_v1';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'OPTION']);

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) || {};
  } catch (_) {}
  return {};
}

let cache = null;
function getCache() {
  if (!cache) cache = loadCache();
  return cache;
}

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (_) {}
}

function lookup(key) {
  if (!key) return null;
  return AUTO_EN[key] || getCache()[key] || null;
}

// Simpan teks asli per node/atribut agar bisa dikembalikan ke bahasa Indonesia.
const ORIG_TEXT = new Map(); // Text node -> original string
const ORIG_ATTR = new Map(); // Element -> { attr: original }

let pending = new Set();
let timer = null;
let inFlight = false;

function hasLetters(s) {
  return /[A-Za-zÀ-ÿ]/.test(s);
}

function translateTextNode(node) {
  const current = node.nodeValue;
  if (!current) return;
  let original = ORIG_TEXT.get(node);
  if (original === undefined) {
    original = current;
    ORIG_TEXT.set(node, original);
  } else if (current !== original && lookup(original.trim())) {
    // React mengganti isi node; simpan versi terbaru sebagai teks asli
    original = current;
    ORIG_TEXT.set(node, original);
  }
  const key = original.trim();
  if (!key || key.length < 2 || !hasLetters(key)) return;
  const hit = lookup(key);
  if (hit) {
    const lead = original.match(/^\s*/)[0];
    const trail = original.match(/\s*$/)[0];
    node.nodeValue = lead + hit + trail;
  } else if (key.length <= 200) {
    pending.add(key);
  }
}

function translateElementAttrs(el) {
  if (!el || !el.getAttribute) return;
  let store = ORIG_ATTR.get(el);
  if (!store) {
    store = {};
    ORIG_ATTR.set(el, store);
  }
  for (const attr of ATTRS) {
    const val = el.getAttribute(attr);
    if (!val) continue;
    if (store[attr] === undefined) store[attr] = val;
    const orig = store[attr];
    const hit = lookup(orig.trim());
    if (hit) el.setAttribute(attr, hit);
    else if (orig.trim().length <= 200 && hasLetters(orig)) pending.add(orig.trim());
  }
}

function walk(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    const parent = root.parentElement;
    if (parent && !SKIP_TAGS.has(parent.tagName) && !parent.closest('[data-no-translate]')) {
      translateTextNode(root);
    }
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (SKIP_TAGS.has(root.tagName) || root.closest?.('[data-no-translate]')) return;

  translateElementAttrs(root);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n = walker.nextNode();
  while (n) {
    const parent = n.parentElement;
    if (parent && !SKIP_TAGS.has(parent.tagName) && !parent.closest('[data-no-translate]')) {
      translateTextNode(n);
    }
    n = walker.nextNode();
  }
}

async function flushPending() {
  timer = null;
  if (inFlight || pending.size === 0) return;
  const texts = [...pending].filter((t) => !lookup(t)).slice(0, 80);
  pending = new Set();
  if (!texts.length) return;

  inFlight = true;
  try {
    const res = await fetch(apiUrl('/api/translate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });
    const data = await res.json();
    if (data && Array.isArray(data.translations)) {
      data.translations.forEach((tr, i) => {
        if (typeof tr === 'string' && tr.trim()) getCache()[texts[i]] = tr.trim();
      });
      saveCache();
      walk(document.body);
    }
  } catch (_) {
    // Diamkan: teks tetap bahasa Indonesia bila layanan terjemahan mati.
  } finally {
    inFlight = false;
  }
}

function scheduleApply(root) {
  walk(root || document.body);
  if (pending.size && !timer) timer = setTimeout(flushPending, 350);
}

function restoreAll() {
  for (const [node, original] of ORIG_TEXT) {
    if (node && node.isConnected && node.nodeValue !== original) node.nodeValue = original;
  }
  ORIG_TEXT.clear();
  for (const [el, store] of ORIG_ATTR) {
    if (!el || !el.isConnected) continue;
    for (const attr of Object.keys(store)) {
      if (el.getAttribute(attr) !== store[attr]) el.setAttribute(attr, store[attr]);
    }
  }
  ORIG_ATTR.clear();
  pending = new Set();
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export default function AutoTranslate() {
  const { lang } = useApp();

  useEffect(() => {
    if (lang !== 'en') {
      restoreAll();
      return undefined;
    }

    scheduleApply(document.body);

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        scheduleApply(document.body);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      restoreAll();
    };
  }, [lang]);

  return null;
}
