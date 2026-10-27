import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  // Score computation (0 - 4)
  let score = 0;
  if (hasMinLength) score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let label = '';
  let color = 'bg-slate-200';
  let textColor = 'text-slate-400';

  if (password.length > 0) {
    if (score <= 2) {
      label = 'Weak';
      color = 'bg-rose-500';
      textColor = 'text-rose-600';
    } else if (score === 3) {
      label = 'Medium';
      color = 'bg-amber-500';
      textColor = 'text-amber-600';
    } else {
      label = 'Strong';
      color = 'bg-emerald-500';
      textColor = 'text-emerald-600';
    }
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex gap-1.5 h-1.5 rounded-full overflow-hidden bg-slate-100 p-0.5 border border-slate-200/60">
          <div className={`h-full flex-1 rounded-full transition-all duration-300 ${score >= 1 ? color : 'bg-slate-200'}`} />
          <div className={`h-full flex-1 rounded-full transition-all duration-300 ${score >= 3 ? color : 'bg-slate-200'}`} />
          <div className={`h-full flex-1 rounded-full transition-all duration-300 ${score >= 4 ? color : 'bg-slate-200'}`} />
        </div>
        {label && (
          <span className={`text-[11px] font-bold uppercase tracking-wider ${textColor}`}>
            {label}
          </span>
        )}
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
        <div className="flex items-center gap-1.5 text-xs">
          {hasMinLength ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
          )}
          <span className={hasMinLength ? 'text-slate-700 font-medium' : 'text-slate-400'}>
            At least 8 chars
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {hasLetter && hasNumber ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
          )}
          <span className={hasLetter && hasNumber ? 'text-slate-700 font-medium' : 'text-slate-400'}>
            Letter + Number
          </span>
        </div>
      </div>
    </div>
  );
};
