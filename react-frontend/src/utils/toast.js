/**
 * Utility function to dispatch global toast notifications.
 * Supports multiple call formats:
 * - showToast('Message', 'success')
 * - showToast('Message', 'error', { duration: 5000 })
 * - showToast({ message: 'Message', type: 'warning', actions: [...] })
 */
export const showToast = (messageOrOptions, type = 'info', options = {}) => {
  let detail = {};
  if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
    detail = { ...messageOrOptions };
    if (!detail.type) detail.type = type || 'info';
  } else {
    detail = {
      message: messageOrOptions,
      type: type || 'info',
      ...options,
    };
  }

  // Ensure default duration if not specified
  if (detail.duration === undefined) {
    // If it has interactive actions, default duration to 8000ms, otherwise 4500ms
    detail.duration = (detail.actions && detail.actions.length > 0) ? 8000 : 4500;
  }

  window.dispatchEvent(new CustomEvent('app-toast', { detail }));
};

// Convenience helpers
showToast.success = (message, options) => showToast(message, 'success', options);
showToast.error = (message, options) => showToast(message, 'error', options);
showToast.warning = (message, options) => showToast(message, 'warning', options);
showToast.info = (message, options) => showToast(message, 'info', options);

// Attach globally for accessibility across legacy or non-module contexts
if (typeof window !== 'undefined') {
  window.showToast = showToast;
}
