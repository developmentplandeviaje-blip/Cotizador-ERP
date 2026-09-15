import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variantClass = {
    success: 'badge-success',
    error: 'badge-error',
    status: 'badge-status',
    neutral: 'badge-neutral',
  }[variant] || 'badge-neutral';

  return (
    <span className={`badge-pill ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
