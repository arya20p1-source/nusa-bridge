import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations.js';

/**
 * ==========================================================================
 * NUSABRIDGE - SINGLE SOURCE OF TRUTH UNTUK STATUS GLOBAL UI
 * Berisi: bahasa aktif (ID/EN), sesi login, toast notifikasi,
 *         dan modal global (auth / demo / info).
 * ==========================================================================
 */

const SESSION_KEY = 'nusabridge_session';
const LANG_KEY = 'nusabridge_lang';
const VOUCHER_KEY = 'nusabridge_voucher_claimed';

const AppContext = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function AppContextProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || 'id');
  const [session, setSession] = useState(readSession);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null); // { type: 'auth'|'demo'|'info'|'radar'|'tx', ...payload }
  const [voucherClaimed, setVoucherClaimed] = useState(
    () => localStorage.getItem(VOUCHER_KEY) === 'true'
  );

  // ---------------------------------------------------------------
  // TERJEMAHAN (ID / EN)
  // ---------------------------------------------------------------
  const t = useCallback(
    (key, fallback) => {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.id;
      if (dict && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
      const dictId = TRANSLATIONS.id || {};
      if (Object.prototype.hasOwnProperty.call(dictId, key)) return dictId[key];
      return fallback !== undefined ? fallback : key;
    },
    [lang]
  );

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch (_) {}
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Terapkan body class awal (halaman mungkin menimpanya via usePageShell)
  useEffect(() => {
    document.body.classList.add('app-react');
  }, []);

  // ---------------------------------------------------------------
  // SESI LOGIN / LOGOUT
  // ---------------------------------------------------------------
  const login = useCallback((user, opts = {}) => {
    const sessionUser = {
      loggedIn: true,
      name: user.company.replace(/^(CV|PT|UD|Koperasi)\s+/i, '') || 'UMKM Indonesia',
      company: user.company,
      email: user.email,
      role: user.role || 'seller',
      nib: user.nib || '1294801928415',
      plan: user.plan || 'Free Trial (1 Bulan)',
      logo: user.logo || '',
      token: `nb_session_${Date.now()}`,
      ...opts,
    };
    setSession(sessionUser);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    } catch (_) {}
    return sessionUser;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
    showToast('👋 Anda telah keluar dari sesi akun.');
  }, []);

  // Ganti logo profil tanpa perlu logout (dipakai Navbar).
  const updateSessionLogo = useCallback((logo) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, logo: logo || '' };
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // ---------------------------------------------------------------
  // TOAST NOTIFIKASI GLOBAL
  // ---------------------------------------------------------------
  const showToast = useCallback((msg, duration = 2600) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, msg }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((tst) => tst.id !== id));
    }, duration);
  }, []);

  // ---------------------------------------------------------------
  // MODAL GLOBAL
  // ---------------------------------------------------------------
  // modal contoh: { type:'auth', mode:'login' } | { type:'demo' } |
  // { type:'info', title:'...', html:'...' } | { type:'radar' } | { type:'tx', txKey:'gayo' }
  const openModal = useCallback((payload) => setModal(payload), []);
  const closeModal = useCallback(() => setModal(null), []);

  const openAuth = useCallback(
    (mode = 'login') => openModal({ type: 'auth', mode }),
    [openModal]
  );
  const openInfo = useCallback(
    (title, html) => openModal({ type: 'info', title, html }),
    [openModal]
  );

  // Tutup modal otomatis dengan tombol ESC, seperti versi vanilla JS lama
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeModal]);

  // ---------------------------------------------------------------
  // VOUCHER SUBSIDI (HARGA)
  // ---------------------------------------------------------------
  const setVoucherClaimedState = useCallback((next) => {
    setVoucherClaimed(next);
    try {
      localStorage.setItem(VOUCHER_KEY, next ? 'true' : 'false');
    } catch (_) {}
  }, []);

  const ctx = useMemo(
    () => ({
      lang,
      setLang,
      t,
      session,
      login,
      logout,
      updateSessionLogo,
      toasts,
      showToast,
      modal,
      openModal,
      closeModal,
      openAuth,
      openInfo,
      voucherClaimed,
      setVoucherClaimed: setVoucherClaimedState,
    }),
    [lang, setLang, t, session, login, logout, updateSessionLogo, toasts, showToast, modal, openModal, closeModal, openAuth, openInfo, voucherClaimed, setVoucherClaimedState]
  );

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

export function useI18n() {
  const ctx = useContext(AppContext);
  return { lang: ctx?.lang || 'id', t: ctx?.t || ((k) => k), setLang: ctx?.setLang };
}

export { SESSION_KEY, LANG_KEY, VOUCHER_KEY };
