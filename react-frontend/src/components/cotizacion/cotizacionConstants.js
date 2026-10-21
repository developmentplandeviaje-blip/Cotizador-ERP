import imgHoteles from '../../assets/Hoteles.svg';
import imgAerolineas from '../../assets/Aerolineas.svg';
import imgTraslados from '../../assets/Traslados.svg';
import imgExcursiones from '../../assets/Excursiones.svg';
import imgPaquetes from '../../assets/Paqueteria.svg';
import imgVehiculos from '../../assets/Vehiculos.svg';
import imgAgregar from '../../assets/Agregar.svg';

export const PRODUCT_TABS = [
  { id: 'hotel', label: 'Hoteles', icon: imgHoteles, color: '#E87217', rgb: '232, 114, 23' },
  { id: 'vuelo', label: 'Vuelos', icon: imgAerolineas, color: '#38BDF8', rgb: '56, 189, 248' },
  { id: 'traslado', label: 'Traslados', icon: imgTraslados, color: '#10B981', rgb: '16, 185, 129' },
  { id: 'excursion', label: 'Excursiones', icon: imgExcursiones, color: '#A855F7', rgb: '168, 85, 247' },
  { id: 'paquete', label: 'Paquetes', icon: imgPaquetes, color: '#EC4899', rgb: '236, 72, 153' },
  { id: 'vehiculo', label: 'Vehículos', icon: imgVehiculos, color: '#EAB308', rgb: '234, 179, 8' },
  { id: 'ferry', label: 'Ferries', icon: '⛴️', color: '#06B6D4', rgb: '6, 182, 212' },
  { id: 'otro', label: 'Otros', icon: imgAgregar, color: '#6366F1', rgb: '99, 102, 241' },
];

export const PRODUCT_COLOR_MAP = PRODUCT_TABS.reduce((acc, tab) => {
  acc[tab.id] = tab;
  return acc;
}, {});
