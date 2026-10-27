import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import CotizacionTabContent from './CotizacionTabContent';
import RegistroCotizaciones from './RegistroCotizaciones';
import imgAgregar from '../../assets/Agregar.svg';
import { PRODUCT_TABS, PRODUCT_COLOR_MAP } from './cotizacionConstants';
import { showToast } from '../../utils/toast';
import { ConfigurarHorarioCierreModal } from './modals';

const MAX_TABS = 35;

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

  const storageTabsKey = user?.id ? `cotizador_open_tabs_${user.id}` : 'cotizador_open_tabs';

  // Tabs management
  // Each tab: { id: string, initialNumber: number, clientName: string }
  const [tabs, setTabs] = useState(() => {
    try {
      const raw = localStorage.getItem(storageTabsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
          return parsed.tabs.slice(0, MAX_TABS);
        }
      }
    } catch (err) {
      console.warn('Error reading stored tabs:', err);
    }
    return [
      { id: 'cotiz_1', initialNumber: 1, clientName: '' }
    ];
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    try {
      const raw = localStorage.getItem(storageTabsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.activeTabId && parsed.activeTabId !== 'registro') {
          return parsed.activeTabId;
        }
      }
    } catch {}
    return 'cotiz_1';
  });

  // Tab search / filter
  const [tabFilter, setTabFilter] = useState('');

  // Normalize string for accent and case insensitive search
  const normalizeText = (str) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  // Filtered tabs matching search query
  const filteredTabs = tabs.filter((tab) => {
    if (!tabFilter.trim()) return true;
    const q = normalizeText(tabFilter.trim());
    const num = String(tab.initialNumber);
    const client = normalizeText(tab.clientName);
    const title = normalizeText(`Cotización ${tab.initialNumber}`);
    return client.includes(q) || num.includes(q) || title.includes(q);
  });

  const nextTabNumberRef = useRef(2);

  // Sync nextTabNumberRef from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageTabsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.nextTabNumber && parsed.nextTabNumber >= nextTabNumberRef.current) {
          nextTabNumberRef.current = parsed.nextTabNumber;
        }
      }
    } catch {}
  }, [storageTabsKey]);

  // Persist tabs & activeTabId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageTabsKey, JSON.stringify({
        tabs,
        activeTabId,
        nextTabNumber: nextTabNumberRef.current,
        tabs_updated_at: Date.now(),
      }));
    } catch (err) {
      console.warn('Error persisting tabs:', err);
    }
  }, [storageTabsKey, tabs, activeTabId]);

  // Horario de Cierre y Limpieza de Pestañas (Administración Global)
  const isAdmin = ['admin', 'gerente'].includes((user?.level || '').toLowerCase());
  const [configCierre, setConfigCierre] = useState(null);
  const [showConfigCierreModal, setShowConfigCierreModal] = useState(false);

  const storageCutoffKey = user?.id
    ? `cotizador_ultimo_cierre_${user.id}`
    : 'cotizador_ultimo_cierre';
  const storageManualKey = user?.id
    ? `cotizador_ultimo_cierre_manual_${user.id}`
    : 'cotizador_ultimo_cierre_manual';

  // Sincronizar configuración de cierre desde catálogos
  useEffect(() => {
    if (catalogos?.configuracion_cierre) {
      setConfigCierre(catalogos.configuracion_cierre);
    }
  }, [catalogos?.configuracion_cierre]);

  // Cargar configuración de cierre directamente al montar
  useEffect(() => {
    axios.get('/v1/cotizaciones/configuracion-cierre')
      .then(res => {
        if (res.data) setConfigCierre(res.data);
      })
      .catch(() => {});
  }, []);

  // Función ejecutora de limpieza de pestañas:
  // Cierra pestañas adicionales, limpia la pestaña restante y reinicia el contador a #1
  const executeTabsCleanup = useCallback((reason = 'programado') => {
    // 1. Limpiar todos los borradores en localStorage
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('cotizador_draft_') || key.startsWith('cotizador_open_tabs_') || key === 'cotizador_open_tabs')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (err) {
      console.warn('Error limpiando borradores en localStorage:', err);
    }

    // 2. Generar nueva pestaña limpia única con número inicial 1
    const cleanTab = {
      id: `cotiz_${Date.now()}_1`,
      initialNumber: 1,
      clientName: '',
    };

    // 3. Reiniciar contador a 2 (para que la siguiente creada sea Cotización 2)
    nextTabNumberRef.current = 2;

    // 4. Actualizar estados locales de NuevaCotizacion
    setTabs([cleanTab]);
    setActiveTabId(cleanTab.id);
    setTabFilter('');

    // 5. Persistir nuevo estado limpio
    try {
      localStorage.setItem(storageTabsKey, JSON.stringify({
        tabs: [cleanTab],
        activeTabId: cleanTab.id,
        nextTabNumber: 2,
        tabs_updated_at: Date.now(),
      }));
    } catch {}

    // 6. Notificar al usuario
    if (reason === 'manual') {
      showToast('Limpieza de pestañas ejecutada: se cerraron pestañas adicionales, se borraron borradores y el contador se reinició a #1.', 'info');
    } else {
      showToast('Horario de cierre alcanzado: se han cerrado y limpiado las pestañas de cotización activas y el contador se reinició a #1.', 'warning');
    }
  }, [storageTabsKey]);

  // Evaluador del horario de cierre y limpieza automática
  const evaluateClosingSchedule = useCallback(() => {
    if (!configCierre) return;

    // A. Verificación de limpieza manual forzada global
    if (configCierre.manual_timestamp) {
      const lastManual = Number(localStorage.getItem(storageManualKey) || 0);
      if (Number(configCierre.manual_timestamp) > lastManual) {
        localStorage.setItem(storageManualKey, String(configCierre.manual_timestamp));
        executeTabsCleanup('manual');
        return;
      }
    }

    // B. Verificación de corte programado
    if (!configCierre.activo || !configCierre.hora) return;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sab
    if (configCierre.dias === 'laborales' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return; // No se ejecuta fines de semana
    }

    const parts = configCierre.hora.split(':');
    const targetHour = parseInt(parts[0], 10);
    const targetMin = parseInt(parts[1], 10);
    if (isNaN(targetHour) || isNaN(targetMin)) return;

    const todayCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMin, 0, 0);
    const todayCutoffId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${configCierre.hora}`;
    const lastExecutedCutoffId = localStorage.getItem(storageCutoffKey);

    // Condición 1: Ya se alcanzó o superó el horario de corte de hoy y hoy no se ha ejecutado
    if (now >= todayCutoff && lastExecutedCutoffId !== todayCutoffId) {
      localStorage.setItem(storageCutoffKey, todayCutoffId);
      executeTabsCleanup('programado');
      return;
    }

    // Condición 2: El usuario abre la app antes del corte de hoy, pero quedó pendiente el corte anterior
    if (now < todayCutoff) {
      const previousCutoff = new Date(todayCutoff);
      if (configCierre.dias === 'laborales' && dayOfWeek === 1) {
        previousCutoff.setDate(previousCutoff.getDate() - 3); // Viernes
      } else {
        previousCutoff.setDate(previousCutoff.getDate() - 1); // Ayer
      }
      const previousCutoffId = `${previousCutoff.getFullYear()}-${String(previousCutoff.getMonth() + 1).padStart(2, '0')}-${String(previousCutoff.getDate()).padStart(2, '0')}_${configCierre.hora}`;

      if (lastExecutedCutoffId !== previousCutoffId && lastExecutedCutoffId !== todayCutoffId) {
        localStorage.setItem(storageCutoffKey, previousCutoffId);
        // Si hay más de 1 pestaña, o nombres de clientes cargados, o contador avanzado
        if (tabs.length > 1 || tabs.some(t => t.clientName?.trim()) || nextTabNumberRef.current > 2) {
          executeTabsCleanup('programado');
        }
      }
    }
  }, [configCierre, executeTabsCleanup, storageCutoffKey, storageManualKey, tabs]);

  // Ejecutar verificación periódica (cada 25 segundos) y al ganar foco
  useEffect(() => {
    evaluateClosingSchedule();
    const interval = setInterval(() => {
      evaluateClosingSchedule();
    }, 25000);

    const handleFocusCheck = () => {
      axios.get('/v1/cotizaciones/configuracion-cierre')
        .then(res => {
          if (res.data) setConfigCierre(res.data);
        })
        .catch(() => {});
      evaluateClosingSchedule();
    };

    window.addEventListener('focus', handleFocusCheck);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusCheck);
    };
  }, [evaluateClosingSchedule]);

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

  // Silently refresh catalogs when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      axios.get('/v1/cotizaciones/catalogos')
        .then(res => setCatalogos(res.data))
        .catch(() => {});
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Update client name from active quotation tab
  const handleUpdateClientName = useCallback((tabId, name) => {
    setTabs(prev =>
      prev.map(t => (t.id === tabId ? { ...t, clientName: name } : t))
    );
  }, []);

  // Refs for the outer floating pill and the scrollable tabs list
  const outerBarRef = useRef(null);
  const tabsScrollRef = useRef(null);

  // Wheel handler for horizontal scrolling across tabs
  const handleTabsWheel = useCallback((e) => {
    const scrollEl = tabsScrollRef.current;
    if (!scrollEl) return;

    // Check if tabs overflow horizontally
    if (scrollEl.scrollWidth > scrollEl.clientWidth) {
      let delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) {
        // DOM_DELTA_LINE (Firefox default)
        delta *= 33;
      } else if (e.deltaMode === 2) {
        // DOM_DELTA_PAGE
        delta *= 100;
      }

      if (delta !== 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        scrollEl.scrollLeft += delta;
      }
    }
  }, []);

  // Attach non-passive wheel listener on outerBarRef once catalogs have loaded
  useEffect(() => {
    if (loadingCatalogs) return;

    const el = outerBarRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleTabsWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleTabsWheel);
    };
  }, [loadingCatalogs, handleTabsWheel]);

  // Add a new quotation tab (max 35 tabs)
  const handleAddTab = () => {
    if (tabs.length >= MAX_TABS) {
      showToast(`Límite alcanzado: solo se permite un máximo de ${MAX_TABS} pestañas abiertas.`, 'warning');
      return;
    }
    setTabFilter('');
    const newNum = nextTabNumberRef.current++;
    const newTab = {
      id: `cotiz_${Date.now()}_${newNum}`,
      initialNumber: newNum,
      clientName: '',
    };
    setTabs(prev => {
      if (prev.length >= MAX_TABS) return prev;
      return [...prev, newTab];
    });
    setActiveTabId(newTab.id);

    // Smoothly scroll to the new tab
    setTimeout(() => {
      if (tabsScrollRef.current) {
        tabsScrollRef.current.scrollTo({
          left: tabsScrollRef.current.scrollWidth,
          behavior: 'smooth',
        });
      }
    }, 50);
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
        // Clear saved draft for closed tab
        try {
          localStorage.removeItem(`cotizador_draft_${tabIdToClose}`);
          if (user?.id) localStorage.removeItem(`cotizador_draft_${user.id}_${tabIdToClose}`);
        } catch {}

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
      // Clear saved draft for closed tab
      try {
        localStorage.removeItem(`cotizador_draft_${tabIdToClose}`);
        if (user?.id) localStorage.removeItem(`cotizador_draft_${user.id}_${tabIdToClose}`);
      } catch {}

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
      {/* Floating Sticky Tab Bar */}
      <div
        ref={outerBarRef}
        onWheel={handleTabsWheel}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto 20px auto',
          background: 'rgba(10, 18, 42, 0.80)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          padding: '6px 12px',
          gap: '10px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
          boxSizing: 'border-box',
        }}
      >
        {/* Scrollable Tabs List */}
        <div
          ref={tabsScrollRef}
          onWheel={handleTabsWheel}
          className="custom-scrollbar"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingRight: '4px',
            boxSizing: 'border-box',
          }}
        >
        {filteredTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const title =
            tab.clientName && tab.clientName.trim() !== ''
              ? tab.clientName.trim()
              : `Cotización ${tab.initialNumber}`;

          return (
            <div
              key={tab.id}
              onClick={(e) => {
                setActiveTabId(tab.id);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              }}
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

        {/* Mensaje cuando ningún tab coincide con el filtro */}
        {tabFilter && filteredTabs.length === 0 && (
          <span
            style={{
              fontSize: '0.8125rem',
              color: '#94A3B8',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              whiteSpace: 'nowrap',
              fontStyle: 'italic',
              flexShrink: 0,
            }}
          >
            Sin coincidencias para "{tabFilter}"
          </span>
        )}

        {/* Add Tab Button */}
        <button
          type="button"
          onClick={handleAddTab}
          title={
            tabs.length >= MAX_TABS
              ? `Límite alcanzado (máximo ${MAX_TABS} pestañas)`
              : `Abrir nueva pestaña de cotización (${tabs.length}/${MAX_TABS})`
          }
          disabled={tabs.length >= MAX_TABS}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 8px',
            background: tabs.length >= MAX_TABS ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.12)',
            border: tabs.length >= MAX_TABS ? '1px dashed rgba(255, 255, 255, 0.2)' : '1px dashed rgba(255, 255, 255, 0.45)',
            borderRadius: '100%',
            color: tabs.length >= MAX_TABS ? '#64748B' : 'rgb(255, 253, 251)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: tabs.length >= MAX_TABS ? 'not-allowed' : 'pointer',
            opacity: tabs.length >= MAX_TABS ? 0.35 : 1,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (tabs.length >= MAX_TABS) return;
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.borderColor = '#E87217';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            if (tabs.length >= MAX_TABS) return;
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
            e.currentTarget.style.color = 'rgb(255, 253, 251)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Fixed Right Section: Search / Filter (Separated, never overlaps tabs) */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingLeft: '10px',
          borderLeft: '1px solid rgba(255, 255, 255, 0.14)',
        }}
      >
        {/* Botón de Horario de Cierre para Administrador / Gerente */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowConfigCierreModal(true)}
            title="Configurar horario de cierre y limpieza de pestañas para todos los usuarios"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: configCierre?.activo ? 'rgba(232, 114, 23, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: configCierre?.activo ? '1px solid rgba(232, 114, 23, 0.55)' : '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '8px',
              color: configCierre?.activo ? '#FFA959' : '#CBD5E1',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(232, 114, 23, 0.3)';
              e.currentTarget.style.borderColor = '#E87217';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = configCierre?.activo ? 'rgba(232, 114, 23, 0.2)' : 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = configCierre?.activo ? '1px solid rgba(232, 114, 23, 0.55)' : '1px solid rgba(255, 255, 255, 0.16)';
            }}
          >
            <span>🕒</span>
            <span style={{ fontSize: '0.78rem' }}>Cierre</span>
            {configCierre?.activo && configCierre?.hora && (
              <span
                style={{
                  fontSize: '0.7rem',
                  background: '#E87217',
                  color: '#FFFFFF',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: '700',
                }}
              >
                {configCierre.hora}
              </span>
            )}
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            width: '190px',
          }}
        >
          {/* Search Icon */}
          <svg
            style={{
              position: 'absolute',
              left: '9px',
              width: '13px',
              height: '13px',
              fill: 'none',
              stroke: '#94A3B8',
              strokeWidth: 2,
              pointerEvents: 'none',
            }}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            value={tabFilter}
            onChange={(e) => setTabFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setTabFilter('');
              } else if (e.key === 'Enter' && filteredTabs.length > 0) {
                setActiveTabId(filteredTabs[0].id);
              }
            }}
            placeholder={`Filtrar (${tabs.length})...`}
            title="Filtrar por cliente o número de cotización. Presiona Enter para abrir la primera coincidencia, o Esc para limpiar."
            style={{
              width: '100%',
              padding: '6px 24px 6px 28px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: tabFilter ? '1px solid rgba(232, 114, 23, 0.65)' : '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: tabFilter ? '0 0 10px rgba(232, 114, 23, 0.25)' : 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.14)';
              e.target.style.borderColor = '#E87217';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              if (!tabFilter) e.target.style.borderColor = 'rgba(255, 255, 255, 0.16)';
            }}
          />

          {/* Clear Button */}
          {tabFilter && (
            <button
              type="button"
              onClick={() => setTabFilter('')}
              title="Limpiar filtro"
              style={{
                position: 'absolute',
                right: '5px',
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              ✕
            </button>
          )}
        </div>
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
                } else if (tabs.length < MAX_TABS) {
                  handleAddTab();
                } else {
                  showToast(`Límite alcanzado: solo se permite un máximo de ${MAX_TABS} pestañas abiertas.`, 'warning');
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
      {/* Modal de Configuración de Horario de Cierre (Administrador / Gerente) */}
      {isAdmin && (
        <ConfigurarHorarioCierreModal
          isOpen={showConfigCierreModal}
          onClose={() => setShowConfigCierreModal(false)}
          config={configCierre}
          onConfigSaved={(updated) => setConfigCierre(updated)}
          onManualCleanup={() => executeTabsCleanup('manual')}
        />
      )}
    </div>
  );
}
