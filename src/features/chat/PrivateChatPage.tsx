import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Lock,
  Shield,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { TrustScoreBadge } from '../../components/ui/TrustScoreBadge';
import { StatusPill } from '../../components/ui/StatusPill';

export interface PrivateChatPageProps {}

function ThreadList({ onSelect }: Readonly<{ onSelect: (id: string) => void }>) {
  const threads = useChatStore((s) => s.threads);
  const activeThreadId = useChatStore((s) => s.activeThreadId);

  if (threads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
        <h3 className="font-bold text-slate-800 text-base">No conversations yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
          Chat rooms are opened securely when you request a ride, reserve a ticket, coordinate blood aid, or claim food.
        </p>
        <Link
          to="/services"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200"
        >
          Explore Listings <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3.5 border-b border-slate-100">
        <h1 className="text-lg font-black text-slate-900">Direct Messages</h1>
        <p className="text-slate-500 text-xs mt-0.5">Secure, relationship-scoped communications</p>
      </div>
      <div className="flex flex-col">
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => onSelect(thread.id)}
            className={`flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 text-left transition-colors ${
              activeThreadId === thread.id ? 'bg-blue-50/70' : 'hover:bg-slate-50'
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={thread.counterpartAvatar}
                alt={thread.counterpartName}
                className="w-11 h-11 rounded-full object-cover border border-slate-200"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-slate-900 text-sm truncate">{thread.counterpartName}</span>
                <span className="text-[10px] text-slate-400 flex-shrink-0">{thread.lastMessageTime}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">{thread.lastMessage}</p>
              <p className="text-[11px] text-primary font-bold mt-0.5 truncate">{thread.contextTitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatView({ threadId, onBack }: Readonly<{ threadId: string; onBack: () => void }>) {
  const thread = useChatStore((s) => s.threads.find((t) => t.id === threadId));
  const { sendMessage } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  if (!thread) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(threadId, input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white">
        <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-xl hover:bg-slate-50 text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img
          src={thread.counterpartAvatar}
          alt={thread.counterpartName}
          className="w-9 h-9 rounded-full object-cover border border-slate-200"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-slate-900 text-sm truncate">{thread.counterpartName}</p>
            <TrustScoreBadge score={thread.counterpartTrustScore} size="sm" showLabel={false} />
          </div>
          <p className="text-[11px] text-slate-400 truncate">{thread.contextTitle}</p>
        </div>
      </div>

      {/* Security Context Banner */}
      <div className="bg-blue-50/80 border-b border-blue-100 px-4 py-2 flex items-center gap-2.5">
        <Lock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-blue-900 truncate">{thread.contextTitle}</p>
          <p className="text-[10px] text-blue-700 truncate">{thread.contextSubtitle}</p>
        </div>
        <StatusPill status="Verified Peer" variant="primary" size="sm" />
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[#F8FAFC]">
        {thread.messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2.5">
                <Shield className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-900 font-medium leading-snug">{msg.text}</p>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  msg.isMe
                    ? 'rounded-br-xs bg-primary text-white font-medium'
                    : 'rounded-bl-xs bg-white text-slate-900 border border-slate-200/80 shadow-2xs font-medium'
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.isMe ? 'text-blue-200' : 'text-slate-400'}`}>{msg.timestamp}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Security Warning */}
      <div className="px-4 py-1.5 bg-amber-50/80 border-t border-amber-100 flex items-center gap-2">
        <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
        <p className="text-[10px] text-amber-900 font-medium">Never share payment UPI PINs or streaming account passwords.</p>
      </div>

      {/* Message Input Box */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-white flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Type a secure message…"
          className="flex-1 h-10 px-3 bg-slate-100 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary font-medium"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const PrivateChatPage: React.FC<PrivateChatPageProps> = () => {
  const { activeThreadId, setActiveThread, threads } = useChatStore();
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const handleSelectThread = (id: string) => {
    setActiveThread(id);
    setMobileShowChat(true);
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
  };

  return (
    <div className="flex h-[calc(100vh-56px-70px)] min-h-0 bg-white">
      {/* Thread List Column */}
      <div className={`flex-1 flex flex-col overflow-y-auto ${mobileShowChat ? 'hidden md:flex md:w-80 md:border-r border-slate-100' : 'flex'}`}>
        <ThreadList onSelect={handleSelectThread} />
      </div>

      {/* Chat View Column */}
      <div className={`flex-1 flex flex-col ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
        {activeThreadId && threads.some((t) => t.id === activeThreadId) ? (
          <ChatView threadId={activeThreadId} onBack={handleBackToList} />
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-slate-50">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">Select a conversation</p>
            <p className="text-xs text-slate-400">Your direct messages with peer sharers appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
