import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';

/**
 * Map Supabase error messages to user‑friendly strings.
 */
export const mapAuthError = (msg: string | undefined): string => {
  if (!msg) return 'An unknown error occurred';
  const lower = msg.toLowerCase();
  if (lower.includes('email already registered')) return 'This email is already registered. Try signing in.';
  if (lower.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (lower.includes('email not confirmed')) return 'Please verify your email first.';
  if (lower.includes('password should be at least')) return 'Password must be at least 8 characters.';
  if (lower.includes('rate limit')) return 'Too many attempts. Please try again in 60 seconds.';
  if (lower.includes('network')) return 'Connection error. Check your internet.';
  if (lower.includes('invalid email')) return 'Please enter a valid email address.';
  return msg;
};

/** Sign up with email/password and send magic link */
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (signUpError) return { success: false, error: mapAuthError(signUpError.message) };

    const redirectTo = 'app.subshare.app://auth/callback';
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
        data: { full_name: name },
      },
    });
    if (linkError) return { success: false, error: mapAuthError(linkError.message) };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/** Sign in with email/password */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: mapAuthError(error.message) };
    return { success: true, user: data.user };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/** Send password‑reset magic link */
export const sendPasswordReset = async (email: string) => {
  try {
    const redirectTo = Capacitor.isNativePlatform()
      ? 'app.subshare.app://auth/reset-password'
      : `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { success: false, error: mapAuthError(error.message) };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/** Update password after reset flow */
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: mapAuthError(error.message) };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/** Complete individual profile */
export const completeIndividualProfile = async (profile: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };
    const payload = { id: user.id, ...profile, account_type: 'individual' };
    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/** Complete organization profile and upload docs */
export const completeOrganizationProfile = async (org: any, files: File[]) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };
    const uploaded: string[] = [];
    for (const file of files) {
      const { data, error } = await supabase.storage.from('organization-docs').upload(`${user.id}/${file.name}`, file);
      if (error) return { success: false, error: error.message };
      uploaded.push(data.path);
    }
    const payload = { id: user.id, ...org, documents: uploaded, account_type: 'organization', status: 'pending' };
    const { error } = await supabase.from('organizations').upsert(payload);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};
