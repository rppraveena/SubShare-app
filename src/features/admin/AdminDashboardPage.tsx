import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  Users,
  Lock,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Building2,
  Flag,
  Layers,
  ArrowRight,
  HelpCircle,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useServiceStore } from '../../stores/serviceStore';
import { supabase } from '../../lib/supabase';

type AdminTab = 'overview' | 'pending_orgs' | 'reports' | 'all_listings';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { loginAdmin, logout } = useAuthStore();

  const tickets = useServiceStore((s) => s.tickets);
  const rides = useServiceStore((s) => s.rides);
  const bloodRequests = useServiceStore((s) => s.bloodRequests);
  const foodDonations = useServiceStore((s) => s.foodDonations);
  const subscriptions = useServiceStore((s) => s.subscriptions);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orgs, setOrgs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Dedicated Admin Authentication Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const isAdmin = user?.role === 'admin' || user?.is_admin === true;

  const loadAdminMetrics = useCallback(async () => {
    setLoading(true);
    try {
      console.log('=== ADMIN DASHBOARD DEBUG ===');

      // 1. Session check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('1. Session:', session ? 'exists' : 'null');
      console.log('   Session user:', session?.user?.email);
      console.log('   Session error:', sessionError);

      // 2. User check
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('2. User ID:', currentUser?.id);
      console.log('   User email:', currentUser?.email);

      // 3. Profile check
      if (currentUser?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin, account_type')
          .eq('id', currentUser.id)
          .maybeSingle();

        console.log('3. Profile:', profile);
        console.log('   Profile error:', profileError);
      }

      // 4. Query orgs directly
      const { data: orgData, error: orgsError, count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      console.log('4. Pending orgs raw:', orgData);
      console.log('   Orgs count:', count);
      console.log('   Orgs error:', orgsError);
      console.log('=== END DEBUG ===');

      if (!orgsError && orgData) {
        setOrgs(orgData);
      }

      // Fetch Reports
      const { data: repData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      setReports(repData || []);

      // Count Total Users
      const { count: uCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      setTotalUsers(uCount || 0);
    } catch (err) {
      console.error('Error loading admin metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      if (!cancelled) {
        loadAdminMetrics();
      }
    }, 300);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !cancelled) {
        loadAdminMetrics();
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [loadAdminMetrics]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(adminEmail, adminPassword);
    if (success) {
      setLoginError('');
      loadAdminMetrics();
    } else {
      setLoginError('Invalid administrator credentials or unauthorized role.');
    }
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm(
      'Sign out of the admin account? You will need to log in again.'
    );
    if (!confirmed) return;

    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out failed:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex flex-col justify-center items-center p-5 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-6 shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto text-[#CC1016]">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white">Access Denied: Admin Console</h1>
          <p className="text-xs text-gray-600 dark:text-slate-400 text-center leading-relaxed">
            Restricted strictly to accounts with administrator status.
          </p>

          <form onSubmit={handleAdminLogin} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@subshare.app"
                className="w-full h-11 px-3 bg-[#F3F2EF] dark:bg-slate-950 border border-[#E5E7EB] dark:border-slate-800 rounded-sm text-xs text-gray-900 dark:text-white outline-none focus:border-[#0A66C2]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 px-3 bg-[#F3F2EF] dark:bg-slate-950 border border-[#E5E7EB] dark:border-slate-800 rounded-sm text-xs text-gray-900 dark:text-white outline-none focus:border-[#0A66C2]"
              />
            </div>

            {loginError && <p className="text-xs text-[#CC1016] font-medium">{loginError}</p>}

            <button
              type="submit"
              className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold py-3 rounded-full text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Shield className="w-4 h-4" />
              Authenticate as Administrator
            </button>
          </form>

          <div className="pt-2 flex justify-between items-center text-xs border-t border-[#E5E7EB] dark:border-slate-800">
            <Link to="/home" className="text-[#0A66C2] hover:underline font-semibold flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingOrgs = orgs.filter((o) => (o.verification_status || 'pending') === 'pending');
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const totalListings = tickets.length + rides.length + bloodRequests.length + foodDonations.length + subscriptions.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors pb-24">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] dark:border-slate-800 sticky top-0 z-30 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/home" className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#0A66C2] flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">SubShare Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAdminMetrics} className="text-xs text-[#0A66C2] font-semibold hover:underline flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#CC1016] hover:bg-[#FEE2E2] rounded-full transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-5 flex flex-col gap-4">
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <p className="text-xs font-bold">Loading admin metrics…</p>
          </div>
        )}

        {!loading && (
          <>
            {/* 1. Metrics Grid (4 cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-4 rounded-sm shadow-2xs">
                <div className="flex items-center justify-between text-[#0A66C2]">
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-bold bg-[#EAF3FB] px-2 py-0.5 rounded-full">Users</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalUsers}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Registered Profiles</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-4 rounded-sm shadow-2xs">
                <div className="flex items-center justify-between text-[#057642]">
                  <Layers className="w-5 h-5" />
                  <span className="text-xs font-bold bg-[#DCFCE7] px-2 py-0.5 rounded-full">Listings</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalListings}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Active Items</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-4 rounded-sm shadow-2xs">
                <div className="flex items-center justify-between text-[#915907]">
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs font-bold bg-[#FEF3C7] px-2 py-0.5 rounded-full">Pending</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{pendingOrgs.length}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Org Verifications</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-4 rounded-sm shadow-2xs">
                <div className="flex items-center justify-between text-[#CC1016]">
                  <Flag className="w-5 h-5" />
                  <span className="text-xs font-bold bg-[#FEE2E2] px-2 py-0.5 rounded-full">Reports</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{pendingReports.length}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Open Tickets</p>
              </div>
            </div>

            {/* 2. Admin Quick Actions with Badge Counters */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Moderation Quick Actions</h2>

              <div className="space-y-2">
                <div
                  onClick={() => navigate('/admin/orgs')}
                  className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:border-[#CFE4F7] p-4 rounded-sm flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#915907]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">Review Pending Organizations</h3>
                      <p className="text-xs text-gray-500">NGO & Orphanage registration queue</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {pendingOrgs.length > 0 && (
                      <span className="bg-[#915907] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {pendingOrgs.length} pending
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div
                  onClick={() => navigate('/admin/users')}
                  className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:border-[#CFE4F7] p-4 rounded-sm flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#057642]">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">Manage Users & Accounts</h3>
                      <p className="text-xs text-gray-500">View user directory, trust scores, & suspensions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div
                  onClick={() => navigate('/admin/reports')}
                  className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:border-[#CFE4F7] p-4 rounded-sm flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#CC1016]">
                      <Flag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">Review User & Listing Reports</h3>
                      <p className="text-xs text-gray-500">Fraud, harassment, & safety reports</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {pendingReports.length > 0 && (
                      <span className="bg-[#CC1016] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {pendingReports.length} open
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div
                  onClick={() => navigate('/admin/queries')}
                  className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:border-[#CFE4F7] p-4 rounded-sm flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAF3FB] flex items-center justify-center text-[#0A66C2]">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">User Support & Queries</h3>
                      <p className="text-xs text-gray-500">Respond to user feedback & help tickets</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Pending Queue Detail View */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Organization Verification Queue ({pendingOrgs.length})
              </h2>

              {pendingOrgs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#057642] mx-auto" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">All Organization Verifications Cleared</p>
                </div>
              ) : (
                pendingOrgs.map((org) => (
                  <div key={org.id} className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 flex items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-base truncate">{org.name}</span>
                        <span className="text-[10px] font-bold bg-[#FEF3C7] text-[#915907] px-2 py-0.5 rounded-full uppercase">
                          Pending
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Type: {org.type} • Reg: {org.registration_number || 'N/A'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Registration Date: {org.registration_date || 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/org/${org.id}`)}
                      className="bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-xs px-4 py-2.5 rounded-full transition-colors flex-shrink-0 shadow-2xs"
                    >
                      Review Application →
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
