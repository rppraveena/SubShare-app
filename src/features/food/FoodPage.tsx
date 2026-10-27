import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils,
  Plus,
  Search,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { foodService } from '../../services/foodService';

export const FoodPage: React.FC = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await foodService.getActiveDonations();
      setDonations(data || []);
    } catch (err: any) {
      console.error('Error fetching food donations:', err);
      setError(err.message || 'Failed to load food donations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  const filteredDonations = donations.filter((don) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (don.pickup_location && don.pickup_location.toLowerCase().includes(q)) ||
      (don.food_type && don.food_type.toLowerCase().includes(q)) ||
      (don.description && don.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col min-h-full bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Utensils className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Food Share & Donations</h1>
            <p className="text-[11px] text-slate-400">Share surplus food nearby</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/food/create')}
          className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Donate Food</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 pb-24 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by pickup location, food type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm font-medium">Fetching active food donations…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-rose-300">{error}</p>
            <button
              onClick={loadDonations}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredDonations.length === 0 && (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 text-center space-y-4 my-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto">
              <Utensils className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Food Donations Available</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'No donations match your search. Try another location or food type.'
                  : 'No food donations right now. Post your surplus food to help someone!'}
              </p>
            </div>
            <button
              onClick={() => navigate('/food/create')}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Food Donation</span>
            </button>
          </div>
        )}

        {/* Donations List */}
        {!loading && !error && filteredDonations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Available Food ({filteredDonations.length})
              </span>
              <button onClick={loadDonations} className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {filteredDonations.map((don) => (
              <div
                key={don.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{don.food_type || 'Cooked Meals'}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          don.is_vegetarian
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {don.is_vegetarian ? 'Veg 🌱' : 'Non-Veg 🍗'}
                      </span>
                    </div>
                    {don.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{don.description}</p>
                    )}
                  </div>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black text-sm px-2.5 py-1 rounded-xl flex-shrink-0">
                    {don.meals_count || 1} Meals
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{don.pickup_location || 'Pickup Point'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span>
                      {don.pickup_deadline ? `Pickup by ${new Date(don.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Pickup ASAP'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/food/create')}
        className="fixed bottom-20 right-4 z-40 bg-amber-600 hover:bg-amber-500 text-white p-4 rounded-full shadow-lg shadow-amber-600/40 active:scale-95 transition"
        title="Donate Food"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
