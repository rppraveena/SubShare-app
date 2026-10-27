import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { OtpInput } from '../../components/OtpInput';

export const ResetPasswordOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || '';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  // Redirect back if no email in state
  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (codeOverride?: string) => {
    const code = codeOverride || otp.join('');
    if (code.length < 6) return;

    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message || 'Invalid or expired code. Please try again.');
    } else {
      // Session is now established — navigate to set new password
      navigate('/reset-password', { replace: true });
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message);
    } else {
      setCooldown(60);
      setOtp(Array(6).fill(''));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-slate-200/60">
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between bg-white border-b border-slate-100">
        <button
          onClick={() => navigate('/forgot-password')}
          className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-black text-slate-900 text-lg tracking-tight">SubShare</span>
        </div>

        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col p-6 bg-white">
        {/* Icon + heading */}
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <Mail className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enter Reset Code</h1>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          We sent a 6-digit code to{' '}
          <span className="font-bold text-slate-800">{email}</span>.
          Enter it below to continue.
        </p>

        {/* OTP boxes */}
        <OtpInput
          length={6}
          value={otp}
          onChange={setOtp}
          onComplete={(code) => handleVerify(code)}
          disabled={loading}
          hasError={!!error}
        />

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold text-center">
            {error}
          </div>
        )}

        {/* Resend + change email row */}
        <div className="flex items-center justify-between text-xs mt-5">
          <Link
            to="/forgot-password"
            className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Change Email
          </Link>

          <button
            type="button"
            disabled={cooldown > 0 || resending}
            onClick={handleResend}
            className={`font-semibold flex items-center gap-1.5 ${
              cooldown > 0 || resending
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        {/* Verify button */}
        <button
          type="button"
          disabled={loading || otp.join('').length < 6}
          onClick={() => handleVerify()}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="30" />
              </svg>
              Verifying…
            </span>
          ) : (
            <span>Verify Code</span>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Rate limited — 60s resend cooldown</span>
        </div>
      </div>
    </div>
  );
};
