/**
 * interactionGuards:
 * 1. Prohíbe copiar o guardar imágenes e iconos (clic derecho bloqueado en imágenes/iconos, selección deshabilitada).
 * 2. Permite seleccionar y copiar texto con total normalidad (Ctrl+C, clic derecho 'Copiar').
 * 3. Prohíbe arrastrar y soltar (drag & drop / importar / arrastrar y pegar) para evitar mover texto hacia inputs o importar archivos/texto por arrastre.
 */

export function setupInteractionGuards() {
  if (typeof window === 'undefined') return;

  // 1. Prevenir arrastrar cualquier elemento o texto seleccionado
  window.addEventListener(
    'dragstart',
    (e) => {
      e.preventDefault();
      return false;
    },
    { capture: true }
  );

  // 2. Prevenir importar / soltar / arrastrar y pegar (drop) en cualquier input, textarea o área
  window.addEventListener(
    'dragover',
    (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'none';
      }
      return false;
    },
    { capture: true }
  );

  window.addEventListener(
    'drop',
    (e) => {
      e.preventDefault();
      return false;
    },
    { capture: true }
  );

  // 3. Prevenir menú contextual específicamente en imágenes e iconos (evita "Copiar imagen", "Guardar imagen como...", etc.)
  window.addEventListener(
    'contextmenu',
    (e) => {
      const target = e.target;
      if (!target) return;
      const isImageOrIcon =
        target.tagName === 'IMG' ||
        target.tagName === 'SVG' ||
        target.closest('img') ||
        target.closest('svg') ||
        target.closest('picture') ||
        target.closest('canvas') ||
        target.closest('[role="img"]') ||
        (target.classList &&
          (target.classList.contains('icon') || target.classList.contains('erp-icon')));

      if (isImageOrIcon) {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  // 4. Prevenir atajo de copia directa si el elemento objetivo es una imagen o icono y no hay texto seleccionado
  window.addEventListener(
    'copy',
    (e) => {
      const selection = window.getSelection();
      const hasTextSelection =
        selection && !selection.isCollapsed && selection.toString().trim().length > 0;

      if (!hasTextSelection) {
        const target = e.target;
        if (
          target &&
          (target.tagName === 'IMG' ||
            target.tagName === 'SVG' ||
            target.closest('img') ||
            target.closest('svg') ||
            target.closest('[role="img"]'))
        ) {
          e.preventDefault();
        }
      }
    },
    { capture: true }
  );
}

setupInteractionGuards();
