import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Search, MapPin, Clock, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getActiveFoodDonations, getFoodDonationsByUser, createFoodDonation, mapDbFoodToFoodDonation, FoodDonationRow } from '../../services/foodService';
import { FoodDonation } from '../../types';

export interface FoodScreenProps {
  filterMode?: 'available' | 'mine';
}

export const FoodScreen: React.FC<FoodScreenProps> = ({ filterMode = 'available' }) => {
  const user = useAuthStore((s) => s.user);
  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    food_type: 'Cooked Meals',
    is_vegetarian: true,
    meals_count: '20',
    cooked_time: '',
    pickup_deadline: '',
    pickup_location: '',
    description: '',
    photo_url: '',
  });

  const fetchFoodDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      let rawData: any[] = [];
      if (filterMode === 'mine' && user?.id) {
        rawData = await getFoodDonationsByUser(user.id);
      } else {
        rawData = await getActiveFoodDonations();
      }
      const mapped = rawData.map(mapDbFoodToFoodDonation);
      setDonations(mapped);
    } catch (err: any) {
      console.error('Error fetching food donations:', err);
      setError(err.message || 'Failed to fetch food donations from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodDonations();
  }, [filterMode, user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be signed in to post a food donation.');
      return;
    }
    if (!formData.food_type || !formData.pickup_location) {
      setError('Please fill in required fields (Food Type, Pickup Location).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const foodPayload: Omit<FoodDonationRow, 'id' | 'created_at'> = {
        user_id: user.id,
        food_type: formData.food_type,
        is_vegetarian: formData.is_vegetarian,
        meals_count: parseInt(formData.meals_count) || 10,
        cooked_time: formData.cooked_time || new Date().toISOString(),
        pickup_deadline: formData.pickup_deadline || new Date().toISOString(),
        pickup_location: formData.pickup_location,
        description: formData.description,
        photo_url: formData.photo_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        status: 'active',
      };

      await createFoodDonation(foodPayload);
      setActionSuccess('Food donation posted successfully!');
      setShowCreateModal(false);
      setFormData({
        food_type: 'Cooked Meals',
        is_vegetarian: true,
        meals_count: '20',
        cooked_time: '',
        pickup_deadline: '',
        pickup_location: '',
        description: '',
        photo_url: '',
      });
      await fetchFoodDonations();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error creating food donation:', err);
      setError(err.message || 'Failed to post food donation in Supabase');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDonations = donations.filter((f) =>
    f.foodType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search food aid by type or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Donate Surplus Food
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
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
          <p className="text-xs">Fetching food donation listings from Supabase...</p>
        </div>
      ) : filteredDonations.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <Utensils className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {filterMode === 'mine' ? 'No Food Donations Posted' : 'No Food Aid Available'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {filterMode === 'mine'
              ? 'You have not listed any surplus food donations.'
              : 'There are currently no active food donation listings.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            Post Food Donation
          </button>
        </div>
      ) : (
        /* Donations Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonations.map((food) => (
            <div
              key={food.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition group flex flex-col"
            >
              <div className="relative h-40 overflow-hidden bg-slate-950">
                <img
                  src={food.image}
                  alt={food.foodType}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  {food.dietaryType}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1.5">{food.foodType}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{food.pickupLocation}</span>
                  </div>
                  {food.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2">{food.notes}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Meals: <strong className="text-amber-400">{food.approxMeals} approx</strong></span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase">
                    {food.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Food Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-500" />
                Donate Surplus Food
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Food Type *</label>
                  <select
                    value={formData.food_type}
                    onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cooked Meals">Cooked Meals</option>
                    <option value="Packaged Food">Packaged Food</option>
                    <option value="Bakery & Bread">Bakery & Bread</option>
                    <option value="Produce & Groceries">Produce & Groceries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Dietary Category</label>
                  <select
                    value={formData.is_vegetarian ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.value === 'true' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="true">Vegetarian</option>
                    <option value="false">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Approx. Meals *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.meals_count}
                    onChange={(e) => setFormData({ ...formData, meals_count: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Pickup Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Community Center, T. Nagar"
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description / Food Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Rice, Curry, Chapati prepared for event. Clean & packaged."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
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
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Post Food Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
