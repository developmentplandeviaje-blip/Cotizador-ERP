import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '', style = {} }) {
  const variantClass = {
    success: 'badge-success',
    error: 'badge-error',
    status: 'badge-status',
    neutral: 'badge-neutral',
    purple: 'badge-purple',
    info: 'badge-info',
    warning: 'badge-warning',
    blue: 'badge-blue',
  }[variant] || 'badge-neutral';

  return (
    <span className={`badge-pill ${variantClass} ${className}`} style={style}>
      {children}
    </span>
  );
}
