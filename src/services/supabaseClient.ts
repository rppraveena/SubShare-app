/**
 * Supabase Client Integration Layer
 * 
 * Configured to connect to Supabase PostgreSQL when environment variables are set:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * 
 * When environment variables are not configured, the application operates in
 * Persistent Local Demo Mode using browser localStorage.
 */

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  isConfigured: boolean;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
};

export const isLiveBackendAvailable = (): boolean => {
  return getSupabaseConfig().isConfigured;
};
