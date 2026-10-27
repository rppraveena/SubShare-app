import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + '/reset-password',
      });

      setLoading(false);

      if (resetError) {
        setError(resetError.message);
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-slate-200/60">
      {/* Header Bar */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between bg-white border-b border-slate-100">
        <button
          onClick={() => navigate('/auth')}
          className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-4.5 h-4.5" />
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

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your registered email and we'll send a link to reset your password.
          </p>

          {submitted ? (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Reset link sent!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly. Please check your inbox and spam folder.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Registered Email Address
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10">
                  <div className="pl-3.5 pr-2.5 border-r border-slate-200">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="flex-1 h-12 px-3 text-slate-900 text-sm outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="30" />
                    </svg>
                    Sending Reset Link…
                  </span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100 text-center">
          <Link
            to="/auth"
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
