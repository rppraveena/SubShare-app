import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { reportService } from '../../services/reportService';

export const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'dismissed'>('pending');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getAllReports();
      setReports(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filtered = reports.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'resolved') return r.status === 'resolved';
    if (activeTab === 'dismissed') return r.status === 'dismissed';
    return true;
  });

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">Admin Moderation Queue</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Review safety reports</p>
          </div>
        </div>

        <button onClick={loadReports} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 pb-2">
        <div className="flex bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'pending' ? 'bg-white dark:bg-rose-600 text-rose-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Pending ({reports.filter((r) => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'resolved' ? 'bg-white dark:bg-rose-600 text-rose-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setActiveTab('dismissed')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'dismissed' ? 'bg-white dark:bg-rose-600 text-rose-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Dismissed
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 pb-24 space-y-3">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <p className="text-sm font-medium">Fetching reports…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 my-4">
            <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold">No Reports in Queue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              All reported listings and users for this status have been handled.
            </p>
          </div>
        )}

        {!loading &&
          filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Category: {r.category}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Reporter: <strong>{r.reporter?.name || 'Anonymous'}</strong>
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/admin/reports/${r.id}`)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Review Ticket
                </button>
              </div>

              {r.description && (
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl italic">
                  "{r.description}"
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
