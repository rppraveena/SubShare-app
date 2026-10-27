import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatThread, ChatMessage, ServiceCategory } from '../types';
import { mockChatThreads } from '../utils/mockData';

interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  setActiveThread: (id: string | null) => void;
  sendMessage: (threadId: string, text: string) => void;
  createOrOpenThread: (
    counterpartName: string,
    counterpartAvatar: string,
    counterpartTrustScore: number,
    serviceCategory: ServiceCategory,
    contextTitle: string,
    contextSubtitle: string
  ) => string;
  clearThreads: () => void;
  loadDemoThreads: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: [], // Clean state default: empty
      activeThreadId: null,

      setActiveThread: (id) => set({ activeThreadId: id }),

      sendMessage: (threadId, text) => {
        if (!text.trim()) return;
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: 'usr_001',
          text,
          timestamp: timeString,
          isMe: true,
        };

        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  lastMessage: text,
                  lastMessageTime: timeString,
                  messages: [...thread.messages, newMsg],
                }
              : thread
          ),
        }));

        // Realistic Demo Counterpart Auto-Response Simulation
        setTimeout(() => {
          const currentThread = get().threads.find((t) => t.id === threadId);
          if (currentThread) {
            const replyText =
              currentThread.serviceCategory === 'tickets'
                ? `Thanks for your message! Booking is confirmed. I'll hand over the ticket QR right on time.`
                : currentThread.serviceCategory === 'rides'
                ? `Got your message! I'm on schedule for the ride. See you at the pickup point.`
                : currentThread.serviceCategory === 'blood'
                ? `Thank you for your willingness to help! Please report directly to Blood Bank Counter 2.`
                : currentThread.serviceCategory === 'food'
                ? `Thank you! Our volunteer van is en route for the scheduled pickup.`
                : `Thanks! I've sent the official family invitation link to your registered email.`;

            const replyMsg: ChatMessage = {
              id: `msg-reply-${Date.now()}`,
              senderId: 'counterpart',
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: false,
            };

            set((state) => ({
              threads: state.threads.map((t) =>
                t.id === threadId
                  ? {
                      ...t,
                      lastMessage: replyText,
                      lastMessageTime: replyMsg.timestamp,
                      messages: [...t.messages, replyMsg],
                    }
                  : t
              ),
            }));
          }
        }, 1500);
      },

      createOrOpenThread: (
        counterpartName,
        counterpartAvatar,
        counterpartTrustScore,
        serviceCategory,
        contextTitle,
        contextSubtitle
      ) => {
        const existing = get().threads.find((t) => t.counterpartName === counterpartName);
        if (existing) {
          set({ activeThreadId: existing.id });
          return existing.id;
        }

        const newThreadId = `chat-${Date.now()}`;
        const newThread: ChatThread = {
          id: newThreadId,
          counterpartName,
          counterpartAvatar,
          counterpartTrustScore,
          isVerified: true,
          serviceCategory,
          contextTitle,
          contextSubtitle,
          contextStatus: 'Active Discussion',
          lastMessage: 'Chat opened with counterparty.',
          lastMessageTime: 'Just now',
          unreadCount: 0,
          messages: [
            {
              id: `sys-${Date.now()}`,
              senderId: 'system',
              text: `🛡️ SubShare Secure Room: You are chatting with ${counterpartName} (Trust Score ${counterpartTrustScore}/100). Never share passwords or private payment pins.`,
              timestamp: 'Just now',
              isMe: false,
              isSystem: true,
            },
          ],
        };

        set((state) => ({
          threads: [newThread, ...state.threads],
          activeThreadId: newThreadId,
        }));

        return newThreadId;
      },

      clearThreads: () => {
        set({ threads: [], activeThreadId: null });
      },

      loadDemoThreads: () => {
        set({ threads: mockChatThreads, activeThreadId: mockChatThreads[0]?.id || null });
      },
    }),
    {
      name: 'trustshare_chat_storage',
    }
  )
);
