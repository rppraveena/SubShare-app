import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, ArrowLeft, MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useServiceStore } from '../../stores/serviceStore';

export const CreateFoodDonationPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    food_type: 'Cooked',
    is_vegetarian: true,
    meals_count: '10',
    cooked_time: '',
    pickup_deadline: '',
    pickup_location: '',
    description: '',
  });

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('SUBMIT START');

    if (!form.pickup_location.trim()) {
      setError('Pickup location is required.');
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
      const meals = parseInt(form.meals_count) || 10;

      const payload = {
        user_id: session.user.id,
        food_type: form.food_type || 'Cooked',
        is_vegetarian: form.is_vegetarian,
        meals_count: meals,
        cooked_time: form.cooked_time || new Date().toISOString(),
        pickup_deadline: form.pickup_deadline || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        pickup_location: form.pickup_location.trim(),
        description: form.description.trim() || null,
        status: 'active',
        available_slots: 1,
      };

      console.log('INSERT PAYLOAD:', payload);

      const { error } = await supabase
        .from('food_donations')
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
          title: 'Food Donation Published',
          message: `Your food donation for ${form.meals_count || '10'} meals is live!`,
          body: `Your food donation for ${form.meals_count || '10'} meals is live!`,
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

      alert('Food donation published successfully!');
      navigate('/services?tab=food');
    } catch (err: any) {
      console.error('=== UNEXPECTED ERROR ===', err);
      setError(err.message || 'Failed to save food donation.');
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/services?tab=food')} className="p-2 rounded-xl hover:bg-slate-800 transition">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-amber-400" />
          <h1 className="text-base font-bold text-white">Donate Food</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 pb-28 space-y-5 max-w-lg mx-auto">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-4 rounded-2xl">
            {error}
          </div>
        )}

        {/* Food Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Food Information</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Food Type</label>
              <select
                value={form.food_type}
                onChange={(e) => set('food_type', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              >
                <option value="Cooked">Cooked Meals</option>
                <option value="Packaged">Packaged Goods</option>
                <option value="Raw">Raw Ingredients / Produce</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Dietary Type</label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={() => set('is_vegetarian', true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    form.is_vegetarian ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Veg 🌱
                </button>
                <button
                  type="button"
                  onClick={() => set('is_vegetarian', false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    !form.is_vegetarian ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Non-Veg 🍗
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Number of Meals (Approx)</label>
            <input
              type="number"
              min="1"
              max="500"
              value={form.meals_count}
              onChange={(e) => set('meals_count', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition"
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pickup Location</h2>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <MapPin className="w-3.5 h-3.5 inline text-amber-400 mr-1" />
              Location / Address Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Koramangala 5th Block, Bangalore"
              value={form.pickup_location}
              onChange={(e) => set('pickup_location', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Freshly cooked rice and curry from party, packed in clean foil boxes"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition resize-none placeholder:text-slate-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 text-sm"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Publishing…' : 'Publish Food Donation'}
        </button>
      </form>
    </div>
  );
};
