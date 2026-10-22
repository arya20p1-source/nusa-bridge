import { useApp } from '../context/AppContext.jsx';

/**
 * Stack notifikasi kecil di bawah layar.
 */
export default function ToastStack() {
  const { toasts } = useApp();
  if (!toasts.length) return null;

  return (
    <div className="toast-stack">
      {toasts.map((item) => (
        <div key={item.id} className="toast-notification visible toast-item">
          {item.msg}
        </div>
      ))}
    </div>
  );
}
