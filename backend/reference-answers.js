/**
 * ==========================================================================
 * NUSABRIDGE - BACKEND REFERENCE ANSWERS SEARCH ENGINE
 * File: reference-answers.js
 * ==========================================================================
 */

const REFERENCE_ANSWERS = require('../shared/reference-answers.json');

const SYNONYMS = {
  jualan: 'jual ekspor dagang',
  menjual: 'jual ekspor dagang',
  penjualan: 'jual ekspor dagang',
  mengekspor: 'ekspor',
  diekspor: 'ekspor',
  mengimpor: 'impor',
  diimpor: 'impor',
  pengimpor: 'importir impor buyer',
  pengekspor: 'eksportir ekspor seller',
  membeli: 'beli order pesan rfq',
  belinya: 'beli order pesan rfq',
  pemesanan: 'beli order pesan rfq',
  order: 'beli order rfq',
  pesan: 'beli order rfq',
  pembuat: 'pembuat pengembang inovator arjika',
  pembuatnya: 'pembuat pengembang inovator arjika',
  pencipta: 'pencipta pembuat pengembang inovator arjika',
  penciptanya: 'pencipta pembuat pengembang inovator arjika',
  bikin: 'buat bikin',
  dibuat: 'buat dibuat',
  membuat: 'buat bikin',
  developed: 'developer develop pengembang pembuat arjika',
  developer: 'developer pengembang pembuat arjika',
  creator: 'creator pencipta pembuat pengembang arjika',
  siapakah: 'siapa',
  bebas: 'bebas chat ngobrol tanya konsultasi',
  ngobrol: 'chat ngobrol tanya konsultasi bicara',
  tanya: 'tanya chat konsultasi pertanyaan',
  bertanya: 'tanya chat konsultasi pertanyaan',
  pertanyaan: 'tanya chat konsultasi',
  keuntungan: 'kegunaan manfaat fitur fungsi',
  manfaat: 'kegunaan manfaat fitur fungsi',
  fungsi: 'kegunaan manfaat fitur fungsi',
  gunanya: 'kegunaan fungsi fitur manfaat',
  kegunaannya: 'kegunaan fungsi fitur manfaat',
  perannya: 'peran role',
  fiturnya: 'fitur pilar menu',
  caranya: 'cara langkah panduan',
  gimana: 'bagaimana cara langkah',
  lacak: 'melacak pelacakan radar tracking',
  melacak: 'lacak pelacakan radar tracking',
  rekomendasikan: 'rekomendasi saran terbaik unggulan',
  sarankan: 'rekomendasi saran terbaik unggulan',
};

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Kata umum tidak boleh menjadi dasar kecocokan parsial; tanpa filter ini
// pertanyaan seperti "komoditas apa saja" bisa salah cocok ke "bisa tanya apa saja".
const STOPWORDS = new Set([
  'yang', 'di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'dengan', 'pada', 'dalam',
  'adalah', 'ini', 'itu', 'apa', 'saja', 'aja', 'bisa', 'boleh', 'apakah',
  'saya', 'kamu', 'anda', 'kita', 'bagaimana', 'cara', 'the', 'and', 'or',
  'for', 'with', 'in', 'on', 'is', 'are', 'a', 'an', 'to', 'of', 'can',
  'i', 'you', 'do', 'does', 'my', 'your', 'what', 'how',
]);

function hasContentToken(token) {
  return token.length >= 3 && !STOPWORDS.has(token);
}

function expandText(text) {
  const norm = normalize(text);
  const words = norm.split(/\s+/).filter(Boolean);
  const result = [...words];
  for (const w of words) {
    if (SYNONYMS[w]) {
      result.push(...SYNONYMS[w].split(' '));
    }
  }
  return result.join(' ');
}

function scoreEntry(entry, text, expandedText) {
  let score = 0;

  for (const pattern of entry.patterns || []) {
    try {
      if (new RegExp(pattern, 'i').test(text) || new RegExp(pattern, 'i').test(expandedText)) {
        score += 35;
      }
    } catch (_) {}
  }

  for (const keyword of entry.keywords || []) {
    const key = normalize(keyword);
    if (!key) continue;

    if (text.includes(key)) {
      score += 20 + key.split(' ').length * 4;
    } else if (expandedText.includes(key)) {
      score += 14 + key.split(' ').length * 3;
    } else {
      const keyTokens = key.split(' ').filter((t) => t.length >= 3);
      if (keyTokens.length > 1) {
        const matches = keyTokens.filter((t) => expandedText.includes(t));
        if (matches.length === keyTokens.length) {
          score += 15 + matches.length * 2;
        } else {
          const contentTokens = keyTokens.filter(hasContentToken);
          if (contentTokens.length >= 2) {
            const contentMatches = contentTokens.filter((t) => expandedText.includes(t));
            if (contentMatches.length === contentTokens.length) {
              score += 10 + contentMatches.length * 2;
            } else if (contentMatches.length >= 2 && contentMatches.length / contentTokens.length >= 0.66) {
              score += 4 + contentMatches.length * 2;
            }
          }
        }
      }
    }
  }

  return score;
}

function findReferenceAnswer(query, lang = 'id') {
  const text = normalize(query);
  if (text.length < 2) return null;
  const expandedText = expandText(text);

  let best = null;
  let bestScore = 0;

  for (const entry of REFERENCE_ANSWERS) {
    const score = scoreEntry(entry, text, expandedText);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (!best || bestScore < 10) return null;

  return {
    id: best.id,
    title: best.title,
    answer: lang === 'en' ? (best.answerEn || best.answer) : best.answer,
    sources: (best.sources || []).map((source) => ({ ...source, type: 'official' })),
    score: bestScore,
  };
}

module.exports = {
  REFERENCE_ANSWERS,
  findReferenceAnswer,
  expandText,
  normalize,
};
