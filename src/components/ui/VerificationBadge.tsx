import React from 'react';
import { CheckCircle2, Building2, UserCheck } from 'lucide-react';

export interface VerificationBadgeProps {
  type?: 'individual' | 'organization';
  label?: string;
  size?: 'sm' | 'md';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  type = 'individual',
  label,
  size = 'md',
}) => {
  const isOrg = type === 'organization';
  const defaultLabel = isOrg ? 'Verified Organization' : 'Verified Individual';
  const text = label || defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border shadow-2xs ${
        isOrg
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      } ${size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5'}`}
    >
      {isOrg ? (
        <Building2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 text-blue-600'} />
      ) : (
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 text-emerald-600'} />
      )}
      <span>{text}</span>
    </span>
  );
};
