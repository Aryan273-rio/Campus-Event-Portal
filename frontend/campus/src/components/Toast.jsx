import { useEffect, useState } from 'react';
import Icon from './Icon';

// Usage anywhere: toast.success('Saved'), toast.error('Oops'), toast.info('FYI')
const emit = (type, message) =>
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { type, message, id: Date.now() + Math.random() } }));

export const toast = {
  success: (m) => emit('success', m),
  error: (m) => emit('error', m),
  info: (m) => emit('info', m),
};

const ICONS = { success: 'checkCircle', error: 'alert', info: 'sparkles' };

export function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 4200);
    };
    window.addEventListener('app-toast', onToast);
    return () => window.removeEventListener('app-toast', onToast);
  }, []);

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <Icon name={ICONS[t.type]} size={18} />
          <span>{t.message}</span>
          <button className="toast-close" aria-label="Dismiss" onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}