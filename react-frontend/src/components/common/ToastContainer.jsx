import React, { useState, useEffect, useRef } from 'react';

/**
 * ToastItem component representing a single toast notification.
 * Unified design featuring:
 * - Dark background with subtle backdrop blur and deep shadow
 * - Colored left indicator bar according to type (info: gray, success: green, warning: amber, error: red)
 * - Representative SVG icon aligned to the left
 * - Clean white typography with optional subtitle/details
 * - Optional secondary/primary action buttons
 * - Close 'X' button
 * - Slide-in and slide-out transitions
 * - Configurable timeout with hover-pause support
 */
function ToastItem({ toast, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);
  const remainingTimeRef = useRef(toast.duration || 4500);
  const startTimeRef = useRef(Date.now());

  const startTimer = () => {
    if (toast.duration === 0 || toast.duration === Infinity) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleClose();
    }, remainingTimeRef.current);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  };

  useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 280); // match animation duration
  };

  // Color & Icon config based on type
  const config = {
    success: {
      barColor: '#10B981',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" fill="#10B981" />
          <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    error: {
      barColor: '#EF4444',
      borderColor: 'rgba(239, 68, 68, 0.35)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" fill="#EF4444" />
          <path d="M15 9l-6 6M9 9l6 6" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    warning: {
      barColor: '#F59E0B',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" fill="#F59E0B" />
          <path d="M12 8v5M12 16h.01" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    info: {
      barColor: '#94A3B8',
      borderColor: 'rgba(148, 163, 184, 0.28)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" fill="#64748B" />
          <path d="M12 16v-4M12 8h.01" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  }[toast.type || 'info'] || {
    barColor: '#94A3B8',
    borderColor: 'rgba(148, 163, 184, 0.28)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" fill="#64748B" />
        <path d="M12 16v-4M12 8h.01" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  return (
    <div
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      style={{
        pointerEvents: 'auto',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${config.borderColor}`,
        borderLeft: `5px solid ${config.barColor}`,
        borderRadius: '12px',
        padding: '14px 18px',
        minWidth: '320px',
        maxWidth: '520px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        boxSizing: 'border-box',
        animation: isExiting
          ? 'toastSlideOut 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          : 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        color: '#F8FAFC',
        fontFamily: 'inherit',
      }}
    >
      {/* Icon */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '1px' }}>
        {config.icon}
      </div>

      {/* Content */}
      <div style={{ flex: '1 1 auto', minWidth: 0, paddingRight: '6px' }}>
        {toast.title && (
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '2px', lineHeight: '1.3' }}>
            {toast.title}
          </div>
        )}
        <div style={{
          fontSize: '0.92rem',
          lineHeight: '1.45',
          color: '#F1F5F9',
          fontWeight: toast.title ? '400' : '500',
          wordBreak: 'break-word',
        }}>
          {toast.message}
        </div>

        {toast.subtitle && (
          <div style={{
            fontSize: '0.82rem',
            color: '#94A3B8',
            marginTop: '4px',
            lineHeight: '1.35',
          }}>
            {toast.subtitle}
          </div>
        )}

        {/* Action buttons */}
        {toast.actions && toast.actions.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {toast.actions.map((act, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  act.onClick?.();
                  handleClose();
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: act.primary ? '#10B981' : 'rgba(255, 255, 255, 0.12)',
                  border: act.primary ? 'none' : '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        title="Cerrar notificación"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.55)',
          cursor: 'pointer',
          padding: '2px 4px',
          margin: '-4px -6px 0 0',
          fontSize: '1.1rem',
          lineHeight: '1',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#FFFFFF';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now() + Math.random();
      const newToast = {
        id,
        message: e.detail.message,
        type: e.detail.type || 'info',
        title: e.detail.title,
        subtitle: e.detail.subtitle,
        duration: e.detail.duration !== undefined ? e.detail.duration : 4500,
        actions: e.detail.actions || null,
      };

      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  const handleDismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 48px)',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
      <style>
        {`
          @keyframes toastSlideIn {
            from {
              transform: translateX(110%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes toastSlideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(110%);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}
