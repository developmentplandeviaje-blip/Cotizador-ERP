import React from 'react';

export default function DonutKpiCard({
  title = "Clientes",
  legendBlue = { label: "Frecuentes", value: 52 },
  legendOrange = { label: "Nuevos", value: 30 },
  loading = false
}) {
  const blueVal = Number(legendBlue?.value || 0);
  const orangeVal = Number(legendOrange?.value || 0);
  const rawTotal = blueVal + orangeVal;
  const total = rawTotal > 0 ? rawTotal : 1;
  const radius = 26;
  const circumference = 2 * Math.PI * radius; // ~163.36
  const bluePct = rawTotal > 0 ? (blueVal / total) : 0;
  const orangePct = rawTotal > 0 ? (orangeVal / total) : 0;
  const blueDash = circumference * bluePct;
  const orangeDash = circumference * orangePct;

  return (
    <div 
      className="dash-card" 
      style={{ 
        padding: '16px 18px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        minWidth: '185px'
      }}
    >
      {/* Title */}
      <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.2px' }}>
        {title}
      </span>

      {/* Donut and Legend row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="donutBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="donutOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff7b00" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>

            {/* Background ring track */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="9"
            />

            {/* Blue Segment */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="url(#donutBlueGrad)"
              strokeWidth="9"
              strokeDasharray={`${blueDash} ${circumference}`}
              strokeDashoffset="0"
              style={{ filter: 'drop-shadow(0 0 4px rgba(37,99,235,0.6))' }}
            />

            {/* Orange Segment */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="url(#donutOrangeGrad)"
              strokeWidth="9"
              strokeDasharray={`${orangeDash} ${circumference}`}
              strokeDashoffset={`-${blueDash}`}
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,123,0,0.6))' }}
            />
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem' }}>
          {/* Blue Item */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', flexShrink: 0, boxShadow: '0 0 6px #2563eb' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>{legendBlue.label}</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>.......</span>
            <span style={{ color: '#ffffff', fontWeight: '700' }}>{legendBlue.value}</span>
          </div>

          {/* Orange Item */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff7b00', flexShrink: 0, boxShadow: '0 0 6px #ff7b00' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>{legendOrange.label}</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>.......</span>
            <span style={{ color: '#ffffff', fontWeight: '700' }}>{legendOrange.value}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
