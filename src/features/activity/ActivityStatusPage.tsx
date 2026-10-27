import React from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Car,
  HeartHandshake,
  Utensils,
  Share2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  Lock,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { Transaction, TransactionStatus } from '../../types';
import { TrustScoreBadge } from '../../components/ui/TrustScoreBadge';
import { StatusPill } from '../../components/ui/StatusPill';

export interface ActivityStatusPageProps {}

const TABS: { id: TransactionStatus; label: string }[] = [
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'HISTORY', label: 'History' },
];

const STEPS = [
  { label: 'Requested', sublabel: 'Request initiated' },
  { label: 'Escrow Active', sublabel: 'Payment reserved' },
  { label: 'Transferred', sublabel: 'Service in progress' },
  { label: 'Confirmed', sublabel: 'Receipt verified' },
  { label: 'Completed', sublabel: 'Escrow released' },
];

const SERVICE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  tickets: Ticket,
  rides: Car,
  blood: HeartHandshake,
  food: Utensils,
  subscriptions: Share2,
};

function TransactionCard({
  tx,
  onAdvance,
  onRelease,
}: Readonly<{
  tx: Transaction;
  onAdvance: (id: string) => void;
  onRelease: (id: string) => void;
}>) {
  const Icon = SERVICE_ICONS[tx.serviceCategory] || Shield;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-50">
        <div className="relative flex-shrink-0">
          <img src={tx.thumbnail} alt={tx.title} className="w-13 h-13 rounded-xl object-cover border border-slate-200" />
          <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
              tx.status === 'ACTIVE' ? 'bg-primary' : tx.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          >
            <Icon className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-sm truncate">{tx.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{tx.subtitle}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{tx.date}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {tx.amount > 0 ? (
            <>
              <div className="text-base font-black text-slate-900">₹{tx.amount.toLocaleString()}</div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                Escrow Active
              </span>
            </>
          ) : (
            <StatusPill status="Aid Exchange" variant="success" size="sm" />
          )}
        </div>
      </div>

      {/* Step tracker */}
      {tx.status !== 'HISTORY' && (
        <div className="px-4 py-3 bg-slate-50/50">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-200 z-0">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((tx.stateStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            {STEPS.map((step, i) => {
              const isCompleted = i + 1 <= tx.stateStep;
              const isCurrent = i + 1 === tx.stateStep;
              return (
                <div key={step.label} className="flex flex-col items-center z-10 relative">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-primary border-primary text-white'
                        : isCurrent
                        ? 'bg-white border-primary text-primary font-bold'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px]">{i + 1}</span>}
                  </div>
                  <div className="text-center mt-1 w-14">
                    <p className={`text-[9px] font-bold leading-tight ${isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transfer details notice */}
      {tx.transferDetails && (
        <div className="px-4 py-2.5 flex items-start gap-2 text-xs text-slate-600 bg-white border-t border-slate-50">
          <Lock className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          <span className="text-[11px] leading-snug font-medium">{tx.transferDetails}</span>
        </div>
      )}

      {/* Action buttons */}
      {tx.status === 'ACTIVE' && (
        <div className="px-4 py-3 flex gap-2 border-t border-slate-100 bg-white">
          <Link
            to="/chat"
            className="flex items-center gap-1.5 text-xs font-bold text-primary bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 hover:bg-blue-100 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </Link>

          {tx.stateStep < 4 ? (
            <button
              onClick={() => onAdvance(tx.id)}
              className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs shadow-blue-500/20 active:scale-[0.98] transition-transform"
            >
              Advance Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onRelease(tx.id)}
              className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs shadow-emerald-500/20 active:scale-[0.98] transition-transform"
            >
              ✓ Confirm Receipt & Release Funds
            </button>
          )}
        </div>
      )}

      {tx.status === 'COMPLETED' && (
        <div className="px-4 py-2.5 flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold border-t border-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Exchange finalized successfully. Trust score updated.</span>
        </div>
      )}

      {/* Counterparty footer */}
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <img src={tx.counterpartAvatar} alt={tx.counterpartName} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
          <span className="text-xs font-medium text-slate-700">{tx.counterpartName}</span>
          <TrustScoreBadge score={tx.counterpartTrustScore} size="sm" showLabel={false} />
        </div>
        {tx.securityCode && (
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5">
            {tx.securityCode}
          </span>
        )}
      </div>
    </div>
  );
}

export const ActivityStatusPage: React.FC<ActivityStatusPageProps> = () => {
  const { transactions, activeTab, setActiveTab, advanceTransactionStep, confirmPaymentRelease } = useTransactionStore();

  const filtered = transactions.filter((tx) => tx.status === activeTab);

  const tabCounts: Record<TransactionStatus, number> = {
    ACTIVE: transactions.filter((t) => t.status === 'ACTIVE').length,
    PENDING: transactions.filter((t) => t.status === 'PENDING').length,
    COMPLETED: transactions.filter((t) => t.status === 'COMPLETED').length,
    HISTORY: transactions.filter((t) => t.status === 'HISTORY').length,
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F6F8FB]">
      {/* Sticky Tab Bar */}
      <div className="sticky top-14 z-20 bg-white border-b border-slate-100 px-4 py-3 shadow-2xs">
        <h1 className="text-base font-bold text-slate-900 mb-2.5">Activity & Escrow Status</h1>
        <div className="flex gap-2">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
              {tabCounts[id] > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tabCounts[id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3 pb-24">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No {activeTab.toLowerCase()} transactions yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Transactions are created automatically when you book a carpool seat, claim tickets, or donate food.
            </p>
            <Link
              to="/services"
              className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
            >
              Explore Services <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          filtered.map((tx) => (
            <TransactionCard
              key={tx.id}
              tx={tx}
              onAdvance={advanceTransactionStep}
              onRelease={confirmPaymentRelease}
            />
          ))
        )}
      </div>
    </div>
  );
};
