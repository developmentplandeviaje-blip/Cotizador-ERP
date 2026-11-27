import React, { useState } from 'react';
import DashboardStandard from './DashboardStandard';
import DashboardAdmin from './DashboardAdmin';

export default function Dashboard({ user, onNavigate }) {
  const normLevel = (user?.level || '').toLowerCase().trim();
  const isDefaultAdmin = normLevel === 'admin' || normLevel === 'administrador' || normLevel === 'administracion';

  // State to allow previewing both variants if needed
  const [activeVariant, setActiveVariant] = useState(isDefaultAdmin ? 'admin' : 'standard');

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Subtle Role-Based Variant Toggle (Top-right floating pill) */}
      

      {/* Render Selected Dashboard Variant */}
      {activeVariant === 'admin' ? (
        <DashboardAdmin user={user} onNavigate={onNavigate} />
      ) : (
        <DashboardStandard user={user} onNavigate={onNavigate} />
      )}
    </div>
  );
}
