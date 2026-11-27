import React from 'react';

function getInitials(name, fallback = '') {
  if (fallback) return fallback;
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TopVentas3DPillars({ topVentas = [], loading = false }) {
  const seller1 = topVentas?.[0] || null;
  const seller2 = topVentas?.[1] || null;
  const seller3 = topVentas?.[2] || null;
  const hasAnySellers = Boolean(seller1 || seller2 || seller3);

  return (
    <div 
      className="dash-card" 
      style={{ 
        padding: '24px 20px 20px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '380px',
        opacity: loading ? 0.75 : 1,
        transition: 'opacity 0.25s ease'
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
        <div style={{ textAlign: 'right', lineHeight: '1.1' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#1d4ed8', letterSpacing: '-0.3px' }}>
            Top De
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#ff6a00', letterSpacing: '-0.3px' }}>
            Ventas
          </div>
          {!loading && !hasAnySellers && (
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
              Sin ventas en el rango
            </div>
          )}
          {!loading && hasAnySellers && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', textAlign: 'right' }}>
              {seller1?.amount && (
                <div style={{ fontSize: '0.74rem', color: '#93c5fd', fontWeight: '700' }}>
                  1°: {seller1.amount}
                </div>
              )}
              {seller2?.amount && (
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: '600' }}>
                  2°: {seller2.amount}
                </div>
              )}
              {seller3?.amount && (
                <div style={{ fontSize: '0.70rem', color: '#94a3b8', fontWeight: '600' }}>
                  3°: {seller3.amount}
                </div>
              )}
            </div>
          )}
          {loading && (
            <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '4px' }}>
              Actualizando...
            </div>
          )}
        </div>
      </div>

      {/* 3D Cylindrical Pillars SVG */}
      <div style={{ width: '100%', flex: 1, minHeight: '260px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <svg width="100%" height="100%" viewBox="0 0 270 280" style={{ maxWidth: '300px', maxHeight: '300px' }}>
          <defs>
            {/* Cylinder 1 (Tallest) Gradients */}
            <linearGradient id="cyl1BodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a2a7a" />
              <stop offset="25%" stopColor="#1e40af" />
              <stop offset="65%" stopColor="#3b82f6" />
              <stop offset="90%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="cyl1SideShade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
              <stop offset="20%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="80%" stopColor="rgba(0,0,0,0.1)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
            </linearGradient>

            {/* Cylinder 2 (Medium) Gradients */}
            <linearGradient id="cyl2BodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a2a7a" />
              <stop offset="25%" stopColor="#1d4ed8" />
              <stop offset="65%" stopColor="#3b82f6" />
              <stop offset="90%" stopColor="#bfdbfe" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            {/* Cylinder 3 (Shortest) Gradients */}
            <linearGradient id="cyl3BodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a2a7a" />
              <stop offset="25%" stopColor="#2563eb" />
              <stop offset="65%" stopColor="#60a5fa" />
              <stop offset="90%" stopColor="#bfdbfe" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Top Cap Gradient */}
            <radialGradient id="topCapGrad" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="70%" stopColor="#0d328c" />
              <stop offset="100%" stopColor="#05194d" />
            </radialGradient>

            {/* ClipPaths for Avatar Image in Top Cap Ellipse */}
            <clipPath id="clipCap1">
              <ellipse cx="45" cy="50" rx="25" ry="18" />
            </clipPath>
            <clipPath id="clipCap2">
              <ellipse cx="125" cy="95" rx="25" ry="18" />
            </clipPath>
            <clipPath id="clipCap3">
              <ellipse cx="205" cy="140" rx="25" ry="18" />
            </clipPath>

            {/* Drop Shadow Filter */}
            <filter id="cylShadow" x="-20%" y="-10%" width="140%" height="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
              <feOffset dx="-2" dy="8" result="offsetblur" />
              <feFlood floodColor="rgba(0,0,0,0.4)" />
              <feComposite in2="offsetblur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ===================== PILLAR 1 (LEFT - 1° LUGAR - TALLEST) ===================== */}
          <g filter="url(#cylShadow)" style={{ cursor: 'pointer' }}>
            <title>{seller1 ? `1° Lugar: ${seller1.name} (${seller1.amount || ''})` : '1° Lugar: Sin registros en este periodo'}</title>
            {/* Body */}
            <path
              d="M 20 50 L 20 255 A 25 15 0 0 0 70 255 L 70 50 Z"
              fill="url(#cyl1BodyGrad)"
            />
            {/* Specular lighting overlay */}
            <path
              d="M 20 50 L 20 255 A 25 15 0 0 0 70 255 L 70 50 Z"
              fill="url(#cyl1SideShade)"
            />
            {/* Top Cap Ellipse / Círculo de la imagen */}
            <ellipse
              cx="45"
              cy="50"
              rx="25"
              ry="18"
              fill="url(#topCapGrad)"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.8"
            />
            {/* Si posee imagen se muestra en el círculo; si NO posee imagen, colocar las iniciales */}
            {seller1?.avatar ? (
              <image
                href={seller1.avatar}
                x="20"
                y="32"
                width="50"
                height="36"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#clipCap1)"
              />
            ) : (
              <text
                x="45"
                y="55"
                textAnchor="middle"
                fill={seller1 ? "#ffffff" : "rgba(255, 255, 255, 0.35)"}
                fontSize="14"
                fontWeight="800"
                letterSpacing="1.2px"
                style={{
                  userSelect: 'none',
                  filter: seller1 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))' : 'none',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {seller1 ? getInitials(seller1.name, seller1.initials) : '-'}
              </text>
            )}
          </g>

          {/* ===================== PILLAR 2 (CENTER - 2° LUGAR - MEDIUM) ===================== */}
          <g filter="url(#cylShadow)" style={{ cursor: 'pointer' }}>
            <title>{seller2 ? `2° Lugar: ${seller2.name} (${seller2.amount || ''})` : '2° Lugar: Sin registros en este periodo'}</title>
            {/* Body */}
            <path
              d="M 100 95 L 100 255 A 25 15 0 0 0 150 255 L 150 95 Z"
              fill="url(#cyl2BodyGrad)"
            />
            {/* Specular lighting overlay */}
            <path
              d="M 100 95 L 100 255 A 25 15 0 0 0 150 255 L 150 95 Z"
              fill="url(#cyl1SideShade)"
            />
            {/* Top Cap Ellipse / Círculo de la imagen */}
            <ellipse
              cx="125"
              cy="95"
              rx="25"
              ry="18"
              fill="url(#topCapGrad)"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.8"
            />
            {/* Si posee imagen se muestra en el círculo; si NO posee imagen, colocar las iniciales */}
            {seller2?.avatar ? (
              <image
                href={seller2.avatar}
                x="100"
                y="77"
                width="50"
                height="36"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#clipCap2)"
              />
            ) : (
              <text
                x="125"
                y="100"
                textAnchor="middle"
                fill={seller2 ? "#ffffff" : "rgba(255, 255, 255, 0.35)"}
                fontSize="14"
                fontWeight="800"
                letterSpacing="1.2px"
                style={{
                  userSelect: 'none',
                  filter: seller2 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))' : 'none',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {seller2 ? getInitials(seller2.name, seller2.initials) : '-'}
              </text>
            )}
          </g>

          {/* ===================== PILLAR 3 (RIGHT - 3° LUGAR - SHORTEST) ===================== */}
          <g filter="url(#cylShadow)" style={{ cursor: 'pointer' }}>
            <title>{seller3 ? `3° Lugar: ${seller3.name} (${seller3.amount || ''})` : '3° Lugar: Sin registros en este periodo'}</title>
            {/* Body */}
            <path
              d="M 180 140 L 180 255 A 25 15 0 0 0 230 255 L 230 140 Z"
              fill="url(#cyl3BodyGrad)"
            />
            {/* Specular lighting overlay */}
            <path
              d="M 180 140 L 180 255 A 25 15 0 0 0 230 255 L 230 140 Z"
              fill="url(#cyl1SideShade)"
            />
            {/* Top Cap Ellipse / Círculo de la imagen */}
            <ellipse
              cx="205"
              cy="140"
              rx="25"
              ry="18"
              fill="url(#topCapGrad)"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.8"
            />
            {/* Si posee imagen se muestra en el círculo; si NO posee imagen, colocar las iniciales */}
            {seller3?.avatar ? (
              <image
                href={seller3.avatar}
                x="180"
                y="122"
                width="50"
                height="36"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#clipCap3)"
              />
            ) : (
              <text
                x="205"
                y="145"
                textAnchor="middle"
                fill={seller3 ? "#ffffff" : "rgba(255, 255, 255, 0.35)"}
                fontSize="14"
                fontWeight="800"
                letterSpacing="1.2px"
                style={{
                  userSelect: 'none',
                  filter: seller3 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))' : 'none',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {seller3 ? getInitials(seller3.name, seller3.initials) : '-'}
              </text>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
