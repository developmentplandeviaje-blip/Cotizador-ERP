import { useState, useRef } from 'react';
import axios from 'axios';
import { compressDocumentImage } from '../../utils/imageCompressor';
import ConfirmationModal from '../common/ConfirmationModal';

/**
 * Escaneo por lotes de documentos (Cédula, RIF, Pasaporte).
 * - Permite seleccionar varios archivos a la vez.
 * - Procesa cada imagen de forma secuencial (evita saturar la API de IA).
 * - Cuando `hasData` es true, el botón cambia a "Limpiar Todo" y ejecuta `onClear`.
 */
export default function BatchDocumentScannerButton({
  onBatchComplete,
  onClear,
  hasData = false,
  maxFiles = 20,
  label = 'Escanear Varios',
  clearLabel = 'Limpiar Todo',
}) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const fileInputRef = useRef(null);

  const showMsg = (msg, ms) => {
    setStatusMsg(msg);
    if (ms) setTimeout(() => setStatusMsg(null), ms);
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    if (files.length > maxFiles) {
      showMsg({ type: 'error', text: `Máximo ${maxFiles} archivos por carga.` }, 5000);
      return;
    }

    setLoading(true);
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatusMsg({ type: 'info', text: `Escaneando ${i + 1} de ${files.length}: ${file.name}` });
      try {
        const compressed = await compressDocumentImage(file, { maxSizeMB: 5, maxDimension: 1800, quality: 0.82 });
        const res = await axios.post(
          '/v1/ocr/scan-document',
          { image_base64: compressed.dataUrl },
          { timeout: 65000 }
        );
        if (res.data?.success && res.data?.data) {
          results.push({ ...res.data.data, fileName: file.name });
        } else {
          errors.push(`${file.name}: ${res.data?.message || 'no reconocido'}`);
        }
      } catch (err) {
        errors.push(`${file.name}: ${err.response?.data?.message || err.message || 'error'}`);
      }
    }

    setLoading(false);

    let filled = 0;
    if (results.length && onBatchComplete) {
      filled = onBatchComplete(results) ?? results.length;
    }

    const parts = [`${filled} pasajero(s) completado(s)`];
    if (results.length > filled) parts.push(`${results.length - filled} sin casilla disponible`);
    if (errors.length) parts.push(`${errors.length} con error`);

    showMsg(
      {
        type: errors.length && !results.length ? 'error' : errors.length || results.length > filled ? 'warning' : 'success',
        text: parts.join(' · '),
        detail: errors,
      },
      errors.length ? 8000 : 4500
    );
  };

  const handleClick = () => {
    if (loading) return;
    if (hasData) {
      setShowClearConfirmation(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const isClear = hasData && !loading;
  const palette = isClear
    ? { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.5)', color: '#FCA5A5' }
    : { bg: 'rgba(232, 114, 23, 0.2)', border: 'rgba(232, 114, 23, 0.45)', color: '#FFA756' };

  const toastColors = {
    success: { bg: '#064E3B', color: '#6EE7B7', border: '#059669' },
    error: { bg: '#7F1D1D', color: '#FCA5A5', border: '#DC2626' },
    warning: { bg: '#78350F', color: '#FCD34D', border: '#D97706' },
    info: { bg: '#1E293B', color: '#93C5FD', border: '#3B82F6' },
  }[statusMsg?.type || 'info'];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      <ConfirmationModal
        isOpen={showClearConfirmation}
        type="danger"
        title="Limpiar pasajeros acompañantes"
        subtitle="¿Desea limpiar los datos de todos los pasajeros acompañantes?"
        confirmText="Limpiar datos"
        onCancel={() => setShowClearConfirmation(false)}
        onConfirm={() => {
          setShowClearConfirmation(false);
          onClear?.();
          showMsg({ type: 'info', text: 'Casillas de acompañantes limpiadas.' }, 3000);
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFiles}
        style={{ display: 'none' }}
        disabled={loading}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={isClear ? 'Borrar los datos de todas las casillas de acompañantes' : 'Seleccione varias imágenes para llenar varias casillas en una sola carga'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '6px',
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          color: palette.color,
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? (
          <>
            <svg style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>Escaneando...</span>
          </>
        ) : isClear ? (
          <>
            <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            <span>{clearLabel}</span>
          </>
        ) : (
          <>
            <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="2" width="16" height="12" rx="2" />
              <path d="M2 8v12a2 2 0 0 0 2 2h14" />
              <circle cx="11" cy="7" r="1.5" />
              <line x1="15" y1="6" x2="19" y2="6" />
              <line x1="15" y1="9" x2="19" y2="9" />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      {statusMsg && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 9999,
            minWidth: '240px',
            maxWidth: '340px',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            lineHeight: 1.35,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            background: toastColors.bg,
            color: toastColors.color,
            border: `1px solid ${toastColors.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span>{statusMsg.text}</span>
            <button
              type="button"
              onClick={() => setStatusMsg(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px' }}
            >
              ×
            </button>
          </div>
          {statusMsg.detail?.length > 0 && (
            <ul style={{ margin: '4px 0 0', paddingLeft: '16px', opacity: 0.9 }}>
              {statusMsg.detail.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
