import { useEffect } from 'react';
import Icon from './Icon';

export default function Modal({ title, subtitle, onClose, children, footer, size = 'md', center = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal-panel modal-${size} ${center ? 'text-center' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-panel__head">
          <div>
            {title && <h3 className="modal-panel__title">{title}</h3>}
            {subtitle && <p className="modal-panel__sub">{subtitle}</p>}
          </div>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <Icon name="x" size={18} />
            </button>
          )}
        </div>
        <div className="modal-panel__body">{children}</div>
        {footer && <div className="modal-panel__foot">{footer}</div>}
      </div>
    </div>
  );
}