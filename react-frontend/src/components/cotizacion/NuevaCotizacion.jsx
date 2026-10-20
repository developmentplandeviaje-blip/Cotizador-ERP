import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import CotizacionTabContent from './CotizacionTabContent';
import RegistroCotizaciones from './RegistroCotizaciones';
import imgAgregar from '../../assets/Agregar.svg';
import { PRODUCT_TABS, PRODUCT_COLOR_MAP } from './cotizacionConstants';

// Backward compatibility exports for modals
export { PRODUCT_TABS, PRODUCT_COLOR_MAP };

export default function NuevaCotizacion({ user }) {
  // Catalogs loaded once for all quotation tabs
  const [catalogos, setCatalogos] = useState({
    ubicaciones: [],
    hoteles: [],
    aerolineas: [],
    excursiones: [],
    paquetes: [],
    traslados: [],
    vehiculos: [],
    is_freelancer: false,
  });
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Tabs management
  // Each tab: { id: string, initialNumber: number, clientName: string }
  const [tabs, setTabs] = useState([
    { id: 'cotiz_1', initialNumber: 1, clientName: '' }
  ]);
  const [activeTabId, setActiveTabId] = useState('cotiz_1'); // 'cotiz_X' or 'registro'
  const nextTabNumberRef = useRef(2);

  // Load catalogs on mount
  useEffect(() => {
    async function loadData() {
      setLoadingCatalogs(true);
      try {
        const res = await axios.get('/v1/cotizaciones/catalogos');
        setCatalogos(res.data);
      } catch (err) {
        console.error('Error cargando catálogos para cotizar:', err);
      } finally {
        setLoadingCatalogs(false);
      }
    }
    loadData();
  }, []);

  // Update client name from active quotation tab
  const handleUpdateClientName = useCallback((tabId, name) => {
    setTabs(prev =>
      prev.map(t => (t.id === tabId ? { ...t, clientName: name } : t))
    );
  }, []);

  // Add a new quotation tab
  const handleAddTab = () => {
    const newNum = nextTabNumberRef.current++;
    const newTab = {
      id: `cotiz_${Date.now()}_${newNum}`,
      initialNumber: newNum,
      clientName: '',
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  // Close quotation tab
  const handleCloseTab = (tabIdToClose, e) => {
    if (e) e.stopPropagation();

    const tabToClose = tabs.find(t => t.id === tabIdToClose);
    const tabTitle =
      tabToClose?.clientName && tabToClose.clientName.trim() !== ''
        ? tabToClose.clientName.trim()
        : `Cotización ${tabToClose?.initialNumber || ''}`;

    if (tabs.length === 1) {
      if (
        window.confirm(
          `¿Deseas cerrar "${tabTitle}" y reiniciar con una cotización nueva en blanco?`
        )
      ) {
        const newNum = nextTabNumberRef.current++;
        const newTab = {
          id: `cotiz_${Date.now()}_${newNum}`,
          initialNumber: newNum,
          clientName: '',
        };
        setTabs([newTab]);
        setActiveTabId(newTab.id);
      }
      return;
    }

    if (
      window.confirm(
        `¿Deseas cerrar la pestaña "${tabTitle}"? Los datos no guardados de esta cotización se perderán.`
      )
    ) {
      const nextTabs = tabs.filter(t => t.id !== tabIdToClose);
      setTabs(nextTabs);

      if (activeTabId === tabIdToClose) {
        const closedIndex = tabs.findIndex(t => t.id === tabIdToClose);
        const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
        setActiveTabId(nextTabs[newActiveIndex].id);
      }
    }
  };

  if (loadingCatalogs) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px',
          color: '#CBD5E1',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(232, 114, 23, 0.2)',
            borderTop: '3px solid #E87217',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.95rem' }}>Cargando catálogos del cotizador...</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Browser-like Tab Bar */}
      <div
        className="custom-scrollbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto 20px auto',
          background: 'rgba(13, 22, 45, 0.75)',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          padding: '8px 12px',
          gap: '8px',
          overflowX: 'auto',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          boxSizing: 'border-box',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const title =
            tab.clientName && tab.clientName.trim() !== ''
              ? tab.clientName.trim()
              : `Cotización ${tab.initialNumber}`;

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              title={title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(232, 158, 23, 0.22) 0%, rgba(235, 147, 37, 0.22) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                border: isActive
                  ? '1px solid rgb(232, 114, 23, 0.50)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                maxWidth: '220px',
                minWidth: '110px',
                boxShadow: isActive ? '0 0 15px rgba(232, 114, 23, 0.25)' : 'none',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(26, 38, 68, 0.65)';
                  e.currentTarget.style.color = '#E2E8F0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = '#94A3B8';
                }
              }}
            >

              {/* Tab Title (Cotización $i or Client Name) */}
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '500',
                  flex: 1,
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                }}
              >
                {title}
              </span>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => handleCloseTab(tab.id, e)}
                title={`Cerrar ${title}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#CBD5E1' : '#64748B',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '12px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isActive ? '#CBD5E1' : '#64748B';
                }}
              >
                ✕
              </button>
            </div>
          );
        })}

        {/* Add Tab Button */}
        <button
          type="button"
          onClick={handleAddTab}
          title="Abrir nueva pestaña de cotización"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 8px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px dashed rgba(255, 255, 255, 0.45)',
            borderRadius: '100%',
            color: 'rgb(255, 253, 251)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.borderColor = '#E87217';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
            e.currentTarget.style.color = 'rgb(255, 253, 251)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
        </button>

        {/* Tab / Botón: Registro de Guardado */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setActiveTabId('registro')}
            title="Ver tabla con el registro de todas las cotizaciones guardadas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background:
                activeTabId === 'registro'
                  ? 'linear-gradient(135deg, rgba(232, 158, 23, 0.28) 0%, rgba(235, 147, 37, 0.28) 100%)'
                  : 'rgba(255, 255, 255, 0.06)',
              border:
                activeTabId === 'registro'
                  ? '1px solid rgb(232, 114, 23, 0.50)'
                  : '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '10px',
              color: activeTabId === 'registro' ? '#FFFFFF' : '#CBD5E1',
              fontSize: '0.85rem',
              fontWeight: activeTabId === 'registro' ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              boxShadow: activeTabId === 'registro' ? '0 0 15px rgba(232, 114, 23, 0.25)' : 'none',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (activeTabId !== 'registro') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTabId !== 'registro') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#CBD5E1';
              }
            }}
          >
            <span>Registro de Guardado</span>
          </button>
        </div>
      </div>

      {/* Tabs Content Container - All active tabs remain mounted with display toggle */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Vista: Registro de Guardado */}
        {activeTabId === 'registro' ? (
          <div style={{ width: '100%' }}>
            <RegistroCotizaciones
              user={user}
              onNuevaCotizacion={() => {
                if (tabs.length === 0) {
                  handleAddTab();
                } else {
                  setActiveTabId(tabs[tabs.length - 1].id);
                }
              }}
            />
          </div>
        ) : (
          tabs.map((tab) => (
            <div
              key={tab.id}
              style={{
                display: tab.id === activeTabId ? 'block' : 'none',
                width: '100%',
              }}
            >
              <CotizacionTabContent
                user={user}
                catalogos={catalogos}
                tabNumber={tab.initialNumber}
                tabId={tab.id}
                onUpdateClientName={(name) => handleUpdateClientName(tab.id, name)}
                onCloseTab={() => handleCloseTab(tab.id)}
                onVerRegistro={() => setActiveTabId('registro')}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
