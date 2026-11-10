import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import CustomSelect from '../common/CustomSelect';
import CustomDatePicker from '../common/CustomDatePicker';
import CustomNumberInput from '../common/CustomNumberInput';
import { EditarProductoModal, EliminarProductoModal } from '../cotizacion/modals';
import { RegistrarPagoModal } from './modals';
import { showToast } from '../../utils/toast';
import { formatEmail, validateEmail, formatTelefono, formatCedula } from '../../utils/validation';
import { PRODUCT_COLOR_MAP, PRODUCT_TABS } from '../cotizacion/cotizacionConstants';
import { normalizeHotelAdolescentPassengers } from '../../utils/quotePricing';
import imgSearch from '../../assets/lupa.svg';
import imgUsuario from '../../assets/Usuario.svg';

const TIPO_DOC_OPTIONS = [
  { value: 'V', label: 'V-' },
  { value: 'E', label: 'E-' },
  { value: 'J', label: 'J-' },
  { value: 'P', label: 'P-' },
  { value: 'G', label: 'G-' },
  { value: 'NAC', label: 'NAC' },
];

const CATEGORIA_CONFIG = {
  adulto: {
    id: 'adulto',
    label: 'Adulto',
    sub: '18+ años',
    icon: '',
    color: '#60A5FA',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)',
    bgSolid: '#2563EB',
    defaultEdad: 25,
  },
  adolescente: {
    id: 'adolescente',
    label: 'Adolescente',
    sub: '12 - 17 años',
    icon: '',
    color: '#A78BFA',
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.4)',
    bgSolid: '#7C3AED',
    defaultEdad: 15,
  },
  nino: {
    id: 'nino',
    label: 'Niño',
    sub: '2 - 11 años',
    icon: '',
    color: '#34D399',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
    bgSolid: '#059669',
    defaultEdad: 8,
  },
  infante: {
    id: 'infante',
    label: 'Infante',
    sub: '0 - 1 año',
    icon: '',
    color: '#FBBF24',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    bgSolid: '#D97706',
    defaultEdad: 1,
  },
};

const getTipoPaxFromEdad = (edad) => {
  const e = Number(edad || 0);
  if (e < 2) return 'infante';
  if (e < 12) return 'nino';
  if (e < 18) return 'adolescente';
  return 'adulto';
};

const isPasajeroVacio = (p) =>
  !p?.nombres?.trim() && !p?.apellidos?.trim() && !String(p?.documento || '').trim();

const computePaxCounts = (pasajerosList) => {
  let adultos = 1; // Titular siempre cuenta como 1 adulto
  let adolescentes = 0;
  let ninos = 0;
  let infantes = 0;

  (pasajerosList || []).forEach((p) => {
    const cat = p.tipo_pax || getTipoPaxFromEdad(p.edad);
    if (cat === 'infante') infantes++;
    else if (cat === 'nino') ninos++;
    else if (cat === 'adolescente') adolescentes++;
    else adultos++;
  });

  return {
    total: adultos + adolescentes + ninos + infantes,
    adultos,
    adolescentes,
    ninos,
    infantes,
  };
};

const syncPasajerosWithPaxCounts = (prevPasajeros, { adultos = 1, adolescentes = 0, ninos = 0, infantes = 0 }) => {
  const neededAdultos = Math.max(0, (adultos || 1) - 1);
  const neededAdolescentes = Math.max(0, adolescentes || 0);
  const neededNinos = Math.max(0, ninos || 0);
  const neededInfantes = Math.max(0, infantes || 0);

  const pool = {
    adulto: (prevPasajeros || []).filter((p) => (p.tipo_pax || 'adulto') === 'adulto'),
    adolescente: (prevPasajeros || []).filter((p) => p.tipo_pax === 'adolescente'),
    nino: (prevPasajeros || []).filter((p) => p.tipo_pax === 'nino'),
    infante: (prevPasajeros || []).filter((p) => p.tipo_pax === 'infante'),
  };

  // Ordenar cada grupo para que los pasajeros con datos estén de primero (los vacíos se eliminan primero)
  Object.keys(pool).forEach((key) => {
    pool[key].sort((a, b) => {
      const aHasData = !isPasajeroVacio(a);
      const bHasData = !isPasajeroVacio(b);
      if (aHasData && !bHasData) return -1;
      if (!aHasData && bHasData) return 1;
      return 0;
    });
  });

  const next = [];

  const fillCategory = (category, count) => {
    const cfg = CATEGORIA_CONFIG[category] || CATEGORIA_CONFIG.adulto;
    for (let i = 0; i < count; i++) {
      if (pool[category] && pool[category].length > 0) {
        next.push(pool[category].shift());
      } else {
        next.push({
          uid: `new_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          nombres: '',
          apellidos: '',
          tipo_documento: category === 'infante' ? 'NAC' : 'V',
          documento: '',
          edad: cfg.defaultEdad,
          tipo_pax: category,
          telefono: '',
          correo: '',
        });
      }
    }
  };

  fillCategory('adulto', neededAdultos);
  fillCategory('adolescente', neededAdolescentes);
  fillCategory('nino', neededNinos);
  fillCategory('infante', neededInfantes);

  // Si quedaron pasajeros con datos en los pools, intentar rescatar su información en slots vacíos
  const leftoverWithData = Object.values(pool).flat().filter((p) => !isPasajeroVacio(p));
  if (leftoverWithData.length > 0) {
    for (let i = 0; i < next.length && leftoverWithData.length > 0; i++) {
      if (isPasajeroVacio(next[i])) {
        const displaced = leftoverWithData.shift();
        next[i] = {
          ...next[i],
          nombres: displaced.nombres || '',
          apellidos: displaced.apellidos || '',
          documento: displaced.documento || '',
          tipo_documento:
            next[i].tipo_pax === 'infante'
              ? (displaced.tipo_documento === 'P' ? 'P' : 'NAC')
              : (displaced.tipo_documento === 'NAC' ? 'V' : displaced.tipo_documento),
        };
      }
    }
  }

  return next;
};

const createBlankItem = (tipo, context = {}) => {
  const uid = `item_${tipo}_${Date.now()}`;
  const today = new Date().toISOString().split('T')[0];
  const checkin = context.checkin || today;
  const checkout = context.checkout || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];
  const adultos = Math.max(1, context.adultos || 1);
  const ninos = context.ninos || 0;
  const infantes = context.infantes || 0;
  const adolescente = context.adolescentes || 0;

  switch (tipo) {
    case 'hotel':
      return {
        uid,
        tipo: 'hotel',
        titulo: 'Nuevo Hotel',
        detalle: '1 noche • Hab: Estándar',
        precio: 0,
        data: {
          id_hotel: '',
          id_habitacion: '',
          id_ubicacion: '',
          tipo: 'Habitacion',
          tipo_habitacion: 'Estándar',
          noches: 1,
          adultos,
          adolescente,
          ninos,
          infantes,
          precio_noche_adulto: 0,
          precio_noche_adolescente: 0,
          precio_noche_nino: 0,
          costo_noche_adulto: 0,
          costo_noche_adolescente: 0,
          costo_noche_nino: 0,
          fecha_checkin: checkin,
          fecha_checkout: checkout,
        },
      };
    case 'vuelo':
      return {
        uid,
        tipo: 'vuelo',
        titulo: 'Nuevo Vuelo',
        detalle: 'Ruta aérea',
        precio: 0,
        data: {
          id_aerolinea: '',
          itinerario: '',
          fecha_vuelo: checkin,
          fecha_retorno: '',
          adultos: adultos + adolescente,
          ninos,
          infantes,
          precio_adulto: 0,
          precio_nino: 0,
          precio_infante: 0,
          costo_adulto: 0,
          costo_nino: 0,
          costo_infante: 0,
        },
      };
    case 'traslado':
      return {
        uid,
        tipo: 'traslado',
        titulo: 'Nuevo Traslado',
        detalle: `Fecha: ${checkin}`,
        precio: 0,
        data: {
          id_traslado: '',
          fecha_traslado: checkin,
          fecha_retorno: '',
          precio: 0,
          costo: 0,
          tipo_asignacion: 'todos',
          observacion: '',
        },
      };
    case 'excursion':
      return {
        uid,
        tipo: 'excursion',
        titulo: 'Nueva Excursión',
        detalle: `Fecha: ${checkin}`,
        precio: 0,
        data: {
          id_excursion: '',
          fecha: checkin,
          adultos: adultos + adolescente,
          ninos,
          infantes,
          precio_adulto: 0,
          precio_nino: 0,
          costo_adulto: 0,
          costo_nino: 0,
        },
      };
    case 'paquete':
      return {
        uid,
        tipo: 'paquete',
        titulo: 'Nuevo Paquete',
        detalle: `Fecha: ${checkin}`,
        precio: 0,
        data: {
          id_paquete: '',
          fecha: checkin,
          adultos: adultos + adolescente,
          ninos,
          infantes,
          precio_adulto: 0,
          precio_nino: 0,
          costo_adulto: 0,
          costo_nino: 0,
        },
      };
    case 'vehiculo':
      return {
        uid,
        tipo: 'vehiculo',
        titulo: 'Nuevo Vehículo',
        detalle: '1 día de alquiler',
        precio: 0,
        data: {
          id_vehiculo: '',
          desde: checkin,
          hasta: checkout,
          dias: 1,
          precio_unitario: 0,
          costo: 0,
          deposito_garantia: 0,
        },
      };
    case 'ferry':
      return {
        uid,
        tipo: 'ferry',
        titulo: 'Nuevo Ferry',
        detalle: `Salida: ${checkin} • Retorno: Por definir`,
        precio: 0,
        data: {
          ruta: '',
          clase: 'Turista',
          itinerario: '',
          fecha_salida: checkin,
          fecha_retorno: '',
          adultos: adultos + adolescente,
          ninos,
          infantes,
          vehiculos: 0,
          precio_adulto: 0,
          precio_nino: 0,
          precio_infante: 0,
          precio_vehiculo: 0,
        },
      };
    case 'otro':
    default:
      return {
        uid,
        tipo: 'otro',
        titulo: 'Nuevo Servicio',
        detalle: `Fecha: ${checkin}`,
        precio: 0,
        data: {
          descripcion: '',
          fecha: checkin,
          adultos: adultos + adolescente,
          ninos,
          infantes,
          precio: 0,
          costo: 0,
        },
      };
  }
};

export default function EditarCotizacion({
  ventaId,
  user,
  onVolver,
  tipoScope = 'agencia',
  sectionLabel = 'Ventas',
  backLabel = '← Volver',
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venta, setVenta] = useState(null);
  const [totales, setTotales] = useState(null);

  // Catálogos para modales de edición/adición
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

  // Form states
  const [observacion, setObservacion] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');

  // Cliente Principal
  const [cliente, setCliente] = useState({
    nombres: '',
    apellidos: '',
    tipo_documento: 'V',
    documento: '',
    edad: 30,
    telefono: '',
    correo: '',
  });

  // Pasajeros Acompañantes
  const [pasajeros, setPasajeros] = useState([]);

  // Items / Productos
  const [items, setItems] = useState([]);

  // Búsqueda y limpieza de cliente y acompañantes
  const [searchingClient, setSearchingClient] = useState(false);
  const [clientStatusMsg, setClientStatusMsg] = useState(null);

  // Modales
  const [isRegistrarPagoOpen, setIsRegistrarPagoOpen] = useState(false);
  const [pagoToEdit, setPagoToEdit] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddProductTypeModal, setShowAddProductTypeModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Carga inicial de catálogos
  useEffect(() => {
    axios.get('/v1/cotizaciones/catalogos')
      .then((res) => {
        if (res.data) setCatalogos(res.data);
      })
      .catch((err) => console.error('Error al cargar catálogos en edición:', err));
  }, []);

  // Carga inicial de datos de la venta
  const fetchVentaDetalle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/v1/ventas/${ventaId}`);
      const data = res.data || {};
      const v = data.venta || {};
      setVenta(v);
      setTotales(data.totales || null);

      setObservacion(v.observacion || '');
      setCheckin(v.checkin ? v.checkin.split('T')[0] : '');
      setCheckout(v.checkout ? v.checkout.split('T')[0] : '');

      // Cliente principal
      const cp =
        v.cliente_principal ||
        v.clientePrincipal ||
        (Array.isArray(v.personas) ? v.personas.find((p) => p.principal === 1 || p.principal === true) : null);
      if (cp) {
        setCliente({
          id: cp.id,
          nombres: cp.nombres || '',
          apellidos: cp.apellidos || '',
          tipo_documento: cp.tipo_documento || 'V',
          documento: cp.documento || '',
          edad: cp.edad || 30,
          telefono: cp.telefono || '',
          correo: cp.correo || '',
        });
      }

      // Pasajeros acompañantes
      const acomps = Array.isArray(v.personas)
        ? v.personas.filter((p) => p.principal !== 1 && p.principal !== true)
        : [];
      setPasajeros(
        acomps.map((p, idx) => ({
          uid: p.id ? `pax_db_${p.id}` : `pax_${idx}_${Date.now()}`,
          id: p.id,
          nombres: p.nombres || '',
          apellidos: p.apellidos || '',
          tipo_documento: p.tipo_documento || 'V',
          documento: p.documento || '',
          edad: p.edad || 0,
          tipo_pax: p.tipo_pax || getTipoPaxFromEdad(p.edad),
          telefono: p.telefono || '',
          correo: p.correo || '',
        }))
      );

      // Ítems de productos
      const itemsList = data.totales?.items || [];
      setItems(itemsList);
    } catch (err) {
      console.error('Error al cargar detalle de venta para edición:', err);
      showToast('Error al cargar la información del registro.', 'error');
    } finally {
      setLoading(false);
    }
  }, [ventaId]);

  useEffect(() => {
    fetchVentaDetalle();
  }, [fetchVentaDetalle]);

  const isConfirmed = useMemo(() => {
    if (!venta) return false;
    const est = (venta.estado || '').toLowerCase();
    return est === 'confirmada' || est === 'venta' || est === 'confirmado';
  }, [venta]);

  // Conteos de pasajeros por categoría
  const paxCounts = useMemo(() => computePaxCounts(pasajeros), [pasajeros]);

  // Lista de pasajeros para selectores de traslados/servicios
  const allPassengers = useMemo(() => {
    const list = [];
    if (cliente.nombres || cliente.documento) {
      list.push({
        id: 0,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        tipo_pax: 'adulto',
        nombre_completo: `${cliente.nombres} ${cliente.apellidos}`.trim() || 'Titular',
      });
    }
    pasajeros.forEach((p, idx) => {
      list.push({
        id: p.id || idx + 1,
        nombres: p.nombres,
        apellidos: p.apellidos,
        tipo_pax: p.tipo_pax || getTipoPaxFromEdad(p.edad),
        nombre_completo: `${p.nombres} ${p.apellidos}`.trim() || `Acompañante #${idx + 2}`,
      });
    });
    return list;
  }, [cliente, pasajeros]);

  // Grupos de acompañantes (15 por grupo) con filtro de búsqueda
  const PAX_PER_GROUP = 15;
  const [activePaxGroup, setActivePaxGroup] = useState(0);
  const [paxSearchTerm, setPaxSearchTerm] = useState('');
  const [paxCollapsed, setPaxCollapsed] = useState(false);

  useEffect(() => {
    const maxGroupIdx = Math.max(0, Math.ceil(pasajeros.length / PAX_PER_GROUP) - 1);
    if (activePaxGroup > maxGroupIdx) setActivePaxGroup(maxGroupIdx);
  }, [pasajeros.length, activePaxGroup]);

  const paxGroupsData = useMemo(() => {
    const total = Math.max(1, Math.ceil(pasajeros.length / PAX_PER_GROUP));
    const q = paxSearchTerm.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/g, '');
    const groups = [];

    for (let g = 0; g < total; g++) {
      const start = g * PAX_PER_GROUP;
      const end = Math.min(start + PAX_PER_GROUP, pasajeros.length);
      const slice = pasajeros.slice(start, end).map((p, offset) => ({ ...p, originalIndex: start + offset }));

      const isGroupExplicitMatch = Boolean(
        q && (`grupo ${g + 1}`.includes(q) || `g${g + 1}` === cleanQ || `grupo${g + 1}` === cleanQ || q === String(g + 1))
      );

      const matchingPassengers = slice.filter((p) => {
        if (!q || isGroupExplicitMatch) return true;
        const cat = p.tipo_pax || getTipoPaxFromEdad(p.edad);
        const catLabel = (CATEGORIA_CONFIG[cat]?.label || '').toLowerCase();
        const fullName = `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase();
        const doc = String(p.documento || '').toLowerCase();
        const docClean = doc.replace(/[^a-z0-9]/g, '');
        const num = String(p.originalIndex + 2);
        return (
          fullName.includes(q) ||
          doc.includes(q) ||
          (cleanQ && docClean.includes(cleanQ)) ||
          catLabel.includes(q) ||
          q === num ||
          q === `#${num}`
        );
      });

      groups.push({
        groupIndex: g,
        groupNumber: g + 1,
        startPax: start + 2,
        endPax: end + 1,
        allPassengers: slice,
        matchingPassengers,
      });
    }
    return groups;
  }, [pasajeros, paxSearchTerm]);

  const registeredHotels = useMemo(() => {
    return items.filter((it) => it.tipo === 'hotel');
  }, [items]);

  const handleLimpiarTitular = () => {
    setCliente((prev) => ({
      ...prev,
      documento: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
    }));
    setClientStatusMsg(null);
  };

  const hasClienteInfo = Boolean(
    cliente.documento?.trim() ||
    cliente.nombres?.trim() ||
    cliente.apellidos?.trim() ||
    cliente.telefono?.trim() ||
    cliente.correo?.trim()
  );

  const handleBuscarCliente = async () => {
    const doc = cliente.documento?.trim();
    if (!doc) {
      setClientStatusMsg({ type: 'warning', text: 'Ingrese un número de documento para buscar.' });
      return;
    }
    setSearchingClient(true);
    setClientStatusMsg(null);
    try {
      const res = await axios.get(`/v1/cotizaciones/cliente/${encodeURIComponent(doc)}`);
      if (res.data?.encontrado && res.data?.cliente) {
        const c = res.data.cliente;
        setCliente((prev) => ({
          ...prev,
          tipo_documento: c.tipo_documento || prev.tipo_documento || 'V',
          documento: c.documento || doc,
          nombres: c.nombres || '',
          apellidos: c.apellidos || '',
          edad: c.edad || prev.edad || 30,
          telefono: c.telefono || '',
          correo: c.correo || '',
        }));
        setClientStatusMsg({ type: 'success', text: `¡Cliente encontrado: ${c.nombres} ${c.apellidos}!` });
      } else {
        setClientStatusMsg({ type: 'info', text: 'Cliente no registrado. Puede ingresar los datos para registrarlo.' });
      }
    } catch (err) {
      setClientStatusMsg({ type: 'info', text: 'Cliente no registrado. Puede ingresar los datos para registrarlo.' });
    } finally {
      setSearchingClient(false);
    }
  };

  const hasAcompananteData = useMemo(() => {
    return pasajeros.some(
      (p) =>
        p.nombres?.trim() ||
        p.apellidos?.trim() ||
        p.documento?.trim() ||
        p.telefono?.trim()
    );
  }, [pasajeros]);

  const handleLimpiarAcompanantes = () => {
    setPasajeros((prev) =>
      prev.map((p) => ({
        ...p,
        documento: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        correo: '',
      }))
    );
    showToast('Campos de acompañantes limpiados.', 'info');
  };

  // Recalcular producto cuando cambian los pasajeros o la cantidad de pax
  const recalculateItemWithPax = useCallback(
    (item, newPax) => {
      if (!item || !item.data) return item;

      const tipo = item.tipo;
      const ad = Number(newPax.adultos || 1);
      const adol = Number(newPax.adolescentes || 0);
      const ni = Number(newPax.ninos || 0);
      const inf = Number(newPax.infantes || 0);

      if (tipo === 'hotel') {
        const noches = Number(item.data.noches || 1);
        const dias = noches > 0 ? noches + 1 : 1;
        const itemData = {
          ...item.data,
          adultos: ad,
          adolescente: adol,
          ninos: ni,
          infantes: inf,
        };
        const hotel = (catalogos.hoteles || []).find((h) => String(h.id) === String(itemData.id_hotel));
        const normalizedData = normalizeHotelAdolescentPassengers(itemData, hotel, catalogos.is_freelancer);

        const effAdultos = Number(normalizedData.adultos || 0);
        const effAdolescentes = Number(normalizedData.adolescente || 0);
        const effNinos = Number(normalizedData.ninos || 0);

        const precioUnitAdulto = Number(normalizedData.precio_noche_adulto || 0);
        const precioUnitAdol = Number(normalizedData.precio_noche_adolescente || 0);
        const precioUnitNino = Number(normalizedData.precio_noche_nino || 0);

        const precio =
          (effAdultos * precioUnitAdulto +
            effAdolescentes * precioUnitAdol +
            effNinos * precioUnitNino) *
          noches;

        return {
          ...item,
          precio,
          detalle: `${noches} noches • ${dias} días • ${effAdultos} adultos${effAdolescentes ? `, ${effAdolescentes} adol` : ''}, ${effNinos} niños`,
          data: {
            ...normalizedData,
            adultos: effAdultos,
            adolescente: effAdolescentes,
            ninos: effNinos,
            infantes: inf,
          },
        };
      }

      if (tipo === 'vuelo') {
        const totalAdults = ad + adol;
        const precio =
          totalAdults * Number(item.data.precio_adulto || 0) +
          ni * Number(item.data.precio_nino || 0) +
          inf * Number(item.data.precio_infante || 0);

        return {
          ...item,
          precio,
          detalle: `Salida: ${item.data.fecha_vuelo || 'Por definir'} • Retorno: ${item.data.fecha_retorno || 'Por definir'} • ${totalAdults} ad${ni > 0 ? `, ${ni} niños` : ''}${inf > 0 ? `, ${inf} inf` : ''}`,
          data: {
            ...item.data,
            adultos: totalAdults,
            ninos: ni,
            infantes: inf,
          },
        };
      }

      if (tipo === 'ferry') {
        const veh = Number(item.data.vehiculos || 0);
        const precio =
          ad * Number(item.data.precio_adulto || 0) +
          ni * Number(item.data.precio_nino || 0) +
          inf * Number(item.data.precio_infante || 0) +
          veh * Number(item.data.precio_vehiculo || 0);

        return {
          ...item,
          precio,
          detalle: `Salida: ${item.data.fecha_salida || 'Por definir'} • Retorno: ${item.data.fecha_retorno || 'Por definir'} • ${ad} ad${ni > 0 ? `, ${ni} niños` : ''}${inf > 0 ? `, ${inf} inf` : ''}, ${veh} veh`,
          data: {
            ...item.data,
            adultos: ad,
            ninos: ni,
            infantes: inf,
          },
        };
      }

      if (tipo === 'excursion' || tipo === 'paquete') {
        const precio =
          ad * Number(item.data.precio_adulto || 0) +
          ni * Number(item.data.precio_nino || 0);

        return {
          ...item,
          precio,
          detalle: `Fecha: ${item.data.fecha || 'Por definir'} • ${ad} ad, ${ni} niños`,
          data: {
            ...item.data,
            adultos: ad,
            ninos: ni,
          },
        };
      }

      return item;
    },
    [catalogos]
  );

  // Cambio de fechas del viaje (sincroniza noches y precios de hoteles)
  const handleTravelDateChange = (field, value) => {
    let newCheckin = checkin;
    let newCheckout = checkout;
    if (field === 'checkin') {
      newCheckin = value;
      setCheckin(value);
    } else {
      newCheckout = value;
      setCheckout(value);
    }

    const checkinTime = Date.parse(`${newCheckin}T00:00:00Z`);
    const checkoutTime = Date.parse(`${newCheckout}T00:00:00Z`);
    const noches =
      Number.isFinite(checkinTime) && Number.isFinite(checkoutTime)
        ? Math.max(0, Math.round((checkoutTime - checkinTime) / 86400000))
        : 0;
    const dias = noches > 0 ? noches + 1 : 0;

    if (noches > 0) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.tipo !== 'hotel') return item;
          const itemData = {
            ...item.data,
            fecha_checkin: newCheckin,
            fecha_checkout: newCheckout,
            noches,
          };
          const hotel = (catalogos.hoteles || []).find((h) => String(h.id) === String(itemData.id_hotel));
          const normalizedData = normalizeHotelAdolescentPassengers(itemData, hotel, catalogos.is_freelancer);
          const adultos = Number(normalizedData.adultos || 0);
          const adolescentes = Number(normalizedData.adolescente || 0);
          const ninos = Number(normalizedData.ninos || 0);
          const precio =
            (adultos * Number(normalizedData.precio_noche_adulto || 0) +
              adolescentes * Number(normalizedData.precio_noche_adolescente || 0) +
              ninos * Number(normalizedData.precio_noche_nino || 0)) *
            noches;

          return {
            ...item,
            data: normalizedData,
            precio,
            detalle: `${noches} noches • ${dias} días • ${adultos} adultos${adolescentes ? `, ${adolescentes} adol` : ''}, ${ninos} niños`,
          };
        })
      );
    }
  };

  // Manejo de Pasajeros
  const handleAddPasajero = (categoria = 'adulto') => {
    const cfg = CATEGORIA_CONFIG[categoria] || CATEGORIA_CONFIG.adulto;
    const newPax = {
      uid: `new_${Date.now()}_${pasajeros.length + 1}`,
      nombres: '',
      apellidos: '',
      tipo_documento: categoria === 'infante' ? 'NAC' : 'V',
      documento: '',
      edad: cfg.defaultEdad,
      tipo_pax: categoria,
      telefono: '',
      correo: '',
    };
    const nextPasajeros = [...pasajeros, newPax];
    setPasajeros(nextPasajeros);

    // Sincronizar automáticamente la cantidad de pax en los productos agregados
    const nextCounts = computePaxCounts(nextPasajeros);
    setItems((prev) =>
      prev.map((it) => {
        if (['hotel', 'vuelo', 'ferry', 'excursion', 'paquete'].includes(it.tipo)) {
          return recalculateItemWithPax(it, nextCounts);
        }
        return it;
      })
    );
  };

  const handleRemovePasajero = (uid) => {
    const nextPasajeros = pasajeros.filter((p) => p.uid !== uid);
    setPasajeros(nextPasajeros);

    // Ajustar el precio y pax de los productos al remover pasajero
    const nextCounts = computePaxCounts(nextPasajeros);
    setItems((prev) =>
      prev.map((it) => {
        if (['hotel', 'vuelo', 'ferry', 'excursion', 'paquete'].includes(it.tipo)) {
          return recalculateItemWithPax(it, nextCounts);
        }
        return it;
      })
    );
  };

  const handlePasajeroChange = (uid, field, value) => {
    setPasajeros((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, [field]: value } : p))
    );
  };

  const handleCategoriaChange = (uid, newCat) => {
    const nextPasajeros = pasajeros.map((p) => {
      if (p.uid !== uid) return p;
      const cfg = CATEGORIA_CONFIG[newCat] || CATEGORIA_CONFIG.adulto;
      let newEdad = p.edad;
      let newTipoDoc = p.tipo_documento;

      if (newCat === 'infante') {
        if (newEdad >= 2 || !newEdad) newEdad = 1;
        if (newTipoDoc !== 'NAC' && newTipoDoc !== 'P') newTipoDoc = 'NAC';
      } else if (newCat === 'nino') {
        if (newEdad < 2 || newEdad >= 12 || !newEdad) newEdad = 8;
        if (newTipoDoc === 'NAC') newTipoDoc = 'V';
      } else if (newCat === 'adolescente') {
        if (newEdad < 12 || newEdad >= 18 || !newEdad) newEdad = 15;
        if (newTipoDoc === 'NAC') newTipoDoc = 'V';
      } else {
        if (newEdad < 18 || !newEdad) newEdad = 25;
        if (newTipoDoc === 'NAC') newTipoDoc = 'V';
      }

      return {
        ...p,
        tipo_pax: newCat,
        edad: newEdad,
        tipo_documento: newTipoDoc,
      };
    });

    setPasajeros(nextPasajeros);
    const nextCounts = computePaxCounts(nextPasajeros);
    setItems((prev) =>
      prev.map((it) => {
        if (['hotel', 'vuelo', 'ferry', 'excursion', 'paquete'].includes(it.tipo)) {
          return recalculateItemWithPax(it, nextCounts);
        }
        return it;
      })
    );
  };

  const handleEdadChange = (uid, val) => {
    const edad = parseInt(val || 0, 10);
    const newCat = getTipoPaxFromEdad(edad);
    const nextPasajeros = pasajeros.map((p) => {
      if (p.uid !== uid) return p;
      return {
        ...p,
        edad,
        tipo_pax: newCat,
        tipo_documento: newCat === 'infante' && p.tipo_documento !== 'P' ? 'NAC' : p.tipo_documento,
      };
    });

    setPasajeros(nextPasajeros);
    const nextCounts = computePaxCounts(nextPasajeros);
    setItems((prev) =>
      prev.map((it) => {
        if (['hotel', 'vuelo', 'ferry', 'excursion', 'paquete'].includes(it.tipo)) {
          return recalculateItemWithPax(it, nextCounts);
        }
        return it;
      })
    );
  };

  // Manejo de Productos / Servicios
  const handleOpenAddProductTypeModal = () => {
    setShowAddProductTypeModal(true);
  };

  const handleSelectProductTypeToAdd = (tipo) => {
    setShowAddProductTypeModal(false);
    const blank = createBlankItem(tipo, {
      checkin,
      checkout,
      adultos: paxCounts.adultos,
      ninos: paxCounts.ninos,
      infantes: paxCounts.infantes,
      adolescentes: paxCounts.adolescentes,
    });
    setItemToEdit(blank);
    setIsAddingProduct(true);
  };

  const handleSaveProductItem = (savedItem) => {
    let nextItems;
    if (isAddingProduct) {
      nextItems = [...items, savedItem];
    } else {
      nextItems = items.map((it) => (it.uid === savedItem.uid ? savedItem : it));
    }

    // Si el producto define pax (ej. hotel, vuelo, ferry, excursión, paquete),
    // sincronizar bidireccionalmente las casillas de pasajeros acompañantes
    if (['hotel', 'vuelo', 'ferry', 'excursion', 'paquete'].includes(savedItem.tipo)) {
      const itemAdultos = Number(savedItem.data?.adultos || 1);
      const itemAdolescentes = Number(savedItem.data?.adolescente || savedItem.data?.adolescentes || 0);
      const itemNinos = Number(savedItem.data?.ninos || 0);
      const itemInfantes = Number(savedItem.data?.infantes || 0);

      const targetCounts = {
        adultos: itemAdultos,
        adolescentes: itemAdolescentes,
        ninos: itemNinos,
        infantes: itemInfantes,
      };

      // Ajustar/eliminar/añadir las casillas de pasajeros según el nuevo conteo de pax del producto
      setPasajeros((prev) => syncPasajerosWithPaxCounts(prev, targetCounts));

      // Sincronizar el resto de productos con la misma cantidad de pasajeros
      nextItems = nextItems.map((it) => {
        if (it.uid === savedItem.uid) return savedItem;
        if (['hotel', 'vuelo', 'ferry', 'excursion', 'paquete'].includes(it.tipo)) {
          return recalculateItemWithPax(it, targetCounts);
        }
        return it;
      });
    }

    setItems(nextItems);

    if (isAddingProduct) {
      showToast(`Servicio "${savedItem.titulo}" agregado al presupuesto.`, 'success');
    } else {
      showToast(`Servicio "${savedItem.titulo}" actualizado.`, 'success');
    }
    setItemToEdit(null);
    setIsAddingProduct(false);
  };

  const handleConfirmDeleteItem = (uid) => {
    setItems((prev) => prev.filter((it) => it.uid !== uid));
    setItemToDelete(null);
    showToast('Producto eliminado de la cotización.', 'info');
  };

  // Totales financieros calculados en vivo según los ítems
  const itemsTotalUSD = useMemo(() => {
    return items.reduce((acc, it) => acc + Number(it.precio || 0), 0);
  }, [items]);

  const displayedTotal = useMemo(() => {
    if (isConfirmed && totales) return totales.total_usd;
    return itemsTotalUSD;
  }, [isConfirmed, totales, itemsTotalUSD]);

  const totalPagado = useMemo(() => {
    return Number(totales?.total_pagado || venta?.total_pagado || 0);
  }, [totales, venta]);

  const displayedSaldo = useMemo(() => {
    return Math.max(0, displayedTotal - totalPagado);
  }, [displayedTotal, totalPagado]);

  // Guardar Cambios (Validando reglas condicionales)
  const handleSaveChanges = async (cambiarAConfirmada = false) => {
    if (saving) return;

    if (!cliente.nombres.trim()) {
      showToast('Debe ingresar el nombre del cliente titular.', 'warning');
      return;
    }
    if (cliente.correo && !validateEmail(cliente.correo).isValid) {
      showToast('El formato del correo del cliente titular es inválido.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        observacion,
        checkin,
        checkout,
        cliente,
        pasajeros: pasajeros.map((p) => ({
          ...p,
          edad: Number(p.edad || 0),
          tipo_pax: p.tipo_pax || getTipoPaxFromEdad(p.edad),
        })),
        cambiar_a_confirmada: Boolean(cambiarAConfirmada),
        items_replace: !isConfirmed,
        hoteles: items.filter((i) => i.tipo === 'hotel').map((i) => i.data || {}),
        vuelos: items.filter((i) => i.tipo === 'vuelo').map((i) => i.data || {}),
        excursiones: items.filter((i) => i.tipo === 'excursion').map((i) => i.data || {}),
        paquetes: items.filter((i) => i.tipo === 'paquete').map((i) => i.data || {}),
        traslados: items.filter((i) => i.tipo === 'traslado').map((i) => i.data || {}),
        vehiculos: items.filter((i) => i.tipo === 'vehiculo').map((i) => i.data || {}),
        ferries: items.filter((i) => i.tipo === 'ferry').map((i) => i.data || {}),
        otros: items.filter((i) => i.tipo === 'otro').map((i) => i.data || {}),
      };

      const res = await axios.put(`/v1/ventas/${ventaId}`, payload);
      showToast(
        cambiarAConfirmada
          ? '¡Venta confirmada exitosamente! Se han fijado los servicios y habilitado el módulo de pagos.'
          : 'Cambios guardados exitosamente.',
        'success'
      );
      if (res.data?.data) {
        setVenta(res.data.data.venta);
        setTotales(res.data.data.totales);
      } else {
        fetchVentaDetalle();
      }
      if (cambiarAConfirmada) {
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error('Error al guardar cambios de la cotización:', err);
      const msg = err.response?.data?.message || err.message || 'No se pudieron guardar los cambios.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            border: '3px solid rgba(232, 114, 23, 0.2)',
            borderTopColor: '#E87217',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Cargando datos de la cotización...</span>
      </div>
    );
  }

  if (!venta) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px' }}>
        <h3 style={{ color: '#FFFFFF' }}>Registro no encontrado</h3>
        <p style={{ color: '#94A3B8' }}>No se pudo recuperar la cotización solicitada.</p>
        <button type="button" className="btn-primary" onClick={onVolver}>
          {backLabel}
        </button>
      </div>
    );
  }

  const pagos = Array.isArray(venta.pagos) ? venta.pagos : [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '1380px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: '50px',
      }}
    >
      {/* Barra de Encabezado Superior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onVolver}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {backLabel}
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF' }}>
                {isConfirmed ? `Ficha de Venta: ${venta.numero_ficha}` : `Editar Cotización: ${venta.numero_ficha}`}
              </h1>
            </div>
          </div>
        </div>

        {/* Acciones principales del encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isConfirmed && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <span>Confirmar Venta </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveChanges(false)}
            disabled={saving}
            className="btn-primary"
            style={{
              padding: '9px 20px',
              fontSize: '0.875rem',
              fontWeight: 700,
              minWidth: '94px',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Franja de Métricas / Resumen Financiero */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div style={{ background: 'rgb(6, 18, 81)', border: '1px solid rgba(255, 255, 255, 0.18)', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase' }}>Número de ficha</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
            {venta.numero_ficha || 'N/A'}
          </div>
        </div>

        <div style={{ background: 'rgb(6, 18, 81)', border: '1px solid rgba(255, 255, 255, 0.18)', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase' }}>Total Contratado</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#E87217', marginTop: '4px' }}>
            ${Number(displayedTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>

        <div style={{ background: 'rgb(6, 18, 81)', border: '1px solid rgba(255, 255, 255, 0.18)', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase' }}>Total Pagado</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#4ADE80', marginTop: '4px' }}>
            ${Number(totalPagado).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>

        <div style={{ background: 'rgb(6, 18, 81)', border: '1px solid rgba(255, 255, 255, 0.18)', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase' }}>Saldo Pendiente</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: displayedSaldo > 0.01 ? '#F87171' : '#94A3B8', marginTop: '4px' }}>
            ${Number(displayedSaldo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>
      </div>

      {/* CUADRÍCULA SUPERIOR: 1. Pasajero Titular (Izquierda) & 2. Fechas del Viaje y Observaciones (Derecha) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Card: Pasajero Titular */}
        <div
          style={{
            background: 'rgb(6, 18, 81)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={imgUsuario} style={{ width: '20px', height: '20px' }} alt="" />
              <span>Pasajero Titular</span>
            </h2>
            {/*<button
              type="button"
              disabled={!hasClienteInfo}
              onClick={handleLimpiarTitular}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#FCA5A5',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: hasClienteInfo ? 'pointer' : 'not-allowed',
                opacity: hasClienteInfo ? 1 : 0.4,
                transition: 'all 0.15s ease',
              }}
              title="Limpiar información de los campos del titular"
            >
              <span></span>
              <span>Limpiar</span>
            </button>*/}
          </div>

          {/* Autocomplete Lookup Bar & Document Input */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
            <div style={{ width: '80px', minWidth: '80px', flexShrink: 0 }}>
              <CustomSelect
                options={TIPO_DOC_OPTIONS}
                value={cliente.tipo_documento}
                onChange={(val) => setCliente({ ...cliente, tipo_documento: val })}
              />
            </div>
            <input
              type="text"
              placeholder="Número de Documento"
              value={cliente.documento}
              onChange={(e) => setCliente({ ...cliente, documento: formatCedula(e.target.value) })}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarCliente()}
              maxLength={12}
              inputMode="numeric"
              className="erp-input"
              style={{ width: '100%' }}
            />
            <button
              type="button"
              onClick={handleBuscarCliente}
              disabled={searchingClient}
              className="btn-secondary-form"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', flexShrink: 0 }}
              title="Buscar..."
            >
              <img src={imgSearch} alt="Buscar" style={{ width: '16px', height: '16px' }} />
              {searchingClient ? '...' : 'Buscar'}
            </button>
          </div>

          {clientStatusMsg && (
            <div
              style={{
                fontSize: '0.8125rem',
                padding: '7px 12px',
                borderRadius: '6px',
                color: clientStatusMsg.type === 'success' ? '#10B981' : clientStatusMsg.type === 'warning' ? '#F59E0B' : '#60A5FA',
                background: clientStatusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : clientStatusMsg.type === 'warning' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(96, 165, 250, 0.12)',
                border: `1px solid ${clientStatusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : clientStatusMsg.type === 'warning' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(96, 165, 250, 0.35)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span>{clientStatusMsg.text}</span>
              <button
                type="button"
                onClick={() => setClientStatusMsg(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  lineHeight: 1,
                  padding: '0 4px',
                  opacity: 0.7,
                }}
                title="Cerrar mensaje"
              >
                ×
              </button>
            </div>
          )}

          {/* Form Fields: 2x2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="erp-label">Nombres <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="text"
                className="erp-input"
                placeholder="Nombre(s)"
                maxLength={35}
                value={cliente.nombres}
                onChange={(e) => setCliente({ ...cliente, nombres: e.target.value.slice(0, 35) })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="erp-label">Apellidos <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="text"
                className="erp-input"
                placeholder="Apellido(s)"
                maxLength={40}
                value={cliente.apellidos}
                onChange={(e) => setCliente({ ...cliente, apellidos: e.target.value.slice(0, 40) })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="erp-label">Teléfono</label>
              <input
                type="tel"
                className="erp-input"
                placeholder="+584120000000"
                maxLength={15}
                inputMode="tel"
                value={cliente.telefono}
                onChange={(e) => setCliente({ ...cliente, telefono: formatTelefono(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="erp-label" style={{ margin: 0 }}>Correo Electrónico</label>
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
                className="erp-input"
                placeholder="cliente@correo.com"
                maxLength={50}
                value={cliente.correo}
                onChange={(e) => setCliente({ ...cliente, correo: formatEmail(e.target.value) })}
                style={{
                  marginTop: '4px',
                  width: '100%',
                  borderColor: cliente.correo && !validateEmail(cliente.correo).isValid ? '#F59E0B' : undefined
                }}
              />
            </div>
          </div>
        </div>

        {/* Card: Fechas del Viaje y Observaciones */}
        <div
          style={{
            background: 'rgb(6, 18, 81)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', color: '#FFF', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Fechas del Viaje</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="erp-label">Fecha Check-in</label>
              <CustomDatePicker
                value={checkin}
                onChange={(val) => handleTravelDateChange('checkin', val)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <label className="erp-label">Fecha Check-out</label>
              <CustomDatePicker
                value={checkout}
                onChange={(val) => handleTravelDateChange('checkout', val)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label className="erp-label">Observaciones</label>
            <textarea
              className="erp-input"
              rows={3}
              placeholder="Ingrese observaciones adicionales sobre este itinerario o cliente..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              style={{ width: '100%', resize: 'vertical', flex: 1 }}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: Pasajeros Acompañantes (Debajo de la cuadrícula superior) */}
      <div
        style={{
          background: 'rgb(6, 18, 81)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={imgUsuario} style={{ width: '18px', height: '18px' }} alt="" />
                <span>Pasajeros Acompañantes ({pasajeros.length})</span>
                <button
                  type="button"
                  onClick={() => setPaxCollapsed((c) => !c)}
                  aria-expanded={!paxCollapsed}
                  title={paxCollapsed ? 'Desplegar acompañantes' : 'Plegar acompañantes'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: '6px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#CBD5E1',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: paxCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  {paxCollapsed ? 'Desplegar' : 'Plegar'}
                </button>
              </h2>
              {/* Badge resumen de categorías de pasajeros */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <strong style={{ color: '#FFFFFF' }}>{paxCounts.total} Pax</strong>
                <span>•</span>
                <span>{paxCounts.adultos} ADL</span>
                {paxCounts.adolescentes > 0 && <span>• {paxCounts.adolescentes} ADOL</span>}
                {paxCounts.ninos > 0 && <span>• {paxCounts.ninos} CHD</span>}
                {paxCounts.infantes > 0 && <span>• {paxCounts.infantes} INF</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {pasajeros.length > 0 && (
              <button
                type="button"
                disabled={!hasAcompananteData}
                onClick={handleLimpiarAcompanantes}
                title={hasAcompananteData ? 'Borrar los datos de todas las casillas de acompañantes' : 'No hay casillas con información'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#FCA5A5',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: hasAcompananteData ? 'pointer' : 'not-allowed',
                  opacity: hasAcompananteData ? 1 : 0.4,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Limpiar Todo</span>
              </button>
            )}

            {/* Botones de Adición Rápida con Categoría */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleAddPasajero('adulto')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 11px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.16)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#93C5FD',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title="Agregar Pasajero Adulto (18+ años)"
              >
                <span>+ Adulto</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddPasajero('adolescente')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 11px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.16)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#C4B5FD',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title="Agregar Pasajero Adolescente (12 a 17 años)"
              >
                <span>+ Adolescente</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddPasajero('nino')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 11px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#6EE7B7',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title="Agregar Pasajero Niño (2 a 11 años)"
              >
                <span>+ Niño</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddPasajero('infante')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 11px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.16)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#FCD34D',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title="Agregar Pasajero Infante (0 a 1 año)"
              >
                <span>+ Infante</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grupos de acompañantes (15 por grupo) + filtro */}
        {paxCollapsed ? null : pasajeros.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '28px 16px',
              color: '#94A3B8',
              fontSize: '0.875rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
            }}
          >
            No hay pasajeros acompañantes registrados en esta cotización. Utilice los botones superiores (+ Adulto, + Adolescente, etc.) para agregar acompañantes.
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '10px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div
                className="custom-scrollbar"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingRight: '6px',
                }}
              >
                {paxGroupsData.map((g) => {
                  const isActive = activePaxGroup === g.groupIndex;
                  const hasSearch = Boolean(paxSearchTerm.trim());
                  const matchCount = g.matchingPassengers.length;
                  const highlighted = hasSearch && matchCount > 0;
                  return (
                    <button
                      key={g.groupIndex}
                      type="button"
                      onClick={() => setActivePaxGroup(g.groupIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        border: isActive
                          ? '1px solid #2563EB'
                          : highlighted
                          ? '1px solid rgba(37, 99, 235, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.18)',
                        background: isActive
                          ? 'rgba(37, 99, 235, 0.22)'
                          : highlighted
                          ? 'rgba(37, 99, 235, 0.12)'
                          : 'rgba(255, 255, 255, 0.05)',
                        boxShadow: isActive ? '0 0 12px rgba(37, 99, 235, 0.45)' : 'none',
                        color: isActive ? '#93C5FD' : highlighted ? '#FFFFFF' : '#b9c8dd',
                        fontWeight: isActive ? 600 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease-in-out',
                        fontSize: '0.8125rem',
                        flexShrink: 0,
                      }}
                    >
                      <span>Grupo {g.groupNumber}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '1px 6px',
                          borderRadius: '5px',
                          background: isActive ? 'rgba(37, 99, 235, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? '#FFFFFF' : '#94A3B8',
                        }}
                      >
                        {g.startPax} - {g.endPax}
                      </span>
                      {hasSearch && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            background: matchCount > 0 ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                            color: matchCount > 0 ? '#FFFFFF' : '#64748B',
                          }}
                        >
                          {matchCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '200px', flexShrink: 0 }}>
                <img
                  src={imgSearch}
                  alt=""
                  style={{ position: 'absolute', left: '9px', width: '13px', height: '13px', opacity: 0.7, pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  className="erp-input"
                  placeholder={`Filtrar (${pasajeros.length})...`}
                  value={paxSearchTerm}
                  onChange={(e) => setPaxSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: '28px', height: '32px', fontSize: '0.78rem' }}
                />
              </div>
            </div>

            {(paxGroupsData[activePaxGroup]?.matchingPassengers?.length || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '0.85rem' }}>
                Ningún acompañante coincide con "{paxSearchTerm}" en este grupo.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
                  gap: '14px',
                  width: '100%',
                }}
              >
                {paxGroupsData[activePaxGroup].matchingPassengers.map((paxItem) => {
                  const currentCat = paxItem.tipo_pax || getTipoPaxFromEdad(paxItem.edad);
                  const catConfig = CATEGORIA_CONFIG[currentCat] || CATEGORIA_CONFIG.adulto;

                  return (
                    <div
                      key={paxItem.uid}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${catConfig.border}`,
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxSizing: 'border-box',
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#93C5FD',
                              background: 'rgba(37, 99, 235, 0.18)',
                              border: '1px solid rgba(37, 99, 235, 0.4)',
                              padding: '2px 7px',
                              borderRadius: '6px',
                            }}
                          >
                            #{paxItem.originalIndex + 2}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: catConfig.color }}>
                            {catConfig.icon} {catConfig.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePasajero(paxItem.uid)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#F87171',
                            borderRadius: '6px',
                            padding: '3px 9px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                          title="Eliminar acompañante"
                        >
                          ✕ Quitar
                        </button>
                      </div>

                      {/* Selector segmentado de categoría */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '3px',
                          background: 'rgba(0, 0, 0, 0.35)',
                          padding: '2px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {Object.values(CATEGORIA_CONFIG).map((cat) => {
                          const isSelected = currentCat === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleCategoriaChange(paxItem.uid, cat.id)}
                              title={`Cambiar a ${cat.label} (${cat.sub})`}
                              style={{
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 2px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: isSelected ? cat.bgSolid : 'transparent',
                                color: isSelected ? '#FFFFFF' : '#94A3B8',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input
                          type="text"
                          className="erp-input"
                          placeholder="Nombres"
                          value={paxItem.nombres}
                          onChange={(e) => handlePasajeroChange(paxItem.uid, 'nombres', e.target.value)}
                          style={{ width: '100%', minWidth: 0 }}
                        />
                        <input
                          type="text"
                          className="erp-input"
                          placeholder="Apellidos"
                          value={paxItem.apellidos}
                          onChange={(e) => handlePasajeroChange(paxItem.uid, 'apellidos', e.target.value)}
                          style={{ width: '100%', minWidth: 0 }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ width: '78px', flexShrink: 0 }}>
                          <CustomSelect
                            options={TIPO_DOC_OPTIONS}
                            value={paxItem.tipo_documento}
                            onChange={(val) => handlePasajeroChange(paxItem.uid, 'tipo_documento', val)}
                          />
                        </div>
                        <input
                          type="text"
                          className="erp-input"
                          placeholder={currentCat === 'infante' ? 'Documento (o Acta)' : 'Cédula / Documento'}
                          value={paxItem.documento}
                          onChange={(e) => handlePasajeroChange(paxItem.uid, 'documento', formatCedula(e.target.value))}
                          style={{ width: '100%', minWidth: 0 }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          className="erp-input"
                          title={`Edad (${catConfig.sub})`}
                          placeholder="Edad"
                          value={paxItem.edad}
                          onChange={(e) => handleEdadChange(paxItem.uid, e.target.value)}
                          style={{ width: '100%', minWidth: 0 }}
                        />
                        <input
                          type="tel"
                          className="erp-input"
                          placeholder="Teléfono (opcional)"
                          value={paxItem.telefono}
                          onChange={(e) => handlePasajeroChange(paxItem.uid, 'telefono', formatTelefono(e.target.value))}
                          style={{ width: '100%', minWidth: 0 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* SECCIÓN 2: Productos y Servicios Contratados */}
      <div
        style={{
          background: 'rgba(16, 28, 68, 0.72)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Servicios y Productos de la Cotización</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              {isConfirmed
                ? 'Los productos de esta venta se encuentran asegurados por estar en estado Venta Confirmada.'
                : 'Detalle de los servicios incluidos en el presupuesto. Puede editarlos, agregar nuevos o removerlos antes de confirmar.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isConfirmed ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '8px',
                  color: '#FCA5A5',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Servicios Bloqueados
              </div>
            ) : (
              <>
                <div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddProductTypeModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #E87217, #C25E10)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(232, 114, 23, 0.25)',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>+</span>
                  <span>Agregar Producto</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabla de Servicios Contratados */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#CBD5E1', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>TIPO</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>SERVICIO / PRODUCTO</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>DETALLE</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>MONTO USD</th>
                {isConfirmed ? (
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>ESTADO</th>
                ) : (
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center', width: '130px' }}>ACCIONES</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                    No se han registrado productos en esta cotización. Haga clic en "+ Agregar Producto" para incluir servicios.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr
                    key={it.uid || idx}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          textTransform: 'capitalize',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: PRODUCT_COLOR_MAP?.[it.tipo]?.color || '#E87217',
                        }}
                      >
                        {it.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 600 }}>
                      {it.titulo || 'Servicio'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                      {it.detalle || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 700, textAlign: 'right' }}>
                      ${Number(it.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {isConfirmed ? (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(74, 222, 128, 0.15)',
                            color: '#4ADE80',
                            border: '1px solid rgba(74, 222, 128, 0.3)',
                          }}
                        >
                          Fijo
                        </span>
                      </td>
                    ) : (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setItemToEdit(it);
                              setIsAddingProduct(false);
                            }}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.35)',
                              color: '#93C5FD',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s',
                            }}
                            title="Editar este producto"
                          >
                            <span></span>
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setItemToDelete(it)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#F87171',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s',
                            }}
                            title="Eliminar este producto"
                          >
                            <span>X</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 3: Módulo de Pagos y Abonos (Habilitado en Venta Confirmada) */}
      {isConfirmed && (
        <div
          style={{
            background: 'rgba(16, 28, 68, 0.72)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span></span>
                <span>Módulo de Pagos y Abonos</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Registro y conciliación de los pagos efectuados para esta venta.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRegistrarPagoOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.2s',
              }}
            >
              <span></span>
              <span>Registrar Abono</span>
            </button>
          </div>

          {/* Historial de Pagos */}
          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#CBD5E1', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>TRANSACCIÓN</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>MÉTODO</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>FECHA</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>MONTO USD</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>ESTADO</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {pagos.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                      No se han registrado pagos para esta venta aún.
                    </td>
                  </tr>
                ) : (
                  pagos.map((p, idx) => (
                    <tr
                      key={p.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 600 }}>
                        {p.numero_transaccion || `Pago #${p.id}`}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#CBD5E1' }}>
                        {p.metodo_pago?.nombre || p.tipo_pago || 'Transferencia'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {(p.fecha_pago || p.fecha_creacion) ? String(p.fecha_pago || p.fecha_creacion).split(/[T ]/)[0] : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4ADE80', fontWeight: 700, textAlign: 'right' }}>
                        ${Number(p.monto_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Badge variant="success">Procesado</Badge>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setPagoToEdit(p)}
                          title="Editar este pago (corregir monto o datos)"
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.35)',
                            color: '#93C5FD',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: Observaciones y Fechas Generales */}
      

      {/* MODAL 1: Selección de Categoría de Servicio a Agregar */}
      {showAddProductTypeModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddProductTypeModal(false)}
          title="Agregar Servicio o Producto a la Cotización"
          width="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '6px 0 12px 0' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8' }}>
              Seleccione la categoría del producto que desea añadir a este presupuesto:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
              }}
            >
              {PRODUCT_TABS.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleSelectProductTypeToAdd(prod.id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '16px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(232, 114, 23, 0.18)';
                    e.currentTarget.style.borderColor = '#E87217';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {typeof prod.icon === 'string' && !prod.icon.includes('/') && !prod.icon.includes('.') ? (
                    <span style={{ fontSize: '2rem' }}>{prod.icon}</span>
                  ) : (
                    <img src={prod.icon} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                  )}
                  <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.9rem' }}>{prod.label}</span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.2 }}>{prod.description}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Edición / Adición de Producto */}
      {Boolean(itemToEdit) && (
        <EditarProductoModal
          isOpen={true}
          item={itemToEdit}
          catalogos={catalogos}
          allPassengers={allPassengers}
          registeredHotels={registeredHotels}
          onClose={() => {
            setItemToEdit(null);
            setIsAddingProduct(false);
          }}
          onSave={handleSaveProductItem}
        />
      )}

      {/* MODAL 3: Confirmación de Eliminación de Producto */}
      {Boolean(itemToDelete) && (
        <EliminarProductoModal
          isOpen={true}
          item={itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDeleteItem}
        />
      )}

      {/* MODAL 4: Confirmación para cambiar estado a "Venta Confirmada" */}
      {showConfirmModal && (
        <ConfirmationModal
          isOpen={true}
          type="warning"
          title="Confirmar Pase a Venta Confirmada"
          subtitle="¿Está seguro de que desea confirmar esta venta?"
          content={
            <div style={{ color: '#E2E8F0', fontSize: '0.875rem', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 10px 0' }}>
                Al pasar a <strong>Venta Confirmada</strong>:
              </p>
              <ul style={{ margin: '0 0 10px 0', paddingLeft: '20px', color: '#FCD34D' }}>
                <li>Los servicios y productos quedarán bloqueados</li>
                <li>Se activará el módulo de pagos para el registro de abonos.</li>
                <li>Podrá seguir actualizando los datos de los pasajeros o añadir nuevos viajeros.</li>
              </ul>
              <p style={{ margin: 0 }}>
                Total a confirmar: <strong>${Number(displayedTotal).toFixed(2)} USD</strong>
              </p>
            </div>
          }
          confirmText="Sí, Confirmar Venta"
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={() => handleSaveChanges(true)}
        />
      )}

      {/* MODAL 5: Registro de Abono */}
      {(isRegistrarPagoOpen || pagoToEdit) && (
        <RegistrarPagoModal
          isOpen={true}
          pago={pagoToEdit}
          onClose={() => {
            setIsRegistrarPagoOpen(false);
            setPagoToEdit(null);
          }}
          venta={{
            ...venta,
            total_usd: displayedTotal,
            total_pagado: totalPagado,
            saldo_pendiente: displayedSaldo,
            cliente: {
              ...(venta.cliente || {}),
              nombre_completo: `${cliente.nombres} ${cliente.apellidos}`.trim() || 'Cliente General',
            },
          }}
          onSuccess={() => {
            fetchVentaDetalle();
            setIsRegistrarPagoOpen(false);
            setPagoToEdit(null);
          }}
        />
      )}
    </div>
  );
}
