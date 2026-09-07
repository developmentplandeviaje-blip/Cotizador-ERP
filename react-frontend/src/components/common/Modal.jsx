import React from 'react';

export default function Modal({ isOpen, onClose, title, steps, currentStep, children, width = '600px' }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: width,
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {steps ? (
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              {steps.map((step, idx) => {
                const isActive = currentStep === idx + 1;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: isActive ? '1px solid #2563EB' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? '600' : '400',
                    }}
                  >
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isActive ? '#2563EB' : 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#FFFFFF'
                    }}>
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#FFFFFF' }}>
              {title}
            </h3>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              marginLeft: '12px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
