import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  MessageSquare,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Lock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TrustScoreBadge } from '../../components/ui/TrustScoreBadge';
import { ReportDialog } from '../../components/reports/ReportDialog';
import { useChatStore } from '../../stores/chatStore';

export const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { createOrOpenThread } = useChatStore();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setProfile(data);
        }
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium mt-3">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
        <ShieldCheck className="w-12 h-12 text-slate-400 mb-2" />
        <h3 className="font-bold text-base">User Profile Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          This user profile is no longer active or available.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  const name = profile.name || 'SubShare Member';
  const avatar = profile.profile_photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
  const trustScore = profile.trust_score ?? 80;
  const canShowContact = profile.show_contact || profile.show_phone;

  const handleStartChat = () => {
    createOrOpenThread(
      name,
      avatar,
      trustScore,
      'tickets' as any,
      `Chat with ${name}`,
      `Private conversation with ${name}`
    );
    navigate('/chat');
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm">Peer Profile</span>
        <button
          onClick={() => setShowReport(true)}
          className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
          title="Report User"
        >
          <ShieldAlert className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-4 max-w-md mx-auto w-full">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-xs">
          <img
            src={avatar}
            alt={name}
            className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 mx-auto shadow-md"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
              {profile.account_type || 'Individual'} Member
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <TrustScoreBadge score={trustScore} size="lg" />
          </div>

          {profile.city && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>{profile.city}</span>
            </div>
          )}
        </div>

        {/* Contact Visibility Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Contact Information
          </h3>

          {canShowContact ? (
            <div className="space-y-2 text-xs">
              {profile.show_phone && profile.phone && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold">{profile.phone}</span>
                </div>
              )}
              {profile.show_contact && profile.email && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="font-bold">{profile.email}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Contact info hidden by user preference. Contact via in-app chat only.
              </p>
            </div>
          )}

          <button
            onClick={handleStartChat}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message User in Chat</span>
          </button>
        </div>
      </div>

      <ReportDialog
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        reportedUserId={userId}
      />
    </div>
  );
};
