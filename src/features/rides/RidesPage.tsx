import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Plus,
  Search,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-react';
import { getAllRides, mapDbRideToRideListing } from '../../services/ridesService';
import { RideListing } from '../../types';

export const RidesPage: React.FC = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState<RideListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await getAllRides();
      setRides(raw.map(mapDbRideToRideListing));
    } catch (err: any) {
      console.error('Error loading rides:', err);
      setError('Failed to load rides. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const filtered = rides.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) ||
      (r.vehicleModel || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-violet-400" />
            <h1 className="text-base font-bold text-white">Rides</h1>
            {!loading && !error && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-xs font-semibold">
                {filtered.length}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/rides/create')}
            className="text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Offer Ride
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            id="rides-search"
            type="text"
            placeholder="Search by city, area, or route…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-violet-500 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none transition placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="px-4 py-4 pb-28">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <p className="text-sm">Loading rides from Supabase…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm text-rose-300 font-medium mb-3">{error}</p>
            <button
              onClick={fetchRides}
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
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Car className="w-7 h-7 text-violet-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {search ? 'No matching rides' : 'No rides posted. Share your route!'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-5">
              {search
                ? 'Try a different search term or city name.'
                : 'Offer a seat in your car and help others commute while sharing costs.'}
            </p>
            {!search && (
              <button
                id="rides-empty-create-btn"
                onClick={() => navigate('/rides/create')}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-violet-500/20"
              >
                <Plus className="w-4 h-4" />
                Offer First Ride
              </button>
            )}
          </div>
        )}

        {/* Rides grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ride) => (
              <div
                key={ride.id}
                className="bg-slate-900 border border-slate-800 hover:border-violet-500/40 rounded-2xl p-4 transition-all flex flex-col gap-3"
              >
                {/* Route */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                      <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span className="truncate">{ride.origin}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-1 mb-1">
                      <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{ride.destination}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-emerald-400 font-bold text-sm">
                      {ride.pricePerSeat > 0 ? `₹${ride.pricePerSeat}` : 'Free'}
                    </span>
                    <p className="text-slate-500 text-[10px]">per seat</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-800 pt-3">
                  {ride.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{ride.date}</span>
                    </div>
                  )}
                  {ride.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>{ride.time}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-violet-400" />
                    <span>
                      Seats: <strong className="text-slate-200">{ride.seatsAvailable}/{ride.seatsTotal}</strong>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase">
                    {ride.vehicleModel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        id="rides-fab"
        onClick={() => navigate('/rides/create')}
        className="fixed bottom-20 right-5 z-50 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-3 rounded-2xl shadow-xl shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
        aria-label="Offer a ride"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm">Offer Ride</span>
      </button>
    </div>
  );
};
