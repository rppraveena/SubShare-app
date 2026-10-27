import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PasswordStrength } from '../../components/PasswordStrength';

/**
 * Shown AFTER the recovery OTP is verified.
 * A Supabase session is already established by ResetPasswordOtpPage.
 * We just need supabase.auth.updateUser({ password }).
 */
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidPassword =
    password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPassword) {
      setError('Password must be at least 8 characters and include letters and numbers');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      setLoading(false);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/auth', { replace: true }), 2000);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-slate-200/60">
      {/* Header Bar */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between bg-white border-b border-slate-100">
        <div className="w-8" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-black text-slate-900 text-lg tracking-tight">SubShare</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col p-6 bg-white justify-between">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose a strong password with at least 8 characters, letters, and numbers.
          </p>

          {success ? (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-emerald-900 text-base">Password Updated!</h3>
              <p className="text-xs text-emerald-700">
                Your password has been successfully updated. Redirecting to Sign In…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* New Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  New Password
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10">
                  <div className="pl-3.5 pr-2.5 border-r border-slate-200">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars (letter + number)"
                    required
                    className="flex-1 h-12 px-3 text-slate-900 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Confirm New Password
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10">
                  <div className="pl-3.5 pr-2.5 border-r border-slate-200">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="flex-1 h-12 px-3 text-slate-900 text-sm outline-none"
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-rose-600 mt-1 font-semibold">Passwords do not match</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || password !== confirmPassword || !isValidPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="30" />
                    </svg>
                    Updating Password…
                  </span>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
