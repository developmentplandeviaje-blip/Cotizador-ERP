import imgHoteles from '../../assets/Hoteles.svg';
import imgAerolineas from '../../assets/Aerolineas.svg';
import imgTraslados from '../../assets/Traslados.svg';
import imgExcursiones from '../../assets/Excursiones.svg';
import imgPaquetes from '../../assets/Paqueteria.svg';
import imgVehiculos from '../../assets/Vehiculos.svg';
import imgAgregar from '../../assets/Agregar.svg';

export const PRODUCT_TABS = [
  { id: 'hotel', label: 'Hoteles', icon: imgHoteles, description: 'Alojamiento y habitaciones', color: '#E87217', rgb: '232, 114, 23' },
  { id: 'vuelo', label: 'Vuelos', icon: imgAerolineas, description: 'Boletería aérea nacional o internacional', color: '#38BDF8', rgb: '56, 189, 248' },
  { id: 'traslado', label: 'Traslados', icon: imgTraslados, description: 'Rutas terrestres o traslados VIP', color: '#10B981', rgb: '16, 185, 129' },
  { id: 'excursion', label: 'Excursiones', icon: imgExcursiones, description: 'Tours, paseos y full days', color: '#A855F7', rgb: '168, 85, 247' },
  { id: 'paquete', label: 'Paquetes', icon: imgPaquetes, description: 'Paquetes turísticos completos', color: '#EC4899', rgb: '236, 72, 153' },
  { id: 'vehiculo', label: 'Vehículos', icon: imgVehiculos, description: 'Alquiler de autos y camionetas', color: '#EAB308', rgb: '234, 179, 8' },
  { id: 'ferry', label: 'Ferries', icon: '⛴️', description: 'Pasajes y vehículos marítimos', color: '#06B6D4', rgb: '6, 182, 212' },
  { id: 'otro', label: 'Otros', icon: imgAgregar, description: 'Servicios personalizados', color: '#6366F1', rgb: '99, 102, 241' },
];

export const PRODUCT_COLOR_MAP = PRODUCT_TABS.reduce((acc, tab) => {
  acc[tab.id] = tab;
  return acc;
}, {});
