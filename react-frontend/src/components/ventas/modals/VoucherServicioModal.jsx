import React, { useState, useMemo } from 'react';
import plantillaVoucher from '../../../assets/Plantilla-voucher-NC.png';

// SVG Icons (Estrictamente SVGs de assets, CERO emojis)
import ubicacionesIcon from '../../../assets/Ubicaciones.svg';
import imprimirIcon from '../../../assets/Imprimir.svg';
import hotelesIcon from '../../../assets/Hoteles.svg';
import aerolineasIcon from '../../../assets/Aerolineas.svg';
import trasladosIcon from '../../../assets/Traslados.svg';
import serviciosIcon from '../../../assets/Servicios.svg';

export default function VoucherServicioModal({
  isOpen,
  onClose,
  cotizacion,
  servicioInicial = null,
}) {
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [printMode, setPrintMode] = useState('current'); // 'current' | 'all'
  const [copied, setCopied] = useState(false);

  // Helper seguro para extraer texto
  const getSafeString = (val, fallback = '') => {
    if (!val && val !== 0) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return val.nombre || val.nombre_publico || val.name || val.titulo || val.descripcion || fallback;
    }
    return fallback;
  };

  const formatFechaDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      const clean = String(dateStr).split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return clean;
    } catch {
      return String(dateStr);
    }
  };

  const formatFechaConGuiones = (dateStr) => {
    const f = formatFechaDDMMYYYY(dateStr);
    return f.replace(/\//g, '-');
  };

  // Normalización general de la cotización / venta
  const numeroVoucher =
    cotizacion?.numero_ficha ||
    (cotizacion?.id ? String(cotizacion.id) : '15544');

  const fechaEmision = cotizacion?.fecha_creacion || cotizacion?.fecha || cotizacion?.created_at
    ? formatFechaConGuiones(cotizacion.fecha_creacion || cotizacion.fecha || cotizacion.created_at)
    : formatFechaConGuiones(new Date().toISOString());

  const asesorNombre =
    typeof cotizacion?.asesor === 'object' && cotizacion.asesor !== null
      ? cotizacion.asesor.name || cotizacion.asesor.nombre || `${cotizacion.asesor.first_name || ''} ${cotizacion.asesor.last_name || ''}`.trim() || 'Eveliannys Marín'
      : typeof cotizacion?.vendedor === 'object' && cotizacion.vendedor !== null
      ? cotizacion.vendedor.name || cotizacion.vendedor.nombre || 'Eveliannys Marín'
      : typeof cotizacion?.user === 'object' && cotizacion.user !== null
      ? cotizacion.user.name || cotizacion.user.nombre || 'Eveliannys Marín'
      : typeof cotizacion?.asesor === 'string' && cotizacion.asesor.trim()
      ? cotizacion.asesor
      : 'Eveliannys Marín';

  const clienteData = cotizacion?.cliente || {};
  const clienteNombre =
    typeof clienteData === 'string'
      ? clienteData
      : typeof clienteData === 'object' && clienteData !== null
      ? clienteData.nombre_completo ||
        `${clienteData.nombres || ''} ${clienteData.apellidos || ''}`.trim() ||
        clienteData.nombre ||
        'Cliente Titular'
      : 'Cliente Titular';

  // Pasajeros globales
  const paxAdultos = Number(cotizacion?.pax?.adultos ?? cotizacion?.adultos ?? 1);
  const paxNinos = Number(cotizacion?.pax?.ninos ?? cotizacion?.ninos ?? 0);
  const paxInfantes = Number(cotizacion?.pax?.infantes ?? cotizacion?.infantes ?? 0);

  // Fechas globales
  const checkinGlobal = cotizacion?.fechas?.checkin || cotizacion?.checkin || cotizacion?.fecha_inicio || '';
  const checkoutGlobal = cotizacion?.fechas?.checkout || cotizacion?.checkout || cotizacion?.fecha_fin || '';

  // =========================================================================
  // EXTRACCIÓN Y NORMALIZACIÓN DE TODOS LOS SERVICIOS DE LA VENTA / COTIZACIÓN
  // =========================================================================
  const listaServicios = useMemo(() => {
    if (!cotizacion) return [];
    const servicios = [];

    // 1. Hoteles
    if (Array.isArray(cotizacion.hoteles) && cotizacion.hoteles.length > 0) {
      cotizacion.hoteles.forEach((h, idx) => {
        const hotelNombre = getSafeString(h.hotel, getSafeString(h.nombre, 'Hotel Seleccionado'));
        const ubicacion = getSafeString(h.hotel?.ubicacion || h.ubicacion || h.ciudad || 'Margarita');
        const habitacion = getSafeString(h.tipo_habitacion, getSafeString(h.habitacion, 'Estándar'));
        const noches = Number(h.noches || 1);
        const dias = noches + 1;
        const regimen = getSafeString(h.tipo, getSafeString(h.regimen, 'Todo Incluido'));
        const checkinH = h.fecha_checkin ? formatFechaDDMMYYYY(h.fecha_checkin) : formatFechaDDMMYYYY(checkinGlobal);
        const checkoutH = h.fecha_checkout ? formatFechaDDMMYYYY(h.fecha_checkout) : formatFechaDDMMYYYY(checkoutGlobal);
        const adl = h.adultos ?? paxAdultos;
        const chd = h.ninos ?? paxNinos;
        const inf = h.infantes ?? paxInfantes;
        const localizador = h.localizador || h.codigo_reserva || cotizacion.localizador || 'N/A';

        servicios.push({
          id: `hotel_${h.id || idx}`,
          tipo: 'hotel',
          categoriaLabel: 'Alojamiento:',
          categoriaIcon: hotelesIcon,
          tituloPrincipal: `${hotelNombre} / ${ubicacion}`,
          lineaDetalle: `Habitación: ${habitacion}`,
          lineaDuracion: `${dias} Días y ${noches} Noches - ${regimen}`,
          fechasLabel: 'Checkin - Checkout',
          fechasValor: `${checkinH} - ${checkoutH}`,
          localizador: localizador,
          adultos: adl,
          ninos: chd,
          infantes: inf,
          politicasTitulo: 'CONDICIONES Y POLITICA HOTELES',
          politicas: [
            'Hora de Entrada 15:00 Hrs',
            'Hora de Salida 12:00 Mediodía',
            'No Incluye Almuerzo el día de su Salida',
          ],
          raw: h,
        });
      });
    }

    // 2. Vuelos
    if (Array.isArray(cotizacion.vuelos) && cotizacion.vuelos.length > 0) {
      cotizacion.vuelos.forEach((v, idx) => {
        const aerolinea = getSafeString(v.aerolinea, 'Aerolínea').replace(/^Vuelo:\s*/i, '');
        const itinerario = getSafeString(v.itinerario, 'Ruta aérea');
        const fechaVuelo = v.fecha_vuelo ? formatFechaDDMMYYYY(v.fecha_vuelo) : 'N/A';
        const fechaRetorno = v.fecha_retorno ? formatFechaDDMMYYYY(v.fecha_retorno) : null;
        const adl = v.adultos ?? paxAdultos;
        const chd = v.ninos ?? paxNinos;
        const inf = v.infantes ?? paxInfantes;
        const localizador = v.localizador || v.pnr || v.codigo_reserva || cotizacion.localizador || 'N/A';

        servicios.push({
          id: `vuelo_${v.id || idx}`,
          tipo: 'vuelo',
          categoriaLabel: 'Boletos Aéreos:',
          categoriaIcon: aerolineasIcon,
          tituloPrincipal: `${aerolinea}${v.localizador ? ' - PNR: ' + v.localizador : ''}`,
          lineaDetalle: `Itinerario: ${itinerario}`,
          lineaDuracion: `Fecha Salida: ${fechaVuelo}${fechaRetorno ? ` • Retorno: ${fechaRetorno}` : ''}`,
          fechasLabel: 'Fecha de Vuelo',
          fechasValor: fechaRetorno ? `${fechaVuelo} - ${fechaRetorno}` : `${fechaVuelo}`,
          localizador: localizador,
          adultos: adl,
          ninos: chd,
          infantes: inf,
          politicasTitulo: 'CONDICIONES Y POLITICA BOLETOS AÉREOS',
          politicas: [
            'Presentarse en el aeropuerto con 3 horas de anticipación para vuelos nacionales y 4 horas para internacionales.',
            'Boleto personal, intransferible y no reembolsable según regulaciones aeronáuticas.',
            'Cualquier cambio o reprogramación está sujeto a penalidades y disponibilidad de la aerolínea.',
          ],
          raw: v,
        });
      });
    }

    // 3. Traslados
    if (Array.isArray(cotizacion.traslados) && cotizacion.traslados.length > 0) {
      cotizacion.traslados.forEach((t, idx) => {
        const rutaOrigen = t.traslado?.ruta_origen || t.ruta_origen || 'Origen';
        const rutaDestino = t.traslado?.ruta_destino || t.ruta_destino || 'Destino';
        const fechaT = t.fecha_traslado ? formatFechaDDMMYYYY(t.fecha_traslado) : (t.fecha ? formatFechaDDMMYYYY(t.fecha) : 'A coordinar');
        const adl = t.adultos ?? paxAdultos;
        const chd = t.ninos ?? paxNinos;
        const inf = t.infantes ?? paxInfantes;
        const localizador = t.localizador || cotizacion.localizador || 'N/A';

        servicios.push({
          id: `traslado_${t.id || idx}`,
          tipo: 'traslado',
          categoriaLabel: 'Traslado Terrestre:',
          categoriaIcon: trasladosIcon,
          tituloPrincipal: `${rutaOrigen} - ${rutaDestino}`,
          lineaDetalle: `Servicio: ${t.tipo || 'Traslado Turístico'} ${t.observacion ? '• ' + t.observacion : ''}`,
          lineaDuracion: `Fecha Programada: ${fechaT}`,
          fechasLabel: 'Fecha del Servicio',
          fechasValor: fechaT,
          localizador: localizador,
          adultos: adl,
          ninos: chd,
          infantes: inf,
          politicasTitulo: 'CONDICIONES Y POLITICA TRASLADOS',
          politicas: [
            'Estar listo en el lobby del hotel o punto de encuentro 15 minutos antes de la hora acordada.',
            'En traslados de salida hacia el aeropuerto o terminal, el horario es estricto para garantizar su conexión.',
            'Capacidad máxima de equipaje recomendada: 1 maleta estándar y 1 bolso de mano por pasajero.',
          ],
          raw: t,
        });
      });
    }

    // 4. Excursiones
    if (Array.isArray(cotizacion.excursiones) && cotizacion.excursiones.length > 0) {
      cotizacion.excursiones.forEach((e, idx) => {
        const titulo = getSafeString(e.tipo_excursion, getSafeString(e.excursion, 'Excursión Turística')).replace(/^Excursión:\s*/i, '');
        const fechaE = e.fecha ? formatFechaDDMMYYYY(e.fecha) : 'A coordinar';
        const adl = e.adultos ?? paxAdultos;
        const chd = e.ninos ?? paxNinos;
        const inf = e.infantes ?? paxInfantes;
        const localizador = e.localizador || cotizacion.localizador || 'N/A';

        servicios.push({
          id: `excursion_${e.id || idx}`,
          tipo: 'excursion',
          categoriaLabel: 'Excursión Turística:',
          categoriaIcon: serviciosIcon,
          tituloPrincipal: titulo,
          lineaDetalle: `Actividad: ${e.detalle || 'Tour guiado con actividades recreativas'}`,
          lineaDuracion: `Fecha de Realización: ${fechaE}`,
          fechasLabel: 'Fecha del Tour',
          fechasValor: fechaE,
          localizador: localizador,
          adultos: adl,
          ninos: chd,
          infantes: inf,
          politicasTitulo: 'CONDICIONES Y POLITICA EXCURSIONES',
          politicas: [
            'Presentarse puntualmente en el punto de partida en la hora previamente informada.',
            'Llevar calzado adecuado, ropa cómoda, protector solar y toalla si la actividad lo amerita.',
            'Las actividades marítimas o al aire libre están sujetas a condiciones climáticas y de seguridad.',
          ],
          raw: e,
        });
      });
    }

    // 5. Boletos Marítimos / Ferrys
    const ferrysList = cotizacion.ferries || cotizacion.ferrys;
    if (Array.isArray(ferrysList) && ferrysList.length > 0) {
      ferrysList.forEach((f, idx) => {
        const ruta = getSafeString(f.ruta, 'Ruta Marítima');
        const detalle = `${f.clase || 'Turista'} • ${f.itinerario || 'Itinerario marítimo'}`;
        const fechaF = f.fecha_salida ? formatFechaDDMMYYYY(f.fecha_salida) : 'N/A';
        const adl = f.adultos ?? paxAdultos;
        const chd = f.ninos ?? paxNinos;
        const inf = f.infantes ?? paxInfantes;
        const localizador = f.localizador || cotizacion.localizador || 'N/A';

        servicios.push({
          id: `ferry_${f.id || idx}`,
          tipo: 'ferry',
          categoriaLabel: 'Boleto Marítimo:',
          categoriaIcon: serviciosIcon,
          tituloPrincipal: `Ferry: ${ruta}`,
          lineaDetalle: detalle,
          lineaDuracion: f.vehiculos > 0 ? `Vehículos a bordo: ${f.vehiculos}` : 'Pasaje individual',
          fechasLabel: 'Fecha de Zarpe',
          fechasValor: fechaF,
          localizador: localizador,
          adultos: adl,
          ninos: chd,
          infantes: inf,
          politicasTitulo: 'CONDICIONES Y POLITICA MARÍTIMA',
          politicas: [
            'Presentarse en el terminal marítimo con 2 horas de anticipación con vehículo o 1 hora a pie.',
            'Presentar documento de identidad original y carnet de circulación del vehículo si viaja con auto.',
            'El boleto es intransferible y está sujeto a las regulaciones de la naviera.',
          ],
          raw: f,
        });
      });
    }

    // 6. Paquetes
    if (Array.isArray(cotizacion.paquetes) && cotizacion.paquetes.length > 0) {
      cotizacion.paquetes.forEach((p, idx) => {
        const titulo = getSafeString(p.paquete, 'Paquete Turístico').replace(/^Paquete:\s*/i, '');
        const fechaP = p.fecha ? formatFechaDDMMYYYY(p.fecha) : 'N/A';
        const adl = p.adultos ?? paxAdultos;
        const chd = p.ninos ?? paxNinos;
        const inf = p.infantes ?? paxInfantes;
        const localizador = p.localizador || cotizacion.localizador || 'N/A';

        servicios.push({
          id: `paquete_${p.id || idx}`,
          tipo: 'paquete',
          categoriaLabel: 'Paquete Turístico:',
          categoriaIcon: serviciosIcon,
          tituloPrincipal: titulo,
          lineaDetalle: `Detalle: ${p.detalle || 'Servicios combinados según especificaciones de la cotización'}`,
          lineaDuracion: `Fecha: ${fechaP}`,
          fechasLabel: 'Vigencia del Paquete',
          fechasValor: fechaP,
          localizador: localizador,
          adultos: adl,
          ninos: chd,
          infantes: inf,
          politicasTitulo: 'CONDICIONES Y POLITICA PAQUETES',
          politicas: [
            'Los servicios incluidos son estrictamente los detallados en la confirmación de la reserva.',
            'Cualquier cambio o solicitud adicional debe coordinarse con anticipación con la agencia.',
            'Sujeto a las políticas de cancelación y reprogramación de los operadores del paquete.',
          ],
          raw: p,
        });
      });
    }

    // 7. Vehículos
    if (Array.isArray(cotizacion.vehiculos) && cotizacion.vehiculos.length > 0) {
      cotizacion.vehiculos.forEach((veh, idx) => {
        const titulo = `${veh.tipo_vehiculo || 'Vehículo'} ${veh.modelo || ''}`.trim();
        const detalle = `${veh.tipo_transmision || 'Automático'} • ${veh.dias || 1} días de alquiler`;
        const checkinV = formatFechaDDMMYYYY(checkinGlobal);
        const checkoutV = formatFechaDDMMYYYY(checkoutGlobal);
        const localizador = veh.localizador || cotizacion.localizador || 'N/A';

        servicios.push({
          id: `vehiculo_${veh.id || idx}`,
          tipo: 'vehiculo',
          categoriaLabel: 'Alquiler de Vehículo:',
          categoriaIcon: serviciosIcon,
          tituloPrincipal: titulo,
          lineaDetalle: detalle,
          lineaDuracion: `Entrega y Devolución según itinerario`,
          fechasLabel: 'Periodo de Alquiler',
          fechasValor: `${checkinV} - ${checkoutV}`,
          localizador: localizador,
          adultos: paxAdultos,
          ninos: paxNinos,
          infantes: paxInfantes,
          politicasTitulo: 'CONDICIONES Y POLITICA VEHÍCULOS',
          politicas: [
            'Conductor principal debe presentar licencia de conducir vigente y tarjeta de crédito para depósito en garantía.',
            'El vehículo debe entregarse en las mismas condiciones y con el mismo nivel de combustible recibido.',
            'Tarifa sujeta a las condiciones y coberturas del contrato de alquiler.',
          ],
          raw: veh,
        });
      });
    }

    // 8. Otros
    if (Array.isArray(cotizacion.otros) && cotizacion.otros.length > 0) {
      cotizacion.otros.forEach((o, idx) => {
        const desc = getSafeString(o.descripcion, getSafeString(o.titulo, 'Servicio Adicional'));
        const esTraslado = desc.toLowerCase().includes('traslado');
        const fechaO = o.fecha ? formatFechaDDMMYYYY(o.fecha) : 'A coordinar';
        const localizador = o.localizador || cotizacion.localizador || 'N/A';

        servicios.push({
          id: `otro_${o.id || idx}`,
          tipo: esTraslado ? 'traslado' : 'otro',
          categoriaLabel: esTraslado ? 'Traslado Terrestre:' : 'Servicio Especial:',
          categoriaIcon: esTraslado ? trasladosIcon : serviciosIcon,
          tituloPrincipal: desc.replace(/^Servicio:\s*/i, ''),
          lineaDetalle: o.detalle || 'Servicio contratado a través de Plan de Viaje',
          lineaDuracion: `Fecha Programada: ${fechaO}`,
          fechasLabel: 'Fecha del Servicio',
          fechasValor: fechaO,
          localizador: localizador,
          adultos: paxAdultos,
          ninos: paxNinos,
          infantes: paxInfantes,
          politicasTitulo: esTraslado ? 'CONDICIONES Y POLITICA TRASLADOS' : 'CONDICIONES Y POLITICA GENERAL',
          politicas: esTraslado ? [
            'Estar listo en el lobby del hotel o punto de encuentro 15 minutos antes de la hora acordada.',
            'En traslados de salida hacia el aeropuerto, el horario es estricto para garantizar su vuelo.',
            'Capacidad máxima de equipaje: 1 maleta estándar por pasajero.',
          ] : [
            'Servicio sujeto a las condiciones acordadas con el operador y asesor comercial.',
            'Presentar este voucher al momento de hacer uso del servicio contratado.',
          ],
          raw: o,
        });
      });
    }

    // Si no vinieron entidades directas, extraer de items (cotización rápida o ficha normalizada)
    if (servicios.length === 0 && Array.isArray(cotizacion.items) && cotizacion.items.length > 0) {
      cotizacion.items.forEach((it, idx) => {
        const tipo = (it.tipo || '').toLowerCase();
        const titulo = getSafeString(it.titulo, 'Servicio').replace(/^(Hotel|Vuelo|Excursión|Paquete|Ferry|Servicio):\s*/i, '');
        const detalle = getSafeString(it.detalle, '');
        const adl = it.data?.adultos ?? paxAdultos;
        const chd = it.data?.ninos ?? paxNinos;
        const inf = it.data?.infantes ?? paxInfantes;
        const localizador = it.data?.localizador || it.localizador || cotizacion.localizador || 'N/A';

        if (tipo === 'hotel') {
          const checkinH = formatFechaDDMMYYYY(checkinGlobal);
          const checkoutH = formatFechaDDMMYYYY(checkoutGlobal);
          const noches = it.data?.noches || 1;
          servicios.push({
            id: `item_hotel_${idx}`,
            tipo: 'hotel',
            categoriaLabel: 'Alojamiento:',
            categoriaIcon: hotelesIcon,
            tituloPrincipal: `${titulo} / Margarita`,
            lineaDetalle: detalle ? `Habitación: ${detalle}` : 'Habitación: Estándar',
            lineaDuracion: `${Number(noches) + 1} Días y ${noches} Noches - Todo Incluido`,
            fechasLabel: 'Checkin - Checkout',
            fechasValor: `${checkinH} - ${checkoutH}`,
            localizador: localizador,
            adultos: adl,
            ninos: chd,
            infantes: inf,
            politicasTitulo: 'CONDICIONES Y POLITICA HOTELES',
            politicas: [
              'Hora de Entrada 15:00 Hrs',
              'Hora de Salida 12:00 Mediodía',
              'No Incluye Almuerzo el día de su Salida',
            ],
            raw: it,
          });
        } else if (tipo === 'vuelo' || tipo === 'boletos_aereos' || tipo === 'vuelos') {
          servicios.push({
            id: `item_vuelo_${idx}`,
            tipo: 'vuelo',
            categoriaLabel: 'Boletos Aéreos:',
            categoriaIcon: aerolineasIcon,
            tituloPrincipal: titulo,
            lineaDetalle: detalle || 'Ruta aérea reservada',
            lineaDuracion: 'Horarios e itinerario confirmados',
            fechasLabel: 'Fecha de Vuelo',
            fechasValor: formatFechaDDMMYYYY(checkinGlobal),
            localizador: localizador,
            adultos: adl,
            ninos: chd,
            infantes: inf,
            politicasTitulo: 'CONDICIONES Y POLITICA BOLETOS AÉREOS',
            politicas: [
              'Presentarse en el aeropuerto con 3 horas de anticipación para vuelos nacionales y 4 horas para internacionales.',
              'Boleto personal, intransferible y no reembolsable según regulaciones aeronáuticas.',
              'Cualquier cambio o reprogramación está sujeto a penalidades y disponibilidad de la aerolínea.',
            ],
            raw: it,
          });
        } else if (tipo === 'traslado' || String(it.titulo || '').toLowerCase().includes('traslado')) {
          servicios.push({
            id: `item_traslado_${idx}`,
            tipo: 'traslado',
            categoriaLabel: 'Traslado Terrestre:',
            categoriaIcon: trasladosIcon,
            tituloPrincipal: titulo,
            lineaDetalle: detalle || 'Traslado Turístico',
            lineaDuracion: 'Servicio programado',
            fechasLabel: 'Fecha del Servicio',
            fechasValor: formatFechaDDMMYYYY(checkinGlobal),
            localizador: localizador,
            adultos: adl,
            ninos: chd,
            infantes: inf,
            politicasTitulo: 'CONDICIONES Y POLITICA TRASLADOS',
            politicas: [
              'Estar listo en el lobby del hotel o punto de encuentro 15 minutos antes de la hora acordada.',
              'En traslados de salida hacia el aeropuerto, el horario es estricto para garantizar su vuelo.',
              'Capacidad máxima de equipaje: 1 maleta estándar por pasajero.',
            ],
            raw: it,
          });
        } else {
          servicios.push({
            id: `item_otro_${idx}`,
            tipo: tipo || 'otro',
            categoriaLabel: 'Servicio Contratado:',
            categoriaIcon: serviciosIcon,
            tituloPrincipal: titulo,
            lineaDetalle: detalle || 'Servicio turístico según itinerario',
            lineaDuracion: 'Servicio confirmado',
            fechasLabel: 'Fecha de Ejecución',
            fechasValor: formatFechaDDMMYYYY(checkinGlobal),
            localizador: localizador,
            adultos: adl,
            ninos: chd,
            infantes: inf,
            politicasTitulo: 'CONDICIONES Y POLITICA GENERAL',
            politicas: [
              'Presentar este voucher al momento de hacer uso del servicio contratado.',
              'Servicio sujeto a las condiciones pactadas con el operador.',
            ],
            raw: it,
          });
        }
      });
    }

    // Si aún está vacío, crear un servicio por defecto de alojamiento
    if (servicios.length === 0) {
      servicios.push({
        id: 'default_hotel',
        tipo: 'hotel',
        categoriaLabel: 'Alojamiento:',
        categoriaIcon: hotelesIcon,
        tituloPrincipal: 'Hotel Seleccionado / Playa El Agua',
        lineaDetalle: 'Habitación: Doble / Triple / Superior',
        lineaDuracion: '2 Días y 1 Noches - Todo Incluido',
        fechasLabel: 'Checkin - Checkout',
        fechasValor: `${formatFechaDDMMYYYY(checkinGlobal) || '20/11/2026'} - ${formatFechaDDMMYYYY(checkoutGlobal) || '21/11/2026'}`,
        localizador: cotizacion?.localizador || 'N/A',
        adultos: paxAdultos,
        ninos: paxNinos,
        infantes: paxInfantes,
        politicasTitulo: 'CONDICIONES Y POLITICA HOTELES',
        politicas: [
          'Hora de Entrada 15:00 Hrs',
          'Hora de Salida 12:00 Mediodía',
          'No Incluye Almuerzo el día de su Salida',
        ],
        raw: {},
      });
    }

    return servicios;
  }, [cotizacion, checkinGlobal, checkoutGlobal, paxAdultos, paxNinos, paxInfantes]);

  // Si se pasó un servicio inicial, seleccionarlo
  React.useEffect(() => {
    if (servicioInicial && listaServicios.length > 0) {
      const idx = listaServicios.findIndex(
        (s) => s.id === servicioInicial.id || s.raw === servicioInicial || s.tipo === servicioInicial.tipo
      );
      if (idx >= 0) setSelectedServiceIndex(idx);
    }
  }, [servicioInicial, listaServicios]);

  if (!isOpen || !cotizacion) return null;

  const currentService = listaServicios[selectedServiceIndex] || listaServicios[0];

  const handlePrint = (mode = 'current') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyDetails = () => {
    if (!currentService) return;
    const txt = `*VOUCHER DE SERVICIO - PLAN DE VIAJE*
*Voucher #:* ${numeroVoucher}
*Fecha Emisión:* ${fechaEmision}
*Emitido por:* ${asesorNombre}

*Titular:* ${clienteNombre}
*Pasajeros:* ${currentService.adultos} Adulto(s), ${currentService.ninos} Niño(s), ${currentService.infantes} Infante(s)

*Servicio:* ${currentService.categoriaLabel}
*Detalle:* ${currentService.tituloPrincipal}
${currentService.lineaDetalle}
${currentService.lineaDuracion}

*${currentService.fechasLabel}:* ${currentService.fechasValor}
*Localizador:* ${currentService.localizador}

*Emergencias:* (+58) 0414-8256478 ó (+58) 0412-2168234`;

    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Renderizador de un Voucher individual (Exactitud 100% de la plantilla)
  const renderSingleVoucher = (srv, key) => {
    if (!srv) return null;

    return (
      <div
        key={key || srv.id}
        className="voucher-sheet"
        style={{
          width: '792px',
          height: '1024px',
          minHeight: '1024px',
          maxHeight: '1024px',
          position: 'relative',
          backgroundImage: `url(${plantillaVoucher})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          margin: '0 auto 24px auto',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Montserrat', sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
        }}
      >
        {/* Contenido Central: Posicionado dentro de los márgenes útiles de la plantilla */}
        <div
          style={{
            position: 'absolute',
            top: '190px',
            bottom: '65px',
            left: '42px',
            right: '42px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            boxSizing: 'border-box',
          }}
        >
          {/* ========================================================= */}
          {/* 1. TÍTULO PRINCIPAL Y LÍNEA SUBRAYADA NARANJA */}
          {/* ========================================================= */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: '800',
                color: '#00206D',
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0, 32, 109, 0.15)',
              }}
            >
              Voucher de Servicio
            </h1>
            <div
              style={{
                width: '320px',
                height: '3.5px',
                backgroundColor: '#F26522',
                borderRadius: '2px',
                margin: '5px auto 0 auto',
              }}
            />
          </div>

          {/* ========================================================= */}
          {/* 2. BARRA DE METADATOS SUPERIOR (3 CÁPSULAS) */}
          {/* ========================================================= */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            {/* Cápsula Azul: Voucher # */}
            <div
              style={{
                background: '#00206D',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.3px',
                textAlign: 'center',
                flex: '1',
                boxShadow: '0 2px 4px rgba(0, 32, 109, 0.2)',
              }}
            >
              Voucher #: {numeroVoucher}
            </div>

            {/* Cápsula Naranja: Fecha de Emisión */}
            <div
              style={{
                background: '#F26522',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.3px',
                textAlign: 'center',
                flex: '1.2',
                boxShadow: '0 2px 4px rgba(242, 101, 34, 0.25)',
              }}
            >
              Fecha de Emisión: {fechaEmision}
            </div>

            {/* Cápsula Azul: Emitido por */}
            <div
              style={{
                background: '#00206D',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.3px',
                textAlign: 'center',
                flex: '1.3',
                boxShadow: '0 2px 4px rgba(0, 32, 109, 0.2)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Emitido por: {asesorNombre}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. TEXTO DE INTRODUCCIÓN Y NOMBRE DEL TITULAR */}
          {/* ========================================================= */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <p
              style={{
                margin: '0 0 4px 0',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: '600',
                letterSpacing: '0.2px',
              }}
            >
              Sirvase a prestar los siguientes servicios al portador del presente voucher:
            </p>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#00206D',
                letterSpacing: '0.4px',
                textTransform: 'capitalize',
              }}
            >
              {clienteNombre}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. CONTEO DE PASAJEROS (3 CÁPSULAS) */}
          {/* ========================================================= */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            {/* Adultos */}
            <div
              style={{
                background: '#00206D',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '6px 16px',
                fontSize: '13.5px',
                fontWeight: '700',
                textAlign: 'center',
                flex: '1',
                boxShadow: '0 2px 4px rgba(0, 32, 109, 0.2)',
              }}
            >
              Adultos: {srv.adultos}
            </div>

            {/* Niños */}
            <div
              style={{
                background: '#F26522',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '6px 16px',
                fontSize: '13.5px',
                fontWeight: '700',
                textAlign: 'center',
                flex: '1',
                boxShadow: '0 2px 4px rgba(242, 101, 34, 0.25)',
              }}
            >
              Niños: {srv.ninos}
            </div>

            {/* Infantes */}
            <div
              style={{
                background: '#00206D',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '6px 16px',
                fontSize: '13.5px',
                fontWeight: '700',
                textAlign: 'center',
                flex: '1',
                boxShadow: '0 2px 4px rgba(0, 32, 109, 0.2)',
              }}
            >
              Infantes: {srv.infantes}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. TARJETA CONTENEDORA DEL SERVICIO (RECUADRO GRIS/BLANCO) */}
          {/* ========================================================= */}
          <div
            style={{
              position: 'relative',
              borderRadius: '14px',
              border: '1.5px solid #CBD5E1',
              background: '#F8FAFC',
              padding: '24px 20px 18px 20px',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            {/* Pestaña / Lengüeta superior centrada naranja */}
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#F26522',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '4px 32px',
                fontSize: '13.5px',
                fontWeight: '700',
                letterSpacing: '0.3px',
                boxShadow: '0 2px 6px rgba(242, 101, 34, 0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              {srv.categoriaLabel}
            </div>

            {/* Título Principal del Servicio */}
            <div
              style={{
                fontSize: '18px',
                fontWeight: '800',
                color: '#00206D',
                marginBottom: '5px',
                marginTop: '4px',
              }}
            >
              {srv.tituloPrincipal}
            </div>

            {/* Línea 2: Detalle / Habitación / Tipo */}
            <div
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: '#00206D',
                marginBottom: '5px',
              }}
            >
              {srv.lineaDetalle}
            </div>

            {/* Línea 3: Duración y Plan */}
            <div
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: '#00206D',
              }}
            >
              {srv.lineaDuracion}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 6. BARRA COMBINADA DE FECHAS Y LOCALIZADOR */}
          {/* ========================================================= */}
          <div
            style={{
              display: 'flex',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '16px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Lado Izquierdo Azul: Fechas */}
            <div
              style={{
                background: '#00206D',
                color: '#FFFFFF',
                flex: '1.2',
                padding: '8px 16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#CBD5E1' }}>
                {srv.fechasLabel}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', marginTop: '1px' }}>
                {srv.fechasValor}
              </div>
            </div>

            {/* Lado Derecho Naranja: Localizador */}
            <div
              style={{
                background: '#F26522',
                color: '#FFFFFF',
                flex: '1',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <img
                src={ubicacionesIcon}
                alt=""
                style={{
                  width: '18px',
                  height: '18px',
                  filter: 'brightness(0) invert(1)',
                }}
              />
              <span style={{ fontSize: '15px', fontWeight: '800' }}>
                Localizador{srv.localizador && srv.localizador !== 'N/A' ? `: ${srv.localizador}` : ''}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 7. AVISO DE EMERGENCIA */}
          {/* ========================================================= */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <p
              style={{
                margin: '0 0 3px 0',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              En caso de presentarse una emergencia comunicarse a los siguientes números
            </p>
            <div
              style={{
                fontSize: '16px',
                fontWeight: '800',
                color: '#00206D',
                letterSpacing: '0.3px',
              }}
            >
              (+58) 0414-8256478 ó (+58) 0412-2168234
            </div>
          </div>

          {/* ========================================================= */}
          {/* 8. CONDICIONES Y POLÍTICAS */}
          {/* ========================================================= */}
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                fontSize: '15.5px',
                fontWeight: '800',
                color: '#00206D',
                letterSpacing: '0.5px',
                marginBottom: '4px',
              }}
            >
              {srv.politicasTitulo}
            </div>
            <div
              style={{
                width: '320px',
                height: '3px',
                backgroundColor: '#F26522',
                borderRadius: '2px',
                marginBottom: '10px',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {srv.politicas.map((pol, pIdx) => (
                <div
                  key={pIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    color: '#1E293B',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#F26522',
                      flexShrink: 0,
                    }}
                  />
                  <span>{pol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
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
      {/* Estilos CSS para Impresión exacta de Documentos (Cero margen, Hoja Carta exacta) */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-voucher-root, #printable-voucher-root * {
            visibility: visible !important;
          }
          #printable-voucher-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .voucher-sheet {
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

      {/* Contenedor Modal */}
      <div
        style={{
          width: '100%',
          maxWidth: '890px',
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
        {/* Barra Superior de Control (Solo pantalla) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: '#0F1E42',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {/* Selector de Servicio si hay más de 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#CBD5E1' }}>
              Voucher:
            </span>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '3px',
                gap: '4px',
                maxWidth: '460px',
                overflowX: 'auto',
              }}
            >
              {listaServicios.map((srv, idx) => (
                <button
                  key={srv.id || idx}
                  type="button"
                  onClick={() => setSelectedServiceIndex(idx)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: selectedServiceIndex === idx ? '#F26522' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  title={srv.tituloPrincipal}
                >
                  {srv.tipo.toUpperCase()}: {srv.tituloPrincipal.split('/')[0].slice(0, 18)}
                  {srv.tituloPrincipal.split('/')[0].length > 18 ? '...' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Copiar Resumen */}
            <button
              type="button"
              onClick={handleCopyDetails}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: copied ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              title="Copiar datos del voucher"
            >
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            {/* Imprimir Todos si hay varios */}
            {listaServicios.length > 1 && (
              <button
                type="button"
                onClick={() => handlePrint('all')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  background: 'rgba(0, 32, 109, 0.85)',
                  border: '1px solid rgba(242, 101, 34, 0.5)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                title="Imprimir todos los vouchers en lote"
              >
                <img
                  src={imprimirIcon}
                  alt=""
                  style={{ width: '14px', height: '14px', filter: 'brightness(0) invert(1)' }}
                />
                <span>Imprimir Todos ({listaServicios.length})</span>
              </button>
            )}

            {/* Imprimir Actual / Guardar en PDF */}
            <button
              type="button"
              onClick={() => handlePrint('current')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                background: '#F26522',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(242, 101, 34, 0.4)',
              }}
              title="Imprimir Voucher o Guardar como PDF"
            >
              <img
                src={imprimirIcon}
                alt=""
                style={{ width: '14px', height: '14px', filter: 'brightness(0) invert(1)' }}
              />
              <span>Imprimir / PDF</span>
            </button>

            {/* Cerrar Modal */}
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
                fontSize: '1.2rem',
                fontWeight: '700',
              }}
              title="Cerrar vista previa"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Área de Visualización con Scroll */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 16px',
            background: '#060B19',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div id="printable-voucher-root">
            {printMode === 'all'
              ? listaServicios.map((srv, idx) => renderSingleVoucher(srv, `v_${idx}`))
              : renderSingleVoucher(currentService, 'v_single')}
          </div>
        </div>
      </div>
    </div>
  );
}
