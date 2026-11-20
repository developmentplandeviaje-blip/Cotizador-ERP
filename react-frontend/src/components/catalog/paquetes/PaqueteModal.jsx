import { useState, useEffect, useMemo } from 'react';
import Modal from '../../common/Modal';
import CustomSelect from '../../common/CustomSelect';
import CustomNumberInput from '../../common/CustomNumberInput';
import axios from 'axios';
import { handlePriceInputKeyClamp, formatPrecioCosto } from '../../../utils/validation';
import imgHoteles from '../../../assets/Hoteles.svg';
import imgAerolineas from '../../../assets/Aerolineas.svg';
import imgTraslados from '../../../assets/Traslados.svg';
import imgExcursiones from '../../../assets/Excursiones.svg';
import imgPaquetes from '../../../assets/Paqueteria.svg';
import imgVehiculos from '../../../assets/Vehiculos.svg';
import imgAgregar from '../../../assets/Agregar.svg';

const getProductIcon = (tipo) => {
  switch (tipo) {
    case 'hotel':
      return imgHoteles;
    case 'excursion':
      return imgExcursiones;
    case 'traslado':
      return imgTraslados;
    case 'vuelo':
      return imgAerolineas;
    case 'vehiculo':
      return imgVehiculos;
    default:
      return imgAgregar;
  }
};

export default function PaqueteModal({
  isOpen,
  onClose,
  onSaveSuccess,
  paqueteToEdit = null,
  initialMode = 'manual',
}) {
  const [modo, setModo] = useState('manual'); // 'manual' | 'builder'
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // Catálogos para el armador de paquetes
  const [catalogos, setCatalogos] = useState({
    hoteles: [],
    excursiones: [],
    traslados: [],
    aerolineas: [],
    vehiculos: [],
    ubicaciones: [],
  });
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Form fields comunes
  const [nombrePaquete, setNombrePaquete] = useState('');
  const [idUbicacion, setIdUbicacion] = useState('');

  // Adult pricing
  const [costoAdulto, setCostoAdulto] = useState('');
  const [porcentajeAdulto, setPorcentajeAdulto] = useState('');
  const [precioAdulto, setPrecioAdulto] = useState('');

  // Child pricing
  const [costoNino, setCostoNino] = useState('');
  const [porcentajeNino, setPorcentajeNino] = useState('');
  const [precioNino, setPrecioNino] = useState('');

  // Flags & states
  const [aplicaDescuentoReferidos, setAplicaDescuentoReferidos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // -------------------------------------------------------------
  // ESTADOS DEL ARMADOR DE PAQUETES (BUILDER)
  // -------------------------------------------------------------
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [builderCategory, setBuilderCategory] = useState('hotel'); // hotel | excursion | traslado | vuelo | vehiculo | otro

  // Sub-formulario: Hotel
  const [hotelId, setHotelId] = useState('');
  const [habitacionId, setHabitacionId] = useState('');
  const [hotelDias, setHotelDias] = useState(4);
  const [hotelNoches, setHotelNoches] = useState(3);
  const [hotelCostoNocheAdulto, setHotelCostoNocheAdulto] = useState('');
  const [hotelCostoNocheNino, setHotelCostoNocheNino] = useState('');

  // Sub-formulario: Excursión
  const [excursionId, setExcursionId] = useState('');
  const [excursionCostoAdulto, setExcursionCostoAdulto] = useState('');
  const [excursionCostoNino, setExcursionCostoNino] = useState('');

  // Sub-formulario: Traslado
  const [trasladoId, setTrasladoId] = useState('');
  const [trasladoCostoAdulto, setTrasladoCostoAdulto] = useState('');
  const [trasladoCostoNino, setTrasladoCostoNino] = useState('');

  // Sub-formulario: Vuelo
  const [aerolineaId, setAerolineaId] = useState('');
  const [vueloRuta, setVueloRuta] = useState('');
  const [vueloCostoAdulto, setVueloCostoAdulto] = useState('');
  const [vueloCostoNino, setVueloCostoNino] = useState('');

  // Sub-formulario: Vehículo
  const [vehiculoAgenciaId, setVehiculoAgenciaId] = useState('');
  const [vehiculoId, setVehiculoId] = useState('');
  const [vehiculoDias, setVehiculoDias] = useState(3);
  const [vehiculoCostoDia, setVehiculoCostoDia] = useState('');

  // Sub-formulario: Otro servicio
  const [otroTitulo, setOtroTitulo] = useState('');
  const [otroCostoAdulto, setOtroCostoAdulto] = useState('');
  const [otroCostoNino, setOtroCostoNino] = useState('');

  // Carga de catálogos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setLoadingUbicaciones(true);
      axios.get('/v1/catalog/ubicaciones?all=1')
        .then((res) => {
          setUbicaciones(res.data.data || []);
        })
        .catch((err) => {
          console.error('Error al cargar ubicaciones:', err);
        })
        .finally(() => {
          setLoadingUbicaciones(false);
        });

      setLoadingCatalogos(true);
      axios.get('/v1/cotizaciones/catalogos')
        .then((res) => {
          setCatalogos(res.data || {});
        })
        .catch((err) => {
          console.error('Error al cargar catálogos completos para armar paquetes:', err);
        })
        .finally(() => {
          setLoadingCatalogos(false);
        });
    }
  }, [isOpen]);

  // Sincronizar datos al abrir o cambiar de modo/paquete
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (paqueteToEdit) {
        setModo('manual');
        setNombrePaquete(paqueteToEdit.paquete || '');
        setIdUbicacion(paqueteToEdit.id_ubicacion || '');
        setCostoAdulto(paqueteToEdit.costo_adulto !== undefined ? String(paqueteToEdit.costo_adulto) : '');
        setPorcentajeAdulto(paqueteToEdit.porcentaje_adulto !== undefined && paqueteToEdit.porcentaje_adulto !== null ? String(paqueteToEdit.porcentaje_adulto) : '');
        setPrecioAdulto(paqueteToEdit.precio_adulto !== undefined ? String(paqueteToEdit.precio_adulto) : '');

        setCostoNino(paqueteToEdit.costo_nino !== undefined ? String(paqueteToEdit.costo_nino) : '');
        setPorcentajeNino(paqueteToEdit.porcentaje_nino !== undefined && paqueteToEdit.porcentaje_nino !== null ? String(paqueteToEdit.porcentaje_nino) : '');
        setPrecioNino(paqueteToEdit.precio_nino !== undefined ? String(paqueteToEdit.precio_nino) : '');

        setAplicaDescuentoReferidos(Boolean(paqueteToEdit.aplica_descuento_referidos));
        setSelectedProducts([]);
      } else {
        setModo(initialMode || 'manual');
        setNombrePaquete('');
        setIdUbicacion('');
        setCostoAdulto('');
        setPorcentajeAdulto('');
        setPrecioAdulto('');
        setCostoNino('');
        setPorcentajeNino('');
        setPrecioNino('');
        setAplicaDescuentoReferidos(false);
        setSelectedProducts([]);
        // Reset subformularios
        setHotelId('');
        setHabitacionId('');
        setHotelDias(4);
        setHotelNoches(3);
        setHotelCostoNocheAdulto('');
        setHotelCostoNocheNino('');
        setExcursionId('');
        setTrasladoId('');
        setAerolineaId('');
        setVueloRuta('');
        setVehiculoAgenciaId('');
        setVehiculoId('');
        setOtroTitulo('');
      }
    }
  }, [isOpen, paqueteToEdit, initialMode]);

  // -------------------------------------------------------------
  // CÁLCULO REACTIVO DEL TOTAL DE COSTOS NETOS EN MODO BUILDER
  // -------------------------------------------------------------
  const totalCostoNetoAdulto = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + (parseFloat(p.costo_adulto) || 0), 0);
  }, [selectedProducts]);

  const totalCostoNetoNino = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + (parseFloat(p.costo_nino) || 0), 0);
  }, [selectedProducts]);

  // En modo armador, los costos netos se sincronizan automáticamente con la suma de los productos
  useEffect(() => {
    if (modo === 'builder') {
      const cAdultoStr = totalCostoNetoAdulto.toFixed(2);
      const cNinoStr = totalCostoNetoNino.toFixed(2);
      setCostoAdulto(cAdultoStr);
      setCostoNino(cNinoStr);

      // Recalcular margen adulto si ya hay precio ingresado
      const pAdultoNum = parseFloat(precioAdulto);
      if (!isNaN(pAdultoNum) && totalCostoNetoAdulto > 0) {
        const marg = (((pAdultoNum - totalCostoNetoAdulto) / totalCostoNetoAdulto) * 100).toFixed(2);
        setPorcentajeAdulto(marg);
      } else if (totalCostoNetoAdulto === 0) {
        setPorcentajeAdulto('');
      }

      // Recalcular margen niño si ya hay precio ingresado
      const pNinoNum = parseFloat(precioNino);
      if (!isNaN(pNinoNum) && totalCostoNetoNino > 0) {
        const marg = (((pNinoNum - totalCostoNetoNino) / totalCostoNetoNino) * 100).toFixed(2);
        setPorcentajeNino(marg);
      } else if (totalCostoNetoNino === 0) {
        setPorcentajeNino('');
      }
    }
  }, [modo, totalCostoNetoAdulto, totalCostoNetoNino]);

  // -------------------------------------------------------------
  // REACCIONES DE PRECIO / MARGEN
  // -------------------------------------------------------------
  const handleCostoAdultoChange = (val) => {
    const clean = formatPrecioCosto(val);
    setCostoAdulto(clean);
    const cost = parseFloat(clean);
    const margin = parseFloat(porcentajeAdulto);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = Math.min(99999.99, Number((cost * (1 + margin / 100)).toFixed(2)));
      setPrecioAdulto(String(calculatedPrice));
    }
  };

  const handlePorcentajeAdultoChange = (val) => {
    setPorcentajeAdulto(val);
    const cost = parseFloat(costoAdulto);
    const margin = parseFloat(val);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = Math.min(99999.99, Number((cost * (1 + margin / 100)).toFixed(2)));
      setPrecioAdulto(String(calculatedPrice));
    }
  };

  const handlePrecioAdultoChange = (val) => {
    const clean = formatPrecioCosto(val);
    setPrecioAdulto(clean);
    const cost = parseFloat(costoAdulto);
    const price = parseFloat(clean);
    if (!isNaN(cost) && cost > 0 && !isNaN(price)) {
      const calculatedMargin = (((price - cost) / cost) * 100).toFixed(2);
      setPorcentajeAdulto(calculatedMargin);
    }
  };

  const handleCostoNinoChange = (val) => {
    const clean = formatPrecioCosto(val);
    setCostoNino(clean);
    const cost = parseFloat(clean);
    const margin = parseFloat(porcentajeNino);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = Math.min(99999.99, Number((cost * (1 + margin / 100)).toFixed(2)));
      setPrecioNino(String(calculatedPrice));
    }
  };

  const handlePorcentajeNinoChange = (val) => {
    setPorcentajeNino(val);
    const cost = parseFloat(costoNino);
    const margin = parseFloat(val);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = Math.min(99999.99, Number((cost * (1 + margin / 100)).toFixed(2)));
      setPrecioNino(String(calculatedPrice));
    }
  };

  const handlePrecioNinoChange = (val) => {
    const clean = formatPrecioCosto(val);
    setPrecioNino(clean);
    const cost = parseFloat(costoNino);
    const price = parseFloat(clean);
    if (!isNaN(cost) && cost > 0 && !isNaN(price)) {
      const calculatedMargin = (((price - cost) / cost) * 100).toFixed(2);
      setPorcentajeNino(calculatedMargin);
    }
  };

  // -------------------------------------------------------------
  // MANEJADORES PARA AGREGAR PRODUCTOS EN EL BUILDER
  // -------------------------------------------------------------

  // Hotel seleccionado y habitación seleccionada
  const selectedHotelObj = useMemo(() => {
    return (catalogos.hoteles || []).find((h) => String(h.id) === String(hotelId));
  }, [catalogos.hoteles, hotelId]);

  const selectedHabitacionObj = useMemo(() => {
    return selectedHotelObj?.habitaciones?.find((hab) => String(hab.id) === String(habitacionId));
  }, [selectedHotelObj, habitacionId]);

  // Agencias de Vehículos y Vehículos disponibles para el constructor de paquetes
  const agenciasVehiculoBuilder = useMemo(() => {
    if (catalogos.vehiculo_agencias && catalogos.vehiculo_agencias.length > 0) {
      return catalogos.vehiculo_agencias;
    }
    const map = new Map();
    (catalogos.vehiculos || []).forEach(v => {
      const agId = v.id_vehiculo_agencia || v.agencia?.id;
      const agNombre = v.agencia?.agencia || v.nombre_agencia;
      const ubiNombre = v.agencia?.ubicacion?.ubicacion || v.nombre_ubicacion;
      if (agId && agNombre && !map.has(agId)) {
        map.set(agId, {
          id: agId,
          agencia: agNombre,
          nombre_ubicacion: ubiNombre,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.agencia || '').localeCompare(b.agencia || ''));
  }, [catalogos.vehiculo_agencias, catalogos.vehiculos]);

  const availableVehiculosBuilder = useMemo(() => {
    if (!vehiculoAgenciaId) return [];
    return (catalogos.vehiculos || []).filter(v => String(v.id_vehiculo_agencia || v.agencia?.id) === String(vehiculoAgenciaId));
  }, [catalogos.vehiculos, vehiculoAgenciaId]);

  // Al cambiar de habitación, auto-cargar costos por noche
  useEffect(() => {
    if (selectedHabitacionObj) {
      const t = selectedHabitacionObj.tarifas?.[0];
      if (t) {
        setHotelCostoNocheAdulto(t.costo_noche_adulto !== undefined && t.costo_noche_adulto !== null ? String(t.costo_noche_adulto) : '0');
        setHotelCostoNocheNino(t.costo_noche_nino !== undefined && t.costo_noche_nino !== null ? String(t.costo_noche_nino) : '0');
      } else {
        setHotelCostoNocheAdulto('0');
        setHotelCostoNocheNino('0');
      }
    }
  }, [selectedHabitacionObj]);

  const handleAddHotel = () => {
    if (!selectedHotelObj || !selectedHabitacionObj) return;

    const nDias = parseInt(hotelDias, 10) || 1;
    const nNoches = parseInt(hotelNoches, 10) || 1;
    const cAdultoNoche = parseFloat(hotelCostoNocheAdulto) || 0;
    const cNinoNoche = parseFloat(hotelCostoNocheNino) || 0;

    const totalAdulto = Number((cAdultoNoche * nNoches).toFixed(2));
    const totalNino = Number((cNinoNoche * nNoches).toFixed(2));

    const nuevoItem = {
      id: Date.now() + Math.random(),
      tipo: 'hotel',
      titulo: selectedHotelObj.nombre,
      detalle: `${selectedHabitacionObj.habitacion} • ${nDias} Días / ${nNoches} Noches ($${cAdultoNoche}/noche)`,
      costo_adulto: totalAdulto,
      costo_nino: totalNino,
    };

    setSelectedProducts((prev) => [...prev, nuevoItem]);

    // Si aún no tiene ubicación, auto-asignar la del hotel
    if (!idUbicacion && selectedHotelObj.id_ubicacion) {
      setIdUbicacion(String(selectedHotelObj.id_ubicacion));
    }

    // Si el nombre del paquete está vacío, sugerir uno
    if (!nombrePaquete.trim()) {
      setNombrePaquete(`Paquete ${selectedHotelObj.nombre} ${nDias}D/${nNoches}N`);
    }

    // Resetear formulario hotel
    setHotelId('');
    setHabitacionId('');
    setHotelCostoNocheAdulto('');
    setHotelCostoNocheNino('');
  };

  // Agregar Excursión
  const handleAddExcursion = () => {
    const exc = (catalogos.excursiones || []).find((e) => String(e.id) === String(excursionId));
    if (!exc) return;

    const cAdulto = parseFloat(excursionCostoAdulto) || 0;
    const cNino = parseFloat(excursionCostoNino) || 0;

    setSelectedProducts((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        tipo: 'excursion',
        titulo: exc.tipo_excursion || exc.nombre || 'Excursión',
        detalle: 'Excursión / Tour guiado',
        costo_adulto: cAdulto,
        costo_nino: cNino,
      },
    ]);

    setExcursionId('');
    setExcursionCostoAdulto('');
    setExcursionCostoNino('');
  };

  // Agregar Traslado
  const handleAddTraslado = () => {
    const tra = (catalogos.traslados || []).find((t) => String(t.id) === String(trasladoId));
    if (!tra) return;

    const cAdulto = parseFloat(trasladoCostoAdulto) || 0;
    const cNino = parseFloat(trasladoCostoNino) || 0;

    setSelectedProducts((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        tipo: 'traslado',
        titulo: tra.ruta_origen,
        detalle: `Traslado (${tra.tipo_servicio || 'Servicio'})`,
        costo_adulto: cAdulto,
        costo_nino: cNino,
      },
    ]);

    setTrasladoId('');
    setTrasladoCostoAdulto('');
    setTrasladoCostoNino('');
  };

  // Agregar Vuelo
  const handleAddVuelo = () => {
    const aero = (catalogos.aerolineas || []).find((a) => String(a.id) === String(aerolineaId));
    const cAdulto = parseFloat(vueloCostoAdulto) || 0;
    const cNino = parseFloat(vueloCostoNino) || 0;

    setSelectedProducts((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        tipo: 'vuelo',
        titulo: aero ? aero.nombre : 'Boleto Aéreo',
        detalle: vueloRuta.trim() ? `Ruta: ${vueloRuta.trim()}` : 'Vuelo ida y vuelta',
        costo_adulto: cAdulto,
        costo_nino: cNino,
      },
    ]);

    setAerolineaId('');
    setVueloRuta('');
    setVueloCostoAdulto('');
    setVueloCostoNino('');
  };

  // Agregar Vehículo
  const handleAddVehiculo = () => {
    const veh = (catalogos.vehiculos || []).find((v) => String(v.id) === String(vehiculoId));
    if (!veh) return;

    const nDias = parseInt(vehiculoDias, 10) || 1;
    const cDia = parseFloat(vehiculoCostoDia) || 0;
    const totalVeh = Number((cDia * nDias).toFixed(2));
    const agenciaNombre = veh.agencia?.agencia || veh.nombre_agencia || '';

    setSelectedProducts((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        tipo: 'vehiculo',
        titulo: `${veh.marca} ${veh.vehiculo || veh.modelo || ''}`.trim(),
        detalle: `${agenciaNombre ? `Agencia: ${agenciaNombre} • ` : ''}Alquiler por ${nDias} días ($${cDia}/día)`,
        costo_adulto: totalVeh,
        costo_nino: 0,
      },
    ]);

    setVehiculoAgenciaId('');
    setVehiculoId('');
    setVehiculoCostoDia('');
  };

  // Agregar Otro Servicio
  const handleAddOtro = () => {
    if (!otroTitulo.trim()) return;

    const cAdulto = parseFloat(otroCostoAdulto) || 0;
    const cNino = parseFloat(otroCostoNino) || 0;

    setSelectedProducts((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        tipo: 'otro',
        titulo: otroTitulo.trim(),
        detalle: 'Servicio adicional / complementario',
        costo_adulto: cAdulto,
        costo_nino: cNino,
      },
    ]);

    setOtroTitulo('');
    setOtroCostoAdulto('');
    setOtroCostoNino('');
  };

  // Eliminar un producto agregado
  const handleRemoveProduct = (id) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // -------------------------------------------------------------
  // SUBMIT HANDLER
  // -------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombrePaquete.trim()) {
      setErrorMessage('El nombre del paquete es obligatorio.');
      return;
    }

    if (!idUbicacion) {
      setErrorMessage('Debe seleccionar una ubicación para el paquete.');
      return;
    }

    if (modo === 'builder' && selectedProducts.length === 0) {
      setErrorMessage('Debe agregar al menos un producto al paquete en el armador.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      paquete: nombrePaquete.trim(),
      id_ubicacion: parseInt(idUbicacion, 10),
      costo_adulto: parseFloat(costoAdulto) || 0,
      porcentaje_adulto: porcentajeAdulto !== '' ? parseFloat(porcentajeAdulto) : null,
      precio_adulto: parseFloat(precioAdulto) || 0,
      costo_nino: parseFloat(costoNino) || 0,
      porcentaje_nino: porcentajeNino !== '' ? parseFloat(porcentajeNino) : null,
      precio_nino: parseFloat(precioNino) || 0,
      aplica_descuento_referidos: Boolean(aplicaDescuentoReferidos),
    };

    try {
      if (paqueteToEdit) {
        await axios.put(`/v1/catalog/paquetes/${paqueteToEdit.id}`, payload);
      } else {
        await axios.post('/v1/catalog/paquetes', payload);
      }
      onSaveSuccess();
    } catch (err) {
      console.error('Error al guardar paquete:', err);
      if (err.response?.data?.errors) {
        const errorList = Object.values(err.response.data.errors).flat();
        setErrorMessage(errorList.join(' '));
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al procesar la solicitud.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paqueteToEdit ? 'Editar Paquete' : (modo === 'builder' ? 'Armar Paquetes (Por Productos)' : 'Crear Nuevo Paquete')}
      width={modo === 'builder' ? '820px' : '620px'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.875rem',
          }}>
            {errorMessage}
          </div>
        )}

        {/* Selector de Modo: Crear Paquete vs Armar Paquetes (Solo al crear) */}
        {!paqueteToEdit && (
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              type="button"
              onClick={() => setModo('manual')}
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: modo === 'manual' ? '#E87217' : 'transparent',
                color: '#FFFFFF',
                fontWeight: modo === 'manual' ? '700' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Crear Paquete (Manual)</span>
            </button>

            <button
              type="button"
              onClick={() => setModo('builder')}
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: modo === 'builder' ? '#E87217' : 'transparent',
                color: '#FFFFFF',
                fontWeight: modo === 'builder' ? '700' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <img src={imgPaquetes} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
              <span>Armar Paquetes (Por Productos)</span>
            </button>
          </div>
        )}

        {/* Datos Principales (Nombre y Ubicación) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="erp-label">
              Nombre del Paquete <span className="req">*</span>
            </label>
            <input
              type="text"
              className="erp-input"
              maxLength={150}
              placeholder="Ej: Aventura Canaima 3D/2N"
              value={nombrePaquete}
              onChange={(e) => setNombrePaquete(e.target.value.slice(0, 150))}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="erp-label">
              Ubicación <span className="req">*</span>
            </label>
            <CustomSelect
              value={idUbicacion}
              onChange={(e) => setIdUbicacion(e.target.value)}
              disabled={isSubmitting || loadingUbicaciones}
            >
              <option value="">
                {loadingUbicaciones ? 'Cargando ubicaciones...' : 'Seleccione una ubicación...'}
              </option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.ubicacion}
                </option>
              ))}
            </CustomSelect>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODO BUILDER: SELECCIONAR Y SUMAR PRODUCTOS               */}
        {/* ========================================================= */}
        {modo === 'builder' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Box Selector de Productos */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.88rem', color: '#E87217', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Seleccionar Productos para el Paquete
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  El costo neto de cada producto se sumará automáticamente
                </span>
              </div>

              {/* Categorías de Productos */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {[
                  { id: 'hotel', label: 'Hotel', icon: imgHoteles },
                  { id: 'excursion', label: 'Excursión', icon: imgExcursiones },
                  { id: 'traslado', label: 'Traslado', icon: imgTraslados },
                  { id: 'vuelo', label: 'Vuelo', icon: imgAerolineas },
                  { id: 'vehiculo', label: 'Vehículo', icon: imgVehiculos },
                  { id: 'otro', label: 'Otro', icon: imgAgregar },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setBuilderCategory(cat.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      border: builderCategory === cat.id ? '1px solid #E87217' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: builderCategory === cat.id ? 'rgba(232, 114, 23, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                      color: builderCategory === cat.id ? '#FF9248' : '#F8FAFC',
                      fontSize: '0.8rem',
                      fontWeight: builderCategory === cat.id ? '700' : '500',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img src={cat.icon} alt={cat.label} style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Formulario Dinámico según Categoría */}
              {/* 1. HOTEL */}
              {builderCategory === 'hotel' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="erp-label">Seleccionar Hotel</label>
                      <CustomSelect
                        value={hotelId}
                        onChange={(e) => {
                          setHotelId(e.target.value);
                          setHabitacionId('');
                        }}
                      >
                        <option value="">Seleccione un hotel...</option>
                        {(catalogos.hoteles || []).map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.nombre} ({h.ubicacion?.ubicacion || 'General'})
                          </option>
                        ))}
                      </CustomSelect>
                    </div>

                    <div>
                      <label className="erp-label">Habitación</label>
                      <CustomSelect
                        value={habitacionId}
                        onChange={(e) => setHabitacionId(e.target.value)}
                        disabled={!hotelId}
                      >
                        <option value="">
                          {!hotelId ? 'Primero seleccione un hotel...' : 'Seleccione una habitación...'}
                        </option>
                        {selectedHotelObj?.habitaciones?.map((hab) => (
                          <option key={hab.id} value={hab.id}>
                            {hab.habitacion} (Cap: {hab.cantidad_personas})
                          </option>
                        ))}
                      </CustomSelect>
                    </div>
                  </div>

                  {/* Especificar Días y Noches (Requisito Explícito del Usuario) */}
                  {selectedHabitacionObj && (
                    <div style={{
                      background: 'rgba(232, 114, 23, 0.08)',
                      border: '1px solid rgba(232, 114, 23, 0.25)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#FDBA74', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src={imgHoteles} alt="" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
                        <span>Especificar Duración de Estadía y Costos por Noche:</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label className="erp-label">Días <span className="req">*</span></label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            className="erp-input"
                            value={hotelDias}
                            onChange={(e) => setHotelDias(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          />
                        </div>

                        <div>
                          <label className="erp-label">Noches <span className="req">*</span></label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            className="erp-input"
                            value={hotelNoches}
                            onChange={(e) => setHotelNoches(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          />
                        </div>

                        <div>
                          <label className="erp-label">Costo/Noche Adulto</label>
                          <CustomNumberInput
                            placeholder="0.00"
                            step={0.01}
                            min={0}
                            allowDecimals
                            onInput={handlePriceInputKeyClamp}
                            value={hotelCostoNocheAdulto}
                            onChange={(e) => setHotelCostoNocheAdulto(formatPrecioCosto(e.target.value))}
                          />
                        </div>

                        <div>
                          <label className="erp-label">Costo/Noche Niño</label>
                          <CustomNumberInput
                            placeholder="0.00"
                            step={0.01}
                            min={0}
                            allowDecimals
                            onInput={handlePriceInputKeyClamp}
                            value={hotelCostoNocheNino}
                            onChange={(e) => setHotelCostoNocheNino(formatPrecioCosto(e.target.value))}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>
                          Subtotal x {hotelNoches} noches: Adulto <strong style={{ color: '#10B981' }}>${((parseFloat(hotelCostoNocheAdulto) || 0) * (parseInt(hotelNoches, 10) || 1)).toFixed(2)}</strong> • Niño <strong style={{ color: '#10B981' }}>${((parseFloat(hotelCostoNocheNino) || 0) * (parseInt(hotelNoches, 10) || 1)).toFixed(2)}</strong>
                        </span>

                        <button
                          type="button"
                          onClick={handleAddHotel}
                          style={{
                            background: '#E87217',
                            border: 'none',
                            color: '#FFFFFF',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          + Agregar Hotel al Paquete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. EXCURSIÓN */}
              {builderCategory === 'excursion' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label className="erp-label">Excursión</label>
                    <CustomSelect
                      value={excursionId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExcursionId(val);
                        const exc = (catalogos.excursiones || []).find((x) => String(x.id) === String(val));
                        if (exc) {
                          setExcursionCostoAdulto(exc.costo_adulto !== undefined ? String(exc.costo_adulto) : '0');
                          setExcursionCostoNino(exc.costo_nino !== undefined ? String(exc.costo_nino) : '0');
                        }
                      }}
                    >
                      <option value="">Seleccione una excursión...</option>
                      {(catalogos.excursiones || []).map((exc) => (
                        <option key={exc.id} value={exc.id}>
                          {exc.tipo_excursion || exc.nombre}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="erp-label">Costo Adulto</label>
                    <CustomNumberInput
                      placeholder="0.00"
                      value={excursionCostoAdulto}
                      onChange={(e) => setExcursionCostoAdulto(formatPrecioCosto(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="erp-label">Costo Niño</label>
                    <CustomNumberInput
                      placeholder="0.00"
                      value={excursionCostoNino}
                      onChange={(e) => setExcursionCostoNino(formatPrecioCosto(e.target.value))}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddExcursion}
                    disabled={!excursionId}
                    style={{
                      background: '#E87217',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: excursionId ? 'pointer' : 'not-allowed',
                      opacity: excursionId ? 1 : 0.6,
                      height: '38px',
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              )}

              {/* 3. TRASLADO */}
              {builderCategory === 'traslado' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label className="erp-label">Traslado (Ruta)</label>
                    <CustomSelect
                      value={trasladoId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTrasladoId(val);
                        const tra = (catalogos.traslados || []).find((x) => String(x.id) === String(val));
                        if (tra) {
                          setTrasladoCostoAdulto(tra.costo !== undefined ? String(tra.costo) : '0');
                          setTrasladoCostoNino(tra.costo_nino !== undefined ? String(tra.costo_nino) : (tra.costo ? String(tra.costo) : '0'));
                        }
                      }}
                    >
                      <option value="">Seleccione un traslado...</option>
                      {(catalogos.traslados || []).map((tra) => (
                        <option key={tra.id} value={tra.id}>
                          {tra.ruta_origen} ({tra.tipo_servicio})
                        </option>
                      ))}
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="erp-label">Costo Adulto</label>
                    <CustomNumberInput
                      placeholder="0.00"
                      value={trasladoCostoAdulto}
                      onChange={(e) => setTrasladoCostoAdulto(formatPrecioCosto(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="erp-label">Costo Niño</label>
                    <CustomNumberInput
                      placeholder="0.00"
                      value={trasladoCostoNino}
                      onChange={(e) => setTrasladoCostoNino(formatPrecioCosto(e.target.value))}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTraslado}
                    disabled={!trasladoId}
                    style={{
                      background: '#E87217',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: trasladoId ? 'pointer' : 'not-allowed',
                      opacity: trasladoId ? 1 : 0.6,
                      height: '38px',
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              )}

              {/* 4. VUELO */}
              {builderCategory === 'vuelo' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label className="erp-label">Aerolínea</label>
                    <CustomSelect
                      value={aerolineaId}
                      onChange={(e) => setAerolineaId(e.target.value)}
                    >
                      <option value="">Seleccione aerolínea...</option>
                      {(catalogos.aerolineas || []).map((a) => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="erp-label">Ruta / Detalle</label>
                    <input
                      type="text"
                      className="erp-input"
                      placeholder="Ej: CCS - PMV - CCS"
                      value={vueloRuta}
                      onChange={(e) => setVueloRuta(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="erp-label">Costo Adulto</label>
                    <CustomNumberInput
                      placeholder="0.00"
                      value={vueloCostoAdulto}
                      onChange={(e) => setVueloCostoAdulto(formatPrecioCosto(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="erp-label">Costo Niño</label>
                    <CustomNumberInput
                      placeholder="0.00"
                      value={vueloCostoNino}
                      onChange={(e) => setVueloCostoNino(formatPrecioCosto(e.target.value))}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVuelo}
                    disabled={!vueloCostoAdulto && !aerolineaId}
                    style={{
                      background: '#E87217',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      height: '38px',
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              )}

              {/* 5. VEHÍCULO */}
              {builderCategory === 'vehiculo' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 100px 110px auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label className="erp-label">Agencia</label>
                    <CustomSelect
                      value={vehiculoAgenciaId}
                      onChange={(e) => {
                        setVehiculoAgenciaId(e.target.value);
                        setVehiculoId('');
                        setVehiculoCostoDia('');
                      }}
                    >
                      <option value="">Seleccione una agencia...</option>
                      {agenciasVehiculoBuilder.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.agencia} {ag.nombre_ubicacion || ag.ubicacion?.ubicacion ? `(${ag.nombre_ubicacion || ag.ubicacion?.ubicacion})` : ''}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="erp-label">Vehículo</label>
                    <CustomSelect
                      value={vehiculoId}
                      disabled={!vehiculoAgenciaId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVehiculoId(val);
                        const veh = (catalogos.vehiculos || []).find((v) => String(v.id) === String(val));
                        const t = veh?.tarifa_activa || (veh?.tarifas && veh.tarifas.length > 0 ? veh.tarifas[veh.tarifas.length - 1] : null);
                        if (t && t.costo !== undefined) {
                          setVehiculoCostoDia(String(t.costo));
                        }
                      }}
                    >
                      <option value="">
                        {!vehiculoAgenciaId ? 'Primero seleccione una agencia...' : 'Seleccione vehículo...'}
                      </option>
                      {availableVehiculosBuilder.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.marca} {v.vehiculo || v.modelo || ''}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="erp-label">Días Alquiler</label>
                    <input
                      type="number"
                      min="1"
                      className="erp-input"
                      value={vehiculoDias}
                      onChange={(e) => setVehiculoDias(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </div>

                  <div>
                    <label className="erp-label">Costo / Día ($)</label>
                    <CustomNumberInput
                      placeholder="0.00"
                      value={vehiculoCostoDia}
                      onChange={(e) => setVehiculoCostoDia(formatPrecioCosto(e.target.value))}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVehiculo}
                    disabled={!vehiculoId}
                    style={{
                      background: '#E87217',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: vehiculoId ? 'pointer' : 'not-allowed',
                      opacity: vehiculoId ? 1 : 0.6,
                      height: '38px',
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              )}

              {/* 6. OTRO */}
              {builderCategory === 'otro' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label className="erp-label">Concepto / Servicio</label>
                    <input
                      type="text"
                      className="erp-input"
                      placeholder="Ej: Asistencia al viajero, Entradas"
                      value={otroTitulo}
                      onChange={(e) => setOtroTitulo(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="erp-label">Costo Adulto</label>
                    <CustomNumberInput
                      placeholder="0.00"
                      value={otroCostoAdulto}
                      onChange={(e) => setOtroCostoAdulto(formatPrecioCosto(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="erp-label">Costo Niño</label>
                    <CustomNumberInput
                      placeholder="0.00"
                      value={otroCostoNino}
                      onChange={(e) => setOtroCostoNino(formatPrecioCosto(e.target.value))}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOtro}
                    disabled={!otroTitulo.trim()}
                    style={{
                      background: '#E87217',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: otroTitulo.trim() ? 'pointer' : 'not-allowed',
                      opacity: otroTitulo.trim() ? 1 : 0.6,
                      height: '38px',
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              )}
            </div>

            {/* Lista de Productos Agregados al Paquete */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={imgPaquetes} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                  Productos en el Paquete ({selectedProducts.length})
                </span>
                {selectedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProducts([])}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Vaciar productos
                  </button>
                )}
              </div>

              {selectedProducts.length === 0 ? (
                <div style={{
                  padding: '18px',
                  textAlign: 'center',
                  color: '#94A3B8',
                  fontSize: '0.83rem',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                }}>
                  No has agregado productos aún. Selecciona un servicio arriba para incluirlo en este paquete.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {selectedProducts.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <img
                          src={getProductIcon(p.tipo)}
                          alt={p.tipo}
                          style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: '600', color: '#F8FAFC', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.titulo}
                          </div>
                          <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                            {p.detalle}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                          <span style={{ color: '#CBD5E1', display: 'block' }}>Adulto: <strong style={{ color: '#10B981' }}>${Number(p.costo_adulto || 0).toFixed(2)}</strong></span>
                          <span style={{ color: '#CBD5E1', display: 'block' }}>Niño: <strong style={{ color: '#10B981' }}>${Number(p.costo_nino || 0).toFixed(2)}</strong></span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.id)}
                          title="Quitar producto"
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '6px',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TARIFAS ADULTO Y NIÑO (COMÚN EN AMBOS MODOS)               */}
        {/* ========================================================= */}

        {/* Tarifa Adulto Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#E87217', fontWeight: '600' }}>
              Tarifa Adulto
            </h4>
            {modo === 'builder' && (
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Costo Neto Calculado Automáticamente
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label className="erp-label">
                Costo Neto{modo === 'builder' ? ' (Suma Productos)' : ''}<span className="req">*</span>
              </label>
              <CustomNumberInput
                placeholder="0.00"
                step={0.01}
                min={0}
                max={99999.99}
                allowDecimals
                onInput={handlePriceInputKeyClamp}
                value={costoAdulto}
                onChange={(e) => handleCostoAdultoChange(e.target.value)}
                required
                readOnly={modo === 'builder'}
                disabled={isSubmitting}
                style={modo === 'builder' ? { background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.35)', fontWeight: '700' } : {}}
              />
            </div>

            <div>
              <label className="erp-label">
                Precio Venta (Público)<span className="req">*</span>
              </label>
              <CustomNumberInput
                placeholder="0.00"
                step={0.01}
                min={0}
                max={99999.99}
                allowDecimals
                onInput={handlePriceInputKeyClamp}
                value={precioAdulto}
                onChange={(e) => handlePrecioAdultoChange(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="erp-label">% Margen Ganancia</label>
              <input
                type="text"
                className="erp-input"
                style={{ opacity: 0.85 }}
                placeholder="0.00%"
                value={porcentajeAdulto}
                onChange={(e) => handlePorcentajeAdultoChange(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Tarifa Niño Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#E87217', fontWeight: '600' }}>
              Tarifa Niño
            </h4>
            {modo === 'builder' && (
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Costo Neto Calculado Automáticamente
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label className="erp-label">
                Costo Neto{modo === 'builder' ? ' (Suma Productos)' : ''}<span className="req">*</span>
              </label>
              <CustomNumberInput
                placeholder="0.00"
                step={0.01}
                min={0}
                max={99999.99}
                allowDecimals
                onInput={handlePriceInputKeyClamp}
                value={costoNino}
                onChange={(e) => handleCostoNinoChange(e.target.value)}
                required
                readOnly={modo === 'builder'}
                disabled={isSubmitting}
                style={modo === 'builder' ? { background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.35)', fontWeight: '700' } : {}}
              />
            </div>

            <div>
              <label className="erp-label">
                Precio Venta (Público)<span className="req">*</span>
              </label>
              <CustomNumberInput
                placeholder="0.00"
                step={0.01}
                min={0}
                max={99999.99}
                allowDecimals
                onInput={handlePriceInputKeyClamp}
                value={precioNino}
                onChange={(e) => handlePrecioNinoChange(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="erp-label">% Margen Ganancia</label>
              <input
                type="text"
                className="erp-input"
                style={{ opacity: 0.85 }}
                placeholder="0.00%"
                value={porcentajeNino}
                onChange={(e) => handlePorcentajeNinoChange(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
          <button
            type="button"
            className="btn-form-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-form-nxt"
            disabled={isSubmitting || !nombrePaquete.trim() || !idUbicacion || (modo === 'builder' && selectedProducts.length === 0)}
          >
            {isSubmitting ? 'Guardando...' : paqueteToEdit ? 'Actualizar Paquete' : 'Guardar Paquete'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
