import { useI18n } from '../context/AppContext.jsx';
import Trans from './Trans.jsx';

/**
 * <T k="hero_title" /> — teks terjemahan dengan dukungan HTML ringan
 * (mis. <br>, <span class="text-accent">) dari kamus TRANSLATIONS.
 */
export default function T({ k, tag = 'span', className }) {
  const { t } = useI18n();
  return <Trans html={t(k)} tag={tag} className={className} />;
}
