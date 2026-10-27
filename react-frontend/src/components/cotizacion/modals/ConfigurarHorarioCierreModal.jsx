import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';
import { showToast } from '../../../utils/toast';

export default function ConfigurarHorarioCierreModal({
  isOpen,
  onClose,
  config,
  onConfigSaved,
  onManualCleanup,
}) {
  const [activo, setActivo] = useState(false);
  const [hora, setHora] = useState('18:00');
  const [dias, setDias] = useState('todos');
  const [saving, setSaving] = useState(false);
  const [executingManual, setExecutingManual] = useState(false);

  useEffect(() => {
    if (config) {
      setActivo(Boolean(config.activo));
      setHora(config.hora || '18:00');
      setDias(config.dias || 'todos');
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        activo,
        hora,
        dias,
      };
      const res = await axios.post('/v1/cotizaciones/configuracion-cierre', payload);
      showToast('Configuración de horario de cierre guardada exitosamente.', 'success');
      if (onConfigSaved) {
        onConfigSaved(res.data.data);
      }
      onClose();
    } catch (err) {
      console.error('Error guardando horario de cierre:', err);
      showToast(err.response?.data?.message || 'Error al guardar la configuración de horario de cierre.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteNow = async () => {
    if (!window.confirm('¿Está seguro de que desea ejecutar la limpieza global ahora? Se cerrarán las pestañas adicionales de todos los usuarios, se limpiarán los borradores y se reiniciará el contador a #1.')) {
      return;
    }

    setExecutingManual(true);
    try {
      const payload = {
        activo,
        hora,
        dias,
        forzar_limpieza_ahora: true,
      };
      const res = await axios.post('/v1/cotizaciones/configuracion-cierre', payload);
      showToast('Limpieza global de pestañas activada exitosamente.', 'success');
      if (onManualCleanup) {
        onManualCleanup();
      }
      if (onConfigSaved) {
        onConfigSaved(res.data.data);
      }
      onClose();
    } catch (err) {
      console.error('Error ejecutando limpieza manual:', err);
      showToast(err.response?.data?.message || 'Error al ejecutar la limpieza de pestañas.', 'error');
    } finally {
      setExecutingManual(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🕒 Configurar Horario de Cierre y Limpieza de Pestañas"
      width="560px"
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0' }}>
        {/* Banner descriptivo */}
        <div
          style={{
            background: 'rgba(37, 99, 235, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '0.84rem',
            color: '#CBD5E1',
            lineHeight: '1.5',
          }}
        >
          <strong style={{ color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span>⚙️</span> Administración Global para Todos los Usuarios
          </strong>
          Esta configuración aplica a todos los asesores y usuarios que utilicen el módulo de <strong>Nueva Cotización</strong>.
          Al alcanzarse el horario establecido, las cotizaciones en proceso se cerrarán y se restablecerá el espacio de trabajo.
        </div>

        {/* 1. Switch Activar/Desactivar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '0.9375rem' }}>
              Activar Cierre y Limpieza Automática
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '2px' }}>
              {activo
                ? 'El sistema cerrará y limpiará las pestañas en el horario programado.'
                : 'El cierre automático está inhabilitado.'}
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: activo ? '#E87217' : 'rgba(255, 255, 255, 0.2)',
                transition: '0.3s',
                borderRadius: '34px',
                boxShadow: activo ? '0 0 10px rgba(232, 114, 23, 0.4)' : 'none',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '20px',
                  width: '20px',
                  left: activo ? '26px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  transition: '0.3s',
                  borderRadius: '50%',
                }}
              />
            </span>
          </label>
        </div>

        {/* 2. Hora de Cierre y Días */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: '#E2E8F0', marginBottom: '6px' }}>
              Hora de Cierre / Corte
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              disabled={!activo}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                background: activo ? 'rgba(16, 28, 68, 0.95)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: activo ? '#FFFFFF' : '#64748B',
                fontSize: '0.9375rem',
                fontWeight: '600',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: activo ? 'pointer' : 'not-allowed',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: '#E2E8F0', marginBottom: '6px' }}>
              Días de Aplicación
            </label>
            <select
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              disabled={!activo}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: activo ? 'rgba(16, 28, 68, 0.95)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: activo ? '#FFFFFF' : '#64748B',
                fontSize: '0.875rem',
                fontWeight: '500',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: activo ? 'pointer' : 'not-allowed',
              }}
            >
              <option value="todos">Todos los días (Lun - Dom)</option>
              <option value="laborales">Días laborales (Lun - Vie)</option>
            </select>
          </div>
        </div>

        {/* 3. Resumen de Reglas de Limpieza */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '14px 16px',
            fontSize: '0.78rem',
            color: '#94A3B8',
            lineHeight: '1.5',
          }}
        >
          <div style={{ fontWeight: '700', color: '#E87217', marginBottom: '6px', fontSize: '0.8125rem' }}>
            📌 Comportamiento al activarse el horario ({hora}):
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>
              <strong>Múltiples pestañas:</strong> Se cierran automáticamente todas las pestañas adicionales y queda 1 sola pestaña.
            </li>
            <li>
              <strong>Pestaña única o con datos:</strong> Se limpia por completo (se borran datos del cliente, productos y borradores locales).
            </li>
            <li>
              <strong>Reinicio de contador:</strong> El correlativo de cotizaciones vuelve a <strong>#1</strong> (la próxima añadida será #2).
            </li>
            <li>
              <strong>Libertad de uso posterior:</strong> El usuario puede continuar trabajando con normalidad luego del corte sin interrupciones adicionales.
            </li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '10px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          {/* Botón de Limpieza Manual Inmediata */}
          <button
            type="button"
            onClick={handleExecuteNow}
            disabled={executingManual || saving}
            title="Ejecuta inmediatamente la limpieza de pestañas para todos los usuarios"
            style={{
              padding: '9px 14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: (executingManual || saving) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {executingManual ? 'Ejecutando...' : '⚡ Limpiar Pestañas Ahora'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary"
              style={{
                padding: '9px 18px',
                fontSize: '0.875rem',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{
                padding: '9px 20px',
                fontSize: '0.875rem',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
