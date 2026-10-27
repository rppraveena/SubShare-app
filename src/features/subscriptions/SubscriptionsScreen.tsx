import React, { useState, useEffect } from 'react';
import { Share2, Plus, Search, Users, Shield, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getAllGroups, getUserGroups, createSubscriptionGroup, joinGroup, mapDbSubToSubscriptionGroup, SubscriptionGroupRow } from '../../services/subscriptionsService';
import { SubscriptionGroup } from '../../types';

export interface SubscriptionsScreenProps {
  filterMode?: 'available' | 'mine';
}

export const SubscriptionsScreen: React.FC<SubscriptionsScreenProps> = ({ filterMode = 'available' }) => {
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<SubscriptionGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    service_name: 'Spotify Family',
    plan_type: 'Family Plan 6 Slots',
    max_members: '6',
    monthly_share: '50',
    billing_cycle: 'monthly',
  });

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      let rawData: any[] = [];
      if (filterMode === 'mine' && user?.id) {
        rawData = await getUserGroups(user.id);
      } else {
        rawData = await getAllGroups();
      }
      const mapped = rawData.map(mapDbSubToSubscriptionGroup);
      setGroups(mapped);
    } catch (err: any) {
      console.error('Error fetching subscription groups:', err);
      setError(err.message || 'Failed to fetch subscription groups from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [filterMode, user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be signed in to create a subscription group.');
      return;
    }
    if (!formData.service_name || !formData.monthly_share) {
      setError('Please fill in required fields (Service Name, Monthly Share).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const groupPayload: Omit<SubscriptionGroupRow, 'id' | 'created_at'> = {
        owner_id: user.id,
        service_name: formData.service_name,
        plan_type: formData.plan_type,
        max_members: parseInt(formData.max_members) || 4,
        current_members: 1,
        monthly_share: parseFloat(formData.monthly_share) || 50,
        billing_cycle: formData.billing_cycle,
        status: 'active',
      };

      await createSubscriptionGroup(groupPayload);
      setActionSuccess('Subscription group created successfully!');
      setShowCreateModal(false);
      setFormData({
        service_name: 'Spotify Family',
        plan_type: 'Family Plan 6 Slots',
        max_members: '6',
        monthly_share: '50',
        billing_cycle: 'monthly',
      });
      await fetchGroups();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error creating subscription group:', err);
      setError(err.message || 'Failed to create subscription group in Supabase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user?.id) {
      setError('You must be signed in to join a group.');
      return;
    }

    try {
      await joinGroup(groupId, user.id);
      setActionSuccess('Join request sent to group owner!');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error joining group:', err);
      setError(err.message || 'Failed to submit join request');
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscriptions (Spotify, Netflix, etc)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-purple-500"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Sub Group
        </button>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
          <p className="text-xs">Fetching subscription groups from Supabase...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
            <Share2 className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {filterMode === 'mine' ? 'No Subscription Groups Owned' : 'No Subscription Groups Available'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {filterMode === 'mine'
              ? 'You have not created any subscription sharing groups.'
              : 'There are currently no active subscription groups available.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            Create First Group
          </button>
        </div>
      ) : (
        /* Groups Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                      {group.serviceName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{group.serviceName}</h4>
                      <p className="text-[10px] text-slate-400">{group.description}</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold text-xs">
                    ₹{group.monthlyShare}/mo
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Slots: <strong className="text-slate-200">{group.occupiedSlots}/{group.totalSlots}</strong></span>
                </div>
                {filterMode !== 'mine' && group.ownerId !== user?.id && (
                  <button
                    onClick={() => handleJoinGroup(group.id)}
                    className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold transition"
                  >
                    Join Group
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-500" />
                Create Subscription Group
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spotify Family, Netflix Premium, ChatGPT Plus"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Plan Type / Description</label>
                <input
                  type="text"
                  placeholder="e.g. 4K Ultra HD Premium Plan"
                  value={formData.plan_type}
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Max Members *</label>
                  <input
                    type="number"
                    min="2"
                    required
                    value={formData.max_members}
                    onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Monthly Share (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.monthly_share}
                    onChange={(e) => setFormData({ ...formData, monthly_share: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
