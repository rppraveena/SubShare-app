import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  Plus,
  Search,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { subscriptionsService } from '../../services/subscriptionsService';

export const SubscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subscriptionsService.getAllGroups();
      setGroups(data || []);
    } catch (err: any) {
      console.error('Error fetching subscription groups:', err);
      setError(err.message || 'Failed to load subscription groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (g.service_name && g.service_name.toLowerCase().includes(q)) ||
      (g.plan_type && g.plan_type.toLowerCase().includes(q)) ||
      (g.city && g.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col min-h-full bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Subscription Sharing</h1>
            <p className="text-[11px] text-slate-400">Split plan costs safely</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/subscriptions/create')}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 pb-24 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service name (Netflix, Spotify...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm font-medium">Fetching subscription groups…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-rose-300">{error}</p>
            <button
              onClick={loadGroups}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredGroups.length === 0 && (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 text-center space-y-4 my-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto">
              <Share2 className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Subscription Groups Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'No open groups match your search.'
                  : 'Start a group for Netflix, Spotify, or Youtube Premium and split the monthly cost!'}
              </p>
            </div>
            <button
              onClick={() => navigate('/subscriptions/create')}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Start Subscription Group</span>
            </button>
          </div>
        )}

        {/* Groups List */}
        {!loading && !error && filteredGroups.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Open Groups ({filteredGroups.length})
              </span>
              <button onClick={loadGroups} className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {filteredGroups.map((g) => {
              const maxM = g.max_members || 4;
              const currM = g.current_members || 1;
              const pct = Math.min(100, Math.round((currM / maxM) * 100));

              return (
                <div
                  key={g.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm">
                        {g.service_name?.substring(0, 2).toUpperCase() || 'SUB'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{g.service_name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{g.plan_type || 'Shared Plan'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-black text-base flex items-center justify-end">
                        <IndianRupee className="w-4 h-4" />
                        {g.monthly_share}
                        <span className="text-xs text-slate-400 font-normal">/mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Member Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        Members Filled
                      </span>
                      <span className="text-white">
                        {currM} / {maxM} slots
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {g.city && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{g.city}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/subscriptions/create')}
        className="fixed bottom-20 right-4 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-600/40 active:scale-95 transition"
        title="Share Subscription"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
