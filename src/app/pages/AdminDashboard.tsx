import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  ShieldAlert,
  Users,
  Layers,
  FileCheck,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  Car,
  HeartHandshake,
  Utensils,
  Share2,
} from 'lucide-react';

interface ProfileRecord {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  account_type?: string;
  verification_status?: string;
  is_admin?: boolean;
  created_at?: string;
}

interface OrgVerificationRecord {
  id: string;
  user_id: string;
  name: string;
  type: string;
  registration_number: string;
  contact_person?: string;
  official_email?: string;
  city?: string;
  verification_status: string;
  created_at?: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'organizations' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [organizations, setOrganizations] = useState<OrgVerificationRecord[]>([]);
  const [counts, setCounts] = useState({
    users: 0,
    tickets: 0,
    rides: 0,
    blood: 0,
    food: 0,
    subscriptions: 0,
    pendingOrgs: 0,
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load real data from Supabase
  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      // 1. Fetch profiles
      const { data: profs } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profs) setProfiles(profs);

      // 2. Fetch organizations
      const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgs) setOrganizations(orgs);

      // 3. Counts from each service table
      const [
        { count: ticketCount },
        { count: rideCount },
        { count: bloodCount },
        { count: foodCount },
        { count: subCount },
      ] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('rides').select('*', { count: 'exact', head: true }),
        supabase.from('blood_requests').select('*', { count: 'exact', head: true }),
        supabase.from('food_donations').select('*', { count: 'exact', head: true }),
        supabase.from('subscription_groups').select('*', { count: 'exact', head: true }),
      ]);

      const pendingOrgCount = (orgs || []).filter(
        (o) => o.verification_status === 'pending'
      ).length;

      setCounts({
        users: profs?.length || 0,
        tickets: ticketCount || 0,
        rides: rideCount || 0,
        blood: bloodCount || 0,
        food: foodCount || 0,
        subscriptions: subCount || 0,
        pendingOrgs: pendingOrgCount,
      });
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateOrgStatus = async (orgId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ verification_status: status })
        .eq('id', orgId);

      if (error) throw error;

      // Update corresponding user profile verification_status
      const targetOrg = organizations.find((o) => o.id === orgId);
      if (targetOrg?.user_id) {
        await supabase
          .from('profiles')
          .update({ verification_status: status })
          .eq('id', targetOrg.user_id);
      }

      setFeedbackMessage(`Organization status updated to "${status}".`);
      setTimeout(() => setFeedbackMessage(null), 3000);
      loadAdminData();
    } catch (err: any) {
      console.error('Error updating organization status:', err);
      setFeedbackMessage(`Failed to update status: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-4xl mx-auto shadow-2xl border-x border-slate-800">
      {/* Admin Header */}
      <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Return to App"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white tracking-tight">Admin Console</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-400">Authenticated as {user?.email || 'Administrator'}</p>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/60 border-b border-slate-800 px-5 gap-2 overflow-x-auto py-2.5">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'users', label: `Users (${counts.users})`, icon: Users },
          { id: 'organizations', label: `Org Queue (${counts.pendingOrgs})`, icon: FileCheck },
          { id: 'reports', label: 'Reports & Safety', icon: AlertTriangle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {feedbackMessage && (
        <div className="m-4 p-3 bg-blue-900/40 border border-blue-500/40 rounded-xl text-blue-200 text-xs font-semibold">
          {feedbackMessage}
        </div>
      )}

      {/* Content Area */}
      <div className="p-5 flex-1 overflow-y-auto">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
                Listings Overview by Service
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Tickets', count: counts.tickets, icon: Ticket, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Carpool Rides', count: counts.rides, icon: Car, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                  { label: 'Blood Requests', count: counts.blood, icon: HeartHandshake, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  { label: 'Food Donations', count: counts.food, icon: Utensils, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Subscriptions', count: counts.subscriptions, icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Total Users', count: counts.users, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                ].map(({ label, count, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-white">{count}</div>
                      <div className="text-xs text-slate-400 font-medium">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  Organization Verifications
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  {counts.pendingOrgs} organization{counts.pendingOrgs === 1 ? '' : 's'} awaiting document verification.
                </p>
                <button
                  onClick={() => setActiveTab('organizations')}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  Review Verification Queue →
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Registered Profiles
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  {counts.users} verified & unverified user account{counts.users === 1 ? '' : 's'} registered in Supabase.
                </p>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  View Users List →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* USERS LIST TAB */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
              Profiles Table ({profiles.length})
            </h2>
            {profiles.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl text-slate-400 text-xs">
                No user profiles recorded in Supabase yet.
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{p.name || 'Unnamed User'}</span>
                        {p.is_admin && (
                          <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                            Admin
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-800 text-slate-400 rounded capitalize">
                          {p.account_type || 'individual'}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5 truncate flex items-center gap-2 text-[11px]">
                        <span>{p.email || 'No email'}</span>
                        {p.city && <span>• {p.city}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11px] font-bold ${p.verification_status === 'verified' ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {p.verification_status || 'unverified'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORGANIZATIONS QUEUE TAB */}
        {activeTab === 'organizations' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
              Organization Verification Queue
            </h2>
            {organizations.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl text-slate-400 text-xs">
                No organization verification submissions recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {organizations.map((org) => (
                  <div key={org.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          {org.type || 'NGO'}
                        </span>
                        <h3 className="font-bold text-white text-sm mt-1">{org.name}</h3>
                        <p className="text-xs text-slate-400">Reg #: {org.registration_number}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        org.verification_status === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : org.verification_status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {org.verification_status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 grid grid-cols-2 gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Contact Person:</span>
                        <span className="font-medium">{org.contact_person || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Official Email:</span>
                        <span className="font-medium truncate block">{org.official_email || 'N/A'}</span>
                      </div>
                    </div>

                    {org.verification_status === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateOrgStatus(org.id, 'verified')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Organization
                        </button>
                        <button
                          onClick={() => handleUpdateOrgStatus(org.id, 'rejected')}
                          className="flex-1 bg-rose-600/80 hover:bg-rose-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REPORTS & SAFETY TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
              Platform Safety & Escalations
            </h2>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-2">
              <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="font-bold text-white text-sm">No Active Fraud Alerts</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All P2P handovers and donations are operating normally. Escalated service requests or disputed escrows will appear here for administrative resolution.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
