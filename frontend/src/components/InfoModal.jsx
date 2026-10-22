import { useApp } from '../context/AppContext.jsx';

/**
 * Modal informasi fleksibel (Pusat Bantuan, Syarat, Hubungi Kami, dll).
 * Konten diisi lewat context openInfo(title, html) dari komponen mana pun.
 */
export default function InfoModal() {
  const { modal, closeModal } = useApp();
  if (modal?.type !== 'info') return null;

  return (
    <div
      className="modal-overlay active show"
      id="infoModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal-card">
        <button className="modal-close-btn" onClick={closeModal}>&times;</button>
        <div className="modal-header">
          <h3 className="modal-title">{modal.title}</h3>
          <p
            className="modal-subtitle"
            dangerouslySetInnerHTML={{ __html: modal.html || '' }}
          />
        </div>
        <div style={{ textAlign: 'right', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={closeModal}>Mengerti</button>
        </div>
      </div>
    </div>
  );
}
