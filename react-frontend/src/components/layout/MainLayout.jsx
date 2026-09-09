import React from 'react';
import Sidebar from './Sidebar';
import erpBg from '../../assets/erp-bg.png';

export default function MainLayout({ activeRoute, onNavigate, onLogout, user, children }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundImage: `url(${erpBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      backgroundColor: '#090e24',
      color: '#F8FAFC',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={user}
      />

      <main style={{
        flex: 1,
        padding: '30px 40px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        maxHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
}
