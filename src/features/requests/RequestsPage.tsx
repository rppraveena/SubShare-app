import React, { useState, useEffect, useCallback } from 'react';
import {
  Inbox,
  Send,
  Loader2,
  Check,
  X,
  Clock,
  Ticket,
  Car,
  HeartHandshake,
  Utensils,
  Share2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { TrustScoreBadge } from '../../components/ui/TrustScoreBadge';
import { requestsService } from '../../services/requestsService';

export const RequestsPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || currentUser?.id;
      if (!userId) {
        setIncoming([]);
        setOutgoing([]);
        return;
      }

      // 1. Fetch Incoming: receiver_id = currentUser.id JOIN profiles for sender name
      let incData: any[] = [];
      const { data: incJoin, error: incErr } = await supabase
        .from('service_requests')
        .select(`
          *,
          sender:profiles!sender_id(id, name, trust_score, profile_photo_url)
        `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (incErr) {
        // Fallback if PostgREST foreign key relationship syntax is not named sender_id
        const { data: incRaw, error: incRawErr } = await supabase
          .from('service_requests')
          .select('*')
          .eq('receiver_id', userId)
          .order('created_at', { ascending: false });

        if (incRawErr) throw incRawErr;
        if (incRaw && incRaw.length > 0) {
          const senderIds = [...new Set(incRaw.map((r) => r.sender_id).filter(Boolean))];
          const { data: senderProfiles } = await supabase
            .from('profiles')
            .select('id, name, trust_score, profile_photo_url')
            .in('id', senderIds);

          incData = incRaw.map((r) => ({
            ...r,
            sender: senderProfiles?.find((p) => p.id === r.sender_id) || { name: 'User' },
          }));
        }
      } else {
        incData = incJoin || [];
      }

      // 2. Fetch Outgoing: sender_id = currentUser.id JOIN profiles for receiver name
      let outData: any[] = [];
      const { data: outJoin, error: outErr } = await supabase
        .from('service_requests')
        .select(`
          *,
          receiver:profiles!receiver_id(id, name, trust_score, profile_photo_url)
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (outErr) {
        // Fallback if PostgREST foreign key relationship syntax is not named receiver_id
        const { data: outRaw, error: outRawErr } = await supabase
          .from('service_requests')
          .select('*')
          .eq('sender_id', userId)
          .order('created_at', { ascending: false });

        if (outRawErr) throw outRawErr;
        if (outRaw && outRaw.length > 0) {
          const receiverIds = [...new Set(outRaw.map((r) => r.receiver_id).filter(Boolean))];
          const { data: receiverProfiles } = await supabase
            .from('profiles')
            .select('id, name, trust_score, profile_photo_url')
            .in('id', receiverIds);

          outData = outRaw.map((r) => ({
            ...r,
            receiver: receiverProfiles?.find((p) => p.id === r.receiver_id) || { name: 'Listing Owner' },
          }));
        }
      } else {
        outData = outJoin || [];
      }

      setIncoming(incData);
      setOutgoing(outData);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAccept = async (reqOrId: any) => {
    const id = typeof reqOrId === 'string' ? reqOrId : reqOrId?.id;
    if (!id) return;
    setActionLoading(id);
    try {
      await requestsService.acceptRequest(id);
      await loadRequests();
    } catch (err: any) {
      console.error('Error accepting request in RequestsPage:', err?.message || err);
      alert(err.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await requestsService.rejectRequest(id);
      await loadRequests();
    } catch (err: any) {
      console.error('Error rejecting request in RequestsPage:', err?.message || err);
      alert(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await requestsService.cancelRequest(id);
      await loadRequests();
    } catch (err: any) {
      console.error('Error cancelling request in RequestsPage:', err?.message || err);
      alert(err.message || 'Failed to cancel request');
    } finally {
      setActionLoading(null);
    }
  };

  const getServiceBadge = (type: string) => {
    switch (type) {
      case 'tickets':
        return { icon: Ticket, label: 'Ticket', color: 'bg-blue-50 text-[#0A66C2] border-[#CFE4F7]' };
      case 'rides':
        return { icon: Car, label: 'Ride', color: 'bg-violet-50 text-violet-700 border-violet-200' };
      case 'blood':
        return { icon: HeartHandshake, label: 'Blood', color: 'bg-rose-50 text-[#CC1016] border-rose-200' };
      case 'food':
        return { icon: Utensils, label: 'Food', color: 'bg-amber-50 text-[#915907] border-amber-200' };
      case 'subscriptions':
        return { icon: Share2, label: 'Subscription', color: 'bg-emerald-50 text-[#057642] border-emerald-200' };
      default:
        return { icon: Ticket, label: type || 'Service', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors font-sans pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Service Requests</h1>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">Manage incoming and outgoing requests</p>
        </div>
        <button onClick={loadRequests} className="p-2 rounded-full bg-[#F3F2EF] dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-gray-900">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="p-4 pb-2">
        <div className="flex bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-1 rounded-full">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'incoming' ? 'bg-[#0A66C2] text-white shadow-2xs' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Incoming</span>
            {incoming.filter((r) => r.status === 'pending').length > 0 && (
              <span className="bg-[#CC1016] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1">
                {incoming.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'outgoing' ? 'bg-[#0A66C2] text-white shadow-2xs' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Outgoing</span>
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 p-4 space-y-3">
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <p className="text-sm font-medium">Loading requests…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-[#FEE2E2] border border-[#CC1016]/20 rounded-xs p-5 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#CC1016] mx-auto" />
            <p className="text-sm font-semibold text-[#CC1016]">{error}</p>
            <button
              onClick={loadRequests}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A66C2] bg-[#EAF3FB] px-3.5 py-2 rounded-full"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* INCOMING TAB */}
        {!loading && !error && activeTab === 'incoming' && (
          <>
            {incoming.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-3 my-4">
                <div className="w-14 h-14 rounded-full bg-[#F3F2EF] dark:bg-slate-800 flex items-center justify-center mx-auto">
                  <Inbox className="w-7 h-7 text-gray-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">No Incoming Requests Yet</h3>
                <p className="text-xs text-gray-600 dark:text-slate-400 max-w-xs mx-auto">
                  When users request to join your rides, buy tickets, or join subscription groups, they will appear here.
                </p>
              </div>
            ) : (
              incoming.map((req) => {
                const sBadge = getServiceBadge(req.service_type);
                const SIcon = sBadge.icon;
                const senderName = req.sender?.name || 'SubShare User';
                const trustScore = req.sender?.trust_score ?? 80;
                const isPending = req.status === 'pending';

                return (
                  <div key={req.id} className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-[#EAF3FB] dark:bg-slate-800 border border-[#CFE4F7] dark:border-slate-700 flex items-center justify-center font-bold text-[#0A66C2]">
                          {senderName.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{senderName}</h4>
                            <TrustScoreBadge score={trustScore} size="sm" showLabel={false} />
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {formatTimeAgo(req.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-xs border text-[11px] font-bold flex items-center gap-1 ${sBadge.color}`}>
                        <SIcon className="w-3.5 h-3.5" />
                        <span>{sBadge.label}</span>
                      </div>
                    </div>

                    {req.message && (
                      <p className="text-xs text-gray-700 dark:text-slate-300 bg-[#F3F2EF] dark:bg-slate-950 border border-[#E5E7EB] dark:border-slate-800 p-3 rounded-xs italic">
                        "{req.message}"
                      </p>
                    )}

                    {/* Status / Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB] dark:border-slate-800">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-xs ${
                          req.status === 'accepted'
                            ? 'bg-[#DCFCE7] text-[#057642]'
                            : req.status === 'rejected'
                            ? 'bg-[#FEE2E2] text-[#CC1016]'
                            : 'bg-[#FEF3C7] text-[#915907]'
                        }`}
                      >
                        {req.status || 'Pending'}
                      </span>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-3.5 py-1.5 border border-[#CC1016] text-[#CC1016] font-semibold text-xs rounded-full hover:bg-[#FEE2E2] transition flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleAccept(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-4 py-1.5 bg-[#057642] hover:bg-[#005320] text-white font-semibold text-xs rounded-full transition flex items-center gap-1 shadow-2xs"
                          >
                            {actionLoading === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* OUTGOING TAB */}
        {!loading && !error && activeTab === 'outgoing' && (
          <>
            {outgoing.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-3 my-4">
                <div className="w-14 h-14 rounded-full bg-[#F3F2EF] dark:bg-slate-800 flex items-center justify-center mx-auto">
                  <Send className="w-7 h-7 text-gray-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">You Haven't Sent Any Requests</h3>
                <p className="text-xs text-gray-600 dark:text-slate-400 max-w-xs mx-auto">
                  When you request rides, tickets, or subscription slots, your active requests will be tracked here.
                </p>
              </div>
            ) : (
              outgoing.map((req) => {
                const sBadge = getServiceBadge(req.service_type);
                const SIcon = sBadge.icon;
                const receiverName = req.receiver?.name || 'Listing Owner';
                const trustScore = req.receiver?.trust_score ?? 80;
                const isPending = req.status === 'pending';

                return (
                  <div key={req.id} className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-[#EAF3FB] dark:bg-slate-800 border border-[#CFE4F7] dark:border-slate-700 flex items-center justify-center font-bold text-[#0A66C2]">
                          {receiverName.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">To: {receiverName}</h4>
                            <TrustScoreBadge score={trustScore} size="sm" showLabel={false} />
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {formatTimeAgo(req.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-xs border text-[11px] font-bold flex items-center gap-1 ${sBadge.color}`}>
                        <SIcon className="w-3.5 h-3.5" />
                        <span>{sBadge.label}</span>
                      </div>
                    </div>

                    {req.message && (
                      <p className="text-xs text-gray-700 dark:text-slate-300 bg-[#F3F2EF] dark:bg-slate-950 border border-[#E5E7EB] dark:border-slate-800 p-3 rounded-xs italic">
                        "{req.message}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB] dark:border-slate-800">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-xs ${
                          req.status === 'accepted'
                            ? 'bg-[#DCFCE7] text-[#057642]'
                            : req.status === 'rejected'
                            ? 'bg-[#FEE2E2] text-[#CC1016]'
                            : 'bg-[#FEF3C7] text-[#915907]'
                        }`}
                      >
                        {req.status || 'Pending'}
                      </span>

                      {isPending && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          disabled={actionLoading === req.id}
                          className="px-3.5 py-1.5 border border-gray-300 text-gray-700 dark:text-slate-300 font-semibold text-xs rounded-full hover:bg-gray-100 transition flex items-center gap-1"
                        >
                          {actionLoading === req.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          <span>Cancel Request</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};
