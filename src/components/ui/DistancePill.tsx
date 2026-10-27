import React from 'react';
import { MapPin } from 'lucide-react';

export interface DistancePillProps {
  distance: string;
  size?: 'sm' | 'md';
}

export const DistancePill: React.FC<DistancePillProps> = ({ distance, size = 'md' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-full ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      <MapPin className="w-3 h-3 text-slate-500" />
      <span>{distance}</span>
    </span>
  );
};
