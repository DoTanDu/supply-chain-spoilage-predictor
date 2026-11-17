// src/components/ui/ModalDialog.jsx
import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Native <dialog> Modal Wrapper tuân thủ Modern Web Guidance (top-layer, focus management, Esc, overscroll-behavior)
 */
export default function ModalDialog({
  isOpen,
  onClose,
  title,
  subtitle = null,
  size = 'md', // 'sm' | 'md' | 'lg'
  closeOnBackdrop = true,
  footer = null,
  children
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback light dismiss cho các trình duyệt chưa hỗ trợ thuộc tính HTML closedby="any"
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !closeOnBackdrop) return;
    if ('closedBy' in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const isOutside = (e) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    const handlePointerDown = (e) => {
      pressedOutside = isOutside(e);
    };
    const handlePointerUp = (e) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [closeOnBackdrop]);

  const handleCancel = (e) => {
    e.preventDefault();
    if (onClose) onClose();
  };

  const handleNativeClose = () => {
    const dialog = dialogRef.current;
    if (dialog) dialog.returnValue = '';
    if (onClose) onClose();
  };

  const sizeClass = size === 'lg' ? 'ss-dialog-lg' : size === 'sm' ? 'ss-dialog-sm' : '';

  return (
    <dialog
      ref={dialogRef}
      className={`ss-dialog ${sizeClass}`.trim()}
      aria-labelledby={titleId}
      closedby={closeOnBackdrop ? 'any' : 'closerequest'}
      onCancel={handleCancel}
      onClose={handleNativeClose}
    >
      <div className="ss-dialog-header">
        <div style={{ minWidth: 0 }}>
          <h2 id={titleId} style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onClose && onClose()}
          aria-label="Đóng hộp thoại"
          className="ss-btn ss-btn-secondary ss-btn-sm"
          style={{ padding: '6px', borderRadius: '6px' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="ss-dialog-body">
        {children}
      </div>

      {footer && (
        <div className="ss-dialog-footer">
          {footer}
        </div>
      )}
    </dialog>
  );
}
