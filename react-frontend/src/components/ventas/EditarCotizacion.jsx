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
import { PRODUCT_COLOR_MAP } from '../cotizacion/cotizacionConstants';

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
          adultos,
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
          adultos,
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
          adultos,
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
          adultos,
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
          adultos,
          ninos,
          infantes,
          precio: 0,
          costo: 0,
        },
      };
  }
};

export default function EditarCotizacion({ ventaId, user, onVolver, tipoScope = 'agencia' }) {
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

  // Modales
  const [isRegistrarPagoOpen, setIsRegistrarPagoOpen] = useState(false);
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
  const paxCounts = useMemo(() => {
    let adultos = 1; // Titular
    let adolescentes = 0;
    let ninos = 0;
    let infantes = 0;

    pasajeros.forEach((p) => {
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
  }, [pasajeros]);

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

  const registeredHotels = useMemo(() => {
    return items.filter((it) => it.tipo === 'hotel');
  }, [items]);

  // Manejo de Pasajeros
  const handleAddPasajero = (categoria = 'adulto') => {
    const cfg = CATEGORIA_CONFIG[categoria] || CATEGORIA_CONFIG.adulto;
    setPasajeros((prev) => [
      ...prev,
      {
        uid: `new_${Date.now()}_${prev.length + 1}`,
        nombres: '',
        apellidos: '',
        tipo_documento: categoria === 'infante' ? 'NAC' : 'V',
        documento: '',
        edad: cfg.defaultEdad,
        tipo_pax: categoria,
        telefono: '',
        correo: '',
      },
    ]);
  };

  const handleRemovePasajero = (uid) => {
    setPasajeros((prev) => prev.filter((p) => p.uid !== uid));
  };

  const handlePasajeroChange = (uid, field, value) => {
    setPasajeros((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, [field]: value } : p))
    );
  };

  const handleCategoriaChange = (uid, newCat) => {
    setPasajeros((prev) =>
      prev.map((p) => {
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
      })
    );
  };

  const handleEdadChange = (uid, val) => {
    const edad = parseInt(val || 0, 10);
    const newCat = getTipoPaxFromEdad(edad);
    setPasajeros((prev) =>
      prev.map((p) => {
        if (p.uid !== uid) return p;
        return {
          ...p,
          edad,
          tipo_pax: newCat,
          tipo_documento: newCat === 'infante' && p.tipo_documento !== 'P' ? 'NAC' : p.tipo_documento,
        };
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
    if (isAddingProduct) {
      setItems((prev) => [...prev, savedItem]);
      showToast(`Servicio "${savedItem.titulo}" agregado al presupuesto.`, 'success');
    } else {
      setItems((prev) => prev.map((it) => (it.uid === savedItem.uid ? savedItem : it)));
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
          ← Volver a Ventas
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
            ← Volver a Ventas
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Ventas › <span style={{ textTransform: 'capitalize' }}>{tipoScope}</span> ›
              </span>
              <span style={{ fontSize: '0.8rem', color: '#E87217', fontWeight: 600 }}>
                {isConfirmed ? 'Ficha de Venta' : 'Editar Cotización'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF' }}>
                {isConfirmed ? `Venta: ${venta.localizador}` : `Editar Cotización: ${venta.localizador}`}
              </h1>
              <Badge variant={isConfirmed ? 'success' : 'warning'}>
                {isConfirmed ? 'Venta Confirmada' : 'Cotizacion'}
              </Badge>
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
              <span>✔</span>
              <span>Cambiar Estado a Venta Confirmada</span>
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
              minWidth: '130px',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
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
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase' }}>Ficha / Localizador</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
            #{venta.numero_ficha || 'N/A'} <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>({venta.localizador})</span>
          </div>
        </div>

        <div style={{ background: 'rgb(6, 18, 81)', border: '1px solid rgba(255, 255, 255, 0.18)', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase' }}>Total Contratado</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#E87217', marginTop: '4px' }}>
            ${Number(displayedTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>

        <div style={{ background: 'rgb(6, 18, 81)', border: '1px solid rgba(255, 255, 255, 0.18)', borderRadius: '12px', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase' }}>Total Recaudado / Pagado</span>
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

      {/* SECCIÓN 1: Gestión de Pasajeros (Titular y Acompañantes) */}
      <div
        style={{
          background: 'rgba(16, 28, 68, 0.72)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👥</span>
                <span>Datos del Cliente Titular y Pasajeros</span>
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
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              {isConfirmed
                ? 'En estado Venta Confirmada se permite actualizar datos de pasajeros existentes e incluir nuevos viajeros.'
                : 'Configure el pasajero titular y los acompañantes indicando si corresponden a Adulto, Adolescente, Niño o Infante.'}
            </p>
          </div>

          {/* Botones de Adición Rápida con Categoría */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8', marginRight: '4px' }}>+ Agregar:</span>
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
              <span>👤</span>
              <span>Adulto</span>
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
              <span>🧑</span>
              <span>Adolescente</span>
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
              <span></span>
              <span>Niño</span>
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
              <span></span>
              <span>Infante</span>
            </button>
          </div>
        </div>

        {/* Tarjeta: Pasajero Titular */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(232, 114, 23, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#E87217', color: '#FFFFFF' }}>
              TITULAR
            </span>
            <span style={{ color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 600 }}>Pasajero Principal (Adulto)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
                Documento / Cédula <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '80px', flexShrink: 0 }}>
                  <CustomSelect
                    options={TIPO_DOC_OPTIONS}
                    value={cliente.tipo_documento}
                    onChange={(val) => setCliente({ ...cliente, tipo_documento: val })}
                  />
                </div>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="12345678"
                  value={cliente.documento}
                  onChange={(e) => setCliente({ ...cliente, documento: formatCedula(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
                Nombres <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                className="erp-input"
                placeholder="Nombres completos"
                value={cliente.nombres}
                onChange={(e) => setCliente({ ...cliente, nombres: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
                Apellidos
              </label>
              <input
                type="text"
                className="erp-input"
                placeholder="Apellidos"
                value={cliente.apellidos}
                onChange={(e) => setCliente({ ...cliente, apellidos: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                className="erp-input"
                placeholder="+584121234567"
                value={cliente.telefono}
                onChange={(e) => setCliente({ ...cliente, telefono: formatTelefono(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                className="erp-input"
                placeholder="cliente@ejemplo.com"
                value={cliente.correo}
                onChange={(e) => setCliente({ ...cliente, correo: formatEmail(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Tarjetas: Pasajeros Acompañantes con Selector de Categoría */}
        {pasajeros.map((paxItem, index) => {
          const currentCat = paxItem.tipo_pax || getTipoPaxFromEdad(paxItem.edad);
          const catConfig = CATEGORIA_CONFIG[currentCat] || CATEGORIA_CONFIG.adulto;

          return (
            <div
              key={paxItem.uid}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${catConfig.border}`,
                borderRadius: '12px',
                padding: '16px 20px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header de la tarjeta del Acompañante */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.12)', color: '#E2E8F0' }}>
                    PAX #{index + 2}
                  </span>

                  {/* Badge de Categoría Actual */}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 9px',
                      borderRadius: '6px',
                      background: catConfig.bg,
                      color: catConfig.color,
                      border: `1px solid ${catConfig.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{catConfig.icon}</span>
                    <span>{catConfig.label} ({catConfig.sub})</span>
                  </span>

                  {/* Segmented Toggle de Categorías */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '2px 3px',
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
                          style={{
                            border: 'none',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: isSelected ? cat.bgSolid : 'transparent',
                            color: isSelected ? '#FFFFFF' : '#94A3B8',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title={`Cambiar a ${cat.label} (${cat.sub})`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePasajero(paxItem.uid)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  title="Eliminar acompañante"
                >
                  ✕ Remover
                </button>
              </div>

              {/* Formulario del Acompañante */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Documento / Cédula {currentCat === 'infante' && '(o Acta)'}
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '75px', flexShrink: 0 }}>
                      <CustomSelect
                        options={TIPO_DOC_OPTIONS}
                        value={paxItem.tipo_documento}
                        onChange={(val) => handlePasajeroChange(paxItem.uid, 'tipo_documento', val)}
                      />
                    </div>
                    <input
                      type="text"
                      className="erp-input"
                      placeholder="Documento"
                      value={paxItem.documento}
                      onChange={(e) => handlePasajeroChange(paxItem.uid, 'documento', formatCedula(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Nombres</label>
                  <input
                    type="text"
                    className="erp-input"
                    placeholder="Nombres"
                    value={paxItem.nombres}
                    onChange={(e) => handlePasajeroChange(paxItem.uid, 'nombres', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Apellidos</label>
                  <input
                    type="text"
                    className="erp-input"
                    placeholder="Apellidos"
                    value={paxItem.apellidos}
                    onChange={(e) => handlePasajeroChange(paxItem.uid, 'apellidos', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Edad ({catConfig.sub})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    className="erp-input"
                    value={paxItem.edad}
                    onChange={(e) => handleEdadChange(paxItem.uid, e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Teléfono</label>
                  <input
                    type="tel"
                    className="erp-input"
                    placeholder="Opcional"
                    value={paxItem.telefono}
                    onChange={(e) => handlePasajeroChange(paxItem.uid, 'telefono', formatTelefono(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
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
              <span>📦</span>
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
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    background: 'rgba(232, 114, 23, 0.15)',
                    border: '1px solid rgba(232, 114, 23, 0.4)',
                    borderRadius: '8px',
                    color: '#FB923C',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Edición Habilitada
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
                </tr>
              </thead>
              <tbody>
                {pagos.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
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
                        {p.fecha_creacion ? p.fecha_creacion.split('T')[0] : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4ADE80', fontWeight: 700, textAlign: 'right' }}>
                        ${Number(p.monto_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Badge variant="success">Procesado</Badge>
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
        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span></span>
          <span>Observaciones Generales</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
              Fecha Check-in
            </label>
            <CustomDatePicker
              value={checkin}
              onChange={(val) => setCheckin(val)}
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
              Fecha Check-out
            </label>
            <CustomDatePicker
              value={checkout}
              onChange={(val) => setCheckout(val)}
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
            Observaciones o Notas Internas
          </label>
          <textarea
            className="erp-input"
            rows={3}
            placeholder="Ingrese observaciones adicionales sobre este itinerario o cliente..."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
      </div>

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
              {[
                { tipo: 'hotel', label: 'Hotel', icon: '🏨', desc: 'Alojamiento y habitaciones' },
                { tipo: 'vuelo', label: 'Vuelo', icon: '✈️', desc: 'Boletería aérea nacional o internacional' },
                { tipo: 'traslado', label: 'Traslado', icon: '🚐', desc: 'Rutas terrestres o traslados VIP' },
                { tipo: 'excursion', label: 'Excursión', icon: '🎒', desc: 'Tours, paseos y full days' },
                { tipo: 'paquete', label: 'Paquete', icon: '📦', desc: 'Paquetes turísticos completos' },
                { tipo: 'vehiculo', label: 'Vehículo', icon: '🚗', desc: 'Alquiler de autos y camionetas' },
                { tipo: 'ferry', label: 'Ferry', icon: '🚢', desc: 'Pasajes y vehículos marítimos' },
                { tipo: 'otro', label: 'Otro', icon: '✨', desc: 'Servicios personalizados' },
              ].map((prod) => (
                <button
                  key={prod.tipo}
                  type="button"
                  onClick={() => handleSelectProductTypeToAdd(prod.tipo)}
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
                  <span style={{ fontSize: '2rem' }}>{prod.icon}</span>
                  <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.9rem' }}>{prod.label}</span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.2 }}>{prod.desc}</span>
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
                <li>Los servicios y productos quedarán bloqueados (fijos e inmutables).</li>
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
      {isRegistrarPagoOpen && (
        <RegistrarPagoModal
          isOpen={true}
          onClose={() => setIsRegistrarPagoOpen(false)}
          venta={venta}
          saldoPendiente={displayedSaldo}
          onPagoRegistrado={() => {
            fetchVentaDetalle();
            setIsRegistrarPagoOpen(false);
          }}
        />
      )}
    </div>
  );
}
