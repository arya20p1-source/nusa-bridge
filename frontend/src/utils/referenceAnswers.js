import referenceAnswers from '../../../shared/reference-answers.json';

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreEntry(entry, text) {
  let score = 0;

  for (const keyword of entry.keywords) {
    const key = normalize(keyword);
    if (key && text.includes(key)) {
      score += 10 + key.split(' ').length * 3 + Math.min(key.length, 20) * 0.2;
    }
  }

  for (const pattern of entry.patterns || []) {
    if (new RegExp(pattern, 'i').test(text)) score += 25;
  }

  return score;
}

export function findLocalReferenceAnswer(query, lang = 'id') {
  const text = normalize(query);
  if (text.length < 3) return null;

  let best = null;
  let bestScore = 0;

  for (const entry of referenceAnswers) {
    const score = scoreEntry(entry, text);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (!best || bestScore < 10) return null;

  return {
    id: best.id,
    title: best.title,
    answer: lang === 'en' ? best.answerEn : best.answer,
    sources: best.sources.map((source) => ({ ...source, type: 'official' })),
  };
}
