import React, { useState, useEffect } from 'react';
import { Car, Plus, Search, Calendar, MapPin, Loader2, AlertCircle, CheckCircle2, X, Users, Clock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getAllRides, getUserRides, createRide, mapDbRideToRideListing, RideRow } from '../../services/ridesService';
import { RideListing } from '../../types';

export interface RidesScreenProps {
  filterMode?: 'available' | 'mine';
}

export const RidesScreen: React.FC<RidesScreenProps> = ({ filterMode = 'available' }) => {
  const user = useAuthStore((s) => s.user);
  const [rides, setRides] = useState<RideListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    pickup_location: '',
    destination: '',
    departure_date: '',
    departure_time: '',
    available_seats: '3',
    total_seats: '4',
    price_per_person: '150',
    vehicle_type: 'Sedan',
    gender_preference: 'anyone',
  });

  const fetchRides = async () => {
    setLoading(true);
    setError(null);
    try {
      let rawData: any[] = [];
      if (filterMode === 'mine' && user?.id) {
        rawData = await getUserRides(user.id);
      } else {
        rawData = await getAllRides();
      }
      const mapped = rawData.map(mapDbRideToRideListing);
      setRides(mapped);
    } catch (err: any) {
      console.error('Error fetching rides:', err);
      setError(err.message || 'Failed to fetch rides from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [filterMode, user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be signed in to post a ride.');
      return;
    }
    if (!formData.pickup_location || !formData.destination) {
      setError('Please provide pickup location and destination.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ridePayload: Omit<RideRow, 'id' | 'created_at'> = {
        user_id: user.id,
        pickup_location: formData.pickup_location,
        destination: formData.destination,
        departure_date: formData.departure_date || new Date().toISOString().split('T')[0],
        departure_time: formData.departure_time || '09:00',
        available_seats: parseInt(formData.available_seats) || 3,
        total_seats: parseInt(formData.total_seats) || 4,
        price_per_person: parseFloat(formData.price_per_person) || 0,
        vehicle_type: formData.vehicle_type,
        gender_preference: formData.gender_preference,
        status: 'active',
      };

      await createRide(ridePayload);
      setActionSuccess('Ride offer published successfully!');
      setShowCreateModal(false);
      setFormData({
        pickup_location: '',
        destination: '',
        departure_date: '',
        departure_time: '',
        available_seats: '3',
        total_seats: '4',
        price_per_person: '150',
        vehicle_type: 'Sedan',
        gender_preference: 'anyone',
      });
      await fetchRides();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error creating ride:', err);
      setError(err.message || 'Failed to publish ride in Supabase');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRides = rides.filter((r) =>
    r.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rides by pickup or destination..."
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
          Offer a Ride
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
          <p className="text-xs">Fetching ride listings from Supabase...</p>
        </div>
      ) : filteredRides.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Car className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {filterMode === 'mine' ? 'No Rides Offered Yet' : 'No Rides Available'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {filterMode === 'mine'
              ? 'You have not offered any rides yet.'
              : 'There are currently no active ride offers available.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            Offer First Ride
          </button>
        </div>
      ) : (
        /* Ride Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRides.map((ride) => (
            <div
              key={ride.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    {ride.vehicleModel}
                  </span>
                  <span className="text-emerald-400 font-bold text-xs">
                    ₹{ride.pricePerSeat} / seat
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{ride.origin}</span>
                  </div>
                  <div className="pl-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider py-0.5">
                    to
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{ride.destination}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ride.date || 'Today'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{ride.time || 'Flexible'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Seats: <strong className="text-slate-200">{ride.seatsAvailable}/{ride.seatsTotal}</strong></span>
                </div>
                <span className="text-slate-500 text-[10px] capitalize">
                  Pref: {ride.genderPreference}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ride Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-500" />
                Offer a Ride
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
                  <label className="block text-slate-300 mb-1 font-medium">Pickup Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anna Nagar"
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Destination *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT Park, OMR"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Departure Date</label>
                  <input
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Departure Time</label>
                  <input
                    type="time"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Avail. Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.available_seats}
                    onChange={(e) => setFormData({ ...formData, available_seats: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Total Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_seats}
                    onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Price / Person (₹)</label>
                  <input
                    type="number"
                    value={formData.price_per_person}
                    onChange={(e) => setFormData({ ...formData, price_per_person: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Vehicle Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Sedan, SUV, Bike"
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Gender Pref.</label>
                  <select
                    value={formData.gender_preference}
                    onChange={(e) => setFormData({ ...formData, gender_preference: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="anyone">Anyone</option>
                    <option value="women_only">Women Only</option>
                    <option value="men_only">Men Only</option>
                  </select>
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
                  Publish Ride
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
