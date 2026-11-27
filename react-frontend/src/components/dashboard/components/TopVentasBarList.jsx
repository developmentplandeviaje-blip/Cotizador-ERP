import React from 'react';

export default function TopVentasBarList({
  items = [],
  loading = false
}) {
  return (
    <div 
      className="dash-card" 
      style={{ 
        padding: '20px 22px', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '18px',
        minWidth: '220px',
        minHeight: '160px'
      }}
    >
      {/* Title */}
      <span style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.2px' }}>
        Top De Ventas
      </span>

      {/* Progress Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.45 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ height: '12px', width: '50%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                  <div style={{ height: '12px', width: '25%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                </div>
                <div style={{ height: '11px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px' }} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '12px 0' }}>
            No hay ventas registradas en esta semana
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={item.user_id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: '500' }}>
                  {item.name}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '700' }}>
                  {item.amount || `USD ${Math.round(item.total || 0)}`}
                </span>
              </div>

              {/* Gradient Bar Track */}
              <div 
                style={{ 
                  width: '100%', 
                  height: '11px', 
                  background: 'rgba(0, 0, 0, 0.35)', 
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div 
                  style={{ 
                    width: `${Math.max(5, Math.min(100, item.percentage || 0))}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #0f3ba8 0%, #2563eb 50%, #93c5fd 90%, #ffffff 100%)',
                    borderRadius: '9999px',
                    boxShadow: '0 0 8px rgba(37, 99, 235, 0.6)',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} 
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
