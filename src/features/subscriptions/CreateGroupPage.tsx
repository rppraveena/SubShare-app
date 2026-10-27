import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, ArrowLeft, Users, IndianRupee, Calendar, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useServiceStore } from '../../stores/serviceStore';

export const CreateGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    service_name: 'Netflix',
    plan_type: 'Family Plan',
    max_members: '4',
    monthly_share: '199',
    billing_cycle: 'Monthly',
    next_billing_date: '',
    city: '',
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('SUBMIT START');

    if (!form.service_name.trim() || !form.monthly_share.trim()) {
      setError('Service name and monthly share price are required.');
      return;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('SESSION:', session);

    if (!session) {
      alert('Please sign in again.');
      return;
    }

    setSubmitting(true);

    try {
      const maxMembers = parseInt(form.max_members) || 4;
      const sharePrice = parseFloat(form.monthly_share) || 0;
      const availSlots = Math.max(1, maxMembers - 1);

      const payload = {
        owner_id: session.user.id, // NOTE: owner_id not user_id
        service_name: form.service_name.trim(),
        plan_type: form.plan_type.trim() || null,
        description: form.plan_type.trim() || null,
        max_members: maxMembers,
        total_slots: maxMembers,
        current_members: 1,
        monthly_share: sharePrice,
        price_per_slot: sharePrice,
        billing_cycle: form.billing_cycle || 'Monthly',
        next_billing_date: form.next_billing_date || null,
        city: form.city.trim() || null,
        is_private: true,
        status: 'active',
        available_slots: availSlots,
      };

      console.log('INSERT PAYLOAD:', payload);

      const { error } = await supabase
        .from('subscription_groups')
        .insert(payload);

      console.log('INSERT ERROR:', error);

      if (error) {
        console.error('INSERT FAILED:', error);
        alert(error.message);
        return;
      }

      console.log('INSERT SUCCESS');

      // TASK 4: Insert notification after listing creation
      try {
        await supabase.from('notifications').insert({
          user_id: session.user.id,
          title: 'Subscription Group Created',
          message: `Your subscription group for '${form.service_name.trim()}' is live!`,
          body: `Your subscription group for '${form.service_name.trim()}' is live!`,
          type: 'info',
        });
      } catch (notifErr) {
        console.warn('Failed to insert notification:', notifErr);
      }

      try {
        await useServiceStore.getState().fetchFromSupabase();
      } catch (syncErr) {
        console.warn('Sync error:', syncErr);
      }

      alert('Subscription group published successfully!');
      navigate('/services?tab=subscriptions');
    } catch (err: any) {
      console.error('=== UNEXPECTED ERROR ===', err);
      setError(err.message || 'Failed to save subscription group.');
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/services?tab=subscriptions')} className="p-2 rounded-xl hover:bg-slate-800 transition">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-400" />
          <h1 className="text-base font-bold text-white">Share a Subscription</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 pb-28 space-y-5 max-w-lg mx-auto">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-4 rounded-2xl">
            {error}
          </div>
        )}

        {/* Service Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Info</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Service Name *</label>
            <select
              value={form.service_name}
              onChange={(e) => set('service_name', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition font-bold"
            >
              <option value="Netflix">Netflix</option>
              <option value="Spotify">Spotify</option>
              <option value="YouTube Premium">YouTube Premium</option>
              <option value="Canva">Canva</option>
              <option value="Microsoft 365">Microsoft 365</option>
              <option value="Prime Video">Prime Video</option>
              <option value="Disney+ Hotstar">Disney+ Hotstar</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Plan Type / Description</label>
            <input
              type="text"
              placeholder="e.g. Family 4K Plan, Duo Plan, Premium 5-screen"
              value={form.plan_type}
              onChange={(e) => set('plan_type', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Slots & Pricing */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Members & Cost</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <Users className="w-3.5 h-3.5 inline text-blue-400 mr-1" />
                Max Members (2-6)
              </label>
              <input
                type="number"
                min="2"
                max="6"
                value={form.max_members}
                onChange={(e) => set('max_members', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <IndianRupee className="w-3.5 h-3.5 inline text-emerald-400 mr-0.5" />
                Monthly Share (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="199"
                value={form.monthly_share}
                onChange={(e) => set('monthly_share', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Date & Time (TASK 3: Native HTML5 Pickers) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Billing Cycle</label>
              <select
                value={form.billing_cycle}
                onChange={(e) => set('billing_cycle', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <Calendar className="w-3.5 h-3.5 inline text-slate-400 mr-1" />
                Next Renewal Date
              </label>
              <input
                type="date"
                value={form.next_billing_date}
                onChange={(e) => set('next_billing_date', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <MapPin className="w-3.5 h-3.5 inline text-emerald-400 mr-1" />
              City (Optional Location)
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-sm"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Creating Group…' : 'Create Subscription Group'}
        </button>
      </form>
    </div>
  );
};
