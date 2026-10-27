import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, MapPin, Mail, Phone, User, MessageSquare, Eye } from 'lucide-react';
import { RequesterProfileModal } from './RequesterProfileModal';

interface RequestCardProps {
  request: any;
  onAccept: (request: any) => void;
  onReject: (request: any) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onReject,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const sender = request.sender || {};

  const score = sender.trust_score || 10;
  const badgeColor =
    score >= 70
      ? 'bg-[#DCFCE7] text-[#057642] border-[#057642]/20'
      : score >= 30
      ? 'bg-[#EAF3FB] text-[#0A66C2] border-[#0A66C2]/20'
      : 'bg-[#FEF3C7] text-[#915907] border-[#915907]/20';

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3.5 shadow-2xs font-sans">
        {/* Top Row: Avatar, Name, Trust Score */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src={sender.profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={sender.name || 'User'}
              className="w-14 h-14 rounded-full object-cover border border-gray-200"
            />
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                {sender.name || 'Peer Applicant'}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {sender.city || 'Local Area'}
              </p>
            </div>
          </div>

          <div className={`px-2.5 py-1 rounded-full border text-xs font-bold ${badgeColor}`}>
            ⭐ {score}/100
          </div>
        </div>

        {/* Verification Badges Row */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sender.email_verified ? 'bg-[#DCFCE7] text-[#057642]' : 'bg-gray-100 text-gray-400'}`}>
            <CheckCircle2 className="w-3 h-3" /> Email
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sender.phone_verified ? 'bg-[#DCFCE7] text-[#057642]' : 'bg-gray-100 text-gray-400'}`}>
            <CheckCircle2 className="w-3 h-3" /> Phone
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sender.verification_status === 'verified' ? 'bg-[#EAF3FB] text-[#0A66C2]' : 'bg-gray-100 text-gray-400'}`}>
            <ShieldCheck className="w-3 h-3" /> KYC
          </span>
        </div>

        {/* Request Details & Message */}
        <div className="bg-[#F3F2EF] dark:bg-slate-950 p-3 rounded-xs text-xs space-y-1 text-gray-800 dark:text-slate-200">
          <p className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider">
            Request for: <span className="text-gray-900 dark:text-white font-bold">{request.service_type?.toUpperCase()} Listing</span>
          </p>
          {request.message && (
            <p className="italic text-gray-700 dark:text-slate-300 mt-1">"{request.message}"</p>
          )}
        </div>

        {/* Contact Info Rules */}
        <div className="text-xs space-y-1 text-gray-600 dark:text-slate-400">
          {sender.show_contact ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#0A66C2] font-semibold"><Mail className="w-3.5 h-3.5" /> {sender.email}</span>
              {sender.phone && <span className="flex items-center gap-1 text-[#0A66C2] font-semibold"><Phone className="w-3.5 h-3.5" /> {sender.phone}</span>}
            </div>
          ) : sender.show_phone && sender.phone ? (
            <span className="flex items-center gap-1 text-[#0A66C2] font-semibold"><Phone className="w-3.5 h-3.5" /> {sender.phone}</span>
          ) : (
            <p className="text-[11px] text-gray-400">Contact details via chat on acceptance</p>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-1 gap-2 border-t border-[#E5E7EB] dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="text-xs text-[#0A66C2] font-semibold hover:underline flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" /> View Profile
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onReject(request)}
              className="px-3.5 py-1.5 rounded-full border border-[#CC1016] text-[#CC1016] font-semibold text-xs hover:bg-[#FEE2E2] transition"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onAccept(request)}
              className="px-4 py-1.5 rounded-full bg-[#057642] hover:bg-[#004182] text-white font-semibold text-xs transition shadow-2xs"
            >
              Accept
            </button>
          </div>
        </div>
      </div>

      {showProfile && (
        <RequesterProfileModal
          sender={sender}
          onClose={() => setShowProfile(false)}
          onAccept={() => onAccept(request)}
        />
      )}
    </>
  );
};
