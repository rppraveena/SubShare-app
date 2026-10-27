import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle2, ShieldCheck, LockKeyhole } from 'lucide-react';
import { PasswordStrength } from '../../../components/PasswordStrength';
import { TermsDialog } from '../../../components/legal/TermsDialog';
import { PrivacyDialog } from '../../../components/legal/PrivacyDialog';

interface EmailPasswordStepProps {
  initialValues: { name: string; email: string };
  onSubmit: (values: { name: string; email: string; pass: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
  onSwitchToSignIn?: () => void;
}

export const EmailPasswordStep: React.FC<EmailPasswordStepProps> = ({
  initialValues,
  onSubmit,
  loading,
  error,
  onSwitchToSignIn,
}) => {
  const [name, setName] = useState(initialValues.name);
  const [email, setEmail] = useState(initialValues.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPassword =
    password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  const isFormValid =
    name.trim().length >= 2 &&
    isValidEmail &&
    isValidPassword &&
    password === confirmPassword &&
    termsAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (name.trim().length < 2) {
      setLocalError('Please enter your full name (at least 2 characters)');
      return;
    }
    if (!isValidEmail) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (!isValidPassword) {
      setLocalError('Password must be at least 6 characters and contain letters and numbers');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (!termsAccepted) {
      setLocalError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    await onSubmit({ name: name.trim(), email: email.trim().toLowerCase(), pass: password });
  };

  const activeError = localError || error;
  const isAlreadyRegistered = activeError && activeError.toLowerCase().includes('already registered');

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your details to create your account and get started immediately.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
            Full Name
          </label>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
            <div className="flex items-center pl-3.5 pr-2.5 border-r border-slate-200 h-11">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setLocalError(null); }}
              placeholder="John Doe"
              required
              className="flex-1 h-11 px-3 text-slate-900 text-sm outline-none"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Email Address
            </label>
            {isValidEmail && (
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid Format
              </span>
            )}
          </div>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
            <div className="flex items-center pl-3.5 pr-2.5 border-r border-slate-200 h-11">
              <Mail className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
              placeholder="name@example.com"
              required
              className="flex-1 h-11 px-3 text-slate-900 text-sm outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
            Password
          </label>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
            <div className="flex items-center pl-3.5 pr-2.5 border-r border-slate-200 h-11">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
              placeholder="Min 6 chars (letter + number)"
              required
              className="flex-1 h-11 px-3 text-slate-900 text-sm outline-none"
            />
          </div>
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
            Confirm Password
          </label>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
            <div className="flex items-center pl-3.5 pr-2.5 border-r border-slate-200 h-11">
              <LockKeyhole className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(null); }}
              placeholder="Re-enter password"
              required
              className="flex-1 h-11 px-3 text-slate-900 text-sm outline-none"
            />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="text-xs text-rose-600 mt-1 font-semibold">Passwords do not match</p>
          )}
        </div>

        {/* Terms & Privacy Checkbox */}
        <div className="pt-1">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="terms-checkbox" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
              I agree to the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTerms(true);
                }}
                className="text-blue-600 underline font-semibold hover:text-blue-700 focus:outline-none"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPrivacy(true);
                }}
                className="text-blue-600 underline font-semibold hover:text-blue-700 focus:outline-none"
              >
                Privacy Policy
              </button>
              . I understand data is stored securely.
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="30" />
              </svg>
              Creating Account…
            </span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Error Display Below Button */}
        {activeError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold space-y-1">
            <p>{activeError}</p>
            {isAlreadyRegistered && onSwitchToSignIn && (
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-blue-600 underline font-bold hover:text-blue-800 text-xs block pt-0.5"
              >
                Sign In instead →
              </button>
            )}
          </div>
        )}

        {/* Security Trust Signals */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" /> Bank-grade Encryption
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Supabase Protected
          </span>
        </div>
      </form>

      {/* Dialogs */}
      <TermsDialog isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyDialog isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  );
};
