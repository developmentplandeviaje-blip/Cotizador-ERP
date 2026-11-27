import React, { useState, useMemo } from 'react';
import plantillaVoucherNC from '../../../assets/Plantilla-voucher-NC.png';

// SVG Icons (Estrictamente SVGs de assets, CERO emojis)
import imprimirIcon from '../../../assets/Imprimir.svg';
import receiptIcon from '../../../assets/receipt.svg';

export default function NotaCreditoModal({
  isOpen,
  onClose,
  cotizacion,
}) {
  const [copied, setCopied] = useState(false);

  // Helper seguro para extraer texto
  const getSafeString = (val, fallback = '') => {
    if (!val && val !== 0) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return val.nombre || val.nombre_publico || val.name || val.titulo || val.descripcion || fallback;
    }
    return fallback;
  };

  const formatFechaDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      const clean = String(dateStr).split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return clean;
    } catch {
      return String(dateStr);
    }
  };

  const formatFechaConGuiones = (dateStr) => {
    const f = formatFechaDDMMYYYY(dateStr);
    return f.replace(/\//g, '-');
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Normalización general
  const numeroFicha =
    cotizacion?.numero_ficha ||
    (cotizacion?.id ? String(cotizacion.id) : '15534');

  const fechaEmision = cotizacion?.fecha_creacion || cotizacion?.fecha || cotizacion?.created_at
    ? formatFechaConGuiones(cotizacion.fecha_creacion || cotizacion.fecha || cotizacion.created_at)
    : formatFechaConGuiones(new Date().toISOString());

  const asesorNombre =
    typeof cotizacion?.asesor === 'object' && cotizacion.asesor !== null
      ? cotizacion.asesor.name || cotizacion.asesor.nombre || `${cotizacion.asesor.first_name || ''} ${cotizacion.asesor.last_name || ''}`.trim() || 'Eveliannys Marín'
      : typeof cotizacion?.vendedor === 'object' && cotizacion.vendedor !== null
      ? cotizacion.vendedor.name || cotizacion.vendedor.nombre || 'Eveliannys Marín'
      : typeof cotizacion?.user === 'object' && cotizacion.user !== null
      ? cotizacion.user.name || cotizacion.user.nombre || 'Eveliannys Marín'
      : typeof cotizacion?.asesor === 'string' && cotizacion.asesor.trim()
      ? cotizacion.asesor
      : 'Eveliannys Marín';

  const clienteData = cotizacion?.cliente || {};
  const clienteNombre =
    typeof clienteData === 'string'
      ? clienteData
      : typeof clienteData === 'object' && clienteData !== null
      ? clienteData.nombre_completo ||
        `${clienteData.nombres || ''} ${clienteData.apellidos || ''}`.trim() ||
        clienteData.nombre ||
        'Cliente Titular'
      : 'Cliente Titular';

  // =========================================================================
  // NORMALIZACIÓN DE SERVICIOS ADQUIRIDOS
  // =========================================================================
  const serviciosAdquiridos = useMemo(() => {
    if (!cotizacion) return [];
    const lista = [];

    // 1. Si vienen items ya estructurados
    if (Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
      cotizacion.items.forEach((it, idx) => {
        const titulo = getSafeString(it.titulo, 'Servicio Turístico').replace(/^(Hotel|Vuelo|Excursión|Paquete|Ferry|Servicio):\s*/i, '');
        const detalle = getSafeString(it.detalle, '');
        const precio = Number(it.precio || 0);
        lista.push({
          id: `item_${idx}`,
          titulo,
          detalle,
          precio,
        });
      });
      return lista;
    }

    // 2. Hoteles directos
    if (Array.isArray(cotizacion.hoteles) && cotizacion.hoteles.length > 0) {
      cotizacion.hoteles.forEach((h, idx) => {
        const nombre = getSafeString(h.hotel, getSafeString(h.nombre, 'Hotel Seleccionado'));
        const ubicacion = getSafeString(h.hotel?.ubicacion || h.ubicacion || 'Playa El Agua');
        const habitacion = getSafeString(h.tipo_habitacion, getSafeString(h.habitacion, 'Estándar'));
        const noches = Number(h.noches || 1);
        const regimen = getSafeString(h.tipo, getSafeString(h.regimen, 'Todo Incluido'));
        const total = Number(h.total || ((Number(h.precio_noche_adulto || 0) * (h.adultos || 1) + Number(h.precio_noche_nino || 0) * (h.ninos || 0)) * noches) || 0);

        lista.push({
          id: `hotel_${idx}`,
          titulo: `${nombre} / ${ubicacion}`,
          detalle: `Habitacion: ${habitacion}, Noches: ${noches}, ${regimen}`,
          precio: total,
        });
      });
    }

    // 3. Vuelos directos
    if (Array.isArray(cotizacion.vuelos) && cotizacion.vuelos.length > 0) {
      cotizacion.vuelos.forEach((v, idx) => {
        const aerolinea = getSafeString(v.aerolinea, 'Aerolínea').replace(/^Vuelo:\s*/i, '');
        const itinerario = getSafeString(v.itinerario, 'Ruta aérea');
        const total = Number(
          v.total ||
          v.precio ||
          (Number(v.precio_adulto || 0) * (v.adultos || 1) + Number(v.precio_nino || 0) * (v.ninos || 0) + Number(v.precio_infante || 0) * (v.infantes || 0)) ||
          0
        );
        lista.push({
          id: `vuelo_${idx}`,
          titulo: `Boletos Aéreos: ${aerolinea}`,
          detalle: `Itinerario: ${itinerario}`,
          precio: total,
        });
      });
    }

    // 4. Traslados directos
    if (Array.isArray(cotizacion.traslados) && cotizacion.traslados.length > 0) {
      cotizacion.traslados.forEach((t, idx) => {
        const rutaOrigen = t.traslado?.ruta_origen || t.ruta_origen || 'Origen';
        const rutaDestino = t.traslado?.ruta_destino || t.ruta_destino || 'Destino';
        const total = Number(t.precio_historico || t.total || t.precio || 0);
        lista.push({
          id: `traslado_${idx}`,
          titulo: `Traslado: ${rutaOrigen} - ${rutaDestino}`,
          detalle: t.observacion || t.detalle || 'Traslado Terrestre',
          precio: total,
        });
      });
    }

    // 5. Excursiones, Paquetes, Otros
    if (Array.isArray(cotizacion.excursiones)) {
      cotizacion.excursiones.forEach((e, idx) => {
        lista.push({
          id: `exc_${idx}`,
          titulo: `Excursión: ${getSafeString(e.tipo_excursion, getSafeString(e.excursion, 'Excursión'))}`,
          detalle: e.detalle || 'Excursión Turística',
          precio: Number(e.total || e.precio || 0),
        });
      });
    }

    if (Array.isArray(cotizacion.paquetes)) {
      cotizacion.paquetes.forEach((p, idx) => {
        lista.push({
          id: `paq_${idx}`,
          titulo: `Paquete: ${getSafeString(p.paquete, 'Paquete Turístico')}`,
          detalle: p.detalle || 'Paquete Turístico',
          precio: Number(p.total || p.precio || 0),
        });
      });
    }

    if (Array.isArray(cotizacion.otros)) {
      cotizacion.otros.forEach((o, idx) => {
        lista.push({
          id: `otro_${idx}`,
          titulo: getSafeString(o.descripcion, 'Servicio Adicional'),
          detalle: o.detalle || '',
          precio: Number(o.total || o.precio || 0),
        });
      });
    }

    if (lista.length === 0) {
      lista.push({
        id: 'default_1',
        titulo: 'LD Palm Beach / Playa El Agua',
        detalle: 'Habitacion: Doble / Triple / Superior, Noches: 1, Todo Incluido',
        precio: Number(cotizacion.total_usd || 75.0),
      });
    }

    return lista;
  }, [cotizacion]);

  // Cálculos financieros para la Nota de Crédito
  const pagoTotalUSD = useMemo(() => {
    if (cotizacion?.total_pagado && Number(cotizacion.total_pagado) > 0) {
      return Number(cotizacion.total_pagado);
    }
    if (cotizacion?.total_abonado && Number(cotizacion.total_abonado) > 0) {
      return Number(cotizacion.total_abonado);
    }
    if (Array.isArray(cotizacion?.pagos) && cotizacion.pagos.length > 0) {
      const sum = cotizacion.pagos.reduce((acc, p) => acc + Number(p.monto_usd || 0), 0);
      if (sum > 0) return sum;
    }
    return Number(cotizacion?.total_usd || 75.0);
  }, [cotizacion]);

  const saldoAFavorUSD = useMemo(() => {
    if (cotizacion?.saldo_a_favor && Number(cotizacion.saldo_a_favor) > 0) {
      return Number(cotizacion.saldo_a_favor);
    }
    return pagoTotalUSD;
  }, [cotizacion, pagoTotalUSD]);

  if (!isOpen || !cotizacion) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const serviciosTxt = serviciosAdquiridos
      .map((s) => `• ${s.titulo} (${s.detalle}) - $${formatCurrency(s.precio)} USD`)
      .join('\n');

    const txt = `*NOTA DE CRÉDITO - PLAN DE VIAJE*
*N° de Ficha:* ${numeroFicha}
*Fecha de Emisión:* ${fechaEmision}
*Emitido por:* ${asesorNombre}

*Crédito a favor de:*
${clienteNombre}

*Servicios Adquiridos:*
${serviciosTxt}

*Pago Total USD:* $${formatCurrency(pagoTotalUSD)}
*Saldo a Favor:* $${formatCurrency(saldoAFavorUSD)}

*Políticas y Condiciones:*
• Saldo a Favor en Alojamientos / Servicios terrestres, será válido para disfrutar en un lapso no mayor a seis (6) meses a partir del día de la cancelación o reprogramación del viaje.
• El Saldo a Favor es válido para el disfrute en temporada baja. En caso de utilizarse en temporada alta, deberá cancelar la diferencia.
• En caso de ser necesario y depende de la cancelación, se aplica cargos administrativos.

*Penalidades servicios aéreos:*
• Los Boletos aéreos no son reembolsables / no endosable / no transferibles bajo ningún concepto.
• Aplica penalidad de cambio solo a cancelación voluntaria del pasajero; y se exceptúan casos fortuitos.
E-ticket válido por 12 meses a partir de la fecha de emisión.`;

    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
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
      {/* Estilos CSS para Impresión exacta de Documentos (Cero margen, Hoja Carta exacta) */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-nota-credito-root, #printable-nota-credito-root * {
            visibility: visible !important;
          }
          #printable-nota-credito-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .nota-credito-sheet {
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

      {/* Contenedor Modal */}
      <div
        style={{
          width: '100%',
          maxWidth: '890px',
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
        {/* Barra Superior de Control (Solo pantalla) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: '#0F1E42',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={receiptIcon}
              alt=""
              style={{
                width: '18px',
                height: '18px',
                filter: 'brightness(0) saturate(100%) invert(67%) sepia(85%) saturate(3025%) hue-rotate(345deg) brightness(101%) contrast(98%)',
              }}
            />
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.3px' }}>
              Nota de Crédito Oficial - Ficha {numeroFicha}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Botón Copiar Texto */}
            <button
              type="button"
              onClick={handleCopyText}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: copied ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              title="Copiar resumen para WhatsApp o correo"
            >
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            {/* Botón Imprimir / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                background: '#F26522',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(242, 101, 34, 0.4)',
              }}
              title="Imprimir Nota de Crédito o Guardar como PDF"
            >
              <img
                src={imprimirIcon}
                alt=""
                style={{ width: '14px', height: '14px', filter: 'brightness(0) invert(1)' }}
              />
              <span>Imprimir / PDF</span>
            </button>

            {/* Cerrar Modal */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '1.2rem',
                fontWeight: '700',
              }}
              title="Cerrar vista previa"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Área de Visualización con Scroll */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 16px',
            background: '#060B19',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div id="printable-nota-credito-root">
            <div
              className="nota-credito-sheet"
              style={{
                width: '792px',
                height: '1024px',
                minHeight: '1024px',
                maxHeight: '1024px',
                position: 'relative',
                backgroundImage: `url(${plantillaVoucherNC})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center top',
                backgroundRepeat: 'no-repeat',
                boxSizing: 'border-box',
                backgroundColor: '#FFFFFF',
                margin: '0 auto',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: "'Montserrat', sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
              }}
            >
              {/* Contenido Central: Dentro de los márgenes útiles de la plantilla */}
              <div
                style={{
                  position: 'absolute',
                  top: '190px',
                  bottom: '65px',
                  left: '42px',
                  right: '42px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  boxSizing: 'border-box',
                }}
              >
                {/* ========================================================= */}
                {/* 1. TÍTULO PRINCIPAL Y LÍNEA SUBRAYADA NARANJA */}
                {/* ========================================================= */}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: '32px',
                      fontWeight: '800',
                      color: '#00206D',
                      letterSpacing: '0.5px',
                      textShadow: '0 1px 2px rgba(0, 32, 109, 0.15)',
                    }}
                  >
                    Nota de Crédito
                  </h1>
                  <div
                    style={{
                      width: '300px',
                      height: '3.5px',
                      backgroundColor: '#F26522',
                      borderRadius: '2px',
                      margin: '5px auto 0 auto',
                    }}
                  />
                </div>

                {/* ========================================================= */}
                {/* 2. BARRA DE METADATOS SUPERIOR (3 CÁPSULAS) */}
                {/* ========================================================= */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  {/* Cápsula Azul: No de Ficha */}
                  <div
                    style={{
                      background: '#00206D',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '7px 20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                      textAlign: 'center',
                      flex: '1',
                      boxShadow: '0 2px 4px rgba(0, 32, 109, 0.2)',
                    }}
                  >
                    No de Ficha: {numeroFicha}
                  </div>

                  {/* Cápsula Naranja: Fecha de Emisión */}
                  <div
                    style={{
                      background: '#F26522',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '7px 20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                      textAlign: 'center',
                      flex: '1.2',
                      boxShadow: '0 2px 4px rgba(242, 101, 34, 0.25)',
                    }}
                  >
                    Fecha de Emisión: {fechaEmision}
                  </div>

                  {/* Cápsula Azul: Emitido por */}
                  <div
                    style={{
                      background: '#00206D',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '7px 20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                      textAlign: 'center',
                      flex: '1.3',
                      boxShadow: '0 2px 4px rgba(0, 32, 109, 0.2)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Emitido por: {asesorNombre}
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 3. BENEFICIARIO: CRÉDITO A FAVOR DE */}
                {/* ========================================================= */}
                <div
                  style={{
                    background: '#F1F5F9',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    textAlign: 'center',
                    marginBottom: '14px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      color: '#475569',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      marginBottom: '2px',
                    }}
                  >
                    Crédito a favor de:
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: '#00206D',
                      letterSpacing: '0.3px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {clienteNombre}
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 4. TABLA DE SERVICIOS ADQUIRIDOS */}
                {/* ========================================================= */}
                <div
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    overflow: 'hidden',
                    marginBottom: '10px',
                    background: '#FFFFFF',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th
                          style={{
                            background: '#00206D',
                            color: '#FFFFFF',
                            padding: '8px 14px',
                            fontWeight: '700',
                            fontSize: '12px',
                            width: '74%',
                          }}
                        >
                          Servicios Adquiridos
                        </th>
                        <th
                          style={{
                            background: '#F26522',
                            color: '#FFFFFF',
                            padding: '8px 14px',
                            fontWeight: '700',
                            fontSize: '12px',
                            textAlign: 'right',
                            width: '26%',
                          }}
                        >
                          Total USD
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviciosAdquiridos.map((s, idx) => (
                        <tr
                          key={s.id || idx}
                          style={{
                            borderTop: '1px solid #E2E8F0',
                            background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          }}
                        >
                          <td style={{ padding: '8px 14px', borderRight: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: '800', color: '#00206D', fontSize: '12.5px', marginBottom: '2px' }}>
                              {s.titulo}
                            </div>
                            {s.detalle && (
                              <div style={{ color: '#475569', fontSize: '11px', fontWeight: '500' }}>
                                {s.detalle}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '800', color: '#00206D', fontSize: '12.5px', verticalAlign: 'middle' }}>
                            ${formatCurrency(s.precio)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ========================================================= */}
                {/* 5. BLOQUE FINANCIERO (PAGO TOTAL Y SALDO A FAVOR) */}
                {/* ========================================================= */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #CBD5E1',
                      width: '320px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Fila Pago Total */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #FFFFFF' }}>
                      <div
                        style={{
                          background: '#F26522',
                          color: '#FFFFFF',
                          padding: '6px 14px',
                          fontWeight: '700',
                          fontSize: '12px',
                          flex: '1.2',
                          textAlign: 'right',
                        }}
                      >
                        Pago Total USD:
                      </div>
                      <div
                        style={{
                          background: '#00206D',
                          color: '#FFFFFF',
                          padding: '6px 14px',
                          fontWeight: '800',
                          fontSize: '13px',
                          flex: '1',
                          textAlign: 'right',
                        }}
                      >
                        {formatCurrency(pagoTotalUSD)}
                      </div>
                    </div>

                    {/* Fila Saldo a Favor */}
                    <div style={{ display: 'flex' }}>
                      <div
                        style={{
                          background: '#F26522',
                          color: '#FFFFFF',
                          padding: '6px 14px',
                          fontWeight: '700',
                          fontSize: '12px',
                          flex: '1.2',
                          textAlign: 'right',
                        }}
                      >
                        Saldo a Favor:
                      </div>
                      <div
                        style={{
                          background: '#00206D',
                          color: '#FFFFFF',
                          padding: '6px 14px',
                          fontWeight: '800',
                          fontSize: '13px',
                          flex: '1',
                          textAlign: 'right',
                        }}
                      >
                        {formatCurrency(saldoAFavorUSD)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 6. POLÍTICAS Y CONDICIONES */}
                {/* ========================================================= */}
                <div style={{ marginBottom: '10px' }}>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: '800',
                      color: '#00206D',
                      letterSpacing: '0.4px',
                      marginBottom: '2px',
                    }}
                  >
                    POLÍTICAS Y CONDICIONES:
                  </div>
                  <div
                    style={{
                      width: '240px',
                      height: '2.5px',
                      backgroundColor: '#F26522',
                      borderRadius: '2px',
                      marginBottom: '6px',
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: '#1E293B', lineHeight: '1.35' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#F26522', fontSize: '14px', lineHeight: '1' }}>•</span>
                      <span>
                        Saldo a Favor en Alojamientos / Servicios terrestres, será válido para disfrutar en un lapso no mayor a seis (6) meses a partir del día de la cancelación o reprogramación del viaje.
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#F26522', fontSize: '14px', lineHeight: '1' }}>•</span>
                      <span>
                        El Saldo a Favor es válido para el disfrute en temporada baja. En caso de utilizarse en temporada alta, deberá cancelar la diferencia.
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#F26522', fontSize: '14px', lineHeight: '1' }}>•</span>
                      <span>
                        En caso de ser necesario y depende de la cancelación, se aplica cargos administrativos.
                      </span>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 7. PENALIDADES SERVICIOS AÉREOS */}
                {/* ========================================================= */}
                <div style={{ marginTop: 'auto', marginBottom: '8px' }}>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: '800',
                      color: '#00206D',
                      letterSpacing: '0.4px',
                      marginBottom: '2px',
                    }}
                  >
                    Penalidades servicios aéreos:
                  </div>
                  <div
                    style={{
                      width: '240px',
                      height: '2.5px',
                      backgroundColor: '#F26522',
                      borderRadius: '2px',
                      marginBottom: '6px',
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: '#1E293B', lineHeight: '1.35' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#F26522', fontSize: '14px', lineHeight: '1' }}>•</span>
                      <span>
                        Los Boletos aéreos no son reembolsables / no endosable / no transferibles bajo ningún concepto.
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#F26522', fontSize: '14px', lineHeight: '1' }}>•</span>
                      <span>
                        Aplica penalidad de cambio solo a cancelación voluntaria del pasajero; y se exceptúan casos fortuitos (desastres naturales o suspensiones de viaje).
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#475569',
                      textAlign: 'left',
                    }}
                  >
                    E-ticket válido por 12 meses a partir de la fecha de emisión.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
