import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, UserCheck, ShieldAlert, RefreshCw, UserX } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'individual' | 'organization' | 'admin'>('all');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'individual') return u.account_type === 'individual' && !u.is_admin;
    if (filter === 'organization') return u.account_type === 'organization';
    if (filter === 'admin') return u.is_admin === true;
    return true;
  });

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors pb-28">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">User Management</h1>
            <p className="text-[11px] text-gray-500">Directory & account moderation</p>
          </div>
        </div>

        <button onClick={loadUsers} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 pl-9 pr-3 py-2.5 rounded-full text-xs outline-none"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-1 rounded-full text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-full font-bold transition ${
              filter === 'all' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setFilter('individual')}
            className={`flex-1 py-1.5 rounded-full font-bold transition ${
              filter === 'individual' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            Individuals
          </button>
          <button
            onClick={() => setFilter('organization')}
            className={`flex-1 py-1.5 rounded-full font-bold transition ${
              filter === 'organization' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            Orgs
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`flex-1 py-1.5 rounded-full font-bold transition ${
              filter === 'admin' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 dark:text-slate-400'
            }`}
          >
            Admins
          </button>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <p className="text-xs font-bold">Loading user directory…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center text-xs text-gray-500">
            No matching profiles found.
          </div>
        )}

        {!loading &&
          filtered.map((u) => (
            <div
              key={u.id}
              className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={u.profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt={u.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{u.name || 'User'}</span>
                    {u.is_admin ? (
                      <span className="text-[10px] font-bold bg-[#FEE2E2] text-[#CC1016] px-2 py-0.5 rounded-full uppercase">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-[#EAF3FB] text-[#0A66C2] px-2 py-0.5 rounded-full uppercase">
                        {u.account_type || 'Individual'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  <p className="text-[11px] text-[#0A66C2] font-semibold mt-0.5">Trust Score: {u.trust_score || 10}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/admin/users/${u.id}`)}
                className="bg-[#0A66C2] text-white text-xs font-semibold px-3.5 py-2 rounded-full flex-shrink-0"
              >
                Inspect →
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};
