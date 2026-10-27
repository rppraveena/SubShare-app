import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyAdminStatus = async () => {
      if (!isAuthenticated || !user?.id) {
        if (isMounted) {
          setIsAdmin(false);
          setChecking(false);
        }
        return;
      }

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          if (!error && data && data.is_admin === true) {
            if (isMounted) {
              setIsAdmin(true);
              setChecking(false);
            }
            return;
          }
        } catch (err) {
          console.error('Error verifying admin status:', err);
        }
      }

      // Fallback to in-memory user flag if profiles check didn't return true
      if (isMounted) {
        setIsAdmin(user.is_admin === true || user.role === 'admin');
        setChecking(false);
      }
    };

    verifyAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Verifying administrative access…</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
