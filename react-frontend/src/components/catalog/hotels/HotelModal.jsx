import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import TarifaModal from './TarifaModal';
import axios from 'axios';

export default function HotelModal({ isOpen, onClose, onSaveSuccess, hotelToEdit = null, isFreelancer = false }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [isTarifaModalOpen, setIsTarifaModalOpen] = useState(false);
  const [activeHabitacionIndex, setActiveHabitacionIndex] = useState(0);

  // Step 1 Form
  const [hotelInfo, setHotelInfo] = useState({
    nombre: '',
    tipo: 'Todo Incluido',
    id_ubicacion: '',
    edad_adolescentes_desde: '12',
    edad_adolescentes_hasta: '17',
    edad_ninos_desde: '5',
    edad_ninos_hasta: '11',
    edad_infantes_desde: '0',
    edad_infantes_hasta: '4',
    nota: '',
    incluye_descuento: false,
    desc_contado_status: false,
    desc_contado_monto: '',
    desc_divisas_status: false,
    desc_divisas_monto: '',
  });

  // Step 2 Rooms & Rates
  const [habitaciones, setHabitaciones] = useState([
    {
      habitacion: 'Doble',
      cantidad_personas: 2,
      minimo_noches: 1,
      posicion: 1,
      por_defecto: true,
      nota: '',
      tarifas: []
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      fetchUbicaciones();

      if (hotelToEdit) {
        setHotelInfo({
          nombre: hotelToEdit.nombre || '',
          tipo: hotelToEdit.tipo || 'Todo Incluido',
          id_ubicacion: hotelToEdit.id_ubicacion || '',
          edad_adolescentes_desde: '12',
          edad_adolescentes_hasta: '17',
          edad_ninos_desde: '5',
          edad_ninos_hasta: '11',
          edad_infantes_desde: '0',
          edad_infantes_hasta: '4',
          nota: hotelToEdit.nota || '',
          incluye_descuento: false,
          desc_contado_status: false,
          desc_contado_monto: '',
          desc_divisas_status: false,
          desc_divisas_monto: '',
        });
      } else {
        setHotelInfo({
          nombre: '',
          tipo: 'Todo Incluido',
          id_ubicacion: '',
          edad_adolescentes_desde: '12',
          edad_adolescentes_hasta: '17',
          edad_ninos_desde: '5',
          edad_ninos_hasta: '11',
          edad_infantes_desde: '0',
          edad_infantes_hasta: '4',
          nota: '',
          incluye_descuento: false,
          desc_contado_status: false,
          desc_contado_monto: '',
          desc_divisas_status: false,
          desc_divisas_monto: '',
        });
        setHabitaciones([
          {
            habitacion: 'Doble',
            cantidad_personas: 2,
            minimo_noches: 1,
            posicion: 1,
            por_defecto: true,
            nota: '',
            tarifas: []
          }
        ]);
      }
    }
  }, [isOpen, hotelToEdit]);

  const fetchUbicaciones = async () => {
    try {
      const res = await axios.get('/v1/catalog/ubicaciones');
      setUbicaciones(res.data.data || []);
      if (!hotelInfo.id_ubicacion && res.data.data && res.data.data.length > 0) {
        setHotelInfo(prev => ({ ...prev, id_ubicacion: res.data.data[0].id }));
      }
    } catch (err) {
      console.error('Error cargando ubicaciones', err);
    }
  };

  const handleAddRoom = () => {
    const newIndex = habitaciones.length + 1;
    setHabitaciones(prev => [
      ...prev,
      {
        habitacion: `Habitación ${newIndex}`,
        cantidad_personas: 2,
        minimo_noches: 1,
        posicion: newIndex,
        por_defecto: false,
        nota: '',
        tarifas: []
      }
    ]);
    setActiveHabitacionIndex(habitaciones.length);
  };

  const handleAddTarifaToActiveRoom = (newTarifa) => {
    setHabitaciones(prev => {
      const updated = [...prev];
      updated[activeHabitacionIndex].tarifas.push(newTarifa);
      return updated;
    });
  };

  const handleSaveHotel = async () => {
    try {
      const payload = {
        nombre: hotelInfo.nombre,
        tipo: hotelInfo.tipo,
        id_ubicacion: hotelInfo.id_ubicacion,
        edad_adolescentes: `${hotelInfo.edad_adolescentes_desde} - ${hotelInfo.edad_adolescentes_hasta} Años`,
        edad_ninos: `${hotelInfo.edad_ninos_desde} - ${hotelInfo.edad_ninos_hasta} Años`,
        edad_infantes: `${hotelInfo.edad_infantes_desde} - ${hotelInfo.edad_infantes_hasta} Años`,
        nota: hotelInfo.nota,
        status: true,
        habitaciones: habitaciones.map(h => ({
          habitacion: h.habitacion,
          cantidad_personas: h.cantidad_personas,
          minimo_noches: h.minimo_noches,
          posicion: h.posicion,
          por_defecto: h.por_defecto,
          tarifas: h.tarifas
        })),
        reglas: hotelInfo.incluye_descuento ? [
          {
            descuento_status: hotelInfo.desc_contado_status,
            descuento_monto: parseFloat(hotelInfo.desc_contado_monto) || 0,
            aumento_bolivares: hotelInfo.desc_divisas_status,
            aumento_bolivares_porcentaje: parseFloat(hotelInfo.desc_divisas_monto) || 0,
          }
        ] : []
      };

      if (hotelToEdit) {
        await axios.put(`/v1/catalog/hoteles/${hotelToEdit.id}`, payload);
      } else {
        await axios.post('/v1/catalog/hoteles', payload);
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el hotel. Verifique los campos requeridos.');
    }
  };

  const currentHabitacion = habitaciones[activeHabitacionIndex] || habitaciones[0];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        steps={['Información del hotel', 'Información de habitación y tarifas']}
        currentStep={currentStep}
        width="750px"
      >
        {/* PASO 1: Información del Hotel */}
        {currentStep === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '14px' }}>
              <div>
                <label className="erp-label">Nombre: <span className="req">*</span></label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="Nombre del hotel"
                  value={hotelInfo.nombre}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="erp-label">Tipo: <span className="req">*</span></label>
                <select
                  className="erp-select"
                  value={hotelInfo.tipo}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, tipo: e.target.value })}
                >
                  <option value="Todo Incluido">Todo Incluido</option>
                  <option value="Pensión Completa">Pensión Completa</option>
                  <option value="Media Pensión">Media Pensión</option>
                  <option value="Solo Desayuno">Solo Desayuno</option>
                </select>
              </div>
            </div>

            {/* Age Brackets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label className="erp-label">Edad Adolescentes</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="erp-input"
                    value={hotelInfo.edad_adolescentes_desde}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, edad_adolescentes_desde: e.target.value })}
                  />
                  <span>-</span>
                  <input
                    type="text"
                    className="erp-input"
                    value={hotelInfo.edad_adolescentes_hasta}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, edad_adolescentes_hasta: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="erp-label">Edad Niños <span className="req">*</span></label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="erp-input"
                    value={hotelInfo.edad_ninos_desde}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, edad_ninos_desde: e.target.value })}
                  />
                  <span>-</span>
                  <input
                    type="text"
                    className="erp-input"
                    value={hotelInfo.edad_ninos_hasta}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, edad_ninos_hasta: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="erp-label">Edad Infantes <span className="req">*</span></label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="erp-input"
                    value={hotelInfo.edad_infantes_desde}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, edad_infantes_desde: e.target.value })}
                  />
                  <span>-</span>
                  <input
                    type="text"
                    className="erp-input"
                    value={hotelInfo.edad_infantes_hasta}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, edad_infantes_hasta: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Ubicación & Notas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="erp-label">Ubicación: <span className="req">*</span></label>
                <select
                  className="erp-select"
                  value={hotelInfo.id_ubicacion}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, id_ubicacion: e.target.value })}
                >
                  {ubicaciones.map(u => (
                    <option key={u.id} value={u.id}>{u.ubicacion}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="erp-label">Nota (opcional)</label>
                <textarea
                  className="erp-input"
                  style={{ height: '38px', resize: 'none' }}
                  placeholder="Observación..."
                  value={hotelInfo.nota}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, nota: e.target.value })}
                />
              </div>
            </div>

            {/* Descuentos Toggle (Página 4 y 5) */}
            <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <span className="erp-label" style={{ margin: 0, fontSize: '0.8125rem' }}>¿Incluye Descuento?</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="descuento"
                    checked={hotelInfo.incluye_descuento === true}
                    onChange={() => setHotelInfo({ ...hotelInfo, incluye_descuento: true })}
                  />
                  <span>Sí</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="descuento"
                    checked={hotelInfo.incluye_descuento === false}
                    onChange={() => setHotelInfo({ ...hotelInfo, incluye_descuento: false })}
                  />
                  <span>No</span>
                </label>
              </div>

              {hotelInfo.incluye_descuento && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="erp-label">Desc. Al contado:</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        className="erp-select"
                        value={hotelInfo.desc_contado_status ? '1' : '0'}
                        onChange={(e) => setHotelInfo({ ...hotelInfo, desc_contado_status: e.target.value === '1' })}
                      >
                        <option value="0">Inactivo</option>
                        <option value="1">Activo</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Ej.: 10%"
                        className="erp-input"
                        value={hotelInfo.desc_contado_monto}
                        onChange={(e) => setHotelInfo({ ...hotelInfo, desc_contado_monto: e.target.value })}
                        disabled={!hotelInfo.desc_contado_status}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="erp-label">Desc. Divisas:</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        className="erp-select"
                        value={hotelInfo.desc_divisas_status ? '1' : '0'}
                        onChange={(e) => setHotelInfo({ ...hotelInfo, desc_divisas_status: e.target.value === '1' })}
                      >
                        <option value="0">Inactivo</option>
                        <option value="1">Activo</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Ej.: 10%"
                        className="erp-input"
                        value={hotelInfo.desc_divisas_monto}
                        onChange={(e) => setHotelInfo({ ...hotelInfo, desc_divisas_monto: e.target.value })}
                        disabled={!hotelInfo.desc_divisas_status}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Actions Step 1 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (!hotelInfo.nombre) {
                    alert('Por favor ingrese el nombre del hotel.');
                    return;
                  }
                  setCurrentStep(2);
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Información de habitación y tarifas */}
        {currentStep === 2 && (
          <div>
            {/* Room Selector Tab */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
              {habitaciones.map((hab, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveHabitacionIndex(idx)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: activeHabitacionIndex === idx ? '1px solid #2563EB' : '1px solid rgba(255,255,255,0.1)',
                    background: activeHabitacionIndex === idx ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.05)',
                    color: activeHabitacionIndex === idx ? '#FFFFFF' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.8125rem'
                  }}
                >
                  {hab.habitacion || `Habitación ${idx + 1}`}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div>
                <label className="erp-label">Tipo de habitación: <span className="req">*</span></label>
                <input
                  type="text"
                  className="erp-input"
                  value={currentHabitacion?.habitacion || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHabitaciones(prev => {
                      const updated = [...prev];
                      updated[activeHabitacionIndex].habitacion = val;
                      return updated;
                    });
                  }}
                  required
                />
              </div>

              <div>
                <label className="erp-label">Posición:</label>
                <input
                  type="number"
                  className="erp-input"
                  value={currentHabitacion?.posicion || 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setHabitaciones(prev => {
                      const updated = [...prev];
                      updated[activeHabitacionIndex].posicion = val;
                      return updated;
                    });
                  }}
                />
              </div>

              <button
                type="button"
                className="btn-accent"
                onClick={() => setIsTarifaModalOpen(true)}
              >
                + Agregar Tarifa
              </button>
            </div>

            {/* Rates Table (Pages 11-15) */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '16px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: '#94A3B8' }}>Desde - Hasta</th>
                    <th style={{ padding: '8px 10px', color: '#94A3B8' }}>Precio Adulto</th>
                    <th style={{ padding: '8px 10px', color: '#94A3B8' }}>Precio Adolesc.</th>
                    <th style={{ padding: '8px 10px', color: '#94A3B8' }}>Precio Niño</th>
                    {!isFreelancer && <th style={{ padding: '8px 10px', color: '#94A3B8' }}>Costo Adulto</th>}
                    {!isFreelancer && <th style={{ padding: '8px 10px', color: '#94A3B8' }}>Costo Adolesc.</th>}
                    {!isFreelancer && <th style={{ padding: '8px 10px', color: '#94A3B8' }}>Costo Niño</th>}
                    <th style={{ padding: '8px 10px', color: '#94A3B8' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHabitacion?.tarifas && currentHabitacion.tarifas.length > 0 ? (
                    currentHabitacion.tarifas.map((tarifa, tIdx) => (
                      <tr key={tIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '8px 10px', color: '#F8FAFC' }}>
                          {tarifa.desde} al {tarifa.hasta}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#E87217', fontWeight: '600' }}>
                          {tarifa.precio_noche_adulto} {tarifa.moneda}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#F8FAFC' }}>
                          {tarifa.precio_noche_adolescente || '0.00'} {tarifa.moneda}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#F8FAFC' }}>
                          {tarifa.precio_noche_nino || '0.00'} {tarifa.moneda}
                        </td>
                        {!isFreelancer && (
                          <td style={{ padding: '8px 10px', color: '#94A3B8' }}>
                            {tarifa.costo_noche_adulto || '0.00'} {tarifa.moneda}
                          </td>
                        )}
                        {!isFreelancer && (
                          <td style={{ padding: '8px 10px', color: '#94A3B8' }}>
                            {tarifa.costo_noche_adolescente || '0.00'} {tarifa.moneda}
                          </td>
                        )}
                        {!isFreelancer && (
                          <td style={{ padding: '8px 10px', color: '#94A3B8' }}>
                            {tarifa.costo_noche_nino || '0.00'} {tarifa.moneda}
                          </td>
                        )}
                        <td style={{ padding: '8px 10px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setHabitaciones(prev => {
                                const updated = [...prev];
                                updated[activeHabitacionIndex].tarifas.splice(tIdx, 1);
                                return updated;
                              });
                            }}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isFreelancer ? 5 : 8} style={{ padding: '16px', textAlign: 'center', color: '#64748B' }}>
                        No hay tarifas registradas para esta habitación.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddRoom}
              style={{ marginBottom: '20px' }}
            >
              + Agregar Habitación
            </button>

            {/* Wizard Actions Step 2 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>
                Anterior
              </button>
              <button type="button" className="btn-primary" onClick={handleSaveHotel}>
                Guardar Hotel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sub-modal Crear Tarifa */}
      <TarifaModal
        isOpen={isTarifaModalOpen}
        onClose={() => setIsTarifaModalOpen(false)}
        onSave={handleAddTarifaToActiveRoom}
        isFreelancer={isFreelancer}
      />
    </>
  );
}
