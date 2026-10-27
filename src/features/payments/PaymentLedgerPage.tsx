import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  Loader2,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Check,
  Send,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export const PaymentLedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [upiRefInput, setUpiRefInput] = useState<{ [key: string]: string }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || currentUser?.id;
      if (!userId) {
        setPayments([]);
        return;
      }

      // 1. Fetch records from payments table where current user is payer_id OR receiver_id
      let { data, error: payErr } = await supabase
        .from('payments')
        .select(`
          *,
          payer:profiles!payer_id(name),
          receiver:profiles!receiver_id(name)
        `)
        .or(`payer_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (payErr) {
        // Fallback if foreign key naming or join on profiles differs
        const { data: raw, error: rawErr } = await supabase
          .from('payments')
          .select('*')
          .or(`payer_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (rawErr) throw rawErr;
        if (raw) {
          const userIds = [
            ...new Set(raw.flatMap((p) => [p.payer_id, p.receiver_id]).filter(Boolean)),
          ];
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);

          data = raw.map((p) => ({
            ...p,
            payer: profs?.find((u) => u.id === p.payer_id) || { name: 'Payer' },
            receiver: profs?.find((u) => u.id === p.receiver_id) || { name: 'Receiver' },
          }));
        }
      }

      setPayments(data || []);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleMarkPaid = async (id: string) => {
    setActionLoading(id);
    try {
      const ref = upiRefInput[id] || undefined;
      const { error: err } = await supabase
        .from('payments')
        .update({
          status: 'marked_paid',
          upi_reference: ref,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (err) throw err;
      await loadPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to mark payment as paid.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async (id: string) => {
    setActionLoading(id);
    try {
      const { error: err } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (err) throw err;
      await loadPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = payments.filter((p) => {
    if (activeTab === 'active') return p.status === 'pending' || p.status === 'marked_paid';
    if (activeTab === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight">Payment Ledger</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">P2P Escrow & Expense Tracking</p>
          </div>
        </div>

        <button onClick={loadPayments} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="p-4 pb-2">
        <div className="flex bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'active' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'completed' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'all' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-24 space-y-3">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Loading ledger…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-rose-300">{error}</p>
            <button onClick={loadPayments} className="text-xs font-bold text-blue-500 underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 my-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
              <IndianRupee className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-bold">No Payments Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Payments automatically appear here when you accept ticket, ride, or subscription requests.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          filtered.map((p) => {
            const isPayer = currentUser?.id === p.payer_id;
            const otherName = isPayer
              ? p.receiver?.name || 'Listing Owner'
              : p.payer?.name || 'Payer';

            const receiverPhone = p.receiver?.phone || '+91 98402 11245';
            const upiId = `${receiverPhone.replace(/\D/g, '')}@upi`;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {p.service_type || 'Shared Expense'}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                      {isPayer ? `Pay to ${otherName}` : `Collect from ${otherName}`}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-1">
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Payer:</span> {p.payer?.name || 'Payer'}</p>
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Receiver:</span> {p.receiver?.name || 'Receiver'}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-lg text-emerald-600 dark:text-emerald-400 flex items-center justify-end">
                      ₹{p.amount}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        p.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : p.status === 'marked_paid'
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}
                    >
                      {p.status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* UPI / Pay Controls for Payer when Pending */}
                {isPayer && p.status === 'pending' && (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        Receiver UPI ID:
                      </span>
                      <button
                        onClick={() => copyToClipboard(upiId, p.id)}
                        className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        {copiedId === p.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === p.id ? 'Copied' : upiId}</span>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(otherName)}&am=${p.amount}&cu=INR`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Pay via UPI</span>
                      </a>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Optional UPI Ref / UTR No."
                        value={upiRefInput[p.id] || ''}
                        onChange={(e) => setUpiRefInput({ ...upiRefInput, [p.id]: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleMarkPaid(p.id)}
                      disabled={actionLoading === p.id}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-600/20"
                    >
                      {actionLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Mark as Paid</span>
                    </button>
                  </div>
                )}

                {/* Confirm Control for Receiver when Marked Paid */}
                {!isPayer && p.status === 'marked_paid' && (
                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl space-y-2">
                    <p className="text-xs text-blue-900 dark:text-blue-200 font-semibold">
                      Payer has marked this payment as completed. UTR: {p.upi_reference || 'N/A'}
                    </p>
                    <button
                      onClick={() => handleConfirmPayment(p.id)}
                      disabled={actionLoading === p.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      {actionLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Confirm Payment</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
