import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Efek navigasi: scroll top saat pindah halaman, dan smooth-scroll
 * ke elemen id tertentu ketika URL membawa hash (mis. /#kyc, /#pilar-2).
 * - Elemen tidak ditemukan -> jangan scroll apa-apa (dibiarkan handler
 *   halaman seperti DashboardShowcase HomePage yang mengurus hash mock GUI).
 * - Tanpa hash (pindah halaman biasa) -> kembali ke atas.
 */
export default function useHashScroll() {
  const location = useLocation();

  useEffect(() => {
    const rawHash = (location.hash || '').replace('#', '');

    const tryScroll = () => {
      const el =
        document.getElementById(rawHash) ||
        document.getElementById(`pilar-${rawHash}`) ||
        document.querySelector(`[name="${rawHash}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };

    if (!rawHash) {
      window.scrollTo(0, 0);
      return;
    }

    if (!tryScroll()) {
      // Coba lagi setelah render selesai (elemen bisa muncul belakangan)
      requestAnimationFrame(() => {
        if (!tryScroll()) window.scrollTo(0, 0);
      });
    }
  }, [location.pathname, location.hash]);
}
