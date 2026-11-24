import React, { useState, useMemo } from 'react';
import cotizacionFondoP1 from '../../../assets/cotizacion_fondo.jpg';
import cotizacionFondoP2 from '../../../assets/cotizacion_fondo_pagina2.jpg';
import ventaFondoMembrete from '../../../assets/ventas-plantillas.png';
import iconHoras from '../../../assets/icon_horas.png';
import iconDisponibilidad from '../../../assets/icon_disponibilidad.png';

// SVG Icons (Estrictamente SVGs de assets, CERO emojis)
import usuariosIcon from '../../../assets/Usuarios-01.svg';
import aerolineasIcon from '../../../assets/Aerolineas.svg';
import metodosPagoIcon from '../../../assets/Metodosdepago.svg';
import resumenFinancieroIcon from '../../../assets/resumen-financiero.svg';
import pencilSquareIcon from '../../../assets/pencil-square.svg';
import calendarioIcon from '../../../assets/calendario-01.svg';
import receiptIcon from '../../../assets/receipt.svg';
import usuarioIcon from '../../../assets/Usuario.svg';
import imprimirIcon from '../../../assets/Imprimir.svg';
import volverIcon from '../../../assets/Volver.svg';

export default function InformeCotizacionRapidaModal({
  isOpen,
  onClose,
  cotizacion,
  tipoInforme = 'cotizacion',
  tasaReferencialVES = 62.50,
  onVerRegistro,
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('todas'); // 'todas' | '1' | '2'
  const [forceGroupedView, setForceGroupedView] = useState('auto'); // 'auto' | 'grouped' | 'ungrouped'
  const [forcePageLocation, setForcePageLocation] = useState('auto'); // 'auto' | 'p1' | 'p2'
  const [currentView, setCurrentView] = useState(tipoInforme || 'cotizacion');

  if (!isOpen || !cotizacion) return null;

  const esModoVenta = currentView === 'venta';

  // =========================================================================
  // NORMALIZACIÓN DE DATOS GENERALES
  // =========================================================================

  // Helper seguro para extraer texto de cualquier campo que pueda ser string, número u objeto
  const getSafeString = (val, fallback = '') => {
    if (!val && val !== 0) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return val.nombre || val.nombre_publico || val.name || val.titulo || val.descripcion || fallback;
    }
    return fallback;
  };

  // Asesor
  const asesorNombre =
    typeof cotizacion.asesor === 'object' && cotizacion.asesor !== null
      ? cotizacion.asesor.name || cotizacion.asesor.nombre || `${cotizacion.asesor.first_name || ''} ${cotizacion.asesor.last_name || ''}`.trim() || 'Erick Herrera'
      : typeof cotizacion.vendedor === 'object' && cotizacion.vendedor !== null
      ? cotizacion.vendedor.name || cotizacion.vendedor.nombre || 'Erick Herrera'
      : typeof cotizacion.user === 'object' && cotizacion.user !== null
      ? cotizacion.user.name || cotizacion.user.nombre || 'Erick Herrera'
      : typeof cotizacion.asesor === 'string' && cotizacion.asesor.trim()
      ? cotizacion.asesor
      : 'Erick Herrera';

  // Cliente
  const clienteData = cotizacion.cliente || {};
  const clienteNombre =
    typeof clienteData === 'string'
      ? clienteData
      : typeof clienteData === 'object' && clienteData !== null
      ? clienteData.nombre_completo ||
        `${clienteData.nombres || ''} ${clienteData.apellidos || ''}`.trim() ||
        clienteData.nombre ||
        'prueba Development'
      : 'prueba Development';

  // Ficha y Fecha
  const numeroFicha =
    cotizacion.numero_ficha ||
    (cotizacion.id ? String(cotizacion.id) : 'N/A');

  const rawFecha = cotizacion.fecha || cotizacion.fecha_creacion || cotizacion.created_at || new Date().toISOString();
  
  const formatFechaDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const parts = String(dateStr).split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
          return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
        }
        return String(dateStr);
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return String(dateStr);
    }
  };

  const formatFechaSlash = (dateStr) => {
    const res = formatFechaDDMMYYYY(dateStr);
    return res.replace(/-/g, '/');
  };

  const fechaEmision = formatFechaDDMMYYYY(rawFecha);

  // Parámetros de Pasajeros
  const paxData = cotizacion.pax || {};
  const paxAdultos = paxData.adultos ?? 1;
  const paxNinos = paxData.ninos ?? 0;
  const paxInfantes = paxData.infantes ?? 0;

  // Fechas de Viaje
  const checkinRaw = cotizacion.fechas?.checkin || cotizacion.checkin || '';
  const checkoutRaw = cotizacion.fechas?.checkout || cotizacion.checkout || '';
  const checkinStr = checkinRaw ? formatFechaSlash(checkinRaw) : formatFechaSlash(rawFecha);
  const checkoutStr = checkoutRaw ? formatFechaSlash(checkoutRaw) : formatFechaSlash(rawFecha);

  // =========================================================================
  // NORMALIZACIÓN DE PERSONAS / PASAJEROS (Para la sección Personas)
  // =========================================================================
  const listaPersonas = useMemo(() => {
    const normalizePerson = (p) => ({
      nombre: getSafeString(p.nombres || p.nombre),
      apellido: getSafeString(p.apellidos || p.apellido),
      cedula: p.cedula || p.documento ? `${getSafeString(p.nacionalidad || p.tipo_documento) ? getSafeString(p.nacionalidad || p.tipo_documento) + '-' : ''}${getSafeString(p.cedula || p.documento)}` : 'S/D',
      edad: typeof p.edad === 'number' ? p.edad : (Number(p.edad) || 0),
      celular: getSafeString(p.celular || p.telefono),
      correo: getSafeString(p.correo || p.email),
    });

    if (Array.isArray(cotizacion.personas) && cotizacion.personas.length > 0) {
      return cotizacion.personas.map(normalizePerson);
    }
    if (Array.isArray(cotizacion.pasajeros) && cotizacion.pasajeros.length > 0) {
      return cotizacion.pasajeros.map(normalizePerson);
    }
    // Fallback al cliente principal
    return [
      {
        nombre: getSafeString(clienteData.nombres) || (typeof clienteNombre === 'string' ? clienteNombre.split(' ')[0] : 'Cliente'),
        apellido: getSafeString(clienteData.apellidos) || (typeof clienteNombre === 'string' ? clienteNombre.split(' ').slice(1).join(' ') : ''),
        cedula: clienteData.documento ? `${getSafeString(clienteData.tipo_documento) || 'V'}-${getSafeString(clienteData.documento)}` : 'S/D',
        edad: typeof clienteData.edad === 'number' ? clienteData.edad : (Number(clienteData.edad) || 0),
        celular: getSafeString(clienteData.telefono || clienteData.celular),
        correo: getSafeString(clienteData.correo || clienteData.email),
      },
    ];
  }, [cotizacion, clienteData, clienteNombre]);

  // =========================================================================
  // NORMALIZACIÓN DE ÍTEMS Y PRODUCTOS CONTRATADOS
  // =========================================================================
  let items = [];
  if (Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
    items = cotizacion.items;
  } else if (cotizacion.data && typeof cotizacion.data === 'string') {
    try {
      const parsed = JSON.parse(cotizacion.data);
      if (Array.isArray(parsed.items)) items = parsed.items;
    } catch {
      // ignore
    }
  } else if (Array.isArray(cotizacion.data?.items)) {
    items = cotizacion.data.items;
  }

  // Si no hay items normalizados pero hay entidades directas
  if (items.length === 0) {
    if (Array.isArray(cotizacion.hoteles)) {
      cotizacion.hoteles.forEach((h) => {
        const monto = (h.precio_noche_adulto * (h.adultos || 1) + (h.precio_noche_nino || 0) * (h.ninos || 0)) * (h.noches || 1);
        items.push({
          uid: h.uid || `hotel_${h.id || Math.random()}`,
          tipo: 'hotel',
          titulo: h.hotel?.nombre || h.hotel || h.titulo || 'Hotel Seleccionado',
          detalle: `Habitacion: ${h.tipo_habitacion || h.habitacion || 'Estándar'} , Noches: ${h.noches || 1}, ${h.tipo || 'Solo Alojamiento'}`,
          precio: monto,
          hotelRaw: h,
        });
      });
    }
    if (Array.isArray(cotizacion.excursiones)) {
      cotizacion.excursiones.forEach((e) => {
        const monto = (e.precio_adulto * (e.adultos || 1) + (e.precio_nino || 0) * (e.ninos || 0));
        items.push({
          tipo: 'excursion',
          titulo: 'Excursión',
          detalle: e.excursion?.tipo_excursion || e.tipo_excursion || 'Excursión Turística',
          precio: monto,
          hotel_item_uids: e.hotel_item_uids || (e.hotel_item_uid ? [e.hotel_item_uid] : []),
          raw: e,
        });
      });
    }
    if (Array.isArray(cotizacion.traslados)) {
      cotizacion.traslados.forEach((t) => {
        items.push({
          tipo: 'traslado',
          titulo: 'Traslado',
          detalle: t.traslado ? `${t.traslado.ruta_origen || ''} - ${t.traslado.ruta_destino || ''}` : (t.detalle || 'Traslado Terrestre'),
          precio: Number(t.precio_historico || t.precio || 0),
          hotel_item_uids: t.hotel_item_uids || (t.hotel_item_uid ? [t.hotel_item_uid] : []),
          raw: t,
        });
      });
    }
    if (Array.isArray(cotizacion.paquetes)) {
      cotizacion.paquetes.forEach((p) => {
        items.push({
          tipo: 'paquete',
          titulo: 'Paquete',
          detalle: p.paquete?.paquete || p.paquete || 'Paquete Turístico',
          precio: Number(p.precio_adulto || p.precio || 0),
          hotel_item_uids: p.hotel_item_uids || (p.hotel_item_uid ? [p.hotel_item_uid] : []),
          raw: p,
        });
      });
    }
    if (Array.isArray(cotizacion.vuelos)) {
      cotizacion.vuelos.forEach((v) => {
        const monto = (v.precio_adulto * (v.adultos || 1) + (v.precio_nino || 0) * (v.ninos || 0) + (v.precio_infante || 0) * (v.infantes || 0));
        items.push({
          tipo: 'vuelo',
          titulo: `Boletos Aéreos: ${v.aerolinea?.nombre || 'Aerolínea'} (${v.itinerario || 'Ruta'})`,
          detalle: `Pasajeros: ${v.adultos || paxAdultos} Adultos, ${v.ninos || paxNinos} Niños, ${v.infantes || paxInfantes} Infantes`,
          precio: monto,
          hotel_item_uids: v.hotel_item_uids || (v.hotel_item_uid ? [v.hotel_item_uid] : []),
          raw: v,
        });
      });
    }
    if (Array.isArray(cotizacion.ferries || cotizacion.ferrys)) {
      (cotizacion.ferries || cotizacion.ferrys).forEach((f) => {
        items.push({
          tipo: 'ferry',
          titulo: `Boletos Marítimos: ${f.ruta || 'Ruta'} (${f.itinerario || 'Ferry'})`,
          detalle: `Vehículos: ${f.vehiculos || 0}`,
          precio: Number(f.precio || 0),
          hotel_item_uids: f.hotel_item_uids || (f.hotel_item_uid ? [f.hotel_item_uid] : []),
          raw: f,
        });
      });
    }
    if (Array.isArray(cotizacion.vehiculos)) {
      cotizacion.vehiculos.forEach((veh) => {
        items.push({
          tipo: 'vehiculo',
          titulo: `Vehículo: ${veh.vehiculo?.marca || ''} ${veh.vehiculo?.modelo || veh.modelo || ''}`,
          detalle: `${veh.dias || 1} Días.`,
          precio: Number(veh.precio_unitario || veh.precio || 0) * (veh.dias || 1),
          hotel_item_uids: veh.hotel_item_uids || (veh.hotel_item_uid ? [veh.hotel_item_uid] : []),
          raw: veh,
        });
      });
    }
    if (Array.isArray(cotizacion.otros)) {
      cotizacion.otros.forEach((o) => {
        items.push({
          tipo: 'otro',
          titulo: o.descripcion || 'Servicio',
          detalle: o.detalle || '',
          precio: Number(o.precio || 0),
          hotel_item_uids: o.hotel_item_uids || (o.hotel_item_uid ? [o.hotel_item_uid] : []),
          raw: o,
        });
      });
    }
  }

  // =========================================================================
  // NORMALIZACIÓN DE TODOS LOS SERVICIOS CONTRATADOS PARA EL INFORME DE VENTA
  // =========================================================================

  // 1. HOTELES
  const ventaHoteles = useMemo(() => {
    if (Array.isArray(cotizacion.hoteles) && cotizacion.hoteles.length > 0) {
      return cotizacion.hoteles.map((h) => {
        const checkinH = h.fecha_checkin ? formatFechaDDMMYYYY(h.fecha_checkin) : checkinStr.replace(/\//g, '-');
        const checkoutH = h.fecha_checkout ? formatFechaDDMMYYYY(h.fecha_checkout) : checkoutStr.replace(/\//g, '-');
        const adl = h.adultos ?? paxAdultos;
        const chd = h.ninos ?? paxNinos;
        const inf = h.infantes ?? paxInfantes;
        const total = Number(h.total || ((h.precio_noche_adulto * adl + (h.precio_noche_nino || 0) * chd) * (h.noches || 1)) || 0);
        
        const hotelNombre = getSafeString(h.hotel, getSafeString(h.nombre, 'Hotel Seleccionado'));
        const habitacionNombre = getSafeString(h.tipo_habitacion, getSafeString(h.habitacion, 'Estándar'));

        return {
          nombre: hotelNombre,
          habitacionDetalle: `${habitacionNombre} / ${checkinH} / ${checkoutH}`,
          noches: h.noches || 1,
          paxStr: `${adl}/${chd < 10 ? '0' + chd : chd}${inf > 0 ? '/' + inf : ''}`,
          ninoGratis: Boolean(h.ninos_gratis > 0 || h.es_nino_gratis),
          precioAdulto: Number(h.precio_noche_adulto || h.precio_adulto || 0),
          precioNino: chd > 0 && Number(h.precio_noche_nino) > 0 ? Number(h.precio_noche_nino) : null,
          totalUSD: total,
        };
      });
    }
    // Si viene de items de cotización rápida o ficha
    const hotelFromItems = items.filter((it) => (it.tipo || '').toLowerCase() === 'hotel');
    if (hotelFromItems.length > 0) {
      return hotelFromItems.map((h) => {
        return {
          nombre: getSafeString(h.titulo, 'Hotel Seleccionado').replace(/^Hotel:\s*/i, ''),
          habitacionDetalle: `${getSafeString(h.detalle, 'Estándar')} / ${checkinStr.replace(/\//g, '-')} / ${checkoutStr.replace(/\//g, '-')}`,
          noches: h.data?.noches || h.noches || 1,
          paxStr: `${paxAdultos}/${paxNinos < 10 ? '0' + paxNinos : paxNinos}`,
          ninoGratis: false,
          precioAdulto: Number(h.precio || 0),
          precioNino: null,
          totalUSD: Number(h.precio || 0),
        };
      });
    }
    return [];
  }, [cotizacion, items, checkinStr, checkoutStr, paxAdultos, paxNinos, paxInfantes]);

  // 2. VUELOS
  const ventaVuelos = useMemo(() => {
    if (Array.isArray(cotizacion.vuelos) && cotizacion.vuelos.length > 0) {
      return cotizacion.vuelos.map((v) => {
        const adl = v.adultos ?? paxAdultos;
        const chd = v.ninos ?? paxNinos;
        const inf = v.infantes ?? paxInfantes;
        const aerolinea = getSafeString(v.aerolinea, 'Aerolínea').replace(/^Vuelo:\s*/i, '');
        const itinerarioFecha = `${v.itinerario || 'Ruta aérea'}${v.fecha_vuelo ? ' / ' + formatFechaDDMMYYYY(v.fecha_vuelo) : ''}`;
        const total = Number(
          v.total ??
          v.precio ??
          (Number(v.precio_adulto || 0) * Math.max(1, adl) + Number(v.precio_nino || 0) * (chd || 0) + Number(v.precio_infante || 0) * (inf || 0)) ||
          0
        );
        return {
          aerolinea,
          itinerario: itinerarioFecha,
          paxStr: `${adl}/${chd}/${inf}`,
          precioAdulto: Number(v.precio_adulto || 0),
          precioNino: chd > 0 && Number(v.precio_nino) > 0 ? Number(v.precio_nino) : null,
          totalUSD: total,
        };
      });
    }
    const vuelosFromItems = items.filter((it) => {
      const tipo = (it.tipo || '').toLowerCase();
      return tipo === 'vuelo' || tipo === 'vuelos' || tipo === 'boletos_aereos' || tipo === 'aereo';
    });
    if (vuelosFromItems.length > 0) {
      return vuelosFromItems.map((v) => {
        const aerolinea = getSafeString(v.titulo, 'Aerolínea').replace(/^Vuelo:\s*/i, '');
        const itinerario = getSafeString(v.detalle, 'Ruta aérea');
        const adl = v.data?.adultos ?? paxAdultos;
        const chd = v.data?.ninos ?? paxNinos;
        const inf = v.data?.infantes ?? paxInfantes;
        return {
          aerolinea,
          itinerario,
          paxStr: `${adl}/${chd}/${inf}`,
          precioAdulto: Number(v.data?.precio_adulto || (adl > 0 ? Number(v.precio || 0) / adl : Number(v.precio || 0))),
          precioNino: chd > 0 && Number(v.data?.precio_nino) > 0 ? Number(v.data?.precio_nino) : null,
          totalUSD: Number(v.precio || 0),
        };
      });
    }
    return [];
  }, [cotizacion, items, paxAdultos, paxNinos, paxInfantes]);

  // 3. TRASLADOS
  const ventaTraslados = useMemo(() => {
    if (Array.isArray(cotizacion.traslados) && cotizacion.traslados.length > 0) {
      return cotizacion.traslados.map((t) => {
        const titulo = getSafeString(t.traslado, 'Traslado').replace(/^Servicio:\s*/i, '');
        const detalle = t.fecha ? `${formatFechaDDMMYYYY(t.fecha)} ${t.observacion ? '• ' + t.observacion : ''}` : (t.observacion || t.detalle || 'Traslado');
        const adl = t.adultos ?? paxAdultos;
        const chd = t.ninos ?? paxNinos;
        const inf = t.infantes ?? paxInfantes;
        return {
          titulo,
          detalle,
          paxStr: `${adl}/${chd}/${inf}`,
          totalUSD: Number(t.precio_historico ?? t.total ?? t.precio ?? 0),
        };
      });
    }
    // Si viene en cotizacion.otros y dice traslado
    if (Array.isArray(cotizacion.otros) && cotizacion.otros.length > 0) {
      const trasladosOtros = cotizacion.otros.filter((o) => String(o.descripcion || o.titulo || '').toLowerCase().includes('traslado'));
      if (trasladosOtros.length > 0) {
        return trasladosOtros.map((t) => ({
          titulo: getSafeString(t.descripcion || t.titulo, 'Traslado').replace(/^Servicio:\s*/i, ''),
          detalle: t.fecha ? `${formatFechaDDMMYYYY(t.fecha)}` : (t.detalle || 'Traslado'),
          paxStr: `${t.adultos ?? paxAdultos}/${t.ninos ?? paxNinos}/${t.infantes ?? paxInfantes}`,
          totalUSD: Number(t.precio ?? t.total ?? 0),
        }));
      }
    }
    const trasladosFromItems = items.filter((it) => {
      const tipo = (it.tipo || '').toLowerCase();
      const titulo = String(it.titulo || '').toLowerCase();
      return tipo === 'traslado' || tipo === 'traslados' || (tipo === 'otro' && titulo.includes('traslado'));
    });
    if (trasladosFromItems.length > 0) {
      return trasladosFromItems.map((t) => {
        const titulo = getSafeString(t.titulo, 'Traslado').replace(/^Servicio:\s*/i, '');
        const detalle = getSafeString(t.detalle, 'Traslado');
        return {
          titulo,
          detalle,
          paxStr: `${paxAdultos}/${paxNinos}/${paxInfantes}`,
          totalUSD: Number(t.precio || 0),
        };
      });
    }
    return [];
  }, [cotizacion, items, paxAdultos, paxNinos, paxInfantes]);

  // 4. FERRYS
  const ventaFerrys = useMemo(() => {
    const list = cotizacion.ferries || cotizacion.ferrys;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((f) => {
        const ruta = getSafeString(f.ruta, 'Ruta Marítima');
        const detalle = `${f.clase || ''} ${f.itinerario ? '• ' + f.itinerario : ''}`.trim();
        const adl = f.adultos ?? paxAdultos;
        const chd = f.ninos ?? paxNinos;
        const inf = f.infantes ?? paxInfantes;
        const vhc = f.vehiculos || 0;
        const total = Number(
          f.total ??
          f.precio ??
          (Number(f.precio_adulto || 0) * adl + Number(f.precio_nino || 0) * chd + Number(f.precio_infante || 0) * inf + Number(f.precio_vehiculo || 0) * vhc) ||
          0
        );
        const paxStr = `${adl}/${chd}/${inf}${vhc ? ' • VHC: ' + vhc : ''}`;
        return {
          ruta,
          detalle,
          paxStr,
          totalUSD: total,
        };
      });
    }
    const ferrysFromItems = items.filter((it) => {
      const tipo = (it.tipo || '').toLowerCase();
      return tipo === 'ferry' || tipo === 'ferries' || tipo === 'boletos_maritimos';
    });
    if (ferrysFromItems.length > 0) {
      return ferrysFromItems.map((f) => {
        return {
          ruta: getSafeString(f.titulo, 'Boleto Marítimo').replace(/^Ferry:\s*/i, ''),
          detalle: getSafeString(f.detalle, 'Itinerario marítimo'),
          paxStr: `${paxAdultos}/${paxNinos}/${paxInfantes}`,
          totalUSD: Number(f.precio || 0),
        };
      });
    }
    return [];
  }, [cotizacion, items, paxAdultos, paxNinos, paxInfantes]);

  // 5. EXCURSIONES
  const ventaExcursiones = useMemo(() => {
    if (Array.isArray(cotizacion.excursiones) && cotizacion.excursiones.length > 0) {
      return cotizacion.excursiones.map((e) => {
        const titulo = getSafeString(e.tipo_excursion, getSafeString(e.excursion, 'Excursión')).replace(/^Excursión:\s*/i, '');
        const detalle = e.fecha ? formatFechaDDMMYYYY(e.fecha) : (e.detalle || 'Excursión Turística');
        const adl = e.adultos ?? paxAdultos;
        const chd = e.ninos ?? paxNinos;
        const inf = e.infantes ?? paxInfantes;
        const total = Number(
          e.total ??
          e.precio ??
          (Number(e.precio_adulto || 0) * Math.max(1, adl) + Number(e.precio_nino || 0) * (chd || 0)) ||
          0
        );
        return {
          titulo,
          detalle,
          paxStr: `${adl}/${chd}/${inf}`,
          totalUSD: total,
        };
      });
    }
    const excFromItems = items.filter((it) => {
      const tipo = (it.tipo || '').toLowerCase();
      return tipo === 'excursion' || tipo === 'excursiones';
    });
    if (excFromItems.length > 0) {
      return excFromItems.map((e) => {
        return {
          titulo: getSafeString(e.titulo, 'Excursión').replace(/^Excursión:\s*/i, ''),
          detalle: getSafeString(e.detalle, 'Excursión Turística'),
          paxStr: `${paxAdultos}/${paxNinos}/${paxInfantes}`,
          totalUSD: Number(e.precio || 0),
        };
      });
    }
    return [];
  }, [cotizacion, items, paxAdultos, paxNinos, paxInfantes]);

  // 6. PAQUETES
  const ventaPaquetes = useMemo(() => {
    if (Array.isArray(cotizacion.paquetes) && cotizacion.paquetes.length > 0) {
      return cotizacion.paquetes.map((p) => {
        const titulo = getSafeString(p.paquete, 'Paquete Turístico').replace(/^Paquete:\s*/i, '');
        const detalle = p.fecha ? formatFechaDDMMYYYY(p.fecha) : (p.detalle || '');
        const adl = p.adultos ?? paxAdultos;
        const chd = p.ninos ?? paxNinos;
        const inf = p.infantes ?? paxInfantes;
        const total = Number(
          p.total ??
          p.precio ??
          (Number(p.precio_adulto || 0) * Math.max(1, adl) + Number(p.precio_nino || 0) * (chd || 0)) ||
          0
        );
        return {
          titulo,
          detalle,
          paxStr: `${adl}/${chd}/${inf}`,
          totalUSD: total,
        };
      });
    }
    const paqFromItems = items.filter((it) => {
      const tipo = (it.tipo || '').toLowerCase();
      return tipo === 'paquete' || tipo === 'paquetes';
    });
    if (paqFromItems.length > 0) {
      return paqFromItems.map((p) => {
        return {
          titulo: getSafeString(p.titulo, 'Paquete Turístico').replace(/^Paquete:\s*/i, ''),
          detalle: getSafeString(p.detalle, ''),
          paxStr: `${paxAdultos}/${paxNinos}/${paxInfantes}`,
          totalUSD: Number(p.precio || 0),
        };
      });
    }
    return [];
  }, [cotizacion, items, paxAdultos, paxNinos, paxInfantes]);

  // 7. VEHÍCULOS
  const ventaVehiculos = useMemo(() => {
    if (Array.isArray(cotizacion.vehiculos) && cotizacion.vehiculos.length > 0) {
      return cotizacion.vehiculos.map((v) => {
        const titulo = `${v.tipo_vehiculo || 'Vehículo'} ${v.modelo || ''}`.trim();
        const detalle = `${v.tipo_transmision || ''} • ${v.dias || 1} días ${v.observacion ? '• ' + v.observacion : ''}`.trim();
        const total = Number(
          v.total ??
          v.precio ??
          (Number(v.precio_unitario || v.precio_diario || 0) * (v.dias || 1)) ||
          0
        );
        return {
          titulo,
          detalle,
          totalUSD: total,
        };
      });
    }
    const vehFromItems = items.filter((it) => {
      const tipo = (it.tipo || '').toLowerCase();
      return tipo === 'vehiculo' || tipo === 'vehiculos';
    });
    if (vehFromItems.length > 0) {
      return vehFromItems.map((v) => {
        return {
          titulo: getSafeString(v.titulo, 'Vehículo').replace(/^Vehículo:\s*/i, ''),
          detalle: getSafeString(v.detalle, ''),
          totalUSD: Number(v.precio || 0),
        };
      });
    }
    return [];
  }, [cotizacion, items]);

  // 8. OTROS SERVICIOS (que no encajen en ninguna categoría anterior)
  const ventaOtros = useMemo(() => {
    const otrosFromItems = items.filter((it) => {
      const tipo = (it.tipo || '').toLowerCase();
      const titulo = String(it.titulo || '').toLowerCase();
      if (['hotel', 'hoteles'].includes(tipo)) return false;
      if (['vuelo', 'vuelos', 'boletos_aereos', 'aereo'].includes(tipo)) return false;
      if (['ferry', 'ferries', 'boletos_maritimos'].includes(tipo)) return false;
      if (['excursion', 'excursiones'].includes(tipo)) return false;
      if (['paquete', 'paquetes'].includes(tipo)) return false;
      if (['vehiculo', 'vehiculos'].includes(tipo)) return false;
      if (tipo === 'traslado' || tipo === 'traslados' || titulo.includes('traslado')) return false;
      return true;
    });

    if (otrosFromItems.length > 0) {
      return otrosFromItems.map((o) => {
        return {
          titulo: getSafeString(o.titulo, 'Servicio Adicional').replace(/^Servicio:\s*/i, ''),
          detalle: getSafeString(o.detalle, '-'),
          totalUSD: Number(o.precio || 0),
        };
      });
    }

    if (Array.isArray(cotizacion.otros) && cotizacion.otros.length > 0) {
      return cotizacion.otros
        .filter((o) => {
          const desc = String(o.descripcion || o.titulo || '').toLowerCase();
          return !desc.includes('traslado');
        })
        .map((o) => {
          return {
            titulo: getSafeString(o.descripcion, getSafeString(o.titulo, 'Servicio Adicional')),
            detalle: o.fecha ? formatFechaDDMMYYYY(o.fecha) : (o.detalle || '-'),
            totalUSD: Number(o.total || o.precio || 0),
          };
        });
    }
    return [];
  }, [cotizacion, items]);

  // Lista de Pagos Recibidos para Venta
  const listaPagos = useMemo(() => {
    if (Array.isArray(cotizacion.pagos) && cotizacion.pagos.length > 0) {
      return cotizacion.pagos.map((p) => {
        const metodo = getSafeString(p.metodo, getSafeString(p.metodo_pago, 'Pago'));
        const transaccion = getSafeString(p.numero_transaccion, getSafeString(p.referencia, getSafeString(p.comprobante, 'N/A')));
        const fecha = p.fecha || p.fecha_pago ? formatFechaSlash(p.fecha || p.fecha_pago) : formatFechaSlash(rawFecha);
        const montoUSD = Number(p.monto_usd ?? (p.moneda === 'VES' && p.tasa_cambio ? p.monto_original / p.tasa_cambio : p.monto_original ?? p.total ?? 0));
        const totalStr =
          p.moneda && p.moneda !== 'USD'
            ? `${Number(p.monto_original || p.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${p.moneda} (${montoUSD.toFixed(2)} USD)`
            : `${montoUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
        return {
          metodo,
          transaccion,
          fecha,
          totalStr,
          montoUSD,
        };
      });
    }
    return [];
  }, [cotizacion.pagos, rawFecha]);

  const totalPagosRecibidosUSD = listaPagos.reduce((acc, p) => acc + (p.montoUSD || 0), 0);

  // Totales Financieros
  const subtotalUSD = Number(cotizacion.subtotal || cotizacion.total_bruto || cotizacion.total_usd || items.reduce((acc, it) => acc + (Number(it.precio) || 0), 0));
  const descuentoUSD = Number(cotizacion.descuento_monto || cotizacion.descuento || 0);
  const totalGeneralUSD = typeof cotizacion.total_usd === 'number' ? cotizacion.total_usd : Math.max(0, subtotalUSD - descuentoUSD);
  const totalAbonadoUSD = Number(cotizacion.total_abonado ?? cotizacion.total_pagado ?? totalPagosRecibidosUSD);
  const saldoRestanteUSD = Number(cotizacion.saldo_pendiente ?? Math.max(0, totalGeneralUSD - totalAbonadoUSD));

  // Observación
  const observacionTexto = getSafeString(cotizacion.observacion, getSafeString(cotizacion.observaciones, ''));

  // Helpers de Formato
  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Detección de si la cotización tiene estructura agrupada
  const hotelItems = items.filter((it) => it.tipo === 'hotel');
  const hasMultipleHotels = hotelItems.length > 1;
  const hasExplicitGroupedItems = items.some((it) => {
    if (it.tipo === 'hotel') return false;
    const uids = Array.isArray(it.hotel_item_uids) ? it.hotel_item_uids : (it.hotel_item_uid ? [it.hotel_item_uid] : []);
    return uids.length > 0;
  });

  const isGroupedMode =
    forceGroupedView === 'grouped'
      ? true
      : forceGroupedView === 'ungrouped'
      ? false
      : (hasMultipleHotels || (hotelItems.length === 1 && hasExplicitGroupedItems));

  const cabeEnPagina1 = (() => {
    if (forcePageLocation === 'p1') return true;
    if (forcePageLocation === 'p2') return false;
    if (!isGroupedMode) {
      return items.length <= 5;
    } else {
      const totalSubitems = items.filter((it) => it.tipo !== 'hotel').length;
      return (hotelItems.length <= 1 && totalSubitems <= 5) || (hotelItems.length <= 2 && totalSubitems <= 2);
    }
  })();

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsApp = () => {
    let text = '';
    if (esModoVenta) {
      const serviciosTexto = [
        ...ventaHoteles.map((h) => `• *Hotel - ${h.nombre}*: ${h.habitacionDetalle} - $${formatCurrency(h.totalUSD)} USD`),
        ...ventaVuelos.map((v) => `• *Vuelo - ${v.aerolinea}*: ${v.itinerario} - $${formatCurrency(v.totalUSD)} USD`),
        ...ventaTraslados.map((t) => `• *Traslado - ${t.titulo}*: ${t.detalle} - $${formatCurrency(t.totalUSD)} USD`),
        ...ventaFerrys.map((f) => `• *Ferry - ${f.ruta}*: ${f.detalle} - $${formatCurrency(f.totalUSD)} USD`),
        ...ventaExcursiones.map((e) => `• *Excursión - ${e.titulo}*: ${e.detalle} - $${formatCurrency(e.totalUSD)} USD`),
        ...ventaPaquetes.map((p) => `• *Paquete - ${p.titulo}*: ${p.detalle} - $${formatCurrency(p.totalUSD)} USD`),
        ...ventaVehiculos.map((veh) => `• *Vehículo - ${veh.titulo}*: ${veh.detalle} - $${formatCurrency(veh.totalUSD)} USD`),
        ...ventaOtros.map((o) => `• *${o.titulo}*: ${o.detalle} - $${formatCurrency(o.totalUSD)} USD`),
      ].join('\n');

      text = `*PLAN DE VIAJE - INFORME DE VENTA*
*N° Ficha:* ${numeroFicha}
*Fecha:* ${fechaEmision}
*Asesor:* ${asesorNombre}
*Check in:* ${checkinStr} | *Check out:* ${checkoutStr}

*PASAJEROS:*
${listaPersonas.map((p) => `• ${p.nombre} ${p.apellido} - C.I: ${p.cedula} (${p.celular || 'S/T'})`).join('\n')}

*SERVICIOS CONTRATADOS:*
${serviciosTexto}

*RESUMEN FINANCIERO:*
*Total:* $${formatCurrency(totalGeneralUSD)} USD
*Abonado:* $${formatCurrency(totalAbonadoUSD)} USD
*Restante:* $${formatCurrency(saldoRestanteUSD)} USD`;
    } else {
      let serviciosTexto = '';
      if (isGroupedMode && hotelItems.length > 0) {
        hotelItems.forEach((h) => {
          const grouped = items.filter((it) => it.tipo !== 'hotel' && (Array.isArray(it.hotel_item_uids) ? it.hotel_item_uids.includes(h.uid) : it.hotel_item_uid === h.uid));
          const subtotal = Number(h.precio || 0) + grouped.reduce((sum, g) => sum + Number(g.precio || 0), 0);
          serviciosTexto += `\n*${h.titulo}* - *$${formatCurrency(subtotal)}*\n   ${h.detalle}\n`;
          grouped.forEach((g) => {
            serviciosTexto += `   ↳ *${g.titulo}*: ${g.detalle}\n`;
          });
        });
      } else {
        serviciosTexto = items.map((it) => `• *${it.titulo}*: ${it.detalle} - *$${formatCurrency(it.precio)}*`).join('\n');
      }

      text = `*PLAN DE VIAJE - COTIZACIÓN*
*N° Ficha:* ${numeroFicha}
*Fecha:* ${fechaEmision}
*Cliente:* ${clienteNombre}
*Fechas:* ${checkinStr} al ${checkoutStr}
*Pasajeros:* ${paxAdultos} Adultos, ${paxNinos} Niños, ${paxInfantes} Infantes

*DETALLE DEL SERVICIO:*
${serviciosTexto}

${!isGroupedMode ? `*TOTAL A PAGAR: $${formatCurrency(totalGeneralUSD)} USD*\n` : ''}
*IMPORTANTE:*
• Cotización válida por 48 hrs.
• Sujeto a disponibilidad al momento de la reserva.
• La Agencia actúa únicamente como intermediaria entre el cliente y las aerolíneas.`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Componente reutilizable para la Caja Azul de Cláusulas Legales (Modo Cotización)
  const renderCajaImportante = () => (
    <div
      style={{
        background: '#0A206D',
        borderRadius: '18px',
        padding: '20px 28px',
        color: '#FFFFFF',
        boxSizing: 'border-box',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div
        style={{
          fontSize: '12.5px',
          fontWeight: '700',
          letterSpacing: '1px',
          marginBottom: '12px',
        }}
      >
        IMPORTANTE
      </div>

      {/* Fila Icono Horas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          marginBottom: '8px',
        }}
      >
        <img
          src={iconHoras}
          alt="Horas"
          style={{
            width: '15px',
            height: '15px',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }}
        />
        <span>Cotización válida por 48 hrs</span>
      </div>

      {/* Fila Icono Disponibilidad */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          marginBottom: '12px',
        }}
      >
        <img
          src={iconDisponibilidad}
          alt="Disponibilidad"
          style={{
            width: '15px',
            height: '15px',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }}
        />
        <span>Sujeto a disponibilidad al momento de la reserva.</span>
      </div>

      {/* Cláusulas Legales con Viñetas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '10.5px', lineHeight: '1.4' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '14px', lineHeight: '1' }}>•</span>
          <span>La Agencia actúa únicamente como intermediaria entre el cliente y las aerolíneas.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '14px', lineHeight: '1' }}>•</span>
          <span>
            La Agencia no se hace responsable por modificaciones, cambios o anulaciones realizados por las aerolíneas.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '14px', lineHeight: '1' }}>•</span>
          <span>
            Ante inconvenientes ajenos en el itinerario, la Agencia solo actuará como intermediaria de apoyo entre el cliente y la aerolínea.
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 25, 0.88)',
        backdropFilter: 'blur(8px)',
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
          @page {
            size: letter portrait;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-cotizacion-root, #printable-cotizacion-root * {
            visibility: visible !important;
          }
          #printable-cotizacion-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .cotizacion-sheet {
            width: 8.5in !important;
            height: 11in !important;
            min-height: 11in !important;
            max-height: 11in !important;
            page-break-after: always !important;
            break-after: page !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
            position: relative !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0B132B',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Screen only - CERO EMOJIS, USA SOLAMENTE SVGS DE ASSETS) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: '#070D1F',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {/* Lado Izquierdo: Icono SVG + Título + Selector de Tipo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={receiptIcon}
              alt=""
              style={{
                width: '18px',
                height: '18px',
                filter: 'brightness(0) invert(1)',
              }}
            />
            <span style={{ fontWeight: '700', fontSize: '1rem', color: '#FFFFFF' }}>
              {esModoVenta ? 'Informe de Venta' : 'Cotización Rápida'}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(242, 101, 34, 0.2)',
                color: '#F26522',
                border: '1px solid rgba(242, 101, 34, 0.4)',
              }}
            >
              N° {numeroFicha}
            </span>

            {/* Selector de Modo Venta vs Cotización */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '2px', marginLeft: '6px' }}>
              <button
                type="button"
                onClick={() => setCurrentView('cotizacion')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: currentView === 'cotizacion' ? '#021175' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cotización
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('venta')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: currentView === 'venta' ? '#F26522' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Venta
              </button>
            </div>
          </div>

          {/* Lado Derecho: Acciones (Imprimir, WhatsApp, Cerrar) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Opciones exclusivas de Cotización Rápida */}
            {!esModoVenta && (
              <>
                <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setForceGroupedView('ungrouped')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: forceGroupedView === 'ungrouped' || (!isGroupedMode && forceGroupedView === 'auto') ? '#F26522' : 'transparent',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                    title="Mostrar lista secuencial sin agrupar productos"
                  >
                    Sin Agrupar
                  </button>
                  <button
                    type="button"
                    onClick={() => setForceGroupedView('grouped')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: forceGroupedView === 'grouped' || (isGroupedMode && forceGroupedView === 'auto') ? '#F26522' : 'transparent',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                    title="Mostrar productos agrupados por hotel"
                  >
                    Agrupados
                  </button>
                </div>

                {!cabeEnPagina1 && (
                  <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('todas')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: activeTab === 'todas' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Todas (1-2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('1')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: activeTab === '1' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Pág 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('2')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: activeTab === '2' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Pág 2
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Botón Imprimir / PDF (Usa Imprimir.svg) */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: '#F26522',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(242, 101, 34, 0.4)',
              }}
              title="Imprimir documento o Guardar en PDF"
            >
              <img
                src={imprimirIcon}
                alt=""
                style={{
                  width: '15px',
                  height: '15px',
                  filter: 'brightness(0) invert(1)',
                }}
              />
              <span>Imprimir / PDF</span>
            </button>

            {/* Botón Copiar WhatsApp (SVG vector limpio sin emojis) */}
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: copied ? '#10B981' : 'rgba(37, 99, 235, 0.25)',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              title="Copiar resumen para WhatsApp"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-2.285-.58-1.586-.658-2.617-2.26-2.696-2.366-.079-.105-.644-.858-.644-1.636 0-.778.406-1.161.55-1.32.144-.159.314-.198.42-.198.106 0 .211.002.304.006.098.004.228-.037.356.27.132.318.45 1.097.49 1.176.039.08.066.172.013.277-.053.105-.079.171-.158.264-.08.092-.168.206-.24.277-.08.079-.163.165-.07.324.093.159.412.679.884 1.1 1.097.608 1.05.636 1.199.712.149.076.237.067.324-.034.088-.101.378-.44.478-.592.101-.152.202-.127.34-.076.138.051.876.413 1.026.488.15.075.25.112.287.174.037.063.037.368-.107.773z"/>
              </svg>
              <span>{copied ? '¡Copiado!' : 'WhatsApp'}</span>
            </button>

            {onVerRegistro && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onVerRegistro();
                }}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Ver Registro
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '6px',
              }}
              title="Cerrar ventana"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 16px',
            background: '#1F2937',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Printable Root Container */}
          <div id="printable-cotizacion-root" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ============================================================== */}
            {/* RENDERIZADO 1: INFORME OFICIAL DE VENTA (100% Exactitud)       */}
            {/* ============================================================== */}
            {esModoVenta && (
              <div
                className="cotizacion-sheet"
                style={{
                  width: '816px',
                  height: '1056px',
                  minHeight: '1056px',
                  maxHeight: '1056px',
                  position: 'relative',
                  backgroundImage: `url(${ventaFondoMembrete})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#FFFFFF',
                  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* Título VENTA centrado */}
                <div
                  style={{
                    position: 'absolute',
                    top: '106px',
                    left: 0,
                    right: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      color: '#00206D',
                      fontSize: '26px',
                      fontWeight: '800',
                      letterSpacing: '3px',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    VENTA
                  </span>
                  {/* Subtítulo Asesor */}
                  <div
                    style={{
                      color: '#00206D',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      marginTop: '7px',
                    }}
                  >
                    Asesor: {asesorNombre}
                  </div>
                </div>

                {/* Contenido Principal de la Venta */}
                <div
                  style={{
                    position: 'absolute',
                    top: '162px',
                    left: '38px',
                    right: '38px',
                    bottom: '75px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Barra de Metadatos (Check in / out y N. de Ficha / Fecha) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px',
                    }}
                  >
                    {/* Check in / Check out a la izquierda con calendario-01.svg */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <img
                          src={calendarioIcon}
                          alt=""
                          style={{ width: '13px', height: '13px', objectFit: 'contain' }}
                        />
                        <span style={{ fontSize: '11px', color: '#00206D', fontWeight: '700' }}>
                          Check in: <u style={{ fontWeight: '700' }}>{checkinStr}</u>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <img
                          src={calendarioIcon}
                          alt=""
                          style={{ width: '13px', height: '13px', objectFit: 'contain' }}
                        />
                        <span style={{ fontSize: '11px', color: '#00206D', fontWeight: '700' }}>
                          Check out: <u style={{ fontWeight: '700' }}>{checkoutStr}</u>
                        </span>
                      </div>
                    </div>

                    {/* N. de Ficha y Fecha a la derecha */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <img
                          src={receiptIcon}
                          alt=""
                          style={{ width: '13px', height: '13px', objectFit: 'contain' }}
                        />
                        <span style={{ fontSize: '11px', color: '#00206D', fontWeight: '700' }}>
                          N. de Ficha: <strong>{numeroFicha}</strong>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <img
                          src={calendarioIcon}
                          alt=""
                          style={{ width: '13px', height: '13px', objectFit: 'contain' }}
                        />
                        <span style={{ fontSize: '11px', color: '#00206D', fontWeight: '700' }}>
                          Fecha: {fechaEmision}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* SECCIÓN 1: PERSONAS                                        */}
                  {/* ========================================================== */}
                  <div style={{ marginBottom: '10px' }}>
                    {/* Cápsula Azul Marino con Usuarios-01.svg */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        background: '#00206D',
                        borderRadius: '9999px',
                        padding: '3px 14px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        marginBottom: '4px',
                      }}
                    >
                      <img
                        src={usuariosIcon}
                        alt=""
                        style={{
                          width: '12px',
                          height: '12px',
                          filter: 'brightness(0) invert(1)',
                        }}
                      />
                      <span>Personas</span>
                    </div>

                    {/* Tabla de Personas */}
                    <div
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        overflow: 'hidden',
                        background: '#FFFFFF',
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9.5px' }}>
                        <thead>
                          <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '16%' }}>Nombre</th>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '16%' }}>Apellido</th>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '18%' }}>Cédula</th>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '9%' }}>Edad</th>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '21%' }}>Celular</th>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '20%' }}>Correo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listaPersonas.map((per, idx) => (
                            <tr
                              key={idx}
                              style={{
                                borderTop: '1px solid #E2E8F0',
                                background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                              }}
                            >
                              <td style={{ padding: '3.5px 8px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>{per.nombre || '-'}</td>
                              <td style={{ padding: '3.5px 8px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>{per.apellido || '-'}</td>
                              <td style={{ padding: '3.5px 8px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>{per.cedula || '-'}</td>
                              <td style={{ padding: '3.5px 8px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>{per.edad}</td>
                              <td style={{ padding: '3.5px 8px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>{per.celular || '-'}</td>
                              <td style={{ padding: '3.5px 8px', color: '#0F172A' }}>{per.correo || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* SECCIÓN 2: SERVICIOS CONTRATADOS                           */}
                  {/* ========================================================== */}
                  <div style={{ marginBottom: '10px' }}>
                    {/* Cápsula Azul Marino con Aerolineas.svg */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        background: '#00206D',
                        borderRadius: '9999px',
                        padding: '3px 14px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        marginBottom: '3px',
                      }}
                    >
                      <img
                        src={aerolineasIcon}
                        alt=""
                        style={{
                          width: '12px',
                          height: '12px',
                          filter: 'brightness(0) invert(1)',
                        }}
                      />
                      <span>Servicios Contratados</span>
                    </div>

                    {/* 1. HOTELES */}
                    {ventaHoteles.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#00206D',
                            marginBottom: '2px',
                            paddingLeft: '2px',
                          }}
                        >
                          Hoteles
                        </div>
                        <div
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            overflow: 'hidden',
                            background: '#FFFFFF',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                            <thead>
                              <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '18%' }}>Hotel</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '25%' }}>Habitación / Checkin / Checkout</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '8%', textAlign: 'center' }}>Noches</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '16%' }}>ADL/CHD/INF</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '11%' }}>Precio Adulto</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '11%' }}>Precio Niño</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '11%' }}>Total USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventaHoteles.map((h, idx) => (
                                <tr
                                  key={idx}
                                  style={{
                                    borderTop: '1px solid #E2E8F0',
                                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                  }}
                                >
                                  <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                                    {h.nombre}
                                  </td>
                                  <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', lineHeight: '1.25' }}>
                                    {h.habitacionDetalle}
                                  </td>
                                  <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                    {h.noches}
                                  </td>
                                  <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    <div>{h.paxStr}</div>
                                    {h.ninoGratis && (
                                      <div
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          background: '#F26522',
                                          borderRadius: '9999px',
                                          padding: '1.5px 6px',
                                          color: '#FFFFFF',
                                          fontSize: '8px',
                                          fontWeight: '700',
                                          marginTop: '2px',
                                        }}
                                      >
                                        <img
                                          src={usuarioIcon}
                                          alt=""
                                          style={{
                                            width: '8px',
                                            height: '8px',
                                            filter: 'brightness(0) invert(1)',
                                          }}
                                        />
                                        <span>Niño Gratis</span>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {formatCurrency(h.precioAdulto)}
                                  </td>
                                  <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {h.precioNino ? `${formatCurrency(h.precioNino)} USD` : 'N/A'}
                                  </td>
                                  <td style={{ padding: '4px 6px', color: '#0F172A', fontWeight: '700' }}>
                                    {formatCurrency(h.totalUSD)}
                                  </td>
                                </tr>
                              ))}

                              {/* Fila de Totales de Hoteles */}
                              <tr style={{ background: '#F8FAFC', borderTop: '1px solid #CBD5E1' }}>
                                <td colSpan={6} style={{ padding: '3.5px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  Totales:
                                </td>
                                <td style={{ padding: '3.5px 6px', fontWeight: '700', color: '#0F172A' }}>
                                  {formatCurrency(ventaHoteles.reduce((sum, h) => sum + h.totalUSD, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 2. VUELOS */}
                    {ventaVuelos.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#00206D',
                            marginBottom: '2px',
                            paddingLeft: '2px',
                          }}
                        >
                          Vuelos
                        </div>
                        <div
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            overflow: 'hidden',
                            background: '#FFFFFF',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                            <thead>
                              <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '22%' }}>Aerolínea</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '38%' }}>Itinerario / Fecha</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '14%' }}>ADL/CHD/INF</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '13%' }}>Precio Adulto</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '13%' }}>Total USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventaVuelos.map((v, idx) => (
                                <tr
                                  key={idx}
                                  style={{
                                    borderTop: '1px solid #E2E8F0',
                                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                  }}
                                >
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                                    {v.aerolinea}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {v.itinerario}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {v.paxStr}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {formatCurrency(v.precioAdulto)}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', fontWeight: '700' }}>
                                    {formatCurrency(v.totalUSD)}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: '#F8FAFC', borderTop: '1px solid #CBD5E1' }}>
                                <td colSpan={4} style={{ padding: '3.5px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  Totales:
                                </td>
                                <td style={{ padding: '3.5px 6px', fontWeight: '700', color: '#0F172A' }}>
                                  {formatCurrency(ventaVuelos.reduce((sum, v) => sum + v.totalUSD, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 3. TRASLADOS */}
                    {ventaTraslados.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#00206D',
                            marginBottom: '2px',
                            paddingLeft: '2px',
                          }}
                        >
                          Traslados
                        </div>
                        <div
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            overflow: 'hidden',
                            background: '#FFFFFF',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                            <thead>
                              <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '32%' }}>Traslado</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '40%' }}>Ruta / Detalle</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '14%' }}>ADL/CHD/INF</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '14%' }}>Total USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventaTraslados.map((t, idx) => (
                                <tr
                                  key={idx}
                                  style={{
                                    borderTop: '1px solid #E2E8F0',
                                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                  }}
                                >
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                                    {t.titulo}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {t.detalle}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {t.paxStr}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', fontWeight: '700' }}>
                                    {formatCurrency(t.totalUSD)}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: '#F8FAFC', borderTop: '1px solid #CBD5E1' }}>
                                <td colSpan={3} style={{ padding: '3.5px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  Totales:
                                </td>
                                <td style={{ padding: '3.5px 6px', fontWeight: '700', color: '#0F172A' }}>
                                  {formatCurrency(ventaTraslados.reduce((sum, t) => sum + t.totalUSD, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 4. BOLETOS MARÍTIMOS / FERRYS */}
                    {ventaFerrys.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#00206D',
                            marginBottom: '2px',
                            paddingLeft: '2px',
                          }}
                        >
                          Boletos Marítimos / Ferrys
                        </div>
                        <div
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            overflow: 'hidden',
                            background: '#FFFFFF',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                            <thead>
                              <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '32%' }}>Ruta / Embarcación</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '38%' }}>Itinerario</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '16%' }}>Pasajeros / VHC</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '14%' }}>Total USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventaFerrys.map((f, idx) => (
                                <tr
                                  key={idx}
                                  style={{
                                    borderTop: '1px solid #E2E8F0',
                                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                  }}
                                >
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                                    {f.ruta}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {f.detalle}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {f.paxStr}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', fontWeight: '700' }}>
                                    {formatCurrency(f.totalUSD)}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: '#F8FAFC', borderTop: '1px solid #CBD5E1' }}>
                                <td colSpan={3} style={{ padding: '3.5px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  Totales:
                                </td>
                                <td style={{ padding: '3.5px 6px', fontWeight: '700', color: '#0F172A' }}>
                                  {formatCurrency(ventaFerrys.reduce((sum, f) => sum + f.totalUSD, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 5. EXCURSIONES */}
                    {ventaExcursiones.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#00206D',
                            marginBottom: '2px',
                            paddingLeft: '2px',
                          }}
                        >
                          Excursiones
                        </div>
                        <div
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            overflow: 'hidden',
                            background: '#FFFFFF',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                            <thead>
                              <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '36%' }}>Excursión</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '36%' }}>Detalle / Fecha</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '14%' }}>ADL/CHD/INF</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '14%' }}>Total USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventaExcursiones.map((e, idx) => (
                                <tr
                                  key={idx}
                                  style={{
                                    borderTop: '1px solid #E2E8F0',
                                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                  }}
                                >
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                                    {e.titulo}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {e.detalle}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {e.paxStr}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', fontWeight: '700' }}>
                                    {formatCurrency(e.totalUSD)}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: '#F8FAFC', borderTop: '1px solid #CBD5E1' }}>
                                <td colSpan={3} style={{ padding: '3.5px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  Totales:
                                </td>
                                <td style={{ padding: '3.5px 6px', fontWeight: '700', color: '#0F172A' }}>
                                  {formatCurrency(ventaExcursiones.reduce((sum, e) => sum + e.totalUSD, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 6. PAQUETES */}
                    {ventaPaquetes.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#00206D',
                            marginBottom: '2px',
                            paddingLeft: '2px',
                          }}
                        >
                          Paquetes
                        </div>
                        <div
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            overflow: 'hidden',
                            background: '#FFFFFF',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                            <thead>
                              <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '36%' }}>Paquete</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '36%' }}>Detalle</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '14%' }}>ADL/CHD/INF</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '14%' }}>Total USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventaPaquetes.map((p, idx) => (
                                <tr
                                  key={idx}
                                  style={{
                                    borderTop: '1px solid #E2E8F0',
                                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                  }}
                                >
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                                    {p.titulo}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {p.detalle}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {p.paxStr}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', fontWeight: '700' }}>
                                    {formatCurrency(p.totalUSD)}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: '#F8FAFC', borderTop: '1px solid #CBD5E1' }}>
                                <td colSpan={3} style={{ padding: '3.5px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  Totales:
                                </td>
                                <td style={{ padding: '3.5px 6px', fontWeight: '700', color: '#0F172A' }}>
                                  {formatCurrency(ventaPaquetes.reduce((sum, p) => sum + p.totalUSD, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 7. VEHÍCULOS */}
                    {ventaVehiculos.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#00206D',
                            marginBottom: '2px',
                            paddingLeft: '2px',
                          }}
                        >
                          Vehículos
                        </div>
                        <div
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            overflow: 'hidden',
                            background: '#FFFFFF',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                            <thead>
                              <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '38%' }}>Vehículo</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '42%' }}>Detalle</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '20%' }}>Total USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventaVehiculos.map((veh, idx) => (
                                <tr
                                  key={idx}
                                  style={{
                                    borderTop: '1px solid #E2E8F0',
                                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                  }}
                                >
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                                    {veh.titulo}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {veh.detalle}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', fontWeight: '700' }}>
                                    {formatCurrency(veh.totalUSD)}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: '#F8FAFC', borderTop: '1px solid #CBD5E1' }}>
                                <td colSpan={2} style={{ padding: '3.5px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  Totales:
                                </td>
                                <td style={{ padding: '3.5px 6px', fontWeight: '700', color: '#0F172A' }}>
                                  {formatCurrency(ventaVehiculos.reduce((sum, veh) => sum + veh.totalUSD, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 8. OTROS SERVICIOS */}
                    {ventaOtros.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#00206D',
                            marginBottom: '2px',
                            paddingLeft: '2px',
                          }}
                        >
                          Otros Servicios
                        </div>
                        <div
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            overflow: 'hidden',
                            background: '#FFFFFF',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                            <thead>
                              <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '38%' }}>Servicio / Descripción</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '42%' }}>Detalle</th>
                                <th style={{ padding: '4px 6px', fontWeight: '700', width: '20%' }}>Total USD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventaOtros.map((o, idx) => (
                                <tr
                                  key={idx}
                                  style={{
                                    borderTop: '1px solid #E2E8F0',
                                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                  }}
                                >
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                                    {o.titulo}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                    {o.detalle}
                                  </td>
                                  <td style={{ padding: '3.5px 6px', color: '#0F172A', fontWeight: '700' }}>
                                    {formatCurrency(o.totalUSD)}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: '#F8FAFC', borderTop: '1px solid #CBD5E1' }}>
                                <td colSpan={2} style={{ padding: '3.5px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  Totales:
                                </td>
                                <td style={{ padding: '3.5px 6px', fontWeight: '700', color: '#0F172A' }}>
                                  {formatCurrency(ventaOtros.reduce((sum, o) => sum + o.totalUSD, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ESTADO VACÍO SI NO HAY NINGÚN SERVICIO */}
                    {ventaHoteles.length === 0 &&
                      ventaVuelos.length === 0 &&
                      ventaTraslados.length === 0 &&
                      ventaFerrys.length === 0 &&
                      ventaExcursiones.length === 0 &&
                      ventaPaquetes.length === 0 &&
                      ventaVehiculos.length === 0 &&
                      ventaOtros.length === 0 && (
                        <div
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            padding: '8px',
                            textAlign: 'center',
                            color: '#64748B',
                            fontSize: '9.5px',
                            background: '#FFFFFF',
                          }}
                        >
                          No hay servicios registrados en esta venta.
                        </div>
                      )}
                  </div>

                  {/* ========================================================== */}
                  {/* SECCIÓN 3: PAGOS RECIBIDOS                                 */}
                  {/* ========================================================== */}
                  <div style={{ marginBottom: '10px' }}>
                    {/* Cápsula Azul Marino con Metodosdepago.svg */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        background: '#00206D',
                        borderRadius: '9999px',
                        padding: '3px 14px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        marginBottom: '3px',
                      }}
                    >
                      <img
                        src={metodosPagoIcon}
                        alt=""
                        style={{
                          width: '12px',
                          height: '12px',
                          filter: 'brightness(0) invert(1)',
                        }}
                      />
                      <span>Pagos Recibidos</span>
                    </div>

                    {/* Tabla de Pagos */}
                    <div
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        overflow: 'hidden',
                        background: '#FFFFFF',
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                        <thead>
                          <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '32%' }}>Metodo</th>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '26%' }}>N° Transacción</th>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '18%' }}>Fecha</th>
                            <th style={{ padding: '4px 8px', fontWeight: '700', width: '24%' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listaPagos.length === 0 ? (
                            <tr style={{ borderTop: '1px solid #E2E8F0' }}>
                              <td colSpan={4} style={{ padding: '4px 8px', color: '#64748B', textAlign: 'center' }}>
                                No hay pagos registrados
                              </td>
                            </tr>
                          ) : (
                            listaPagos.map((p, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderTop: '1px solid #E2E8F0',
                                  background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                }}
                              >
                                <td style={{ padding: '3.5px 8px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                                  {p.metodo}
                                </td>
                                <td style={{ padding: '3.5px 8px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  {p.transaccion}
                                </td>
                                <td style={{ padding: '3.5px 8px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                  {p.fecha}
                                </td>
                                <td style={{ padding: '3.5px 8px', color: '#0F172A', fontWeight: '600' }}>
                                  {p.totalStr}
                                </td>
                              </tr>
                            ))
                          )}

                          {/* Fila de Totales de Pagos */}
                          <tr style={{ background: '#F8FAFC', borderTop: '1px solid #CBD5E1' }}>
                            <td colSpan={3} style={{ padding: '3.5px 12px', textAlign: 'right', fontWeight: '700', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                              Totales:
                            </td>
                            <td style={{ padding: '3.5px 8px', fontWeight: '700', color: '#0F172A' }}>
                              {formatCurrency(totalPagosRecibidosUSD)} USD
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* SECCIÓN 4: TOTALES FINANCIEROS                             */}
                  {/* ========================================================== */}
                  <div style={{ marginBottom: '10px' }}>
                    {/* Cápsula Azul Marino con resumen-financiero.svg */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        background: '#00206D',
                        borderRadius: '9999px',
                        padding: '3px 14px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        marginBottom: '3px',
                      }}
                    >
                      <img
                        src={resumenFinancieroIcon}
                        alt=""
                        style={{
                          width: '12px',
                          height: '12px',
                          filter: 'brightness(0) invert(1)',
                        }}
                      />
                      <span>Totales</span>
                    </div>

                    {/* Tabla de Totales */}
                    <div
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        overflow: 'hidden',
                        background: '#FFFFFF',
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '9.5px' }}>
                        <thead>
                          <tr style={{ background: '#00206D', color: '#FFFFFF' }}>
                            <th style={{ padding: '4px 6px', fontWeight: '700', width: '20%' }}>Subtotal</th>
                            <th style={{ padding: '4px 6px', fontWeight: '700', width: '20%' }}>Descuento</th>
                            <th style={{ padding: '4px 6px', fontWeight: '700', width: '20%' }}>Total</th>
                            <th style={{ padding: '4px 6px', fontWeight: '700', width: '20%' }}>Abono</th>
                            <th style={{ padding: '4px 6px', fontWeight: '700', width: '20%' }}>Restante</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderTop: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                            <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                              {formatCurrency(subtotalUSD)} USD
                            </td>
                            <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                              {formatCurrency(descuentoUSD)} USD
                            </td>
                            <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '700' }}>
                              {formatCurrency(totalGeneralUSD)} USD
                            </td>
                            <td style={{ padding: '4px 6px', color: '#0F172A', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                              {formatCurrency(totalAbonadoUSD)} USD
                            </td>
                            <td style={{ padding: '4px 6px', color: '#0F172A', fontWeight: '700' }}>
                              {formatCurrency(saldoRestanteUSD)} USD
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* SECCIÓN 5: OBSERVACIÓN                                     */}
                  {/* ========================================================== */}
                  <div style={{ marginBottom: '10px' }}>
                    {/* Cápsula Azul Marino con pencil-square.svg */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        background: '#00206D',
                        borderRadius: '9999px',
                        padding: '3px 14px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        marginBottom: '3px',
                      }}
                    >
                      <img
                        src={pencilSquareIcon}
                        alt=""
                        style={{
                          width: '12px',
                          height: '12px',
                          filter: 'brightness(0) invert(1)',
                        }}
                      />
                      <span>Observación</span>
                    </div>

                    {/* Caja de Observación */}
                    <div
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        minHeight: '34px',
                        padding: '6px 10px',
                        background: '#FFFFFF',
                        fontSize: '9.5px',
                        color: '#334155',
                        lineHeight: '1.3',
                      }}
                    >
                      {observacionTexto || ''}
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* SECCIÓN 6: FIRMAS                                          */}
                  {/* ========================================================== */}
                  <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                    {/* Fila 1: Asesor y Firma de Operaciones */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ fontSize: '10px', color: '#00206D', fontWeight: '800' }}>
                        ASESOR: <u style={{ fontWeight: '700', marginLeft: '3px' }}>{asesorNombre}</u>
                      </div>
                      <div style={{ fontSize: '10px', color: '#00206D', fontWeight: '800' }}>
                        FIRMA DE OPERACIONES: <span style={{ display: 'inline-block', width: '180px', borderBottom: '1.2px solid #00206D', marginLeft: '6px' }}></span>
                      </div>
                    </div>

                    {/* Línea horizontal naranja divisoria */}
                    <div style={{ width: '100%', height: '1.5px', background: '#F26522', margin: '8px 0 10px 0' }} />

                    {/* Fila 2: Firmas Administración, Coordinador, Líder */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontSize: '9px', color: '#00206D', fontWeight: '800' }}>
                        FIRMA DE ADMINISTRACION: <span style={{ display: 'inline-block', width: '90px', borderBottom: '1.2px solid #00206D', marginLeft: '4px' }}></span>
                      </div>
                      <div style={{ fontSize: '9px', color: '#00206D', fontWeight: '800' }}>
                        FIRMA COORDINADOR: <span style={{ display: 'inline-block', width: '90px', borderBottom: '1.2px solid #00206D', marginLeft: '4px' }}></span>
                      </div>
                      <div style={{ fontSize: '9px', color: '#00206D', fontWeight: '800' }}>
                        FIRMA DEL LIDER: <span style={{ display: 'inline-block', width: '90px', borderBottom: '1.2px solid #00206D', marginLeft: '4px' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* RENDERIZADO 2: COTIZACIÓN RÁPIDA (Modo Cotización)              */}
            {/* ============================================================== */}
            {!esModoVenta && (cabeEnPagina1 || activeTab === 'todas' || activeTab === '1') && (
              <div
                className="cotizacion-sheet"
                style={{
                  width: '816px',
                  height: '1056px',
                  minHeight: '1056px',
                  maxHeight: '1056px',
                  position: 'relative',
                  backgroundImage: `url(${cotizacionFondoP1})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#FFFFFF',
                  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* Título "COTIZACIÓN" centrado exactamente entre las dos líneas naranjas de la cabecera */}
                <div
                  style={{
                    position: 'absolute',
                    top: '127px',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    color: '#FFFFFF',
                    fontSize: '23px',
                    fontWeight: '800',
                    letterSpacing: '2.5px',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                  }}
                >
                  COTIZACIÓN
                </div>

                {/* Contenido Dinámico de la Hoja 1 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '252px',
                    left: '42px',
                    right: '42px',
                    bottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Fila Cliente, Fecha y N° */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <div style={{ color: '#555555', fontSize: '12px' }}>
                        Cliente:{' '}
                        <strong style={{ color: '#222222', fontSize: '12.5px', fontWeight: '700' }}>
                          {clienteNombre}
                        </strong>
                      </div>
                      <div style={{ color: '#555555', fontSize: '12px', marginTop: '3px' }}>
                        Fecha: {fechaEmision}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#555555', fontSize: '12px' }}>
                        N°:{' '}
                        <strong style={{ color: '#222222', fontSize: '12.5px', fontWeight: '700' }}>
                          {numeroFicha}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Cápsulas de Pasajeros y Fechas */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    {/* Cápsula Izquierda: Adultos, Niños, Infantes */}
                    <div
                      style={{
                        background: '#00206D',
                        borderRadius: '9999px',
                        border: '1.5px solid #F26522',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 16px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        boxShadow: '0 2px 6px rgba(0, 32, 109, 0.25)',
                      }}
                    >
                      <span style={{ padding: '0 8px' }}>Adultos: {paxAdultos}</span>
                      <span style={{ color: '#F26522', fontWeight: '300' }}>|</span>
                      <span style={{ padding: '0 8px' }}>Niños: {paxNinos}</span>
                      <span style={{ color: '#F26522', fontWeight: '300' }}>|</span>
                      <span style={{ padding: '0 8px' }}>Infantes: {paxInfantes}</span>
                    </div>

                    {/* Cápsula Derecha: Check In, Check Out */}
                    <div
                      style={{
                        background: '#00206D',
                        borderRadius: '9999px',
                        border: '1.5px solid #F26522',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 18px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        boxShadow: '0 2px 6px rgba(0, 32, 109, 0.25)',
                      }}
                    >
                      <span style={{ padding: '0 8px' }}>Check In: {checkinStr.replace(/\//g, '-')}</span>
                      <span style={{ color: '#F26522', fontWeight: '300' }}>|</span>
                      <span style={{ padding: '0 8px' }}>Check Out: {checkoutStr.replace(/\//g, '-')}</span>
                    </div>
                  </div>

                  {/* Contenedor Principal Gris de la Tabla de Productos */}
                  <div
                    style={{
                      background: '#E2E6EA',
                      borderRadius: '24px',
                      padding: '14px 22px 18px 22px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Cabecera Naranja "Descripción" y "Total USD" */}
                    <div
                      style={{
                        background: '#F26522',
                        borderRadius: '9999px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '7px 24px',
                        color: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '12px',
                        marginBottom: '10px',
                      }}
                    >
                      <span>Descripción</span>
                      <span>Total USD</span>
                    </div>

                    {/* Lista de Productos */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {!isGroupedMode ? (
                        /* MODO SIN AGRUPAR */
                        items.map((item, idx) => (
                          <div
                            key={item.uid || idx}
                            style={{
                              borderBottom: idx < items.length - 1 ? '1px solid rgba(17, 17, 17, 0.2)' : 'none',
                              padding: '7px 4px 7px 4px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div style={{ paddingRight: '16px', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#F26522', fontSize: '14px', lineHeight: '1' }}>▪</span>
                                <span
                                  style={{
                                    color: '#00206D',
                                    fontWeight: '700',
                                    fontSize: '12px',
                                  }}
                                >
                                  {item.titulo}
                                </span>
                              </div>
                              {item.detalle && (
                                <div
                                  style={{
                                    color: '#555555',
                                    fontSize: '10.5px',
                                    marginLeft: '14px',
                                    marginTop: '2px',
                                    lineHeight: '1.3',
                                  }}
                                >
                                  {item.detalle}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                color: '#00206D',
                                fontWeight: '700',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ${formatCurrency(item.precio)}
                            </div>
                          </div>
                        ))
                      ) : (
                        /* MODO AGRUPADO POR HOTEL */
                        hotelItems.map((hItem, hIdx) => {
                          const groupedServices = items.filter(
                            (it) =>
                              it.tipo !== 'hotel' &&
                              (Array.isArray(it.hotel_item_uids)
                                ? it.hotel_item_uids.includes(hItem.uid)
                                : it.hotel_item_uid === hItem.uid)
                          );
                          const hotelSubtotal =
                            Number(hItem.precio || 0) +
                            groupedServices.reduce((sum, g) => sum + (Number(g.precio) || 0), 0);

                          return (
                            <div
                              key={hItem.uid || hIdx}
                              style={{
                                borderBottom: hIdx < hotelItems.length - 1 ? '1.5px solid rgba(0, 32, 109, 0.35)' : 'none',
                                padding: '8px 4px 10px 4px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '3px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ color: '#F26522', fontSize: '15px', lineHeight: '1' }}>▪</span>
                                  <span
                                    style={{
                                      color: '#00206D',
                                      fontWeight: '700',
                                      fontSize: '12.5px',
                                    }}
                                  >
                                    {hItem.titulo}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    color: '#00206D',
                                    fontWeight: '700',
                                    fontSize: '12.5px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  ${formatCurrency(hotelSubtotal)}
                                </div>
                              </div>

                              {hItem.detalle && (
                                <div
                                  style={{
                                    color: '#555555',
                                    fontSize: '10.5px',
                                    marginLeft: '14px',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {hItem.detalle}
                                </div>
                              )}

                              {groupedServices.map((gItem, gIdx) => (
                                <div
                                  key={gItem.uid || gIdx}
                                  style={{
                                    borderTop: '1px solid rgba(17, 17, 17, 0.16)',
                                    padding: '5px 4px 5px 18px',
                                    marginTop: '4px',
                                  }}
                                >
                                  <div
                                    style={{
                                      color: '#00206D',
                                      fontWeight: '700',
                                      fontSize: '12px',
                                    }}
                                  >
                                    {gItem.titulo}
                                  </div>
                                  {gItem.detalle && (
                                    <div
                                      style={{
                                        color: '#555555',
                                        fontSize: '10.5px',
                                        marginTop: '1px',
                                        lineHeight: '1.3',
                                      }}
                                    >
                                      {gItem.detalle}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Cápsula Naranja "Total a pagar" */}
                  {!isGroupedMode && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '12px',
                      }}
                    >
                      <div
                        style={{
                          background: '#F26522',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '24px',
                          padding: '6px 24px',
                          color: '#FFFFFF',
                          fontWeight: '700',
                          fontSize: '12.5px',
                        }}
                      >
                        <span>Total a pagar:</span>
                        <span style={{ fontSize: '13px' }}>${formatCurrency(totalGeneralUSD)}</span>
                      </div>
                    </div>
                  )}

                  {/* SI CABE EN LA PÁGINA 1: COLOCAR LA CAJA AZUL DIRECTAMENTE AL PIE */}
                  {cabeEnPagina1 && (
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '20px',
                        paddingBottom: '12px',
                        width: '100%',
                      }}
                    >
                      {renderCajaImportante()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HOJA 2: SE MUESTRA SÓLO SI LA TABLA NO DEJÓ ESPACIO EN LA PÁG 1 */}
            {!esModoVenta && !cabeEnPagina1 && (activeTab === 'todas' || activeTab === '2') && (
              <div
                className="cotizacion-sheet"
                style={{
                  width: '816px',
                  height: '1056px',
                  minHeight: '1056px',
                  maxHeight: '1056px',
                  position: 'relative',
                  backgroundImage: `url(${cotizacionFondoP2})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#FFFFFF',
                  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* Caja Azul Marino "IMPORTANTE" anclada al pie de la Página 2 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '36px',
                    left: '60px',
                    right: '60px',
                  }}
                >
                  {renderCajaImportante()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
