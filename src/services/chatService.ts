import { supabase } from '../lib/supabase';

export const chatService = {
  async createOrGetRoom(otherUserId: string, requestId?: string) {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        console.error('Supabase auth error in createOrGetRoom:', authErr?.message || 'Not authenticated');
        throw new Error('Not authenticated');
      }

      const participantIds = [user.id, otherUserId].sort();

      // Check if room exists
      const { data: existing, error: selectErr } = await supabase
        .from('chat_rooms')
        .select('*')
        .contains('participant_ids', participantIds)
        .maybeSingle();

      if (selectErr) {
        console.error('Supabase select chat_rooms failed:', selectErr.message);
      }

      if (existing) return existing;

      // Create new room
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({
          participant_ids: participantIds,
          request_id: requestId || null,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert chat_rooms failed:', error.message);
        throw error;
      }
      return room;
    } catch (err: any) {
      console.error('Error in createOrGetRoom:', err?.message || err);
      throw err;
    }
  },

  /** Task 2: Fetch chat_rooms where participant_ids contains currentUser.id and join with profiles */
  async getMyRooms() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: rawRooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .contains('participant_ids', [user.id])
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Supabase select chat_rooms failed:', error.message);
        throw error;
      }

      if (!rawRooms || rawRooms.length === 0) return [];

      // Extract all other user IDs
      const otherUserIds = [
        ...new Set(
          rawRooms
            .flatMap((r) => r.participant_ids || [])
            .filter((id: string) => id && id !== user.id)
        ),
      ];

      let profiles: any[] = [];
      if (otherUserIds.length > 0) {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('id, name, email, phone, trust_score, profile_photo_url')
          .in('id', otherUserIds);

        if (profErr) {
          console.error('Supabase select profiles for chat rooms failed:', profErr.message);
        } else {
          profiles = profData || [];
        }
      }

      return rawRooms.map((r) => {
        const otherId = r.participant_ids?.find((id: string) => id !== user.id);
        const otherProfile = profiles.find((p) => p.id === otherId);
        return {
          ...r,
          otherUser: otherProfile || { id: otherId, name: `User #${otherId?.slice(0, 6) || ''}` },
        };
      });
    } catch (err: any) {
      console.error('Error in getMyRooms:', err?.message || err);
      return [];
    }
  },

  /** Task 2: Select from chat_messages where room_id = roomId order by created_at asc */
  async getMessages(roomId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase select chat_messages failed:', error.message);
        throw error;
      }
      return data || [];
    } catch (err: any) {
      console.error('Error in getMessages:', err?.message || err);
      return [];
    }
  },

  /** Task 2: Insert into chat_messages with room_id, sender_id, and text */
  async sendMessage(roomId: string, text: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          text,
          type: 'text',
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert chat_messages failed:', error.message);
        throw error;
      }

      // Update room's last message
      try {
        const { error: roomUpdateErr } = await supabase
          .from('chat_rooms')
          .update({
            last_message: text,
            last_message_at: new Date().toISOString(),
          })
          .eq('id', roomId);

        if (roomUpdateErr) {
          console.error('Supabase update chat_rooms last_message failed:', roomUpdateErr.message);
        }
      } catch (rErr: any) {
        console.error('Error updating chat_rooms last message:', rErr?.message || rErr);
      }

      return data;
    } catch (err: any) {
      console.error('Error in sendMessage:', err?.message || err);
      throw err;
    }
  },

  /** Task 2: Real-time channel for chat_messages INSERTs */
  subscribeToMessages(roomId: string, callback: (msg: any) => void) {
    return supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },
};

export default chatService;
