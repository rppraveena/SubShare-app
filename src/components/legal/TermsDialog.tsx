import React, { useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface TermsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsDialog: React.FC<TermsDialogProps> = ({ isOpen, onClose }) => {
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
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Terms of Service</h2>
              <p className="text-[11px] text-slate-500">SubShare Platform Guidelines & Agreement</p>
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
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">1. Acceptable Use of SubShare</h3>
            <p>
              SubShare is a verified peer-to-peer sharing and mutual aid platform. Users must interact with integrity, respect community members, and use services solely for lawful, non-commercial peer exchanges.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">2. Accurate Information</h3>
            <p>
              Users must provide true, accurate, and current information during registration, verification, and listing creation. Impersonation or submitting fraudulent details is strictly prohibited.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">3. Responsibility for Listings & Requests</h3>
            <p>
              Users are solely responsible for all listings, carpools, ticket transfers, donations, or subscription groups they create. You confirm you hold the legal right to transfer or share items offered.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">4. Prohibited Conduct & Fraud</h3>
            <p>
              Fraud, deceptive practices, scalping above face value, fake emergencies, and unauthorized transactions are strictly banned. Violations trigger automatic trust score penalties and immediate account termination.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">5. Third-Party Provider Compliance</h3>
            <p>
              Ticket, ride, and subscription sharing must adhere to respective third-party service rules and terms. SubShare facilitates coordination but does not control external service providers.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">6. Account Suspension & Safety</h3>
            <p>
              SubShare reserves the right to suspend, restrict, or terminate any account found violating platform terms, compromising community safety, or exhibiting abusive behavior.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">7. Credentials & Privacy Protection</h3>
            <p>
              Do not share passwords, payment credentials, or sensitive authentication codes. SubShare will never ask for your account password.
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
