import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldAlert, CheckCircle2, UserX, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [id]);

  const handleAdjustTrust = async (delta: number) => {
    if (!id || !profile) return;
    const newScore = Math.max(0, Math.min(100, (profile.trust_score || 10) + delta));
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ trust_score: newScore })
        .eq('id', id);

      if (error) throw error;
      setProfile({ ...profile, trust_score: newScore });
      alert(`Trust score updated to ${newScore}`);
    } catch (e: any) {
      alert(e.message || 'Failed to update trust score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWarning = async () => {
    if (!id) return;
    const msg = window.prompt('Enter warning message to send to user:');
    if (!msg) return;

    setSubmitting(true);
    try {
      await supabase.from('notifications').insert({
        user_id: id,
        title: 'Official Administrator Warning',
        body: msg,
        type: 'system',
      });
      alert('Warning notification sent to user.');
    } catch (e: any) {
      alert(e.message || 'Failed to send warning');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
        <p className="text-sm font-medium mt-3">Loading user profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-bold text-base">User Profile Not Found</h3>
        <button onClick={() => navigate('/admin/users')} className="mt-3 px-4 py-2 bg-[#0A66C2] text-white font-bold text-xs rounded-full">
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans pb-28">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/users')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">User #{id?.substring(0, 8)}</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto w-full space-y-4">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-4">
            <img
              src={profile.profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={profile.name}
              className="w-16 h-16 rounded-full object-cover border"
            />
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">{profile.name || 'User'}</h2>
              <p className="text-xs text-gray-500">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF3FB] text-[#0A66C2] px-2 py-0.5 rounded-xs">
                  {profile.account_type || 'Individual'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#DCFCE7] text-[#057642] px-2 py-0.5 rounded-xs">
                  Trust Score: {profile.trust_score || 10}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-gray-100 dark:border-slate-800 pt-3">
            <p><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
            <p><strong>City / Location:</strong> {profile.city || 'N/A'}</p>
            <p><strong>Is Admin:</strong> {profile.is_admin ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Moderation Controls */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-5 space-y-3 shadow-2xs">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">Moderation Controls</h3>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleAdjustTrust(-10)}
              disabled={updating}
              className="w-full py-2.5 rounded-full border border-[#CC1016] text-[#CC1016] font-semibold text-xs flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Deduct Trust Score (-10)</span>
            </button>

            <button
              onClick={() => handleAdjustTrust(+10)}
              disabled={updating}
              className="w-full py-2.5 rounded-full border border-[#057642] text-[#057642] font-semibold text-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Boost Trust Score (+10)</span>
            </button>

            <button
              onClick={handleSendWarning}
              disabled={updating}
              className="w-full py-2.5 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Issue Official Warning</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
