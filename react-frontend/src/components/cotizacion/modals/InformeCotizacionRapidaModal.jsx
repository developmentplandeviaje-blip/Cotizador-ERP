import React, { useState } from 'react';
import logonaranja from '../../../assets/logonaranjapdv.png';
import imgHoteles from '../../../assets/Hoteles.svg';

export default function InformeCotizacionRapidaModal({
  isOpen,
  onClose,
  cotizacion,
  tipoInforme,
  tasaReferencialVES = 62.50,
  onVerRegistro,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !cotizacion) return null;

  // Determinar si es informe de venta o cotización
  const esVenta = tipoInforme === 'venta' || cotizacion.tipoInforme === 'venta' || cotizacion.estado === 'Venta' || cotizacion.estado === 'Nota de Crédito';
  const esNotaCredito = cotizacion.estado === 'Nota de Crédito' || (cotizacion.estado || '').toLowerCase() === 'nota de credito';

  // Normalización de datos recibidos (compatible con Venta, CotizacionRapida y normalized items)
  const isVenta = cotizacion.tipo_registro === 'formal' || !!cotizacion.hoteles || esVenta;
  const numeroFicha =
    cotizacion.numero_ficha ||
    cotizacion.id ||
    '1001';
  const fechaEmision = cotizacion.fecha || cotizacion.fecha_creacion || new Date().toISOString();
  const asesorNombre =
    cotizacion.asesor ||
    cotizacion.user?.name ||
    cotizacion.user?.username ||
    'Asesor Comercial';

  // Datos del Cliente
  const clienteData = cotizacion.cliente || {};
  const clienteNombre =
    typeof clienteData === 'string'
      ? clienteData
      : clienteData.nombre_completo ||
        `${clienteData.nombres || ''} ${clienteData.apellidos || ''}`.trim() ||
        'Cliente No Especificado';
  const clienteDoc =
    typeof clienteData === 'object'
      ? (clienteData.documento ? `${clienteData.tipo_documento || 'V'}-${clienteData.documento}` : '')
      : '';
  const clienteTelefono = typeof clienteData === 'object' ? (clienteData.telefono || '') : '';
  const clienteCorreo = typeof clienteData === 'object' ? (clienteData.correo || '') : '';

  // Fechas y Pasajeros
  const checkin = cotizacion.fechas?.checkin || cotizacion.checkin || '';
  const checkout = cotizacion.fechas?.checkout || cotizacion.checkout || '';
  let noches = 1;
  if (checkin && checkout) {
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    noches = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  }

  const paxData = cotizacion.pax || {};
  const paxAdultos = paxData.adultos ?? 1;
  const paxAdol = paxData.adolescentes ?? 0;
  const paxNinos = paxData.ninos ?? 0;
  const paxInfantes = paxData.infantes ?? 0;
  const paxTotal =
    paxData.total ??
    (paxAdultos + paxAdol + paxNinos + paxInfantes);

  // Lista de Ítems / Productos
  let items = [];
  if (Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    items = cotizacion.items;
  } else if (cotizacion.data && typeof cotizacion.data === 'string') {
    try {
      const parsed = JSON.parse(cotizacion.data);
      if (Array.isArray(parsed.items)) items = parsed.items;
    } catch (e) {
      // ignore
    }
  }

  // Si es un modelo Venta con relaciones directas
  if (items.length === 0 && isVenta) {
    if (cotizacion.hoteles) {
      cotizacion.hoteles.forEach(h => {
        const monto = (h.precio_noche_adulto * (h.adultos || 1) + (h.precio_noche_adolescente || 0) * (h.adolescente || 0) + (h.precio_noche_nino || 0) * (h.ninos || 0)) * (h.noches || 1);
        items.push({
          tipo: 'hotel',
          titulo: `Hotel: ${h.hotel?.nombre || 'Hotel Seleccionado'}`,
          detalle: `${h.noches || noches} noches • ${h.tipo_habitacion || 'Habitación Estándar'}`,
          precio: monto,
        });
      });
    }
    if (cotizacion.vuelos) {
      cotizacion.vuelos.forEach(v => {
        const monto = (v.precio_adulto * (v.adultos || 1) + (v.precio_nino || 0) * (v.ninos || 0) + (v.precio_infante || 0) * (v.infantes || 0));
        items.push({
          tipo: 'vuelo',
          titulo: `Vuelo: ${v.aerolinea?.nombre || 'Aerolínea'}`,
          detalle: v.itinerario || 'Ruta Aérea',
          precio: monto,
        });
      });
    }
    if (cotizacion.traslados) {
      cotizacion.traslados.forEach(t => {
        items.push({
          tipo: 'traslado',
          titulo: `Traslado: ${t.traslado?.ruta_origen || ''} - ${t.traslado?.ruta_destino || ''}`,
          detalle: `Fecha: ${t.fecha_traslado || 'Programada'}`,
          precio: Number(t.precio_historico || t.precio || 0),
        });
      });
    }
    if (cotizacion.excursiones) {
      cotizacion.excursiones.forEach(e => {
        items.push({
          tipo: 'excursion',
          titulo: `Excursión: ${e.excursion?.tipo_excursion || 'Tour'}`,
          detalle: `Fecha: ${e.fecha || 'Programada'}`,
          precio: (e.precio_adulto * (e.adultos || 1) + (e.precio_nino || 0) * (e.ninos || 0)),
        });
      });
    }
    if (cotizacion.paquetes) {
      cotizacion.paquetes.forEach(p => {
        items.push({
          tipo: 'paquete',
          titulo: `Paquete: ${p.paquete?.paquete || 'Paquete Turístico'}`,
          detalle: `Fecha: ${p.fecha || 'Programada'}`,
          precio: Number(p.precio_adulto || 0),
        });
      });
    }
    if (cotizacion.vehiculos) {
      cotizacion.vehiculos.forEach(veh => {
        items.push({
          tipo: 'vehiculo',
          titulo: `Vehículo: ${veh.vehiculo?.marca || ''} ${veh.vehiculo?.modelo || ''}`,
          detalle: `${veh.dias || 1} días de alquiler`,
          precio: Number(veh.precio_unitario || 0) * (veh.dias || 1),
        });
      });
    }
  }

  // Totales
  const subtotalUSD = items.reduce((sum, it) => sum + (Number(it.precio) || 0), 0);
  const descuentoUSD = Number(cotizacion.descuento_monto || 0);
  const totalUSD =
    typeof cotizacion.total_usd === 'number'
      ? cotizacion.total_usd
      : Math.max(0, (subtotalUSD > 0 ? subtotalUSD - descuentoUSD : Number(cotizacion.total_estimado || 0)));
  const pagos = Array.isArray(cotizacion.pagos) ? cotizacion.pagos : [];
  const totalAbonado = Number(
    cotizacion.total_abonado ??
    pagos.reduce((acc, p) => acc + Number(p.monto_usd || p.monto || 0), 0)
  );
  const saldoPendiente = typeof cotizacion.saldo_pendiente === 'number'
    ? cotizacion.saldo_pendiente
    : Math.max(0, totalUSD - totalAbonado);
  const totalVES = (totalUSD * tasaReferencialVES).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const observacion = cotizacion.observacion || '';

  // Handler para imprimir sólo el reporte limpio
  const handlePrint = () => {
    window.print();
  };

  // Handler para copiar a WhatsApp
  const handleCopyWhatsApp = () => {
    const hotelItems = items.filter(it => it.tipo === 'hotel');
    const hasHotels = hotelItems.length > 0;

    let serviciosFormatted = '';
    if (hasHotels) {
      hotelItems.forEach(h => {
        const grouped = items.filter(it => it.tipo !== 'hotel' && (Array.isArray(it.hotel_item_uids) ? it.hotel_item_uids.includes(h.uid) : it.hotel_item_uid === h.uid));
        serviciosFormatted += ` *HOTEL: ${h.titulo}*\n`;
        serviciosFormatted += `   • Tarifa base: $${Number(h.precio || 0).toFixed(2)}  (${h.detalle})\n`;
        if (grouped.length > 0) {
          grouped.forEach(g => {
            serviciosFormatted += `   ↳ [${(g.tipo || 'Servicio').toUpperCase()}] *${g.titulo}*: ${g.detalle} - $${Number(g.precio || 0).toFixed(2)} \n`;
          });
          const subtotalHotel = Number(h.precio || 0) + grouped.reduce((sum, g) => sum + Number(g.precio || 0), 0);
          serviciosFormatted += `   *Subtotal Paquete Hotel:* $${subtotalHotel.toFixed(2)} \n\n`;
        } else {
          serviciosFormatted += '\n';
        }
      });

      const unassigned = items.filter(it => {
        if (it.tipo === 'hotel') return false;
        const uids = Array.isArray(it.hotel_item_uids) ? it.hotel_item_uids : (it.hotel_item_uid ? [it.hotel_item_uid] : []);
        return uids.length === 0 || !hotelItems.some(h => uids.includes(h.uid));
      });
      if (unassigned.length > 0) {
        serviciosFormatted += ` *SERVICIOS GENERALES:*\n`;
        unassigned.forEach(it => {
          serviciosFormatted += `• [${(it.tipo || 'Servicio').toUpperCase()}] *${it.titulo}*: ${it.detalle} - $${Number(it.precio || 0).toFixed(2)}\n`;
        });
      }
    } else {
      serviciosFormatted = items.map(it => `• *${it.titulo}*: ${it.detalle} - $${Number(it.precio || 0).toFixed(2)}`).join('\n');
    }

    const docTitleWhatsApp = esNotaCredito ? 'NOTA DE CRÉDITO - PLAN DE VIAJE' : esVenta ? 'INFORME DE VENTA - PLAN DE VIAJE' : 'COTIZACIÓN RÁPIDA - PLAN DE VIAJE';

    const text = `*${docTitleWhatsApp}* 
*Número de ficha:* ${numeroFicha}
*Fecha:* ${new Date(fechaEmision).toLocaleDateString()}
*Asesor:* ${asesorNombre}

*DATOS DEL CLIENTE:*
• *Cliente:* ${clienteNombre}
${clienteDoc ? `• *Documento:* ${clienteDoc}\n` : ''}${clienteTelefono ? `• *Teléfono:* ${clienteTelefono}\n` : ''}${checkin ? `• *Fechas de Viaje:* ${checkin} al ${checkout} (${noches} noches)\n` : ''}• *Pasajeros:* ${paxTotal} Pax (${paxAdultos} adultos${paxNinos > 0 ? `, ${paxNinos} niños` : ''})

*SERVICIOS REGISTRADOS:*
${serviciosFormatted.trim()}

*RESUMEN FINANCIERO:*
${descuentoUSD > 0 ? `• Descuento: -$${descuentoUSD.toFixed(2)} \n` : ''}• *TOTAL:* $${totalUSD.toFixed(2)} 
${esVenta ? `• *Total Abonado:* $${totalAbonado.toFixed(2)} \n• *Saldo Pendiente:* $${saldoPendiente.toFixed(2)} \n` : ''}• *Ref. Oficial BCV:* Bs. ${totalVES}

${observacion ? `*Observaciones:* ${observacion}\n\n` : ''}_*Nota:* ${esVenta ? 'Venta confirmada y registrada en el sistema Plan de Viaje ERP.' : 'Tarifas sujetas a cambio y disponibilidad de cupos hasta confirmar pago formal.'}_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 25, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-informe-cotizacion, #printable-informe-cotizacion * {
            visibility: visible !important;
          }
          #printable-informe-cotizacion {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            background: #ffffff !important;
            color: #111827 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-clean-text {
            color: #111827 !important;
          }
          .print-clean-border {
            border-color: #E5E7EB !important;
          }
          .print-clean-bg {
            background-color: #F9FAFB !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgb(13, 22, 45)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar (No Print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'rgba(8, 14, 30, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}></span>
            <span style={{ fontWeight: '700', fontSize: '1rem', color: '#FFFFFF' }}>
              {esNotaCredito ? 'Nota de Crédito' : esVenta ? 'Informe de Venta' : 'Informe de Cotización Rápida'}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '6px',
                background: esNotaCredito ? 'rgba(239, 68, 68, 0.2)' : esVenta ? 'rgba(16, 185, 129, 0.2)' : 'rgba(232, 114, 23, 0.2)',
                color: esNotaCredito ? '#FCA5A5' : esVenta ? '#34D399' : '#E87217',
                border: `1px solid ${esNotaCredito ? 'rgba(239, 68, 68, 0.4)' : esVenta ? 'rgba(16, 185, 129, 0.4)' : 'rgba(232, 114, 23, 0.4)'}`,
              }}
            >
              Ficha {numeroFicha}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#E87217',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Imprimir documento oficial o guardar en PDF"
            >
              <span></span>
              <span>Imprimir</span>
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
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Copiar resumen para WhatsApp o correo"
            >
              <span>{copied ? '✓' : 'copy'}</span>
              <span>{copied ? '¡Copiado!' : 'Copiar Resumen'}</span>
            </button>

            {onVerRegistro && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onVerRegistro();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
                title="Ver lista de cotizaciones guardadas"
              >
                <span>Ver en Registro</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
              title="Cerrar ventana"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            background: 'rgba(10, 16, 32, 0.65)',
          }}
        >
          {/* Printable Sheet */}
          <div
            id="printable-informe-cotizacion"
            style={{
              background: '#FFFFFF',
              color: '#1E293B',
              borderRadius: '12px',
              padding: '32px 36px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
              fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            {/* Header Documento */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #E87217',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={logonaranja}
                  alt="Plan de Viaje"
                  style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
                />
                <div>
                  <h2 style={{ margin: '0 0 2px 0', fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>
                    PLAN DE VIAJE C.A.
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                    Agencia de Viajes y Turismo • RIF J-40817029-7
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                    Caracas, Venezuela • www.plandeviaje.com.ve
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-block',
                    background: esNotaCredito ? '#FEE2E2' : esVenta ? '#D1FAE5' : '#FEF3C7',
                    color: esNotaCredito ? '#991B1B' : esVenta ? '#065F46' : '#B45309',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${esNotaCredito ? '#FCA5A5' : esVenta ? '#6EE7B7' : '#FCD34D'}`,
                    marginBottom: '6px',
                  }}
                >
                  {esNotaCredito ? 'NOTA DE CRÉDITO' : esVenta ? 'INFORME DE VENTA' : 'INFORME DE COTIZACIÓN RÁPIDA'}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A' }}>
                  Número de ficha: <span style={{ color: '#E87217' }}>{numeroFicha}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Emisión: {new Date(fechaEmision).toLocaleString('es-VE')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Asesor: <strong>{asesorNombre}</strong>
                </div>
              </div>
            </div>

            {/* Grid: Cliente y Datos del Viaje */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              {/* Card Cliente */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                  Datos del Pasajero Titular
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A' }}>
                  {clienteNombre}
                </div>
                {clienteDoc && (
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                    Documento: <strong>{clienteDoc}</strong>
                  </div>
                )}
                {clienteTelefono && (
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                    Teléfono: <strong>{clienteTelefono}</strong>
                  </div>
                )}
                {clienteCorreo && (
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                    Correo: <strong>{clienteCorreo}</strong>
                  </div>
                )}
              </div>

              {/* Card Viaje */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                  Parámetros del Viaje
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0F172A' }}>
                  {checkin ? (
                    <div>
                      Fechas: <strong>{checkin}</strong> al <strong>{checkout}</strong> ({noches} {noches === 1 ? 'noche' : 'noches'})
                    </div>
                  ) : (
                    <div>Fechas: <em>Por definir</em></div>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0F172A', marginTop: '4px' }}>
                  Total Pasajeros: <strong>{paxTotal} Pax</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '6px' }}>
                    ({paxAdultos} Adultos{paxAdol > 0 ? `, ${paxAdol} Adol` : ''}{paxNinos > 0 ? `, ${paxNinos} Niños` : ''}{paxInfantes > 0 ? `, ${paxInfantes} Inf` : ''})
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: esNotaCredito ? '#DC2626' : '#059669', fontWeight: '600', marginTop: '6px' }}>
                  {esNotaCredito
                    ? '• Estado: Nota de Crédito'
                    : esVenta
                    ? '✓ Estado: Venta Confirmada'
                    : '✓ Vigencia de cotización: 48 horas'}
                </div>
              </div>
            </div>

            {/* Tabla de Servicios Cotizados */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', textTransform: 'uppercase', marginBottom: '8px' }}>
                Detalle del Itinerario y Servicios
              </div>

              {items.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B' }}>
                  No se registraron productos desglosados en esta cotización.
                </div>
              ) : items.some(it => it.tipo === 'hotel') ? (
                /* VISTA CON HOTELES Y PRODUCTOS AGRUPADOS */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {items.filter(it => it.tipo === 'hotel').map((hotelItem, hIdx) => {
                    const groupedServices = items.filter(it => it.tipo !== 'hotel' && (Array.isArray(it.hotel_item_uids) ? it.hotel_item_uids.includes(hotelItem.uid) : it.hotel_item_uid === hotelItem.uid));
                    const subtotalHotel = Number(hotelItem.precio || 0) + groupedServices.reduce((sum, g) => sum + Number(g.precio || 0), 0);

                    return (
                      <div
                        key={hotelItem.uid || hIdx}
                        style={{
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Hotel Header Bar */}
                        <div
                          style={{
                            background: '#F1F5F9',
                            borderBottom: '1px solid #CBD5E1',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={imgHoteles} alt="Hotel" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                            <div>
                              <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{hotelItem.titulo}</strong>
                              <span style={{ color: '#64748B', fontSize: '0.78rem', marginLeft: '8px' }}>
                                ({hotelItem.detalle})
                              </span>
                            </div>
                          </div>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.9rem' }}>
                            Subtotal Paquete: <span style={{ color: '#059669' }}>${subtotalHotel.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Items Table for this hotel */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', color: '#475569', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                              <th style={{ padding: '6px 12px' }}>Servicio</th>
                              <th style={{ padding: '6px 12px' }}>Descripción / Especificación</th>
                              <th style={{ padding: '6px 12px', textAlign: 'right' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Base Hotel Row */}
                            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                              <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0F172A' }}>
                                <span style={{ color: '#E87217', marginRight: '6px' }}>[Hotel Base]</span>
                                {hotelItem.titulo}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#475569' }}>
                                {hotelItem.detalle || 'Alojamiento'}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                ${Number(hotelItem.precio || 0).toFixed(2)}
                              </td>
                            </tr>
                            {/* Grouped Services Rows */}
                            {groupedServices.map((gItem, gIdx) => (
                              <tr key={gItem.uid || gIdx} style={{ borderBottom: '1px solid #E2E8F0', background: '#FAFAFA' }}>
                                <td style={{ padding: '8px 12px', paddingLeft: '24px', fontWeight: '600', color: '#0F172A' }}>
                                  <span style={{ color: '#3B82F6', marginRight: '6px' }}>↳ [{gItem.tipo || 'Servicio'}]</span>
                                  {gItem.titulo}
                                </td>
                                <td style={{ padding: '8px 12px', color: '#475569' }}>
                                  {gItem.detalle || '-'}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                  ${Number(gItem.precio || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}

                  {/* General / Unassigned Services */}
                  {(() => {
                    const registeredHotelUids = items.filter(it => it.tipo === 'hotel').map(h => h.uid);
                    const unassignedServices = items.filter(it => {
                      if (it.tipo === 'hotel') return false;
                      const uids = Array.isArray(it.hotel_item_uids) ? it.hotel_item_uids : (it.hotel_item_uid ? [it.hotel_item_uid] : []);
                      return uids.length === 0 || !registeredHotelUids.some(hUid => uids.includes(hUid));
                    });
                    if (unassignedServices.length === 0) return null;
                    const subtotalGen = unassignedServices.reduce((sum, u) => sum + Number(u.precio || 0), 0);

                    return (
                      <div
                        style={{
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            background: '#F1F5F9',
                            borderBottom: '1px solid #CBD5E1',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}></span>
                            <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>Servicios Generales / Adicionales</strong>
                          </div>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.9rem' }}>
                            Subtotal: <span style={{ color: '#2563EB' }}>${subtotalGen.toFixed(2)}</span>
                          </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', color: '#475569', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                              <th style={{ padding: '6px 12px' }}>Servicio</th>
                              <th style={{ padding: '6px 12px' }}>Descripción / Especificación</th>
                              <th style={{ padding: '6px 12px', textAlign: 'right' }}>Total (USD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unassignedServices.map((uItem, uIdx) => (
                              <tr key={uItem.uid || uIdx} style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                                <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0F172A' }}>
                                  <span style={{ textTransform: 'capitalize', color: '#E87217', marginRight: '6px' }}>
                                    [{uItem.tipo || 'Servicio'}]
                                  </span>
                                  {uItem.titulo}
                                </td>
                                <td style={{ padding: '8px 12px', color: '#475569' }}>
                                  {uItem.detalle || '-'}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                                  ${Number(uItem.precio || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#0F172A', color: '#FFFFFF', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', borderRadius: '6px 0 0 0' }}>Servicio</th>
                      <th style={{ padding: '8px 12px' }}>Descripción / Especificación</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #E2E8F0',
                          background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                        }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0F172A', verticalAlign: 'top' }}>
                          <span style={{ textTransform: 'capitalize', color: '#E87217', marginRight: '6px' }}>
                            [{it.tipo || 'Servicio'}]
                          </span>
                          {it.titulo}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569', verticalAlign: 'top' }}>
                          {it.detalle || '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          ${Number(it.precio || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Tabla de Pagos y Abonos Registrados (Sólo en estado de Venta) */}
            {esVenta && pagos.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Historial de Pagos y Abonos Registrados
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', border: '1px solid #CBD5E1', borderRadius: '6px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', color: '#334155', textAlign: 'left', borderBottom: '1px solid #CBD5E1' }}>
                      <th style={{ padding: '7px 12px' }}>Transacción</th>
                      <th style={{ padding: '7px 12px' }}>Método de Pago</th>
                      <th style={{ padding: '7px 12px' }}>Fecha</th>
                      <th style={{ padding: '7px 12px', textAlign: 'right' }}>Monto (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((p, pIdx) => (
                      <tr key={p.id || pIdx} style={{ borderBottom: '1px solid #E2E8F0', background: pIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ padding: '7px 12px', fontWeight: '600', color: '#0F172A' }}>
                          {p.numero_transaccion || p.referencia || `Abono #${p.id || (pIdx + 1)}`}
                        </td>
                        <td style={{ padding: '7px 12px', color: '#475569' }}>
                          {p.metodo_pago?.nombre || p.tipo_pago || 'Transferencia'}
                        </td>
                        <td style={{ padding: '7px 12px', color: '#475569' }}>
                          {(p.fecha_pago || p.fecha_creacion || p.fecha) ? String(p.fecha_pago || p.fecha_creacion || p.fecha).split(/[T ]/)[0] : 'N/A'}
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: '700', color: '#059669', whiteSpace: 'nowrap' }}>
                          ${Number(p.monto_usd || p.monto || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Resumen Financiero */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '320px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '14px 18px',
                }}
              >
                {descuentoUSD > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: '6px' }}>
                      <span>Subtotal:</span>
                      <span>${subtotalUSD.toFixed(2)} </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '600', marginBottom: '6px' }}>
                      <span>Descuento aplicado:</span>
                      <span>-${descuentoUSD.toFixed(2)} </span>
                    </div>
                  </>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderTop: '2px solid #0F172A',
                    paddingTop: '8px',
                    marginTop: '4px',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A' }}>
                    {esVenta ? 'TOTAL VENTA:' : 'TOTAL:'}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#E87217' }}>
                      ${totalUSD.toFixed(2)} 
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                      Bs. {totalVES} (Ref. BCV)
                    </div>
                  </div>
                </div>

                {esVenta && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '700' }}>
                      <span>Total Abonado:</span>
                      <span>${totalAbonado.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: saldoPendiente > 0.01 ? '#DC2626' : '#059669', fontWeight: '800' }}>
                      <span>Monto Pendiente:</span>
                      <span>${saldoPendiente.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observaciones y Términos */}
            <div
              style={{
                background: esVenta ? '#F0FDF4' : '#FFFBEB',
                border: `1px solid ${esVenta ? '#BBF7D0' : '#FDE68A'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '0.78rem',
                color: esVenta ? '#166534' : '#92400E',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                📌 {esVenta ? 'Términos y Condiciones de la Reserva / Venta:' : 'Observaciones y Condiciones Importantes:'}
              </div>
              {observacion && (
                <div style={{ marginBottom: '6px', fontStyle: 'italic', color: esVenta ? '#14532D' : '#78350F' }}>
                  "{observacion}"
                </div>
              )}
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {esVenta ? (
                  <>
                    <li>Venta confirmada y registrada formalmente en el sistema ERP Plan de Viaje.</li>
                    <li>Los servicios confirmados se encuentran sujetos a las políticas y penalidades de reserva de cada proveedor.</li>
                    <li>Pagos en Bolívares se calculan a la tasa oficial del Banco Central de Venezuela (BCV) del día de pago.</li>
                  </>
                ) : (
                  <>
                    <li>Tarifas sujetas a cambio y disponibilidad hasta el momento de confirmación de reserva y pago.</li>
                    <li>Este informe no constituye bloqueo de boletos o habitaciones hasta la formalización de la orden.</li>
                    <li>Pagos en Bolívares se calculan a la tasa oficial del Banco Central de Venezuela (BCV) del día de pago.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Footer Firma */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '12px',
                fontSize: '0.75rem',
                color: '#94A3B8',
              }}
            >
              <span>Generado con éxito por el Sistema de Cotizaciones Plan de Viaje ERP</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
