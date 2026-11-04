import React from 'react';
import Modal from '../../common/Modal';
import Badge from '../../common/Badge';

export default function DetalleVentaModal({ isOpen, onClose, venta, onRegistrarPago }) {
  if (!isOpen || !venta) return null;

  const cliente = venta.cliente || {};
  const asesor = venta.asesor || {};
  const items = Array.isArray(venta.items) ? venta.items : [];
  const pagos = Array.isArray(venta.pagos) ? venta.pagos : [];
  const aliado = venta.aliado;
  const freelancer = venta.freelancer;

  const isConfirmed = venta.estado === 'Confirmada';
  const isPaid = (venta.saldo_pendiente || 0) <= 0.01 && (venta.total_pagado || 0) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha de Venta: ${venta.localizador}`}
      maxWidth="840px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Cabecera / Info General */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Cliente Principal</span>
            <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.95rem', marginTop: '2px' }}>
              {cliente.nombre_completo || 'Cliente General'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
              {cliente.documento ? `${cliente.tipo_documento || 'V'}-${cliente.documento}` : 'Sin documento'}
            </div>
            {cliente.telefono && <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>📞 {cliente.telefono}</div>}
            {cliente.correo && <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>✉️ {cliente.correo}</div>}
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Vendedor / Asesor</span>
            <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.95rem', marginTop: '2px' }}>
              {asesor.name || 'Asesor'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
              {asesor.email || 'N/A'}
            </div>
            {aliado && (
              <div style={{ marginTop: '6px', padding: '4px 8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', fontSize: '0.75rem', color: '#38BDF8' }}>
                🏢 Aliado: <strong>{aliado.razon_social}</strong> ({aliado.rif})
              </div>
            )}
            {freelancer && (
              <div style={{ marginTop: '6px', padding: '4px 8px', background: 'rgba(232, 114, 23, 0.15)', border: '1px solid rgba(232, 114, 23, 0.3)', borderRadius: '6px', fontSize: '0.75rem', color: '#FB923C' }}>
                👤 Freelancer: <strong>{freelancer.nombre}</strong> ({freelancer.rif})
              </div>
            )}
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Estado de Venta</span>
            <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: isConfirmed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(232, 114, 23, 0.2)',
                  color: isConfirmed ? '#4ADE80' : '#FB923C',
                  border: `1px solid ${isConfirmed ? 'rgba(34, 197, 94, 0.4)' : 'rgba(232, 114, 23, 0.4)'}`,
                }}
              >
                {venta.estado}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: isPaid ? 'rgba(59, 130, 246, 0.2)' : (venta.total_pagado > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.2)'),
                  color: isPaid ? '#60A5FA' : (venta.total_pagado > 0 ? '#FBBF24' : '#CBD5E1'),
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                {venta.estado_pago || 'Pendiente'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
              Ficha #{venta.numero_ficha || venta.id} • {venta.pax_total || 1} Pasajeros
            </div>
            {venta.fecha_confirmacion && (
              <div style={{ fontSize: '0.725rem', color: '#4ADE80', marginTop: '2px' }}>
                Confirmada el {new Date(venta.fecha_confirmacion).toLocaleDateString('es-VE')}
              </div>
            )}
          </div>
        </div>

        {/* Balance Financiero */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ background: 'rgba(232, 114, 23, 0.1)', border: '1px solid rgba(232, 114, 23, 0.3)', borderRadius: '10px', padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total Venta</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#E87217', marginTop: '2px' }}>
              ${Number(venta.total_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
          </div>

          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total Pagado</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#4ADE80', marginTop: '2px' }}>
              ${Number(venta.total_pagado || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
          </div>

          <div style={{ background: (venta.saldo_pendiente || 0) > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)', border: `1px solid ${(venta.saldo_pendiente || 0) > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`, borderRadius: '10px', padding: '12px 16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Saldo Pendiente</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: (venta.saldo_pendiente || 0) > 0 ? '#F87171' : '#94A3B8', marginTop: '2px' }}>
              ${Number(venta.saldo_pendiente || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
          </div>
        </div>

        {/* Servicios Contratados */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.925rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Itinerario y Servicios Contratados</span>
            <Badge status="badge-neutral">{items.length} Servicios</Badge>
          </h4>

          {items.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
              No hay servicios registrados en esta venta.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', background: 'rgba(255, 255, 255, 0.1)', color: '#CBD5E1' }}>
                      {it.tipo}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF' }}>{it.titulo}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{it.detalle}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', color: '#E87217', fontSize: '0.9rem' }}>
                    ${Number(it.precio || 0).toFixed(2)} USD
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial de Pagos y Abonos */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '0.925rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Historial de Pagos y Abonos</span>
              <Badge status="badge-neutral">{pagos.length} Pagos</Badge>
            </h4>

            {onRegistrarPago && (venta.saldo_pendiente || 0) > 0.01 && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onRegistrarPago(venta);
                }}
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                + Registrar Abono
              </button>
            )}
          </div>

          {pagos.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
              Aún no se han registrado abonos ni pagos para esta venta.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94A3B8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '8px 12px' }}>Fecha</th>
                    <th style={{ padding: '8px 12px' }}>Método</th>
                    <th style={{ padding: '8px 12px' }}>Referencia</th>
                    <th style={{ padding: '8px 12px' }}>Moneda / Tasa</th>
                    <th style={{ padding: '8px 12px' }}>Monto Original</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Monto (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p, idx) => (
                    <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '8px 12px', color: '#CBD5E1' }}>{p.fecha_pago || 'N/A'}</td>
                      <td style={{ padding: '8px 12px', color: '#FFFFFF', fontWeight: '600' }}>{p.metodo}</td>
                      <td style={{ padding: '8px 12px', color: '#94A3B8', fontFamily: 'monospace' }}>{p.numero_transaccion}</td>
                      <td style={{ padding: '8px 12px', color: '#CBD5E1' }}>{p.moneda_pago} {p.tasa_cambio > 1 ? `(Tasa: ${Number(p.tasa_cambio).toFixed(2)})` : ''}</td>
                      <td style={{ padding: '8px 12px', color: '#CBD5E1' }}>{Number(p.monto_original).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#4ADE80' }}>
                        ${Number(p.monto_usd).toFixed(2)} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botón de Cierre */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
