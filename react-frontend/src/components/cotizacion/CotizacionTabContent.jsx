import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

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
import CustomSelect from '../common/CustomSelect';
import CustomDatePicker from '../common/CustomDatePicker';
import CustomNumberInput from '../common/CustomNumberInput';
import imgUsuario from '../../assets/Usuario.svg';
import imgServicios from '../../assets/Servicios.svg';
import {
  EditarProductoModal,
  EliminarProductoModal,
  VaciarProductosModal,
  InformeCotizacionRapidaModal,
  AgruparProductosHotelModal,
} from './modals';

import { PRODUCT_TABS, PRODUCT_COLOR_MAP } from './cotizacionConstants';
import {
  formatEmail,
  validateEmail,
  formatTelefono,
  formatCedula,
  formatCodigoReferido,
  handlePriceInputKeyClamp,
  sanitizePrecioCostoValue,
} from '../../utils/validation';

export default function CotizacionTabContent({
  user,
  catalogos = {},
  tasaReferencialVES = 62.50,
  tabNumber = 1,
  tabId,
  onUpdateClientName,
  onCloseTab,
  onVerRegistro,
}) {
  const storageDraftKey = tabId
    ? (user?.id ? `cotizador_draft_${user.id}_${tabId}` : `cotizador_draft_${tabId}`)
    : null;

  // Read stored draft if present
  const initialDraft = useMemo(() => {
    if (!storageDraftKey) return null;
    try {
      const raw = localStorage.getItem(storageDraftKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [storageDraftKey]);

  // General Trip Information
  const [pax, setPax] = useState(() => initialDraft?.pax || {
    adultos: 2,
    adolescentes: 0,
    ninos: 0,
    infantes: 0,
  });
  const totalPax = pax.adultos + pax.adolescentes + pax.ninos + pax.infantes;

  const [fechasViaje, setFechasViaje] = useState(() => initialDraft?.fechasViaje || {
    checkin: new Date().toISOString().split('T')[0],
    checkout: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
  });

  // Client Data (US-04)
  const [cliente, setCliente] = useState(() => initialDraft?.cliente || {
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

  // Inform parent tabs of client name in real time
  useEffect(() => {
    const fullName = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
    if (onUpdateClientName) {
      onUpdateClientName(fullName);
    }
  }, [cliente.nombres, cliente.apellidos, onUpdateClientName]);

  // Additional passengers list
  const [pasajeros, setPasajeros] = useState(() => initialDraft?.pasajeros || []);

  // Referral Code (US-01)
  const [codigoReferido, setCodigoReferido] = useState(() => initialDraft?.codigoReferido || '');
  const [validatingReferido, setValidatingReferido] = useState(false);
  const [referidoData, setReferidoData] = useState(() => initialDraft?.referidoData || null);
  const [referidoError, setReferidoError] = useState('');

  // Cart / Added Items
  const [items, setItems] = useState(() => initialDraft?.items || []);

  // Modal para agrupar productos a un hotel registrado
  const [hotelToGroup, setHotelToGroup] = useState(null);
  const [viewMode, setViewMode] = useState('agrupado'); // 'agrupado' | 'plano'
  const [selectedGroupingHotelUid, setSelectedGroupingHotelUid] = useState('');
  const [tabSelectedHotelUid, setTabSelectedHotelUid] = useState('');

  // Hoteles registrados actualmente en la cotización
  const registeredHotels = useMemo(() => items.filter(it => it.tipo === 'hotel'), [items]);

  // Active Service Tab for adding items
  const [activeTab, setActiveTab] = useState(() => initialDraft?.activeTab || 'hotel');

  // Form states for each service
  const [hotelForm, setHotelForm] = useState(() => initialDraft?.hotelForm || {
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

  const [vueloForm, setVueloForm] = useState(() => initialDraft?.vueloForm || {
    id_aerolinea: '',
    itinerario: '',
    fecha_vuelo: '',
    precio_adulto: 0,
    precio_nino: 0,
    precio_infante: 0,
    costo_adulto: 0,
    costo_nino: 0,
    costo_infante: 0,
    hotel_item_uid: initialDraft?.vueloForm?.hotel_item_uid || '',
  });

  const [trasladoForm, setTrasladoForm] = useState(() => initialDraft?.trasladoForm || {
    id_traslado: '',
    fecha_traslado: '',
    precio: 0,
    costo: 0,
    observacion: '',
    tipo_asignacion: 'todos', // 'todos' | 'individual' | 'grupo'
    pax_individual_id: 0,
    pax_seleccionados: [],
    hotel_item_uid: initialDraft?.trasladoForm?.hotel_item_uid || '',
  });

  const [excursionForm, setExcursionForm] = useState(() => initialDraft?.excursionForm || {
    id_excursion: '',
    fecha: '',
    precio_adulto: 0,
    precio_nino: 0,
    costo_adulto: 0,
    costo_nino: 0,
    hotel_item_uid: initialDraft?.excursionForm?.hotel_item_uid || '',
  });

  const [paqueteForm, setPaqueteForm] = useState(() => initialDraft?.paqueteForm || {
    id_paquete: '',
    fecha: '',
    precio_adulto: 0,
    precio_nino: 0,
    costo_adulto: 0,
    costo_nino: 0,
    hotel_item_uid: initialDraft?.paqueteForm?.hotel_item_uid || '',
  });

  const [vehiculoForm, setVehiculoForm] = useState(() => initialDraft?.vehiculoForm || {
    id_vehiculo: '',
    desde: '',
    hasta: '',
    dias: 1,
    precio_unitario: 0,
    costo: 0,
    observacion: '',
    hotel_item_uid: initialDraft?.vehiculoForm?.hotel_item_uid || '',
  });

  const [ferryForm, setFerryForm] = useState(() => initialDraft?.ferryForm || {
    ruta: '',
    clase: 'Playa',
    itinerario: '',
    vehiculos: 0,
    precio_adulto: 0,
    precio_nino: 0,
    precio_infante: 0,
    precio_vehiculo: 0,
    hotel_item_uid: initialDraft?.ferryForm?.hotel_item_uid || '',
  });

  const [otroForm, setOtroForm] = useState(() => initialDraft?.otroForm || {
    descripcion: '',
    fecha: '',
    costo: 0,
    precio: 0,
    hotel_item_uid: initialDraft?.otroForm?.hotel_item_uid || '',
  });

  // Installment Plan
  const [enableCuotas, setEnableCuotas] = useState(() => initialDraft?.enableCuotas ?? false);
  const [cuotasConfig, setCuotasConfig] = useState(() => initialDraft?.cuotasConfig || {
    modo: 'monto', // 'monto' o 'porcentaje'
    valor_inicial: 0,
    numero_cuotas: 3,
  });

  // General observations & discount
  const [descuentoAdicional, setDescuentoAdicional] = useState(() => initialDraft?.descuentoAdicional ?? '0');
  const [tipoDescuento, setTipoDescuento] = useState(() => initialDraft?.tipoDescuento || 'Porcentaje');
  const [observacion, setObservacion] = useState(() => initialDraft?.observacion || '');

  // Persist quotation draft to localStorage whenever fields change
  useEffect(() => {
    if (!storageDraftKey) return;
    const timer = setTimeout(() => {
      try {
        const draft = {
          pax,
          fechasViaje,
          cliente,
          pasajeros,
          codigoReferido,
          referidoData,
          items,
          activeTab,
          hotelForm,
          vueloForm,
          trasladoForm,
          excursionForm,
          paqueteForm,
          vehiculoForm,
          ferryForm,
          otroForm,
          enableCuotas,
          cuotasConfig,
          descuentoAdicional,
          tipoDescuento,
          observacion,
        };
        localStorage.setItem(storageDraftKey, JSON.stringify(draft));
      } catch (err) {
        console.warn('Error saving quotation draft:', err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [
    storageDraftKey,
    pax,
    fechasViaje,
    cliente,
    pasajeros,
    codigoReferido,
    referidoData,
    items,
    activeTab,
    hotelForm,
    vueloForm,
    trasladoForm,
    excursionForm,
    paqueteForm,
    vehiculoForm,
    ferryForm,
    otroForm,
    enableCuotas,
    cuotasConfig,
    descuentoAdicional,
    tipoDescuento,
    observacion,
  ]);

  // Cart item delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState(null);
  // Cart empty confirmation modal state
  const [isVaciarModalOpen, setIsVaciarModalOpen] = useState(false);
  // Cart item edit modal state
  const [itemToEdit, setItemToEdit] = useState(null);

  // Submit / Result state
  const [submitting, setSubmitting] = useState(false);
  const [submittingRapida, setSubmittingRapida] = useState(false);
  const isSubmittingRef = useRef(false);
  const isProcessing = submitting || submittingRapida;
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message, data }
  const [informeModalCotizacion, setInformeModalCotizacion] = useState(null);
  const [lastSavedCotizacion, setLastSavedCotizacion] = useState(null);




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

  // Manejadores de formatos y validaciones centralizados
  const handleDocumentoClienteChange = (e) => {
    setCliente(prev => ({ ...prev, documento: formatCedula(e.target.value) }));
  };

  const handleTelefonoClienteChange = (e) => {
    setCliente(prev => ({ ...prev, telefono: formatTelefono(e.target.value) }));
  };

  const handleCorreoClienteChange = (e) => {
    setCliente(prev => ({ ...prev, correo: formatEmail(e.target.value) }));
  };

  const handleCodigoReferidoChange = (e) => {
    setCodigoReferido(formatCodigoReferido(e.target.value));
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

  // Helper to get expected categories for companions based on pax counts
  const getExpectedPaxCategories = useCallback(() => {
    const categories = [];
    const remainingAdults = Math.max(0, (pax.adultos || 1) - 1);
    for (let i = 0; i < remainingAdults; i++) categories.push('adulto');
    for (let i = 0; i < (pax.adolescentes || 0); i++) categories.push('adolescente');
    for (let i = 0; i < (pax.ninos || 0); i++) categories.push('nino');
    for (let i = 0; i < (pax.infantes || 0); i++) categories.push('infante');
    return categories;
  }, [pax.adultos, pax.adolescentes, pax.ninos, pax.infantes]);

  // Sync companions count and default categories when pax changes
  useEffect(() => {
    const needed = Math.max(0, totalPax - 1);
    const expected = getExpectedPaxCategories();

    setPasajeros(prev => {
      const next = [];
      for (let i = 0; i < needed; i++) {
        const existing = prev[i];
        const category = existing?.tipo_pax || expected[i] || 'adulto';

        let tipoDoc = existing?.tipo_documento;
        if (category === 'infante') {
          if (tipoDoc !== 'NAC' && tipoDoc !== 'P') {
            tipoDoc = 'NAC';
          }
        } else if (category === 'nino') {
          if (!['V', 'E', 'NAC', 'P'].includes(tipoDoc)) {
            tipoDoc = 'NAC';
          }
        } else {
          if (!['V', 'E', 'P', 'J', 'G'].includes(tipoDoc)) {
            tipoDoc = 'V';
          }
        }

        next.push({
          nombres: existing?.nombres || '',
          apellidos: existing?.apellidos || '',
          documento: existing?.documento || '',
          tipo_documento: tipoDoc,
          tipo_pax: category,
        });
      }
      return next;
    });
  }, [totalPax, getExpectedPaxCategories, pax.adultos, pax.adolescentes, pax.ninos, pax.infantes]);

  const handleUpdatePasajero = (index, field, val) => {
    setPasajeros(prev => {
      const copy = [...prev];
      if (!copy[index]) return prev;

      let currentItem = { ...copy[index] };

      if (field === 'tipo_pax') {
        const newCat = val;
        let newTipoDoc = currentItem.tipo_documento;
        let newDoc = currentItem.documento;

        if (newCat === 'infante') {
          if (newTipoDoc !== 'NAC' && newTipoDoc !== 'P') {
            newTipoDoc = 'NAC';
            newDoc = '';
          }
        } else if (newCat === 'nino') {
          if (!['V', 'E', 'NAC', 'P'].includes(newTipoDoc)) {
            newTipoDoc = 'NAC';
            newDoc = '';
          }
        } else {
          if (newTipoDoc === 'NAC') {
            newTipoDoc = 'V';
            newDoc = '';
          }
        }

        currentItem = {
          ...currentItem,
          tipo_pax: newCat,
          tipo_documento: newTipoDoc,
          documento: newDoc,
        };
      } else if (field === 'tipo_documento') {
        const newTipoDoc = val;
        const oldTipoDoc = currentItem.tipo_documento;
        let newDoc = currentItem.documento;

        // Si se cambia entre fecha y documento de texto/número, limpiar el campo
        if ((oldTipoDoc === 'NAC' && newTipoDoc !== 'NAC') || (oldTipoDoc !== 'NAC' && newTipoDoc === 'NAC')) {
          newDoc = '';
        }

        currentItem = {
          ...currentItem,
          tipo_documento: newTipoDoc,
          documento: newDoc,
        };
      } else if (field === 'documento') {
        let sanitizedVal = val;
        const docType = currentItem.tipo_documento;

        if (docType === 'V' || docType === 'E') {
          sanitizedVal = val.replace(/\D/g, '').slice(0, 12);
        } else if (docType === 'P') {
          sanitizedVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
        } else if (docType === 'NAC') {
          sanitizedVal = val.slice(0, 10);
        }

        currentItem = {
          ...currentItem,
          documento: sanitizedVal,
        };
      } else if (field === 'nombres' || field === 'apellidos') {
        currentItem = {
          ...currentItem,
          [field]: val.slice(0, 50),
        };
      }

      copy[index] = currentItem;
      return copy;
    });
  };

  const getBirthdateSummary = (birthdateStr) => {
    if (!birthdateStr) return '';
    const birth = new Date(birthdateStr);
    if (isNaN(birth.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 0) return '';
    if (years === 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  };

  const calculateAgeYears = (birthdateStr) => {
    if (!birthdateStr) return 0;
    const birth = new Date(birthdateStr);
    if (isNaN(birth.getTime())) return 0;
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) {
      months--;
    }
    if (months < 0) {
      years--;
    }
    return Math.max(0, years);
  };

  // Unified passenger list for individual/group customization
  const allPassengers = useMemo(() => {
    const list = [];
    const clientFullName = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
    list.push({
      id: 0,
      tipo: 'titular',
      tipo_pax: 'adulto',
      nombre: clientFullName ? `${clientFullName} (Titular)` : 'Cliente Principal (Titular)',
      nombreCorto: clientFullName || 'Cliente Principal',
    });
    const needed = Math.max(0, totalPax - 1);
    for (let idx = 0; idx < needed; idx++) {
      const p = pasajeros[idx];
      const pFullName = p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : '';
      const catLabel = p?.tipo_pax === 'infante' ? 'Infante' : p?.tipo_pax === 'nino' ? 'Niño' : p?.tipo_pax === 'adolescente' ? 'Adolescente' : 'Adulto';
      list.push({
        id: idx + 1,
        tipo: 'acompanante',
        tipo_pax: p?.tipo_pax || 'adulto',
        nombre: pFullName ? `${pFullName} (${catLabel} ${idx + 2})` : `Acompañante ${idx + 2} (${catLabel})`,
        nombreCorto: pFullName || `Acompañante ${idx + 2}`,
      });
    }
    return list;
  }, [cliente.nombres, cliente.apellidos, pasajeros, totalPax]);

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

  // Limpiar tarifas de categorías cuando la cantidad de pasajeros vuelve a 0
  useEffect(() => {
    if (pax.ninos === 0) {
      setVueloForm(prev => (prev.precio_nino !== 0 ? { ...prev, precio_nino: 0 } : prev));
      setFerryForm(prev => (prev.precio_nino !== 0 ? { ...prev, precio_nino: 0 } : prev));
      setExcursionForm(prev => (prev.precio_nino !== 0 ? { ...prev, precio_nino: 0 } : prev));
      setPaqueteForm(prev => (prev.precio_nino !== 0 ? { ...prev, precio_nino: 0 } : prev));
    }
  }, [pax.ninos]);

  useEffect(() => {
    if (pax.infantes === 0) {
      setVueloForm(prev => (prev.precio_infante !== 0 ? { ...prev, precio_infante: 0 } : prev));
      setFerryForm(prev => (prev.precio_infante !== 0 ? { ...prev, precio_infante: 0 } : prev));
    }
  }, [pax.infantes]);

  // Reset form for product type after adding
  const resetFormForTipo = (tipo) => {
    switch (tipo) {
      case 'hotel':
        setHotelForm({
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
        break;
      case 'vuelo':
        setVueloForm({
          id_aerolinea: '',
          itinerario: '',
          fecha_vuelo: '',
          precio_adulto: 0,
          precio_nino: 0,
          precio_infante: 0,
          costo_adulto: 0,
          costo_nino: 0,
          costo_infante: 0,
          hotel_item_uid: '',
        });
        break;
      case 'traslado':
        setTrasladoForm({
          id_traslado: '',
          fecha_traslado: '',
          precio: 0,
          costo: 0,
          observacion: '',
          tipo_asignacion: 'todos',
          pax_individual_id: 0,
          pax_seleccionados: [],
          hotel_item_uid: '',
        });
        break;
      case 'excursion':
        setExcursionForm({
          id_excursion: '',
          fecha: '',
          precio_adulto: 0,
          precio_nino: 0,
          costo_adulto: 0,
          costo_nino: 0,
          hotel_item_uid: '',
        });
        break;
      case 'paquete':
        setPaqueteForm({
          id_paquete: '',
          fecha: '',
          precio_adulto: 0,
          precio_nino: 0,
          costo_adulto: 0,
          costo_nino: 0,
          hotel_item_uid: '',
        });
        break;
      case 'vehiculo':
        setVehiculoForm({
          id_vehiculo: '',
          desde: '',
          hasta: '',
          dias: 1,
          precio_unitario: 0,
          costo: 0,
          observacion: '',
          hotel_item_uid: '',
        });
        break;
      case 'ferry':
        setFerryForm({
          ruta: '',
          clase: 'Playa',
          itinerario: '',
          vehiculos: 0,
          precio_adulto: 0,
          precio_nino: 0,
          precio_infante: 0,
          precio_vehiculo: 0,
          hotel_item_uid: '',
        });
        break;
      case 'otro':
        setOtroForm({
          descripcion: '',
          fecha: '',
          costo: 0,
          precio: 0,
          hotel_item_uid: '',
        });
        break;
      default:
        break;
    }
  };

  // Build item object from draft form
  const buildItemFromDraft = (tipo, showErrors = false) => {
    const uid = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    if (tipo === 'hotel') {
      if (!hotelForm.id_hotel) {
        if (showErrors) alert('Seleccione un hotel');
        return null;
      }
      const hotelObj = selectedHotel || {};
      const habObj = selectedHabitacion || {};
      const subtotalAdultos = pax.adultos * hotelForm.precio_noche_adulto * hotelForm.noches;
      const subtotalAdol = pax.adolescentes * hotelForm.precio_noche_adolescente * hotelForm.noches;
      const subtotalNinos = pax.ninos * hotelForm.precio_noche_nino * hotelForm.noches;
      const totalItem = subtotalAdultos + subtotalAdol + subtotalNinos;

      return {
        uid,
        tipo: 'hotel',
        titulo: `${hotelObj.nombre || 'Hotel'} (${habObj.habitacion || 'Habitación'})`,
        detalle: `${hotelForm.noches} noches • ${pax.adultos} adultos(ADL), ${pax.adolescentes} adolescentes(YNG), ${pax.ninos} niños(CHD)`,
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
    }

    if (tipo === 'vuelo') {
      if (!vueloForm.id_aerolinea) {
        if (showErrors) alert('Seleccione una aerolínea');
        return null;
      }
      const aeroObj = (catalogos.aerolineas || []).find(a => String(a.id) === String(vueloForm.id_aerolinea)) || {};
      const precioAd = Number(vueloForm.precio_adulto || 0);
      const precioNi = Number(vueloForm.precio_nino || 0);
      const precioInf = Number(vueloForm.precio_infante || 0);
      const totalItem = (pax.adultos * precioAd) + (pax.ninos * precioNi) + (pax.infantes * precioInf);

      return {
        uid,
        tipo: 'vuelo',
        titulo: `${aeroObj.nombre || 'Aerolínea'} - ${vueloForm.itinerario || 'Ruta'}`,
        detalle: `Fecha: ${vueloForm.fecha_vuelo || 'Por definir'} • ${pax.adultos} ad${pax.ninos > 0 ? `, ${pax.ninos} niños` : ''}${pax.infantes > 0 ? `, ${pax.infantes} inf` : ''}`,
        precio: totalItem,
        hotel_item_uid: vueloForm.hotel_item_uid || null,
        data: {
          id_aerolinea: Number(vueloForm.id_aerolinea),
          itinerario: vueloForm.itinerario,
          fecha_vuelo: vueloForm.fecha_vuelo,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio_adulto: precioAd,
          precio_nino: precioNi,
          precio_infante: precioInf,
          costo_adulto: Number(vueloForm.costo_adulto || 0),
          costo_nino: Number(vueloForm.costo_nino || 0),
          costo_infante: Number(vueloForm.costo_infante || 0),
          hotel_item_uid: vueloForm.hotel_item_uid || null,
        },
      };
    }

    if (tipo === 'traslado') {
      if (!trasladoForm.id_traslado) {
        if (showErrors) alert('Por favor seleccione un servicio de traslado.');
        return null;
      }

      const trasObj = (catalogos.traslados || []).find(t => String(t.id) === String(trasladoForm.id_traslado)) || {};

      let titulo = `${trasObj.ruta_origen || 'Servicio de Traslado'}`;
      let detallePax = totalPax > 1 ? `Todos los pasajeros (${totalPax} pax)` : `1 pasajero`;
      let obsBase = trasladoForm.observacion ? trasladoForm.observacion.trim() : '';
      let obsFinal = obsBase;
      let adultosCount = pax.adultos;
      let ninosCount = pax.ninos;
      let infantesCount = pax.infantes;

      if (totalPax > 1) {
        if (trasladoForm.tipo_asignacion === 'individual') {
          const targetPax = allPassengers.find(p => p.id === Number(trasladoForm.pax_individual_id)) || allPassengers[0];
          const nombrePax = targetPax ? targetPax.nombreCorto : 'Individual';
          titulo += ` (Individual)`;
          detallePax = `Pasajero: ${nombrePax}`;
          obsFinal = `[Individual: ${nombrePax}] ${obsBase}`.trim();
          adultosCount = 1;
          ninosCount = 0;
          infantesCount = 0;
        } else if (trasladoForm.tipo_asignacion === 'grupo') {
          const selectedList = allPassengers.filter(p => (trasladoForm.pax_seleccionados || []).includes(p.id));
          if (selectedList.length === 0) {
            if (showErrors) alert('Por favor seleccione al menos un pasajero para el traslado grupal.');
            return null;
          }
          const nombres = selectedList.map(p => p.nombreCorto).join(', ');
          titulo += ` (Grupo - ${selectedList.length} pax)`;
          detallePax = `Pasajeros (${selectedList.length}): ${nombres}`;
          obsFinal = `[Grupo: ${nombres}] ${obsBase}`.trim();
          adultosCount = selectedList.length;
          ninosCount = 0;
          infantesCount = 0;
        }
      }

      return {
        uid,
        tipo: 'traslado',
        titulo,
        detalle: `Fecha: ${trasladoForm.fecha_traslado || 'Por definir'} • ${detallePax}${obsBase ? ` • Obs: ${obsBase}` : ''}`,
        precio: Number(trasladoForm.precio || trasObj.precio_publico || 0),
        hotel_item_uid: trasladoForm.hotel_item_uid || null,
        data: {
          id_traslado: Number(trasladoForm.id_traslado || 1),
          fecha_traslado: trasladoForm.fecha_traslado,
          adultos: adultosCount,
          ninos: ninosCount,
          infantes: infantesCount,
          precio_historico: Number(trasladoForm.precio || trasObj.precio_publico || 0),
          costo_historico: Number(trasladoForm.costo || trasObj.costo || 0),
          observacion: obsFinal,
          observacion_base: obsBase,
          tipo_asignacion: totalPax > 1 ? trasladoForm.tipo_asignacion : 'todos',
          pax_individual_id: trasladoForm.pax_individual_id,
          pax_seleccionados: trasladoForm.pax_seleccionados,
          hotel_item_uid: trasladoForm.hotel_item_uid || null,
        },
      };
    }

    if (tipo === 'excursion') {
      if (!excursionForm.id_excursion) {
        if (showErrors) alert('Seleccione una excursión');
        return null;
      }
      const excObj = (catalogos.excursiones || []).find(e => String(e.id) === String(excursionForm.id_excursion)) || {};
      const precioAd = Number(excursionForm.precio_adulto || 0);
      const precioNi = Number(excursionForm.precio_nino || 0);
      const totalItem = (pax.adultos * precioAd) + (pax.ninos * precioNi);
      return {
        uid,
        tipo: 'excursion',
        titulo: `${excObj.tipo_excursion || 'Excursión'}`,
        detalle: `Fecha: ${excursionForm.fecha || 'Por definir'} • ${pax.adultos} adultos(ADL), ${pax.ninos} niños(CHD)`,
        precio: totalItem,
        hotel_item_uid: excursionForm.hotel_item_uid || null,
        data: {
          id_excursion: Number(excursionForm.id_excursion),
          fecha: excursionForm.fecha,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio_adulto: precioAd,
          precio_nino: precioNi,
          costo_adulto: Number(excursionForm.costo_adulto || 0),
          costo_nino: Number(excursionForm.costo_nino || 0),
          hotel_item_uid: excursionForm.hotel_item_uid || null,
        },
      };
    }

    if (tipo === 'paquete') {
      if (!paqueteForm.id_paquete) {
        if (showErrors) alert('Seleccione un paquete turístico');
        return null;
      }
      const paqObj = (catalogos.paquetes || []).find(p => String(p.id) === String(paqueteForm.id_paquete)) || {};
      const precioAd = Number(paqueteForm.precio_adulto || 0);
      const precioNi = Number(paqueteForm.precio_nino || 0);
      const totalItem = (pax.adultos * precioAd) + (pax.ninos * precioNi);
      return {
        uid,
        tipo: 'paquete',
        titulo: `${paqObj.paquete || 'Paquete Turístico'}`,
        detalle: `Fecha: ${paqueteForm.fecha || 'Por definir'} • ${pax.adultos} adultos(ADL), ${pax.ninos} niños(CHD)`,
        precio: totalItem,
        hotel_item_uid: paqueteForm.hotel_item_uid || null,
        data: {
          id_paquete: Number(paqueteForm.id_paquete),
          fecha: paqueteForm.fecha,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio_adulto: precioAd,
          precio_nino: precioNi,
          costo_adulto: Number(paqueteForm.costo_adulto || 0),
          costo_nino: Number(paqueteForm.costo_nino || 0),
          hotel_item_uid: paqueteForm.hotel_item_uid || null,
        },
      };
    }

    if (tipo === 'vehiculo') {
      if (!vehiculoForm.id_vehiculo) {
        if (showErrors) alert('Seleccione un vehículo');
        return null;
      }
      const vehObj = (catalogos.vehiculos || []).find(v => String(v.id) === String(vehiculoForm.id_vehiculo)) || {};
      const totalItem = Number(vehiculoForm.dias || 1) * Number(vehiculoForm.precio_unitario || 0);
      return {
        uid,
        tipo: 'vehiculo',
        titulo: `${vehObj.marca || 'Vehículo'} ${vehObj.modelo || ''}`,
        detalle: `${vehiculoForm.dias} días • Desde: ${vehiculoForm.desde || 'Por definir'} hasta: ${vehiculoForm.hasta || 'Por definir'}`,
        precio: totalItem,
        hotel_item_uid: vehiculoForm.hotel_item_uid || null,
        data: {
          id_vehiculo: Number(vehiculoForm.id_vehiculo),
          desde: vehiculoForm.desde,
          hasta: vehiculoForm.hasta,
          dias: Number(vehiculoForm.dias),
          precio_unitario: Number(vehiculoForm.precio_unitario),
          costo: Number(vehiculoForm.costo),
          observacion: vehiculoForm.observacion,
          hotel_item_uid: vehiculoForm.hotel_item_uid || null,
        },
      };
    }

    if (tipo === 'ferry') {
      const hasFerryData = (ferryForm.ruta && ferryForm.ruta.trim() !== '') || (ferryForm.itinerario && ferryForm.itinerario.trim() !== '') || Number(ferryForm.precio_adulto) > 0;
      if (!hasFerryData) {
        if (showErrors) alert('Complete los datos del ferry');
        return null;
      }
      const precioAd = Number(ferryForm.precio_adulto || 0);
      const precioNi = Number(ferryForm.precio_nino || 0);
      const precioInf = Number(ferryForm.precio_infante || 0);
      const precioVeh = Number(ferryForm.precio_vehiculo || 0);
      const totalItem = (pax.adultos * precioAd) + (pax.ninos * precioNi) + (pax.infantes * precioInf) + (ferryForm.vehiculos * precioVeh);
      return {
        uid,
        tipo: 'ferry',
        titulo: `${ferryForm.ruta || 'Ruta'} (${ferryForm.clase})`,
        detalle: `${pax.adultos} adultos(ADL)${pax.ninos > 0 ? `, ${pax.ninos} niños(CHD)` : ''}${pax.infantes > 0 ? `, ${pax.infantes} infantes(INF)` : ''}, ${ferryForm.vehiculos} veh • Itinerario: ${ferryForm.itinerario}`,
        precio: totalItem,
        hotel_item_uid: ferryForm.hotel_item_uid || null,
        data: {
          ruta: ferryForm.ruta,
          clase: ferryForm.clase,
          itinerario: ferryForm.itinerario,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          vehiculos: Number(ferryForm.vehiculos),
          precio_adulto: precioAd,
          precio_nino: precioNi,
          precio_infante: precioInf,
          precio_vehiculo: precioVeh,
          hotel_item_uid: ferryForm.hotel_item_uid || null,
        },
      };
    }

    if (tipo === 'otro') {
      const hasOtroData = (otroForm.descripcion && otroForm.descripcion.trim() !== '') || Number(otroForm.precio) > 0;
      if (!hasOtroData) {
        if (showErrors) alert('Ingrese una descripción o precio del servicio');
        return null;
      }
      const precioOtro = Number(otroForm.precio || 0);
      return {
        uid,
        tipo: 'otro',
        titulo: `${otroForm.descripcion || 'Servicio Personalizado'}`,
        detalle: `Fecha: ${otroForm.fecha || 'Por definir'}`,
        precio: precioOtro,
        hotel_item_uid: otroForm.hotel_item_uid || null,
        data: {
          descripcion: otroForm.descripcion,
          fecha: otroForm.fecha,
          adultos: pax.adultos,
          ninos: pax.ninos,
          infantes: pax.infantes,
          precio: Number(otroForm.precio || 0),
          costo: Number(otroForm.costo || 0),
          hotel_item_uid: otroForm.hotel_item_uid || null,
        },
      };
    }

    return null;
  };

  // Helper to determine if a product draft is ready to be added
  const isDraftReady = useCallback((tabId) => {
    switch (tabId) {
      case 'hotel':
        return Boolean(hotelForm.id_hotel);
      case 'vuelo':
        return Boolean(vueloForm.id_aerolinea);
      case 'traslado':
        return Boolean(trasladoForm.id_traslado) && (trasladoForm.tipo_asignacion !== 'grupo' || (trasladoForm.pax_seleccionados || []).length > 0);
      case 'excursion':
        return Boolean(excursionForm.id_excursion);
      case 'paquete':
        return Boolean(paqueteForm.id_paquete);
      case 'vehiculo':
        return Boolean(vehiculoForm.id_vehiculo);
      case 'ferry':
        return Boolean((ferryForm.ruta && ferryForm.ruta.trim() !== '') || (ferryForm.itinerario && ferryForm.itinerario.trim() !== '') || Number(ferryForm.precio_adulto) > 0);
      case 'otro':
        return Boolean((otroForm.descripcion && otroForm.descripcion.trim() !== '') || Number(otroForm.precio) > 0);
      default:
        return false;
    }
  }, [hotelForm, vueloForm, trasladoForm, excursionForm, paqueteForm, vehiculoForm, ferryForm, otroForm]);

  // List of product types that currently have reserved / ready draft info
  const readyDraftTypes = useMemo(() => {
    const allTypes = ['hotel', 'vuelo', 'traslado', 'excursion', 'paquete', 'vehiculo', 'ferry', 'otro'];
    return allTypes.filter(t => isDraftReady(t));
  }, [isDraftReady]);

  // Add Item to cart individually (con opción de agrupar directamente a un hotel)
  const handleAddItem = (tipo, targetHotelUid = null) => {
    const newItem = buildItemFromDraft(tipo, true);
    if (newItem) {
      if (targetHotelUid) {
        newItem.hotel_item_uid = targetHotelUid;
        if (newItem.data) newItem.data.hotel_item_uid = targetHotelUid;
        setViewMode('agrupado');
      } else if (tipo !== 'hotel') {
        newItem.hotel_item_uid = null;
        if (newItem.data) newItem.data.hotel_item_uid = null;
      }
      setItems(prev => [...prev, newItem]);
      resetFormForTipo(tipo);
    }
  };

  // Add all products with reserved information in a single click (independientes / sin agrupar)
  const handleAddAllReadyProducts = () => {
    if (readyDraftTypes.length <= 1) return;
    const newItems = [];
    readyDraftTypes.forEach(tipo => {
      const item = buildItemFromDraft(tipo, false);
      if (item) {
        if (tipo !== 'hotel') {
          item.hotel_item_uid = null;
          if (item.data) item.data.hotel_item_uid = null;
        }
        newItems.push(item);
        resetFormForTipo(tipo);
      }
    });

    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
    }
  };

  // Agregar y agrupar automáticamente todos los servicios listos al hotel
  const handleGroupAllReadyProducts = (explicitHotelUid = null) => {
    if (readyDraftTypes.length <= 1) return;
    const newItems = [];
    let destinationHotelUid = explicitHotelUid;

    // 1. Si el hotel está en el borrador listo actual, lo agregamos primero para obtener su uid
    if (readyDraftTypes.includes('hotel')) {
      const hotelItem = buildItemFromDraft('hotel', false);
      if (hotelItem) {
        newItems.push(hotelItem);
        resetFormForTipo('hotel');
        destinationHotelUid = hotelItem.uid;
      }
    } else if (!destinationHotelUid && registeredHotels.length > 0) {
      destinationHotelUid = registeredHotels[0].uid;
    }

    // 2. Agregar todos los demás servicios listos vinculados a ese hotel
    readyDraftTypes.filter(t => t !== 'hotel').forEach(tipo => {
      const item = buildItemFromDraft(tipo, false);
      if (item) {
        if (destinationHotelUid) {
          item.hotel_item_uid = destinationHotelUid;
          if (item.data) item.data.hotel_item_uid = destinationHotelUid;
        }
        newItems.push(item);
        resetFormForTipo(tipo);
      }
    });

    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
      setViewMode('agrupado');
    }
  };

  // Componente de botones de acción para cada pestaña: Elegir entre Agregar o Agrupar al Hotel
  const renderTabActionButtons = (tipo, label) => {
    const hasHotel = registeredHotels.length > 0;
    const targetUid = tabSelectedHotelUid || registeredHotels[0]?.uid || '';

    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
        <button
          type="button"
          onClick={() => handleAddItem(tipo, null)}
          className="btn-form-nxt"
          style={{
            padding: '9px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.8125rem',
          }}
          title={`Agregar ${label} como servicio independiente / general`}
        >
          <img src={imgAgregar} alt="Agregar" style={{ width: '15px', height: '15px' }} />
          Agregar {label}
        </button>

        {hasHotel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {registeredHotels.length > 1 && (
              <CustomSelect
                value={targetUid}
                onChange={e => setTabSelectedHotelUid(e.target.value)}
                style={{ padding: '6px 8px', fontSize: '0.78rem', maxWidth: '170px' }}
              >
                {registeredHotels.map(h => (
                  <option key={h.uid} value={h.uid}>🏨 {h.titulo}</option>
                ))}
              </CustomSelect>
            )}
            <button
              type="button"
              onClick={() => handleAddItem(tipo, targetUid)}
              style={{
                padding: '9px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'rgba(232, 114, 23, 0.25)',
                border: '1px solid #E87217',
                color: '#FDBA74',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={`Agregar y agrupar ${label} al hotel`}
            >
              <span>🔗</span>
              Agrupar {label} al Hotel
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleRemoveItem = (uid) => {
    setItems(prev => {
      const target = prev.find(item => item.uid === uid);
      const isHotel = target?.tipo === 'hotel';
      return prev
        .filter(item => item.uid !== uid)
        .map(item => {
          if (isHotel && item.hotel_item_uid === uid) {
            return {
              ...item,
              hotel_item_uid: null,
              data: item.data ? { ...item.data, hotel_item_uid: null } : item.data,
            };
          }
          return item;
        });
    });
  };

  // Asignar o desasociar un producto a un hotel registrado
  const handleAssignHotel = (itemUid, hotelUid) => {
    setItems(prev => prev.map(item => {
      if (item.uid === itemUid) {
        return {
          ...item,
          hotel_item_uid: hotelUid || null,
          data: item.data ? { ...item.data, hotel_item_uid: hotelUid || null } : item.data,
        };
      }
      return item;
    }));
  };

  // Guardar agrupación masiva para un hotel desde el modal AgruparProductosHotelModal
  const handleSaveHotelGrouping = (hotelUid, selectedProductUids) => {
    const selectedSet = new Set(selectedProductUids);
    setItems(prev => prev.map(item => {
      if (item.tipo === 'hotel') return item;

      // Si este producto estaba asignado a este hotel pero ya no está seleccionado, desasociar
      if (item.hotel_item_uid === hotelUid && !selectedSet.has(item.uid)) {
        return {
          ...item,
          hotel_item_uid: null,
          data: item.data ? { ...item.data, hotel_item_uid: null } : item.data,
        };
      }

      // Si fue seleccionado para este hotel
      if (selectedSet.has(item.uid)) {
        return {
          ...item,
          hotel_item_uid: hotelUid,
          data: item.data ? { ...item.data, hotel_item_uid: hotelUid } : item.data,
        };
      }

      return item;
    }));
  };

  const handleSaveEditedItem = (updatedItem) => {
    setItems(prev => prev.map(item => item.uid === updatedItem.uid ? updatedItem : item));
    setItemToEdit(null);
  };

  const handleClearItems = () => {
    setIsVaciarModalOpen(true);
  };

  // Verifica si un producto/pestaña tiene información reservada o configurada (formulario o items agregados)
  const checkTabHasInfo = (tabId) => {
    if (items.some(item => item.tipo === tabId)) {
      return true;
    }

    switch (tabId) {
      case 'hotel':
        return Boolean(
          hotelForm.id_hotel ||
          hotelForm.id_habitacion ||
          (hotelForm.id_ubicacion && String(hotelForm.id_ubicacion).trim() !== '') ||
          Number(hotelForm.precio_noche_adulto) > 0
        );
      case 'vuelo':
        return Boolean(
          vueloForm.id_aerolinea ||
          (vueloForm.itinerario && vueloForm.itinerario.trim() !== '') ||
          (vueloForm.fecha_vuelo && vueloForm.fecha_vuelo.trim() !== '') ||
          Number(vueloForm.precio_adulto) > 0 ||
          Number(vueloForm.precio_nino) > 0 ||
          Number(vueloForm.precio_infante) > 0
        );
      case 'traslado':
        return Boolean(
          trasladoForm.id_traslado ||
          (trasladoForm.fecha_traslado && trasladoForm.fecha_traslado.trim() !== '') ||
          (trasladoForm.observacion && trasladoForm.observacion.trim() !== '') ||
          Number(trasladoForm.precio) > 0 ||
          trasladoForm.tipo_asignacion !== 'todos' ||
          (trasladoForm.pax_seleccionados && trasladoForm.pax_seleccionados.length > 0)
        );
      case 'excursion':
        return Boolean(
          excursionForm.id_excursion ||
          (excursionForm.fecha && excursionForm.fecha.trim() !== '') ||
          Number(excursionForm.precio_adulto) > 0 ||
          Number(excursionForm.precio_nino) > 0
        );
      case 'paquete':
        return Boolean(
          paqueteForm.id_paquete ||
          (paqueteForm.fecha && paqueteForm.fecha.trim() !== '') ||
          Number(paqueteForm.precio_adulto) > 0 ||
          Number(paqueteForm.precio_nino) > 0
        );
      case 'vehiculo':
        return Boolean(
          vehiculoForm.id_vehiculo ||
          (vehiculoForm.desde && vehiculoForm.desde.trim() !== '') ||
          (vehiculoForm.hasta && vehiculoForm.hasta.trim() !== '') ||
          (vehiculoForm.observacion && vehiculoForm.observacion.trim() !== '') ||
          Number(vehiculoForm.precio_unitario) > 0 ||
          Number(vehiculoForm.dias) !== 1
        );
      case 'ferry':
        return Boolean(
          (ferryForm.ruta && ferryForm.ruta.trim() !== '') ||
          (ferryForm.itinerario && ferryForm.itinerario.trim() !== '') ||
          Number(ferryForm.precio_adulto) > 0 ||
          Number(ferryForm.precio_nino) > 0 ||
          Number(ferryForm.precio_infante) > 0 ||
          Number(ferryForm.vehiculos) > 0
        );
      case 'otro':
        return Boolean(
          (otroForm.descripcion && otroForm.descripcion.trim() !== '') ||
          (otroForm.fecha && otroForm.fecha.trim() !== '') ||
          Number(otroForm.precio) > 0
        );
      default:
        return false;
    }
  };

  // Character count limit for itinerary observations (max 3500 chars)
  const handleObservacionKeyDown = (e) => {
    // Límite de 3500 caracteres
    if (observacion.length >= 3500 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const handleObservacionChange = (e) => {
    setObservacion(e.target.value.slice(0, 3500));
  };

  // Financial Computations
  const subtotalUSD = useMemo(() => {
    return items.reduce((acc, curr) => acc + Number(curr.precio || 0), 0);
  }, [items]);

  const descuentoReferidoMonto = 0.00; // Pasivo US-01

  const descuentoCalculadoMonto = useMemo(() => {
    const val = parseFloat(descuentoAdicional) || 0;
    if (tipoDescuento === 'Porcentaje') {
      const pct = Math.max(0, val);
      return (subtotalUSD * pct) / 100;
    }
    return Math.max(0, val);
  }, [subtotalUSD, descuentoAdicional, tipoDescuento]);

  const totalUSD = Math.max(0, subtotalUSD - descuentoReferidoMonto - descuentoCalculadoMonto);
  const totalVES = (totalUSD * tasaReferencialVES).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleDescuentoChange = (e) => {
    let rawVal = e.target.value.replace(',', '.'); // Soporte para punto y coma decimal

    if (rawVal === '') {
      setDescuentoAdicional('');
      return;
    }

    // Permitir solo dígitos y un único punto decimal
    if (!/^\d*\.?\d*$/.test(rawVal)) {
      return;
    }

    const parts = rawVal.split('.');
    let intPart = parts[0];
    let decPart = parts.length > 1 ? parts[1] : null;

    if (tipoDescuento === 'Porcentaje') {
      // Porcentaje: máximo 2 dígitos en la parte entera (0 a 99)
      if (intPart.length > 2) {
        intPart = intPart.slice(0, 2);
      }
      // Permitir hasta 2 decimales
      if (decPart !== null && decPart.length > 2) {
        decPart = decPart.slice(0, 2);
      }
    } else {
      // Monto: máximo 3 dígitos en la parte entera (0 a 999)
      if (intPart.length > 3) {
        intPart = intPart.slice(0, 3);
      }
      // Permitir hasta 2 decimales
      if (decPart !== null && decPart.length > 2) {
        decPart = decPart.slice(0, 2);
      }
    }

    const finalVal = decPart !== null ? `${intPart}.${decPart}` : intPart;
    setDescuentoAdicional(finalVal);
  };

  const handleTipoDescuentoChange = (e) => {
    const nuevoTipo = e.target.value;
    setTipoDescuento(nuevoTipo);
    if (!descuentoAdicional) return;

    const parts = String(descuentoAdicional).split('.');
    let intPart = parts[0];
    let decPart = parts.length > 1 ? parts[1] : null;

    if (nuevoTipo === 'Porcentaje') {
      intPart = intPart.slice(0, 2);
    } else {
      intPart = intPart.slice(0, 3);
    }
    setDescuentoAdicional(decPart !== null ? `${intPart}.${decPart}` : intPart);
  };

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
    if (isSubmittingRef.current || isProcessing) return;
    if (!cliente.nombres.trim() || !cliente.apellidos.trim()) {
      alert('Por favor ingrese el nombre y el apellido del cliente principal.');
      return;
    }
    if (cliente.correo && cliente.correo.trim() !== '') {
      const emailCheck = validateEmail(cliente.correo);
      if (!emailCheck.isValid) {
        alert(`Correo electrónico inválido: ${emailCheck.message}`);
        return;
      }
    }
    if (items.length === 0) {
      alert('Debe agregar al menos un producto o servicio a la cotización.');
      return;
    }

    isSubmittingRef.current = true;
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
      pasajeros: pasajeros.filter(p => p.nombres.trim()).map(p => ({
        ...p,
        edad: p.tipo_documento === 'NAC' ? calculateAgeYears(p.documento) : Number(p.edad || 0),
      })),
      id_referidos: referidoData ? referidoData.id : null,
      checkin: fechasViaje.checkin,
      checkout: fechasViaje.checkout,
      tipo_pago: enableCuotas ? 'Cuotas' : 'Total',
      descuento_porcentaje: tipoDescuento === 'Porcentaje' ? `${parseFloat(descuentoAdicional) || 0}%` : null,
      descuento_monto: descuentoCalculadoMonto,
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
      const cotizGuardada = res.data.cotizacion;
      setFeedback({
        type: 'success',
        message: '¡Cotización registrada y guardada exitosamente!',
        data: cotizGuardada,
      });

      // Generar y abrir inmediatamente el informe de cotización rápida
      const normalizedCotiz = {
        ...cotizGuardada,
        tipo_registro: 'formal',
        total_usd: totalUSD,
        items: items, // conserva los ítems cargados para visualización inmediata
        cliente: {
          ...cliente,
          nombre_completo: `${cliente.nombres} ${cliente.apellidos}`.trim(),
        },
        fechas: fechasViaje,
        pax: pax,
        asesor: user?.name || user?.username || 'Asesor Plan de Viaje',
      };

      setLastSavedCotizacion(normalizedCotiz);
      setInformeModalCotizacion(normalizedCotiz);

      // Limpiar formulario para permitir nueva carga
      setItems([]);
      setDescuentoAdicional('0');
      setTipoDescuento('Porcentaje');
      setObservacion('');

      // Limpiar borrador persistente de esta cotización formalmente guardada
      try {
        if (storageDraftKey) localStorage.removeItem(storageDraftKey);
      } catch { }
    } catch (err) {
      console.error('Error creando cotización:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al persistir la cotización. Revise los datos requeridos.',
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  // Submit Quick Quote
  const handleSubmitRapida = async () => {
    if (isSubmittingRef.current || isProcessing) return;
    if (items.length === 0) {
      alert('Debe agregar al menos un producto para guardar como cotización rápida.');
      return;
    }
    if (cliente.correo && cliente.correo.trim() !== '') {
      const emailCheck = validateEmail(cliente.correo);
      if (!emailCheck.isValid) {
        alert(`Correo electrónico inválido: ${emailCheck.message}`);
        return;
      }
    }

    isSubmittingRef.current = true;
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
      const rapidaGuardada = res.data.data;
      const rapidaLocalizador = `RAP-${String(rapidaGuardada.id).padStart(5, '0')}`;
      setFeedback({
        type: 'success',
        message: '¡Cotización rápida guardada exitosamente!',
        data: { id: rapidaGuardada.id, localizador: rapidaLocalizador },
      });

      // Generar y abrir inmediatamente el informe de cotización rápida
      const normalizedRapida = {
        id: rapidaGuardada.id,
        tipo_registro: 'rapida',
        localizador: rapidaLocalizador,
        numero_ficha: rapidaGuardada.id,
        fecha: rapidaGuardada.fecha || new Date().toISOString(),
        cliente: {
          nombre_completo: cliente.nombres ? `${cliente.nombres} ${cliente.apellidos}`.trim() : 'Cliente Rápido',
          documento: cliente.documento,
          tipo_documento: cliente.tipo_documento,
          telefono: cliente.telefono,
          correo: cliente.correo,
        },
        fechas: fechasViaje,
        pax: pax,
        items: items,
        total_usd: totalUSD,
        total_estimado: totalUSD,
        observacion: observacion,
        asesor: user?.name || user?.username || 'Asesor Plan de Viaje',
      };

      setLastSavedCotizacion(normalizedRapida);
      setInformeModalCotizacion(normalizedRapida);
    } catch (err) {
      console.error('Error guardando cotización rápida:', err);
      setFeedback({
        type: 'error',
        message: 'Error al registrar la cotización rápida.',
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmittingRapida(false);
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto', paddingBottom: '20px' }}>
      {/* Header bar */}
      <div className="cotizacion-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src={imgNuevaCotizacion} alt="Cotizador" style={{ width: '28px', height: '28px' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span>Nueva Cotización</span>
            </h1>
          </div>
        </div>

        {/* Pax Selector Header Pill */}
        <div className="pax-header-pill">
          <div className="pax-item">
            <span className="pax-label">Adultos</span>
            <CustomNumberInput
              min={1}
              max={999}
              maxDigits={3}
              value={pax.adultos}
              onChange={e => setPax({ ...pax, adultos: Math.max(1, Math.min(999, parseInt(e.target.value) || 1)) })}
              size="sm"
            />
          </div>
          <div className="pax-divider" />
          <div className="pax-item">
            <span className="pax-label">Adolescentes</span>
            <CustomNumberInput
              min={0}
              max={999}
              maxDigits={3}
              value={pax.adolescentes}
              onChange={e => setPax({ ...pax, adolescentes: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              size="sm"
            />
          </div>
          <div className="pax-divider" />
          <div className="pax-item">
            <span className="pax-label">Niños</span>
            <CustomNumberInput
              min={0}
              max={999}
              maxDigits={3}
              value={pax.ninos}
              onChange={e => setPax({ ...pax, ninos: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              size="sm"
            />
          </div>
          <div className="pax-divider" />
          <div className="pax-item">
            <span className="pax-label">Infantes</span>
            <CustomNumberInput
              min={0}
              max={999}
              maxDigits={3}
              value={pax.infantes}
              onChange={e => setPax({ ...pax, infantes: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) })}
              size="sm"
            />
          </div>
          <div className="pax-divider" />
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Badge status="badge-neutral">{totalPax} Pax</Badge>
          </div>
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
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <strong>{feedback.message}</strong>
            {feedback.data?.localizador && (
              <span style={{ display: 'block', fontSize: '0.875rem', marginTop: '4px', color: '#E2E8F0' }}>
                {/* Localizador Oficial: <strong>{feedback.data.localizador}</strong> | */} Ficha: #{feedback.data.numero_ficha || feedback.data.id}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {feedback.type === 'success' && lastSavedCotizacion && (
              <button
                type="button"
                onClick={() => setInformeModalCotizacion(lastSavedCotizacion)}
                style={{
                  padding: '6px 14px',
                  background: '#10B981',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Ver Informe de Cotización Rápida
              </button>
            )}
            {feedback.type === 'success' && onVerRegistro && (
              <button
                type="button"
                onClick={onVerRegistro}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Ir al Registro de Guardado
              </button>
            )}
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.25rem', padding: '0 4px' }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Grid: 1. Cliente & Viaje (US-04 & US-01) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Card: Cliente Principal */}
        <div style={{
          background: 'rgb(6, 18, 81)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={imgUsuario} style={{ width: '20px', height: '20px' }} alt="" />Pasajero Titular
          </h2>

          {/* Autocomplete Lookup Bar (US-04) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <CustomSelect
              value={cliente.tipo_documento}
              onChange={e => setCliente({ ...cliente, tipo_documento: e.target.value })}
              style={{
                width: '80px',
              }}
            >
              <option value="V">V-</option>
              <option value="E">E-</option>
              <option value="J">J-</option>
              <option value="P">P-</option>
              <option value="G">G-</option>
            </CustomSelect>
            <input
              type="text"
              placeholder="Número de Cédula / Documento (Opcional)..."
              value={cliente.documento}
              onChange={handleDocumentoClienteChange}
              onKeyDown={e => e.key === 'Enter' && handleBuscarCliente()}
              maxLength={12}
              inputMode="numeric"
              className='erp-input'
            />
            <button
              onClick={handleBuscarCliente}
              disabled={searchingClient}
              className="btn-secondary-form"
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
              <label className='erp-label'>Nombres <span className="req">*</span></label>
              <input
                type="text"
                value={cliente.nombres}
                onChange={e => setCliente({ ...cliente, nombres: e.target.value.slice(0, 35) })}
                placeholder="Nombre(s)"
                maxLength={35}
                className='erp-input'
              />
            </div>
            <div>
              <label className='erp-label'>Apellidos <span className="req">*</span></label>
              <input
                type="text"
                value={cliente.apellidos}
                onChange={e => setCliente({ ...cliente, apellidos: e.target.value.slice(0, 25) })}
                placeholder="Apellido(s)"
                maxLength={25}
                className='erp-input'
              />
            </div>
            <div>
              <label className='erp-label'>Teléfono </label>
              <input
                type="text"
                value={cliente.telefono}
                onChange={handleTelefonoClienteChange}
                placeholder="+584120000000"
                maxLength={15}
                inputMode="tel"
                className='erp-input'
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className='erp-label' style={{ margin: 0 }}>Correo Electrónico </label>
                {cliente.correo && (
                  <span style={{
                    fontSize: '0.7rem',
                    color: validateEmail(cliente.correo).isValid ? '#10B981' : '#F59E0B'
                  }}>
                    {validateEmail(cliente.correo).isValid ? '✓ Válido' : validateEmail(cliente.correo).message}
                  </span>
                )}
              </div>
              <input
                type="email"
                value={cliente.correo}
                onChange={handleCorreoClienteChange}
                placeholder="cliente@correo.com"
                maxLength={20}
                className='erp-input'
                style={{
                  marginTop: '4px',
                  borderColor: cliente.correo && !validateEmail(cliente.correo).isValid ? '#F59E0B' : undefined
                }}
              />
            </div>
          </div>
        </div>

        {/* Card: Fechas del Viaje & Código de Referido (US-01) */}
        <div style={{
          background: 'rgb(6, 18, 81)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span></span> Fechas del Viaje
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label className='erp-label'>Fecha Check-in</label>
              <CustomDatePicker
                value={fechasViaje.checkin}
                onChange={e => setFechasViaje({ ...fechasViaje, checkin: e.target.value })}
              />
            </div>
            <div>
              <label className='erp-label'>Fecha Check-out</label>
              <CustomDatePicker
                value={fechasViaje.checkout}
                onChange={e => setFechasViaje({ ...fechasViaje, checkout: e.target.value })}
              />
            </div>
          </div>

          {/* Referral Code (US-01) */}
          <div>
            <label className='erp-label'>
              Código de Referido
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ej. REF-12345"
                value={codigoReferido}
                disabled={!!referidoData}
                onChange={handleCodigoReferidoChange}
                maxLength={12}
                className='erp-input'
              />
              {!referidoData ? (
                <button
                  type="button"
                  onClick={handleValidarReferido}
                  disabled={validatingReferido || !codigoReferido.trim()}
                  className="btn-form-nxt"
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
                <span style={{ color: '#b9c8ddff' }}>($0.00 descuento pasivo)</span>
              </div>
            )}

            {referidoError && (
              <div style={{ marginTop: '10px', fontSize: '0.8125rem', color: '#F59E0B' }}>
                ¡{referidoError}!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accompanist / Companion Passengers (if > 1 pax) */}
      {pasajeros.length > 0 && (
        <div style={{
          background: 'rgb(6, 18, 81)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '20px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <h2 style={{ fontSize: '1rem', color: '#FFF', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={imgUsuario} style={{ width: '18px', height: '18px' }} alt="" /> Pasajeros Acompañantes ({pasajeros.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: '14px',
            width: '100%',
          }}>
            {pasajeros.map((p, idx) => {
              const tipoPax = p.tipo_pax || 'adulto';
              const isInfante = tipoPax === 'infante';
              const isNino = tipoPax === 'nino';
              const isDateDoc = p.tipo_documento === 'NAC';

              const badgeColor = isInfante
                ? { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.35)' }
                : isNino
                  ? { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308', border: 'rgba(234, 179, 8, 0.35)' }
                  : tipoPax === 'adolescente'
                    ? { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.35)' }
                    : { bg: 'rgba(255, 255, 255, 0.08)', text: '#94A3B8', border: 'rgba(255, 255, 255, 0.15)' };

              const categoryLabel = isInfante ? 'Infante' : isNino ? 'Niño' : tipoPax === '' ? '' : 'Adulto';
              const ageSummary = isDateDoc && p.documento ? getBirthdateSummary(p.documento) : '';

              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,250, 0.03)',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.18)',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#E87217', fontWeight: '600' }}>
                        {categoryLabel}
                      </span>
                      {/*<span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: badgeColor.bg,
                          color: badgeColor.text,
                          border: `1px solid ${badgeColor.border}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                        }}
                      >
                        {categoryLabel}
                      </span>
                      {ageSummary && (
                        <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: '600' }}>
                          ({ageSummary})
                        </span>
                      )} */}
                    </div>

                    {/*{(pax.ninos > 0 || pax.infantes > 0 || pax.adolescentes > 0) && (
                      <select
                        value={tipoPax}
                        onChange={e => handleUpdatePasajero(idx, 'tipo_pax', e.target.value)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: 'rgba(16, 28, 68, 0.95)',
                          border: '1px solid rgba(232, 114, 23, 0.4)',
                          color: '#FFF',
                          fontWeight: '600',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                        title="Cambiar categoría de este pasajero"
                      >
                        <option value="adulto">Adulto</option>
                        {pax.adolescentes > 0 && <option value="adolescente">Adolescente</option>}
                        {pax.ninos > 0 && <option value="nino">Niño</option>}
                        {pax.infantes > 0 && <option value="infante">Infante</option>}
                      </select>
                    )} */}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Nombres"
                      value={p.nombres}
                      onChange={e => handleUpdatePasajero(idx, 'nombres', e.target.value)}
                      maxLength={35}
                      className='erp-input'
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="Apellidos"
                      value={p.apellidos}
                      onChange={e => handleUpdatePasajero(idx, 'apellidos', e.target.value)}
                      maxLength={25}
                      className='erp-input'
                      style={{ flex: 1 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <CustomSelect
                      value={p.tipo_documento}
                      onChange={e => handleUpdatePasajero(idx, 'tipo_documento', e.target.value)}
                      style={{
                        width: (isInfante || isNino) ? '112px' : '75px',
                        flexShrink: 0,
                      }}
                    >
                      {isInfante ? (
                        <>
                          <option value="NAC">Fec. Nac.</option>
                          <option value="P">P-</option>
                        </>
                      ) : isNino ? (
                        <>
                          <option value="V">V-</option>
                          <option value="E">E-</option>
                          <option value="NAC">Fec. Nac.</option>
                          <option value="P">P-</option>
                        </>
                      ) : (
                        <>
                          <option value="V">V-</option>
                          <option value="E">E-</option>
                          <option value="J">J-</option>
                          <option value="P">P-</option>
                          <option value="G">G-</option>
                        </>
                      )}
                    </CustomSelect>

                    {isDateDoc ? (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <CustomDatePicker
                          type="date"
                          value={p.documento}
                          onChange={e => handleUpdatePasajero(idx, 'documento', e.target.value)}
                          placeholder="Fecha de Nacimiento"
                          max={new Date().toISOString().split('T')[0]}
                          style={{ width: '100%' }}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={p.tipo_documento === 'P' ? 'N° Pasaporte' : 'Cédula / Documento'}
                        value={p.documento}
                        onChange={e => handleUpdatePasajero(idx, 'documento', e.target.value)}
                        maxLength={p.tipo_documento === 'P' ? 20 : 12}
                        inputMode={p.tipo_documento === 'P' ? 'text' : 'numeric'}
                        className='erp-input'
                        style={{ flex: 1 }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Selector Dinámico de Productos (Hoteles, Vuelos, Traslados, Excursiones, etc.) */}
      <div style={{
        background: 'rgb(6, 18, 81)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        padding: '20px',
        marginBottom: items.length === 0 ? '20px' : '0px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={imgServicios} alt="Servicios" style={{ width: '24px', height: '24px' }} /> Agregar Productos
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="custom-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {PRODUCT_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const hasInfo = checkTabHasInfo(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: isActive
                    ? `1px solid ${tab.color}`
                    : hasInfo
                      ? `1px solid rgba(${tab.rgb}, 0.5)`
                      : '1px solid rgba(255,255,255,0.18)',
                  background: isActive
                    ? `rgba(${tab.rgb}, 0.22)`
                    : hasInfo
                      ? `rgba(${tab.rgb}, 0.12)`
                      : 'rgba(255, 255, 255, 0.05)',
                  boxShadow: isActive
                    ? `0 0 12px rgba(${tab.rgb}, 0.45)`
                    : hasInfo
                      ? `0 0 8px rgba(${tab.rgb}, 0.25)`
                      : 'none',
                  color: isActive
                    ? tab.color
                    : hasInfo
                      ? '#FFF'
                      : '#b9c8ddff',
                  fontWeight: isActive ? '600' : hasInfo ? '500' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease-in-out',
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
                <span>{tab.label}</span>
                {hasInfo && !isActive && (
                  isDraftReady(tab.id) ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        resetFormForTipo(tab.id);
                      }}
                      title={`Eliminar información de ${tab.label} para no agregarlo`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.12)',
                        color: tab.color,
                        fontSize: '10px',
                        fontWeight: 'bold',
                        marginLeft: '3px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#bbbbbb2f';
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.transform = 'scale(1.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.color = tab.color;
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ✕
                    </span>
                  ) : (
                    <span
                      title="Producto agregado al itinerario"
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: tab.color,
                        boxShadow: `0 0 6px ${tab.color}`,
                        display: 'inline-block',
                        marginLeft: '2px',
                      }}
                    />
                  )
                )}
              </button>
            );
          })}
        </div>

        {/* Banner visible cuando más de 1 producto tiene información reservada */}
        {readyDraftTypes.length > 1 && (() => {
          const hotelInDraft = readyDraftTypes.includes('hotel');
          const hasHotelsForGrouping = hotelInDraft || registeredHotels.length > 0;
          const nonHotelDrafts = readyDraftTypes.filter(t => t !== 'hotel');
          const groupTargetUid = selectedGroupingHotelUid || registeredHotels[0]?.uid || '';

          return (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(90deg, rgba(232, 114, 23, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
              border: '1px solid rgba(232, 114, 23, 0.45)',
              borderRadius: '12px',
              padding: '12px 18px',
              marginTop: '14px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#FFF', fontWeight: '600', fontSize: '0.875rem' }}>
                    Hay <strong>{readyDraftTypes.length} productos</strong> con información reservada lista:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {readyDraftTypes.map(t => {
                      const tabObj = PRODUCT_COLOR_MAP[t];
                      return (
                        <span
                          key={t}
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px 2px 5px',
                            borderRadius: '6px',
                            background: `rgba(${tabObj?.rgb || '255,255,255'}, 0.2)`,
                            border: `1px solid ${tabObj?.color || '#E87217'}`,
                            color: tabObj?.color || '#FFF',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetFormForTipo(t);
                            }}
                            title={`Eliminar ${tabObj?.label || t} para no agregarlo`}
                            style={{
                              background: 'rgba(255, 255, 255, 0.15)',
                              border: 'none',
                              color: tabObj?.color || '#FFF',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              lineHeight: 1,
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#bbbbbb2f';
                              e.currentTarget.style.color = '#FFFFFF';
                              e.currentTarget.style.transform = 'scale(1.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                              e.currentTarget.style.color = tabObj?.color || '#FFF';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            ✕
                          </button>
                          <span
                            onClick={() => setActiveTab(t)}
                            style={{ cursor: 'pointer' }}
                            title={`Ver / Editar ${tabObj?.label || t}`}
                          >
                            {tabObj?.label || t}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Acciones: Elección entre Agregar los servicios o Agrupar los servicios */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleAddAllReadyProducts}
                  className={hasHotelsForGrouping && nonHotelDrafts.length > 0 ? '' : 'btn-primary'}
                  style={hasHotelsForGrouping && nonHotelDrafts.length > 0 ? {
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    transition: 'all 0.15s ease',
                  } : {
                    padding: '9px 20px',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(232, 114, 23, 0.4)',
                    border: 'none',
                  }}
                  title="Agregar todos los productos como servicios independientes / generales"
                >
                  <img src={imgAgregar} alt="+" style={{ width: '15px', height: '15px' }} />
                  Agregar servicios
                </button>

                {hasHotelsForGrouping && nonHotelDrafts.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {!hotelInDraft && registeredHotels.length > 1 && (
                      <CustomSelect
                        value={groupTargetUid}
                        onChange={e => setSelectedGroupingHotelUid(e.target.value)}
                        style={{ padding: '7px 10px', fontSize: '0.8125rem', maxWidth: '200px' }}
                      >
                        {registeredHotels.map(h => (
                          <option key={h.uid} value={h.uid}>{h.titulo}</option>
                        ))}
                      </CustomSelect>
                    )}

                    <button
                      type="button"
                      onClick={() => handleGroupAllReadyProducts(hotelInDraft ? null : groupTargetUid)}
                      className="btn-primary"
                      style={{
                        padding: '9px 20px',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(232, 114, 23, 0.4)',
                        border: 'none',
                      }}
                      title="Agregar y agrupar automáticamente todos los servicios al hotel"
                    >
                      Agrupar servicios
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Dynamic Form per Tab */}
        <div style={{ marginTop: '20px' }}>
          {/* TAB HOTEL */}
          {activeTab === 'hotel' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label className='erp-label'>Ubicación</label>
                <CustomSelect
                  value={hotelForm.id_ubicacion}
                  onChange={e => setHotelForm({ ...hotelForm, id_ubicacion: e.target.value, id_hotel: '', id_habitacion: '' })}
                >
                  <option value="">Todas las ubicaciones</option>
                  {(catalogos.ubicaciones || []).map(u => (
                    <option key={u.id} value={u.id}>{u.ubicacion}</option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className='erp-label'>Hotel</label>
                <CustomSelect
                  value={hotelForm.id_hotel}
                  onChange={e => setHotelForm({ ...hotelForm, id_hotel: e.target.value, id_habitacion: '' })}
                >
                  <option value="">Seleccione un hotel...</option>
                  {filteredHoteles.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre}</option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className='erp-label'>Habitación</label>
                <CustomSelect
                  value={hotelForm.id_habitacion}
                  onChange={e => setHotelForm({ ...hotelForm, id_habitacion: e.target.value })}
                >
                  <option value="">Seleccione habitación...</option>
                  {(selectedHotel?.habitaciones || []).map(hab => (
                    <option key={hab.id} value={hab.id}>{hab.habitacion} (Cap: {hab.cantidad_personas})</option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className='erp-label'>Noches</label>
                <div style={{ display: 'flex' }}>
                  <CustomNumberInput
                    min={1}
                    max={999}
                    maxDigits={3}
                    value={hotelForm.noches}
                    onChange={e => {
                      const val = String(e.target.value).slice(0, 3);
                      setHotelForm({ ...hotelForm, noches: Math.max(1, Math.min(999, parseInt(val) || 1)) });
                    }}
                  />
                </div>
              </div>

              {/*
              <div>
                <label className='erp-label'>Tarifa Adulto ($/noche)</label>
                <div style={{ display: 'flex' }}>
                  <CustomNumberInput
                    step={0.01}
                    min={0}
                    max={99999.99}
                    allowDecimals
                    width="115px"
                    value={hotelForm.precio_noche_adulto}
                    onChange={e => setHotelForm({ ...hotelForm, precio_noche_adulto: sanitizePrecioCostoValue(e.target.value) })}
                  />
                </div>
              </div>
          */}

              <div>
                <button
                  type="button"
                  onClick={() => handleAddItem('hotel')}
                  className="btn-form-nxt"
                  style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
                  Agregar Hotel
                </button>
              </div>
            </div>
          )}

          {/* TAB VUELO */}
          {activeTab === 'vuelo' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label className='erp-label'>Aerolínea</label>
                <CustomSelect
                  value={vueloForm.id_aerolinea}
                  onChange={e => setVueloForm({ ...vueloForm, id_aerolinea: e.target.value })}
                >
                  <option value="">Seleccione aerolínea...</option>
                  {(catalogos.aerolineas || []).map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className='erp-label'>Itinerario</label>
                <input
                  type="text"
                  placeholder="Ej. CCS - PMV - CCS"
                  value={vueloForm.itinerario}
                  onChange={e => setVueloForm({ ...vueloForm, itinerario: e.target.value.slice(0, 100) })}
                  maxLength={100}
                  className="erp-input"
                />
              </div>

              <div>
                <label className='erp-label'>Fecha Vuelo</label>
                <CustomDatePicker
                  type="datetime-local"
                  value={vueloForm.fecha_vuelo}
                  onChange={e => setVueloForm({ ...vueloForm, fecha_vuelo: e.target.value })}
                />
              </div>

              <div>
                <label className='erp-label'>Tarifa Adulto ($)</label>
                <div style={{ display: 'flex' }}>
                  <CustomNumberInput
                    step={0.01}
                    min={0}
                    max={99999.99}
                    allowDecimals
                    width="115px"
                    value={vueloForm.precio_adulto}
                    onChange={e => setVueloForm({ ...vueloForm, precio_adulto: sanitizePrecioCostoValue(e.target.value) })}
                  />
                </div>
              </div>

              {pax.ninos > 0 && (
                <div>
                  <label className='erp-label'>Tarifa Niño ($)</label>
                  <div style={{ display: 'flex' }}>
                    <CustomNumberInput
                      step={0.01}
                      min={0}
                      max={99999.99}
                      allowDecimals
                      width="115px"
                      value={vueloForm.precio_nino}
                      onChange={e => setVueloForm({ ...vueloForm, precio_nino: sanitizePrecioCostoValue(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {pax.infantes > 0 && (
                <div>
                  <label className='erp-label'>Tarifa Infante ($)</label>
                  <div style={{ display: 'flex' }}>
                    <CustomNumberInput
                      step={0.01}
                      min={0}
                      max={99999.99}
                      allowDecimals
                      width="115px"
                      value={vueloForm.precio_infante}
                      onChange={e => setVueloForm({ ...vueloForm, precio_infante: sanitizePrecioCostoValue(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                {renderTabActionButtons('vuelo', 'Vuelo')}
              </div>
            </div>
          )}

          {/* TAB TRASLADO */}
          {activeTab === 'traslado' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
                <div>
                  <label className='erp-label'>Servicio de Traslado</label>
                  <CustomSelect
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
                  >
                    <option value="">Seleccione traslado...</option>
                    {(catalogos.traslados || []).map(t => (
                      <option key={t.id} value={t.id}>{t.ruta_origen} (${t.precio_publico})</option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className='erp-label'>Fecha y Hora</label>
                  <CustomDatePicker
                    type="datetime-local"
                    value={trasladoForm.fecha_traslado}
                    onChange={e => setTrasladoForm({ ...trasladoForm, fecha_traslado: e.target.value })}
                  />
                </div>

                {/*<div>
                  <label className='erp-label'>Precio Total ($)</label>
                  <div style={{ display: 'flex' }}>
                    <CustomNumberInput
                      step={0.01}
                      min={0}
                      max={99999.99}
                      allowDecimals
                      width="115px"
                      value={trasladoForm.precio}
                      onChange={e => setTrasladoForm({ ...trasladoForm, precio: sanitizePrecioCostoValue(e.target.value) })}
                    />
                  </div>
                </div>*/}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className='erp-label' style={{ margin: 0 }}>Observación (Opcional)</label>
                    <span style={{ fontSize: '0.75rem', color: (trasladoForm.observacion || '').length >= 200 ? '#EF4444' : '#b9c8ddff' }}>
                      {(trasladoForm.observacion || '').length} / 200 caracteres
                    </span>
                  </div>
                  <input
                    type="text"
                    value={trasladoForm.observacion}
                    onChange={e => setTrasladoForm({ ...trasladoForm, observacion: e.target.value.slice(0, 200) })}
                    placeholder="Ej: Vuelo Laser 912, equipaje extra... (máx. 200 caracteres)"
                    maxLength={200}
                    className="erp-input"
                  />
                </div>
              </div>

              {/* Personalización de Pasajeros si totalPax > 1 */}
              {totalPax > 1 && (
                <div style={{
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(232, 114, 23, 0.35)',
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#E87217', fontSize: '0.875rem' }}>
                        Personalizar traslado ({totalPax} pax en la cotización)
                      </strong>
                    </div>
                    {/*<span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Configure si este traslado es para todos, individual o subgrupo
                    </span>*/}
                  </div>

                  {/* Selector de tipo de asignación */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'todos', label: `Todos los pasajeros (${totalPax})` },
                      { id: 'individual', label: 'Traslado Individual (1 pax)' },
                      { id: 'grupo', label: 'Subgrupo Personalizado' },
                    ].map(opt => {
                      const active = (trasladoForm.tipo_asignacion || 'todos') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setTrasladoForm(prev => ({
                              ...prev,
                              tipo_asignacion: opt.id,
                              pax_individual_id: opt.id === 'individual' ? (prev.pax_individual_id ?? 0) : prev.pax_individual_id,
                              pax_seleccionados: opt.id === 'grupo' ? (prev.pax_seleccionados?.length ? prev.pax_seleccionados : [0, 1]) : prev.pax_seleccionados,
                            }));
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: active ? '1px solid #E87217' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: active ? 'rgba(232, 114, 23, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: active ? '#FFF' : '#94A3B8',
                            fontSize: '0.8125rem',
                            fontWeight: active ? '600' : '400',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: active ? '#E87217' : 'rgba(255, 255, 255, 0.3)',
                            display: 'inline-block',
                          }} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Contenido según tipo de asignación */}
                  {trasladoForm.tipo_asignacion === 'todos' && (
                    <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                      ¡Este servicio de traslado se registrará para <strong>los {totalPax} pasajeros</strong> del viaje!
                    </div>
                  )}

                  {trasladoForm.tipo_asignacion === 'individual' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <label className='erp-label'>Seleccione el Pasajero para este traslado individual</label>
                        <CustomSelect
                          value={trasladoForm.pax_individual_id ?? 0}
                          onChange={e => setTrasladoForm({ ...trasladoForm, pax_individual_id: Number(e.target.value) })}
                        >
                          {allPassengers.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} {p.documento ? `(Doc: ${p.documento})` : ''}
                            </option>
                          ))}
                        </CustomSelect>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#10B981', paddingTop: '16px' }}>
                        ✓ Traslado individual asignado a: <strong>{allPassengers.find(p => p.id === Number(trasladoForm.pax_individual_id ?? 0))?.nombreCorto || 'Pasajero'}</strong>
                      </div>
                    </div>
                  )}

                  {trasladoForm.tipo_asignacion === 'grupo' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className='erp-label' style={{ margin: 0 }}>
                          Seleccione los pasajeros asignados a este traslado:
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setTrasladoForm({ ...trasladoForm, pax_seleccionados: allPassengers.map(p => p.id) })}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#CBD5E1',
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Marcar Todos
                          </button>
                          <button
                            type="button"
                            onClick={() => setTrasladoForm({ ...trasladoForm, pax_seleccionados: [] })}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#CBD5E1',
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                        {allPassengers.map(p => {
                          const isChecked = (trasladoForm.pax_seleccionados || []).includes(p.id);
                          return (
                            <label
                              key={p.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: isChecked ? 'rgba(232, 114, 23, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                                border: isChecked ? '1px solid #E87217' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                                color: isChecked ? '#FFF' : '#94A3B8',
                                userSelect: 'none',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setTrasladoForm(prev => {
                                    const curr = prev.pax_seleccionados || [];
                                    const next = curr.includes(p.id) ? curr.filter(x => x !== p.id) : [...curr, p.id];
                                    return { ...prev, pax_seleccionados: next };
                                  });
                                }}
                                style={{ accentColor: '#E87217', cursor: 'pointer' }}
                              />
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {p.nombre}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <div style={{ marginTop: '10px', fontSize: '0.8125rem', color: (trasladoForm.pax_seleccionados?.length > 0) ? '#10B981' : '#EF4444' }}>
                        {(trasladoForm.pax_seleccionados?.length > 0)
                          ? `✓ ${(trasladoForm.pax_seleccionados || []).length} de ${totalPax} pasajeros seleccionados`
                          : 'Debe seleccionar al menos un pasajero para el traslado grupal'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                {renderTabActionButtons('traslado', 'Traslado')}
              </div>
            </div>
          )}

          {/* TAB EXCURSIÓN */}
          {activeTab === 'excursion' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label className='erp-label'>Excursión</label>
                <CustomSelect
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
                >
                  <option value="">Seleccione excursión...</option>
                  {(catalogos.excursiones || []).map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.tipo_excursion} (${ex.precio_adulto})</option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className='erp-label'>Fecha</label>
                <CustomDatePicker
                  value={excursionForm.fecha}
                  onChange={e => setExcursionForm({ ...excursionForm, fecha: e.target.value })}
                />
              </div>

              <div>
                <label className='erp-label'>Tarifa Adulto ($)</label>
                <div style={{ display: 'flex' }}>
                  <CustomNumberInput
                    step={0.01}
                    min={0}
                    max={99999.99}
                    allowDecimals
                    width="115px"
                    value={excursionForm.precio_adulto}
                    onChange={e => setExcursionForm({ ...excursionForm, precio_adulto: sanitizePrecioCostoValue(e.target.value) })}
                  />
                </div>
              </div>

              {pax.ninos > 0 && (
                <div>
                  <label className='erp-label'>Tarifa Niño ($)</label>
                  <div style={{ display: 'flex' }}>
                    <CustomNumberInput
                      step={0.01}
                      min={0}
                      max={99999.99}
                      allowDecimals
                      width="115px"
                      value={excursionForm.precio_nino}
                      onChange={e => setExcursionForm({ ...excursionForm, precio_nino: sanitizePrecioCostoValue(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                {renderTabActionButtons('excursion', 'Excursión')}
              </div>
            </div>
          )}

          {/* TAB PAQUETE */}
          {activeTab === 'paquete' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label className='erp-label'>Paquete Turístico</label>
                <CustomSelect
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
                >
                  <option value="">Seleccione paquete...</option>
                  {(catalogos.paquetes || []).map(p => (
                    <option key={p.id} value={p.id}>{p.paquete} (${p.precio_adulto})</option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className='erp-label'>Fecha</label>
                <CustomDatePicker
                  value={paqueteForm.fecha}
                  onChange={e => setPaqueteForm({ ...paqueteForm, fecha: e.target.value })}
                />
              </div>

              <div>
                <label className='erp-label'>Tarifa Adulto ($)</label>
                <div style={{ display: 'flex' }}>
                  <CustomNumberInput
                    step={0.01}
                    min={0}
                    max={99999.99}
                    allowDecimals
                    width="115px"
                    value={paqueteForm.precio_adulto}
                    onChange={e => setPaqueteForm({ ...paqueteForm, precio_adulto: sanitizePrecioCostoValue(e.target.value) })}
                  />
                </div>
              </div>

              {pax.ninos > 0 && (
                <div>
                  <label className='erp-label'>Tarifa Niño ($)</label>
                  <div style={{ display: 'flex' }}>
                    <CustomNumberInput
                      step={0.01}
                      min={0}
                      max={99999.99}
                      allowDecimals
                      width="115px"
                      value={paqueteForm.precio_nino}
                      onChange={e => setPaqueteForm({ ...paqueteForm, precio_nino: sanitizePrecioCostoValue(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                {renderTabActionButtons('paquete', 'Paquete')}
              </div>
            </div>
          )}

          {/* TAB VEHÍCULO */}
          {activeTab === 'vehiculo' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label className='erp-label'>Vehículo</label>
                <CustomSelect
                  value={vehiculoForm.id_vehiculo}
                  onChange={e => setVehiculoForm({ ...vehiculoForm, id_vehiculo: e.target.value })}
                >
                  <option value="">Seleccione vehículo...</option>
                  {(catalogos.vehiculos || []).map(v => (
                    <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.categoria})</option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className='erp-label'>Días de Alquiler</label>
                <div style={{ display: 'flex' }}>
                  <CustomNumberInput
                    min={1}
                    max={99}
                    maxDigits={2}
                    value={vehiculoForm.dias}
                    onChange={e => {
                      const val = String(e.target.value).slice(0, 2);
                      setVehiculoForm({ ...vehiculoForm, dias: Math.max(1, Math.min(99, parseInt(val) || 1)) });
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                {renderTabActionButtons('vehiculo', 'Vehículo')}
              </div>
            </div>
          )}

          {/* TAB FERRY */}
          {activeTab === 'ferry' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <label className='erp-label'>Ruta</label>
                <input
                  type="text"
                  placeholder="Ej. Puerto La Cruz - Punta de Piedras"
                  value={ferryForm.ruta}
                  onChange={e => setFerryForm({ ...ferryForm, ruta: e.target.value.slice(0, 12) })}
                  maxLength={12}
                  className="erp-input"
                />
              </div>

              <div>
                <label className='erp-label'>Tarifa Adulto ($)</label>
                <div style={{ display: 'flex' }}>
                  <CustomNumberInput
                    step={0.01}
                    min={0}
                    max={99999.99}
                    allowDecimals
                    width="115px"
                    value={ferryForm.precio_adulto}
                    onChange={e => setFerryForm({ ...ferryForm, precio_adulto: sanitizePrecioCostoValue(e.target.value) })}
                  />
                </div>
              </div>

              {pax.ninos > 0 && (
                <div>
                  <label className='erp-label'>Tarifa Niño ($)</label>
                  <div style={{ display: 'flex' }}>
                    <CustomNumberInput
                      step={0.01}
                      min={0}
                      max={99999.99}
                      allowDecimals
                      width="115px"
                      value={ferryForm.precio_nino}
                      onChange={e => setFerryForm({ ...ferryForm, precio_nino: sanitizePrecioCostoValue(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {pax.infantes > 0 && (
                <div>
                  <label className='erp-label'>Tarifa Infante ($)</label>
                  <div style={{ display: 'flex' }}>
                    <CustomNumberInput
                      step={0.01}
                      min={0}
                      max={99999.99}
                      allowDecimals
                      width="115px"
                      value={ferryForm.precio_infante}
                      onChange={e => setFerryForm({ ...ferryForm, precio_infante: sanitizePrecioCostoValue(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className='erp-label'>Vehículos adicionales ($)</label>
                <div style={{ display: 'flex' }}>
                  <CustomNumberInput
                    step={0.01}
                    min={0}
                    max={99999.99}
                    allowDecimals
                    width="115px"
                    value={ferryForm.precio_vehiculo}
                    onChange={e => setFerryForm({ ...ferryForm, precio_vehiculo: sanitizePrecioCostoValue(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                {renderTabActionButtons('ferry', 'Ferry')}
              </div>
            </div>
          )}

          {/* TAB OTRO */}
          {activeTab === 'otro' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className='erp-label' style={{ margin: 0 }}>Descripción del Servicio</label>
                  <span style={{ fontSize: '0.75rem', color: (otroForm.descripcion || '').length >= 60 ? '#EF4444' : '#b9c8ddff' }}>
                    {(otroForm.descripcion || '').length} / 60 caracteres
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Ej. Seguro de Viaje, Asistencia Médica... (máx. 60 caracteres)"
                  value={otroForm.descripcion}
                  onChange={e => setOtroForm({ ...otroForm, descripcion: e.target.value.slice(0, 60) })}
                  maxLength={60}
                  className="erp-input"
                />
              </div>

              <div>
                <label className='erp-label'>Precio Venta ($)</label>
                <div style={{ display: 'flex' }}>
                  <CustomNumberInput
                    step={0.01}
                    min={0}
                    max={99999.99}
                    allowDecimals
                    width="115px"
                    value={otroForm.precio}
                    onChange={e => setOtroForm({ ...otroForm, precio: sanitizePrecioCostoValue(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                {renderTabActionButtons('otro', 'Servicio')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Carrito de Productos Agregados */}
      {items.length > 0 && (
        <div style={{
          background: 'rgb(97 157 255 / 8%)',
          borderRadius: '16px',
          border: '1px solid rgb(255 255 255 / 34%)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: 0 }}>
                Resumen de Productos
                <span style={{ color: '#60A5FA', fontWeight: '600', fontSize: '1.325rem' }}>  {items.length} </span>
              </h2>

              {registeredHotels.length > 0 && (
                <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '3px', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setViewMode('agrupado')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: viewMode === 'agrupado' ? '#E87217' : 'transparent',
                      color: viewMode === 'agrupado' ? '#FFF' : '#CBD5E1',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Agrupados
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('plano')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: viewMode === 'plano' ? '#E87217' : 'transparent',
                      color: viewMode === 'plano' ? '#FFF' : '#CBD5E1',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Productos
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleClearItems}
              style={{
                background: 'rgb(255 0 0 / 14%)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#EF4444',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
              }}
            >
              Vaciar Lista
            </button>
          </div>

          {/* VISTA AGRUPADA POR HOTEL */}
          {viewMode === 'agrupado' && registeredHotels.length > 0 ? (
            <div>
              {registeredHotels.map(h => {
                const hotelItems = items.filter(it => it.tipo !== 'hotel' && it.hotel_item_uid === h.uid);
                const subtotalHotelYServicios = Number(h.precio || 0) + hotelItems.reduce((acc, it) => acc + Number(it.precio || 0), 0);

                return (
                  <div
                    key={h.uid}
                    style={{
                      marginBottom: '20px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(232, 114, 23, 0.4)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Hotel Header Banner */}
                    <div
                      style={{
                        background: 'linear-gradient(90deg, rgba(232, 114, 23, 0.22) 0%, rgba(37, 99, 235, 0.15) 100%)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderBottom: '1px solid rgba(232, 114, 23, 0.3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ color: '#FFF', fontSize: '1rem' }}>{h.titulo}</strong>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Subtotal
                              </div>
                              <div style={{ fontSize: '1.15rem', fontWeight: '600', color: '#34D399' }}>
                                ${subtotalHotelYServicios.toFixed(2)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setItemToEdit(h)}
                              style={{
                                background: 'rgba(37, 99, 235, 0.2)',
                                border: '1px solid rgba(37, 99, 235, 0.4)',
                                color: '#60A5FA',
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Editar hotel"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(h)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#EF4444',
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Eliminar hotel"
                            >
                              ✕
                            </button>
                            {/*<span style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: 'rgba(232, 114, 23, 0.35)',
                              border: '1px solid #E87217',
                              color: '#FDBA74',
                              fontWeight: '600',
                            }}>
                              Hotel
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: 'rgba(59, 130, 246, 0.25)',
                              border: '1px solid #3B82F6',
                              color: '#93C5FD',
                              fontWeight: '600',
                            }}>
                              {hotelItems.length} {hotelItems.length === 1 ? 'servicio agrupado' : 'servicios agrupados'}
                            </span>*/}
                          </div>
                          <div style={{ color: '#CBD5E1', fontSize: '0.8rem', marginTop: '2px' }}>
                            {h.detalle}: <strong>${Number(h.precio || 0).toFixed(2)} USD</strong>
                          </div>
                        </div>
                      </div>

                      {/*<div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          
                          <button
                            type="button"
                            onClick={() => setHotelToGroup(h)}
                            style={{
                              background: 'rgba(232, 114, 23, 0.25)',
                              border: '1px solid #E87217',
                              color: '#FDBA74',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                            title="Vincular o desvincular servicios a este hotel"
                          >
                             Agrupar Servicios
                          </button> 
                        </div>
                      </div>*/}
                    </div>

                    {/* Services Table inside this Hotel */}
                    {hotelItems.length === 0 ? (
                      <div style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#94A3B8',
                        fontSize: '0.8125rem',
                        background: 'rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}>
                        {/*<span>Sin servicios adicionales agrupados a este hotel.</span>
                        <button
                          type="button"
                          onClick={() => setHotelToGroup(h)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#E87217',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '0.8125rem',
                          }}
                        >
                          + Agrupar productos existentes
                        </button>*/}
                      </div>
                    ) : (
                      <div className="custom-scrollbar" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', background: 'rgba(0,0,0,0.15)' }}>
                              <th style={{ padding: '8px 12px' }}>Tipo</th>
                              <th style={{ padding: '8px 12px' }}>Descripción</th>
                              <th style={{ padding: '8px 12px' }}>Detalles / Pax</th>
                              <th style={{ padding: '8px 12px' }}>Hotel Asignado</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Monto (USD)</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hotelItems.map(item => (
                              <tr key={item.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#FFF' }}>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{ textTransform: 'capitalize', fontWeight: '600', color: PRODUCT_COLOR_MAP[item.tipo]?.color || '#E87217' }}>
                                    {item.tipo}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: '500' }}>{item.titulo}</td>
                                <td style={{ padding: '10px 12px', color: '#CBD5E1', fontSize: '0.78rem' }}>{item.detalle}</td>
                                <td style={{ padding: '8px 12px', minWidth: '180px' }}>
                                  <CustomSelect
                                    value={item.hotel_item_uid || ''}
                                    onChange={e => handleAssignHotel(item.uid, e.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                  >
                                    <option value="">Desagrupar (General)</option>
                                    {registeredHotels.map(rh => (
                                      <option key={rh.uid} value={rh.uid}>{rh.titulo}</option>
                                    ))}
                                  </CustomSelect>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#F8FAFC' }}>
                                  ${Number(item.precio || 0).toFixed(2)}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => setItemToEdit(item)}
                                      style={{
                                        background: 'rgba(37, 99, 235, 0.2)',
                                        border: '1px solid rgba(37, 99, 235, 0.4)',
                                        color: '#60A5FA',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                      title="Editar producto"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setItemToDelete(item)}
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#EF4444',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                      title="Eliminar producto"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* SERVICIOS GENERALES / SIN HOTEL */}
              {(() => {
                const generalItems = items.filter(it => it.tipo !== 'hotel' && (!it.hotel_item_uid || !registeredHotels.some(rh => rh.uid === it.hotel_item_uid)));
                if (generalItems.length === 0) return null;
                const subtotalGeneral = generalItems.reduce((acc, it) => acc + Number(it.precio || 0), 0);

                return (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#FFF', fontSize: '0.9rem' }}>Servicios Generales</strong>
                      </div>
                      <div style={{ color: '#CBD5E1', fontSize: '0.85rem' }}>
                        Subtotal: <strong style={{ color: '#60A5FA' }}>${subtotalGeneral.toFixed(2)} USD</strong>
                      </div>
                    </div>

                    <div className="custom-scrollbar" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase', background: 'rgba(0,0,0,0.15)' }}>
                            <th style={{ padding: '8px 12px' }}>Tipo</th>
                            <th style={{ padding: '8px 12px' }}>Descripción</th>
                            <th style={{ padding: '8px 12px' }}>Detalles / Pax</th>
                            <th style={{ padding: '8px 12px' }}>Agrupar a Hotel</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Monto (USD)</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generalItems.map(item => (
                            <tr key={item.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#FFF' }}>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ textTransform: 'capitalize', fontWeight: '600', color: PRODUCT_COLOR_MAP[item.tipo]?.color || '#E87217' }}>
                                  {item.tipo}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: '500' }}>{item.titulo}</td>
                              <td style={{ padding: '10px 12px', color: '#CBD5E1', fontSize: '0.78rem' }}>{item.detalle}</td>
                              <td style={{ padding: '8px 12px', minWidth: '180px' }}>
                                <CustomSelect
                                  value={item.hotel_item_uid || ''}
                                  onChange={e => handleAssignHotel(item.uid, e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                >
                                  <option value="">Sin Hotel (General)</option>
                                  {registeredHotels.map(rh => (
                                    <option key={rh.uid} value={rh.uid}>{rh.titulo}</option>
                                  ))}
                                </CustomSelect>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#F8FAFC' }}>
                                ${Number(item.precio || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => setItemToEdit(item)}
                                    style={{
                                      background: 'rgba(37, 99, 235, 0.2)',
                                      border: '1px solid rgba(37, 99, 235, 0.4)',
                                      color: '#60A5FA',
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title="Editar producto"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setItemToDelete(item)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.2)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      color: '#EF4444',
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title="Eliminar producto"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* VISTA PLANA TRADICIONAL */
            <div className="custom-scrollbar" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.51)', color: '#c7d4e7ff', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Tipo</th>
                    <th style={{ padding: '10px 12px' }}>Descripción</th>
                    <th style={{ padding: '10px 12px' }}>Detalles / Pax</th>
                    {registeredHotels.length > 0 && (
                      <th style={{ padding: '10px 12px' }}>Hotel Asociado</th>
                    )}
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Monto (USD)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.51)', color: '#FFF', fontSize: '0.875rem' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: '600', color: PRODUCT_COLOR_MAP[item.tipo]?.color || '#E87217' }}>{item.tipo}</span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{item.titulo}</td>
                      <td style={{ padding: '12px', color: '#F8FAFC', fontSize: '0.8125rem' }}>{item.detalle}</td>
                      {registeredHotels.length > 0 && (
                        <td style={{ padding: '8px 12px', minWidth: '170px' }}>
                          {item.tipo === 'hotel' ? (
                            <span style={{ fontSize: '0.75rem', color: '#E87217', fontWeight: '600', background: 'rgba(232, 114, 23, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                              Hotel Base
                            </span>
                          ) : (
                            <CustomSelect
                              value={item.hotel_item_uid || ''}
                              onChange={e => handleAssignHotel(item.uid, e.target.value)}
                              style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                            >
                              <option value="">Sin Hotel</option>
                              {registeredHotels.map(rh => (
                                <option key={rh.uid} value={rh.uid}>{rh.titulo}</option>
                              ))}
                            </CustomSelect>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#F8FAFC' }}>
                        ${Number(item.precio || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          {item.tipo === 'hotel' && (
                            <button
                              type="button"
                              onClick={() => setHotelToGroup(item)}
                              style={{
                                background: 'rgba(232, 114, 23, 0.2)',
                                border: '1px solid #E87217',
                                color: '#FDBA74',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Agrupar servicios a este hotel"
                            >
                              Agrupar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setItemToEdit(item)}
                            style={{
                              background: 'rgba(37, 99, 235, 0.2)',
                              border: '1px solid rgba(37, 99, 235, 0.4)',
                              color: '#60A5FA',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Editar producto"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#EF4444',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Eliminar producto"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Plan de Cuotas & Resumen Financiero */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Card: Plan de Pagos por Cuotas */}
          <div style={{
            background: 'rgb(6, 18, 81)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: 0 }}>
                Financiamiento
              </h2>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: '500',
                color: enableCuotas ? '#E87217' : '#b9c8ddff',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgb(30, 41, 59)',
                transition: 'all 0.2s ease',
                boxShadow: enableCuotas
                  ? 'inset 3px 3px 6px rgb(0 0 0 / 74%), inset -3px -3px 6px rgb(255 255 255 / 22%)'
                  : '3px 3px 6px rgba(0, 0, 0, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.05)',
                border: enableCuotas ? '1px solid rgba(232, 114, 23, 0.3)' : '1px solid transparent',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={enableCuotas}
                  onChange={e => setEnableCuotas(e.target.checked)}
                  style={{ display: 'none' }}
                />
                Habilitar Cuotas
              </label>
            </div>

            {enableCuotas ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="erp-label">Modo de Pago Inicial</label>
                    <CustomSelect
                      value={cuotasConfig.modo}
                      onChange={e => setCuotasConfig({ ...cuotasConfig, modo: e.target.value })}
                    >
                      <option value="monto">Monto Fijo ($)</option>
                      <option value="porcentaje">Porcentaje (%)</option>
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="erp-label">
                      {cuotasConfig.modo === 'monto' ? 'Monto Inicial ($)' : 'Porcentaje Inicial (%)'}
                    </label>
                    <div style={{ display: 'flex' }}>
                      <CustomNumberInput
                        step={0.01}
                        min={0}
                        max={cuotasConfig.modo === 'porcentaje' ? 100 : 99999.99}
                        allowDecimals
                        width="115px"
                        value={cuotasConfig.valor_inicial}
                        onChange={e => {
                          const raw = e.target.value;
                          if (cuotasConfig.modo === 'porcentaje') {
                            const val = parseFloat(raw) || 0;
                            setCuotasConfig({ ...cuotasConfig, valor_inicial: Math.min(100, Math.max(0, val)) });
                          } else {
                            setCuotasConfig({ ...cuotasConfig, valor_inicial: sanitizePrecioCostoValue(raw) });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="erp-label">Número de Cuotas (1 a 12)</label>
                  <CustomSelect
                    value={cuotasConfig.numero_cuotas}
                    onChange={e => setCuotasConfig({ ...cuotasConfig, numero_cuotas: parseInt(e.target.value) || 1 })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <option key={n} value={n}>{n} Cuotas mensuales</option>
                    ))}
                  </CustomSelect>
                </div>

                {cuotasCalculadas && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.18)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#b9c8ddff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proyección Estimada:</span>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF' }}>
                        <span>Pago Inicial:</span>
                        <strong style={{ color: '#10B981' }}>${cuotasCalculadas.montoInicial.toFixed(2)} USD</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                        <span>Monto Financiado:</span>
                        <span style={{ color: '#E87217' }}>${cuotasCalculadas.montoRestante.toFixed(2)} USD</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF', borderTop: '1px solid rgba(255,255,255,0.51)', paddingTop: '6px' }}>
                        <span>{cuotasCalculadas.numeroCuotas} cuotas de:</span>
                        <strong style={{ color: '#E87217' }}>${cuotasCalculadas.montoPorCuota.toFixed(2)} USD</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#b9c8ddff', fontSize: '0.875rem', margin: '8px 0 0 0' }}>
                Active la casilla para configurar pagos financiados.
              </p>
            )}

            {/* Observations */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="erp-label" style={{ margin: 0 }}>Observaciones del Itinerario</label>
                <span style={{ fontSize: '0.75rem', color: (observacion || '').length >= 500 ? '#EF4444' : '#b9c8ddff', fontWeight: (observacion || '').length >= 500 ? '700' : '400' }}>
                  {(observacion || '').length} / 500 caracteres
                </span>
              </div>
              <textarea
                rows="3"
                value={observacion}
                onChange={handleObservacionChange}
                onKeyDown={handleObservacionKeyDown}
                placeholder="Condiciones de pago, políticas de cancelación o peticiones especiales (máximo 500 caracteres)..."
                maxLength={500}
                className="erp-input custom-scrollbar"
                style={{
                  resize: 'none',
                  height: '90px',
                  minHeight: '90px',
                  maxHeight: '90px',
                  overflowY: 'auto',
                  boxSizing: 'border-box',
                  width: '100%',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              />
            </div>
          </div>

          {/* Card: Panel de Totales y Persistencia */}
          <div style={{
            background: 'rgb(6, 18, 81)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: '0 0 16px 0' }}>
                Resumen Financiero
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b9c8ddff', fontSize: '0.9375rem' }}>
                  <span>Subtotal Servicios:</span>
                  <span style={{ color: '#FFF', fontWeight: '600' }}>${subtotalUSD.toFixed(2)} USD</span>
                </div>

                {referidoData && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontSize: '0.9375rem' }}>
                    <span>Descuento Referido ({referidoData.codigo}):</span>
                    <span>-$0.00 USD</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#b9c8ddff', fontSize: '0.875rem' }}>
                    Descuento Adicional:
                    {tipoDescuento === 'Porcentaje' && (parseFloat(descuentoAdicional) || 0) > 0 && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#10B981' }}>
                        (-${descuentoCalculadoMonto.toFixed(2)} USD)
                      </span>
                    )}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={descuentoAdicional}
                      onChange={handleDescuentoChange}
                      className="erp-input"
                      style={{ width: '100px', textAlign: 'right' }}
                      placeholder="0"
                      title={tipoDescuento === 'Porcentaje' ? 'Porcentaje de descuento (máx. 2 dígitos y decimales, ej. 15.5%)' : 'Monto de descuento en USD (máx. 3 dígitos y decimales, ej. 250.00)'}
                    />
                    <CustomSelect
                      value={tipoDescuento}
                      onChange={handleTipoDescuentoChange}
                      style={{
                        width: '100px',
                      }}
                    >
                      <option value="Porcentaje">%</option>
                      <option value="Monto">Monto ($)</option>
                    </CustomSelect>
                  </div>
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
                    {/*<div style={{ fontSize: '0.8125rem', color: '#b9c8ddff' }}>
                      Bs. {totalVES} (Ref. BCV)
                    </div>*/}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={handleSubmitCotizacion}
                disabled={isProcessing}
                className="btn-crear-cotizacion"
              >
                {submitting ? 'Creando Cotización...' : 'Crear Cotización'}
              </button>

              <button
                type="button"
                onClick={handleSubmitRapida}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isProcessing ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.2)',
                  border: '1px solid rgba(37, 99, 235, 0.4)',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1,
                  pointerEvents: isProcessing ? 'none' : 'auto',
                  transition: 'all 0.2s ease',
                }}
              >
                {submittingRapida ? 'Generando...' : ' Generar Cotización Rápida'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modales del itinerario */}
      <EliminarProductoModal
        isOpen={!!itemToDelete}
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={(uid) => {
          handleRemoveItem(uid);
          setItemToDelete(null);
        }}
      />

      <VaciarProductosModal
        isOpen={isVaciarModalOpen}
        totalItems={items.length}
        onClose={() => setIsVaciarModalOpen(false)}
        onConfirm={() => {
          setItems([]);
          setIsVaciarModalOpen(false);
        }}
      />

      <EditarProductoModal
        isOpen={!!itemToEdit}
        item={itemToEdit}
        catalogos={catalogos}
        allPassengers={allPassengers}
        registeredHotels={registeredHotels}
        onClose={() => setItemToEdit(null)}
        onSave={handleSaveEditedItem}
      />

      <AgruparProductosHotelModal
        isOpen={!!hotelToGroup}
        hotelItem={hotelToGroup}
        allItems={items}
        onClose={() => setHotelToGroup(null)}
        onSaveGroup={handleSaveHotelGrouping}
      />

      <InformeCotizacionRapidaModal
        isOpen={!!informeModalCotizacion}
        onClose={() => setInformeModalCotizacion(null)}
        cotizacion={informeModalCotizacion}
        tasaReferencialVES={tasaReferencialVES}
        onVerRegistro={onVerRegistro}
      />
    </div>
  );
}
