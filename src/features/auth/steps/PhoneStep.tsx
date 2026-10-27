import React, { useState } from 'react';
import { Phone, ArrowRight, ShieldAlert, SkipForward } from 'lucide-react';

interface PhoneStepProps {
  onContinue: (phone: string) => void;
  onSkip: () => void;
}

export const PhoneStep: React.FC<PhoneStepProps> = ({ onContinue, onSkip }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = phone.replace(/\D/g, '');
  const isValidPhone = cleanPhone.length === 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPhone) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    onContinue(`+91${cleanPhone}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Phone className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add Mobile Number</h2>
        </div>
        <p className="text-xs text-slate-500">
          Mobile verification builds peer trust for rides and ticket exchanges.
        </p>
      </div>

      {/* Phone Input */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
          Mobile Number
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
          <div className="flex items-center gap-1 pl-4 pr-3 border-r border-slate-200 h-12 bg-slate-50 text-slate-700 font-bold text-sm">
            <span>+91</span>
          </div>
          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="98402 11245"
            className="flex-1 h-12 px-3 text-slate-900 text-sm font-semibold outline-none"
          />
        </div>
      </div>

      {/* Twilio SMS Notice */}
      <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
          Real-time SMS OTP dispatch via Twilio integration will be active in the next environment update. Your mobile number will be securely recorded.
        </p>
      </div>

      {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

      {/* Continue button */}
      <button
        type="submit"
        disabled={!isValidPhone}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        <span>Save Mobile Number</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Skip button */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Skip phone verification for now</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
};
