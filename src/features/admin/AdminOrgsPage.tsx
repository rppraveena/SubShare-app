import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Search, Loader2, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminOrgsPage: React.FC = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [search, setSearch] = useState('');

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`*, owner:profiles!user_id(name, email, trust_score)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrgs(data || []);
    } catch (e) {
      console.error('Error loading orgs for admin:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const filtered = orgs.filter((o) => {
    const matchesSearch =
      (o.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.type || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.owner?.email || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const status = o.verification_status || 'pending';
    if (filter === 'pending') return status === 'pending';
    if (filter === 'verified') return status === 'verified';
    if (filter === 'rejected') return status === 'rejected';
    return true;
  });

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors pb-28">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">Organization Directory</h1>
            <p className="text-[11px] text-gray-500">Review, verify & manage NGO accounts</p>
          </div>
        </div>

        <button onClick={loadOrgs} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by org name, type, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 pl-9 pr-3 py-2.5 rounded-full text-xs outline-none"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-1 rounded-full text-xs">
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 py-1.5 rounded-full font-bold transition ${
              filter === 'pending' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            Pending ({orgs.filter((o) => (o.verification_status || 'pending') === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`flex-1 py-1.5 rounded-full font-bold transition ${
              filter === 'verified' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            Verified ({orgs.filter((o) => o.verification_status === 'verified').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`flex-1 py-1.5 rounded-full font-bold transition ${
              filter === 'rejected' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            Rejected ({orgs.filter((o) => o.verification_status === 'rejected').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-full font-bold transition ${
              filter === 'all' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            All
          </button>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <p className="text-xs font-bold">Loading organization list…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center text-xs text-gray-500">
            No matching organizations found.
          </div>
        )}

        {!loading &&
          filtered.map((o) => (
            <div
              key={o.id}
              className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white text-base truncate">{o.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      o.verification_status === 'verified'
                        ? 'bg-[#DCFCE7] text-[#057642]'
                        : o.verification_status === 'rejected'
                        ? 'bg-[#FEE2E2] text-[#CC1016]'
                        : 'bg-[#FEF3C7] text-[#915907]'
                    }`}
                  >
                    {o.verification_status || 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Type: {o.type} • Reg: {o.registration_number || 'N/A'}
                </p>
                <p className="text-[11px] text-gray-400">
                  Owner: {o.owner?.name || 'N/A'} ({o.owner?.email})
                </p>
              </div>

              <button
                onClick={() => navigate(`/admin/org/${o.id}`)}
                className="bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-xs px-4 py-2 rounded-full transition flex-shrink-0 shadow-2xs"
              >
                Review →
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};
