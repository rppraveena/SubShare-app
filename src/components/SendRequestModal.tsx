import React, { useState, useEffect } from 'react';
import { Send, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestsService } from '../services/requestsService';
import { useAuthStore } from '../stores/authStore';

interface SendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  serviceType: string; // 'tickets' | 'rides' | 'blood' | 'food' | 'subscriptions'
  listingId: string;
  listingTitle: string;
  onRequestSent?: () => void;
}

export const SendRequestModal: React.FC<SendRequestModalProps> = ({
  isOpen,
  onClose,
  receiverId,
  serviceType,
  listingId,
  listingTitle,
  onRequestSent,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUser?.id && currentUser.id === receiverId;

  useEffect(() => {
    if (isOpen && listingId && serviceType) {
      requestsService.checkPendingRequest(listingId, serviceType).then(setPending);
    }
  }, [isOpen, listingId, serviceType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOwner) return;

    setSubmitting(true);
    setError(null);

    try {
      await requestsService.createRequest({
        receiver_id: receiverId,
        service_type: serviceType,
        listing_id: listingId,
        message: message.trim() || undefined,
      });

      setSuccess(true);
      setPending(true);
      if (onRequestSent) onRequestSent();
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Send Request</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isOwner ? (
          <div className="p-4 bg-slate-800/50 rounded-2xl text-center space-y-1">
            <p className="text-sm font-bold text-amber-400">Your Listing</p>
            <p className="text-xs text-slate-400">You are the owner of this listing.</p>
          </div>
        ) : success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="font-bold text-white text-base">Request Sent!</p>
            <p className="text-xs text-slate-400">The listing owner will review your request.</p>
          </div>
        ) : pending ? (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center space-y-1">
            <p className="text-sm font-bold text-blue-400">Request Pending</p>
            <p className="text-xs text-slate-400">You already have a pending request for this listing.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs text-slate-400">Requesting item / service:</p>
              <p className="text-sm font-bold text-white mt-0.5">{listingTitle}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Message to Owner (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Hi, I am interested in this listing..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl p-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{submitting ? 'Sending…' : 'Send Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
