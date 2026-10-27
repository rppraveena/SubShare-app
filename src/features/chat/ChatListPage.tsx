import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2, AlertCircle, RefreshCw, ChevronRight, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || currentUser?.id;
      if (!userId) {
        setRooms([]);
        return;
      }

      // Fetch chat_rooms where participant_ids contains the current user's ID
      const { data, error: roomErr } = await supabase
        .from('chat_rooms')
        .select('*')
        .contains('participant_ids', [userId])
        .order('created_at', { ascending: false });

      if (roomErr) throw roomErr;

      let roomList = data || [];
      if (roomList.length > 0) {
        const otherUserIds = [
          ...new Set(
            roomList
              .flatMap((r: any) => r.participant_ids || [])
              .filter((id: string) => id && id !== userId)
          ),
        ];

        if (otherUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, profile_photo_url')
            .in('id', otherUserIds);

          if (profiles) {
            roomList = roomList.map((r: any) => {
              const otherId = r.participant_ids?.find((id: string) => id !== userId);
              const prof = profiles.find((p: any) => p.id === otherId);
              return {
                ...r,
                otherUserName: prof?.name || 'SubShare Peer',
                otherAvatar: prof?.profile_photo_url || null,
              };
            });
          }
        }
      }

      setRooms(roomList);
    } catch (err: any) {
      console.error('Error fetching chat rooms:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return (
    <div className="flex flex-col min-h-full bg-slate-950 text-slate-100 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Messages</h1>
            <p className="text-[11px] text-slate-400">Direct peer-to-peer conversations</p>
          </div>
        </div>
        <button onClick={loadRooms} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3">
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Loading conversations…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-rose-300">{error}</p>
            <button
              onClick={loadRooms}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3.5 py-2 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center space-y-3 my-8">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Conversations Yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              When you accept service requests or someone accepts yours, direct chat rooms will appear here automatically.
            </p>
          </div>
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className="space-y-2.5">
            {rooms.map((room) => {
              const displayName = room.otherUserName || 'SubShare Peer';
              const avatar = room.otherAvatar;

              return (
                <div
                  key={room.id}
                  onClick={() => navigate(`/chat/${room.id}`)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        className="w-11 h-11 rounded-full object-cover border border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-base flex-shrink-0">
                        {displayName.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm truncate">{displayName}</h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {room.last_message || 'Tap to send a message'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
