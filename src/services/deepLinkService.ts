import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

export function initDeepLinkListener() {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appUrlOpen', async ({ url }) => {
    console.log('Deep link received:', url);

    // ----------------------------------------------------------------
    // 1. Password Reset callback (app.subshare.app://auth/reset-password)
    // ----------------------------------------------------------------
    if (url.includes('auth/reset-password')) {
      try {
        await Browser.close();
      } catch {}

      const parsed = new URL(url.replace('app.subshare.app://', 'https://placeholder/'));
      const code = parsed.searchParams.get('code');
      const hashParams = new URLSearchParams(parsed.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      } else if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }

      window.location.href = '/reset-password';
      return;
    }

    // ----------------------------------------------------------------
    // 2. Email magic-link / auth callback (app.subshare.app://auth/callback)
    // ----------------------------------------------------------------
    if (url.includes('auth/callback')) {
      try {
        await Browser.close();
      } catch {}

      const parsed = new URL(url.replace('app.subshare.app://', 'https://placeholder/'));

      // PKCE flow: exchange code for session
      const code = parsed.searchParams.get('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Deep link code exchange error:', error);
        } else {
          console.log('Deep link: session established for', data.user?.email);
          // onAuthStateChange in authStore will update the store automatically.
          // Navigate to home or let the auth state drive navigation.
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            window.location.href = '/home';
          } else {
            // No session – likely the link was clicked but the auth flow hasn't completed yet.
            alert('Verification pending. Please click the link in your email to confirm your account.');
            window.location.href = '/auth';
          }

        }
        return;
      }

      // Implicit flow fallback: access_token in hash
      const hashParams = new URLSearchParams(parsed.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('Deep link set session error:', error);
        } else {
          window.location.href = '/home';
        }
      }
    }
  });
}
