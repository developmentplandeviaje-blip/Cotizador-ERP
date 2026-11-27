import React, { useState } from 'react';

const SPEED_CONFIG = [
  { key: 'anual', title: 'SPEED ANUAL', defaultMeta: 540000, defaultFormattedMeta: '540,000.00' },
  { key: 'mensual', title: 'SPEED MENSUAL', defaultMeta: 45000, defaultFormattedMeta: '45,000.00' },
  { key: 'semanal', title: 'SPEED SEMANAL', defaultMeta: 10000, defaultFormattedMeta: '10,000.00' },
];

export default function SpeedAnualCard({ 
  speedData, 
  loading = false,
  moneda = "USD",
  initialDot = 0 
}) {
  const [activeDot, setActiveDot] = useState(initialDot);

  const currentConfig = SPEED_CONFIG[activeDot] || SPEED_CONFIG[0];
  const itemData = speedData?.[currentConfig.key];

  const metaVal = itemData?.meta ?? currentConfig.defaultMeta;
  const formattedMeta = itemData?.formatted_meta ?? currentConfig.defaultFormattedMeta;
  const totalVal = itemData?.total ?? 0;
  const formattedTotal = itemData?.formatted_total ?? (
    Number(totalVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );

  // Arch gauge calculation:
  // Arc path: M 20 80 A 55 55 0 0 1 130 80 (semicircle with radius 55)
  // Total arc length: π * 55 ≈ 172.7876
  const totalArcLength = 172.79;
  let pct = itemData?.porcentaje;
  if (pct === undefined || pct === null) {
    pct = metaVal > 0 ? (totalVal / metaVal) * 100 : 0;
  }
  const clampedPct = Math.min(100, Math.max(0, Number(pct)));
  const filledLength = ((clampedPct / 100) * totalArcLength).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div 
        className="dash-card" 
        style={{ 
          padding: '18px 26px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          minWidth: '220px',
          userSelect: 'none'
        }}
      >
        {/* Title */}
        <span style={{ 
          fontSize: '0.95rem', 
          fontWeight: '800', 
          color: '#ffffff', 
          letterSpacing: '0.8px', 
          marginBottom: '12px',
          transition: 'all 0.3s ease'
        }}>
          {currentConfig.title}
        </span>

        {/* 3D Gauge Arch SVG */}
        <div style={{ position: 'relative', width: '150px', height: '85px', display: 'flex', justifyContent: 'center' }}>
          <svg width="150" height="85" viewBox="0 0 150 85">
            <defs>
              <linearGradient id="speedArchGrad" x1="0%" y1="100%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1d4ed8" />
                <stop offset="30%" stopColor="#38bdf8" />
                <stop offset="65%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="speedArchShine" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
              </linearGradient>
              <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Arch Track (Inactive background) */}
            <path
              d="M 20 80 A 55 55 0 0 1 130 80"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="20"
              strokeLinecap="round"
            />

            {/* Glowing 3D Colored Arch (Progress) */}
            <path
              d="M 20 80 A 55 55 0 0 1 130 80"
              fill="none"
              stroke="url(#speedArchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
              strokeDasharray={`${filledLength} ${totalArcLength}`}
              style={{ 
                transition: 'stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: clampedPct > 0 ? 1 : 0 
              }}
            />

            {/* Bevel Shine Overlay (Matches progress) */}
            <path
              d="M 20 80 A 55 55 0 0 1 130 80"
              fill="none"
              stroke="url(#speedArchShine)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={`${filledLength} ${totalArcLength}`}
              style={{ 
                transition: 'stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: clampedPct > 0 ? 1 : 0 
              }}
            />
          </svg>
        </div>

        {/* Subtitle Meta */}
        <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '600', marginTop: '2px', marginBottom: '6px' }}>
          Meta
        </span>

        {/* Neon Orange Glowing Badge */}
        <div 
          className="dash-glow-badge-orange" 
          style={{ 
            marginBottom: '14px', 
            fontSize: '0.88rem', 
            padding: '5px 16px',
            transition: 'all 0.3s ease'
          }}
        >
          {moneda} {formattedMeta}
        </div>

        {/* Total Recibido */}
        <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '500', marginBottom: '3px' }}>
          Total recibido
        </span>
        <span style={{ 
          fontSize: '1.2rem', 
          fontWeight: '800', 
          color: '#ffffff', 
          letterSpacing: '0.2px',
          transition: 'all 0.3s ease'
        }}>
          {moneda} {formattedTotal}
        </span>
      </div>

      {/* Dots Carousel / Paginators */}
      <div 
        className="dash-dots" 
        style={{ 
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {SPEED_CONFIG.map((cfg, idx) => (
          <button
            key={cfg.key}
            type="button"
            onClick={() => setActiveDot(idx)}
            className={`dash-dot ${activeDot === idx ? 'active-orange' : ''}`}
            style={{
              background: activeDot === idx ? '#ff7300' : 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              width: activeDot === idx ? '10px' : '8px',
              height: activeDot === idx ? '10px' : '8px',
              borderRadius: '50%',
              transition: 'all 0.25s ease',
              outline: 'none',
              boxShadow: activeDot === idx ? '0 0 10px rgba(255, 115, 0, 0.85)' : 'none'
            }}
            title={cfg.title}
            aria-label={cfg.title}
          />
        ))}
      </div>
    </div>
  );
}
