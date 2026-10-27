import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck, MapPin, Phone, Mail, FileText, Loader2, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

export const OrgProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase
      .from('organizations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setOrg(data);
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
        <p className="text-sm font-medium mt-3">Loading organization details…</p>
      </div>
    );
  }

  const orgName = org?.name || user?.name || 'Organization Partner';

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors font-sans pb-28">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold">Organization Profile</h1>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
        {/* Org Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-5 text-center space-y-3 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-[#EAF3FB] dark:bg-blue-950 border border-[#CFE4F7] flex items-center justify-center text-[#0A66C2] mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-lg font-bold">{orgName}</h2>
              <CheckCircle2 className="w-4 h-4 text-[#057642]" />
            </div>
            <p className="text-xs text-gray-500 capitalize">{org?.type || 'Registered NGO Partner'}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#DCFCE7] text-[#057642] px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Partner</span>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 text-xs">
          <h3 className="font-bold text-gray-500 uppercase tracking-wider">Registration Info</h3>
          <div className="space-y-2">
            <p className="flex justify-between">
              <span className="text-gray-500">Reg. Number:</span>
              <span className="font-bold font-mono">{org?.registration_number || 'N/A'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Contact Person:</span>
              <span className="font-bold">{org?.contact_person || user?.name}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500 font-medium">Official Phone:</span>
              <span className="font-bold">{org?.official_phone || user?.phone || 'N/A'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Official Email:</span>
              <span className="font-bold">{org?.official_email || user?.email}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">City / Location:</span>
              <span className="font-bold">{org?.city || user?.location || 'Local City'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="w-full bg-[#FEE2E2] text-[#CC1016] font-semibold py-3 rounded-full text-xs transition border border-[#CC1016]/20 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Organization Account</span>
        </button>
      </div>
    </div>
  );
};
