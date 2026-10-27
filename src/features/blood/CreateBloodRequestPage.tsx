import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartHandshake, ArrowLeft, MapPin, Calendar, Phone, User, AlertTriangle, Loader2, Hospital } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useServiceStore } from '../../stores/serviceStore';

export const CreateBloodRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    blood_group: 'A+',
    units_needed: '2',
    hospital_name: '',
    hospital_location: '',
    contact_person: '',
    contact_phone: '',
    reason: 'Surgery',
    urgency: 'Normal',
    required_before: '',
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('SUBMIT START');

    if (!form.hospital_name.trim() || !form.contact_person.trim() || !form.contact_phone.trim()) {
      setError('Hospital name, contact person, and phone number are required.');
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
      const units = parseInt(form.units_needed) || 1;

      const payload = {
        user_id: session.user.id,
        blood_group: form.blood_group || 'A+',
        units_needed: units,
        hospital_name: form.hospital_name.trim(),
        hospital_location: form.hospital_location.trim() || null,
        city: form.hospital_location.trim() || null,
        contact_person: form.contact_person.trim(),
        contact_phone: form.contact_phone.trim(),
        contact_number: form.contact_phone.trim(),
        reason: form.reason || 'Surgery',
        urgency: form.urgency || 'Normal',
        required_before: form.required_before || null,
        status: 'active',
        available_slots: 1,
      };

      console.log('INSERT PAYLOAD:', payload);

      const { error } = await supabase
        .from('blood_requests')
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
          title: 'Emergency Blood SOS Published',
          message: `Your emergency request for ${form.blood_group || 'blood'} at ${form.hospital_name.trim()} is live!`,
          body: `Your emergency request for ${form.blood_group || 'blood'} at ${form.hospital_name.trim()} is live!`,
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

      alert('Blood request published successfully!');
      navigate('/services?tab=blood');
    } catch (err: any) {
      console.error('=== UNEXPECTED ERROR ===', err);
      setError(err.message || 'Failed to save blood request.');
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/services?tab=blood')} className="p-2 rounded-xl hover:bg-slate-800 transition">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-rose-400" />
          <h1 className="text-base font-bold text-white">Create Blood Request</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 pb-28 space-y-5 max-w-lg mx-auto">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-4 rounded-2xl">
            {error}
          </div>
        )}

        {/* Blood Group & Units */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Requirement Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Blood Group *</label>
              <select
                value={form.blood_group}
                onChange={(e) => set('blood_group', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition font-bold"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((grp) => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Units Needed (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.units_needed}
                onChange={(e) => set('units_needed', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 inline text-amber-400 mr-1" />
              Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Normal', 'Urgent', 'Critical'].map((urg) => (
                <button
                  type="button"
                  key={urg}
                  onClick={() => set('urgency', urg)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                    form.urgency === urg
                      ? urg === 'Critical'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : urg === 'Urgent'
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {urg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hospital & Location */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hospital & Location</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <Hospital className="w-3.5 h-3.5 inline text-rose-400 mr-1" />
              Hospital Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apollo Hospital"
              value={form.hospital_name}
              onChange={(e) => set('hospital_name', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <MapPin className="w-3.5 h-3.5 inline text-rose-400 mr-1" />
              Hospital Location (City / Area)
            </label>
            <input
              type="text"
              placeholder="e.g. Greams Road, Chennai"
              value={form.hospital_location}
              onChange={(e) => set('hospital_location', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <User className="w-3.5 h-3.5 inline text-slate-400 mr-1" />
                Contact Person *
              </label>
              <input
                type="text"
                required
                placeholder="Attender Name"
                value={form.contact_person}
                onChange={(e) => set('contact_person', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <Phone className="w-3.5 h-3.5 inline text-slate-400 mr-1" />
                Contact Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={form.contact_phone}
                onChange={(e) => set('contact_phone', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 text-sm"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Publishing Request…' : 'Submit Emergency Request'}
        </button>
      </form>
    </div>
  );
};
