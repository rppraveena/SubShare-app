import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

/**
 * Handles the /auth/callback route on web.
 * Supabase redirects here after:
 *   - Email magic-link confirmation (signup / sign-in link)
 *   - Password reset links
 * The PKCE code is exchanged for a session automatically by the Supabase client
 * when detectSessionInUrl is true, OR we manually exchange the code here.
 */
export const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');
      const errorDesc = params.get('error_description');

      if (errorParam) {
        setError(errorDesc || errorParam);
        setStatus('error');
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setStatus('error');
          return;
        }
      }

      // Whether or not there was a code, check the session now
      const { data } = await supabase.auth.getSession();

      if (!data?.session) {
        // Maybe the session was already set via hash params (implicit flow) —
        // give the Supabase client a moment to parse the URL hash.
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            setError(sessionError.message);
            setStatus('error');
            return;
          }
        } else {
          setError('Verification link has expired or was already used. Please request a new one.');
          setStatus('error');
          return;
        }
      }

      setStatus('success');
      // Navigate straight to /home upon session confirmation
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 300);
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center max-w-md mx-auto px-6">
      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg mb-5">
        <Shield className="w-6 h-6" />
      </div>

      {status === 'loading' && (
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <h2 className="font-bold text-slate-900 text-base">Confirming your email…</h2>
          <p className="text-xs text-slate-500">Please wait while we verify your account.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h2 className="font-bold text-slate-900 text-base">Email confirmed!</h2>
          <p className="text-xs text-slate-500">Redirecting you now…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="font-bold text-rose-900 text-base">Verification Failed</h2>
          <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="mt-2 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      )}
    </div>
  );
};
