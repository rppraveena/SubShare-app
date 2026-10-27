import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { queryService } from '../../services/queryService';

export const ContactAdminPage: React.FC = () => {
  const navigate = useNavigate();

  const [category, setCategory] = useState('General Question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedQueryId, setSubmittedQueryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both subject and message.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Message must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const q = await queryService.createQuery({
        category,
        subject: subject.trim(),
        message: message.trim(),
        screenshotFile: file || undefined,
      });

      setSubmittedQueryId(q.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit query.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedQueryId) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-gray-900 dark:text-slate-100 font-sans">
        <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 max-w-sm w-full text-center space-y-4 shadow-2xs">
          <CheckCircle2 className="w-12 h-12 text-[#057642] mx-auto" />
          <h2 className="font-bold text-lg">Query Submitted!</h2>
          <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
            Your query (Ref: #{submittedQueryId.substring(0, 8)}) has been sent to our administrator team. We will respond via email & in-app updates within 24 hours.
          </p>
          <div className="pt-2 space-y-2">
            <button
              onClick={() => navigate('/help/queries')}
              className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold py-3 rounded-full text-xs shadow-2xs"
            >
              View My Queries
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold py-3 rounded-full text-xs"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors font-sans pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">Contact Admin & Support</h1>
            <p className="text-[11px] text-gray-500">Send queries, feedback, or complaints</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/help/queries')}
          className="text-xs font-semibold text-[#0A66C2] hover:underline"
        >
          My Queries
        </button>
      </div>

      <div className="p-4 max-w-md mx-auto w-full space-y-4">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-5 space-y-4 shadow-2xs">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600 dark:text-slate-400">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#F3F2EF] dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-sm p-3 text-xs font-semibold outline-none text-gray-900 dark:text-white"
            >
              <option value="General Question">General Question</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Complaint">Complaint</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Payment Issue">Payment Issue</option>
              <option value="Account Issue">Account Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600 dark:text-slate-400">
              Subject *
            </label>
            <input
              type="text"
              placeholder="Brief summary of your query"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#F3F2EF] dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-sm p-3 text-xs outline-none text-gray-900 dark:text-white font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600 dark:text-slate-400">
              Message / Details *
            </label>
            <textarea
              rows={4}
              placeholder="Explain your query, feedback, or complaint in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#F3F2EF] dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-sm p-3 text-xs outline-none text-gray-900 dark:text-white resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600 dark:text-slate-400">
              Attach Screenshot (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#EAF3FB] file:text-[#0A66C2]"
            />
          </div>

          {error && (
            <div className="p-3 bg-[#FEE2E2] border border-[#CC1016]/20 text-[#CC1016] text-xs font-semibold rounded-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold py-3.5 rounded-full text-xs flex items-center justify-center gap-2 transition shadow-2xs"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{submitting ? 'Sending Query…' : 'Submit Query to Admin'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
