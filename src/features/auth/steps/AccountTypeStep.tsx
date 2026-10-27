import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AccountType } from '../../../types';
import { AccountTypeCard } from '../../../components/AccountTypeCard';

interface AccountTypeStepProps {
  selectedType: AccountType;
  onContinue: (type: AccountType) => void;
}

export const AccountTypeStep: React.FC<AccountTypeStepProps> = ({
  selectedType,
  onContinue,
}) => {
  const [type, setType] = useState<AccountType>(selectedType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue(type);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Select Account Type</h2>
        </div>
        <p className="text-xs text-slate-500">
          Choose how you will be using SubShare. You can update this later in settings.
        </p>
      </div>

      {/* Side-by-side Account Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-1">
        <AccountTypeCard
          type="individual"
          selected={type === 'individual'}
          onSelect={() => setType('individual')}
        />

        <AccountTypeCard
          type="organization"
          selected={type === 'organization'}
          onSelect={() => setType('organization')}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all mt-2"
      >
        <span>Continue</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
};
