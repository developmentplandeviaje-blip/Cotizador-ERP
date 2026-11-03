import React, { useState, useEffect } from 'react';

/**
 * Dynamic confirmation modal theme definitions
 * Matches the design reference: dark backdrop, rounded floating card, top icon box, clear hierarchy, and dynamic color variants.
 */
export const CONFIRMATION_THEMES = {
  danger: {
    bgColor: 'rgb(73 38 38)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    iconBg: 'rgba(239, 68, 68, 0.15)',
    iconColor: '#FCA5A5',
    btnBg: '#DC2626',
    btnHoverBg: '#B91C1C',
    errorBg: 'rgba(239, 68, 68, 0.18)',
    errorBorder: 'rgba(239, 68, 68, 0.45)',
    errorColor: '#FCA5A5',
    defaultConfirmText: 'Eliminar',
    defaultProcessingText: 'Eliminando...',
    defaultIcon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  warning: {
    bgColor: 'rgb(66 48 24)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    iconBg: 'rgba(245, 158, 11, 0.18)',
    iconColor: '#FCD34D',
    btnBg: '#D97706',
    btnHoverBg: '#B45309',
    errorBg: 'rgba(245, 158, 11, 0.18)',
    errorBorder: 'rgba(245, 158, 11, 0.45)',
    errorColor: '#FCD34D',
    defaultConfirmText: 'Continuar',
    defaultProcessingText: 'Procesando...',
    defaultIcon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  info: {
    bgColor: 'rgb(24 38 60)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    iconBg: 'rgba(59, 130, 246, 0.18)',
    iconColor: '#93C5FD',
    btnBg: '#2563EB',
    btnHoverBg: '#1D4ED8',
    errorBg: 'rgba(59, 130, 246, 0.18)',
    errorBorder: 'rgba(59, 130, 246, 0.45)',
    errorColor: '#93C5FD',
    defaultConfirmText: 'Aceptar',
    defaultProcessingText: 'Procesando...',
    defaultIcon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  success: {
    bgColor: 'rgb(20 54 38)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    iconBg: 'rgba(16, 185, 129, 0.18)',
    iconColor: '#6EE7B7',
    btnBg: '#059669',
    btnHoverBg: '#047857',
    errorBg: 'rgba(16, 185, 129, 0.18)',
    errorBorder: 'rgba(16, 185, 129, 0.45)',
    errorColor: '#6EE7B7',
    defaultConfirmText: 'Confirmar',
    defaultProcessingText: 'Guardando...',
    defaultIcon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
};

export function ConfirmationModal({
  isOpen,
  type = 'danger',
  title = "Confirmar Acción",
  subtitle = "Esta acción requiere confirmación",
  content,
  icon,
  onClose,
  onCancel,
  onConfirm,
  isConfirming,
  isDeleting,
  error,
  confirmText,
  cancelText = "Cancelar",
  processingText,
  zIndex = 9999,
}) {
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);

  const handleCancel = onCancel || onClose;
  const isProcessing = Boolean(isConfirming || isDeleting);
  const theme = CONFIRMATION_THEMES[type] || CONFIRMATION_THEMES.danger;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && handleCancel && !isProcessing) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel, isProcessing]);

  if (!isOpen) return null;

  const resolvedConfirmText = isProcessing
    ? (processingText || theme.defaultProcessingText)
    : (confirmText || theme.defaultConfirmText);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex,
        padding: '16px',
        animation: 'fadeInModal 0.2s ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && handleCancel && !isProcessing) {
          handleCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        style={{
          backgroundColor: theme.bgColor,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          transition: 'all 0.25s ease-in-out',
        }}
      >
        {/* Header Block: Icon container + Title & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              backgroundColor: theme.iconBg,
              width: '48px',
              height: '48px',
              minWidth: '48px',
              borderRadius: '12px',
              color: theme.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            {icon || theme.defaultIcon}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              id="confirmation-modal-title"
              style={{
                margin: '0 0 6px 0',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: 'inherit',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: 0,
                color: '#CBD5E1',
                fontSize: '0.875rem',
                lineHeight: '1.4',
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Central Content Area */}
        {content && (
          <div
            style={{
              color: '#E2E8F0',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              marginBottom: '18px',
            }}
          >
            {content}
          </div>
        )}

        {/* Dynamic Error Banner */}
        {error && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: theme.errorBg,
              border: `1px solid ${theme.errorBorder}`,
              borderRadius: '8px',
              color: theme.errorColor,
              fontSize: '0.8125rem',
              lineHeight: '1.4',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Action Buttons: Cancelar & Execution Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
          {handleCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              onMouseEnter={() => setIsCancelHovered(true)}
              onMouseLeave={() => setIsCancelHovered(false)}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                backgroundColor: isCancelHovered ? 'rgba(55, 55, 55, 0.95)' : 'rgb(39 39 39 / 82%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#E2E8F0',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => setIsBtnHovered(false)}
            style={{
              padding: '9px 22px',
              borderRadius: '8px',
              backgroundColor: isBtnHovered ? theme.btnHoverBg : theme.btnBg,
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s ease, transform 0.1s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {isProcessing && (
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            )}
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Backward compatibility default export
export default ConfirmationModal;
