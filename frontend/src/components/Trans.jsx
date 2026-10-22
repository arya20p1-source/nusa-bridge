/**
 * Komponen helper untuk merender string HTML i18n secara aman.
 * Dipakai oleh komponen <T /> dan hook useT() di seluruh halaman.
 */
export function Trans({ html, tag = 'span', className }) {
  if (!html) return null;
  const Tag = tag;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default Trans;
