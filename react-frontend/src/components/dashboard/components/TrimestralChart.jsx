import React, { useState, useMemo } from 'react';

export default function TrimestralChart({
  trimestralData,
  loading = false
}) {
  // 'ventas' | 'cotizaciones'
  const [activeSeries, setActiveSeries] = useState('ventas');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(2); // 0: M-2, 1: M-1, 2: Current

  const yTicks = [1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 0];

  // Default fallback data if backend is still loading
  const defaultData = useMemo(() => ({
    meses: [
      { mes: "Septiembre", ventas: 225, cotizaciones: 326 },
      { mes: "Octubre", ventas: 261, cotizaciones: 360 },
      { mes: "Noviembre", ventas: 137, cotizaciones: 183 }
    ],
    ventas: {
      rendimiento: "137 VENTAS",
      variabilidad: "-47,51%",
      actual: 137,
      anterior: 261
    },
    cotizaciones: {
      rendimiento: "183 COTIZACIONES",
      variabilidad: "-49,17%",
      actual: 183,
      anterior: 360
    }
  }), []);

  const data = trimestralData || defaultData;
  const meses = data.meses && data.meses.length === 3 ? data.meses : defaultData.meses;

  // Active series stats
  const activeStats = activeSeries === 'ventas' 
    ? (data.ventas || defaultData.ventas)
    : (data.cotizaciones || defaultData.cotizaciones);

  // Values for the 3 months
  const v0 = Number(meses[0]?.ventas ?? 0);
  const v1 = Number(meses[1]?.ventas ?? 0);
  const v2 = Number(meses[2]?.ventas ?? 0);

  const c0 = Number(meses[0]?.cotizaciones ?? 0);
  const c1 = Number(meses[1]?.cotizaciones ?? 0);
  const c2 = Number(meses[2]?.cotizaciones ?? 0);

  // Coordinate mapping for SVG (540x210)
  // X range: 46 (start) to 525 (end)
  // Peaks at: x0=140 (M-2), x1=285 (M-1), x2=430 (Current)
  // Y range: 18 (val=1000) to 180 (val=0)
  const maxTick = 1000;
  const getY = (val) => {
    const clamped = Math.max(0, Math.min(maxTick, val));
    return 180 - (clamped / maxTick) * 162;
  };

  const computeWavePaths = (val0, val1, val2) => {
    const y1 = getY(val0);
    const y2 = getY(val1);
    const y3 = getY(val2);

    const x0 = 46;
    const y0 = Math.min(176, y1 + (180 - y1) * 0.35);

    const x1 = 140;
    const x12 = 212.5;
    const y12 = Math.min(176, Math.max(y1, y2) + 26);

    const x2 = 285;
    const x23 = 357.5;
    const y23 = Math.min(176, Math.max(y2, y3) + 26);

    const x3 = 430;
    const x4 = 525;
    const y4 = Math.min(176, y3 + (180 - y3) * 0.38);

    const lineD = `
      M ${x0} ${y0}
      C ${x0 + 40} ${y0}, ${x1 - 40} ${y1}, ${x1} ${y1}
      C ${x1 + 35} ${y1}, ${x12 - 35} ${y12}, ${x12} ${y12}
      C ${x12 + 35} ${y12}, ${x2 - 35} ${y2}, ${x2} ${y2}
      C ${x2 + 35} ${y2}, ${x23 - 35} ${y23}, ${x23} ${y23}
      C ${x23 + 35} ${y23}, ${x3 - 35} ${y3}, ${x3} ${y3}
      C ${x3 + 40} ${y3}, ${x4 - 30} ${y4}, ${x4} ${y4}
    `;

    const areaD = `
      M ${x0} 180
      L ${x0} ${y0}
      C ${x0 + 40} ${y0}, ${x1 - 40} ${y1}, ${x1} ${y1}
      C ${x1 + 35} ${y1}, ${x12 - 35} ${y12}, ${x12} ${y12}
      C ${x12 + 35} ${y12}, ${x2 - 35} ${y2}, ${x2} ${y2}
      C ${x2 + 35} ${y2}, ${x23 - 35} ${y23}, ${x23} ${y23}
      C ${x23 + 35} ${y23}, ${x3 - 35} ${y3}, ${x3} ${y3}
      C ${x3 + 40} ${y3}, ${x4 - 30} ${y4}, ${x4} ${y4}
      L ${x4} 180
      Z
    `;

    return { lineD, areaD, points: [{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 }] };
  };

  const blueWave = useMemo(() => computeWavePaths(v0, v1, v2), [v0, v1, v2]);
  const orangeWave = useMemo(() => computeWavePaths(c0, c1, c2), [c0, c1, c2]);

  // Active tooltip position based on selected month (0, 1, or 2)
  const activeWave = activeSeries === 'ventas' ? blueWave : orangeWave;
  const activeMonthPoint = activeWave.points[selectedMonthIdx] || activeWave.points[2];
  const activeMonthVal = activeSeries === 'ventas'
    ? (selectedMonthIdx === 0 ? v0 : selectedMonthIdx === 1 ? v1 : v2)
    : (selectedMonthIdx === 0 ? c0 : selectedMonthIdx === 1 ? c1 : c2);

  return (
    <div 
      className="dash-card" 
      style={{ 
        padding: '20px 24px 16px 24px', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '340px'
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.2px' }}>
            Estadísticas
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2563eb', marginTop: '-4px', letterSpacing: '-0.2px' }}>
            Trimestral
          </span>
        </div>

        {/* Right Stats: RENDIMIENTO & VARIABILIDAD */}
        <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>
              RENDIMIENTO
            </div>
            <div style={{ 
              fontSize: '0.95rem', 
              fontWeight: '800', 
              color: '#ffffff',
              transition: 'all 0.25s ease'
            }}>
              {activeStats.rendimiento}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>
              VARIABILIDAD
            </div>
            <div style={{ 
              fontSize: '0.95rem', 
              fontWeight: '800', 
              color: '#ffffff',
              transition: 'all 0.25s ease'
            }}>
              {activeStats.variabilidad}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Wave Chart Container */}
      <div style={{ width: '100%', height: '210px', position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 540 210" preserveAspectRatio="none">
          <defs>
            {/* Orange Gradient Fill */}
            <linearGradient id="chartOrangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 115, 0, 0.75)" />
              <stop offset="50%" stopColor="rgba(255, 115, 0, 0.35)" />
              <stop offset="100%" stopColor="rgba(255, 115, 0, 0.0)" />
            </linearGradient>

            {/* Blue Gradient Fill */}
            <linearGradient id="chartBlueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 162, 255, 0.85)" />
              <stop offset="50%" stopColor="rgba(0, 110, 255, 0.4)" />
              <stop offset="100%" stopColor="rgba(0, 70, 255, 0.0)" />
            </linearGradient>

            {/* Glowing lines filter */}
            <filter id="neonLineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines and Y labels */}
          {yTicks.map((val, idx) => {
            const yPos = 18 + idx * 16.2; // from 18 to 180
            return (
              <g key={val}>
                {/* Y-axis label */}
                <text
                  x="38"
                  y={yPos + 3.5}
                  textAnchor="end"
                  fill="rgba(255, 255, 255, 0.65)"
                  fontSize="9.5"
                  fontWeight="500"
                >
                  {val}
                </text>
                {/* Dashed horizontal line */}
                <line
                  x1="46"
                  y1={yPos}
                  x2="525"
                  y2={yPos}
                  stroke={val === 0 ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.16)"}
                  strokeWidth={val === 0 ? "1.5" : "1"}
                  strokeDasharray={val === 0 ? "none" : "3,3"}
                />
              </g>
            );
          })}

          {/* ORANGE WAVE (Cotizaciones) */}
          <path
            d={orangeWave.areaD}
            fill="url(#chartOrangeGrad)"
            opacity={activeSeries === 'cotizaciones' ? 0.95 : 0.45}
            style={{ transition: 'all 0.4s ease', cursor: 'pointer' }}
            onClick={() => setActiveSeries('cotizaciones')}
          />
          <path
            d={orangeWave.lineD}
            fill="none"
            stroke="#ff7300"
            strokeWidth={activeSeries === 'cotizaciones' ? 3.2 : 2.0}
            filter="url(#neonLineGlow)"
            opacity={activeSeries === 'cotizaciones' ? 1 : 0.65}
            style={{ transition: 'all 0.4s ease', cursor: 'pointer' }}
            onClick={() => setActiveSeries('cotizaciones')}
          />

          {/* BLUE WAVE (Ventas) */}
          <path
            d={blueWave.areaD}
            fill="url(#chartBlueGrad)"
            opacity={activeSeries === 'ventas' ? 0.95 : 0.4}
            style={{ transition: 'all 0.4s ease', cursor: 'pointer' }}
            onClick={() => setActiveSeries('ventas')}
          />
          <path
            d={blueWave.lineD}
            fill="none"
            stroke="#00a2ff"
            strokeWidth={activeSeries === 'ventas' ? 3.2 : 2.0}
            filter="url(#neonLineGlow)"
            opacity={activeSeries === 'ventas' ? 1 : 0.65}
            style={{ transition: 'all 0.4s ease', cursor: 'pointer' }}
            onClick={() => setActiveSeries('ventas')}
          />

          {/* Interactive Month Dots for active series */}
          {activeWave.points.map((pt, idx) => (
            <g 
              key={idx} 
              style={{ cursor: 'pointer' }} 
              onClick={() => setSelectedMonthIdx(idx)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={selectedMonthIdx === idx ? 5.5 : 4}
                fill="#ffffff"
                stroke={activeSeries === 'ventas' ? '#00a2ff' : '#ff7300'}
                strokeWidth={selectedMonthIdx === idx ? 2.5 : 1.8}
                filter="drop-shadow(0 0 6px rgba(0,0,0,0.5))"
                style={{ transition: 'all 0.25s ease' }}
              />
            </g>
          ))}

          {/* Floating Tooltip Pill over Active Month Peak */}
          <g 
            transform={`translate(${activeMonthPoint.x}, ${activeMonthPoint.y - 10})`}
            style={{ transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', pointerEvents: 'none' }}
          >
            {/* Tooltip Badge */}
            <rect
              x="-18"
              y="-19"
              width="36"
              height="18"
              rx="4"
              fill="#ffffff"
              stroke={activeSeries === 'ventas' ? '#00a2ff' : '#ff7300'}
              strokeWidth="1.4"
              filter="drop-shadow(0 2px 5px rgba(0,0,0,0.45))"
            />
            {/* Arrow pointer */}
            <polygon 
              points="-4,-1 4,-1 0,4" 
              fill="#ffffff" 
            />
            {/* Value text */}
            <text
              x="0"
              y="-6.5"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="9.5"
              fontWeight="800"
            >
              {activeMonthVal}
            </text>
          </g>

          {/* X Axis Month Labels */}
          {meses.map((m, idx) => {
            const xPos = idx === 0 ? 140 : idx === 1 ? 285 : 430;
            const isSelected = selectedMonthIdx === idx;
            return (
              <text 
                key={m.mes || idx} 
                x={xPos} 
                y="202" 
                textAnchor="middle" 
                fill={isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)'} 
                fontSize="11" 
                fontWeight={isSelected ? "800" : "600"}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setSelectedMonthIdx(idx)}
              >
                {m.mes}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Bottom Legend (Interactive Clickable Series Selectors) */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginTop: '6px' }}>
        {/* Ventas Selector */}
        <button
          type="button"
          onClick={() => setActiveSeries('ventas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeSeries === 'ventas' ? 'rgba(0, 162, 255, 0.16)' : 'transparent',
            border: activeSeries === 'ventas' ? '1px solid rgba(0, 162, 255, 0.45)' : '1px solid transparent',
            borderRadius: '16px',
            padding: '4px 12px',
            cursor: 'pointer',
            opacity: activeSeries === 'ventas' ? 1 : 0.6,
            transition: 'all 0.25s ease',
            outline: 'none'
          }}
          title="Seleccionar serie Ventas"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ width: '12px', height: '2px', background: '#00a2ff' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00a2ff', boxShadow: '0 0 6px #00a2ff', margin: '0 -1px' }} />
            <span style={{ width: '12px', height: '2px', background: '#00a2ff' }} />
          </span>
          <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: activeSeries === 'ventas' ? '700' : '500' }}>
            Ventas
          </span>
        </button>

        {/* Cotizaciones Selector */}
        <button
          type="button"
          onClick={() => setActiveSeries('cotizaciones')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeSeries === 'cotizaciones' ? 'rgba(255, 115, 0, 0.16)' : 'transparent',
            border: activeSeries === 'cotizaciones' ? '1px solid rgba(255, 115, 0, 0.45)' : '1px solid transparent',
            borderRadius: '16px',
            padding: '4px 12px',
            cursor: 'pointer',
            opacity: activeSeries === 'cotizaciones' ? 1 : 0.6,
            transition: 'all 0.25s ease',
            outline: 'none'
          }}
          title="Seleccionar serie Cotizaciones"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ width: '12px', height: '2px', background: '#ff7300' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff7300', boxShadow: '0 0 6px #ff7300', margin: '0 -1px' }} />
            <span style={{ width: '12px', height: '2px', background: '#ff7300' }} />
          </span>
          <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: activeSeries === 'cotizaciones' ? '700' : '500' }}>
            Cotizaciones
          </span>
        </button>
      </div>
    </div>
  );
}
