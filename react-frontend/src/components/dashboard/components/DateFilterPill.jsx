import React, { useState, useRef, useEffect } from 'react';

const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatDateToLabel(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parts[2].padStart(2, '0');
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MESES_ES[monthIdx] || parts[1];
  return `${day} • ${monthName}`;
}

const QUICK_WEEKS = [
  {
    label: "13 • Nov | 20 • Nov",
    start: "13 • Nov",
    end: "20 • Nov",
    startDate: "2026-11-13",
    endDate: "2026-11-20",
    description: "Semana 13 al 20 de Noviembre"
  },
  {
    label: "06 • Nov | 12 • Nov",
    start: "06 • Nov",
    end: "12 • Nov",
    startDate: "2026-11-06",
    endDate: "2026-11-12",
    description: "Semana 06 al 12 de Noviembre"
  },
  {
    label: "30 • Oct | 05 • Nov",
    start: "30 • Oct",
    end: "05 • Nov",
    startDate: "2026-10-30",
    endDate: "2026-11-05",
    description: "Semana 30 de Octubre al 05 de Noviembre"
  },
  {
    label: "23 • Oct | 29 • Oct",
    start: "23 • Oct",
    end: "29 • Oct",
    startDate: "2026-10-23",
    endDate: "2026-10-29",
    description: "Semana 23 al 29 de Octubre"
  },
  {
    label: "16 • Oct | 22 • Oct",
    start: "16 • Oct",
    end: "22 • Oct",
    startDate: "2026-10-16",
    endDate: "2026-10-22",
    description: "Semana 16 al 22 de Octubre"
  },
  {
    label: "28 • Ago | 04 • Sep",
    start: "28 • Ago",
    end: "04 • Sep",
    startDate: "2026-08-28",
    endDate: "2026-09-04",
    description: "Semana 28 de Agosto al 04 de Septiembre"
  }
];

export default function DateFilterPill({ 
  label = "13 • Nov | 20 • Nov", 
  start, 
  end,
  startDate = "2026-11-13",
  endDate = "2026-11-20",
  onSelectRange,
  onClick 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);
  const containerRef = useRef(null);

  let displayStart = start;
  let displayEnd = end;

  if (!displayStart || !displayEnd) {
    if (label && label.includes('|')) {
      const parts = label.split('|');
      displayStart = parts[0]?.trim() || "13 • Nov";
      displayEnd = parts[1]?.trim() || "20 • Nov";
    } else {
      displayStart = label || "13 • Nov";
      displayEnd = "";
    }
  }

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Actualizar valores de inputs cuando cambian las props
  useEffect(() => {
    if (startDate) setCustomStart(startDate);
    if (endDate) setCustomEnd(endDate);
  }, [startDate, endDate]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (onClick) onClick(e);
  };

  const handleSelectQuickWeek = (week) => {
    if (onSelectRange) {
      onSelectRange(week.startDate, week.endDate, week.label);
    }
    setIsOpen(false);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;

    const startLbl = formatDateToLabel(customStart);
    const endLbl = formatDateToLabel(customEnd);
    const rangeLbl = `${startLbl} | ${endLbl}`;

    if (onSelectRange) {
      onSelectRange(customStart, customEnd, rangeLbl);
    }
    setIsOpen(false);
  };

  // Al cambiar la fecha "Desde", sugerir automáticamente la fecha "Hasta" (Viernes a Jueves: +6 días)
  const handleStartChange = (e) => {
    const newStart = e.target.value;
    setCustomStart(newStart);
    if (newStart) {
      const d = new Date(newStart + 'T00:00:00');
      d.setDate(d.getDate() + 6); // +6 días corresponde a jueves
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setCustomEnd(`${yyyy}-${mm}-${dd}`);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="dash-date-pill"
        onClick={handleToggle}
        title="Haga clic para elegir semana (Viernes a Jueves)"
      >
        <span>{displayStart}</span>
        {displayEnd && <span className="sep">|</span>}
        {displayEnd && <span>{displayEnd}</span>}
        <span style={{ fontSize: '0.62rem', opacity: 0.7, marginLeft: '3px' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Popover desplegable */}
      {isOpen && (
        <div className="dash-date-popover" onClick={(e) => e.stopPropagation()}>
          <div className="dash-date-popover-header">
            <span className="dash-date-popover-title">
              📅 Elegir Semana
            </span>
            <button 
              type="button" 
              className="dash-date-popover-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <span className="dash-date-popover-hint">
            Ciclo semanal: Viernes a Jueves (Cierre semanal)
          </span>

          {/* Lista de semanas rápidas */}
          <div className="dash-date-quick-list">
            {QUICK_WEEKS.map((w, idx) => {
              const isCurrent = label.includes(w.start) && label.includes(w.end);
              return (
                <button
                  key={idx}
                  type="button"
                  className={`dash-date-quick-btn ${isCurrent ? 'active' : ''}`}
                  onClick={() => handleSelectQuickWeek(w)}
                >
                  <span style={{ fontWeight: isCurrent ? '700' : '500' }}>
                    {w.label}
                  </span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.65 }}>
                    {isCurrent ? '✓ Actual' : 'Seleccionar'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Rango Personalizado */}
          <form className="dash-date-custom-section" onSubmit={handleApplyCustom}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>
              Fechas personalizadas:
            </div>
            <div className="dash-date-inputs-row">
              <div className="dash-date-input-group">
                <label>Desde (Viernes):</label>
                <input 
                  type="date" 
                  value={customStart} 
                  onChange={handleStartChange}
                  required 
                />
              </div>
              <div className="dash-date-input-group">
                <label>Hasta (Jueves / Vie):</label>
                <input 
                  type="date" 
                  value={customEnd} 
                  onChange={(e) => setCustomEnd(e.target.value)}
                  required 
                />
              </div>
            </div>
            <button type="submit" className="dash-date-apply-btn">
              Aplicar Rango
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
