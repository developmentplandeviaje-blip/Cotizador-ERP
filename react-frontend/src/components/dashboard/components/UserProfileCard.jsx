import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showToast } from '../../../utils/toast';

export default function UserProfileCard({ user, onUserChange }) {
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [switching, setSwitching] = useState(false);

  const roleName = user?.level 
    ? (user.level.charAt(0).toUpperCase() + user.level.slice(1).toLowerCase()) 
    : 'Nivel';
  const fullName = (user?.first_name || user?.last_name)
    ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
    : 'Nombre del usuario';

  // Cargar cuentas asociadas del usuario autenticado
  useEffect(() => {
    let isMounted = true;
    const fetchAssociatedAccounts = async () => {
      if (!user?.id) return;
      setLoadingAccounts(true);
      try {
        const res = await axios.get('/v1/auth/associated-accounts');
        if (isMounted && res.data && res.data.success) {
          setAccounts(res.data.accounts || []);
        }
      } catch (err) {
        console.warn('No se pudieron consultar las cuentas asociadas:', err);
        if (isMounted) setAccounts([]);
      } finally {
        if (isMounted) setLoadingAccounts(false);
      }
    };

    fetchAssociatedAccounts();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Cambiar sesión entre cuentas asociadas
  const handleSwitchAccount = async (targetAccount) => {
    if (!targetAccount || targetAccount.id === user?.id || switching) return;
    setSwitching(true);
    try {
      const res = await axios.post('/v1/auth/switch-account', {
        target_user_id: targetAccount.id
      });
      if (res.data && res.data.success && res.data.access_token) {
        const token = res.data.access_token;
        const newUser = res.data.user;

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_profile', JSON.stringify(newUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        if (showToast) {
          showToast.success(`Sesión cambiada a: ${newUser.level || 'Usuario'}`);
        }

        window.dispatchEvent(new CustomEvent('auth:user_changed', { detail: newUser }));

        if (onUserChange) {
          onUserChange(newUser);
        }
      }
    } catch (err) {
      console.error('Error switching user session:', err);
      if (showToast) {
        showToast.error('No se pudo cambiar de cuenta.');
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div 
        className="dash-card" 
        style={{ 
          padding: '14px 22px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          minWidth: '220px',
          opacity: switching ? 0.7 : 1,
          transition: 'opacity 0.2s ease'
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

      {/* Paginador para cambiar entre cuentas asociadas:
          Si NO tiene cuentas asociadas (total <= 1), NO se muestra el paginador. */}
      {accounts && accounts.length > 1 && (
        <div 
          className="dash-dots" 
          style={{ 
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {accounts.map((acc) => {
            const isCurrent = acc.id === user?.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSwitchAccount(acc)}
                disabled={isCurrent || switching}
                className={`dash-dot ${isCurrent ? 'active-orange' : ''}`}
                style={{
                  background: isCurrent ? '#ff7300' : 'rgba(255, 255, 255, 0.28)',
                  boxShadow: isCurrent ? '0 0 10px rgba(255, 115, 0, 0.85)' : 'none',
                  width: isCurrent ? '10px' : '8px',
                  height: isCurrent ? '10px' : '8px',
                  borderRadius: '50%',
                  border: 'none',
                  padding: 0,
                  cursor: isCurrent ? 'default' : (switching ? 'wait' : 'pointer'),
                  transition: 'all 0.25s ease',
                  outline: 'none',
                  opacity: switching && !isCurrent ? 0.5 : 1
                }}
                title={isCurrent ? `Sesión actual: ${acc.level || 'Usuario'}` : `Cambiar sesión a: ${acc.level || 'Usuario'} (${acc.email})`}
                aria-label={`Cambiar sesión a: ${acc.level || 'Usuario'}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
