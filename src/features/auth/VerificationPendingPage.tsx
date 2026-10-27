import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, FileCheck, CheckCircle2, ArrowRight, Building2, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const VerificationPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const orgDetails = user?.organizationDetails;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        {/* Status Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        {/* Title */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Verification Pending
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Organization Under Review
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Thank you for registering <strong className="text-slate-800">{orgDetails?.name || 'your organization'}</strong> on SubShare. Our compliance team is verifying your registration credentials.
          </p>
        </div>

        {/* Submission Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">{orgDetails?.name || 'Organization'}</p>
              <p className="text-[11px] text-slate-500">
                Type: {orgDetails?.type || 'NGO'} • Reg: {orgDetails?.regNumber || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Registration Certificate Uploaded</p>
              <p className="text-[11px] text-slate-500">{orgDetails?.documentUrl || 'Registration_Doc.pdf'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Estimated Review Time</p>
              <p className="text-[11px] text-slate-500">24 – 48 Hours</p>
            </div>
          </div>
        </div>

        {/* Email Notification Alert */}
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium flex items-center gap-2 text-left">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>You will receive an email confirmation once your organization badge is issued.</span>
        </div>

        {/* Action Button */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            <span>Go to Home (Limited Access)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="mailto:support@subshare.app"
            className="text-xs text-slate-500 hover:text-slate-700 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Need urgent verification support? Contact Trust Team
          </a>
        </div>
      </div>
    </div>
  );
};
