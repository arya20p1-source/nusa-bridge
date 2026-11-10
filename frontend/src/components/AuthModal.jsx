import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { apiFetch } from '../utils/api.js';
import { getInitials, readLogoFile } from '../utils/logo.js';

/**
 * Modal Masuk / Daftar (Pelaku UMKM vs Global Buyer).
 * Versi React dari markup authModal di index.html + produk.html.
 */
export default function AuthModal() {
  const { modal, closeModal, login, showToast, t, lang } = useApp();
  const isEn = lang === 'en';

  const [tab, setTab] = useState('seller'); // seller | buyer
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logo, setLogo] = useState('');
  const [logoBusy, setLogoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const logoInputRef = useRef(null);

  const open = modal?.type === 'auth';

  // Saat modal ditutup, kosongkan logo agar tidak terbawa ke akun berikutnya.
  useEffect(() => {
    if (!open) {
      setLogo('');
      setLogoBusy(false);
      setPassword('');
      setFormError('');
      setSaving(false);
    }
  }, [open]);

  // Tombol "Daftar sebagai eksportir/importir" memilih tab yang sesuai.
  useEffect(() => {
    if (open && (modal?.role === 'seller' || modal?.role === 'buyer')) {
      setTab(modal.role);
    }
  }, [open, modal?.role]);

  if (!open) return null;

  const title = isEn
    ? (modal.mode === 'register' ? 'Register NusaBridge Account' : 'Log In to NusaBridge')
    : (modal.mode === 'register' ? 'Daftar Akun NusaBridge' : 'Masuk ke NusaBridge');

  async function handleLogoPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLogoBusy(true);
    try {
      const dataUrl = await readLogoFile(file);
      setLogo(dataUrl);
    } catch (err) {
      showToast(`❌ ${err.message || 'Gagal memuat logo.'}`);
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setFormError('');

    const sessionUser = {
      company: company.trim() || 'CV Kopi Nusantara Mandiri',
      email: email.trim() || 'owner@bisnis.id',
      role: tab === 'buyer' ? 'buyer' : 'seller',
      plan: modal.plan || 'Free Trial (1 Bulan)',
      logo,
    };

    try {
      const isRegister = modal.mode === 'register';
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? {
            name: sessionUser.company,
            company: sessionUser.company,
            email: sessionUser.email,
            password,
            role: sessionUser.role,
            plan: sessionUser.plan,
          }
        : {
            email: sessionUser.email,
            ...(password ? { password } : {}),
          };

      let response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data = await response.json().catch(() => ({}));

      // Registrasi dengan email yang sudah ada: arahkan ke login agar
      // perilaku lama (langsung masuk) tetap terasa, tetapi token tetap
      // diterbitkan oleh server setelah kredensial diperiksa.
      if (
        isRegister &&
        response.status === 409 &&
        data.code === 'EMAIL_ALREADY_REGISTERED'
      ) {
        response = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: sessionUser.email,
            ...(password ? { password } : {}),
          }),
        });
        data = await response.json().catch(() => ({}));
      }

      if (!response.ok || !data.success || !data.token || !data.user) {
        throw new Error(
          data.message || 'Tidak dapat memproses akun. Periksa data dan coba lagi.'
        );
      }

      login(data.user, { token: data.token, logo });
      closeModal();
      showToast(
        `🎉 Selamat datang, ${data.user.company || data.user.name || sessionUser.company}!`
      );
    } catch (err) {
      const message =
        err.message ||
        'Tidak dapat menghubungi server. Akun tidak dibuat dan Anda belum masuk.';
      setFormError(message);
      showToast(`❌ ${message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay active show"
      id="authModal"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="modal-card">
        <button className="modal-close-btn" onClick={closeModal}>&times;</button>

        <div className="modal-header">
          <img src="/assets/logo-transparent.webp" alt="NusaBridge" className="modal-logo" />
          <h3 className="modal-title">{title}</h3>
          <p className="modal-subtitle">
            {isEn
              ? 'Access AI trade tools for Indonesian exporters and global importers.'
              : 'Akses fitur perdagangan AI untuk eksportir Indonesia dan importir global.'}
          </p>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'seller' ? 'active' : ''}`}
            onClick={() => setTab('seller')}
          >
            {isEn ? 'Indonesian Exporter (Seller)' : 'Eksportir Indonesia (Seller)'}
          </button>
          <button
            className={`modal-tab ${tab === 'buyer' ? 'active' : ''}`}
            onClick={() => setTab('buyer')}
          >
            {isEn ? 'Global Importer (Buyer)' : 'Importir Global (Buyer)'}
          </button>
        </div>

        <p className="modal-role-desc">
          {tab === 'buyer'
            ? t(
                'auth_role_buyer_desc',
                isEn
                  ? 'Buyer accounts focus on the catalog, product specifications, RFQs, Incoterms, and the Escrow simulation.'
                  : 'Akun buyer berfokus pada katalog, spesifikasi produk, RFQ, Incoterms, dan simulasi Escrow.'
              )
            : t(
                'auth_role_seller_desc',
                isEn
                  ? 'Seller accounts focus on business profile, product information, the RFQ flow, document drafts, KYC data, and the Escrow simulation.'
                  : 'Akun seller berfokus pada profil usaha, informasi produk, alur RFQ, draf dokumen, data KYC, dan simulasi Escrow.'
              )}
        </p>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{isEn ? 'Business Name / UMKM Brand' : 'Nama Usaha / Brand UMKM'}</label>
            <input
              type="text"
              id="authCompanyName"
              placeholder={isEn ? 'e.g.: Nusantara Coffee Jaya' : 'contoh: Kopi Nusantara Jaya'}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>{isEn ? 'Business Email or Phone Number' : 'Email atau Nomor Telepon'}</label>
            <input
              type="email"
              id="authEmail"
              placeholder="contoh: umkm@nusabridge.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              {modal.mode === 'register'
                ? (isEn ? 'Password (min. 8 characters)' : 'Kata Sandi (min. 8 karakter)')
                : (isEn ? 'Password (admin accounts)' : 'Kata Sandi (akun admin)')}
            </label>
            <input
              type="password"
              id="authPassword"
              autoComplete={modal.mode === 'register' ? 'new-password' : 'current-password'}
              required={modal.mode === 'register'}
              minLength={modal.mode === 'register' ? 8 : undefined}
              placeholder={
                modal.mode === 'register'
                  ? (isEn ? 'Create a password for your account' : 'Buat kata sandi untuk akun Anda')
                  : (isEn
                      ? 'Required for admin, optional for legacy accounts'
                      : 'Wajib untuk admin, opsional untuk akun lama')
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>{isEn ? 'Business Logo (optional)' : 'Logo Usaha (opsional)'}</label>
            <div className="logo-picker">
              <div className={`logo-preview ${logo ? 'has-logo' : ''}`}>
                {logo ? (
                  <img src={logo} alt="Pratinjau logo usaha" />
                ) : (
                  <span>{getInitials(company || (tab === 'buyer' ? 'Global Buyer' : 'UMKM'))}</span>
                )}
              </div>

              <div className="logo-picker-body">
                <div className="logo-picker-actions">
                  <button
                    type="button"
                    className="logo-upload-btn"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoBusy}
                  >
                    {logoBusy
                      ? (isEn ? 'Processing…' : 'Memproses…')
                      : logo
                        ? (isEn ? 'Change Logo' : 'Ganti Logo')
                        : (isEn ? 'Choose Logo' : 'Pilih Logo')}
                  </button>
                  {logo && (
                    <button
                      type="button"
                      className="logo-remove-btn"
                      onClick={() => setLogo('')}
                    >
                      {isEn ? 'Remove' : 'Hapus'}
                    </button>
                  )}
                </div>
                <p className="logo-picker-hint">
                  {isEn
                    ? 'PNG, JPG, WebP or SVG (max 5 MB). Your logo appears in the profile circle after login.'
                    : 'PNG, JPG, WebP, atau SVG (maks 5 MB). Logo tampil di lingkaran profil setelah masuk.'}
                </p>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="logo-file-input"
                onChange={handleLogoPick}
              />
            </div>
          </div>

          {modal.discount && (
            <div className="plan-disc-badge">{modal.discount}</div>
          )}

          {modal.plan && (
            <p className="plan-summary-inline">{modal.plan}</p>
          )}

          {formError && <p className="rfq-form-error" role="alert">{formError}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving
              ? (isEn ? 'Processing…' : 'Memproses…')
              : (isEn ? 'Continue' : 'Lanjutkan')}
          </button>
        </form>
      </div>
    </div>
  );
}
