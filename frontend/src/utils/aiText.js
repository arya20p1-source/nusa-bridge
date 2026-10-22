/**
 * Utilitas format teks jawaban NusaBridge AI (dipakai chat beranda & halaman solusi).
 * Dipindahkan dari logic vanilla app.js.
 */

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Markdown ringan khas NusaBridge AI -> HTML ringan untuk innerHTML bubble. */
export function formatAiText(str) {
  if (!str) return '';
  let text = String(str).replace(/<[^>]*>/g, '');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/^#{1,6}\s*(.*$)/gm, '<strong>$1</strong>');
  text = text.replace(/^&gt;\s*/gm, '💡 ').replace(/^>\s*/gm, '💡 ');
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br>');
  return text;
}

export default { escapeHtml, formatAiText };
