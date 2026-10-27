import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { supabase } from '../../lib/supabase';

export const ReportReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_id(name, email, trust_score),
        reported_user:profiles!reported_user_id(id, name, email, trust_score)
      `)
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setReport(data);
          setAdminNotes(data.admin_notes || '');
        }
        setLoading(false);
      });
  }, [id]);

  const handleAction = async (status: 'resolved' | 'dismissed', sendWarning = false) => {
    if (!id) return;
    setActionLoading(true);

    try {
      await reportService.updateReportStatus(id, status, adminNotes);

      if (sendWarning && report?.reported_user_id) {
        // Send Warning Notification
        try {
          await supabase.from('notifications').insert({
            user_id: report.reported_user_id,
            title: 'Community Guidelines Warning',
            body: 'A report filed against your activity was reviewed and validated. Please adhere to SubShare trust standards.',
            type: 'warning',
          });

          // Deduct 10 trust score points
          const currentScore = report.reported_user?.trust_score ?? 80;
          await supabase
            .from('profiles')
            .update({ trust_score: Math.max(5, currentScore - 10) })
            .eq('id', report.reported_user_id);
        } catch (e) {
          console.warn(e);
        }
      }

      navigate('/admin/reports');
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-sm font-medium mt-3">Loading report details…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-400 mb-2" />
        <h3 className="font-bold text-base">Report Not Found</h3>
        <button onClick={() => navigate('/admin/reports')} className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl">
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-24">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/reports')} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">Review Report #{id ? id.substring(0, 8) : ''}</h1>
        </div>
      </div>

      <div className="p-5 space-y-4 max-w-md mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Category
              </span>
              <h2 className="text-lg font-black">{report.category}</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 uppercase">
              {report.status}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p><strong>Reporter:</strong> {report.reporter?.name || report.reporter_id}</p>
            {report.reported_user && (
              <p><strong>Reported User:</strong> {report.reported_user.name} (Trust: {report.reported_user.trust_score}/100)</p>
            )}
            {report.service_type && <p><strong>Service:</strong> {report.service_type}</p>}
          </div>

          {report.description && (
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <strong className="block text-slate-500 mb-1">Description:</strong>
              <p className="italic">"{report.description}"</p>
            </div>
          )}

          {report.screenshot_url && (
            <div>
              <strong className="block text-xs text-slate-500 mb-1">Screenshot Evidence:</strong>
              <img src={report.screenshot_url} alt="Evidence" className="rounded-xl w-full max-h-52 object-cover border" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Moderator Notes & Action</h3>
          <textarea
            rows={3}
            placeholder="Enter moderator notes..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs outline-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAction('dismissed', false)}
              disabled={actionLoading}
              className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4 text-slate-500" />
              <span>Dismiss Report</span>
            </button>
            <button
              onClick={() => handleAction('resolved', true)}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Warn User (-10 Trust)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
