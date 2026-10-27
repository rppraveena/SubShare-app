import React from 'react';
import { ShieldCheck } from 'lucide-react';

export interface TrustScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  isNewUser?: boolean;
}

export const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const getScoreColor = (val: number) => {
    if (val >= 70) return 'text-[#10B981] bg-[#DCFCE7] border-[#10B981]/20 dark:bg-emerald-950/40 dark:text-emerald-400';
    if (val >= 30) return 'text-[#4A90E2] bg-[#EBF4FE] border-[#4A90E2]/20 dark:bg-blue-950/40 dark:text-blue-400';
    return 'text-[#6B7280] bg-[#F5F7FA] border-[#E5E7EB] dark:bg-slate-800 dark:text-slate-300';
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-semibold rounded-md',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold rounded-md',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold rounded-md',
  };

  return (
    <div
      className={`inline-flex items-center border shadow-2xs ${getScoreColor(
        score
      )} ${sizeClasses[size]}`}
      title={`Trust Score: ${score}/100 based on verified ID and platform exchanges`}
    >
      <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{score}/100</span>
      {showLabel && <span className="opacity-80 font-normal">Trust</span>}
    </div>
  );
};
