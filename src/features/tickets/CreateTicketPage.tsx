import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Ticket,
  Loader2,
  AlertCircle,
  CalendarDays,
  Clock,
  MapPin,
  Hash,
  DollarSign,
  Send,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useServiceStore } from '../../stores/serviceStore';

interface FormState {
  event_name: string;
  event_type: string;
  venue: string;
  event_date: string;
  event_time: string;
  seat_number: string;
  quantity: string;
  original_price: string;
  selling_price: string;
  transfer_method: string;
}

const INITIAL_FORM: FormState = {
  event_name: '',
  event_type: 'Concert',
  venue: '',
  event_date: '',
  event_time: '',
  seat_number: '',
  quantity: '1',
  original_price: '',
  selling_price: '',
  transfer_method: 'Email',
};

const EVENT_TYPES = ['Movie', 'Concert', 'Sports', 'College Event', 'Theater', 'Other'];
const TRANSFER_METHODS = ['Email', 'QR', 'In-Person'];

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('[TICKET SUBMIT 1] handler entered');

    if (!form.event_name.trim()) {
      console.warn('[TICKET SUBMIT VALIDATION FAILED] Event name is empty');
      setError('Event name is required.');
      return;
    }

    console.log('[TICKET SUBMIT 2] validation passed');

    console.log('[TICKET SUBMIT 3] getting session');

    const { data: { session }, error: sessionError } =
      await supabase.auth.getSession();

    console.log('[TICKET SUBMIT 4] session result', {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionError
    });

    if (!session) {
      console.error('[TICKET SUBMIT ERROR] No active session');
      setError('No active user session found. Please sign in again.');
      alert('Please sign in again.');
      return;
    }

    setSubmitting(true);

    try {
      const qty = parseInt(form.quantity) || 1;
      const origPrice = form.original_price ? parseFloat(form.original_price) : null;
      const sellPrice = form.selling_price ? parseFloat(form.selling_price) : null;

      const payload = {
        user_id: session.user.id,
        event_name: form.event_name.trim(),
        event_type: form.event_type || 'Concert',
        venue: form.venue.trim() || null,
        event_date: form.event_date || null,
        event_time: form.event_time || null,
        seat_number: form.seat_number.trim() || null,
        quantity: qty,
        original_price: origPrice,
        selling_price: sellPrice,
        transfer_method: form.transfer_method || 'Email',
        status: 'active',
        available_slots: qty,
      };

      console.log('[TICKET SUBMIT 5] payload', payload);

      console.log('[TICKET SUBMIT 6] starting INSERT');

      const { error: insertError } = await supabase
        .from('tickets')
        .insert(payload);

      console.log('[TICKET SUBMIT 7] INSERT RESULT', {
        error: insertError
      });

      if (insertError) {
        console.error('[TICKET SUBMIT ERROR] Supabase insert failed', insertError);
        setError(insertError.message || 'Insert failed');
        alert('Insert failed: ' + insertError.message);
        return;
      }

      console.log('[TICKET SUBMIT 8] INSERT SUCCESS');

      // TASK 4: Add notification insert on listing creation
      try {
        await supabase.from('notifications').insert({
          user_id: session.user.id,
          title: 'New Ticket Listing Published',
          message: `Your ticket listing '${form.event_name.trim()}' is live on SubShare!`,
          body: `Your ticket listing '${form.event_name.trim()}' is live on SubShare!`,
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

      alert('Ticket listing published successfully!');
      navigate('/services?tab=tickets');
    } catch (err: any) {
      console.error('[TICKET SUBMIT ERROR] Exception in handler:', err);
      setError(err.message || 'Failed to save ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/services?tab=tickets')}
          className="p-2 rounded-xl hover:bg-slate-800 transition text-slate-400 hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-400" />
          <h1 className="text-base font-bold text-white">Create Ticket Listing</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          {/* Event Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Event Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="ticket-event-name"
              type="text"
              required
              placeholder="e.g. Coldplay World Tour, IPL Final, IIIT Fest"
              value={form.event_name}
              onChange={(e) => set('event_name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition placeholder:text-slate-600"
            />
          </div>

          {/* Event Type + Quantity row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Event Type
              </label>
              <select
                id="ticket-event-type"
                value={form.event_type}
                onChange={(e) => set('event_type', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Quantity <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="ticket-quantity"
                  type="number"
                  min={1}
                  required
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Venue */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" /> Venue
            </label>
            <input
              id="ticket-venue"
              type="text"
              placeholder="e.g. M. A. Chidambaram Stadium, Chennai"
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition placeholder:text-slate-600"
            />
          </div>

          {/* Date + Time row (TASK 3: Native HTML5 Pickers) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-amber-400" /> Event Date
              </label>
              <input
                id="ticket-event-date"
                type="date"
                value={form.event_date}
                onChange={(e) => set('event_date', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Event Time
              </label>
              <input
                id="ticket-event-time"
                type="time"
                value={form.event_time}
                onChange={(e) => set('event_time', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition"
              />
            </div>
          </div>

          {/* Seat Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Seat / Section Number
            </label>
            <input
              id="ticket-seat-number"
              type="text"
              placeholder="e.g. A-12, Row 3 Seat 7, General Admission"
              value={form.seat_number}
              onChange={(e) => set('seat_number', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition placeholder:text-slate-600"
            />
          </div>

          {/* Prices row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Original Price (₹)
              </label>
              <input
                id="ticket-original-price"
                type="number"
                min={0}
                step="0.01"
                placeholder="1500"
                value={form.original_price}
                onChange={(e) => set('original_price', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Selling Price (₹)
              </label>
              <input
                id="ticket-selling-price"
                type="number"
                min={0}
                step="0.01"
                placeholder="1200"
                value={form.selling_price}
                onChange={(e) => set('selling_price', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200 rounded-xl px-4 py-3 text-sm outline-none transition placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Transfer Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Transfer Method
            </label>
            <div className="flex gap-2">
              {TRANSFER_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => set('transfer_method', method)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition ${
                    form.transfer_method === method
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="ticket-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-500/20 text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publish Listing
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
