import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';
import CustomSelect from '../../common/CustomSelect';
import { showToast } from '../../../utils/toast';

export default function RegistrarPagoModal({ isOpen, onClose, venta, onSuccess }) {
  const [metodos, setMetodos] = useState([]);
  const [loadingMetodos, setLoadingMetodos] = useState(false);
  const [idMetodo, setIdMetodo] = useState('');
  const [tipoPago, setTipoPago] = useState('abono_cuota');
  const [monedaPago, setMonedaPago] = useState('USD');
  const [tasaCambio, setTasaCambio] = useState(1.0);
  const [montoOriginal, setMontoOriginal] = useState('');
  const [numeroTransaccion, setNumeroTransaccion] = useState('');
  const [quienEnvia, setQuienEnvia] = useState('');
  const [observacion, setObservacion] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar métodos de pago activos al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    setSubmitting(false);

    // Inicializar campos con datos de la venta
    const clienteNombre = venta?.cliente?.nombre_completo || '';
    setQuienEnvia(clienteNombre);
    setTipoPago('abono_cuota');
    setMonedaPago('USD');
    setTasaCambio(1.0);
    setMontoOriginal('');
    setNumeroTransaccion('');
    setObservacion('');

    setLoadingMetodos(true);
    axios
      .get('/v1/finance/metodos-pago', { params: { per_page: 100 } })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const active = list.filter((m) => m.status !== false);
        setMetodos(active);
        if (active.length > 0) {
          setIdMetodo(String(active[0].id));
        }
      })
      .catch((err) => {
        console.error('Error al cargar métodos de pago:', err);
        showToast.error('No se pudieron cargar los métodos de pago.');
      })
      .finally(() => {
        setLoadingMetodos(false);
      });
  }, [isOpen, venta]);

  // Si cambia a USD, forzar tasa 1.0. Si cambia a VES o EUR, sugerir tasa base si está en 1.0
  const handleMonedaChange = (nuevaMoneda) => {
    setMonedaPago(nuevaMoneda);
    if (nuevaMoneda === 'USD') {
      setTasaCambio(1.0);
    } else if (tasaCambio === 1.0) {
      // Tasa referencial por defecto para facilitar al usuario
      setTasaCambio(nuevaMoneda === 'VES' ? 45.0 : 1.08);
    }
  };

  // Cálculo en vivo del monto equivalente en USD
  const parsedMontoOriginal = parseFloat(montoOriginal) || 0;
  const parsedTasa = parseFloat(tasaCambio) || 1.0;

  const montoUSDCalculado = useMemo(() => {
    if (parsedMontoOriginal <= 0) return 0;
    if (monedaPago === 'USD') return parsedMontoOriginal;
    if (parsedTasa <= 0) return 0;
    return Math.round((parsedMontoOriginal / parsedTasa) * 100) / 100;
  }, [parsedMontoOriginal, parsedTasa, monedaPago]);

  const saldoPendiente = venta?.saldo_pendiente || 0;
  const nuevoSaldoPendiente = Math.max(0, Math.round((saldoPendiente - montoUSDCalculado) * 100) / 100);

  // Auto-completar monto para pagar la totalidad del saldo pendiente
  const handlePagarTodo = () => {
    if (saldoPendiente <= 0) return;
    setTipoPago('pago_total');
    if (monedaPago === 'USD') {
      setMontoOriginal(saldoPendiente.toFixed(2));
    } else {
      const equivalente = Math.round(saldoPendiente * parsedTasa * 100) / 100;
      setMontoOriginal(equivalente.toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!idMetodo) {
      setErrorMsg('Por favor seleccione un método de pago.');
      return;
    }

    if (parsedMontoOriginal <= 0) {
      setErrorMsg('El monto a abonar debe ser mayor a 0.');
      return;
    }

    if (monedaPago !== 'USD' && parsedTasa <= 0) {
      setErrorMsg('La tasa de cambio debe ser mayor a 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id_metodo: parseInt(idMetodo, 10),
        tipo_pago: tipoPago,
        moneda_pago: monedaPago,
        monto_original: parsedMontoOriginal,
        tasa_cambio: monedaPago === 'USD' ? 1.0 : parsedTasa,
        numero_transaccion: numeroTransaccion.trim() || undefined,
        quien_envia: quienEnvia.trim() || 'Cliente',
        observacion: observacion.trim() || undefined,
      };

      await axios.post(`/v1/ventas/${venta.id}/pagos`, payload);

      showToast.success(`Pago por $${montoUSDCalculado.toFixed(2)} USD registrado con éxito.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al registrar pago:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al registrar el pago.';
      setErrorMsg(msg);
      showToast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !venta) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Abono / Pago"
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Banner Resumen de Venta */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>
              Venta: <strong style={{ color: '#FFFFFF' }}>{venta.localizador}</strong> • Ficha #{venta.numero_ficha || venta.id}
            </div>
            <div style={{ fontSize: '0.925rem', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>
              {venta.cliente?.nombre_completo || 'Cliente General'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Total Venta</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#E87217' }}>
                ${Number(venta.total_usd || 0).toFixed(2)} USD
              </div>
            </div>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.15)' }} />

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Saldo Pendiente</div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: '800',
                  color: saldoPendiente > 0.01 ? '#F87171' : '#4ADE80',
                }}
              >
                ${Number(saldoPendiente).toFixed(2)} USD
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              fontSize: '0.85rem',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Fila 1: Método de Pago y Tipo de Pago */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
              Método de Pago <span style={{ color: '#EF4444' }}>*</span>
            </label>
            {loadingMetodos ? (
              <div style={{ padding: '8px', fontSize: '0.8rem', color: '#94A3B8' }}>Cargando métodos...</div>
            ) : (
              <CustomSelect
                value={idMetodo}
                onChange={(e) => setIdMetodo(e.target.value)}
                options={metodos.map((m) => ({
                  value: String(m.id),
                  label: `${m.nombre} (${m.tipo === 'banco' ? 'Bancario' : 'Digital'})`,
                }))}
                placeholder="Seleccione método"
                required
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
              Tipo de Pago
            </label>
            <CustomSelect
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value)}
              options={[
                { value: 'abono_cuota', label: 'Abono / Cuota Parcial' },
                { value: 'pago_inicial', label: 'Pago Inicial / Reserva' },
                { value: 'pago_total', label: 'Liquidación / Pago Total' },
              ]}
            />
          </div>
        </div>

        {/* Fila 2: Moneda, Tasa de Cambio y Monto */}
        <div style={{ display: 'grid', gridTemplateColumns: monedaPago === 'USD' ? '1fr 2fr' : '1fr 1fr 1.5fr', gap: '14px' }}>
          {/* Selector de Moneda */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
              Moneda
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['USD', 'VES', 'EUR'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonedaChange(m)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    borderRadius: '8px',
                    border: monedaPago === m ? '1px solid #E87217' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: monedaPago === m ? 'rgba(232, 114, 23, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: monedaPago === m ? '#E87217' : '#94A3B8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Tasa de Cambio (visible si no es USD) */}
          {monedaPago !== 'USD' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                Tasa de Cambio ({monedaPago}/USD)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={tasaCambio}
                onChange={(e) => setTasaCambio(e.target.value)}
                placeholder="Ej. 45.50"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          )}

          {/* Monto Original */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1' }}>
                Monto Original ({monedaPago}) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              {saldoPendiente > 0.01 && (
                <button
                  type="button"
                  onClick={handlePagarTodo}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38BDF8',
                    fontSize: '0.725rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Pagar todo el saldo
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={montoOriginal}
              onChange={(e) => setMontoOriginal(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>
        </div>

        {/* Tarjeta de Conversión en Tiempo Real */}
        <div
          style={{
            background: 'rgba(232, 114, 23, 0.08)',
            border: '1px solid rgba(232, 114, 23, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Abono Registrado (Equivalente USD):</span>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#4ADE80', marginTop: '2px' }}>
              ${montoUSDCalculado.toFixed(2)} USD
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Nuevo Saldo Restante:</span>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: nuevoSaldoPendiente <= 0 ? '#4ADE80' : '#FBBF24',
                marginTop: '2px',
              }}
            >
              ${nuevoSaldoPendiente.toFixed(2)} USD {nuevoSaldoPendiente <= 0 && '🎉 Liquidado'}
            </div>
          </div>
        </div>

        {/* Fila 3: Nº de Transacción y Quien Envía */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
              Nº Referencia / Transacción
            </label>
            <input
              type="text"
              value={numeroTransaccion}
              onChange={(e) => setNumeroTransaccion(e.target.value)}
              placeholder="Ej. TRX-982341"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
              Titular Emisor / Quién Envía
            </label>
            <input
              type="text"
              value={quienEnvia}
              onChange={(e) => setQuienEnvia(e.target.value)}
              placeholder="Nombre del pagador"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Fila 4: Observaciones */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
            Observaciones / Notas
          </label>
          <textarea
            rows="2"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Detalles adicionales sobre este abono..."
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Botones de Acción */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
            style={{ padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || parsedMontoOriginal <= 0}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              cursor: submitting || parsedMontoOriginal <= 0 ? 'not-allowed' : 'pointer',
              opacity: submitting || parsedMontoOriginal <= 0 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {submitting ? 'Procesando Pago...' : 'Registrar Pago'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
