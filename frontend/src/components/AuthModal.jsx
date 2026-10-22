import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

function buildRegisterArgs(sessionUser) {
  return JSON.stringify({
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

  const open = modal?.type === 'auth';

  if (!open) return null;

  const title = isEn
    ? (modal.mode === 'register' ? 'Register NusaBridge Account' : 'Log In to NusaBridge')
    : (modal.mode === 'register' ? 'Daftar Akun NusaBridge' : 'Masuk ke NusaBridge');

  async function handleSubmit(e) {
    e.preventDefault();
    const sessionUser = {
      company: company.trim() || 'CV Kopi Nusantara Mandiri',
      email: email.trim() || 'owner@bisnis.id',
      role: tab === 'buyer' ? 'buyer' : 'seller',
      plan: modal.plan || 'Free Trial (1 Bulan)',
    };

    login(sessionUser);

    // Kirim ke backend registration API (best-effort, backend mungkin tidak berjalan)
    try {
      await fetch('/api/auth/register', {
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
