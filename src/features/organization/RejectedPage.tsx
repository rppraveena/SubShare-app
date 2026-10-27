import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Shield, LogOut, Mail, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export const RejectedPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReason = async () => {
      if (!user?.id) return;
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('rejection_reason')
          .eq('user_id', user.id)
          .maybeSingle();

        if (org) {
          setRejectionReason(org.rejection_reason || 'Verification details could not be validated.');
        }
      } catch (err) {
        console.error('Error loading rejection reason:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReason();
  }, [user?.id]);

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto p-5">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <span className="font-black text-white text-base tracking-tight">SubShare</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="py-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Verification Rejected</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Your organization application was not approved by our verification team.
          </p>
        </div>

        {/* Rejection Reason Card */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Reason for Rejection</p>
          <p className="text-xs text-rose-200 leading-relaxed font-medium">
            "{rejectionReason || 'Documents or registration number could not be verified.'}"
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/profile-setup')}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Resubmit Application</span>
          </button>

          <a
            href="mailto:support@subshare.app?subject=Organization%20Rejection%20Appeal"
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span>Contact Appeals Support</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-slate-900 text-[11px] text-slate-500">
        SubShare Security & Trust Compliance
      </div>
    </div>
  );
};
