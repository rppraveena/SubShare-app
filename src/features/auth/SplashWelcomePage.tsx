import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Ticket,
  Car,
  HeartHandshake,
  Utensils,
  Share2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface SplashWelcomePageProps {}

export const SplashWelcomePage: React.FC<SplashWelcomePageProps> = () => {
  const navigate = useNavigate();

  const services = [
    { icon: Ticket, label: 'Ticket Sharing', desc: 'Verified face-value event tickets' },
    { icon: Car, label: 'Ride Sharing', desc: 'Real-time GPS carpooling' },
    { icon: HeartHandshake, label: 'Blood Donation', desc: 'Emergency hospital SOS matching' },
    { icon: Utensils, label: 'Food Aid', desc: 'Surplus food for verified NGOs' },
    { icon: Share2, label: 'Subscriptions', desc: 'Shared family plan groups' },
  ];

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 flex flex-col max-w-md mx-auto relative font-sans transition-colors">
      {/* Brand Header */}
      <header className="pt-8 pb-4 px-6 text-center bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-[#0A66C2] text-white shadow-2xs mb-2">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">SubShare</h1>
        <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5 font-normal">
          Verified Peer-to-Peer Services & Community Network
        </p>
      </header>

      {/* Main Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-center">
        <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 mb-3 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0A66C2]" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              One Identity across 5 Services
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
            Exchange tickets, share rides, donate food, organize subscriptions, and request blood SOS with verified trust scores.
          </p>
        </div>

        {/* 5 Services List */}
        <div className="space-y-2">
          {services.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 rounded-sm border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
            >
              <div className="w-9 h-9 rounded-full bg-[#EAF3FB] dark:bg-blue-950/50 flex items-center justify-center text-[#0A66C2] dark:text-blue-400 flex-shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-xs">{label}</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth Action Buttons */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-[#E5E7EB] dark:border-slate-800 space-y-2.5">
        <button
          onClick={() => navigate('/auth?tab=signup')}
          className="w-full flex items-center justify-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold py-3 rounded-full transition-all text-sm"
        >
          <span>Join SubShare</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/auth?tab=signin')}
          className="w-full text-center text-xs text-[#0A66C2] font-semibold py-2.5 rounded-full border border-[#0A66C2] hover:bg-[#EAF3FB] transition-colors"
        >
          Already a member? Sign In
        </button>
      </div>
    </div>
  );
};
