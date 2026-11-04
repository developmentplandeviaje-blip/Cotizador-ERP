import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';
import CustomSelect from '../../common/CustomSelect';
import ConfirmationModal from '../../common/ConfirmationModal';
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
  const [showCleanupConfirmation, setShowCleanupConfirmation] = useState(false);
  const [hora24 = '18', minutos = '00'] = (hora || '18:00').split(':');
  const hora24Numero = Number(hora24);
  const hora12 = String((hora24Numero % 12) || 12).padStart(2, '0');
  const periodo = hora24Numero >= 12 ? 'pm' : 'am';

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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Configurar Horario de Cierre"
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
            Administración Global para Todos los Usuarios
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
                ? ''
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
                backgroundColor: activo ? '#2563EB' : 'rgba(255, 255, 255, 0.2)',
                transition: '0.3s',
                borderRadius: '34px',
                boxShadow: activo ? '0 0 10px rgba(37, 99, 235, 0.45)' : 'none',
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
              Hora de Cierre
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '6px' }}>
              <CustomSelect
                value={hora12}
                onChange={(e) => {
                  const hour = (Number(e.target.value) % 12) + (periodo === 'pm' ? 12 : 0);
                  setHora(`${String(hour).padStart(2, '0')}:${minutos}`);
                }}
                disabled={!activo}
                searchable={false}
                className="select-tipo-doc"
              >
                {Array.from({ length: 12 }, (_, index) => {
                  const value = String(index === 0 ? 12 : index).padStart(2, '0');
                  return <option key={value} value={value}>{value}</option>;
                })}
              </CustomSelect>
              <CustomSelect
                value={minutos}
                onChange={(e) => setHora(`${hora24}:${e.target.value}`)}
                disabled={!activo}
                searchable={false}
                className="select-tipo-doc"
              >
                {Array.from({ length: 60 }, (_, minute) => {
                  const value = String(minute).padStart(2, '0');
                  return <option key={value} value={value}>{value}</option>;
                })}
              </CustomSelect>
              <CustomSelect
                value={periodo}
                onChange={(e) => {
                  const hour = (hora24Numero % 12) + (e.target.value === 'pm' ? 12 : 0);
                  setHora(`${String(hour).padStart(2, '0')}:${minutos}`);
                }}
                disabled={!activo}
                searchable={false}
                className="select-tipo-doc"
              >
                <option value="am">a. m.</option>
                <option value="pm">p. m.</option>
              </CustomSelect>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: '#E2E8F0', marginBottom: '6px' }}>
              Días de Aplicación
            </label>
            <CustomSelect
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              disabled={!activo}
              className="select-tipo-doc"
              searchable={false}
            >
              <option value="todos">Todos los días (Lun - Dom)</option>
              <option value="laborales">Días laborales (Lun - Vie)</option>
            </CustomSelect>
          </div>
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
            onClick={() => setShowCleanupConfirmation(true)}
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
            {executingManual ? 'Ejecutando...' : 'Limpiar Pestañas'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-form-cancel"
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
              className="btn-form-nxt"
              style={{
                padding: '9px 20px',
                fontSize: '0.875rem',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
        </form>
      </Modal>
      <ConfirmationModal
        isOpen={showCleanupConfirmation}
        type="danger"
        title="Ejecutar limpieza global"
        subtitle="¿Está seguro de que desea ejecutar la limpieza global ahora? Se cerrarán las pestañas adicionales de todos los usuarios, se limpiarán los borradores y se reiniciará el contador a #1."
        confirmText="Ejecutar limpieza"
        onCancel={() => setShowCleanupConfirmation(false)}
        onConfirm={() => {
          setShowCleanupConfirmation(false);
          handleExecuteNow();
        }}
      />
    </>
  );
}
