import React from 'react';

export default function MonthlyGoalCard({ 
  meta = "112,645.65", 
  totalRecibido = "101,325.11", 
  moneda = "USD" 
}) {
  return (
    <div 
      className="dash-card" 
      style={{ 
        padding: '16px 28px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        minWidth: '240px'
      }}
    >
      {/* Header Meta */}
      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>
        Meta
      </span>
      <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '-2px', marginBottom: '8px' }}>
        (mensual)
      </span>

      {/* Glowing Neon Badge */}
      <div className="dash-glow-badge-orange" style={{ marginBottom: '14px' }}>
        {moneda} {meta}
      </div>

      {/* Total recibido */}
      <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '500', marginBottom: '4px' }}>
        Total recibido
      </span>
      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.3px' }}>
        {moneda} {totalRecibido}
      </span>
    </div>
  );
}
