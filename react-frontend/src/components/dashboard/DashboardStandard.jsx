import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/dashboard.css';
import DateFilterPill from './components/DateFilterPill';
import UserProfileCard from './components/UserProfileCard';
import MonthlyGoalCard from './components/MonthlyGoalCard';
import TopVentas3DPillars from './components/TopVentas3DPillars';
import TrimestralChart from './components/TrimestralChart';
import ActivityFeedCard from './components/ActivityFeedCard';

export default function DashboardStandard({ user, onNavigate, onUserChange }) {
  const userLevel = (user?.level || '').trim().toLowerCase();
  const isFreelancer = userLevel === 'freelancer' || Boolean(user?.id_freelancer);

  const [data, setData] = useState({
    rangoFecha: "13 • Nov | 20 • Nov",
    startLabel: "13 • Nov",
    endLabel: "20 • Nov",
    startDate: "2026-11-13",
    endDate: "2026-11-20",
    topVentas: [],
    speed: null,
    trimestral: null,
    fichasRecientes: [],
    loading: true
  });

  const fetchDashboardData = async (start, end, label) => {
    setData(prev => ({ 
      ...prev, 
      loading: true,
      ...(start && end ? { startDate: start, endDate: end } : {}),
      ...(label ? { rangoFecha: label } : {})
    }));
    try {
      let url = '/v1/dashboard/top-ventas';
      if (start && end) {
        url += `?fecha_inicio=${start}&fecha_fin=${end}`;
      }
      const res = await axios.get(url);
      if (res.data && res.data.success) {
        setData({
          rangoFecha: res.data.rango_fecha || label || "06 • Nov | 12 • Nov",
          startLabel: res.data.start_label || "06 • Nov",
          endLabel: res.data.end_label || "12 • Nov",
          startDate: res.data.fecha_inicio || start || "2026-11-06",
          endDate: res.data.fecha_fin || end || "2026-11-12",
          topVentas: res.data.top_ventas || [],
          speed: res.data.speed || null,
          trimestral: res.data.trimestral || null,
          fichasRecientes: res.data.fichas_recientes || [],
          loading: false
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard standard data:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

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
          {/* Top Left */}
          {!isFreelancer ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <DateFilterPill 
                label={data.rangoFecha}
                start={data.startLabel}
                end={data.endLabel}
                startDate={data.startDate}
                endDate={data.endDate}
                onSelectRange={(start, end, label) => fetchDashboardData(start, end, label)}
              />
            </div>
          ) : (
            <div />
          )}

          {/* Top Center: Monthly Goal Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <MonthlyGoalCard 
              meta={data.speed?.mensual?.formatted_meta || "45,000.00"} 
              totalRecibido={data.speed?.mensual?.formatted_total || "0.00"} 
              moneda="USD" 
            />
          </div>

          {/* Top Right: User Profile Card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <UserProfileCard user={user} onUserChange={onUserChange} />
          </div>
        </div>

        {/* Main Grid:
            - Freelancer: 2 columnas expandidas (Estadísticas Trimestral + Feed de Ventas)
            - Asesores / Otros: 3 columnas (Top De Ventas + Trimestral + Feed) */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: isFreelancer 
              ? 'minmax(500px, 1.65fr) minmax(340px, 1fr)' 
              : 'minmax(280px, 1fr) minmax(480px, 1.8fr) minmax(320px, 1.15fr)', 
            gap: '22px', 
            alignItems: 'stretch',
            width: '100%',
            flex: 1,
            marginTop: '4px'
          }}
        >
          {/* Column 1: Top De Ventas (Oculto para Freelancer) */}
          {!isFreelancer && (
            <div style={{ height: '100%' }}>
              <TopVentas3DPillars topVentas={data.topVentas} loading={data.loading} />
            </div>
          )}

          {/* Estadísticas Trimestral (Dual-wave chart con datos propios) */}
          <div style={{ height: '100%' }}>
            <TrimestralChart 
              trimestralData={data.trimestral}
              loading={data.loading}
            />
          </div>

          {/* Recent Activity Feed (Fichas recientes propias) */}
          <div style={{ height: '100%' }}>
            <ActivityFeedCard 
              items={data.fichasRecientes}
              loading={data.loading}
              onViewItem={(item) => {
                const scope = item.scope || (isFreelancer ? 'freelancer' : (user?.id_aliado ? 'aliados' : 'agencia'));
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
  );
}
