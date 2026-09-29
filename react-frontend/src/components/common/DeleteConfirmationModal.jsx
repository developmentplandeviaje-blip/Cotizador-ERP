import React from 'react';

export default function DeleteConfirmationModal({
  isOpen,
  title = "Confirmar Eliminación",
  subtitle = "Esta acción intentará remover el elemento",
  content,
  onCancel,
  onConfirm,
  isDeleting,
  error,
  confirmText = "Eliminar",
}) {
  if (!isOpen) return null;

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
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgb(73 38 38)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '12px',
              borderRadius: '12px',
              color: '#FCA5A5',
              fontSize: '1.5rem',
            }}
          >
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: '#FFFFFF' }}>
              {title}
            </h3>
            <p style={{ margin: 0, color: '#CBD5E1', fontSize: '0.875rem' }}>
              {subtitle}
            </p>
          </div>
        </div>

        <div style={{ color: '#E2E8F0', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
          {content}
        </div>

        {error && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              color: '#FCA5A5',
              fontSize: '0.8125rem',
              lineHeight: '1.4',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: 'rgb(39 39 39 / 82%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#E2E8F0',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: '#DC2626',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s',
            }}
          >
            {isDeleting ? 'Eliminando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
