import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { apiUrl } from '../utils/api.js';
import { getInitials, readLogoFile } from '../utils/logo.js';

function buildRegisterArgs(sessionUser) {
  return JSON.stringify({
    name: sessionUser.company,
    company: sessionUser.company,
    email: sessionUser.email,
    role: sessionUser.role,
    plan: sessionUser.plan,
  });
}

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
  const [logo, setLogo] = useState('');
  const [logoBusy, setLogoBusy] = useState(false);
  const logoInputRef = useRef(null);

  const open = modal?.type === 'auth';

  // Saat modal ditutup, kosongkan logo agar tidak terbawa ke akun berikutnya.
  useEffect(() => {
    if (!open) {
      setLogo('');
      setLogoBusy(false);
    }
  }, [open]);

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
    const sessionUser = {
      company: company.trim() || 'CV Kopi Nusantara Mandiri',
      email: email.trim() || 'owner@bisnis.id',
      role: tab === 'buyer' ? 'buyer' : 'seller',
      plan: modal.plan || 'Free Trial (1 Bulan)',
      logo,
    };

    login(sessionUser);

    // Kirim ke backend registration API (best-effort, backend mungkin tidak berjalan)
    try {
      await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: buildRegisterArgs(sessionUser),
      });
    } catch (_) {}

    closeModal();
    showToast(`🎉 Selamat datang, ${sessionUser.company}! Akun Anda aktif.`);
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
              ? 'Access AI Agent for UMKM export automation and management.'
              : 'Akses AI Agent untuk otomasi dan pengelolaan ekspor UMKM.'}
          </p>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'seller' ? 'active' : ''}`}
            onClick={() => setTab('seller')}
          >
            {isEn ? 'UMKM Business (Seller)' : 'Pelaku UMKM (Seller)'}
          </button>
          <button
            className={`modal-tab ${tab === 'buyer' ? 'active' : ''}`}
            onClick={() => setTab('buyer')}
          >
            {isEn ? 'Global Buyer' : 'Global Buyer'}
          </button>
        </div>

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

          <button type="submit" className="btn btn-primary btn-block">
            {isEn ? ('Continue') : 'Lanjutkan'}
          </button>
        </form>
      </div>
    </div>
  );
}
