import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';

const LOGOS = [
  { value: '', label: 'Sin logo / Genérico' },
  { value: 'LOGO-BANESCO.png', label: 'Banesco' },
  { value: 'LOGO-BNC.png', label: 'Banco Nacional de Crédito (BNC)' },
  { value: 'logo-provincial.png', label: 'Banco Provincial' },
  { value: 'LOGO-VENEZUELA.png', label: 'Banco de Venezuela' },
  { value: 'LOGOMERCANTIL.png', label: 'Banco Mercantil' },
  { value: 'bancamiga3.png', label: 'Bancamiga' },
  { value: 'LOGO-ZELLE.png', label: 'Zelle' },
];

export default function MetodoPagoModal({ isOpen, onClose, onSave, metodoToEdit = null }) {
  const [currentStep, setCurrentStep] = useState(1); // 'general' | 'asesores'
  const [nombre, setNombre] = useState('');
  const [nombrePublico, setNombrePublico] = useState('');
  const [tipo, setTipo] = useState('banco');
  const [logo, setLogo] = useState('');
  const [status, setStatus] = useState(true);

  // Bank fields
  const [titular, setTitular] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('J');
  const [documento, setDocumento] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('Corriente');
  const [pagoMovilTelefono, setPagoMovilTelefono] = useState('');

  // Digital fields
  const [correoCuenta, setCorreoCuenta] = useState('');
  const [tipoComision, setTipoComision] = useState('porcentaje');
  const [comisionValor, setComisionValor] = useState(0);
  const [codigoPostal, setCodigoPostal] = useState('');
  const [direccionFacturacion, setDireccionFacturacion] = useState('');

  // Advisors state
  const [availableAsesores, setAvailableAsesores] = useState([]);
  const [selectedAsesores, setSelectedAsesores] = useState([]);
  const [loadingAsesores, setLoadingAsesores] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setErrors({});
      setCurrentStep(1);

      // Load agency users for advisor assignment
      setLoadingAsesores(true);
      axios
        .get('/v1/users/agencia', { params: { per_page: 100 } })
        .then((res) => {
          setAvailableAsesores(res.data.data || []);
        })
        .catch((err) => {
          console.error('Error cargando asesores:', err);
        })
        .finally(() => {
          setLoadingAsesores(false);
        });

      if (metodoToEdit) {
        setNombre(metodoToEdit.nombre || '');
        setNombrePublico(metodoToEdit.nombre_publico || '');
        setTipo(metodoToEdit.tipo || 'banco');
        setLogo(metodoToEdit.logo || '');
        setStatus(metodoToEdit.status !== undefined ? Boolean(metodoToEdit.status) : true);

        // Bank details
        setTitular(metodoToEdit.banco?.titular || '');
        setTipoDocumento(metodoToEdit.banco?.tipo_documento || 'J');
        setDocumento(metodoToEdit.banco?.documento || '');
        setNumeroCuenta(metodoToEdit.banco?.numero_cuenta || '');
        setTipoCuenta(metodoToEdit.banco?.tipo_cuenta || 'Corriente');
        setPagoMovilTelefono(metodoToEdit.banco?.pago_movil_telefono || '');

        // Digital details
        setCorreoCuenta(metodoToEdit.digital?.correo_cuenta || '');
        setTipoComision(metodoToEdit.digital?.tipo_comision || 'porcentaje');
        setComisionValor(metodoToEdit.digital?.comision_valor !== undefined ? metodoToEdit.digital.comision_valor : 0);
        setCodigoPostal(metodoToEdit.digital?.codigo_postal || '');
        setDireccionFacturacion(metodoToEdit.digital?.direccion_facturacion || '');

        // Assigned advisors
        if (Array.isArray(metodoToEdit.asesores)) {
          setSelectedAsesores(metodoToEdit.asesores.map((a) => a.id_asesor));
        } else {
          setSelectedAsesores([]);
        }
      } else {
        setNombre('');
        setNombrePublico('');
        setTipo('banco');
        setLogo('');
        setStatus(true);

        setTitular('');
        setTipoDocumento('J');
        setDocumento('');
        setNumeroCuenta('');
        setTipoCuenta('Corriente');
        setPagoMovilTelefono('');

        setCorreoCuenta('');
        setTipoComision('porcentaje');
        setComisionValor(0);
        setCodigoPostal('');
        setDireccionFacturacion('');

        setSelectedAsesores([]);
      }
    }
  }, [isOpen, metodoToEdit]);

  if (!isOpen) return null;

  const handleToggleAsesor = (asesorId) => {
    setSelectedAsesores((prev) =>
      prev.includes(asesorId) ? prev.filter((id) => id !== asesorId) : [...prev, asesorId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setErrors({});

    const payload = {
      nombre,
      nombre_publico: nombrePublico,
      tipo,
      logo: logo || null,
      status: status ? 1 : 0,
      asesores: selectedAsesores,
    };

    if (tipo === 'banco') {
      payload.titular = titular;
      payload.tipo_documento = tipoDocumento;
      payload.documento = documento;
      payload.numero_cuenta = numeroCuenta || null;
      payload.tipo_cuenta = tipoCuenta || null;
      payload.pago_movil_telefono = pagoMovilTelefono || null;
    } else if (tipo === 'digital') {
      payload.correo_cuenta = correoCuenta;
      payload.tipo_comision = tipoComision;
      payload.comision_valor = comisionValor === '' ? 0 : parseFloat(comisionValor);
      payload.codigo_postal = codigoPostal || null;
      payload.direccion_facturacion = direccionFacturacion || null;
    }

    try {
      if (metodoToEdit) {
        await axios.put(`/v1/finance/metodos-pago/${metodoToEdit.id}`, payload);
      } else {
        await axios.post('/v1/finance/metodos-pago', payload);
      }
      onSave();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
        setErrorMessage('Por favor revise los datos ingresados.');
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Ocurrió un error al guardar el método de pago.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={metodoToEdit ? 'Editar MǸtodo de Pago' : 'Nuevo MǸtodo de Pago'}
      steps={['Datos y Cuenta', 'Asesores Asignados']}
      currentStep={currentStep}
      width="720px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {errorMessage && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#FCA5A5',
                fontSize: '0.875rem',
              }}
            >
              {errorMessage}
            </div>
          )}

          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tipo de Método Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '8px' }}>
                  Categoría del Método <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    { id: 'banco', label: '🏦 Cuenta Bancaria' },
                    { id: 'digital', label: '💳 Pasarela / Digital' },
                    { id: 'efectivo', label: '💵 Efectivo' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTipo(opt.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: tipo === opt.id ? '2px solid #E87217' : '1px solid rgba(255,255,255,0.12)',
                        backgroundColor: tipo === opt.id ? 'rgba(232, 114, 23, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                        color: tipo === opt.id ? '#FFFFFF' : '#94A3B8',
                        fontWeight: tipo === opt.id ? 600 : 500,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre & Nombre Público */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                    Nombre Interno <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Banesco Cuenta Corriente"
                    className="erp-input"
                    style={{ width: '100%' }}
                  />
                  {errors.nombre && (
                    <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {errors.nombre[0]}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                    Nombre Público (Visible en Cotización) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombrePublico}
                    onChange={(e) => setNombrePublico(e.target.value)}
                    placeholder="Ej. Banesco Banco Universal (Bs.)"
                    className="erp-input"
                    style={{ width: '100%' }}
                  />
                  {errors.nombre_publico && (
                    <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {errors.nombre_publico[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Logo & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                    Logo Identificador
                  </label>
                  <select
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="erp-input"
                    style={{ width: '100%' }}
                  >
                    {LOGOS.map((lg) => (
                      <option key={lg.value} value={lg.value} style={{ backgroundColor: '#1E293B', color: '#FFF' }}>
                        {lg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                    Estado Operativo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#E87217', cursor: 'pointer' }}
                      />
                      <span>{status ? 'Habilitado para cobros' : 'Deshabilitado'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Conditional Section: BANCO */}
              {tipo === 'banco' && (
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#E87217', fontWeight: 600 }}>
                    🏦 Datos Bancarios y Pago Móvil
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Titular de la Cuenta <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={titular}
                        onChange={(e) => setTitular(e.target.value)}
                        placeholder="Viajes Plan de Viaje C.A."
                        className="erp-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Tipo Doc. <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={tipoDocumento}
                        onChange={(e) => setTipoDocumento(e.target.value)}
                        className="erp-input"
                        style={{ width: '100%' }}
                      >
                        {['J', 'V', 'E', 'G', 'Rif'].map((td) => (
                          <option key={td} value={td} style={{ backgroundColor: '#1E293B', color: '#FFF' }}>
                            {td}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Documento / RIF <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        placeholder="501234567"
                        className="erp-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Número de Cuenta (20 dígitos)
                      </label>
                      <input
                        type="text"
                        maxLength={20}
                        value={numeroCuenta}
                        onChange={(e) => setNumeroCuenta(e.target.value)}
                        placeholder="01340001000000123456"
                        className="erp-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Tipo de Cuenta
                      </label>
                      <select
                        value={tipoCuenta}
                        onChange={(e) => setTipoCuenta(e.target.value)}
                        className="erp-input"
                        style={{ width: '100%' }}
                      >
                        <option value="Corriente" style={{ backgroundColor: '#1E293B', color: '#FFF' }}>Corriente</option>
                        <option value="Ahorros" style={{ backgroundColor: '#1E293B', color: '#FFF' }}>Ahorros</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Teléfono Pago Móvil
                      </label>
                      <input
                        type="text"
                        value={pagoMovilTelefono}
                        onChange={(e) => setPagoMovilTelefono(e.target.value)}
                        placeholder="0414-1234567"
                        className="erp-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Section: DIGITAL */}
              {tipo === 'digital' && (
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#E87217', fontWeight: 600 }}>
                    💳 Configuración de Pasarela / Billetera Digital
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Correo Electrónico Asociado <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={correoCuenta}
                        onChange={(e) => setCorreoCuenta(e.target.value)}
                        placeholder="pagos@plandeviaje.com"
                        className="erp-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Tipo de Comisión
                      </label>
                      <select
                        value={tipoComision}
                        onChange={(e) => setTipoComision(e.target.value)}
                        className="erp-input"
                        style={{ width: '100%' }}
                      >
                        <option value="porcentaje" style={{ backgroundColor: '#1E293B', color: '#FFF' }}>Porcentaje (%)</option>
                        <option value="fijo" style={{ backgroundColor: '#1E293B', color: '#FFF' }}>Fijo ($)</option>
                        <option value="mixto" style={{ backgroundColor: '#1E293B', color: '#FFF' }}>Mixto</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Valor Comisión
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={comisionValor}
                        onChange={(e) => setComisionValor(e.target.value)}
                        className="erp-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Código Postal (ZIP)
                      </label>
                      <input
                        type="text"
                        value={codigoPostal}
                        onChange={(e) => setCodigoPostal(e.target.value)}
                        placeholder="33101"
                        className="erp-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px' }}>
                        Dirección de Facturación
                      </label>
                      <input
                        type="text"
                        value={direccionFacturacion}
                        onChange={(e) => setDireccionFacturacion(e.target.value)}
                        placeholder="Miami, FL, USA"
                        className="erp-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Section: EFECTIVO */}
              {tipo === 'efectivo' && (
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    color: '#94A3B8',
                    fontSize: '0.8125rem',
                  }}
                >
                  💵 <strong>Recepción en Efectivo:</strong> Este método no requiere número de cuenta bancaria ni correo de pasarela digital. Se emplea para pagos presenciales en taquilla u oficina comercial.
                </div>
              )}
            </div>
          )}

          {/* Tab: Asesores */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
                Seleccione los asesores y personal de la agencia autorizados para visualizar y emplear este método de pago:
              </p>

              {loadingAsesores ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                  Cargando lista de asesores...
                </div>
              ) : availableAsesores.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                  No hay asesores registrados en la agencia.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '10px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    padding: '4px',
                  }}
                >
                  {availableAsesores.map((asesor) => {
                    const isChecked = selectedAsesores.includes(asesor.id);
                    return (
                      <label
                        key={asesor.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: isChecked ? 'rgba(232, 114, 23, 0.12)' : 'rgba(15, 23, 42, 0.4)',
                          border: isChecked ? '1px solid rgba(232, 114, 23, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAsesor(asesor.id)}
                          style={{ width: '16px', height: '16px', accentColor: '#E87217', cursor: 'pointer' }}
                        />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {asesor.full_name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            {asesor.level}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '16px'
          }}
        >
          {currentStep === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-form-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-form-nxt"
                onClick={() => setCurrentStep(2)}
              >
                Siguiente
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-form-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-form-prv"
                onClick={() => setCurrentStep(1)}
                disabled={saving}
              >
                Anterior
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-form-nxt"
              >
                {saving ? 'Guardando...' : (metodoToEdit ? 'Actualizar Método' : 'Crear Método')}
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}