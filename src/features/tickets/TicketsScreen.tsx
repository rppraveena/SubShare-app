import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Search, Calendar, MapPin, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getAllTickets, getTicketsByUser, createTicket, mapDbTicketToTicketListing, TicketRow } from '../../services/ticketsService';
import { TicketListing } from '../../types';

export interface TicketsScreenProps {
  filterMode?: 'available' | 'mine';
}

export const TicketsScreen: React.FC<TicketsScreenProps> = ({ filterMode = 'available' }) => {
  const user = useAuthStore((s) => s.user);
  const [tickets, setTickets] = useState<TicketListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    event_name: '',
    event_type: 'movie',
    venue: '',
    event_date: '',
    event_time: '',
    seat_number: '',
    quantity: '1',
    original_price: '',
    selling_price: '',
    transfer_method: 'Digital Transfer',
    proof_image_url: '',
  });

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      let rawData: any[] = [];
      if (filterMode === 'mine' && user?.id) {
        rawData = await getTicketsByUser(user.id);
      } else {
        rawData = await getAllTickets();
      }
      const mapped = rawData.map(mapDbTicketToTicketListing);
      setTickets(mapped);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Failed to fetch tickets from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterMode, user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be signed in to create a ticket listing.');
      return;
    }
    if (!formData.event_name || !formData.venue || !formData.selling_price) {
      setError('Please fill in all required fields (Event Name, Venue, Selling Price).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ticketPayload: Omit<TicketRow, 'id' | 'created_at'> = {
        user_id: user.id,
        event_name: formData.event_name,
        event_type: formData.event_type,
        venue: formData.venue,
        event_date: formData.event_date || new Date().toISOString().split('T')[0],
        event_time: formData.event_time || '18:00',
        seat_number: formData.seat_number || 'Gen Adm',
        quantity: parseInt(formData.quantity) || 1,
        original_price: parseFloat(formData.original_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        transfer_method: formData.transfer_method,
        proof_image_url: formData.proof_image_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
        status: 'active',
      };

      await createTicket(ticketPayload);
      setActionSuccess('Ticket listing published successfully!');
      setShowCreateModal(false);
      setFormData({
        event_name: '',
        event_type: 'movie',
        venue: '',
        event_date: '',
        event_time: '',
        seat_number: '',
        quantity: '1',
        original_price: '',
        selling_price: '',
        transfer_method: 'Digital Transfer',
        proof_image_url: '',
      });
      await fetchTickets();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      setError(err.message || 'Failed to create ticket listing in Supabase');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by title or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Ticket Listing
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
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          <p className="text-xs">Fetching active ticket listings from Supabase...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Ticket className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {filterMode === 'mine' ? 'No Tickets Listed Yet' : 'No Tickets Available'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {filterMode === 'mine'
              ? 'You have not listed any tickets for sale or transfer.'
              : 'There are currently no active ticket listings matching your query.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            Create First Listing
          </button>
        </div>
      ) : (
        /* Ticket Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition group flex flex-col"
            >
              <div className="relative h-40 overflow-hidden bg-slate-950">
                <img
                  src={ticket.image}
                  alt={ticket.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  ₹{ticket.sellingPrice}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1.5 line-clamp-1">{ticket.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{ticket.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{ticket.date || 'Date TBD'} • {ticket.time || 'Time TBD'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Qty: <strong className="text-slate-200">{ticket.quantity}</strong></span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-semibold uppercase">
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-500" />
                New Ticket Listing
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
                <label className="block text-slate-300 mb-1 font-medium">Event Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cold Play Concert, IPL Match"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Event Type</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="movie">Movie</option>
                    <option value="concert">Concert</option>
                    <option value="cricket">Cricket</option>
                    <option value="theater">Theater</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Venue / Stadium *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M. A. Chidambaram Stadium"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Original Price (₹)</label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1200"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Event Date</label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Event Time</label>
                  <input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
