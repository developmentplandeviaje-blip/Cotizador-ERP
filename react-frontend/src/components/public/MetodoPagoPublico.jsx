import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from '../../utils/html2canvas';
import logonaranja from '../../assets/logonaranjapdv.png';

export default function MetodoPagoPublico({ userId, tipo = 'todos' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError('Identificador de asesor no proporcionado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const cleanTipo = (tipo || 'todos').toLowerCase();
    const url = `/v1/public/metodos-pago/${userId}/${cleanTipo !== 'todos' ? cleanTipo : ''}`;

    axios
      .get(url)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error('Error cargando métodos públicos:', err);
        setError('No se pudieron obtener los datos de pago para este enlace.');
      })
      .finally(() => setLoading(false));
  }, [userId, tipo]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const formatAccountNumber = (acc) => {
    if (!acc) return '—';
    const clean = acc.replace(/\D/g, '');
    if (clean.length === 20) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 10)}-${clean.slice(10)}`;
    }
    return acc;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    const el = document.getElementById('public-printable-card');
    if (!el) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        windowWidth: 900,
      });
      const asesorName = (data?.asesor?.name || 'asesor').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const cleanTipo = (tipo || 'todos').replace(/[^a-z0-9]/g, '_');
      const link = document.createElement('a');
      link.download = `Metodos_Pago_${asesorName}_${cleanTipo}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error(err);
      alert('Error al generar la imagen.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A1120', color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✈️</div>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: '#94A3B8' }}>Cargando información de pago oficial...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A1120', color: '#F8FAFC', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '420px', textAlign: 'center', backgroundColor: '#1E293B', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#F87171' }}>Enlace no disponible</h2>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '20px' }}>
            {error || 'No fue posible encontrar la información de este asesor.'}
          </p>
          <a href="https://plandeviaje.com.ve" style={{ color: '#E87217', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
            Ir a Plan de Viaje C.A. →
          </a>
        </div>
      </div>
    );
  }

  const { asesor, empresa, metodos } = data;
  const isDivisasOnly = tipo?.toLowerCase() === 'divisas';
  const isBolivaresOnly = tipo?.toLowerCase().includes('bolivares');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070D19', padding: '20px 16px 40px 16px', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #public-printable-card, #public-printable-card * {
            visibility: visible !important;
          }
          #public-printable-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Floating Actions Bar */}
      <div
        className="no-print"
        style={{
          maxWidth: '820px',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          backgroundColor: '#0F172A',
          padding: '12px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logonaranja} alt="Plan de Viaje" style={{ height: '32px', width: 'auto' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F8FAFC' }}>
            Plan de Viaje • Métodos Autorizados
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
              padding: '7px 12px',
              backgroundColor: 'rgba(232, 114, 23, 0.15)',
              border: '1px solid #E87217',
              borderRadius: '6px',
              color: '#FB923C',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            📄 Guardar PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isExporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: '#2563EB',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.6 : 1,
            }}
          >
            🖼️ {isExporting ? 'Descargando...' : 'Descargar Imagen'}
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          id="public-printable-card"
          style={{
            width: '100%',
            maxWidth: '820px',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            padding: '32px 36px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '3px solid #E87217',
              paddingBottom: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src={logonaranja} alt="Plan de Viaje" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
              <div>
                <h2 style={{ margin: '0 0 2px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  {empresa?.nombre || 'PLAN DE VIAJE C.A.'}
                </h2>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                  Agencia de Viajes y Turismo • RIF {empresa?.rif || 'J-40817029-7'}
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
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  color: '#C2410C',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                {isDivisasOnly ? 'PAGOS EN DIVISAS' : isBolivaresOnly ? 'CUENTAS EN BOLÍVARES' : 'MÉTODOS AUTORIZADOS'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 600 }}>
                Asesor Asignado: <span style={{ color: '#0F172A', fontWeight: 700 }}>{asesor.name}</span>
              </div>
              {asesor.email && (
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{asesor.email}</div>
              )}
            </div>
          </div>

          {/* Subheader */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              padding: '10px 16px',
              border: '1px solid #E2E8F0',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isDivisasOnly
                ? 'Cuentas y Métodos de Pago en Divisas'
                : isBolivaresOnly
                ? 'Cuentas Bancarias en Bolívares y Pago Móvil'
                : 'Métodos de Pago Autorizados'}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Utilice exclusivamente las siguientes cuentas autorizadas para efectuar y validar su pago
            </span>
          </div>

          {/* Methods List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {metodos.map((m, index) => {
              const isDigital = m.tipo === 'digital';
              const isBanco = m.tipo === 'banco';
              const title = m.nombre_publico || m.nombre;
              const isBs = !isDigital && !title.toLowerCase().includes('panama') && !title.toLowerCase().includes('divisa') && !title.includes('$');

              return (
                <div
                  key={m.id || index}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      backgroundColor: isDigital ? '#F0FDF4' : isBs ? '#EFF6FF' : '#FEF3C7',
                      borderBottom: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{isDigital ? '💳' : isBs ? '🏦' : '💵'}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A' }}>
                        {title}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isDigital ? '#DCFCE7' : isBs ? '#DBEAFE' : '#FDE68A',
                        color: isDigital ? '#15803D' : isBs ? '#1E40AF' : '#92400E',
                        textTransform: 'uppercase',
                      }}
                    >
                      {isDigital ? 'Billetera Digital / Zelle' : isBs ? 'Bolívares (VES)' : 'Divisas en Efectivo / Ext.'}
                    </span>
                  </div>

                  <div style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>
                    {isDigital && m.digital && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                            CORREO ELECTRÓNICO / CUENTA:
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9375rem' }}>
                              {m.digital.correo_cuenta}
                            </span>
                            <button
                              type="button"
                              className="no-print"
                              onClick={() => copyToClipboard(m.digital.correo_cuenta, `d-${m.id}`)}
                              style={{
                                border: 'none',
                                background: copiedId === `d-${m.id}` ? '#DCFCE7' : '#F1F5F9',
                                color: copiedId === `d-${m.id}` ? '#16A34A' : '#475569',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              {copiedId === `d-${m.id}` ? '✓ Copiado' : '📋 Copiar'}
                            </button>
                          </div>
                        </div>

                        {title.toLowerCase().includes('zelle') && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                              TITULAR:
                            </span>
                            <span style={{ fontWeight: 600, color: '#1E293B', display: 'block', marginTop: '2px' }}>
                              PLAN DE VIAJE C.A. / ASIGNADO
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {isBanco && m.banco && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                              TITULAR DE LA CUENTA:
                            </span>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{m.banco.titular}</span>
                          </div>

                          <div>
                            <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                              RIF / CÉDULA:
                            </span>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>
                              {m.banco.tipo_documento ? `${m.banco.tipo_documento}-` : ''}{m.banco.documento}
                            </span>
                          </div>

                          {m.banco.tipo_cuenta && (
                            <div>
                              <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                                TIPO DE CUENTA:
                              </span>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{m.banco.tipo_cuenta}</span>
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '8px 12px',
                          }}
                        >
                          <div>
                            <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                              NÚMERO DE CUENTA:
                            </span>
                            <span style={{ fontFamily: 'Consolas, monospace', fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A', letterSpacing: '0.05em' }}>
                              {formatAccountNumber(m.banco.numero_cuenta)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="no-print"
                            onClick={() => copyToClipboard(m.banco.numero_cuenta, `b-${m.id}`)}
                            style={{
                              border: 'none',
                              background: copiedId === `b-${m.id}` ? '#DCFCE7' : '#E2E8F0',
                              color: copiedId === `b-${m.id}` ? '#16A34A' : '#334155',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {copiedId === `b-${m.id}` ? '✓ Copiado' : '📋 Copiar Cuenta'}
                          </button>
                        </div>

                        {m.banco.pago_movil_telefono && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#F0FDF4',
                              border: '1px solid #BBF7D0',
                              borderRadius: '6px',
                              padding: '8px 12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.1rem' }}>📲</span>
                              <div>
                                <span style={{ display: 'block', fontSize: '0.6875rem', color: '#166534', fontWeight: 700 }}>
                                  PAGO MÓVIL:
                                </span>
                                <div style={{ fontSize: '0.8125rem', color: '#0F172A', fontWeight: 600 }}>
                                  Tel: <strong style={{ color: '#15803D' }}>{m.banco.pago_movil_telefono}</strong> • CI/RIF: <strong>{m.banco.tipo_documento ? `${m.banco.tipo_documento}-` : ''}{m.banco.documento}</strong>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="no-print"
                              onClick={() => copyToClipboard(m.banco.pago_movil_telefono, `pm-${m.id}`)}
                              style={{
                                border: 'none',
                                background: copiedId === `pm-${m.id}` ? '#DCFCE7' : '#DCFCE7',
                                color: '#15803D',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                            >
                              {copiedId === `pm-${m.id}` ? '✓ Copiado' : '📋 Copiar Teléfono'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer instructions */}
          <div
            style={{
              marginTop: '22px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '0.75rem',
              color: '#92400E',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              ⚠️ Instrucciones para la Confirmación de su Pago:
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>
                Por favor envíe el comprobante de pago legible a su asesor asignado indicando su nombre o número de cotización.
              </li>
              <li>
                Para transferencias en <strong>Bolívares</strong>, consulte la tasa oficial del día antes de emitir su pago.
              </li>
              <li>
                En pagos vía <strong>Zelle</strong>, colocar en concepto únicamente el nombre del pasajero titular.
              </li>
            </ol>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '0.6875rem',
              color: '#94A3B8',
              borderTop: '1px dashed #E2E8F0',
              paddingTop: '8px',
            }}
          >
            Plan de Viaje C.A. • Agencia de Viajes y Turismo • Rif J-40817029-7 • www.plandeviaje.com.ve
          </div>
        </div>
      </div>
    </div>
  );
}
