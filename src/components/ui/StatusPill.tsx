import React from 'react';

export interface StatusPillProps {
  status: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  variant,
  size = 'md',
}) => {
  let resolvedVariant = variant;
  if (!resolvedVariant) {
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('authorized') || s.includes('available')) {
      resolvedVariant = 'primary';
    } else if (s.includes('completed') || s.includes('released') || s.includes('verified')) {
      resolvedVariant = 'success';
    } else if (s.includes('pending') || s.includes('held') || s.includes('requested')) {
      resolvedVariant = 'warning';
    } else if (s.includes('urgent') || s.includes('critical') || s.includes('disputed') || s.includes('rejected')) {
      resolvedVariant = 'error';
    } else {
      resolvedVariant = 'neutral';
    }
  }

  const variantStyles = {
    primary: 'bg-primary-fixed text-primary border-blue-200',
    success: 'bg-brand-lightGreen text-brand-green border-emerald-200',
    warning: 'bg-brand-lightAmber text-brand-amber border-amber-200',
    error: 'bg-brand-lightRed text-brand-red border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs ${
        variantStyles[resolvedVariant]
      } ${size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
    >
      {status}
    </span>
  );
};
