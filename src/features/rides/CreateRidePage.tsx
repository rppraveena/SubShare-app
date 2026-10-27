import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowLeft, MapPin, Calendar, Clock, Users, IndianRupee, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useServiceStore } from '../../stores/serviceStore';

export const CreateRidePage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    pickup_location: '',
    destination: '',
    departure_date: '',
    departure_time: '',
    available_seats: '3',
    total_seats: '4',
    price_per_person: '',
    vehicle_type: 'Car',
    gender_preference: 'anyone',
    notes: '',
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('SUBMIT START');

    if (!form.pickup_location.trim() || !form.destination.trim()) {
      setError('Pickup location and destination are required.');
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
      const availSeats = parseInt(form.available_seats) || 3;
      const totSeats = parseInt(form.total_seats) || 4;
      const price = form.price_per_person ? parseFloat(form.price_per_person) : 0;

      const payload = {
        user_id: session.user.id,
        pickup_location: form.pickup_location.trim(),
        destination: form.destination.trim(),
        departure_date: form.departure_date || new Date().toISOString().split('T')[0],
        departure_time: form.departure_time || null,
        available_seats: availSeats,
        total_seats: totSeats,
        price_per_person: price,
        vehicle_type: form.vehicle_type || 'Car',
        gender_preference: form.gender_preference || 'anyone',
        status: 'active',
        available_slots: availSeats,
      };

      console.log('INSERT PAYLOAD:', payload);

      const { error } = await supabase
        .from('rides')
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
          title: 'New Ride Offer Published',
          message: `Your ride offer from ${form.pickup_location.trim()} to ${form.destination.trim()} is live!`,
          body: `Your ride offer from ${form.pickup_location.trim()} to ${form.destination.trim()} is live!`,
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

      alert('Ride offer published successfully!');
      navigate('/services?tab=rides');
    } catch (err: any) {
      console.error('=== UNEXPECTED ERROR ===', err);
      setError(err.message || 'Failed to save ride offer. Please try again.');
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/services?tab=rides')} className="p-2 rounded-xl hover:bg-slate-800 transition">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-violet-400" />
          <h1 className="text-base font-bold text-white">Offer a Ride</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 pb-28 space-y-5 max-w-lg mx-auto">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-4 rounded-2xl">
            {error}
          </div>
        )}

        {/* Route */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Route Details</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <MapPin className="w-3.5 h-3.5 inline text-violet-400 mr-1" />
              Pickup Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Andheri West, Mumbai"
              value={form.pickup_location}
              onChange={(e) => set('pickup_location', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <MapPin className="w-3.5 h-3.5 inline text-emerald-400 mr-1" />
              Destination *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BKC, Mumbai"
              value={form.destination}
              onChange={(e) => set('destination', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Date & Time (TASK 3: Native HTML5 Pickers) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Departure</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <Calendar className="w-3.5 h-3.5 inline text-amber-400 mr-1" />
                Date
              </label>
              <input
                type="date"
                value={form.departure_date}
                onChange={(e) => set('departure_date', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <Clock className="w-3.5 h-3.5 inline text-purple-400 mr-1" />
                Time
              </label>
              <input
                type="time"
                value={form.departure_time}
                onChange={(e) => set('departure_time', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Seats & Price */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Seats & Pricing</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <Users className="w-3.5 h-3.5 inline text-blue-400 mr-1" />
                Total
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={form.total_seats}
                onChange={(e) => set('total_seats', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Available</label>
              <input
                type="number"
                min="1"
                max="6"
                value={form.available_seats}
                onChange={(e) => set('available_seats', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <IndianRupee className="w-3.5 h-3.5 inline text-emerald-400 mr-0.5" />
                / Person
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.price_per_person}
                onChange={(e) => set('price_per_person', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Vehicle & Preferences */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferences</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Vehicle Type</label>
              <select
                value={form.vehicle_type}
                onChange={(e) => set('vehicle_type', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              >
                <option>Car</option>
                <option>Bike</option>
                <option>Auto</option>
                <option>SUV</option>
                <option>Van</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Gender Pref.</label>
              <select
                value={form.gender_preference}
                onChange={(e) => set('gender_preference', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              >
                <option value="anyone">Anyone</option>
                <option value="women_only">Women Only</option>
                <option value="women_preferred">Women Preferred</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 text-sm"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Publishing…' : 'Publish Ride Offer'}
        </button>
      </form>
    </div>
  );
};
