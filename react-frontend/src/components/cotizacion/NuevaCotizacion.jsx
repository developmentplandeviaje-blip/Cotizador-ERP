import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import imgNuevaCotizacion from '../../assets/NuevaCotizacion.svg';
import imgSearch from '../../assets/lupa.svg';
import imgHoteles from '../../assets/Hoteles.svg';
import imgAerolineas from '../../assets/Aerolineas.svg';
import imgTraslados from '../../assets/Traslados.svg';
import imgExcursiones from '../../assets/Excursiones.svg';
import imgPaquetes from '../../assets/Paqueteria.svg';
import imgVehiculos from '../../assets/Vehiculos.svg';
import imgAgregar from '../../assets/Agregar.svg';
import Badge from '../common/Badge';

export default function NuevaCotizacion({ user }) {
  // Catalogs
  const [catalogos, setCatalogos] = useState({
    ubicaciones: [],
    hoteles: [],
    aerolineas: [],
    excursiones: [],
    paquetes: [],
    traslados: [],
    vehiculos: [],
    is_freelancer: false,
  });
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // General Trip Information
  const [pax, setPax] = useState({
    adultos: 2,
    adolescentes: 0,
    ninos: 0,
    infantes: 0,
  });
  const totalPax = pax.adultos + pax.adolescentes + pax.ninos + pax.infantes;

  const [fechasViaje, setFechasViaje] = useState({
    checkin: new Date().toISOString().split('T')[0],
    checkout: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
  });

  // Client Data (US-04)
  const [cliente, setCliente] = useState({
    tipo_documento: 'V',
    documento: '',
    nombres: '',
    apellidos: '',
    edad: '',
    telefono: '',
    correo: '',
  });
  const [searchingClient, setSearchingClient] = useState(false);
  const [clientStatusMsg, setClientStatusMsg] = useState(null);

  // Additional passengers list
  const [pasajeros, setPasajeros] = useState([]);

  // Referral Code (US-01)
  const [codigoReferido, setCodigoReferido] = useState('');
  const [validatingReferido, setValidatingReferido] = useState(false);
  const [referidoData, setReferidoData] = useState(null);
  const [referidoError, setReferidoError] = useState('');

  // Cart / Added Items
  const [items, setItems] = useState([]);

  // Active Service Tab for adding items
  const [activeTab, setActiveTab] = useState('hotel');

  // Form states for each service
  const [hotelForm, setHotelForm] = useState({
    id_ubicacion: '',
    id_hotel: '',
    id_habitacion: '',
    noches: 4,
    precio_noche_adulto: 0,
    precio_noche_adolescente: 0,
    precio_noche_nino: 0,
    costo_noche_adulto: 0,
    costo_noche_adolescente: 0,
    costo_noche_nino: 0,
  });

  const [vueloForm, setVueloForm] = useState({
    id_aerolinea: '',
    itinerario: '',
    fecha_vuelo: '',
    precio_adulto: 0,
    precio_nino: 0,
    precio_infante: 0,
    costo_adulto: 0,
    costo_nino: 0,
    costo_infante: 0,
  });

  const [trasladoForm, setTrasladoForm] = useState({
    id_traslado: '',
    fecha_traslado: '',
    precio: 0,
    costo: 0,
    observacion: '',
  });

  const [excursionForm, setExcursionForm] = useState({
    id_excursion: '',
    fecha: '',
    precio_adulto: 0,
    precio_nino: 0,
    costo_adulto: 0,
    costo_nino: 0,
  });

  const [paqueteForm, setPaqueteForm] = useState({
    id_paquete: '',
    fecha: '',
    precio_adulto: 0,
    precio_nino: 0,
    costo_adulto: 0,
    costo_nino: 0,
  });

  const [vehiculoForm, setVehiculoForm] = useState({
    id_vehiculo: '',
    desde: '',
    hasta: '',
    dias: 1,
    precio_unitario: 0,
    costo: 0,
    observacion: '',
  });

  const [ferryForm, setFerryForm] = useState({
    ruta: '',
    clase: 'Playa',
    itinerario: '',
    vehiculos: 0,
    precio_adulto: 0,
    precio_nino: 0,
    precio_infante: 0,
    precio_vehiculo: 0,
  });

  const [otroForm, setOtroForm] = useState({
    descripcion: '',
    fecha: '',
    costo: 0,
    precio: 0,
  });

  // Installment Plan
  const [enableCuotas, setEnableCuotas] = useState(false);
  const [cuotasConfig, setCuotasConfig] = useState({
    modo: 'monto', // 'monto' o 'porcentaje'
    valor_inicial: 0,
    numero_cuotas: 3,
  });

  // General observations & discount
  const [descuentoAdicional, setDescuentoAdicional] = useState(0);
  const [observacion, setObservacion] = useState('');

  // Submit / Result state
  const [submitting, setSubmitting] = useState(false);
  const [submittingRapida, setSubmittingRapida] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message, data }

  // Exchange rate referential VES
  const tasaReferencialVES = 62.50;

  // Load Catalogs on mount
  useEffect(() => {
    async function loadData() {
      setLoadingCatalogs(true);
      try {
        const res = await axios.get('/v1/cotizaciones/catalogos');
        setCatalogos(res.data);
      } catch (err) {
        console.error('Error cargando catálogos para cotizar:', err);
      } finally {
        setLoadingCatalogs(false);
      }
    }
    loadData();
  }, []);

  // Update dates in hotel and forms when general dates change
  useEffect(() => {
    if (fechasViaje.checkin && fechasViaje.checkout) {
      const d1 = new Date(fechasViaje.checkin);
      const d2 = new Date(fechasViaje.checkout);
      const diffTime = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
      setHotelForm(prev => ({ ...prev, noches: diffTime }));
    }
  }, [fechasViaje.checkin, fechasViaje.checkout]);

  // Lookup client (US-04)
  const handleBuscarCliente = async () => {
    const doc = cliente.documento.trim();
    if (!doc) {
      setClientStatusMsg({ type: 'warning', text: 'Ingrese un número de documento para buscar.' });
      return;
    }
    setSearchingClient(true);
    setClientStatusMsg(null);
    try {
      const res = await axios.get(`/v1/cotizaciones/cliente/${encodeURIComponent(doc)}`);
      if (res.data.encontrado && res.data.cliente) {
        const c = res.data.cliente;
        setCliente({
          tipo_documento: c.tipo_documento || 'V',
          documento: c.documento || doc,
          nombres: c.nombres || '',
          apellidos: c.apellidos || '',
          edad: c.edad || '',
          telefono: c.telefono || '',
          correo: c.correo || '',
        });
        setClientStatusMsg({ type: 'success', text: `¡Cliente encontrado: ${c.nombres} ${c.apellidos}!` });
      }
    } catch (err) {
      setClientStatusMsg({ type: 'info', text: 'Cliente no registrado. Puede ingresar los datos para registrarlo.' });
    } finally {
      setSearchingClient(false);
    }
  };

  // Validate Referral Code (US-01)
  const handleValidarReferido = async () => {
    const code = codigoReferido.trim();
    if (!code) return;
    setValidatingReferido(true);
    setReferidoError('');
    try {
      const res = await axios.post('/v1/cotizaciones/validar-referido', { codigo: code });
      if (res.data.valido) {
        setReferidoData(res.data.data);
      }
    } catch (err) {
      setReferidoData(null);
      setReferidoError(err.response?.data?.errors?.codigo?.[0] || 'El código de referido no existe o se encuentra inactivo.');
    } finally {
      setValidatingReferido(false);
    }
  };

  const handleQuitarReferido = () => {
    setCodigoReferido('');
    setReferidoData(null);
    setReferidoError('');
  };

  // Sync companions count when total pax increases
  useEffect(() => {
    const needed = Math.max(0, totalPax - 1);
    setPasajeros(prev => {
      if (prev.length === needed) return prev;
      if (prev.length < needed) {
        const added = Array.from({ length: needed - prev.length }, (_, i) => ({
          nombres: '',
          apellidos: '',
          documento: '',
          tipo_documento: 'V',
        }));
        return [...prev, ...added];
      }
      return prev.slice(0, needed);
    });
  }, [totalPax]);

  const handleUpdatePasajero = (index, field, val) => {
    setPasajeros(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Hotels cascading dropdown
  const filteredHoteles = useMemo(() => {
    if (!hotelForm.id_ubicacion) return catalogos.hoteles || [];
    return (catalogos.hoteles || []).filter(h => String(h.id_ubicacion) === String(hotelForm.id_ubicacion));
  }, [catalogos.hoteles, hotelForm.id_ubicacion]);

  const selectedHotel = useMemo(() => {
    return (catalogos.hoteles || []).find(h => String(h.id) === String(hotelForm.id_hotel));
  }, [catalogos.hoteles, hotelForm.id_hotel]);

  const selectedHabitacion = useMemo(() => {
    if (!selectedHotel?.habitaciones) return null;
    return selectedHotel.habitaciones.find(hab => String(hab.id) === String(hotelForm.id_habitacion));
  }, [selectedHotel, hotelForm.id_habitacion]);

  // When room changes, preload rates if available
  useEffect(() => {
    if (selectedHabitacion?.tarifas?.length > 0) {
      const t = selectedHabitacion.tarifas[0];
      setHotelForm(prev => ({
        ...prev,
        precio_noche_adulto: Number(t.precio_noche_adulto || 0),
        precio_noche_adolescente: Number(t.precio_noche_adolescente || 0),
        precio_noche_nino: Number(t.precio_noche_nino || 0),
        costo_noche_adulto: Number(t.costo_noche_adulto || 0),
        costo_noche_adolescente: Number(t.costo_noche_adolescente || 0),
        costo_noche_nino: Number(t.costo_noche_nino || 0),
      }));
    }
  }, [selectedHabitacion]);

  // Add Item to cart
  const handleAddItem = (tipo) => {
    let newItem = null;
    const uid = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    if (tipo === 'hotel') {
      if (!hotelForm.id_hotel) {
        alert('Seleccione un hotel');
        return;
      }
      const hotelObj = selectedHotel || {};
      const habObj = selectedHabitacion || {};
      const subtotalAdultos = pax.adultos * hotelForm.precio_noche_adulto * hotelForm.noches;
      const subtotalAdol = pax.adolescentes * hotelForm.precio_noche_adolescente * hotelForm.noches;
      const subtotalNinos = pax.ninos * hotelForm.precio_noche_nino * hotelForm.noches;
      const totalItem = subtotalAdultos + subtotalAdol + subtotalNinos;

      newItem = {
        uid,
        tipo: 'hotel',
        titulo: `Hotel: ${hotelObj.nombre || 'Hotel'} (${habObj.habitacion || 'Habitación'})`,
        detalle: `${hotelForm.noches} noches • ${pax.adultos} adultos, ${pax.adolescentes} adol, ${pax.ninos} niños`,
        precio: totalItem,
        data: {
          id_hotel: Number(hotelForm.id_hotel),
          id_habitacion: Number(hotelForm.id_habitacion || 0),
          noches: Number(hotelForm.noches),
          adultos: pax.adultos,
          adolescente: pax.adolescentes,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio_noche_adulto: hotelForm.precio_noche_adulto,
          precio_noche_adolescente: hotelForm.precio_noche_adolescente,
          precio_noche_nino: hotelForm.precio_noche_nino,
          costo_noche_adulto: hotelForm.costo_noche_adulto,
          costo_noche_adolescente: hotelForm.costo_noche_adolescente,
          costo_noche_nino: hotelForm.costo_noche_nino,
          fecha_checkin: fechasViaje.checkin,
          fecha_checkout: fechasViaje.checkout,
        },
      };
    } else if (tipo === 'vuelo') {
      if (!vueloForm.id_aerolinea) {
        alert('Seleccione una aerolínea');
        return;
      }
      const aeroObj = (catalogos.aerolineas || []).find(a => String(a.id) === String(vueloForm.id_aerolinea)) || {};
      const totalItem = (pax.adultos * vueloForm.precio_adulto) + (pax.ninos * vueloForm.precio_nino) + (pax.infantes * vueloForm.precio_infante);

      newItem = {
        uid,
        tipo: 'vuelo',
        titulo: `Vuelo: ${aeroObj.nombre || 'Aerolínea'} - ${vueloForm.itinerario || 'Ruta'}`,
        detalle: `Fecha: ${vueloForm.fecha_vuelo || 'Por definir'} • ${pax.adultos} ad, ${pax.ninos} niños, ${pax.infantes} inf`,
        precio: totalItem,
        data: {
          id_aerolinea: Number(vueloForm.id_aerolinea),
          itinerario: vueloForm.itinerario,
          fecha_vuelo: vueloForm.fecha_vuelo,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio_adulto: vueloForm.precio_adulto,
          precio_nino: vueloForm.precio_nino,
          precio_infante: vueloForm.precio_infante,
          costo_adulto: vueloForm.costo_adulto,
          costo_nino: vueloForm.costo_nino,
          costo_infante: vueloForm.costo_infante,
        },
      };
    } else if (tipo === 'traslado') {
      const trasObj = (catalogos.traslados || []).find(t => String(t.id) === String(trasladoForm.id_traslado)) || {};
      newItem = {
        uid,
        tipo: 'traslado',
        titulo: `Traslado: ${trasObj.ruta_origen || 'Servicio de Traslado'}`,
        detalle: `Fecha: ${trasladoForm.fecha_traslado || 'Por definir'} • Obs: ${trasladoForm.observacion || 'Ninguna'}`,
        precio: Number(trasladoForm.precio || trasObj.precio_publico || 0),
        data: {
          id_traslado: Number(trasladoForm.id_traslado || 1),
          fecha_traslado: trasladoForm.fecha_traslado,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio_historico: Number(trasladoForm.precio || trasObj.precio_publico || 0),
          costo_historico: Number(trasladoForm.costo || trasObj.costo || 0),
          observacion: trasladoForm.observacion,
        },
      };
    } else if (tipo === 'excursion') {
      const excObj = (catalogos.excursiones || []).find(e => String(e.id) === String(excursionForm.id_excursion)) || {};
      const totalItem = (pax.adultos * excursionForm.precio_adulto) + (pax.ninos * excursionForm.precio_nino);
      newItem = {
        uid,
        tipo: 'excursion',
        titulo: `Excursión: ${excObj.tipo_excursion || 'Excursión'}`,
        detalle: `Fecha: ${excursionForm.fecha || 'Por definir'} • ${pax.adultos} ad, ${pax.ninos} niños`,
        precio: totalItem,
        data: {
          id_excursion: Number(excursionForm.id_excursion),
          fecha: excursionForm.fecha,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio_adulto: excursionForm.precio_adulto,
          precio_nino: excursionForm.precio_nino,
          costo_adulto: excursionForm.costo_adulto,
          costo_nino: excursionForm.costo_nino,
        },
      };
    } else if (tipo === 'paquete') {
      const paqObj = (catalogos.paquetes || []).find(p => String(p.id) === String(paqueteForm.id_paquete)) || {};
      const totalItem = (pax.adultos * paqueteForm.precio_adulto) + (pax.ninos * paqueteForm.precio_nino);
      newItem = {
        uid,
        tipo: 'paquete',
        titulo: `Paquete: ${paqObj.paquete || 'Paquete Turístico'}`,
        detalle: `Fecha: ${paqueteForm.fecha || 'Por definir'} • ${pax.adultos} ad, ${pax.ninos} niños`,
        precio: totalItem,
        data: {
          id_paquete: Number(paqueteForm.id_paquete),
          fecha: paqueteForm.fecha,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio_adulto: paqueteForm.precio_adulto,
          precio_nino: paqueteForm.precio_nino,
          costo_adulto: paqueteForm.costo_adulto,
          costo_nino: paqueteForm.costo_nino,
        },
      };
    } else if (tipo === 'vehiculo') {
      const vehObj = (catalogos.vehiculos || []).find(v => String(v.id) === String(vehiculoForm.id_vehiculo)) || {};
      const totalItem = Number(vehiculoForm.dias || 1) * Number(vehiculoForm.precio_unitario || 0);
      newItem = {
        uid,
        tipo: 'vehiculo',
        titulo: `Vehículo: ${vehObj.marca || 'Vehículo'} ${vehObj.modelo || ''}`,
        detalle: `${vehiculoForm.dias} días • Desde: ${vehiculoForm.desde} hasta: ${vehiculoForm.hasta}`,
        precio: totalItem,
        data: {
          id_vehiculo: Number(vehiculoForm.id_vehiculo),
          desde: vehiculoForm.desde,
          hasta: vehiculoForm.hasta,
          dias: Number(vehiculoForm.dias),
          precio_unitario: Number(vehiculoForm.precio_unitario),
          costo: Number(vehiculoForm.costo),
          observacion: vehiculoForm.observacion,
        },
      };
    } else if (tipo === 'ferry') {
      const totalItem = (pax.adultos * ferryForm.precio_adulto) + (pax.ninos * ferryForm.precio_nino) + (ferryForm.vehiculos * ferryForm.precio_vehiculo);
      newItem = {
        uid,
        tipo: 'ferry',
        titulo: `Ferry: ${ferryForm.ruta || 'Ruta'} (${ferryForm.clase})`,
        detalle: `${pax.adultos} ad, ${pax.ninos} niños, ${ferryForm.vehiculos} veh • Itinerario: ${ferryForm.itinerario}`,
        precio: totalItem,
        data: {
          ruta: ferryForm.ruta,
          clase: ferryForm.clase,
          itinerario: ferryForm.itinerario,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          vehiculos: Number(ferryForm.vehiculos),
          precio_adulto: ferryForm.precio_adulto,
          precio_nino: ferryForm.precio_nino,
          precio_infante: ferryForm.precio_infante,
          precio_vehiculo: ferryForm.precio_vehiculo,
        },
      };
    } else if (tipo === 'otro') {
      newItem = {
        uid,
        tipo: 'otro',
        titulo: `Otro: ${otroForm.descripcion || 'Servicio Personalizado'}`,
        detalle: `Fecha: ${otroForm.fecha || 'Por definir'}`,
        precio: Number(otroForm.precio || 0),
        data: {
          descripcion: otroForm.descripcion,
          fecha: otroForm.fecha,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio: Number(otroForm.precio || 0),
          costo: Number(otroForm.costo || 0),
        },
      };
    }

    if (newItem) {
      setItems(prev => [...prev, newItem]);
    }
  };

  const handleRemoveItem = (uid) => {
    setItems(prev => prev.filter(item => item.uid !== uid));
  };

  const handleClearItems = () => {
    if (window.confirm('¿Está seguro de vaciar todos los productos agregados?')) {
      setItems([]);
    }
  };

  // Financial Computations
  const subtotalUSD = useMemo(() => {
    return items.reduce((acc, curr) => acc + Number(curr.precio || 0), 0);
  }, [items]);

  const descuentoReferidoMonto = 0.00; // Pasivo US-01
  const totalUSD = Math.max(0, subtotalUSD - descuentoReferidoMonto - Number(descuentoAdicional || 0));
  const totalVES = (totalUSD * tasaReferencialVES).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Installments calculation
  const cuotasCalculadas = useMemo(() => {
    if (!enableCuotas || totalUSD <= 0) return null;
    const n = Math.max(1, Math.min(12, Number(cuotasConfig.numero_cuotas || 1)));
    let inicial = 0;
    if (cuotasConfig.modo === 'porcentaje') {
      inicial = (totalUSD * Number(cuotasConfig.valor_inicial || 0)) / 100;
    } else {
      inicial = Number(cuotasConfig.valor_inicial || 0);
    }
    inicial = Math.min(totalUSD, Math.max(0, inicial));
    const restante = Math.max(0, totalUSD - inicial);
    const montoPorCuota = restante / n;

    return {
      montoInicial: inicial,
      montoRestante: restante,
      numeroCuotas: n,
      montoPorCuota: montoPorCuota,
    };
  }, [enableCuotas, totalUSD, cuotasConfig]);

  // Submit Formal Quote
  const handleSubmitCotizacion = async () => {
    if (!cliente.nombres.trim() || !cliente.documento.trim()) {
      alert('Por favor ingrese al menos el nombre y la cédula del cliente principal.');
      return;
    }
    if (items.length === 0) {
      alert('Debe agregar al menos un producto o servicio a la cotización.');
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      cliente: {
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        tipo_documento: cliente.tipo_documento,
        documento: cliente.documento,
        edad: Number(cliente.edad || 0),
        telefono: cliente.telefono,
        correo: cliente.correo,
      },
      pasajeros: pasajeros.filter(p => p.nombres.trim()),
      id_referidos: referidoData ? referidoData.id : null,
      checkin: fechasViaje.checkin,
      checkout: fechasViaje.checkout,
      tipo_pago: enableCuotas ? 'Cuotas' : 'Total',
      descuento_monto: Number(descuentoAdicional || 0),
      descuento_referidos_monto: descuentoReferidoMonto,
      observacion: observacion + (cuotasCalculadas ? ` | Plan de financiamiento: Inicial $${cuotasCalculadas.montoInicial.toFixed(2)} + ${cuotasCalculadas.numeroCuotas} cuotas de $${cuotasCalculadas.montoPorCuota.toFixed(2)}` : ''),
      hoteles: items.filter(i => i.tipo === 'hotel').map(i => i.data),
      vuelos: items.filter(i => i.tipo === 'vuelo').map(i => i.data),
      excursiones: items.filter(i => i.tipo === 'excursion').map(i => i.data),
      paquetes: items.filter(i => i.tipo === 'paquete').map(i => i.data),
      traslados: items.filter(i => i.tipo === 'traslado').map(i => i.data),
      vehiculos: items.filter(i => i.tipo === 'vehiculo').map(i => i.data),
      ferries: items.filter(i => i.tipo === 'ferry').map(i => i.data),
      otros: items.filter(i => i.tipo === 'otro').map(i => i.data),
    };

    try {
      const res = await axios.post('/v1/cotizaciones', payload);
      setFeedback({
        type: 'success',
        message: '¡Cotización registrada y guardada exitosamente!',
        data: res.data.cotizacion,
      });
      // Clear forms
      setItems([]);
      setDescuentoAdicional(0);
      setObservacion('');
    } catch (err) {
      console.error('Error creando cotización:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al persistir la cotización. Revise los datos requeridos.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Quick Quote
  const handleSubmitRapida = async () => {
    if (items.length === 0) {
      alert('Debe agregar al menos un producto para guardar como cotización rápida.');
      return;
    }

    setSubmittingRapida(true);
    setFeedback(null);

    const payload = {
      cliente: cliente.nombres ? `${cliente.nombres} ${cliente.apellidos} (${cliente.documento})` : 'Cliente Rápido',
      pax: pax,
      fechas: fechasViaje,
      referido: referidoData,
      items: items,
      total_estimado: totalUSD,
      observacion,
    };

    try {
      const res = await axios.post('/v1/cotizaciones/rapida', payload);
      setFeedback({
        type: 'success',
        message: '¡Cotización rápida guardada en borrador express!',
        data: { id: res.data.data.id, localizador: `RAP-${res.data.data.id}` },
      });
    } catch (err) {
      console.error('Error guardando cotización rápida:', err);
      setFeedback({
        type: 'error',
        message: 'Error al registrar la cotización rápida.',
      });
    } finally {
      setSubmittingRapida(false);
    }
  };

  if (loadingCatalogs) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
        <p style={{ fontSize: '1.125rem' }}>Cargando catálogo maestro de productos y servicios...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px 24px',
        background: 'rgba(30, 41, 59, 0.72)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(232, 114, 23, 0.2), rgba(37, 99, 235, 0.2))',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(232, 114, 23, 0.3)',
          }}>
            <img src={imgNuevaCotizacion} alt="Cotizador" style={{ width: '28px', height: '28px' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#FFFFFF' }}>
              Nueva Cotización
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
              Configuración de pasajeros, servicios multidestino y plan de pagos
            </p>
          </div>
        </div>

        {/* Pax Selector Header Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '8px 18px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Adultos</span>
            <input
              type="number"
              min="1"
              value={pax.adultos}
              onChange={e => setPax({ ...pax, adultos: Math.max(1, parseInt(e.target.value) || 1) })}
              style={{ width: '50px', background: 'transparent', border: 'none', color: '#FFF', fontWeight: '700', textAlign: 'center' }}
            />
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Adolescentes</span>
            <input
              type="number"
              min="0"
              value={pax.adolescentes}
              onChange={e => setPax({ ...pax, adolescentes: Math.max(0, parseInt(e.target.value) || 0) })}
              style={{ width: '50px', background: 'transparent', border: 'none', color: '#FFF', fontWeight: '700', textAlign: 'center' }}
            />
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Niños</span>
            <input
              type="number"
              min="0"
              value={pax.ninos}
              onChange={e => setPax({ ...pax, ninos: Math.max(0, parseInt(e.target.value) || 0) })}
              style={{ width: '50px', background: 'transparent', border: 'none', color: '#FFF', fontWeight: '700', textAlign: 'center' }}
            />
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Infantes</span>
            <input
              type="number"
              min="0"
              value={pax.infantes}
              onChange={e => setPax({ ...pax, infantes: Math.max(0, parseInt(e.target.value) || 0) })}
              style={{ width: '50px', background: 'transparent', border: 'none', color: '#FFF', fontWeight: '700', textAlign: 'center' }}
            />
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <Badge status="activo">{totalPax} Pax</Badge>
        </div>
      </div>

      {/* Success/Error Banner */}
      {feedback && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: feedback.type === 'success' ? '#10B981' : '#EF4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <strong>{feedback.message}</strong>
            {feedback.data?.localizador && (
              <span style={{ display: 'block', fontSize: '0.875rem', marginTop: '4px', color: '#E2E8F0' }}>
                Localizador Oficial: <strong>{feedback.data.localizador}</strong> | Ficha: #{feedback.data.numero_ficha || feedback.data.id}
              </span>
            )}
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Grid: 1. Cliente & Viaje (US-04 & US-01) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Card: Cliente Principal */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.72)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👤</span> Cliente Principal (Pasajero Titular)
          </h2>

          {/* Autocomplete Lookup Bar (US-04) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <select
              value={cliente.tipo_documento}
              onChange={e => setCliente({ ...cliente, tipo_documento: e.target.value })}
              style={{
                width: '70px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFF',
                borderRadius: '8px',
                padding: '8px',
              }}
            >
              <option value="V">V-</option>
              <option value="E">E-</option>
              <option value="J">J-</option>
              <option value="P">P-</option>
              <option value="G">G-</option>
            </select>
            <input
              type="text"
              placeholder="Número de Cédula / Documento..."
              value={cliente.documento}
              onChange={e => setCliente({ ...cliente, documento: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleBuscarCliente()}
              style={{
                flex: 1,
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFF',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            />
            <button
              onClick={handleBuscarCliente}
              disabled={searchingClient}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
              title="Buscar en base de datos"
            >
              <img src={imgSearch} alt="Buscar" style={{ width: '16px', height: '16px' }} />
              {searchingClient ? '...' : 'Buscar'}
            </button>
          </div>

          {clientStatusMsg && (
            <div style={{
              fontSize: '0.8125rem',
              marginBottom: '12px',
              padding: '6px 12px',
              borderRadius: '6px',
              color: clientStatusMsg.type === 'success' ? '#10B981' : clientStatusMsg.type === 'warning' ? '#F59E0B' : '#60A5FA',
              background: 'rgba(255,255,255,0.05)',
            }}>
              {clientStatusMsg.text}
            </div>
          )}

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Nombres *</label>
              <input
                type="text"
                value={cliente.nombres}
                onChange={e => setCliente({ ...cliente, nombres: e.target.value })}
                placeholder="Nombre(s)"
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Apellidos</label>
              <input
                type="text"
                value={cliente.apellidos}
                onChange={e => setCliente({ ...cliente, apellidos: e.target.value })}
                placeholder="Apellido(s)"
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Teléfono</label>
              <input
                type="text"
                value={cliente.telefono}
                onChange={e => setCliente({ ...cliente, telefono: e.target.value })}
                placeholder="+58 412 0000000"
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Correo Electrónico</label>
              <input
                type="email"
                value={cliente.correo}
                onChange={e => setCliente({ ...cliente, correo: e.target.value })}
                placeholder="cliente@correo.com"
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
              />
            </div>
          </div>
        </div>

        {/* Card: Fechas del Viaje & Código de Referido (US-01) */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.72)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🗓️</span> Fechas del Viaje & Promotor
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Fecha Check-in</label>
              <input
                type="date"
                value={fechasViaje.checkin}
                onChange={e => setFechasViaje({ ...fechasViaje, checkin: e.target.value })}
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Fecha Check-out</label>
              <input
                type="date"
                value={fechasViaje.checkout}
                onChange={e => setFechasViaje({ ...fechasViaje, checkout: e.target.value })}
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
              />
            </div>
          </div>

          {/* Referral Code (US-01) */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
              Código de Referido / Promotor (US-01)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ej. REF-2026-X"
                value={codigoReferido}
                disabled={!!referidoData}
                onChange={e => setCodigoReferido(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              />
              {!referidoData ? (
                <button
                  type="button"
                  onClick={handleValidarReferido}
                  disabled={validatingReferido || !codigoReferido.trim()}
                  className="btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  {validatingReferido ? 'Validando...' : 'Aplicar'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuitarReferido}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#EF4444',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                  }}
                >
                  Quitar
                </button>
              )}
            </div>

            {referidoData && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#10B981' }}>
                <span>✓ Promotor Asociado: <strong>{referidoData.nombre}</strong> ({referidoData.codigo})</span>
                <span style={{ color: '#94A3B8' }}>($0.00 descuento pasivo)</span>
              </div>
            )}

            {referidoError && (
              <div style={{ marginTop: '10px', fontSize: '0.8125rem', color: '#F59E0B' }}>
                ⚠️ {referidoError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accompanist / Companion Passengers (if > 1 pax) */}
      {pasajeros.length > 0 && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.72)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '1rem', color: '#FFF', margin: '0 0 12px 0' }}>
            👥 Pasajeros Acompañantes ({pasajeros.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {pasajeros.map((p, idx) => (
              <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#E87217', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Acompañante #{idx + 2}
                </span>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    placeholder="Nombres"
                    value={p.nombres}
                    onChange={e => handleUpdatePasajero(idx, 'nombres', e.target.value)}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '6px', padding: '6px' }}
                  />
                  <input
                    type="text"
                    placeholder="Apellidos"
                    value={p.apellidos}
                    onChange={e => handleUpdatePasajero(idx, 'apellidos', e.target.value)}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '6px', padding: '6px' }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cédula / Documento"
                  value={p.documento}
                  onChange={e => handleUpdatePasajero(idx, 'documento', e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '6px', padding: '6px' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Selector Dinámico de Productos (Hoteles, Vuelos, Traslados, Excursiones, etc.) */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.72)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: 0 }}>
            🛍️ Agregar Productos y Servicios al Viaje
          </h2>
          {catalogos.is_freelancer && (
            <Badge status="activo">Modalidad Freelancer (Costos Ocultos US-03)</Badge>
          )}
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { id: 'hotel', label: 'Hoteles', icon: imgHoteles },
            { id: 'vuelo', label: 'Vuelos', icon: imgAerolineas },
            { id: 'traslado', label: 'Traslados', icon: imgTraslados },
            { id: 'excursion', label: 'Excursiones', icon: imgExcursiones },
            { id: 'paquete', label: 'Paquetes', icon: imgPaquetes },
            { id: 'vehiculo', label: 'Vehículos', icon: imgVehiculos },
            { id: 'ferry', label: 'Ferries', icon: '⛴️' },
            { id: 'otro', label: 'Otros', icon: '➕' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #E87217' : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? 'rgba(232, 114, 23, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  color: isActive ? '#E87217' : '#94A3B8',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {typeof tab.icon === 'string' && !tab.icon.startsWith('data:') && !tab.icon.includes('/') && !tab.icon.includes('.') ? (
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{tab.icon}</span>
                ) : (
                  <img
                    src={tab.icon}
                    alt={tab.label}
                    style={{
                      width: '18px',
                      height: '18px',
                      objectFit: 'contain',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                    }}
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Form per Tab */}
        <div style={{ marginTop: '20px' }}>
          {/* TAB HOTEL */}
          {activeTab === 'hotel' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Destino / Ubicación</label>
                <select
                  value={hotelForm.id_ubicacion}
                  onChange={e => setHotelForm({ ...hotelForm, id_ubicacion: e.target.value, id_hotel: '', id_habitacion: '' })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                >
                  <option value="">Todas las ubicaciones</option>
                  {(catalogos.ubicaciones || []).map(u => (
                    <option key={u.id} value={u.id}>{u.ubicacion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Hotel</label>
                <select
                  value={hotelForm.id_hotel}
                  onChange={e => setHotelForm({ ...hotelForm, id_hotel: e.target.value, id_habitacion: '' })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                >
                  <option value="">Seleccione un hotel...</option>
                  {filteredHoteles.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Habitación</label>
                <select
                  value={hotelForm.id_habitacion}
                  onChange={e => setHotelForm({ ...hotelForm, id_habitacion: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                >
                  <option value="">Seleccione habitación...</option>
                  {(selectedHotel?.habitaciones || []).map(hab => (
                    <option key={hab.id} value={hab.id}>{hab.habitacion} (Cap: {hab.cantidad_personas})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Noches</label>
                <input
                  type="number"
                  min="1"
                  value={hotelForm.noches}
                  onChange={e => setHotelForm({ ...hotelForm, noches: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tarifa Adulto ($/noche)</label>
                <input
                  type="number"
                  step="0.01"
                  value={hotelForm.precio_noche_adulto}
                  onChange={e => setHotelForm({ ...hotelForm, precio_noche_adulto: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleAddItem('hotel')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
                  + Agregar Hotel
                </button>
              </div>
            </div>
          )}

          {/* TAB VUELO */}
          {activeTab === 'vuelo' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Aerolínea</label>
                <select
                  value={vueloForm.id_aerolinea}
                  onChange={e => setVueloForm({ ...vueloForm, id_aerolinea: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                >
                  <option value="">Seleccione aerolínea...</option>
                  {(catalogos.aerolineas || []).map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Itinerario (Ruta)</label>
                <input
                  type="text"
                  placeholder="Ej. CCS - PMV - CCS"
                  value={vueloForm.itinerario}
                  onChange={e => setVueloForm({ ...vueloForm, itinerario: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Fecha Vuelo</label>
                <input
                  type="datetime-local"
                  value={vueloForm.fecha_vuelo}
                  onChange={e => setVueloForm({ ...vueloForm, fecha_vuelo: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tarifa Adulto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={vueloForm.precio_adulto}
                  onChange={e => setVueloForm({ ...vueloForm, precio_adulto: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleAddItem('vuelo')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
                  + Agregar Vuelo
                </button>
              </div>
            </div>
          )}

          {/* TAB TRASLADO */}
          {activeTab === 'traslado' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Servicio de Traslado</label>
                <select
                  value={trasladoForm.id_traslado}
                  onChange={e => {
                    const id = e.target.value;
                    const found = (catalogos.traslados || []).find(t => String(t.id) === String(id));
                    setTrasladoForm({
                      ...trasladoForm,
                      id_traslado: id,
                      precio: found ? Number(found.precio_publico) : 0,
                    });
                  }}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                >
                  <option value="">Seleccione traslado...</option>
                  {(catalogos.traslados || []).map(t => (
                    <option key={t.id} value={t.id}>{t.ruta_origen} (${t.precio_publico})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Fecha y Hora</label>
                <input
                  type="datetime-local"
                  value={trasladoForm.fecha_traslado}
                  onChange={e => setTrasladoForm({ ...trasladoForm, fecha_traslado: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Precio Total ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={trasladoForm.precio}
                  onChange={e => setTrasladoForm({ ...trasladoForm, precio: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleAddItem('traslado')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
                  + Agregar Traslado
                </button>
              </div>
            </div>
          )}

          {/* TAB EXCURSIÓN */}
          {activeTab === 'excursion' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Excursión</label>
                <select
                  value={excursionForm.id_excursion}
                  onChange={e => {
                    const id = e.target.value;
                    const found = (catalogos.excursiones || []).find(ex => String(ex.id) === String(id));
                    setExcursionForm({
                      ...excursionForm,
                      id_excursion: id,
                      precio_adulto: found ? Number(found.precio_adulto) : 0,
                      precio_nino: found ? Number(found.precio_nino) : 0,
                    });
                  }}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                >
                  <option value="">Seleccione excursión...</option>
                  {(catalogos.excursiones || []).map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.tipo_excursion} (${ex.precio_adulto})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Fecha</label>
                <input
                  type="date"
                  value={excursionForm.fecha}
                  onChange={e => setExcursionForm({ ...excursionForm, fecha: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Precio Adulto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={excursionForm.precio_adulto}
                  onChange={e => setExcursionForm({ ...excursionForm, precio_adulto: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleAddItem('excursion')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
                  + Agregar Excursión
                </button>
              </div>
            </div>
          )}

          {/* TAB PAQUETE */}
          {activeTab === 'paquete' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Paquete Turístico</label>
                <select
                  value={paqueteForm.id_paquete}
                  onChange={e => {
                    const id = e.target.value;
                    const found = (catalogos.paquetes || []).find(p => String(p.id) === String(id));
                    setPaqueteForm({
                      ...paqueteForm,
                      id_paquete: id,
                      precio_adulto: found ? Number(found.precio_adulto) : 0,
                      precio_nino: found ? Number(found.precio_nino) : 0,
                    });
                  }}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                >
                  <option value="">Seleccione paquete...</option>
                  {(catalogos.paquetes || []).map(p => (
                    <option key={p.id} value={p.id}>{p.paquete} (${p.precio_adulto})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Fecha</label>
                <input
                  type="date"
                  value={paqueteForm.fecha}
                  onChange={e => setPaqueteForm({ ...paqueteForm, fecha: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Precio Adulto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paqueteForm.precio_adulto}
                  onChange={e => setPaqueteForm({ ...paqueteForm, precio_adulto: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleAddItem('paquete')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
                  + Agregar Paquete
                </button>
              </div>
            </div>
          )}

          {/* TAB VEHÍCULO */}
          {activeTab === 'vehiculo' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Vehículo</label>
                <select
                  value={vehiculoForm.id_vehiculo}
                  onChange={e => setVehiculoForm({ ...vehiculoForm, id_vehiculo: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                >
                  <option value="">Seleccione vehículo...</option>
                  {(catalogos.vehiculos || []).map(v => (
                    <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.categoria})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Días de Alquiler</label>
                <input
                  type="number"
                  min="1"
                  value={vehiculoForm.dias}
                  onChange={e => setVehiculoForm({ ...vehiculoForm, dias: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tarifa Diaria ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={vehiculoForm.precio_unitario}
                  onChange={e => setVehiculoForm({ ...vehiculoForm, precio_unitario: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleAddItem('vehiculo')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
                  + Agregar Vehículo
                </button>
              </div>
            </div>
          )}

          {/* TAB FERRY */}
          {activeTab === 'ferry' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Ruta</label>
                <input
                  type="text"
                  placeholder="Ej. Puerto La Cruz - Punta de Piedras"
                  value={ferryForm.ruta}
                  onChange={e => setFerryForm({ ...ferryForm, ruta: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tarifa Adulto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ferryForm.precio_adulto}
                  onChange={e => setFerryForm({ ...ferryForm, precio_adulto: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Vehículos adicionales ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ferryForm.precio_vehiculo}
                  onChange={e => setFerryForm({ ...ferryForm, precio_vehiculo: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleAddItem('ferry')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
                  + Agregar Ferry
                </button>
              </div>
            </div>
          )}

          {/* TAB OTRO */}
          {activeTab === 'otro' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Descripción del Servicio</label>
                <input
                  type="text"
                  placeholder="Ej. Seguro de Viaje, Asistencia Médica..."
                  value={otroForm.descripcion}
                  onChange={e => setOtroForm({ ...otroForm, descripcion: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Precio Venta ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={otroForm.precio}
                  onChange={e => setOtroForm({ ...otroForm, precio: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleAddItem('otro')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
                  + Agregar Servicio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Carrito de Productos Agregados */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.72)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: 0 }}>
            🛒 Resumen de Productos del Itinerario ({items.length})
          </h2>
          {items.length > 0 && (
            <button
              onClick={handleClearItems}
              style={{
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#EF4444',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
              }}
            >
              Vaciar Productos
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: '#94A3B8', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
            <p style={{ margin: 0 }}>No hay productos en esta cotización. Utilice las pestañas superiores para agregar servicios.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Tipo</th>
                  <th style={{ padding: '10px 12px' }}>Producto / Descripción</th>
                  <th style={{ padding: '10px 12px' }}>Detalles / Pax</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Monto (USD)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#FFF', fontSize: '0.875rem' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: '600', color: '#E87217' }}>{item.tipo}</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{item.titulo}</td>
                    <td style={{ padding: '12px', color: '#94A3B8', fontSize: '0.8125rem' }}>{item.detalle}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#10B981' }}>
                      ${Number(item.precio || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleRemoveItem(item.uid)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: 'none',
                          color: '#EF4444',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        title="Eliminar producto"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Plan de Cuotas & Resumen Financiero */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Card: Plan de Pagos por Cuotas */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.72)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: 0 }}>
              💳 Financiamiento / Cuotas
            </h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#94A3B8', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={enableCuotas}
                onChange={e => setEnableCuotas(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#E87217' }}
              />
              Habilitar Cuotas
            </label>
          </div>

          {enableCuotas ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Modo de Pago Inicial</label>
                  <select
                    value={cuotasConfig.modo}
                    onChange={e => setCuotasConfig({ ...cuotasConfig, modo: e.target.value })}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                  >
                    <option value="monto">Monto Fijo ($)</option>
                    <option value="porcentaje">Porcentaje (%)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {cuotasConfig.modo === 'monto' ? 'Monto Inicial ($)' : 'Porcentaje Inicial (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cuotasConfig.valor_inicial}
                    onChange={e => setCuotasConfig({ ...cuotasConfig, valor_inicial: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Número de Cuotas (1 a 12)</label>
                <select
                  value={cuotasConfig.numero_cuotas}
                  onChange={e => setCuotasConfig({ ...cuotasConfig, numero_cuotas: parseInt(e.target.value) || 1 })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px' }}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <option key={n} value={n}>{n} Cuotas mensuales</option>
                  ))}
                </select>
              </div>

              {cuotasCalculadas && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proyección Estimada:</span>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF' }}>
                      <span>Pago Inicial:</span>
                      <strong style={{ color: '#E87217' }}>${cuotasCalculadas.montoInicial.toFixed(2)} USD</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF' }}>
                      <span>Monto Financiado:</span>
                      <span>${cuotasCalculadas.montoRestante.toFixed(2)} USD</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                      <span>{cuotasCalculadas.numeroCuotas} cuotas iguales de:</span>
                      <strong style={{ color: '#10B981' }}>${cuotasCalculadas.montoPorCuota.toFixed(2)} USD</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '8px 0 0 0' }}>
              Pago único al contado. Active la casilla para configurar pagos fraccionados o financiamiento.
            </p>
          )}

          {/* Observations */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Observaciones del Itinerario</label>
            <textarea
              rows="3"
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              placeholder="Condiciones de pago, políticas de cancelación o peticiones especiales..."
              style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '8px', padding: '8px', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Card: Panel de Totales y Persistencia */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.72)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: '0 0 16px 0' }}>
              📊 Resumen Financiero
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.9375rem' }}>
                <span>Subtotal Servicios:</span>
                <span style={{ color: '#FFF', fontWeight: '600' }}>${subtotalUSD.toFixed(2)} USD</span>
              </div>

              {referidoData && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontSize: '0.9375rem' }}>
                  <span>Descuento Referido ({referidoData.codigo}):</span>
                  <span>-$0.00 USD</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Descuento Adicional ($):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={descuentoAdicional}
                  onChange={e => setDescuentoAdicional(parseFloat(e.target.value) || 0)}
                  style={{ width: '100px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: '6px', padding: '4px 8px', textAlign: 'right' }}
                />
              </div>

              <div style={{
                marginTop: '10px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}>
                <span style={{ fontSize: '1.125rem', color: '#FFF', fontWeight: '700' }}>Total a Pagar:</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#E87217' }}>
                    ${totalUSD.toFixed(2)} USD
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                    Bs. {totalVES} (Ref. BCV)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
            <button
              onClick={handleSubmitCotizacion}
              disabled={submitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '12px',
              }}
            >
              {submitting ? 'Creando Cotización Oficial...' : '💼 Crear Cotización Formal'}
            </button>

            <button
              onClick={handleSubmitRapida}
              disabled={submittingRapida}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(37, 99, 235, 0.2)',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                color: '#60A5FA',
                fontSize: '0.9375rem',
                fontWeight: '600',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              {submittingRapida ? 'Guardando Express...' : '⚡ Guardar Cotización Rápida'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
