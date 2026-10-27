import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Shield, LogOut, Mail, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export const PendingApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (org) {
        setOrgData(org);
        if (org.verification_status === 'verified') {
          navigate('/home', { replace: true });
        } else if (org.verification_status === 'rejected') {
          navigate('/organization/rejected', { replace: true });
        }
      }
    } catch (err) {
      console.error('Error checking org verification status:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    checkStatus();
    // Auto-refresh poll every 15 seconds
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto p-5">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
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
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Verification Under Review</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Your organization is being reviewed by our administration team. You’ll be able to access all features once approved.
          </p>
        </div>

        {/* Estimated Time Badge */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-amber-300">Estimated Review Time</p>
          <p className="text-sm font-black text-amber-400 mt-0.5">Usually within 24–48 hours</p>
        </div>

        {/* Org Details Preview */}
        {orgData && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted Organization Details</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-white">{orgData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span className="font-bold text-white">{orgData.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reg Number:</span>
                <span className="font-mono text-white">{orgData.registration_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">City:</span>
                <span className="text-white">{orgData.city || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Support & Actions */}
        <div className="space-y-3">
          <a
            href="mailto:support@subshare.app?subject=Organization%20Verification%20Inquiry"
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span>Contact Support Team</span>
          </a>

          <button
            onClick={checkStatus}
            className="w-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Approval Status Now</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-slate-900 text-[11px] text-slate-500">
        SubShare Governance & Verification Protocol
      </div>
    </div>
  );
};
