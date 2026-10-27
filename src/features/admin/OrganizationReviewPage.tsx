import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  User,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const OrganizationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [org, setOrg] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    const loadOrgDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: orgData, error: orgErr } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();

        if (orgErr) throw orgErr;
        setOrg(orgData);

        if (orgData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', orgData.user_id)
            .single();
          setOwner(profileData);
        }
      } catch (err) {
        console.error('Error fetching org for review:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrgDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!org?.id || submitting) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateErr } = await supabase
        .from('organizations')
        .update({
          verification_status: 'verified',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', org.id);

      if (updateErr) throw updateErr;

      // Also update profiles table
      if (org.user_id) {
        await supabase
          .from('profiles')
          .update({
            verification_status: 'verified',
            updated_at: new Date().toISOString(),
          })
          .eq('id', org.user_id);

        // Insert notification record into notifications table
        await supabase.from('notifications').insert({
          user_id: org.user_id,
          title: 'Organization Approved',
          body: `Congratulations! ${org.name} has been verified as an official organization.`,
          type: 'verification',
          related_id: org.id,
        });
      }

      alert(`Approved ${org.name}!`);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      alert(err.message || 'Approval failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!org?.id || !rejectionReason.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateErr } = await supabase
        .from('organizations')
        .update({
          verification_status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', org.id);

      if (updateErr) throw updateErr;

      // Also update profiles table
      if (org.user_id) {
        await supabase
          .from('profiles')
          .update({
            verification_status: 'rejected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', org.user_id);

        // Insert notification
        await supabase.from('notifications').insert({
          user_id: org.user_id,
          title: 'Organization Verification Rejected',
          body: `Your organization application for ${org.name} was rejected: ${rejectionReason.trim()}`,
          type: 'verification',
          related_id: org.id,
        });
      }

      alert(`Rejected ${org.name}.`);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    } finally {
      setSubmitting(false);
      setShowRejectDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
        <h2 className="text-lg font-bold">Organization Record Not Found</h2>
        <button onClick={() => navigate('/admin')} className="mt-4 text-xs font-bold text-blue-400">
          ← Return to Admin Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Review Organization Application</h1>
          <p className="text-[11px] text-slate-400">Verify documents and registration credentials</p>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Organization Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{org.name}</h2>
              <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                {org.type}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Registration Number</span>
              <span className="font-mono text-white font-bold">{org.registration_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Registration Date</span>
              <span className="text-white">{org.registration_date || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Contact Person</span>
              <span className="text-white">{org.contact_person || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Official Phone</span>
              <span className="text-white">{org.official_phone || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Official Email</span>
              <span className="text-white">{org.official_email || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Address & City</span>
              <span className="text-white">{org.address ? `${org.address}, ${org.city}` : org.city || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Owner Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            Applicant User Account
          </h3>
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-white text-sm">{owner?.name || 'Owner Name'}</p>
              <p className="text-slate-400">{owner?.email}</p>
            </div>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              Trust: {owner?.trust_score ?? 10}/100
            </span>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Uploaded Governance Documents
          </h3>

          <div className="space-y-2 text-xs">
            {org.certificate_url ? (
              <a
                href={org.certificate_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-blue-400 transition"
              >
                <span>Registration Certificate.pdf</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <p className="text-slate-500 italic text-xs">No registration certificate uploaded.</p>
            )}

            {org.government_doc_url ? (
              <a
                href={org.government_doc_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-blue-400 transition"
              >
                <span>Government ID / Tax Document.pdf</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <p className="text-slate-500 italic text-xs">No government document uploaded.</p>
            )}
          </div>
        </div>

        {/* Notes & Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Admin Review Notes</label>
          <textarea
            rows={2}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Internal admin notes regarding verification check..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowRejectDialog(true)}
            disabled={submitting}
            className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-400 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Application</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={submitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Approve & Verify Org</span>
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Rejection Reason</h3>
            <p className="text-xs text-slate-400">Specify why this organization application is being rejected.</p>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Registration number does not match official government database records."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || submitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
