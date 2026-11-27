import React, { useState, useEffect } from 'react';
import DashboardStandard from './DashboardStandard';
import DashboardAdmin from './DashboardAdmin';

export default function Dashboard({ user, onNavigate, onUserChange }) {
  const normLevel = (user?.level || '').toLowerCase().trim();
  const isDefaultAdmin = normLevel === 'admin' || normLevel === 'administrador' || normLevel === 'administracion';

  // State to allow previewing both variants if needed
  const [activeVariant, setActiveVariant] = useState(isDefaultAdmin ? 'admin' : 'standard');

  useEffect(() => {
    setActiveVariant(isDefaultAdmin ? 'admin' : 'standard');
  }, [isDefaultAdmin, user?.id]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Render Selected Dashboard Variant */}
      {activeVariant === 'admin' ? (
        <DashboardAdmin user={user} onNavigate={onNavigate} onUserChange={onUserChange} />
      ) : (
        <DashboardStandard user={user} onNavigate={onNavigate} onUserChange={onUserChange} />
      )}
    </div>
  );
}
