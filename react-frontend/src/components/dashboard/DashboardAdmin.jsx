import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/dashboard.css';
import DateFilterPill from './components/DateFilterPill';
import UserProfileCard from './components/UserProfileCard';
import SpeedAnualCard from './components/SpeedAnualCard';
import TopVentasBarList from './components/TopVentasBarList';
import DonutKpiCard from './components/DonutKpiCard';
import TrimestralChart from './components/TrimestralChart';
import ActivityFeedCard from './components/ActivityFeedCard';

export default function DashboardAdmin({ user, onNavigate }) {
  const [topVentasData, setTopVentasData] = useState({
    rangoFecha: "13 • Nov | 20 • Nov",
    startLabel: "13 • Nov",
    endLabel: "20 • Nov",
    startDate: "2026-11-13",
    endDate: "2026-11-20",
    topVentas: [],
    clientes: { frecuentes: 52, nuevos: 30 },
    ventasKpi: { confirmadas: 52, anuladas: 30 },
    speed: null,
    trimestral: null,
    fichasRecientes: [],
    loading: true
  });

  const fetchTopVentas = async (start, end) => {
    setTopVentasData(prev => ({ ...prev, loading: true }));
    try {
      let url = '/v1/dashboard/top-ventas';
      if (start && end) {
        url += `?fecha_inicio=${start}&fecha_fin=${end}`;
      }
      const res = await axios.get(url);
      if (res.data && res.data.success) {
        setTopVentasData({
          rangoFecha: res.data.rango_fecha || "13 • Nov | 20 • Nov",
          startLabel: res.data.start_label || "13 • Nov",
          endLabel: res.data.end_label || "20 • Nov",
          startDate: res.data.fecha_inicio || start || "2026-11-13",
          endDate: res.data.fecha_fin || end || "2026-11-20",
          topVentas: res.data.top_ventas || [],
          clientes: res.data.clientes || { frecuentes: 0, nuevos: 0 },
          ventasKpi: res.data.ventas_kpi || { confirmadas: 0, anuladas: 0 },
          speed: res.data.speed || null,
          trimestral: res.data.trimestral || null,
          fichasRecientes: res.data.fichas_recientes || [],
          loading: false
        });
      }
    } catch (err) {
      console.error('Error fetching top ventas dashboard:', err);
      setTopVentasData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchTopVentas();
  }, []);

  return (
    <div className="dashboard-root">
      <div className="dashboard-glass-container">
        {/* Main 2-Section Grid: Left+Center Main Workspace (Left 72%) vs Right Column (Right 28%) */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(600px, 2.5fr) minmax(290px, 1fr)', 
            gap: '20px', 
            alignItems: 'stretch',
            width: '100%'
          }}
        >
          {/* ================= LEFT + CENTER SECTION ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Workspace: Left (Date + Top De Ventas) + Center (User + Donuts) */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(240px, 1.1fr) minmax(350px, 1.7fr)', 
                gap: '20px', 
                alignItems: 'stretch' 
              }}
            >
              {/* Left Column of Top Workspace */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Date Filter Pill */}
                <div>
                  <DateFilterPill 
                    label={topVentasData.rangoFecha}
                    start={topVentasData.startLabel}
                    end={topVentasData.endLabel}
                    startDate={topVentasData.startDate}
                    endDate={topVentasData.endDate}
                    onSelectRange={(start, end) => fetchTopVentas(start, end)}
                  />
                </div>

                {/* Top De Ventas (Horizontal Ranked Bars) */}
                <div style={{ flex: 1 }}>
                  <TopVentasBarList 
                    items={topVentasData.topVentas}
                    loading={topVentasData.loading}
                  />
                </div>
              </div>

              {/* Center Column: User Profile + Dual Donuts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
                {/* User Profile Card */}
                <UserProfileCard user={user} activeDot={0} />

                {/* Dual Donut Cards (Clientes & Ventas) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' }}>
                  <DonutKpiCard
                    title="Clientes"
                    legendBlue={{ label: "Frecuentes", value: topVentasData.clientes?.frecuentes ?? 0 }}
                    legendOrange={{ label: "Nuevos", value: topVentasData.clientes?.nuevos ?? 0 }}
                    loading={topVentasData.loading}
                  />
                  <DonutKpiCard
                    title="Ventas"
                    legendBlue={{ label: "Confirmada", value: topVentasData.ventasKpi?.confirmadas ?? 0 }}
                    legendOrange={{ label: "Anulada", value: topVentasData.ventasKpi?.anuladas ?? 0 }}
                    loading={topVentasData.loading}
                  />
                </div>
              </div>
            </div>

            {/* Bottom: Estadísticas Trimestral (Spans across Left + Center) */}
            <div style={{ width: '100%', flex: 1 }}>
              <TrimestralChart 
                trimestralData={topVentasData.trimestral}
                loading={topVentasData.loading}
              />
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Right: SPEED ANUAL (3D Speedometer arch & Meta badge) */}
            <div>
              <SpeedAnualCard 
                speedData={topVentasData.speed}
                loading={topVentasData.loading}
                moneda="USD" 
              />
            </div>

            {/* Bottom Right: Activity Feed Card */}
            <div style={{ flex: 1 }}>
              <ActivityFeedCard 
                items={topVentasData.fichasRecientes}
                loading={topVentasData.loading}
                onViewItem={(item) => {
                  const scope = item.scope || 'agencia';
                  try {
                    sessionStorage.setItem(`editing_venta_${scope}`, String(item.id));
                    window.location.hash = `ventas_${scope}?editar=${item.id}`;
                  } catch {}
                  if (onNavigate) {
                    if (item.tipo === 'cotizacion') {
                      onNavigate('ventas_cotizaciones');
                    } else {
                      onNavigate(`ventas_${scope}`);
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
