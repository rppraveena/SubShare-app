import React, { useEffect } from 'react';
import { X, Lock } from 'lucide-react';

interface PrivacyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyDialog: React.FC<PrivacyDialogProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-modal-open="true"
      ref={(el) => {
        if (el) {
          const handler = () => onClose();
          el.addEventListener('closeModal', handler);
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Privacy Policy</h2>
              <p className="text-[11px] text-slate-500">Data Collection & Privacy Protection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">1. Information We Collect</h3>
            <p className="mb-1.5">To provide secure peer matching, SubShare collects:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Personal Profile:</strong> Full name, email address, mobile phone number, and profile photo.</li>
              <li><strong>Location Data:</strong> Approximate GPS coordinates and locality (only when enabled by you for nearby matching).</li>
              <li><strong>Exchange Information:</strong> Listings created, service requests, peer ratings, and exchange history.</li>
              <li><strong>Verification Records:</strong> Organization government documents, NGO certificates, or identity verification tokens.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">2. How Information Is Used</h3>
            <p className="mb-1.5">Your data is processed strictly for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>User authentication and account security.</li>
              <li>Proximity-based matching for rides, tickets, blood SOS, and food aid.</li>
              <li>Dynamic trust score calculation and safety monitoring.</li>
              <li>Real-time exchange notifications and coordination chat.</li>
              <li>Platform administration and fraud prevention.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">3. Data Protection & Storage</h3>
            <p>
              SubShare implements industry-standard encryption protocols and Row Level Security (RLS) on Supabase. We do not sell or monetize personal data to third parties.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">4. Your Privacy Controls</h3>
            <p>
              You can adjust locality sharing, notification preferences, and privacy controls at any time within your Profile Trust Center.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
