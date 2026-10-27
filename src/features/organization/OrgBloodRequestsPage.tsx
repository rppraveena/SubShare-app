import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, MapPin, Clock, User, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const OrgBloodRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'urgent'>('all');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Query active blood_requests
      const { data: rawRequests, error: reqErr } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (reqErr) throw reqErr;

      // 2. Query profiles separately to avoid FK join schema cache error
      const userIds = [...new Set((rawRequests || []).map((r) => r.user_id).filter(Boolean))];

      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .in('id', userIds);
        profiles = profilesData || [];
      }

      // 3. Merge manually
      const enriched = (rawRequests || []).map((r) => ({
        ...r,
        requester: profiles.find((p) => p.id === r.user_id) || null,
      }));

      setRequests(enriched);
    } catch (e) {
      console.error('Error fetching blood requests:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleOfferHelp = async (reqItem: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const participantIds = [reqItem.user_id, user.id].sort();

      // 1. Create or get existing chat room
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .contains('participant_ids', participantIds)
        .maybeSingle();

      let roomId = existingRoom?.id;

      if (!roomId) {
        const { data: newRoom, error: roomErr } = await supabase
          .from('chat_rooms')
          .insert({
            participant_ids: participantIds,
            last_message: 'Organization offered blood assistance',
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (roomErr) throw roomErr;
        roomId = newRoom.id;
      }

      // 2. Insert notification for requester
      await supabase.from('notifications').insert({
        user_id: reqItem.user_id,
        title: 'Organization Offering Help',
        body: `An organization can help with your ${reqItem.blood_group} blood request. Check chat for details.`,
        type: 'blood',
        related_id: reqItem.id,
        action_url: '/chat',
      });

      // 3. Navigate to chat room
      navigate(`/chat/${roomId}`);
    } catch (err: any) {
      alert('Failed to initiate chat: ' + err.message);
    }
  };

  const filtered = requests.filter((r) => {
    if (filter === 'critical') return r.urgency?.toLowerCase() === 'critical';
    if (filter === 'urgent') return r.urgency?.toLowerCase() === 'urgent' || r.urgency?.toLowerCase() === 'critical';
    return true;
  });

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors pb-28">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">Emergency Blood Requests</h1>
            <p className="text-[11px] text-gray-500">Provide org assistance or organize drives</p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto w-full space-y-4">
        {/* Filter Chips */}
        <div className="flex gap-2">
          {(['all', 'critical', 'urgent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === f
                  ? 'bg-[#CC1016] text-white'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#CC1016]" />
            <p className="text-xs font-bold">Loading emergency blood requests…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-3 my-4">
            <HeartHandshake className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-800 dark:text-slate-200">No active blood requests nearby.</p>
            <p className="text-xs text-gray-500">
              When individuals publish urgent blood SOS requests, they will appear here for your organization to assist.
            </p>
          </div>
        )}

        {!loading &&
          filtered.map((req) => (
            <div key={req.id} className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 shadow-2xs">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-sm bg-[#FEE2E2] text-[#CC1016] font-black text-lg flex items-center justify-center">
                    {req.blood_group}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{req.hospital_name || 'Hospital'}</h3>
                    <p className="text-xs text-gray-500">{req.units_needed || 1} units required</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    req.urgency?.toLowerCase() === 'critical'
                      ? 'bg-[#CC1016] text-white'
                      : 'bg-[#FEF3C7] text-[#915907]'
                  }`}
                >
                  {req.urgency || 'Urgent'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 dark:text-slate-300 bg-[#F3F2EF] dark:bg-slate-950 p-3 rounded-xs">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>Requester: {req.requester?.name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{req.city || req.location || 'Nearby'}</span>
                </div>
                {req.required_before && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Required Before: {new Date(req.required_before).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {req.reason && (
                <p className="text-xs text-gray-600 dark:text-slate-400 italic">
                  "{req.reason}"
                </p>
              )}

              <button
                onClick={() => handleOfferHelp(req)}
                className="w-full py-3 bg-[#CC1016] hover:bg-[#900B0F] text-white rounded-full font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Offer to Help</span>
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default OrgBloodRequestsPage;
