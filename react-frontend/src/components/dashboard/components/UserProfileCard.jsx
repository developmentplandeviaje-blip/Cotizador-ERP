import React from 'react';

export default function UserProfileCard({ user, activeDot = 0 }) {
  const roleName = user?.level 
    ? (user.level.charAt(0).toUpperCase() + user.level.slice(1).toLowerCase()) 
    : 'Nivel';
  const fullName = (user?.first_name || user?.last_name)
    ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
    : 'Nombre del usuario';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div 
        className="dash-card" 
        style={{ 
          padding: '14px 22px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          minWidth: '220px'
        }}
      >
        {/* Avatar Orb */}
        <div className="dash-avatar-orb">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        {/* User Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', letterSpacing: '0.2px' }}>
            {roleName}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: '400' }}>
            {fullName}
          </span>
        </div>
      </div>

      {/* Indicator Dots */}
      <div className="dash-dots">
        <span className={`dash-dot ${activeDot === 0 ? 'active-orange' : ''}`} />
        <span className={`dash-dot ${activeDot === 1 ? 'active-orange' : ''}`} />
        <span className={`dash-dot ${activeDot === 2 ? 'active-orange' : ''}`} />
      </div>
    </div>
  );
}
