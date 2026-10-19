import React, { useState } from 'react';
import logonaranja from '../../../assets/logonaranjapdv.png';

export default function InformeCotizacionRapidaModal({
  isOpen,
  onClose,
  cotizacion,
  tasaReferencialVES = 62.50,
  onVerRegistro,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !cotizacion) return null;

  // Normalización de datos recibidos (compatible con Venta, CotizacionRapida y normalized items)
  const isVenta = cotizacion.tipo_registro === 'formal' || !!cotizacion.hoteles;
  const localizador =
    cotizacion.localizador ||
    (cotizacion.data?.localizador) ||
    `COT-${cotizacion.id || 'N/A'}`;
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
  const totalVES = (totalUSD * tasaReferencialVES).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const observacion = cotizacion.observacion || '';

  // Handler para imprimir sólo el reporte limpio
  const handlePrint = () => {
    window.print();
  };

  // Handler para copiar a WhatsApp
  const handleCopyWhatsApp = () => {
    const text = `🛫 *COTIZACIÓN RÁPIDA - PLAN DE VIAJE* 🏖️
*Localizador:* ${localizador}
*Fecha:* ${new Date(fechaEmision).toLocaleDateString()}
*Asesor:* ${asesorNombre}

*DATOS DEL CLIENTE:*
• *Cliente:* ${clienteNombre}
${clienteDoc ? `• *Documento:* ${clienteDoc}\n` : ''}${clienteTelefono ? `• *Teléfono:* ${clienteTelefono}\n` : ''}${checkin ? `• *Fechas de Viaje:* ${checkin} al ${checkout} (${noches} noches)\n` : ''}• *Pasajeros:* ${paxTotal} Pax (${paxAdultos} adultos${paxNinos > 0 ? `, ${paxNinos} niños` : ''})

*SERVICIOS COTIZADOS:*
${items.map(it => `• *${it.titulo}*: ${it.detalle} - $${Number(it.precio || 0).toFixed(2)} USD`).join('\n')}

*RESUMEN FINANCIERO:*
${descuentoUSD > 0 ? `• Descuento: -$${descuentoUSD.toFixed(2)} USD\n` : ''}• *TOTAL:* $${totalUSD.toFixed(2)} USD
• *Ref. Oficial BCV:* Bs. ${totalVES}

${observacion ? `*Observaciones:* ${observacion}\n\n` : ''}_*Nota:* Tarifas sujetas a cambio y disponibilidad de cupos hasta confirmar pago formal._`;

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
            <span style={{ fontSize: '18px' }}>📄</span>
            <span style={{ fontWeight: '700', fontSize: '1rem', color: '#FFFFFF' }}>
              Documento: Informe de Cotización Rápida
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(232, 114, 23, 0.2)',
                color: '#E87217',
                border: '1px solid rgba(232, 114, 23, 0.4)',
              }}
            >
              {localizador}
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
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Copiar resumen para WhatsApp o correo"
            >
              <span>{copied ? '✓' : '📋'}</span>
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
                <span>📂 Ver en Registro</span>
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
                    background: '#FEF3C7',
                    color: '#B45309',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: '1px solid #FCD34D',
                    marginBottom: '6px',
                  }}
                >
                  INFORME DE COTIZACIÓN RÁPIDA
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A' }}>
                  Localizador: <span style={{ color: '#E87217' }}>{localizador}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Ficha #{numeroFicha} • Emisión: {new Date(fechaEmision).toLocaleString('es-VE')}
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
                  👤 Datos del Pasajero Titular
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
                  🗓️ Parámetros del Viaje
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
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600', marginTop: '6px' }}>
                  ✓ Vigencia de cotización: 48 horas
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
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#0F172A', color: '#FFFFFF', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', borderRadius: '6px 0 0 0' }}>Servicio</th>
                      <th style={{ padding: '8px 12px' }}>Descripción / Especificación</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Total (USD)</th>
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
                      <span>${subtotalUSD.toFixed(2)} USD</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '600', marginBottom: '6px' }}>
                      <span>Descuento aplicado:</span>
                      <span>-${descuentoUSD.toFixed(2)} USD</span>
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
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A' }}>TOTAL:</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#E87217' }}>
                      ${totalUSD.toFixed(2)} USD
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                      Bs. {totalVES} (Ref. BCV)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones y Términos */}
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '0.78rem',
                color: '#92400E',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                📌 Observaciones y Condiciones Importantes:
              </div>
              {observacion && (
                <div style={{ marginBottom: '6px', fontStyle: 'italic', color: '#78350F' }}>
                  "{observacion}"
                </div>
              )}
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li>Tarifas sujetas a cambio y disponibilidad hasta el momento de confirmación de reserva y pago.</li>
                <li>Este informe no constituye bloqueo de boletos o habitaciones hasta la formalización de la orden.</li>
                <li>Pagos en Bolívares se calculan a la tasa oficial del Banco Central de Venezuela (BCV) del día de pago.</li>
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
