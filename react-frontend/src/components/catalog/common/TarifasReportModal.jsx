import React from 'react';
import plantillaTarifas from '../../../assets/Plantilla-tarifas.png';

const money = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? `$${number.toFixed(2)}` : '$0.00';
};

const dateText = (value) => {
  if (!value) return '—';
  const parts = String(value).slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(value);
};

function ReportTable({ headers, rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '10px', color: '#17324D' }}>
      <thead><tr>{headers.map((header, index) => (
        <th key={header} style={{ background: '#173F86', color: '#FFFFFF', padding: '7px 5px', border: '1px solid #FFFFFF', textAlign: index === 0 ? 'left' : 'center', fontWeight: 700 }}>{header}</th>
      ))}</tr></thead>
      <tbody>{rows.map((row, rowIndex) => (
        <tr key={rowIndex}>{row.map((cell, cellIndex) => (
          <td key={cellIndex} style={{ padding: '6px 5px', border: '1px solid #B9C8D8', textAlign: cellIndex === 0 ? 'left' : 'center', background: rowIndex % 2 ? '#EDF4FC' : '#FFFFFF', verticalAlign: 'middle' }}>{cell}</td>
        ))}</tr>
      ))}</tbody>
    </table>
  );
}

function HotelReport({ item }) {
  const habitaciones = item.habitaciones || [];
  const pension = item.tipo || 'Pensión Completa';
  const edades = `${item.edad_adolescentes || '12 - 17'} Adolescentes · ${item.edad_ninos || '5 - 11'} Niños · ${item.edad_infantes || '0 - 4'} Infantes`;
  return <>
    <div style={{ background: '#173F86', color: '#FFFFFF', borderRadius: '7px', padding: '7px 12px', marginBottom: '8px', fontWeight: 700, fontSize: '15px' }}>
      <span style={{ marginRight: '8px', fontSize: '19px' }}>▣</span>{item.nombre}
    </div>
    <div style={{ fontSize: '9px', color: '#17324D', margin: '-2px 0 8px 52px', fontWeight: 700 }}>{pension} · Edad {edades}</div>
    {habitaciones.length ? habitaciones.map((habitacion) => (
      <div key={habitacion.id} style={{ marginBottom: '10px' }}>
        <ReportTable
          headers={['Habitación', 'Fecha', 'Precio ADL', 'Precio CHD', 'Última Actualización']}
          rows={(habitacion.tarifas || []).map((tarifa) => [
            `${habitacion.habitacion}${habitacion.minimo_noches ? `\nMín. ${habitacion.minimo_noches} noches` : ''}`,
            `${dateText(tarifa.desde)} - ${dateText(tarifa.hasta)}`,
            money(tarifa.precio_noche_adulto),
            money(tarifa.precio_noche_nino),
            dateText(tarifa.fecha_actualizacion),
          ])}
        />
      </div>
    )) : <div style={{ border: '1px solid #B9C8D8', padding: '16px', textAlign: 'center', color: '#596C80', background: '#FFFFFF' }}>Sin habitaciones registradas</div>}
  </>;
}

function CatalogReport({ type, items }) {
  if (type === 'excursiones') return <ReportTable
    headers={['Excursión', 'Precio Adulto (USD)', 'Precio Niño (USD)', 'Última Actualización']}
    rows={items.map((item) => [item.tipo_excursion, money(item.precio_adulto).replace('$', ''), money(item.precio_nino).replace('$', ''), dateText(item.fecha_actualizacion)])}
  />;
  if (type === 'paquetes') return <ReportTable
    headers={['Paquete', 'Precio Adulto (USD)', 'Precio Niño (USD)', 'Última Actualización']}
    rows={items.map((item) => [item.paquete, money(item.precio_adulto).replace('$', ''), money(item.precio_nino).replace('$', ''), dateText(item.fecha_actualizacion)])}
  />;
  return <ReportTable
    headers={['Traslado', 'Precio (USD)']}
    rows={items.map((item) => [item.ruta_origen, money(item.precio_publico).replace('$', '')])}
  />;
}

function SimpleReport({ type, item }) {
  if (type === 'excursiones') return <>
    <ReportTable
      headers={['Excursión', 'Precio Adulto (USD)', 'Precio Niño (USD)', 'Última Actualización']}
      rows={[[item.tipo_excursion, money(item.precio_adulto).replace('$', ''), money(item.precio_nino).replace('$', ''), dateText(item.fecha_actualizacion)]]}
    />
  </>;
  if (type === 'paquetes') return <>
    <ReportTable
      headers={['Paquete', 'Precio Adulto (USD)', 'Precio Niño (USD)', 'Última Actualización']}
      rows={[[item.paquete, money(item.precio_adulto).replace('$', ''), money(item.precio_nino).replace('$', ''), dateText(item.fecha_actualizacion)]]}
    />
  </>;
  return <>
    <ReportTable
      headers={['Traslado', 'Precio (USD)']}
      rows={[[item.ruta_origen, money(item.precio_publico).replace('$', '')]]}
    />
  </>;
}

export default function TarifasReportModal({ isOpen, onClose, type, items = [], showNetCosts = true }) {
  if (!isOpen) return null;
  const titles = { hoteles: 'Tarifas de Hospedaje', excursiones: 'Tarifas de Excursiones', paquetes: 'Tarifas de Paquetes', traslados: 'Tarifas de Traslados' };
  const reportItems = items.length ? items : [{ id: 'empty' }];

  return <div id="printable-tarifas-root" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2, 8, 23, 0.88)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px', overflow: 'auto' }}>
    <style>{`
      @media print {
        @page { size: A4 portrait; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; }
        body * { visibility: hidden !important; }
        #printable-tarifas-root, #printable-tarifas-root * { visibility: visible !important; }
        #printable-tarifas-root { position: absolute !important; inset: 0 auto auto 0 !important; width: 210mm !important; padding: 0 !important; background: transparent !important; overflow: visible !important; }
        .tarifa-sheet { width: 210mm !important; height: 297mm !important; margin: 0 !important; box-shadow: none !important; page-break-after: always; break-after: page; }
        .no-print { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    `}</style>
    <div className="no-print" style={{ position: 'fixed', top: '12px', right: '18px', zIndex: 1001, display: 'flex', gap: '8px' }}>
      <button onClick={(event) => { event.stopPropagation(); window.print(); }} style={{ border: 0, borderRadius: '999px', background: '#E87217', color: '#FFFFFF', padding: '10px 18px', cursor: 'pointer', fontWeight: 700 }}>Imprimir</button>
      <button onClick={onClose} style={{ border: '1px solid rgba(255,255,255,.35)', borderRadius: '999px', background: '#173F86', color: '#FFFFFF', padding: '10px 18px', cursor: 'pointer', fontWeight: 700 }}>Cerrar</button>
    </div>
    <div onClick={(event) => event.stopPropagation()}>
      {type === 'hoteles' ? reportItems.map((item, index) => (
        <div key={item.id || index} className="tarifa-sheet" style={{ position: 'relative', width: '794px', height: '1123px', backgroundImage: `url(${plantillaTarifas})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', marginBottom: '24px', overflow: 'hidden', boxShadow: '0 16px 50px rgba(0,0,0,.55)' }}>
          <div style={{ position: 'absolute', left: '34px', right: '34px', top: '175px' }}>
            <div style={{ textAlign: 'center', color: '#173F86', fontSize: '24px', fontWeight: 800, marginBottom: '18px', borderBottom: '2px solid #E87217', display: 'inline-block', width: '54%', marginLeft: '23%' }}>{titles[type]}</div>
            <HotelReport item={item} />
          </div>
        </div>
      )) : (
        <div className="tarifa-sheet" style={{ position: 'relative', width: '794px', height: '1123px', backgroundImage: `url(${plantillaTarifas})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', marginBottom: '24px', overflow: 'hidden', boxShadow: '0 16px 50px rgba(0,0,0,.55)' }}>
          <div style={{ position: 'absolute', left: '34px', right: '34px', top: '175px' }}>
            <div style={{ textAlign: 'center', color: '#173F86', fontSize: '24px', fontWeight: 800, marginBottom: '18px', borderBottom: '2px solid #E87217', display: 'inline-block', width: '54%', marginLeft: '23%' }}>{titles[type]}</div>
            <CatalogReport type={type} items={reportItems} />
          </div>
        </div>
      )}
    </div>
  </div>;
}
