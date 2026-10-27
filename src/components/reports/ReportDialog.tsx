import React, { useState } from 'react';
import { ShieldAlert, X, Loader2, CheckCircle2, Upload, AlertCircle } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useAuthStore } from '../../stores/authStore';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId?: string;
  reportedListingId?: string;
  reportedMessageId?: string;
  serviceType?: string;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedListingId,
  reportedMessageId,
  serviceType,
}) => {
  const user = useAuthStore((s) => s.user);

  const [category, setCategory] = useState('Fraud');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be signed in to submit a report.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let screenshotUrl = undefined;
      if (file) {
        try {
          screenshotUrl = await reportService.uploadScreenshot(file);
        } catch (fErr) {
          console.warn('Screenshot upload skipped:', fErr);
        }
      }

      await reportService.createReport({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reported_listing_id: reportedListingId,
        reported_message_id: reportedMessageId,
        service_type: serviceType,
        category,
        description: description.trim() || undefined,
        screenshot_url: screenshotUrl,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        setFile(null);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h3 className="font-bold text-base">Submit Report</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-lg">Report Submitted</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Our moderation team will review this report and take required action. Thank you!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-400">
                Reason / Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-2xl px-3 py-3 text-sm font-semibold outline-none"
              >
                <option value="Fraud">Fraud / Scam</option>
                <option value="Fake listing">Fake Listing</option>
                <option value="Harassment">Harassment / Abusive Behavior</option>
                <option value="Spam">Spam / Unwanted Messages</option>
                <option value="No-show">No-show / Cancellation Abuse</option>
                <option value="Wrong information">Wrong / Misleading Information</option>
                <option value="Safety concern">Safety Concern</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-400">
                Description & Evidence
              </label>
              <textarea
                rows={3}
                placeholder="Explain what happened in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-2xl p-3 text-sm outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-400">
                Attach Screenshot (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-2xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Submitting…' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
