import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Inbox, Loader2, RefreshCw, Filter, CheckCircle2, ShieldCheck } from 'lucide-react';
import { requestsService } from '../../services/requestsService';
import { RequestCard } from './components/RequestCard';

export const OwnerRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listingIdFilter = searchParams.get('listingId') || undefined;

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByTrust, setSortByTrust] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [highTrustOnly, setHighTrustOnly] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const list = await requestsService.getOwnerPendingRequests(listingIdFilter);
      setRequests(list || []);
    } catch (e) {
      console.error('Error loading owner pending requests:', e);
    } finally {
      setLoading(false);
    }
  }, [listingIdFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAcceptRequest = async (request: any) => {
    const confirmed = window.confirm(
      `Accept request from ${request.sender?.name || 'Applicant'}?\n\nAll other pending requests for this listing will be automatically rejected.`
    );
    if (!confirmed) return;

    try {
      const res = await requestsService.acceptRequestWithAutoReject(
        request.id,
        request.listing_id,
        request.service_type || 'tickets'
      );

      alert(`Request accepted! Chat room opened.`);
      if (res.roomId) {
        navigate(`/chat/${res.roomId}`);
      } else {
        navigate('/chat');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept request.');
    }
  };

  const handleRejectRequest = async (request: any) => {
    const confirmed = window.confirm(`Reject request from ${request.sender?.name || 'Applicant'}?`);
    if (!confirmed) return;

    try {
      await requestsService.rejectRequest(request.id);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err: any) {
      alert(err.message || 'Failed to reject request.');
    }
  };

  const processedRequests = requests
    .filter((r) => {
      const sender = r.sender || {};
      if (verifiedOnly && sender.verification_status !== 'verified') return false;
      if (highTrustOnly && (sender.trust_score || 10) < 70) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortByTrust) {
        return (b.sender?.trust_score || 10) - (a.sender?.trust_score || 10);
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">Manage Applicant Requests</h1>
            <p className="text-[11px] text-gray-500">Review, inspect trust scores & accept applicants</p>
          </div>
        </div>

        <button onClick={loadRequests} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div className="p-4 pb-2 space-y-2">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-2 rounded-sm text-xs">
          <button
            onClick={() => setSortByTrust(!sortByTrust)}
            className={`px-3 py-1.5 rounded-full font-semibold transition ${
              sortByTrust ? 'bg-[#0A66C2] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {sortByTrust ? 'Sorted: Highest Trust Score' : 'Sorted: Newest First'}
          </button>

          <div className="flex gap-1.5">
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition ${
                verifiedOnly ? 'bg-[#DCFCE7] text-[#057642] border-[#057642]/30' : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              Verified Only
            </button>

            <button
              onClick={() => setHighTrustOnly(!highTrustOnly)}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition ${
                highTrustOnly ? 'bg-[#EAF3FB] text-[#0A66C2] border-[#0A66C2]/30' : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              Score &gt; 70
            </button>
          </div>
        </div>
      </div>

      {/* Requests Feed */}
      <div className="p-4 space-y-3 flex-1 max-w-md mx-auto w-full">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <p className="text-xs font-bold">Loading applicant requests…</p>
          </div>
        )}

        {!loading && processedRequests.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-2 my-4 shadow-2xs">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Pending Applicant Requests</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              When peers send requests to join your listings, they will appear here sorted by trust score.
            </p>
          </div>
        )}

        {!loading &&
          processedRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
            />
          ))}
      </div>
    </div>
  );
};
