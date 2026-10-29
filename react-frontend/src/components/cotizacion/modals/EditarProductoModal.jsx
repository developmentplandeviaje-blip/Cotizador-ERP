import { useState, useEffect, useMemo } from 'react';
import Modal from '../../common/Modal';
import Badge from '../../common/Badge';
import CustomSelect from '../../common/CustomSelect';
import CustomDatePicker from '../../common/CustomDatePicker';
import CustomNumberInput from '../../common/CustomNumberInput';
import { PRODUCT_COLOR_MAP } from '../NuevaCotizacion';
import { handlePriceInputKeyClamp, sanitizePrecioCostoValue } from '../../../utils/validation';
import HotelAsociadoSelect from '../HotelAsociadoSelect';

export default function EditarProductoModal({
  isOpen,
  item,
  catalogos = {},
  allPassengers = [],
  registeredHotels = [],
  onClose,
  onSave,
}) {
  if (!isOpen || !item) return null;

  const tipo = item.tipo || 'otro';
  const [formData, setFormData] = useState({});

  // Sync state when item changes
  useEffect(() => {
    if (item && item.data) {
      let initialTipoAsignacion = item.data.tipo_asignacion || 'todos';
      let obs = item.data.observacion || '';
      let obsBase = item.data.observacion_base !== undefined ? item.data.observacion_base : obs;
      if (!item.data.tipo_asignacion) {
        if (/^\[Individual:/i.test(obs)) initialTipoAsignacion = 'individual';
        else if (/^\[Grupo:/i.test(obs)) initialTipoAsignacion = 'grupo';
      }
      obsBase = obsBase.replace(/^\[(Individual|Grupo):.*?\]\s*/, '');

      setFormData({
        ...item.data,
        precio: item.precio || 0,
        hotel_item_uid: item.hotel_item_uid || item.data?.hotel_item_uid || '',
        hotel_item_uids: Array.isArray(item.hotel_item_uids)
          ? item.hotel_item_uids
          : (item.hotel_item_uid ? [item.hotel_item_uid] : []),
        tipo_asignacion: initialTipoAsignacion,
        pax_individual_id: item.data.pax_individual_id ?? 0,
        pax_seleccionados: item.data.pax_seleccionados || (allPassengers.length > 0 ? [allPassengers[0].id] : []),
        observacion: obsBase,
        observacion_base: obsBase,
        // Ensure default fallbacks
        adultos: item.data.adultos ?? 1,
        adolescente: item.data.adolescente ?? 0,
        ninos: item.data.ninos ?? 0,
        infantes: item.data.infantes ?? 0,
        noches: item.data.noches ?? 1,
        dias: item.data.dias ?? 1,
      });
    }
  }, [item, allPassengers]);

  // Selected hotel object from catalog
  const selectedHotel = useMemo(() => {
    if (tipo !== 'hotel') return null;
    return (catalogos.hoteles || []).find(h => String(h.id) === String(formData.id_hotel));
  }, [catalogos.hoteles, formData.id_hotel, tipo]);

  // Selected room
  const selectedHabitacion = useMemo(() => {
    if (!selectedHotel?.habitaciones) return null;
    return selectedHotel.habitaciones.find(hab => String(hab.id) === String(formData.id_habitacion));
  }, [selectedHotel, formData.id_habitacion]);

  // When room changes in modal, auto-update rates if available
  const handleHabitacionChange = (habId) => {
    const hab = (selectedHotel?.habitaciones || []).find(h => String(h.id) === String(habId));
    if (hab?.tarifas?.length > 0) {
      const t = hab.tarifas[0];
      setFormData(prev => ({
        ...prev,
        id_habitacion: habId,
        precio_noche_adulto: Number(t.precio_noche_adulto || 0),
        precio_noche_adolescente: Number(t.precio_noche_adolescente || 0),
        precio_noche_nino: Number(t.precio_noche_nino || 0),
        costo_noche_adulto: Number(t.costo_noche_adulto || 0),
        costo_noche_adolescente: Number(t.costo_noche_adolescente || 0),
        costo_noche_nino: Number(t.costo_noche_nino || 0),
      }));
    } else {
      setFormData(prev => ({ ...prev, id_habitacion: habId }));
    }
  };

  // Live total calculation based on service type
  const totalCalculado = useMemo(() => {
    const d = formData;
    if (tipo === 'hotel') {
      const subAdultos = Number(d.adultos || 0) * Number(d.precio_noche_adulto || 0) * Number(d.noches || 1);
      const subAdol = Number(d.adolescente || 0) * Number(d.precio_noche_adolescente || 0) * Number(d.noches || 1);
      const subNinos = Number(d.ninos || 0) * Number(d.precio_noche_nino || 0) * Number(d.noches || 1);
      return Math.max(0, subAdultos + subAdol + subNinos);
    }
    if (tipo === 'vuelo') {
      const subAd = Number(d.adultos || 0) * Number(d.precio_adulto || 0);
      const subNi = Number(d.ninos || 0) * Number(d.precio_nino || 0);
      const subInf = Number(d.infantes || 0) * Number(d.precio_infante || 0);
      return Math.max(0, subAd + subNi + subInf);
    }
    if (tipo === 'traslado') {
      return Math.max(0, Number(d.precio_historico || d.precio || 0));
    }
    if (tipo === 'excursion' || tipo === 'paquete') {
      const subAd = Number(d.adultos || 0) * Number(d.precio_adulto || 0);
      const subNi = Number(d.ninos || 0) * Number(d.precio_nino || 0);
      return Math.max(0, subAd + subNi);
    }
    if (tipo === 'vehiculo') {
      return Math.max(0, Number(d.dias || 1) * Number(d.precio_unitario || 0));
    }
    if (tipo === 'ferry') {
      const subAd = Number(d.adultos || 0) * Number(d.precio_adulto || 0);
      const subNi = Number(d.ninos || 0) * Number(d.precio_nino || 0);
      const subInf = Number(d.infantes || 0) * Number(d.precio_infante || 0);
      const subVeh = Number(d.vehiculos || 0) * Number(d.precio_vehiculo || 0);
      return Math.max(0, subAd + subNi + subInf + subVeh);
    }
    if (tipo === 'otro') {
      return Math.max(0, Number(d.precio || 0));
    }
    return Math.max(0, Number(d.precio || 0));
  }, [tipo, formData]);

  const handleSubmit = (e) => {
    e?.preventDefault();

    let updatedTitulo = item.titulo;
    let updatedDetalle = item.detalle;
    const finalData = { ...formData };

    if (tipo === 'hotel') {
      const hotelObj = (catalogos.hoteles || []).find(h => String(h.id) === String(formData.id_hotel)) || {};
      const habObj = (hotelObj.habitaciones || []).find(hab => String(hab.id) === String(formData.id_habitacion)) || {};
      updatedTitulo = `${hotelObj.nombre || item.titulo.split(' (')[0]} (${habObj.habitacion || 'Habitación'})`;
      updatedDetalle = `${formData.noches} noches • ${formData.adultos} adultos, ${formData.adolescente} adol, ${formData.ninos} niños`;
      finalData.id_hotel = Number(formData.id_hotel);
      finalData.id_habitacion = Number(formData.id_habitacion || 0);
      finalData.noches = Number(formData.noches);
      finalData.precio_noche_adulto = Number(formData.precio_noche_adulto || 0);
      finalData.precio_noche_adolescente = Number(formData.precio_noche_adolescente || 0);
      finalData.precio_noche_nino = Number(formData.precio_noche_nino || 0);
    } else if (tipo === 'vuelo') {
      const aeroObj = (catalogos.aerolineas || []).find(a => String(a.id) === String(formData.id_aerolinea)) || {};
      updatedTitulo = `${aeroObj.nombre || 'Aerolínea'} - ${formData.itinerario || 'Ruta'}`;
      updatedDetalle = `Fecha: ${formData.fecha_vuelo || 'Por definir'} • ${formData.adultos} ad${(formData.ninos || 0) > 0 ? `, ${formData.ninos} niños` : ''}${(formData.infantes || 0) > 0 ? `, ${formData.infantes} inf` : ''}`;
      finalData.id_aerolinea = Number(formData.id_aerolinea);
      finalData.precio_adulto = Number(formData.precio_adulto || 0);
      finalData.precio_nino = Number(formData.precio_nino || 0);
      finalData.precio_infante = Number(formData.precio_infante || 0);
    } else if (tipo === 'traslado') {
      const trasObj = (catalogos.traslados || []).find(t => String(t.id) === String(formData.id_traslado)) || {};
      let titulo = `${trasObj.ruta_origen || item.titulo || 'Servicio de Traslado'}`;
      let detallePax = allPassengers.length > 1 ? `Todos los pasajeros (${allPassengers.length} pax)` : '';
      let obsBase = formData.observacion ? formData.observacion.trim() : '';
      let obsFinal = obsBase;
      let adultosCount = formData.adultos || 1;

      if (allPassengers.length > 1) {
        if (formData.tipo_asignacion === 'individual') {
          const targetPax = allPassengers.find(p => p.id === Number(formData.pax_individual_id)) || allPassengers[0];
          const nombrePax = targetPax ? targetPax.nombreCorto : 'Individual';
          titulo += ` (Individual)`;
          detallePax = `Pasajero: ${nombrePax}`;
          obsFinal = `[Individual: ${nombrePax}] ${obsBase}`.trim();
          adultosCount = 1;
        } else if (formData.tipo_asignacion === 'grupo') {
          const selectedList = allPassengers.filter(p => (formData.pax_seleccionados || []).includes(p.id));
          const nombres = selectedList.map(p => p.nombreCorto).join(', ');
          titulo += ` (Grupo - ${selectedList.length} pax)`;
          detallePax = `Pasajeros (${selectedList.length}): ${nombres}`;
          obsFinal = `[Grupo: ${nombres}] ${obsBase}`.trim();
          adultosCount = selectedList.length || 1;
        }
      }

      updatedTitulo = titulo;
      updatedDetalle = `Fecha: ${formData.fecha_traslado || 'Por definir'}${detallePax ? ` • ${detallePax}` : ''}${obsBase ? ` • Obs: ${obsBase}` : ''}`;
      finalData.id_traslado = Number(formData.id_traslado || 1);
      finalData.adultos = adultosCount;
      finalData.precio_historico = totalCalculado;
      finalData.observacion = obsFinal;
      finalData.observacion_base = obsBase;
      finalData.tipo_asignacion = allPassengers.length > 1 ? formData.tipo_asignacion : 'todos';
      finalData.pax_individual_id = formData.pax_individual_id;
      finalData.pax_seleccionados = formData.pax_seleccionados;
    } else if (tipo === 'excursion') {
      const excObj = (catalogos.excursiones || []).find(e => String(e.id) === String(formData.id_excursion)) || {};
      updatedTitulo = `Excusión: ${excObj.tipo_excursion || item.titulo}`;
      updatedDetalle = `Fecha: ${formData.fecha || 'Por definir'} • ${formData.adultos} ad, ${formData.ninos} niños`;
      finalData.id_excursion = Number(formData.id_excursion);
      finalData.precio_adulto = Number(formData.precio_adulto || 0);
      finalData.precio_nino = Number(formData.precio_nino || 0);
    } else if (tipo === 'paquete') {
      const paqObj = (catalogos.paquetes || []).find(p => String(p.id) === String(formData.id_paquete)) || {};
      updatedTitulo = `Paquete: ${paqObj.paquete || item.titulo}`;
      updatedDetalle = `Fecha: ${formData.fecha || 'Por definir'} • ${formData.adultos} ad, ${formData.ninos} niños`;
      finalData.id_paquete = Number(formData.id_paquete);
      finalData.precio_adulto = Number(formData.precio_adulto || 0);
      finalData.precio_nino = Number(formData.precio_nino || 0);
    } else if (tipo === 'vehiculo') {
      const vehObj = (catalogos.vehiculos || []).find(v => String(v.id) === String(formData.id_vehiculo)) || {};
      updatedTitulo = `${vehObj.marca || 'Vehículo'} ${vehObj.modelo || ''}`;
      updatedDetalle = `${formData.dias} días • Desde: ${formData.desde || 'N/A'} hasta: ${formData.hasta || 'N/A'}`;
      finalData.id_vehiculo = Number(formData.id_vehiculo);
      finalData.dias = Number(formData.dias);
      finalData.precio_unitario = Number(formData.precio_unitario);
    } else if (tipo === 'ferry') {
      updatedTitulo = `${formData.ruta || 'Ruta'} (${formData.clase || 'Clase'})`;
      updatedDetalle = `${formData.adultos} ad${(formData.ninos || 0) > 0 ? `, ${formData.ninos} niños` : ''}${(formData.infantes || 0) > 0 ? `, ${formData.infantes} inf` : ''}, ${formData.vehiculos || 0} veh • Itinerario: ${formData.itinerario || 'N/A'}`;
      finalData.adultos = Number(formData.adultos || 1);
      finalData.ninos = Number(formData.ninos || 0);
      finalData.infantes = Number(formData.infantes || 0);
      finalData.vehiculos = Number(formData.vehiculos || 0);
      finalData.precio_adulto = Number(formData.precio_adulto || 0);
      finalData.precio_nino = Number(formData.precio_nino || 0);
      finalData.precio_infante = Number(formData.precio_infante || 0);
      finalData.precio_vehiculo = Number(formData.precio_vehiculo || 0);
    } else if (tipo === 'otro') {
      updatedTitulo = `Otro: ${formData.descripcion || 'Servicio Personalizado'}`;
      updatedDetalle = `Fecha: ${formData.fecha || 'Por definir'}`;
      finalData.precio = totalCalculado;
    }

    const updatedItem = {
      ...item,
      titulo: updatedTitulo,
      detalle: updatedDetalle,
      precio: totalCalculado,
      hotel_item_uid: tipo === 'hotel' ? item.hotel_item_uid : (formData.hotel_item_uid || null),
      hotel_item_uids: tipo === 'hotel' ? item.hotel_item_uids : (formData.hotel_item_uids || (formData.hotel_item_uid ? [formData.hotel_item_uid] : [])),
      data: {
        ...finalData,
        hotel_item_uid: tipo === 'hotel' ? item.data?.hotel_item_uid : (formData.hotel_item_uid || null),
        hotel_item_uids: tipo === 'hotel' ? item.data?.hotel_item_uids : (formData.hotel_item_uids || (formData.hotel_item_uid ? [formData.hotel_item_uid] : [])),
      },
    };

    onSave(updatedItem);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Producto: ${item.titulo || item.tipo}`}
      width="680px"
      zIndex={10000}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 24px 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge status="badge-primary">
              <span style={{ textTransform: 'capitalize', fontWeight: '700', color: PRODUCT_COLOR_MAP?.[tipo]?.color || '#E87217' }}>{tipo}</span>
            </Badge>
            <span style={{ color: '#E2E8F0', fontSize: '0.875rem' }}>{item.titulo}</span>
          </div>
          <span style={{ color: '#E87217', fontWeight: '700', fontSize: '1.125rem' }}>
            ${totalCalculado.toFixed(2)} USD
          </span>
        </div>

        {/* Agrupación a Hotel Registrado (si no es hotel) */}
        {tipo !== 'hotel' && registeredHotels.length > 0 && (
          <div style={{
            background: 'rgba(232, 114, 23, 0.08)',
            border: '1px solid rgba(232, 114, 23, 0.3)',
            borderRadius: '10px',
            padding: '12px 14px',
          }}>
            <label className="erp-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E87217', marginBottom: '6px' }}>
              <span>🏨</span> Agrupar este producto a Hotel(es) Registrado(s):
            </label>
            <HotelAsociadoSelect
              selectedHotelUids={formData.hotel_item_uids || (formData.hotel_item_uid ? [formData.hotel_item_uid] : [])}
              registeredHotels={registeredHotels}
              onChange={newUids => setFormData({
                ...formData,
                hotel_item_uids: newUids,
                hotel_item_uid: newUids[0] || null,
              })}
            />
          </div>
        )}

        {/* ==================== FORMULARIO HOTEL ==================== */}
        {tipo === 'hotel' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label className="erp-label">Hotel</label>
              <CustomSelect
                value={formData.id_hotel || ''}
                onChange={e => setFormData({ ...formData, id_hotel: e.target.value, id_habitacion: '' })}
                className="erp-select"
              >
                <option value="">Seleccione hotel...</option>
                {(catalogos.hoteles || []).map(h => (
                  <option key={h.id} value={h.id}>{h.nombre}</option>
                ))}
              </CustomSelect>
            </div>

            <div>
              <label className="erp-label">Habitación</label>
              <CustomSelect
                value={formData.id_habitacion || ''}
                onChange={e => handleHabitacionChange(e.target.value)}
                className="erp-select"
              >
                <option value="">Seleccione habitación...</option>
                {(selectedHotel?.habitaciones || []).map(hab => (
                  <option key={hab.id} value={hab.id}>{hab.habitacion}</option>
                ))}
              </CustomSelect>
            </div>

            <div>
              <label className="erp-label">Noches</label>
              <CustomNumberInput
                min={1}
                max={999}
                value={formData.noches || 1}
                onChange={e => setFormData({ ...formData, noches: Math.max(1, Math.min(999, parseInt(e.target.value) || 1)) })}
              />
            </div>

            <div>
              <label className="erp-label">Adultos</label>
              <CustomNumberInput
                min={1}
                max={999}
                value={formData.adultos ?? 1}
                onChange={e => setFormData({ ...formData, adultos: Math.max(1, Math.min(999, parseInt(e.target.value) || 1)) })}
              />
            </div>

            <div>
              <label className="erp-label">Adolescentes</label>
              <CustomNumberInput
                min={0}
                max={999}
                value={formData.adolescente ?? 0}
                onChange={e => setFormData({ ...formData, adolescente: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              />
            </div>

            <div>
              <label className="erp-label">Niños</label>
              <CustomNumberInput
                min={0}
                max={999}
                value={formData.ninos ?? 0}
                onChange={e => setFormData({ ...formData, ninos: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              />
            </div>

            <div>
              <label className="erp-label">Precio Noche Adulto ($)</label>
              <CustomNumberInput
                min={0}
                max={99999.99}
                step={0.01}
                allowDecimals
                width="115px"
                value={formData.precio_noche_adulto ?? 0}
                onChange={e => setFormData({ ...formData, precio_noche_adulto: sanitizePrecioCostoValue(e.target.value) })}
              />
            </div>

            {(formData.adolescente ?? 0) > 0 && (
              <div>
                <label className="erp-label">Precio Noche Adol ($)</label>
                <CustomNumberInput
                  min={0}
                  max={99999.99}
                  step={0.01}
                  allowDecimals
                  width="115px"
                  value={formData.precio_noche_adolescente ?? 0}
                  onChange={e => setFormData({ ...formData, precio_noche_adolescente: sanitizePrecioCostoValue(e.target.value) })}
                />
              </div>
            )}

            {(formData.ninos ?? 0) > 0 && (
              <div>
                <label className="erp-label">Precio Noche Niño ($)</label>
                <CustomNumberInput
                  min={0}
                  max={99999.99}
                  step={0.01}
                  allowDecimals
                  width="115px"
                  value={formData.precio_noche_nino ?? 0}
                  onChange={e => setFormData({ ...formData, precio_noche_nino: sanitizePrecioCostoValue(e.target.value) })}
                />
              </div>
            )}
          </div>
        )}

        {/* ==================== FORMULARIO VUELO ==================== */}
        {tipo === 'vuelo' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label className="erp-label">Aerolínea</label>
              <CustomSelect
                value={formData.id_aerolinea || ''}
                onChange={e => setFormData({ ...formData, id_aerolinea: e.target.value })}
                className="erp-select"
              >
                <option value="">Seleccione aerolínea...</option>
                {(catalogos.aerolineas || []).map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </CustomSelect>
            </div>

            <div>
              <label className="erp-label">Itinerario / Ruta</label>
              <input
                type="text"
                maxLength={100}
                value={formData.itinerario || ''}
                onChange={e => setFormData({ ...formData, itinerario: e.target.value.slice(0, 100) })}
                className="erp-input"
                placeholder="Ej. CCS - PMV / PMV - CCS"
              />
            </div>

            <div>
              <label className="erp-label">Fecha de Vuelo</label>
              <CustomDatePicker
                value={formData.fecha_vuelo || ''}
                onChange={e => setFormData({ ...formData, fecha_vuelo: e.target.value })}
              />
            </div>

            <div>
              <label className="erp-label">Adultos</label>
              <CustomNumberInput
                min={1}
                max={999}
                value={formData.adultos ?? 1}
                onChange={e => setFormData({ ...formData, adultos: Math.max(1, Math.min(999, parseInt(e.target.value) || 1)) })}
              />
            </div>

            <div>
              <label className="erp-label">Niños</label>
              <CustomNumberInput
                min={0}
                max={999}
                value={formData.ninos ?? 0}
                onChange={e => setFormData({ ...formData, ninos: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              />
            </div>

            <div>
              <label className="erp-label">Infantes</label>
              <CustomNumberInput
                min={0}
                max={999}
                value={formData.infantes ?? 0}
                onChange={e => setFormData({ ...formData, infantes: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              />
            </div>

            <div>
              <label className="erp-label">Precio Adulto ($)</label>
              <CustomNumberInput
                min={0}
                max={99999.99}
                step={0.01}
                allowDecimals
                width="115px"
                value={formData.precio_adulto ?? 0}
                onChange={e => setFormData({ ...formData, precio_adulto: sanitizePrecioCostoValue(e.target.value) })}
              />
            </div>

            {(formData.ninos ?? 0) > 0 && (
              <div>
                <label className="erp-label">Precio Niño ($)</label>
                <CustomNumberInput
                  min={0}
                  max={99999.99}
                  step={0.01}
                  allowDecimals
                  width="115px"
                  value={formData.precio_nino ?? 0}
                  onChange={e => setFormData({ ...formData, precio_nino: sanitizePrecioCostoValue(e.target.value) })}
                />
              </div>
            )}

            {(formData.infantes ?? 0) > 0 && (
              <div>
                <label className="erp-label">Precio Infante ($)</label>
                <CustomNumberInput
                  min={0}
                  max={99999.99}
                  step={0.01}
                  allowDecimals
                  width="115px"
                  value={formData.precio_infante ?? 0}
                  onChange={e => setFormData({ ...formData, precio_infante: sanitizePrecioCostoValue(e.target.value) })}
                />
              </div>
            )}
          </div>
        )}

        {/* ==================== FORMULARIO TRASLADO ==================== */}
        {tipo === 'traslado' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label className="erp-label">Servicio de Traslado</label>
                <CustomSelect
                  value={formData.id_traslado || ''}
                  onChange={e => setFormData({ ...formData, id_traslado: e.target.value })}
                  className="erp-select"
                >
                  <option value="">Seleccione traslado...</option>
                  {(catalogos.traslados || []).map(t => (
                    <option key={t.id} value={t.id}>{t.ruta_origen}</option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className="erp-label">Fecha y Hora de Traslado</label>
                <CustomDatePicker
                  type="datetime-local"
                  value={formData.fecha_traslado ? (formData.fecha_traslado.includes('T') ? formData.fecha_traslado : `${formData.fecha_traslado}T00:00`) : ''}
                  onChange={e => setFormData({ ...formData, fecha_traslado: e.target.value })}
                />
              </div>

              <div>
                <label className="erp-label">Precio Total ($)</label>
                <CustomNumberInput
                  min={0}
                  max={99999.99}
                  step={0.01}
                  allowDecimals
                  width="115px"
                  value={formData.precio_historico ?? formData.precio ?? 0}
                  onChange={e => {
                    const cleanVal = sanitizePrecioCostoValue(e.target.value);
                    setFormData({ ...formData, precio_historico: cleanVal, precio: cleanVal });
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="erp-label" style={{ margin: 0 }}>Observaciones</label>
                  <span style={{ fontSize: '0.75rem', color: (formData.observacion || '').length >= 300 ? '#EF4444' : '#b9c8ddff' }}>
                    {(formData.observacion || '').length} / 300 caracteres
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.observacion || ''}
                  onChange={e => setFormData({ ...formData, observacion: e.target.value.slice(0, 300) })}
                  maxLength={300}
                  className="erp-input"
                  placeholder="Detalles del traslado... (máx. 300 caracteres)"
                />
              </div>
            </div>

            {/* Personalización de Pasajeros si allPassengers > 1 */}
            {allPassengers.length > 1 && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                  <strong style={{ color: '#38BDF8', fontSize: '0.85rem' }}>
                    👥 Asignación de Pasajeros ({allPassengers.length} en viaje)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Personalice si este traslado es para todos, individual o grupo
                  </span>
                </div>

                {/* Botones de opción */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'todos', label: `Todos los pasajeros (${allPassengers.length})` },
                    { id: 'individual', label: 'Traslado Individual (1 pax)' },
                    { id: 'grupo', label: 'Subgrupo Personalizado' },
                  ].map(opt => {
                    const active = (formData.tipo_asignacion || 'todos') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tipo_asignacion: opt.id,
                            pax_individual_id: opt.id === 'individual' ? (prev.pax_individual_id ?? 0) : prev.pax_individual_id,
                            pax_seleccionados: opt.id === 'grupo' ? (prev.pax_seleccionados?.length ? prev.pax_seleccionados : [0, 1]) : prev.pax_seleccionados,
                          }));
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: active ? '1px solid #2563EB' : '1px solid rgba(255, 255, 255, 0.15)',
                          background: active ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          color: active ? '#FFF' : '#94A3B8',
                          fontSize: '0.78rem',
                          fontWeight: active ? '600' : '400',
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {formData.tipo_asignacion === 'todos' && (
                  <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                    ℹ️ Aplica para todos los {allPassengers.length} pasajeros registrados.
                  </div>
                )}

                {formData.tipo_asignacion === 'individual' && (
                  <div>
                    <label className="erp-label">Pasajero asignado a este traslado:</label>
                    <CustomSelect
                      value={formData.pax_individual_id ?? 0}
                      onChange={e => setFormData({ ...formData, pax_individual_id: Number(e.target.value) })}
                      className="erp-select"
                    >
                      {allPassengers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>
                )}

                {formData.tipo_asignacion === 'grupo' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="erp-label" style={{ margin: 0 }}>Pasajeros incluidos:</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, pax_seleccionados: allPassengers.map(p => p.id) })}
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#CBD5E1', fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, pax_seleccionados: [] })}
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#CBD5E1', fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
                      {allPassengers.map(p => {
                        const isChecked = (formData.pax_seleccionados || []).includes(p.id);
                        return (
                          <label
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              background: isChecked ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              border: isChecked ? '1px solid #2563EB' : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              color: isChecked ? '#FFF' : '#94A3B8',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setFormData(prev => {
                                  const curr = prev.pax_seleccionados || [];
                                  const next = curr.includes(p.id) ? curr.filter(x => x !== p.id) : [...curr, p.id];
                                  return { ...prev, pax_seleccionados: next };
                                });
                              }}
                              style={{ accentColor: '#2563EB' }}
                            />
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== FORMULARIO EXCURSIÓN O PAQUETE ==================== */}
        {(tipo === 'excursion' || tipo === 'paquete') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label className="erp-label">{tipo === 'excursion' ? 'Excusión' : 'Paquete'}</label>
              <CustomSelect
                value={tipo === 'excursion' ? (formData.id_excursion || '') : (formData.id_paquete || '')}
                onChange={e => {
                  if (tipo === 'excursion') {
                    setFormData({ ...formData, id_excursion: e.target.value });
                  } else {
                    setFormData({ ...formData, id_paquete: e.target.value });
                  }
                }}
                className="erp-select"
              >
                <option value="">Seleccione {tipo}...</option>
                {tipo === 'excursion'
                  ? (catalogos.excursiones || []).map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.tipo_excursion}</option>
                  ))
                  : (catalogos.paquetes || []).map(pq => (
                    <option key={pq.id} value={pq.id}>{pq.paquete}</option>
                  ))
                }
              </CustomSelect>
            </div>

            <div>
              <label className="erp-label">Fecha</label>
              <CustomDatePicker
                value={formData.fecha || ''}
                onChange={e => setFormData({ ...formData, fecha: e.target.value })}
              />
            </div>

            <div>
              <label className="erp-label">Adultos</label>
              <CustomNumberInput
                min={1}
                max={999}
                value={formData.adultos ?? 1}
                onChange={e => setFormData({ ...formData, adultos: Math.max(1, Math.min(999, parseInt(e.target.value) || 1)) })}
              />
            </div>

            <div>
              <label className="erp-label">Niños</label>
              <CustomNumberInput
                min={0}
                max={999}
                value={formData.ninos ?? 0}
                onChange={e => setFormData({ ...formData, ninos: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              />
            </div>

            <div>
              <label className="erp-label">Precio Adulto ($)</label>
              <CustomNumberInput
                min={0}
                max={99999.99}
                step={0.01}
                allowDecimals
                width="115px"
                value={formData.precio_adulto ?? 0}
                onChange={e => setFormData({ ...formData, precio_adulto: sanitizePrecioCostoValue(e.target.value) })}
              />
            </div>

            {(formData.ninos ?? 0) > 0 && (
              <div>
                <label className="erp-label">Precio Niño ($)</label>
                <CustomNumberInput
                  min={0}
                  max={99999.99}
                  step={0.01}
                  allowDecimals
                  width="115px"
                  value={formData.precio_nino ?? 0}
                  onChange={e => setFormData({ ...formData, precio_nino: sanitizePrecioCostoValue(e.target.value) })}
                />
              </div>
            )}
          </div>
        )}

        {/* ==================== FORMULARIO VEHÍCULO ==================== */}
        {tipo === 'vehiculo' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label className="erp-label">Vehículo</label>
              <CustomSelect
                value={formData.id_vehiculo || ''}
                onChange={e => setFormData({ ...formData, id_vehiculo: e.target.value })}
                className="erp-select"
              >
                <option value="">Seleccione vehículo...</option>
                {(catalogos.vehiculos || []).map(v => (
                  <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>
                ))}
              </CustomSelect>
            </div>

            <div>
              <label className="erp-label">Días de Alquiler</label>
              <CustomNumberInput
                min={1}
                max={999}
                value={formData.dias || 1}
                onChange={e => setFormData({ ...formData, dias: Math.max(1, Math.min(999, parseInt(e.target.value) || 1)) })}
              />
            </div>

            <div>
              <label className="erp-label">Precio por Día ($)</label>
              <CustomNumberInput
                min={0}
                max={99999.99}
                step={0.01}
                allowDecimals
                width="115px"
                value={formData.precio_unitario ?? 0}
                onChange={e => setFormData({ ...formData, precio_unitario: sanitizePrecioCostoValue(e.target.value) })}
              />
            </div>

            <div>
              <label className="erp-label">Fecha Desde</label>
              <CustomDatePicker
                value={formData.desde || ''}
                onChange={e => setFormData({ ...formData, desde: e.target.value })}
              />
            </div>

            <div>
              <label className="erp-label">Fecha Hasta</label>
              <CustomDatePicker
                value={formData.hasta || ''}
                onChange={e => setFormData({ ...formData, hasta: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="erp-label" style={{ margin: 0 }}>Observaciones</label>
                <span style={{ fontSize: '0.75rem', color: (formData.observacion || '').length >= 300 ? '#EF4444' : '#b9c8ddff' }}>
                  {(formData.observacion || '').length} / 300 caracteres
                </span>
              </div>
              <input
                type="text"
                value={formData.observacion || ''}
                onChange={e => setFormData({ ...formData, observacion: e.target.value.slice(0, 300) })}
                maxLength={300}
                className="erp-input"
                placeholder="Detalles del alquiler o vehículo... (máx. 300 caracteres)"
              />
            </div>
          </div>
        )}

        {/* ==================== FORMULARIO FERRY ==================== */}
        {tipo === 'ferry' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label className="erp-label">Ruta</label>
              <input
                type="text"
                maxLength={100}
                value={formData.ruta || ''}
                onChange={e => setFormData({ ...formData, ruta: e.target.value.slice(0, 100) })}
                className="erp-input"
              />
            </div>

            <div>
              <label className="erp-label">Clase</label>
              <input
                type="text"
                maxLength={50}
                value={formData.clase || ''}
                onChange={e => setFormData({ ...formData, clase: e.target.value.slice(0, 50) })}
                className="erp-input"
              />
            </div>

            <div>
              <label className="erp-label">Adultos</label>
              <CustomNumberInput
                min={0}
                max={999}
                value={formData.adultos ?? 0}
                onChange={e => setFormData({ ...formData, adultos: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              />
            </div>

            <div>
              <label className="erp-label">Niños</label>
              <CustomNumberInput
                min={0}
                max={999}
                value={formData.ninos ?? 0}
                onChange={e => setFormData({ ...formData, ninos: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              />
            </div>

            <div>
              <label className="erp-label">Infantes</label>
              <CustomNumberInput
                min={0}
                max={999}
                value={formData.infantes ?? 0}
                onChange={e => setFormData({ ...formData, infantes: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              />
            </div>

            <div>
              <label className="erp-label">Vehículos</label>
              <CustomNumberInput
                min={0}
                max={999}
                value={formData.vehiculos ?? 0}
                onChange={e => setFormData({ ...formData, vehiculos: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              />
            </div>

            <div>
              <label className="erp-label">Precio Adulto ($)</label>
              <CustomNumberInput
                min={0}
                max={99999.99}
                step={0.01}
                allowDecimals
                width="115px"
                value={formData.precio_adulto ?? 0}
                onChange={e => setFormData({ ...formData, precio_adulto: sanitizePrecioCostoValue(e.target.value) })}
              />
            </div>

            {(formData.ninos ?? 0) > 0 && (
              <div>
                <label className="erp-label">Precio Niño ($)</label>
                <CustomNumberInput
                  min={0}
                  max={99999.99}
                  step={0.01}
                  allowDecimals
                  width="115px"
                  value={formData.precio_nino ?? 0}
                  onChange={e => setFormData({ ...formData, precio_nino: sanitizePrecioCostoValue(e.target.value) })}
                />
              </div>
            )}

            {(formData.infantes ?? 0) > 0 && (
              <div>
                <label className="erp-label">Precio Infante ($)</label>
                <CustomNumberInput
                  min={0}
                  max={99999.99}
                  step={0.01}
                  allowDecimals
                  width="115px"
                  value={formData.precio_infante ?? 0}
                  onChange={e => setFormData({ ...formData, precio_infante: sanitizePrecioCostoValue(e.target.value) })}
                />
              </div>
            )}

            <div>
              <label className="erp-label">Precio Vehículo ($)</label>
              <CustomNumberInput
                min={0}
                max={99999.99}
                step={0.01}
                allowDecimals
                width="115px"
                value={formData.precio_vehiculo ?? 0}
                onChange={e => setFormData({ ...formData, precio_vehiculo: sanitizePrecioCostoValue(e.target.value) })}
              />
            </div>
          </div>
        )}

        {/* ==================== FORMULARIO OTRO ==================== */}
        {tipo === 'otro' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="erp-label" style={{ margin: 0 }}>Descripción del Servicio</label>
                <span style={{ fontSize: '0.75rem', color: (formData.descripcion || '').length >= 500 ? '#EF4444' : '#b9c8ddff' }}>
                  {(formData.descripcion || '').length} / 500 caracteres
                </span>
              </div>
              <input
                type="text"
                value={formData.descripcion || ''}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value.slice(0, 500) })}
                maxLength={500}
                className="erp-input"
                placeholder="Nombre o detalle del servicio... (máx. 500 caracteres)"
              />
            </div>

            <div>
              <label className="erp-label">Fecha</label>
              <CustomDatePicker
                value={formData.fecha || ''}
                onChange={e => setFormData({ ...formData, fecha: e.target.value })}
              />
            </div>

            <div>
              <label className="erp-label">Precio Venta ($)</label>
              <CustomNumberInput
                min={0}
                max={99999.99}
                step={0.01}
                allowDecimals
                width="115px"
                value={formData.precio ?? 0}
                onChange={e => setFormData({ ...formData, precio: sanitizePrecioCostoValue(e.target.value) })}
              />
            </div>
          </div>
        )}

        {/* ==================== ACCIONES DEL MODAL ==================== */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <button type="button" className="btn-form-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-form-nxt">
            Guardar Cambios
          </button>
        </div>
      </form>
    </Modal>
  );
}

