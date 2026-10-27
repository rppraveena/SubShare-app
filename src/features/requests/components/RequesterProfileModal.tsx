import React from 'react';
import { X, CheckCircle2, ShieldCheck, MapPin, Mail, Phone, Calendar, User as UserIcon } from 'lucide-react';

interface RequesterProfileModalProps {
  sender: any;
  onClose: () => void;
  onAccept?: () => void;
}

export const RequesterProfileModal: React.FC<RequesterProfileModalProps> = ({
  sender,
  onClose,
  onAccept,
}) => {
  if (!sender) return null;

  const score = sender.trust_score || 10;
  const tierColor =
    score >= 70
      ? 'bg-[#DCFCE7] text-[#057642] border-[#057642]/20'
      : score >= 30
      ? 'bg-[#EAF3FB] text-[#0A66C2] border-[#0A66C2]/20'
      : 'bg-[#FEF3C7] text-[#915907] border-[#915907]/20';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm max-w-sm w-full p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3 border-[#E5E7EB] dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Applicant Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <img
            src={sender.profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={sender.name || 'User'}
            className="w-14 h-14 rounded-full object-cover border"
          />
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">{sender.name || 'User'}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {sender.city || 'City Not Set'}
            </p>
            <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierColor}`}>
              Trust Score {score}/100
            </span>
          </div>
        </div>

        {/* Verification Badges */}
        <div className="space-y-1.5 bg-[#F3F2EF] dark:bg-slate-950 p-3 rounded-xs text-xs">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Verifications</h4>
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sender.email_verified ? 'bg-[#DCFCE7] text-[#057642]' : 'bg-gray-200 text-gray-500'}`}>
              <CheckCircle2 className="w-3 h-3" /> Email Verified
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sender.phone_verified ? 'bg-[#DCFCE7] text-[#057642]' : 'bg-gray-200 text-gray-500'}`}>
              <CheckCircle2 className="w-3 h-3" /> Phone Verified
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sender.verification_status === 'verified' ? 'bg-[#EAF3FB] text-[#0A66C2]' : 'bg-gray-200 text-gray-500'}`}>
              <ShieldCheck className="w-3 h-3" /> KYC Verified
            </span>
          </div>
        </div>

        {/* Contact info rules */}
        <div className="space-y-1.5 text-xs text-gray-700 dark:text-slate-300">
          {sender.show_contact ? (
            <>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0A66C2]" />
                <span className="font-semibold">{sender.email}</span>
              </p>
              {sender.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#0A66C2]" />
                  <span className="font-semibold">{sender.phone}</span>
                </p>
              )}
            </>
          ) : sender.show_phone && sender.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#0A66C2]" />
              <span className="font-semibold">{sender.phone}</span>
            </p>
          ) : (
            <p className="text-gray-500 italic">Contact info hidden by user settings (Chat available on acceptance)</p>
          )}
        </div>

        {sender.bio && (
          <div className="text-xs text-gray-600 dark:text-slate-400 bg-[#F3F2EF] dark:bg-slate-950 p-3 rounded-xs italic">
            "{sender.bio}"
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-xs"
          >
            Close
          </button>
          {onAccept && (
            <button
              onClick={() => {
                onClose();
                onAccept();
              }}
              className="flex-1 py-2.5 rounded-full bg-[#057642] hover:bg-[#004182] text-white font-semibold text-xs shadow-2xs"
            >
              Accept Applicant
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
