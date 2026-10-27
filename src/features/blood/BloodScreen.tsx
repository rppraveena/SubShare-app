import React, { useState, useEffect } from 'react';
import { HeartHandshake, Plus, Search, Hospital, Phone, AlertTriangle, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getActiveBloodRequests, getBloodRequestsByUser, createBloodRequest, mapDbBloodToBloodRequest, BloodRequestRow } from '../../services/bloodService';
import { BloodRequest } from '../../types';

export interface BloodScreenProps {
  filterMode?: 'available' | 'mine';
}

export const BloodScreen: React.FC<BloodScreenProps> = ({ filterMode = 'available' }) => {
  const user = useAuthStore((s) => s.user);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    blood_group: 'O+',
    units_needed: '2',
    hospital_name: '',
    hospital_location: '',
    contact_person: '',
    contact_phone: '',
    reason: '',
    urgency: 'normal',
    required_before: '',
  });

  const fetchBloodRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      let rawData: any[] = [];
      if (filterMode === 'mine' && user?.id) {
        rawData = await getBloodRequestsByUser(user.id);
      } else {
        rawData = await getActiveBloodRequests();
      }
      const mapped = rawData.map(mapDbBloodToBloodRequest);
      setRequests(mapped);
    } catch (err: any) {
      console.error('Error fetching blood requests:', err);
      setError(err.message || 'Failed to fetch blood requests from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloodRequests();
  }, [filterMode, user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be signed in to create a blood request.');
      return;
    }
    if (!formData.blood_group || !formData.hospital_name) {
      setError('Please fill in required fields (Blood Group, Hospital Name).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const bloodPayload: Omit<BloodRequestRow, 'id' | 'created_at'> = {
        user_id: user.id,
        blood_group: formData.blood_group,
        units_needed: parseInt(formData.units_needed) || 1,
        hospital_name: formData.hospital_name,
        hospital_location: formData.hospital_location || 'City Hospital',
        contact_person: formData.contact_person || user.name,
        contact_phone: formData.contact_phone || user.phone,
        reason: formData.reason,
        urgency: formData.urgency,
        required_before: formData.required_before || new Date().toISOString(),
        status: 'active',
      };

      await createBloodRequest(bloodPayload);
      setActionSuccess('Emergency blood request posted successfully!');
      setShowCreateModal(false);
      setFormData({
        blood_group: 'O+',
        units_needed: '2',
        hospital_name: '',
        hospital_location: '',
        contact_person: '',
        contact_phone: '',
        reason: '',
        urgency: 'normal',
        required_before: '',
      });
      await fetchBloodRequests();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error creating blood request:', err);
      setError(err.message || 'Failed to post blood request in Supabase');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by blood group or hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-rose-500"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
        >
          <Plus className="w-4 h-4" />
          Post Blood Request
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
          <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
          <p className="text-xs">Fetching emergency blood requests from Supabase...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
            <HeartHandshake className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {filterMode === 'mine' ? 'No Blood Requests Posted' : 'No Active Blood Requests'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {filterMode === 'mine'
              ? 'You have not submitted any emergency blood requests.'
              : 'There are currently no active blood requests.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            Post Emergency Request
          </button>
        </div>
      ) : (
        /* Requests Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black text-sm">
                    {req.bloodGroup}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase">
                    {req.urgency}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{req.hospital}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Hospital className="w-3.5 h-3.5 text-slate-500" />
                    <span>{req.location}</span>
                  </div>
                </div>

                {req.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 line-clamp-2">
                    {req.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Units Needed: <strong className="text-white">{req.unitsRequired}</strong></span>
                <div className="flex items-center gap-1 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{req.attenderContact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Blood Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-500" />
                Post Emergency Blood Request
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
                  <label className="block text-slate-300 mb-1 font-medium">Blood Group *</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Units Needed *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.units_needed}
                    onChange={(e) => setFormData({ ...formData, units_needed: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Hospital Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Hospital"
                  value={formData.hospital_name}
                  onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Hospital Location</label>
                <input
                  type="text"
                  placeholder="e.g. Greams Road, Chennai"
                  value={formData.hospital_location}
                  onChange={(e) => setFormData({ ...formData, hospital_location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Attender Name"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 Phone number"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Urgency Level</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="normal">Normal (Within 24 hours)</option>
                  <option value="urgent">Urgent (Within 4 hours)</option>
                  <option value="critical">Critical / Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Reason / Details</label>
                <textarea
                  rows={2}
                  placeholder="Medical reason or specific ward instructions..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Post Blood Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
