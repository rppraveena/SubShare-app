import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { queryService } from '../../services/queryService';
import { supabase } from '../../lib/supabase';

export const QueryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [query, setQuery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('user_queries')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setQuery(data);
          setResponse(data.admin_response || '');
        }
        setLoading(false);
      });
  }, [id]);

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !response.trim()) return;

    setSubmitting(true);
    try {
      await queryService.respondToQuery(id, response.trim());
      navigate('/admin/queries');
    } catch (e: any) {
      alert(e.message || 'Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseQuery = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await queryService.closeQuery(id);
      navigate('/admin/queries');
    } catch (e: any) {
      alert(e.message || 'Failed to close query');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
        <p className="text-sm font-medium mt-3">Loading query details…</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-bold text-base">Query Not Found</h3>
        <button onClick={() => navigate('/admin/queries')} className="mt-3 px-4 py-2 bg-[#0A66C2] text-white font-bold text-xs rounded-full">
          Back to Queries
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans pb-28">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/queries')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">Query #{id ? id.substring(0, 8) : ''}</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto w-full space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 shadow-2xs text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] dark:border-slate-800">
            <span className="font-bold uppercase tracking-wider text-[#0A66C2] bg-[#EAF3FB] px-2 py-0.5 rounded-xs">
              {query.category}
            </span>
            <span className="font-bold uppercase text-gray-500">{query.status}</span>
          </div>

          <h2 className="font-bold text-sm text-gray-900 dark:text-white">{query.subject}</h2>

          <div className="space-y-1 text-gray-600 dark:text-slate-300">
            <p><strong>From:</strong> {query.user_name} ({query.user_email})</p>
            <p><strong>Submitted:</strong> {new Date(query.created_at || Date.now()).toLocaleString()}</p>
          </div>

          <div className="bg-[#F3F2EF] dark:bg-slate-950 p-3 rounded-xs space-y-1 text-gray-800 dark:text-slate-200">
            <strong className="block text-gray-500">Message:</strong>
            <p className="leading-relaxed">{query.message}</p>
          </div>

          {query.screenshot_url && (
            <div>
              <strong className="block text-gray-500 mb-1">Attached Screenshot:</strong>
              <img src={query.screenshot_url} alt="Screenshot" className="rounded-xs w-full max-h-52 object-cover border" />
            </div>
          )}
        </div>

        {/* Response Form */}
        <form onSubmit={handleSendResponse} className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 shadow-2xs">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">Admin Response</h3>
          <textarea
            rows={4}
            placeholder="Write your response to the user..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="w-full bg-[#F3F2EF] dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-sm p-3 text-xs outline-none text-gray-900 dark:text-white resize-none"
            required
          />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCloseQuery}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-full border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Mark Closed</span>
            </button>

            <button
              type="submit"
              disabled={submitting || !response.trim()}
              className="flex-1 py-2.5 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-2xs"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Response</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
