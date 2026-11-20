import React, { useState, useMemo } from 'react';
import cotizacionFondoP1 from '../../../assets/cotizacion_fondo.jpg';
import cotizacionFondoP2 from '../../../assets/cotizacion_fondo_pagina2.jpg';
import iconHoras from '../../../assets/icon_horas.png';
import iconDisponibilidad from '../../../assets/icon_disponibilidad.png';

export default function InformeCotizacionRapidaModal({
  isOpen,
  onClose,
  cotizacion,
  tipoInforme = 'cotizacion',
  tasaReferencialVES = 62.50,
  onVerRegistro,
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('todas'); // 'todas' | '1' | '2'
  const [forceGroupedView, setForceGroupedView] = useState('auto'); // 'auto' | 'grouped' | 'ungrouped'
  const [forcePageLocation, setForcePageLocation] = useState('auto'); // 'auto' | 'p1' | 'p2'

  if (!isOpen || !cotizacion) return null;

  // Normalización de datos del cliente
  const clienteData = cotizacion.cliente || {};
  const clienteNombre =
    typeof clienteData === 'string'
      ? clienteData
      : clienteData.nombre_completo ||
        `${clienteData.nombres || ''} ${clienteData.apellidos || ''}`.trim() ||
        'prueba Development';

  // Ficha y Fecha
  const numeroFicha =
    cotizacion.numero_ficha ||
    (cotizacion.id ? String(cotizacion.id) : 'N/A');

  const rawFecha = cotizacion.fecha || cotizacion.fecha_creacion || new Date().toISOString();
  const formatFechaDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const parts = String(dateStr).split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
          return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
        }
        return String(dateStr);
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return String(dateStr);
    }
  };

  const fechaEmision = formatFechaDDMMYYYY(rawFecha);

  // Parámetros de Pasajeros
  const paxData = cotizacion.pax || {};
  const paxAdultos = paxData.adultos ?? 1;
  const paxNinos = paxData.ninos ?? 0;
  const paxInfantes = paxData.infantes ?? 0;

  // Fechas de Viaje
  const checkinRaw = cotizacion.fechas?.checkin || cotizacion.checkin || '';
  const checkoutRaw = cotizacion.fechas?.checkout || cotizacion.checkout || '';
  const checkinStr = checkinRaw ? formatFechaDDMMYYYY(checkinRaw) : fechaEmision;
  const checkoutStr = checkoutRaw ? formatFechaDDMMYYYY(checkoutRaw) : fechaEmision;

  // Extracción y normalización de Ítems
  let items = [];
  if (Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    items = cotizacion.items;
  } else if (cotizacion.data && typeof cotizacion.data === 'string') {
    try {
      const parsed = JSON.parse(cotizacion.data);
      if (Array.isArray(parsed.items)) items = parsed.items;
    } catch {
      // ignore
    }
  } else if (Array.isArray(cotizacion.data?.items)) {
    items = cotizacion.data.items;
  }

  // Si no hay items normalizados pero hay entidades directas (p.ej. Venta formal)
  if (items.length === 0) {
    if (cotizacion.hoteles) {
      cotizacion.hoteles.forEach(h => {
        const monto = (h.precio_noche_adulto * (h.adultos || 1) + (h.precio_noche_nino || 0) * (h.ninos || 0)) * (h.noches || 1);
        items.push({
          uid: h.uid || `hotel_${h.id || Math.random()}`,
          tipo: 'hotel',
          titulo: h.hotel?.nombre || h.titulo || 'Hotel Seleccionado',
          detalle: `Habitacion: ${h.tipo_habitacion || h.habitacion || 'Estándar'} , Noches: ${h.noches || 1}, ${h.tipo || 'Solo Alojamiento'}`,
          precio: monto,
        });
      });
    }
    if (cotizacion.excursiones) {
      cotizacion.excursiones.forEach(e => {
        const monto = (e.precio_adulto * (e.adultos || 1) + (e.precio_nino || 0) * (e.ninos || 0));
        items.push({
          tipo: 'excursion',
          titulo: 'Excursión',
          detalle: e.excursion?.tipo_excursion || e.tipo_excursion || 'Excursión Turística',
          precio: monto,
          hotel_item_uids: e.hotel_item_uids || (e.hotel_item_uid ? [e.hotel_item_uid] : []),
        });
      });
    }
    if (cotizacion.traslados) {
      cotizacion.traslados.forEach(t => {
        items.push({
          tipo: 'traslado',
          titulo: 'Traslado',
          detalle: t.traslado ? `${t.traslado.ruta_origen || ''} - ${t.traslado.ruta_destino || ''}` : (t.detalle || 'Traslado Terrestre'),
          precio: Number(t.precio_historico || t.precio || 0),
          hotel_item_uids: t.hotel_item_uids || (t.hotel_item_uid ? [t.hotel_item_uid] : []),
        });
      });
    }
    if (cotizacion.paquetes) {
      cotizacion.paquetes.forEach(p => {
        items.push({
          tipo: 'paquete',
          titulo: 'Paquete',
          detalle: p.paquete?.paquete || p.paquete || 'Paquete Turístico',
          precio: Number(p.precio_adulto || p.precio || 0),
          hotel_item_uids: p.hotel_item_uids || (p.hotel_item_uid ? [p.hotel_item_uid] : []),
        });
      });
    }
    if (cotizacion.vuelos) {
      cotizacion.vuelos.forEach(v => {
        const monto = (v.precio_adulto * (v.adultos || 1) + (v.precio_nino || 0) * (v.ninos || 0) + (v.precio_infante || 0) * (v.infantes || 0));
        items.push({
          tipo: 'vuelo',
          titulo: `Boletos Aéreos: ${v.aerolinea?.nombre || 'Aerolínea'} (${v.itinerario || 'Ruta'})`,
          detalle: `Pasajeros: ${v.adultos || paxAdultos} Adultos, ${v.ninos || paxNinos} Niños, ${v.infantes || paxInfantes} Infantes`,
          precio: monto,
          hotel_item_uids: v.hotel_item_uids || (v.hotel_item_uid ? [v.hotel_item_uid] : []),
        });
      });
    }
    if (cotizacion.ferries) {
      cotizacion.ferries.forEach(f => {
        items.push({
          tipo: 'ferry',
          titulo: `Boletos Marítimos: ${f.ruta || 'Ruta'} (${f.itinerario || 'Ferry'})`,
          detalle: `Vehículos: ${f.vehiculos || 0}`,
          precio: Number(f.precio || 0),
          hotel_item_uids: f.hotel_item_uids || (f.hotel_item_uid ? [f.hotel_item_uid] : []),
        });
      });
    }
    if (cotizacion.vehiculos) {
      cotizacion.vehiculos.forEach(veh => {
        items.push({
          tipo: 'vehiculo',
          titulo: `Vehículo: ${veh.vehiculo?.marca || ''} ${veh.vehiculo?.modelo || veh.modelo || ''}`,
          detalle: `${veh.dias || 1} Días.`,
          precio: Number(veh.precio_unitario || veh.precio || 0) * (veh.dias || 1),
          hotel_item_uids: veh.hotel_item_uids || (veh.hotel_item_uid ? [veh.hotel_item_uid] : []),
        });
      });
    }
    if (cotizacion.otros) {
      cotizacion.otros.forEach(o => {
        items.push({
          tipo: 'otro',
          titulo: o.descripcion || 'Servicio',
          detalle: o.detalle || '',
          precio: Number(o.precio || 0),
          hotel_item_uids: o.hotel_item_uids || (o.hotel_item_uid ? [o.hotel_item_uid] : []),
        });
      });
    }
  }

  // Detección de si la cotización tiene estructura agrupada
  const hotelItems = items.filter(it => it.tipo === 'hotel');
  const hasMultipleHotels = hotelItems.length > 1;
  const hasExplicitGroupedItems = items.some(it => {
    if (it.tipo === 'hotel') return false;
    const uids = Array.isArray(it.hotel_item_uids) ? it.hotel_item_uids : (it.hotel_item_uid ? [it.hotel_item_uid] : []);
    return uids.length > 0;
  });

  const isGroupedMode =
    forceGroupedView === 'grouped'
      ? true
      : forceGroupedView === 'ungrouped'
      ? false
      : (hasMultipleHotels || (hotelItems.length === 1 && hasExplicitGroupedItems));

  // =========================================================================
  // CÁLCULO INTELIGENTE DE ESPACIO PARA LA CAJA "IMPORTANTE"
  // Si la tabla de productos es corta, la caja azul con las cláusulas se
  // ubica al pie de la Página 1 (creando un documento de 1 sola página limpia).
  // Si la tabla es larga y no cabe en la Página 1, se traslada a la Página 2.
  // =========================================================================
  const cabeEnPagina1 = useMemo(() => {
    if (forcePageLocation === 'p1') return true;
    if (forcePageLocation === 'p2') return false;

    if (!isGroupedMode) {
      // Modo sin agrupar: hasta 5-6 productos caben con holgura en la página 1
      return items.length <= 5;
    } else {
      // Modo agrupado: contar hoteles y servicios anidados
      const totalSubitems = items.filter(it => it.tipo !== 'hotel').length;
      return (hotelItems.length <= 1 && totalSubitems <= 5) || (hotelItems.length <= 2 && totalSubitems <= 2);
    }
  }, [forcePageLocation, isGroupedMode, items, hotelItems]);

  // Cálculo del total
  const totalUSD =
    typeof cotizacion.total_usd === 'number'
      ? cotizacion.total_usd
      : items.reduce((acc, it) => acc + (Number(it.precio) || 0), 0);

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsApp = () => {
    let serviciosTexto = '';
    if (isGroupedMode && hotelItems.length > 0) {
      hotelItems.forEach(h => {
        const grouped = items.filter(it => it.tipo !== 'hotel' && (Array.isArray(it.hotel_item_uids) ? it.hotel_item_uids.includes(h.uid) : it.hotel_item_uid === h.uid));
        const subtotal = Number(h.precio || 0) + grouped.reduce((sum, g) => sum + Number(g.precio || 0), 0);
        serviciosTexto += `\n🏨 *${h.titulo}* - *$${formatCurrency(subtotal)}*\n`;
        serviciosTexto += `   ${h.detalle}\n`;
        grouped.forEach(g => {
          serviciosTexto += `   ↳ *${g.titulo}*: ${g.detalle}\n`;
        });
      });
    } else {
      serviciosTexto = items.map(it => `• *${it.titulo}*: ${it.detalle} - *$${formatCurrency(it.precio)}*`).join('\n');
    }

    const text = `*PLAN DE VIAJE - COTIZACIÓN*
*N° Ficha:* ${numeroFicha}
*Fecha:* ${fechaEmision}
*Cliente:* ${clienteNombre}
*Fechas:* ${checkinStr} al ${checkoutStr}
*Pasajeros:* ${paxAdultos} Adultos, ${paxNinos} Niños, ${paxInfantes} Infantes

*DETALLE DEL SERVICIO:*
${serviciosTexto}

${!isGroupedMode ? `*TOTAL A PAGAR: $${formatCurrency(totalUSD)} USD*\n` : ''}
*IMPORTANTE:*
• Cotización válida por 48 hrs.
• Sujeto a disponibilidad al momento de la reserva.
• La Agencia actúa únicamente como intermediaria entre el cliente y las aerolíneas.`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Componente reutilizable para la Caja Azul de Cláusulas Legales
  const renderCajaImportante = () => (
    <div
      style={{
        background: '#0A206D',
        borderRadius: '18px',
        padding: '20px 28px',
        color: '#FFFFFF',
        boxSizing: 'border-box',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div
        style={{
          fontSize: '12.5px',
          fontWeight: '700',
          letterSpacing: '1px',
          marginBottom: '12px',
        }}
      >
        IMPORTANTE
      </div>

      {/* Fila Icono Horas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          marginBottom: '8px',
        }}
      >
        <img
          src={iconHoras}
          alt="Horas"
          style={{
            width: '15px',
            height: '15px',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }}
        />
        <span>Cotización válida por 48 hrs</span>
      </div>

      {/* Fila Icono Disponibilidad */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          marginBottom: '12px',
        }}
      >
        <img
          src={iconDisponibilidad}
          alt="Disponibilidad"
          style={{
            width: '15px',
            height: '15px',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }}
        />
        <span>Sujeto a disponibilidad al momento de la reserva.</span>
      </div>

      {/* Cláusulas Legales con Viñetas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '10.5px', lineHeight: '1.4' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '14px', lineHeight: '1' }}>•</span>
          <span>La Agencia actúa únicamente como intermediaria entre el cliente y las aerolíneas.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '14px', lineHeight: '1' }}>•</span>
          <span>
            La Agencia no se hace responsable por modificaciones, cambios o anulaciones realizados por las aerolíneas.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '14px', lineHeight: '1' }}>•</span>
          <span>
            Ante inconvenientes ajenos en el itinerario, la Agencia solo actuará como intermediaria de apoyo entre el cliente y la aerolínea.
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 25, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-cotizacion-root, #printable-cotizacion-root * {
            visibility: visible !important;
          }
          #printable-cotizacion-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .cotizacion-sheet {
            width: 8.5in !important;
            height: 11in !important;
            min-height: 11in !important;
            max-height: 11in !important;
            page-break-after: always !important;
            break-after: page !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
            position: relative !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0B132B',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Screen only) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: '#070D1F',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>📄</span>
            <span style={{ fontWeight: '700', fontSize: '1rem', color: '#FFFFFF' }}>
              Cotización Rápida
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(242, 101, 34, 0.2)',
                color: '#F26522',
                border: '1px solid rgba(242, 101, 34, 0.4)',
              }}
            >
              N° {numeroFicha}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '6px',
                background: isGroupedMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isGroupedMode ? '#60A5FA' : '#34D399',
                border: `1px solid ${isGroupedMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              }}
            >
              {isGroupedMode ? 'Productos Agrupados' : 'Productos No Agrupados'}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '6px',
                background: cabeEnPagina1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                color: cabeEnPagina1 ? '#34D399' : '#FBBF24',
                border: `1px solid ${cabeEnPagina1 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
              }}
            >
              {cabeEnPagina1 ? '1 Página (Cláusulas al pie)' : '2 Páginas (Cláusulas en Pág 2)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Toggle de Modo Agrupado vs No Agrupado */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setForceGroupedView('ungrouped')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: forceGroupedView === 'ungrouped' || (!isGroupedMode && forceGroupedView === 'auto') ? '#F26522' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
                title="Mostrar lista secuencial sin agrupar productos"
              >
                Sin Agrupar
              </button>
              <button
                type="button"
                onClick={() => setForceGroupedView('grouped')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: forceGroupedView === 'grouped' || (isGroupedMode && forceGroupedView === 'auto') ? '#F26522' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
                title="Mostrar productos agrupados por hotel / opción"
              >
                Agrupados
              </button>
            </div>

            {/* Selector de Páginas (Sólo activo cuando hay 2 páginas) */}
            {!cabeEnPagina1 && (
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '2px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('todas')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'todas' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Todas (1-2)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('1')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === '1' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Pág 1
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('2')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === '2' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Pág 2
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#F26522',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(242, 101, 34, 0.4)',
              }}
              title="Imprimir documento o Guardar en PDF"
            >
              <span>🖨️</span>
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: copied ? '#10B981' : 'rgba(37, 99, 235, 0.25)',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              title="Copiar resumen para WhatsApp"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? '¡Copiado!' : 'WhatsApp'}</span>
            </button>

            {onVerRegistro && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onVerRegistro();
                }}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Ver Registro
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                lineHeight: 1,
              }}
              title="Cerrar ventana"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 16px',
            background: '#1F2937',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Printable Root Container */}
          <div id="printable-cotizacion-root" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ============================================================== */}
            {/* HOJA 1: RESUMEN Y TABLA DE PRODUCTOS                           */}
            {/* ============================================================== */}
            {(cabeEnPagina1 || activeTab === 'todas' || activeTab === '1') && (
              <div
                className="cotizacion-sheet"
                style={{
                  width: '816px',
                  height: '1056px',
                  minHeight: '1056px',
                  maxHeight: '1056px',
                  position: 'relative',
                  backgroundImage: `url(${cotizacionFondoP1})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#FFFFFF',
                  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* Título "COTIZACIÓN" centrado exactamente entre las dos líneas naranjas de la cabecera */}
                <div
                  style={{
                    position: 'absolute',
                    top: '127px',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    color: '#FFFFFF',
                    fontSize: '23px',
                    fontWeight: '800',
                    letterSpacing: '2.5px',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                  }}
                >
                  COTIZACIÓN
                </div>

                {/* Contenido Dinámico de la Hoja 1 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '252px', // Inicia justo debajo del membrete/encabezado de la hoja
                    left: '42px',
                    right: '42px',
                    bottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Fila Cliente, Fecha y N° */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px',
                      color: '#48494B',
                      fontSize: '13px',
                      lineHeight: '1.4',
                    }}
                  >
                    <div>
                      <div>
                        Cliente: <strong>{clienteNombre}</strong>
                      </div>
                      <div>Fecha: {fechaEmision}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      N°: <strong>{numeroFicha}</strong>
                    </div>
                  </div>

                  {/* Badges Cápsula: Pasajeros (Izquierda) y Fechas (Derecha) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    {/* Badge Pasajeros */}
                    <div
                      style={{
                        flex: 1,
                        border: '1.5px solid #F26522',
                        borderRadius: '9999px',
                        padding: '2px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          background: '#0A206D',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                          padding: '4.5px 12px',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: '700',
                          lineHeight: '1',
                        }}
                      >
                        <span>Adultos: {paxAdultos}</span>
                        <div style={{ width: '1px', height: '14px', background: '#F26522' }} />
                        <span>Niños: {paxNinos}</span>
                        <div style={{ width: '1px', height: '14px', background: '#F26522' }} />
                        <span>Infantes: {paxInfantes}</span>
                      </div>
                    </div>

                    {/* Badge Fechas */}
                    <div
                      style={{
                        flex: 1,
                        border: '1.5px solid #F26522',
                        borderRadius: '9999px',
                        padding: '2px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          background: '#0A206D',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                          padding: '4.5px 12px',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: '700',
                          lineHeight: '1',
                        }}
                      >
                        <span>Check In: {checkinStr}</span>
                        <div style={{ width: '1px', height: '14px', background: '#F26522' }} />
                        <span>Check Out: {checkoutStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta Contenedora Gris de Productos */}
                  <div
                    style={{
                      background: 'rgba(215, 220, 226, 0.58)',
                      borderRadius: '22px',
                      padding: '8px 22px 20px 22px',
                      position: 'relative',
                    }}
                  >
                    {/* Barra Naranja de Encabezado de Tabla */}
                    <div
                      style={{
                        background: '#F26522',
                        borderRadius: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '7px 22px',
                        color: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '13px',
                        marginBottom: '10px',
                      }}
                    >
                      <span>Descripción</span>
                      <span>Total USD</span>
                    </div>

                    {/* Filas de la Tabla */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {!isGroupedMode ? (
                        /* ================================================= */
                        /* FORMATO 1: SIN AGRUPAR PRODUCTOS (IMAGEN 1)       */
                        /* ================================================= */
                        items.map((item, idx) => (
                          <div
                            key={item.uid || idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              borderBottom: idx === items.length - 1 ? 'none' : '1px solid rgba(17, 17, 17, 0.16)',
                              padding: '6.5px 4px',
                            }}
                          >
                            <div style={{ flex: 1, paddingRight: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                <span style={{ color: '#F26522', fontSize: '11px', lineHeight: 1 }}>▪</span>
                                <span
                                  style={{
                                    color: '#00206D',
                                    fontWeight: '700',
                                    fontSize: '12.5px',
                                  }}
                                >
                                  {item.titulo}
                                </span>
                              </div>
                              {item.detalle && (
                                <div
                                  style={{
                                    color: '#555555',
                                    fontSize: '10.5px',
                                    marginTop: '1px',
                                    paddingLeft: '14px',
                                    lineHeight: '1.3',
                                  }}
                                >
                                  {item.detalle}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                color: '#00206D',
                                fontWeight: '700',
                                fontSize: '12.5px',
                                whiteSpace: 'nowrap',
                                textAlign: 'right',
                              }}
                            >
                              ${formatCurrency(item.precio)}
                            </div>
                          </div>
                        ))
                      ) : (
                        /* ================================================= */
                        /* FORMATO 2: CON PRODUCTOS AGRUPADOS (IMAGEN 3)     */
                        /* ================================================= */
                        hotelItems.map((hotelItem, hIdx) => {
                          const groupedServices = items.filter(
                            (it) =>
                              it.tipo !== 'hotel' &&
                              (Array.isArray(it.hotel_item_uids)
                                ? it.hotel_item_uids.includes(hotelItem.uid)
                                : it.hotel_item_uid === hotelItem.uid)
                          );
                          const subtotalHotel =
                            Number(hotelItem.precio || 0) +
                            groupedServices.reduce((sum, g) => sum + Number(g.precio || 0), 0);

                          return (
                            <div
                              key={hotelItem.uid || hIdx}
                              style={{
                                borderBottom: hIdx === hotelItems.length - 1 ? 'none' : '2px solid #222222',
                                paddingBottom: '10px',
                                marginBottom: '10px',
                              }}
                            >
                              {/* Hotel Header Row */}
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  padding: '4px',
                                }}
                              >
                                <div style={{ flex: 1, paddingRight: '16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                    <span style={{ color: '#F26522', fontSize: '11px', lineHeight: 1 }}>▪</span>
                                    <span
                                      style={{
                                        color: '#00206D',
                                        fontWeight: '700',
                                        fontSize: '12.5px',
                                      }}
                                    >
                                      {hotelItem.titulo}
                                    </span>
                                  </div>
                                  {hotelItem.detalle && (
                                    <div
                                      style={{
                                        color: '#555555',
                                        fontSize: '10.5px',
                                        marginTop: '1px',
                                        paddingLeft: '14px',
                                        lineHeight: '1.3',
                                      }}
                                    >
                                      {hotelItem.detalle}
                                    </div>
                                  )}
                                </div>
                                <div
                                  style={{
                                    color: '#00206D',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'right',
                                  }}
                                >
                                  ${formatCurrency(subtotalHotel)}
                                </div>
                              </div>

                              {/* Nested Sub-services under this hotel */}
                              {groupedServices.map((gItem, gIdx) => (
                                <div
                                  key={gItem.uid || gIdx}
                                  style={{
                                    borderTop: '1px solid rgba(17, 17, 17, 0.16)',
                                    padding: '5px 4px 5px 18px',
                                    marginTop: '4px',
                                  }}
                                >
                                  <div
                                    style={{
                                      color: '#00206D',
                                      fontWeight: '700',
                                      fontSize: '12px',
                                    }}
                                  >
                                    {gItem.titulo}
                                  </div>
                                  {gItem.detalle && (
                                    <div
                                      style={{
                                        color: '#555555',
                                        fontSize: '10.5px',
                                        marginTop: '1px',
                                        lineHeight: '1.3',
                                      }}
                                    >
                                      {gItem.detalle}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Cápsula Naranja "Total a pagar" (Sólo en modo no agrupado, exactamente como la Imagen 1) */}
                  {!isGroupedMode && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '12px',
                      }}
                    >
                      <div
                        style={{
                          background: '#F26522',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '24px',
                          padding: '6px 24px',
                          color: '#FFFFFF',
                          fontWeight: '700',
                          fontSize: '12.5px',
                        }}
                      >
                        <span>Total a pagar:</span>
                        <span style={{ fontSize: '13px' }}>${formatCurrency(totalUSD)}</span>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SI CABE EN LA PÁGINA 1: COLOCAR LA CAJA AZUL DIRECTAMENTE AL PIE */}
                  {/* ============================================================== */}
                  {cabeEnPagina1 && (
                    <div
                      style={{
                        marginTop: 'auto', // Empuja la caja al pie respetando el margen inferior
                        paddingTop: '20px',
                        paddingBottom: '12px',
                        width: '100%',
                      }}
                    >
                      {renderCajaImportante()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* HOJA 2: SE MUESTRA SÓLO SI LA TABLA NO DEJÓ ESPACIO EN LA PÁG 1 */}
            {/* ============================================================== */}
            {!cabeEnPagina1 && (activeTab === 'todas' || activeTab === '2') && (
              <div
                className="cotizacion-sheet"
                style={{
                  width: '816px',
                  height: '1056px',
                  minHeight: '1056px',
                  maxHeight: '1056px',
                  position: 'relative',
                  backgroundImage: `url(${cotizacionFondoP2})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#FFFFFF',
                  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* Caja Azul Marino "IMPORTANTE" anclada al pie de la Página 2 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '36px',
                    left: '60px',
                    right: '60px',
                  }}
                >
                  {renderCajaImportante()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
