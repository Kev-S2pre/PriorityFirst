import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Info, HelpCircle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'danger'
  onConfirm,
  onCancel,
  icon: CustomIcon = null
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus confirm button when opened for accessibility
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';

  return (
    <div 
      className="modal-overlay" 
      onClick={onCancel}
      role="dialog" 
      aria-modal="true"
      style={{ zIndex: 1100 }}
    >
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '440px', 
          width: '100%',
          boxShadow: 'var(--shadow-modal)',
          border: isDanger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)'
        }}
      >
        <div className="modal-header" style={{ padding: '1.25rem 1.25rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {CustomIcon ? (
              <CustomIcon size={22} style={{ color: isDanger ? 'var(--danger)' : 'var(--primary)' }} />
            ) : isDanger ? (
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--danger)',
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={20} />
              </div>
            ) : (
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0
                }}
              >
                <HelpCircle size={20} />
              </div>
            )}
            <h2 className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {title}
            </h2>
          </div>
          <button 
            className="action-icon-btn" 
            onClick={onCancel}
            aria-label="Close confirmation dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0.75rem 1.25rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-surface-elevated)' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onCancel}
            id="btn-confirm-cancel"
          >
            {cancelText}
          </button>
          <button 
            ref={confirmBtnRef}
            type="button" 
            className={isDanger ? 'btn-primary' : 'btn-primary'}
            style={isDanger ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
            onClick={onConfirm}
            id="btn-confirm-action"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
