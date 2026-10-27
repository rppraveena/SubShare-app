import React from 'react';
import { User, Building2, CheckCircle2 } from 'lucide-react';
import { AccountType } from '../types';

interface AccountTypeCardProps {
  type: AccountType;
  selected: boolean;
  onSelect: () => void;
}

export const AccountTypeCard: React.FC<AccountTypeCardProps> = ({ type, selected, onSelect }) => {
  const isIndividual = type === 'individual';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        selected
          ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/10'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
      }`}
    >
      {/* Selection Badge */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`p-3 rounded-xl ${
            selected
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isIndividual ? <User className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
        </div>
        {selected ? (
          <CheckCircle2 className="w-6 h-6 text-blue-600 fill-blue-100" />
        ) : (
          <div className="w-5 h-5 rounded-full border border-slate-300" />
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          {isIndividual ? 'Individual' : 'Organization'}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {isIndividual
            ? 'Share subscriptions, tickets, and rides with your verified local community.'
            : 'Register your NGO, orphanage, or trust to receive surplus food donations and bulk community aid.'}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
        <span className={selected ? 'text-blue-700' : 'text-slate-500'}>
          {isIndividual ? 'Personal Account' : 'Verified Entity'}
        </span>
        <span className="text-slate-400">
          {isIndividual ? 'Instant' : 'Verification Required'}
        </span>
      </div>
    </button>
  );
};
