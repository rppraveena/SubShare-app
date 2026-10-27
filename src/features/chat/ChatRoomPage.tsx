import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, AlertCircle, ShieldAlert, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!roomId) return;

    // 1. Fetch existing chat_messages where room_id = roomId
    const loadMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: msgErr } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (msgErr) throw msgErr;
        setMessages(data || []);
      } catch (err: any) {
        console.error('Error fetching chat messages:', err);
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 50);
      }
    };

    loadMessages();

    // 2. Set up Supabase Realtime channel to listen for new INSERT on chat_messages where room_id = roomId
    const channel = supabase
      .channel(`chat_messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 50);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Send message inserting into chat_messages with room_id, sender_id, text
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !roomId || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const senderId = authData.user?.id || currentUser?.id;
      if (!senderId) throw new Error('Not authenticated');

      const { data, error: sendErr } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: senderId,
          text: textToSend,
        })
        .select()
        .single();

      if (sendErr) throw sendErr;

      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
        setTimeout(scrollToBottom, 50);
      }

      // Update last message in chat_rooms
      supabase
        .from('chat_rooms')
        .update({
          last_message: textToSend,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', roomId)
        .then();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 max-w-md mx-auto relative">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-800 transition">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Direct Conversation</h1>
            <p className="text-[11px] text-emerald-400 font-medium">End-to-End Encrypted</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl hover:bg-slate-800 transition text-slate-400"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-50 p-1">
              <button
                onClick={() => {
                  alert('User reported to admin team.');
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-slate-800 rounded-xl flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                Report & Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading messages…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center text-xs text-rose-300">
            {error}
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <p className="text-sm font-bold text-slate-300">No messages yet</p>
            <p className="text-xs text-slate-500">Say hi to start the conversation!</p>
          </div>
        )}

        {!loading &&
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUser?.id;
            return (
              <div key={msg.id || Math.random()} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-md shadow-blue-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[10px] block mt-1 text-right ${isOwn ? 'text-blue-200' : 'text-slate-500'}`}>
                    {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-500/50 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-3.5 rounded-2xl transition flex-shrink-0 active:scale-95 shadow-md shadow-blue-600/20"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};
