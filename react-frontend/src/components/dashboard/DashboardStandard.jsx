import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/dashboard.css';
import DateFilterPill from './components/DateFilterPill';
import UserProfileCard from './components/UserProfileCard';
import MonthlyGoalCard from './components/MonthlyGoalCard';
import TopVentas3DPillars from './components/TopVentas3DPillars';
import TrimestralChart from './components/TrimestralChart';
import ActivityFeedCard from './components/ActivityFeedCard';

export default function DashboardStandard({ user, onNavigate }) {
  const [dateRange, setDateRange] = useState({
    rangoFecha: "13 • Nov | 20 • Nov",
    startLabel: "13 • Nov",
    endLabel: "20 • Nov",
    startDate: "2026-11-13",
    endDate: "2026-11-20",
    speed: null
  });

  const fetchDateRange = async (start, end) => {
    try {
      let url = '/v1/dashboard/top-ventas';
      if (start && end) {
        url += `?fecha_inicio=${start}&fecha_fin=${end}`;
      }
      const res = await axios.get(url);
      if (res.data && res.data.success) {
        setDateRange({
          rangoFecha: res.data.rango_fecha || "13 • Nov | 20 • Nov",
          startLabel: res.data.start_label || "13 • Nov",
          endLabel: res.data.end_label || "20 • Nov",
          startDate: res.data.fecha_inicio || start || "2026-11-13",
          endDate: res.data.fecha_fin || end || "2026-11-20",
          speed: res.data.speed || null
        });
      }
    } catch (err) {
      console.error('Error fetching date range:', err);
    }
  };

  useEffect(() => {
    fetchDateRange();
  }, []);

  return (
    <div className="dashboard-root">
      <div className="dashboard-glass-container">
        {/* Top Navigation / Summary Bar */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr auto 1fr', 
            alignItems: 'center', 
            width: '100%',
            gap: '16px'
          }}
        >
          {/* Top Left: Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DateFilterPill 
              label={dateRange.rangoFecha}
              start={dateRange.startLabel}
              end={dateRange.endLabel}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onSelectRange={(start, end) => fetchDateRange(start, end)}
            />
          </div>

          {/* Top Center: Monthly Goal & Received Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <MonthlyGoalCard 
              meta={dateRange.speed?.mensual?.formatted_meta || "45,000.00"} 
              totalRecibido={dateRange.speed?.mensual?.formatted_total || "0.00"} 
              moneda="USD" 
            />
          </div>

          {/* Top Right: User Profile Card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <UserProfileCard user={user} activeDot={0} />
          </div>
        </div>

        {/* Main Grid: 3 Columns matching Image 1 */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(260px, 1fr) minmax(420px, 1.7fr) minmax(280px, 1.1fr)', 
            gap: '20px', 
            alignItems: 'stretch',
            width: '100%',
            marginTop: '4px'
          }}
        >
          {/* Column 1: Top De Ventas (3D Cylindrical Podium) */}
          <div style={{ height: '100%' }}>
            <TopVentas3DPillars />
          </div>

          {/* Column 2: Estadísticas Trimestral (Dual-wave chart) */}
          <div style={{ height: '100%' }}>
            <TrimestralChart 
              rendimiento="853 VENTAS" 
              variabilidad="7,78%" 
            />
          </div>

          {/* Column 3: Recent Activity Feed (Search & Glowing Pills) */}
          <div style={{ height: '100%' }}>
            <ActivityFeedCard 
              onViewItem={(item) => {
                if (item.type === 'venta' && onNavigate) {
                  onNavigate('ventas_agencia');
                } else if (item.type === 'cotizacion' && onNavigate) {
                  onNavigate('ventas_cotizaciones');
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
