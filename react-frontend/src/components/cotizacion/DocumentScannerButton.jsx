import { useState, useRef } from 'react';
import axios from 'axios';
import { compressDocumentImage } from '../../utils/imageCompressor';

export default function DocumentScannerButton({
  onScanComplete,
  compact = false,
  label = 'Escanear',
  title = 'Escanear Cédula, RIF o Pasaporte con IA',
  className = '',
  style = {},
  isClearMode = false,
  clearOnly = false,
  onClear,
  clearLabel = 'Limpiar',
  clearTitle = 'Limpiar campos de datos',
}) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error' | 'info', text: string }
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the user can select the same file again if desired
    e.target.value = '';

    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Comprimiendo y preparando imagen...' });

    try {
      // 1. Client-side auto-compression under 5MB limit with high text sharpness
      const compressionResult = await compressDocumentImage(file, {
        maxSizeMB: 5,
        maxDimension: 1800,
        quality: 0.82,
      });

      setStatusMsg({
        type: 'info',
        text: `Analizando documento en memoria (${compressionResult.compressedSizeMB} MB)...`,
      });

      // 2. Send 100% in-memory via JSON base64 to Laravel API (no temp files on disk)
      const res = await axios.post(
        '/v1/ocr/scan-document',
        { image_base64: compressionResult.dataUrl },
        { timeout: 65000 }
      );

      if (res.data?.success && res.data?.data) {
        const docData = res.data.data;
        setStatusMsg({
          type: 'success',
          text: `¡${docData.tipo_documento}-${docData.documento || 'Doc'} detectado!`,
        });

        if (onScanComplete) {
          onScanComplete(docData);
        }

        // Auto-clear success message after 4s
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        throw new Error(res.data?.message || 'No se reconoció un documento válido.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Error al procesar la imagen del documento.';
      setStatusMsg({ type: 'error', text: errMsg });
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (loading) return;
    if (clearOnly || isClearMode) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setStatusMsg(null);
      if (isClearMode && onClear) {
        onClear();
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const isClearButton = clearOnly || isClearMode;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={loading || clearOnly}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={loading || (clearOnly && !isClearMode)}
        title={clearOnly || isClearMode ? clearTitle : title}
        className={className || (compact ? 'btn-icon-scanner' : 'btn-secondary-form')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: compact ? '4px' : '6px',
          padding: compact ? '4px 8px' : '8px 14px',
          borderRadius: '6px',
          background: isClearButton
            ? 'rgba(239, 68, 68, 0.15)'
            : compact ? 'rgba(232, 114, 23, 0.15)' : 'rgba(232, 114, 23, 0.2)',
          border: isClearButton
            ? '1px solid rgba(239, 68, 68, 0.5)'
            : '1px solid rgba(232, 114, 23, 0.45)',
          color: isClearButton ? '#FCA5A5' : '#FFA756',
          fontSize: compact ? '0.75rem' : '0.8125rem',
          fontWeight: '600',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          ...style,
        }}
      >
        {loading ? (
          <>
            <svg
              style={{
                width: compact ? '14px' : '16px',
                height: compact ? '14px' : '16px',
                animation: 'spin 1s linear infinite',
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>{compact ? 'Leyendo...' : 'Escaneando...'}</span>
          </>
        ) : clearOnly || isClearMode ? (
          <>
            {/* Clear / Eraser Icon */}
            <svg
              style={{
                width: compact ? '14px' : '16px',
                height: compact ? '14px' : '16px',
                flexShrink: 0,
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
              <path d="M22 21H7" />
              <path d="m5 11 9 9" />
            </svg>
            {clearLabel && <span>{clearLabel}</span>}
          </>
        ) : (
          <>
            {/* Camera / ID card Icon */}
            <svg
              style={{
                width: compact ? '14px' : '16px',
                height: compact ? '14px' : '16px',
                flexShrink: 0,
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <circle cx="9" cy="10" r="2" />
              <line x1="15" y1="8" x2="19" y2="8" />
              <line x1="15" y1="12" x2="19" y2="12" />
              <line x1="7" y1="16" x2="17" y2="16" />
            </svg>
            {label && <span>{label}</span>}
          </>
        )}
      </button>

      {/* Floating or inline status notification toast */}
      {statusMsg && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 9999,
            minWidth: '220px',
            maxWidth: '320px',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            lineHeight: 1.3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            background:
              statusMsg.type === 'success'
                ? '#064E3B'
                : statusMsg.type === 'error'
                ? '#7F1D1D'
                : '#1E293B',
            color:
              statusMsg.type === 'success'
                ? '#6EE7B7'
                : statusMsg.type === 'error'
                ? '#FCA5A5'
                : '#93C5FD',
            border: `1px solid ${
              statusMsg.type === 'success'
                ? '#059669'
                : statusMsg.type === 'error'
                ? '#DC2626'
                : '#3B82F6'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span>{statusMsg.text}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 'bold',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
