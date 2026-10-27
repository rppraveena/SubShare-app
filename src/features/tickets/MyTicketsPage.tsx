import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Plus,
  ArrowLeft,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Clock,
  Users,
  Tag,
} from 'lucide-react';
import { ticketsService, mapDbTicketToTicketListing } from '../../services/ticketsService';
import { TicketListing } from '../../types';

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMyTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await ticketsService.getMyTickets();
      setTickets(raw.map(mapDbTicketToTicketListing));
    } catch (err: any) {
      console.error('Error loading my tickets:', err);
      setError('Failed to load your listings. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this ticket listing?')) return;
    setDeletingId(id);
    try {
      await ticketsService.deleteTicket(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete listing.');
    } finally {
      setDeletingId(null);
    }
  };

  const statusColor: Record<string, string> = {
    available: 'bg-emerald-500/10 text-emerald-400',
    sold: 'bg-rose-500/10 text-rose-400',
    requested: 'bg-amber-500/10 text-amber-400',
    reserved: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 rounded-xl hover:bg-slate-800 transition text-slate-400 hover:text-white"
            aria-label="Back to tickets"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-400" />
            <h1 className="text-base font-bold text-white">My Listings</h1>
            {!loading && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold">
                {tickets.length}
              </span>
            )}
          </div>
        </div>
        <button
          id="my-tickets-create-btn"
          onClick={() => navigate('/tickets/create')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          New Listing
        </button>
      </div>

      <div className="px-4 py-4 pb-24">
        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">Loading your listings…</p>
          </div>
        )}

        {/* Error full state */}
        {!loading && error && tickets.length === 0 && (
          <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm text-rose-300 font-medium mb-3">{error}</p>
            <button
              onClick={fetchMyTickets}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-4 py-2 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tickets.length === 0 && (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <Ticket className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No listings yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-5">
              You haven't listed any tickets for sale or transfer. Post your first listing to reach verified peers nearby.
            </p>
            <button
              id="my-tickets-empty-create-btn"
              onClick={() => navigate('/tickets/create')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Create First Listing
            </button>
          </div>
        )}

        {/* Listings */}
        {!loading && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex gap-4 transition group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                  <img
                    src={ticket.image}
                    alt={ticket.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-bold text-white line-clamp-1 flex-1">
                      {ticket.title}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${
                        statusColor[ticket.status] || 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div className="space-y-1 mb-2">
                    {ticket.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">{ticket.venue}</span>
                      </div>
                    )}
                    {ticket.date && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>
                          {ticket.date}
                          {ticket.time && ` · ${ticket.time}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> Qty: {ticket.quantity}
                      </span>
                      {ticket.sellingPrice > 0 && (
                        <span className="text-emerald-400 font-semibold">
                          ₹{ticket.sellingPrice}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {ticket.transferMethod}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(ticket.id)}
                  disabled={deletingId === ticket.id}
                  className="self-start p-2 rounded-xl text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-40"
                  aria-label="Delete listing"
                >
                  {deletingId === ticket.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
