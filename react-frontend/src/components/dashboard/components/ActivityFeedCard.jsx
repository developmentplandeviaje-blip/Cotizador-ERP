import React, { useState, useMemo } from 'react';

export default function ActivityFeedCard({
  items = [],
  loading = false,
  onViewItem
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'venta' | 'cotizacion' | 'nota_credito'
  const [currentPage, setCurrentPage] = useState(0); // 0, 1, 2

  // 18 Realistic Items (3 full pages of 6) matching Ventas Agencia exactly
  const defaultItems = useMemo(() => [
    // Página 1 (0-5)
    { id: 16039, numero_ficha: 'EM16039', type: 'cotizacion', color: 'orange', estado: 'Cotización', cliente: 'asg xcdevf', fecha: '18/11/2026', total: 520, amount: '520 USD', scope: 'agencia' },
    { id: 16038, numero_ficha: 'OJ16038', type: 'cotizacion', color: 'orange', estado: 'Cotización', cliente: 'juan perez', fecha: '13/11/2026', total: 4856, amount: '4856 USD', scope: 'agencia' },
    { id: 16037, numero_ficha: 'OJ16037', type: 'cotizacion', color: 'orange', estado: 'Cotización', cliente: 'maria andrae', fecha: '13/11/2026', total: 4185, amount: '4185 USD', scope: 'agencia' },
    { id: 16036, numero_ficha: '15486', type: 'cotizacion', color: 'orange', estado: 'Cotización', cliente: 'Miguel Azuaje Gonzalez', fecha: '12/11/2026', total: 425, amount: '425 USD', scope: 'agencia' },
    { id: 16035, numero_ficha: '15485', type: 'nota_credito', color: 'red', estado: 'Nota de Crédito', cliente: 'Roxana Vivas', fecha: '12/11/2026', total: 110, amount: '110 USD', scope: 'agencia' },
    { id: 16034, numero_ficha: '15484', type: 'venta', color: 'green', estado: 'Venta', cliente: 'Luz Maria Ferrer', fecha: '12/11/2026', total: 120, amount: '120 USD', scope: 'agencia' },

    // Página 2 (6-11)
    { id: 16033, numero_ficha: '15483', type: 'venta', color: 'green', estado: 'Venta', cliente: 'Ruby Romero', fecha: '12/11/2026', total: 2914, amount: '2914 USD', scope: 'agencia' },
    { id: 16032, numero_ficha: '15482', type: 'venta', color: 'green', estado: 'Venta', cliente: 'javier scharbay', fecha: '11/11/2026', total: 0, amount: '0 USD', scope: 'agencia' },
    { id: 16030, numero_ficha: '15480', type: 'venta', color: 'green', estado: 'Venta', cliente: 'Giancarlo Gera', fecha: '11/11/2026', total: 770, amount: '770 USD', scope: 'agencia' },
    { id: 16029, numero_ficha: '15479', type: 'venta', color: 'green', estado: 'Venta', cliente: 'Gianandres Gera Torres', fecha: '11/11/2026', total: 260, amount: '260 USD', scope: 'agencia' },
    { id: 16028, numero_ficha: '15478', type: 'cotizacion', color: 'orange', estado: 'Cotización', cliente: 'Sra. .', fecha: '10/11/2026', total: 1850, amount: '1850 USD', scope: 'agencia' },
    { id: 16027, numero_ficha: '15477', type: 'venta', color: 'green', estado: 'Venta', cliente: 'Charlis Peña', fecha: '11/11/2026', total: 310, amount: '310 USD', scope: 'agencia' },

    // Página 3 (12-17)
    { id: 16025, numero_ficha: '15475', type: 'venta', color: 'green', estado: 'Venta', cliente: 'William Malave', fecha: '11/11/2026', total: 844, amount: '844 USD', scope: 'agencia' },
    { id: 16024, numero_ficha: '15474', type: 'cotizacion', color: 'orange', estado: 'Cotización', cliente: 'Juan Rodriguez', fecha: '10/11/2026', total: 740, amount: '740 USD', scope: 'agencia' },
    { id: 16023, numero_ficha: '15473', type: 'venta', color: 'green', estado: 'Venta', cliente: 'Jean Fajardo', fecha: '10/11/2026', total: 780, amount: '780 USD', scope: 'agencia' },
    { id: 16022, numero_ficha: '15472', type: 'venta', color: 'green', estado: 'Venta', cliente: 'Charlis Peña', fecha: '10/11/2026', total: 358, amount: '358 USD', scope: 'agencia' },
    { id: 16019, numero_ficha: '15469', type: 'cotizacion', color: 'orange', estado: 'Cotización', cliente: 'Sra. .', fecha: '10/11/2026', total: 1175, amount: '1175 USD', scope: 'agencia' },
    { id: 16018, numero_ficha: '15468', type: 'venta', color: 'green', estado: 'Venta', cliente: 'Jorge Luis Moreno Saez', fecha: '10/11/2026', total: 154, amount: '154 USD', scope: 'agencia' },
  ], []);

  const rawItems = items && items.length > 0 ? items : defaultItems;

  // Filtrado reactivo en memoria
  const filteredItems = useMemo(() => {
    return rawItems.filter(item => {
      // Filtro de estado
      if (statusFilter !== 'todos' && item.tipo !== statusFilter) {
        return false;
      }
      // Búsqueda textual
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase().trim();
      const clienteMatch = (item.cliente || item.title || '').toLowerCase().includes(term);
      const fechaMatch = (item.fecha || item.date || '').toLowerCase().includes(term);
      const fichaMatch = (item.numero_ficha || '').toLowerCase().includes(term);
      const estadoMatch = (item.estado || '').toLowerCase().includes(term);
      const amountMatch = (item.amount || String(item.total || '')).toLowerCase().includes(term);
      return clienteMatch || fechaMatch || fichaMatch || estadoMatch || amountMatch;
    });
  }, [rawItems, searchTerm, statusFilter]);

  // Paginación de 6 elementos por página
  const itemsPerPage = 6;
  const totalPages = Math.min(3, Math.max(1, Math.ceil(filteredItems.length / itemsPerPage)));

  // Asegurar índice de página válido
  const safePage = Math.min(currentPage, totalPages - 1);
  const paginatedItems = filteredItems.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);

  const toggleStatusFilter = () => {
    setCurrentPage(0);
    const flow = ['todos', 'venta', 'cotizacion', 'nota_credito'];
    const nextIdx = (flow.indexOf(statusFilter) + 1) % flow.length;
    setStatusFilter(flow[nextIdx]);
  };

  const handleAction = (item) => {
    if (onViewItem) {
      onViewItem(item);
    }
  };

  return (
    <div 
      className="dash-card" 
      style={{ 
        padding: '16px 18px 12px 18px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        gap: '12px',
        height: '100%',
        minHeight: '390px'
      }}
    >
      {/* Top Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="dash-feed-search-bar" style={{ flex: 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            style={{ fontSize: '0.85rem' }}
          />
        </div>

        {/* Funnel Filter Icon Button */}
        <button
          type="button"
          onClick={toggleStatusFilter}
          style={{
            background: statusFilter !== 'todos' ? 'rgba(0, 162, 255, 0.25)' : 'transparent',
            border: statusFilter !== 'todos' ? '1px solid rgba(0, 162, 255, 0.5)' : '1px solid transparent',
            borderRadius: '8px',
            color: statusFilter !== 'todos' ? '#60a5fa' : 'rgba(255,255,255,0.75)',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          title={
            statusFilter === 'todos' 
              ? 'Filtrar por tipo (Todos)' 
              : `Filtrando: ${statusFilter === 'venta' ? 'Solo Ventas' : statusFilter === 'cotizacion' ? 'Solo Cotizaciones' : 'Solo Notas de Crédito'}`
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {/* Pill List (6 items displayed per page) */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          flex: 1,
          justifyContent: 'flex-start'
        }}
      >
        {paginatedItems.length === 0 ? (
          <div style={{ padding: '30px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            No se encontraron fichas.
          </div>
        ) : (
          paginatedItems.map((item) => {
            // Colors: venta -> verde, cotizacion -> naranja, nota_credito -> rojo
            let pillClass = 'activity-pill-green';
            if (item.color === 'orange' || item.tipo === 'cotizacion') {
              pillClass = 'activity-pill-orange';
            } else if (item.color === 'red' || item.tipo === 'nota_credito') {
              pillClass = 'activity-pill-red';
            } else {
              pillClass = 'activity-pill-green';
            }

            const rawMonto = item.total !== undefined ? item.total : (item.amount ? item.amount.replace(/[^0-9.]/g, '') : '0');
            const formattedMonto = Math.round(Number(rawMonto) || 0);

            return (
              <div
                key={item.id}
                className={`activity-pill ${pillClass}`}
                onClick={() => handleAction(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 14px',
                  gap: '8px'
                }}
              >
                {/* 1. Nombre del cliente */}
                <div style={{ flex: '1 1 38%', minWidth: 0, textAlign: 'left' }}>
                  <span 
                    style={{ 
                      fontWeight: '700', 
                      fontSize: '0.82rem', 
                      color: '#ffffff',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.2'
                    }}
                    title={item.cliente || item.title}
                  >
                    {item.cliente || item.title || item.estado}
                  </span>
                </div>

                {/* 2. Fecha de creación */}
                <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.92)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {item.fecha || item.date || ''}
                  </span>
                </div>

                {/* 3. Total Badge (USD) */}
                <div style={{ flex: '0 0 auto' }}>
                  <div 
                    className="activity-badge-usd" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      lineHeight: '1.0', 
                      padding: '2px 8px',
                      minWidth: '48px'
                    }}
                  >
                    <span style={{ fontWeight: '800', fontSize: '0.8rem', color: '#ffffff' }}>
                      {formattedMonto}
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#93c5fd' }}>
                      USD
                    </span>
                  </div>
                </div>

                {/* 4. Ojo (Acceso directo al detalle / editar cotización) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(item);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    opacity: 0.9,
                    transition: 'transform 0.15s, opacity 0.15s',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                  title="Acceso directo al detalle / Editar Cotización"
                  aria-label="Acceso directo al detalle / Editar Cotización"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Paginator (3 dots, White when selected, NO orange) */}
      <div 
        className="dash-dots" 
        style={{ 
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {[0, 1, 2].map((idx) => {
          const isSelected = safePage === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentPage(idx)}
              className={`dash-dot ${isSelected ? 'active-white' : ''}`}
              style={{
                background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.28)',
                boxShadow: isSelected ? '0 0 10px rgba(255, 255, 255, 0.95)' : 'none',
                width: isSelected ? '10px' : '8px',
                height: isSelected ? '10px' : '8px',
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                outline: 'none'
              }}
              title={`Página ${idx + 1}`}
              aria-label={`Página ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
