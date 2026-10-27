import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Plus,
  Search,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  Tag,
  Users,
} from 'lucide-react';
import { ticketsService, mapDbTicketToTicketListing } from '../../services/ticketsService';
import { TicketListing } from '../../types';

export const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await ticketsService.getAllTickets();
      setTickets(raw.map(mapDbTicketToTicketListing));
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      setError('Failed to load tickets. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.venue.toLowerCase().includes(q) ||
      t.eventType.toLowerCase().includes(q)
    );
  });

  const EVENT_EMOJI: Record<string, string> = {
    movie: '🎬',
    concert: '🎵',
    cricket: '🏏',
    sports: '⚽',
    theater: '🎭',
    'college event': '🎓',
    other: '🎟️',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-400" />
            <h1 className="text-base font-bold text-white">Tickets</h1>
            {!loading && !error && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold">
                {filtered.length}
              </span>
            )}
          </div>
          <button
            id="tickets-my-listings-btn"
            onClick={() => navigate('/tickets/mine')}
            className="text-xs text-slate-400 hover:text-blue-400 font-medium transition"
          >
            My Listings
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            id="tickets-search"
            type="text"
            placeholder="Search tickets, events, venues…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none transition placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="px-4 py-4 pb-28">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">Loading tickets from Supabase…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm text-rose-300 font-medium mb-3">{error}</p>
            <button
              onClick={fetchTickets}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-4 py-2 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <Ticket className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {search ? 'No matching tickets' : 'No tickets available yet. Be the first to post one!'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-5">
              {search
                ? 'Try a different search term.'
                : 'Have spare movie, cricket, or concert passes? List them at face value for verified peers.'}
            </p>
            {!search && (
              <button
                id="tickets-empty-create-btn"
                onClick={() => navigate('/tickets/create')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                Create Listing
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all group flex flex-col cursor-pointer"
                onClick={() => navigate(`/services/${ticket.id}`)}
              >
                {/* Thumbnail */}
                <div className="relative h-36 overflow-hidden bg-slate-800">
                  <img
                    src={ticket.image}
                    alt={ticket.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  {/* Price badge */}
                  <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                    {ticket.sellingPrice > 0 ? `₹${ticket.sellingPrice}` : 'Free'}
                  </div>
                  {/* Event type emoji */}
                  <div className="absolute top-2.5 left-2.5 text-lg">
                    {EVENT_EMOJI[(ticket.eventType || '').toLowerCase()] || '🎟️'}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h4 className="text-sm font-bold text-white line-clamp-1">{ticket.title}</h4>

                  <div className="space-y-1.5">
                    {ticket.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{ticket.venue}</span>
                      </div>
                    )}
                    {ticket.date && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          {ticket.date}
                          {ticket.time && (
                            <>
                              <span className="mx-1 text-slate-600">·</span>
                              <Clock className="w-3 h-3 inline text-amber-300 mr-0.5" />
                              {ticket.time}
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>Qty: <strong className="text-slate-200">{ticket.quantity}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ticket.originalPrice > 0 && ticket.originalPrice !== ticket.sellingPrice && (
                        <span className="text-slate-600 line-through">₹{ticket.originalPrice}</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold capitalize">
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  {/* Transfer method */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Tag className="w-3 h-3" />
                    <span>{ticket.transferMethod}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        id="tickets-fab"
        onClick={() => navigate('/tickets/create')}
        className="fixed bottom-20 right-5 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-2xl shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
        aria-label="Create ticket listing"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm">List Ticket</span>
      </button>
    </div>
  );
};
