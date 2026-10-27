import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Loader2, RefreshCw, MessageSquare } from 'lucide-react';
import { queryService } from '../../services/queryService';

export const MyQueriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      const list = await queryService.getMyQueries();
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

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors font-sans pb-28">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">My Support Queries</h1>
            <p className="text-[11px] text-gray-500">Track your queries to admin</p>
          </div>
        </div>

        <button onClick={loadQueries} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <p className="text-sm font-medium">Fetching support tickets…</p>
          </div>
        )}

        {!loading && queries.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-3 my-4">
            <HelpCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold">No Submitted Queries</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              You haven't submitted any support queries yet. Need help?
            </p>
            <button
              onClick={() => navigate('/help/contact')}
              className="bg-[#0A66C2] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xs"
            >
              Submit a Query
            </button>
          </div>
        )}

        {!loading &&
          queries.map((q) => (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A66C2] bg-[#EAF3FB] px-2 py-0.5 rounded-xs">
                  {q.category}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    q.status === 'responded'
                      ? 'bg-[#DCFCE7] text-[#057642]'
                      : q.status === 'closed'
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-[#FEF3C7] text-[#915907]'
                  }`}
                >
                  {q.status || 'Open'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-gray-900 dark:text-white">{q.subject}</h3>
              <p className="text-xs text-gray-600 dark:text-slate-300 bg-[#F3F2EF] dark:bg-slate-950 p-3 rounded-xs italic">
                "{q.message}"
              </p>

              {q.admin_response && (
                <div className="bg-[#EAF3FB] border border-[#CFE4F7] p-3 rounded-xs text-xs space-y-1 mt-2 text-[#004182]">
                  <strong className="block font-bold">Admin Response:</strong>
                  <p>{q.admin_response}</p>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
