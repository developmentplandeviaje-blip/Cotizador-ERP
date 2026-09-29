import React, { useState, useEffect } from 'react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now() + Math.random();
      const newToast = { id, message: e.detail.message, type: e.detail.type };
      
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {toasts.map((toast) => {
        let bgColor = '#1E293B';
        let icon = 'ℹ️';
        let borderColor = '#3B82F6'; // info

        if (toast.type === 'success') {
          borderColor = '#10B981';
          icon = '✅';
        } else if (toast.type === 'error') {
          borderColor = '#EF4444';
          icon = '❌';
        } else if (toast.type === 'warning') {
          borderColor = '#F59E0B';
          icon = '⚠️';
        }

        return (
          <div key={toast.id} style={{
            backgroundColor: bgColor,
            color: '#F8FAFC',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: `4px solid ${borderColor}`,
            minWidth: '300px',
            maxWidth: '450px',
            animation: 'slideIn 0.3s ease-out forwards',
            fontSize: '0.95rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            <span style={{ lineHeight: '1.4' }}>{toast.message}</span>
          </div>
        );
      })}
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
