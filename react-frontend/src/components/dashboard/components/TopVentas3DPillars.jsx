import React from 'react';

export default function TopVentas3DPillars() {
  return (
    <div 
      className="dash-card" 
      style={{ 
        padding: '24px 20px 20px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '380px'
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
        </div>
      </div>

      {/* 3D Cylindrical Pillars SVG */}
      <div style={{ width: '100%', height: '290px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <svg width="270" height="280" viewBox="0 0 270 280">
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

          {/* ===================== PILLAR 1 (LEFT - TALLEST) ===================== */}
          <g filter="url(#cylShadow)">
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
            {/* Top Cap Ellipse */}
            <ellipse
              cx="45"
              cy="50"
              rx="25"
              ry="18"
              fill="url(#topCapGrad)"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.8"
            />
          </g>

          {/* ===================== PILLAR 2 (CENTER - MEDIUM) ===================== */}
          <g filter="url(#cylShadow)">
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
            {/* Top Cap Ellipse */}
            <ellipse
              cx="125"
              cy="95"
              rx="25"
              ry="18"
              fill="url(#topCapGrad)"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.8"
            />
          </g>

          {/* ===================== PILLAR 3 (RIGHT - SHORTEST) ===================== */}
          <g filter="url(#cylShadow)">
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
            {/* Top Cap Ellipse */}
            <ellipse
              cx="205"
              cy="140"
              rx="25"
              ry="18"
              fill="url(#topCapGrad)"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.8"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
