import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from '../../../utils/html2canvas';
import logonaranja from '../../../assets/logonaranjapdv.png';
import { showToast } from '../../../utils/toast';

export default function MetodosPagoExportModal({
  isOpen,
  onClose,
  user,
  initialCategory = 'todos',
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'todos');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    asesor: null,
    empresa: null,
    metodos: [],
  });
  const [isExporting, setIsExporting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    setActiveCategory(initialCategory || 'todos');
  }, [initialCategory, isOpen]);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    setLoading(true);
    // Fetch directly from our public endpoint or finance endpoint
    const url = `/v1/public/metodos-pago/${user.id}`;
    axios
      .get(url)
      .then((res) => {
        setData({
          asesor: res.data.asesor || {
            id: user.id,
            name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email,
            level: user.level,
          },
          empresa: res.data.empresa || {
            nombre: 'PLAN DE VIAJE C.A.',
            rif: 'J-40817029-7',
            telefono: '+58 412-530-8316',
            email: 'reservas@plandeviaje.com.ve',
            web: 'www.plandeviaje.com.ve',
            direccion: 'Caracas, Venezuela',
          },
          metodos: res.data.metodos || [],
        });
      })
      .catch((err) => {
        console.error('Error cargando métodos del asesor:', err);
        showToast('No se pudieron cargar los métodos asignados.', 'error');
      })
      .finally(() => setLoading(false));
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  // Filter methods based on active category
  const allMetodos = data.metodos || [];

  const divisasMetodos = allMetodos.filter((m) => {
    const text = `${m.nombre || ''} ${m.nombre_publico || ''}`.toLowerCase();
    return (
      m.tipo === 'digital' ||
      text.includes('divisa') ||
      text.includes('panama') ||
      text.includes('panamá') ||
      text.includes('$') ||
      text.includes('usd') ||
      text.includes('dolares')
    );
  });

  const bolivaresMetodos = allMetodos.filter((m) => {
    const text = `${m.nombre || ''} ${m.nombre_publico || ''}`.toLowerCase();
    const isDivisa =
      m.tipo === 'digital' ||
      text.includes('divisa') ||
      text.includes('panama') ||
      text.includes('panamá') ||
      text.includes('$') ||
      text.includes('usd') ||
      text.includes('dolares');
    return !isDivisa;
  });

  const provisionalMetodos = bolivaresMetodos.filter((m) => {
    const text = `${m.nombre || ''} ${m.nombre_publico || ''}`.toLowerCase();
    return text.includes('p/natural') || text.includes('p natural') || text.includes('provisional');
  });

  let displayedMetodos = allMetodos;
  if (activeCategory === 'divisas') displayedMetodos = divisasMetodos;
  else if (activeCategory === 'bolivares') displayedMetodos = bolivaresMetodos;
  else if (activeCategory === 'provisional' || activeCategory === 'bolivares/provisional') displayedMetodos = provisionalMetodos;

  const asesorName = data.asesor?.name || user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Asesor';

  // Helper format account number
  const formatAccountNumber = (acc) => {
    if (!acc) return '—';
    const clean = acc.replace(/\D/g, '');
    if (clean.length === 20) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 10)}-${clean.slice(10)}`;
    }
    return acc;
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      showToast('Copiado al portapapeles', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  // Imprimir / Guardar como PDF nativo
  const handlePrint = () => {
    window.print();
  };

  // Descargar como Imagen PNG de alta resolución
  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-metodos-pago');
    if (!element) return;
    setIsExporting(true);
    try {
      // Create high-res canvas
      const canvas = await html2canvas(element, {
        scale: 2.5, // 2.5x high DPI
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        windowWidth: 900,
      });

      const cleanName = asesorName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const cleanCategory = activeCategory.replace(/[^a-z0-9]/g, '_');
      const filename = `Metodos_Pago_${cleanName}_${cleanCategory}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      showToast('Imagen descargada correctamente.', 'success');
    } catch (err) {
      console.error('Error generando imagen:', err);
      showToast('Error al exportar la imagen.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Copiar resumen de texto optimizado para WhatsApp
  const handleCopyWhatsApp = () => {
    let msg = `✈️ *PLAN DE VIAJE C.A.* ✈️\n`;
    msg += `💳 *MÉTODOS DE PAGO AUTORIZADOS*\n`;
    msg += `👤 *Atención:* ${asesorName}\n`;
    if (data.asesor?.email) msg += `✉️ ${data.asesor.email}\n`;
    msg += `─────────────────────────\n\n`;

    if (activeCategory === 'todos' || activeCategory === 'divisas') {
      if (divisasMetodos.length > 0) {
        msg += `💵 *PAGOS EN DIVISAS (USD):*\n\n`;
        divisasMetodos.forEach((m) => {
          msg += `🔹 *${m.nombre_publico || m.nombre}*\n`;
          if (m.tipo === 'digital' && m.digital) {
            msg += `   • Correo / Cuenta: ${m.digital.correo_cuenta}\n`;
          } else if (m.banco) {
            msg += `   • Titular: ${m.banco.titular}\n`;
            if (m.banco.documento) msg += `   • Documento: ${m.banco.tipo_documento || ''}-${m.banco.documento}\n`;
            msg += `   • N° Cuenta: ${formatAccountNumber(m.banco.numero_cuenta)}\n`;
            if (m.banco.tipo_cuenta) msg += `   • Tipo: ${m.banco.tipo_cuenta}\n`;
          }
          msg += `\n`;
        });
      }
    }

    if (activeCategory === 'todos' || activeCategory === 'bolivares') {
      const bsList = activeCategory === 'todos' ? bolivaresMetodos : displayedMetodos;
      if (bsList.length > 0) {
        msg += `🏦 *TRANSFERENCIAS EN BOLÍVARES Y PAGO MÓVIL:*\n\n`;
        bsList.forEach((m) => {
          msg += `🔹 *${m.nombre_publico || m.nombre}*\n`;
          if (m.banco) {
            msg += `   • Titular: ${m.banco.titular}\n`;
            msg += `   • RIF / C.I.: ${m.banco.tipo_documento || ''}-${m.banco.documento}\n`;
            msg += `   • N° Cuenta: ${formatAccountNumber(m.banco.numero_cuenta)}\n`;
            if (m.banco.tipo_cuenta) msg += `   • Tipo: ${m.banco.tipo_cuenta}\n`;
            if (m.banco.pago_movil_telefono) {
              msg += `   📲 *Pago Móvil:* ${m.banco.pago_movil_telefono} | Banco: ${m.nombre_publico || m.nombre} | Doc: ${m.banco.documento}\n`;
            }
          }
          msg += `\n`;
        });
      }
    }

    if (activeCategory === 'provisional' || activeCategory === 'bolivares/provisional') {
      if (provisionalMetodos.length > 0) {
        msg += `⚡ *CUENTAS BANCARIAS PROVISIONALES (BS):*\n\n`;
        provisionalMetodos.forEach((m) => {
          msg += `🔹 *${m.nombre_publico || m.nombre}*\n`;
          if (m.banco) {
            msg += `   • Titular: ${m.banco.titular}\n`;
            msg += `   • C.I.: ${m.banco.tipo_documento || ''}-${m.banco.documento}\n`;
            msg += `   • N° Cuenta: ${formatAccountNumber(m.banco.numero_cuenta)}\n`;
            if (m.banco.pago_movil_telefono) {
              msg += `   📲 *Pago Móvil:* ${m.banco.pago_movil_telefono}\n`;
            }
          }
          msg += `\n`;
        });
      }
    }

    msg += `─────────────────────────\n`;
    msg += `⚠️ *NOTAS IMPORTANTES:*\n`;
    msg += `1. Por favor envíe el comprobante legible a su asesor con su número de ficha/cotización.\n`;
    msg += `2. Para pagos en Bs, consultar la tasa de cambio oficial vigente antes de realizar la transacción.\n`;
    msg += `🌐 www.plandeviaje.com.ve\n`;

    copyToClipboard(msg, 'whatsapp-msg');
    showToast('Resumen de texto copiado para WhatsApp.', 'success');
  };

  const getTitleByCategory = () => {
    switch (activeCategory) {
      case 'divisas':
        return 'Cuentas y Métodos de Pago en Divisas';
      case 'bolivares':
        return 'Cuentas Bancarias en Bolívares y Pago Móvil';
      case 'provisional':
      case 'bolivares/provisional':
        return 'Cuentas Bancarias Provisionales (Bolívares)';
      default:
        return 'Métodos de Pago Autorizados';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
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
          body * {
            visibility: hidden !important;
          }
          #printable-metodos-pago, #printable-metodos-pago * {
            visibility: visible !important;
          }
          #printable-metodos-pago {
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

      {/* Modal Dialog */}
      <div
        style={{
          width: '100%',
          maxWidth: '940px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0c1527',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#0f172a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.25rem' }}>💳</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#F8FAFC', fontWeight: 700 }}>
                Métodos de Pago • {asesorName}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Generador de PDF e Imágenes para compartir con clientes
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'rgba(232, 114, 23, 0.15)',
                border: '1px solid #E87217',
                borderRadius: '8px',
                color: '#F97316',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
              title="Guardar o Imprimir en PDF"
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
                padding: '8px 14px',
                backgroundColor: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.6 : 1,
              }}
              title="Descargar imagen PNG para enviar por WhatsApp"
            >
              🖼️ {isExporting ? 'Generando...' : 'Descargar Imagen'}
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#10B981',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
              title="Copiar texto para WhatsApp"
            >
              💬 Copiar Texto
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.5rem',
                lineHeight: 1,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'todos', label: '🌟 Todos los Métodos', count: allMetodos.length },
            { id: 'divisas', label: '💵 Divisas (USD)', count: divisasMetodos.length },
            { id: 'bolivares', label: '🏦 Bolívares (Bs)', count: bolivaresMetodos.length },
            { id: 'provisional', label: '⚡ Bolívares Provisional', count: provisionalMetodos.length },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid #E87217' : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: isActive ? 'rgba(232, 114, 23, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#FB923C' : '#CBD5E1',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    backgroundColor: isActive ? '#E87217' : 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                  }}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Document Preview Container (Scrollable) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: '#070d19',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <div style={{ color: '#94A3B8', padding: '40px', textAlign: 'center' }}>
              Cargando métodos de pago...
            </div>
          ) : displayedMetodos.length === 0 ? (
            <div style={{ color: '#94A3B8', padding: '40px', textAlign: 'center' }}>
              No hay métodos de pago registrados en esta categoría para este usuario.
            </div>
          ) : (
            /* Printable and Canvas Target Card */
            <div
              id="printable-metodos-pago"
              style={{
                width: '100%',
                maxWidth: '820px',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                padding: '32px 36px',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              {/* Header: Company & Advisor Branding */}
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
                  <img
                    src={logonaranja}
                    alt="Plan de Viaje"
                    style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
                  />
                  <div>
                    <h2 style={{ margin: '0 0 2px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                      PLAN DE VIAJE C.A.
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
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
                    {activeCategory === 'divisas'
                      ? 'PAGOS EN DIVISAS'
                      : activeCategory === 'bolivares'
                      ? 'TRANSFERENCIAS EN BS'
                      : activeCategory === 'provisional' || activeCategory === 'bolivares/provisional'
                      ? 'CUENTAS PROVISIONALES (BS)'
                      : 'MÉTODOS AUTORIZADOS'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 600 }}>
                    Asesor: <span style={{ color: '#0F172A', fontWeight: 700 }}>{asesorName}</span>
                  </div>
                  {data.asesor?.email && (
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {data.asesor.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Title of Document */}
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '22px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {getTitleByCategory()}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Cuentas oficiales asignadas para la confirmación de reservaciones y servicios turísticos
                </span>
              </div>

              {/* Payment Methods Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {displayedMetodos.map((m, index) => {
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
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    >
                      {/* Card Header */}
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
                          <span style={{ fontSize: '1.1rem' }}>
                            {isDigital ? '💳' : isBs ? '🏦' : '💵'}
                          </span>
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

                      {/* Card Content Body */}
                      <div style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>
                        {/* Digital Details */}
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
                                  onClick={() => copyToClipboard(m.digital.correo_cuenta, `digital-${m.id}`)}
                                  style={{
                                    border: 'none',
                                    background: copiedId === `digital-${m.id}` ? '#DCFCE7' : '#F1F5F9',
                                    color: copiedId === `digital-${m.id}` ? '#16A34A' : '#475569',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.6875rem',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                  }}
                                  title="Copiar correo"
                                >
                                  {copiedId === `digital-${m.id}` ? '✓ Copiado' : '📋 Copiar'}
                                </button>
                              </div>
                            </div>

                            {title.toLowerCase().includes('zelle') && (
                              <div>
                                <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                                  TITULAR DE LA CUENTA:
                                </span>
                                <span style={{ fontWeight: 600, color: '#1E293B', display: 'block', marginTop: '2px' }}>
                                  PLAN DE VIAJE C.A. / ASIGNADO
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bank Details */}
                        {isBanco && m.banco && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                              <div>
                                <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                                  TITULAR DE LA CUENTA:
                                </span>
                                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                                  {m.banco.titular}
                                </span>
                              </div>

                              <div>
                                <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                                  RIF / CÉDULA DE IDENTIDAD:
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
                                  <span style={{ fontWeight: 600, color: '#334155' }}>
                                    {m.banco.tipo_cuenta}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Account Number Box */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                marginTop: '2px',
                              }}
                            >
                              <div>
                                <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                                  NÚMERO DE CUENTA (20 DÍGITOS):
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'Consolas, monospace',
                                    fontWeight: 800,
                                    fontSize: '0.9375rem',
                                    color: '#0F172A',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  {formatAccountNumber(m.banco.numero_cuenta)}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="no-print"
                                onClick={() => copyToClipboard(m.banco.numero_cuenta, `acc-${m.id}`)}
                                style={{
                                  border: 'none',
                                  background: copiedId === `acc-${m.id}` ? '#DCFCE7' : '#E2E8F0',
                                  color: copiedId === `acc-${m.id}` ? '#16A34A' : '#334155',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                }}
                                title="Copiar número de cuenta"
                              >
                                {copiedId === `acc-${m.id}` ? '✓ Copiado' : '📋 Copiar Cuenta'}
                              </button>
                            </div>

                            {/* Pago Móvil Details (if present) */}
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
                                      DATOS PARA PAGO MÓVIL:
                                    </span>
                                    <div style={{ fontSize: '0.8125rem', color: '#0F172A', fontWeight: 600 }}>
                                      Tel: <strong style={{ color: '#15803D' }}>{m.banco.pago_movil_telefono}</strong> • Banco: <strong>{title}</strong> • CI/RIF: <strong>{m.banco.tipo_documento ? `${m.banco.tipo_documento}-` : ''}{m.banco.documento}</strong>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="no-print"
                                  onClick={() =>
                                    copyToClipboard(
                                      `${m.banco.pago_movil_telefono}`,
                                      `pm-${m.id}`
                                    )
                                  }
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
                                  title="Copiar teléfono"
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

              {/* Instructions and Terms Footer */}
              <div
                style={{
                  marginTop: '24px',
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
                    Por favor envíe el comprobante de transferencia o depósito legible a su asesor con su nombre y número de cotización o ficha.
                  </li>
                  <li>
                    Para pagos en <strong>Bolívares</strong>, consulte previamente la tasa oficial del día antes de emitir la transferencia.
                  </li>
                  <li>
                    En pagos vía <strong>Zelle</strong>, colocar en el concepto únicamente el nombre del pasajero titular o dejarlo en blanco.
                  </li>
                  <li>
                    La confirmación y emisión de vouchers o boletos se efectuará una vez acreditado el pago en cuenta.
                  </li>
                </ol>
              </div>

              {/* Bottom Watermark / Contact */}
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
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            backgroundColor: '#0f172a',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            💡 Puede descargar la imagen para enviarla directamente por WhatsApp o imprimir en PDF para clientes presenciales.
          </span>

          <button
            type="button"
            className="btn-form-cancel"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
