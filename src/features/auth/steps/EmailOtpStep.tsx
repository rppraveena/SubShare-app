import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface EmailOtpStepProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
  loading: boolean;
  error: string | null;
}

export const EmailOtpStep: React.FC<EmailOtpStepProps> = ({
  email,
  onVerify,
  onResend,
  onChangeEmail,
  loading,
  error,
}) => {
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOpenEmailApp = () => {
    // On web, open Gmail; on native the mailto scheme works fine
    window.open('https://mail.google.com', '_blank');
  };

  const handleConfirmed = async () => {
    setLocalError(null);
    setChecking(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        // Session exists — pass a sentinel so the parent advances the step
        await onVerify('__link_verified__');
      } else {
        setLocalError('No confirmed session found. Please click the link in your email first.');
      }
    } catch {
      setLocalError('Could not check your session. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || resending) return;
    setLocalError(null);
    setResending(true);
    await onResend();
    setResending(false);
    setCooldown(60);
  };

  const displayError = localError || error;
  const isLoading = loading || checking;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 mb-3">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Check your email</h2>
        <p className="text-sm text-slate-500 mt-1.5">
          We sent a verification link to
        </p>
        <p className="text-sm font-bold text-slate-800 mt-0.5 break-all">{email}</p>
      </div>

      {/* Instruction card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center space-y-1">
        <p className="text-sm font-semibold text-blue-900">
          Click the link in your email to confirm your account
        </p>
        <p className="text-xs text-blue-600 leading-relaxed">
          The link expires in 24 hours. Check your spam folder if you don't see it.
        </p>
      </div>

      {displayError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold text-center">
          {displayError}
        </div>
      )}

      {/* Primary action: open email app */}
      <button
        type="button"
        onClick={handleOpenEmailApp}
        className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-all shadow-xs"
      >
        <ExternalLink className="w-4 h-4 text-slate-400" />
        Open Email App
      </button>

      {/* Secondary action: already confirmed */}
      <button
        type="button"
        onClick={handleConfirmed}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {isLoading ? (
          <span className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="30" />
            </svg>
            Checking…
          </span>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            I've Confirmed — Continue
          </>
        )}
      </button>

      {/* Footer links */}
      <div className="flex items-center justify-between text-xs pt-1">
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Change email
        </button>

        <button
          type="button"
          disabled={cooldown > 0 || resending}
          onClick={handleResendClick}
          className={`font-semibold flex items-center gap-1.5 ${
            cooldown > 0 || resending
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
        </button>
      </div>
    </div>
  );
};
