import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Loader2, RefreshCw, Mail } from 'lucide-react';
import { queryService } from '../../services/queryService';

export const AdminQueriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'responded' | 'closed'>('open');

  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      const list = await queryService.getAllQueries();
      setQueries(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  const filtered = queries.filter((q) => {
    if (filter === 'open') return q.status === 'open';
    if (filter === 'responded') return q.status === 'responded';
    if (filter === 'closed') return q.status === 'closed';
    return true;
  });

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors font-sans pb-28">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">User Support Queries</h1>
            <p className="text-[11px] text-gray-500">Respond to user tickets</p>
          </div>
        </div>

        <button onClick={loadQueries} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 pb-2">
        <div className="flex bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-1 rounded-full text-xs">
          <button
            onClick={() => setFilter('open')}
            className={`flex-1 py-2 rounded-full font-bold transition ${
              filter === 'open' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            Open ({queries.filter((q) => q.status === 'open').length})
          </button>
          <button
            onClick={() => setFilter('responded')}
            className={`flex-1 py-2 rounded-full font-bold transition ${
              filter === 'responded' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            Responded
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`flex-1 py-2 rounded-full font-bold transition ${
              filter === 'closed' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            Closed
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 rounded-full font-bold transition ${
              filter === 'all' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <p className="text-sm font-medium">Fetching support tickets…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-2 my-4">
            <HelpCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold">No Queries Found</h3>
          </div>
        )}

        {!loading &&
          filtered.map((q) => (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-2 shadow-2xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A66C2] bg-[#EAF3FB] px-2 py-0.5 rounded-xs">
                    {q.category}
                  </span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{q.subject}</p>
                  <p className="text-[11px] text-gray-500">From: {q.user_name} ({q.user_email})</p>
                </div>

                <button
                  onClick={() => navigate(`/admin/queries/${q.id}`)}
                  className="bg-[#0A66C2] text-white font-semibold text-xs px-3.5 py-1.5 rounded-full"
                >
                  View & Reply
                </button>
              </div>

              <p className="text-xs text-gray-600 dark:text-slate-300 bg-[#F3F2EF] dark:bg-slate-950 p-2.5 rounded-xs italic">
                "{q.message}"
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};
