import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  Plus,
  Search,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  Phone,
  Hospital,
  Droplet,
} from 'lucide-react';
import { bloodService } from '../../services/bloodService';

export const BloodPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bloodService.getActiveRequests();
      setRequests(data || []);
    } catch (err: any) {
      console.error('Error fetching blood requests:', err);
      setError(err.message || 'Failed to load blood requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = requests.filter((req) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (req.hospital_name && req.hospital_name.toLowerCase().includes(q)) ||
      (req.hospital_location && req.hospital_location.toLowerCase().includes(q)) ||
      (req.blood_group && req.blood_group.toLowerCase().includes(q)) ||
      (req.contact_person && req.contact_person.toLowerCase().includes(q))
    );
  });

  const getUrgencyBadge = (urgency?: string) => {
    const u = (urgency || '').toLowerCase();
    if (u === 'critical') {
      return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-pulse">Critical SOS</span>;
    }
    if (u === 'urgent') {
      return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Urgent</span>;
    }
    return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Normal</span>;
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Blood SOS & Requests</h1>
            <p className="text-[11px] text-slate-400">Emergency blood donations</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/blood/create')}
          className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Post Request</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 pb-24 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by hospital, city, blood group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            <p className="text-sm font-medium">Fetching active blood requests…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-rose-300">{error}</p>
            <button
              onClick={loadRequests}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredRequests.length === 0 && (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 text-center space-y-4 my-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto">
              <Droplet className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Active Blood Requests</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'No requests match your search criteria. Try a different query.'
                  : 'No blood requests posted yet. Post one if you need urgent donors!'}
              </p>
            </div>
            <button
              onClick={() => navigate('/blood/create')}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Blood Request</span>
            </button>
          </div>
        )}

        {/* Requests List */}
        {!loading && !error && filteredRequests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Requests ({filteredRequests.length})
              </span>
              <button onClick={loadRequests} className="text-xs text-rose-400 hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black text-lg">
                      {req.blood_group || 'O+'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {req.units_needed || 1} Unit{req.units_needed > 1 ? 's' : ''} Needed
                        </span>
                        {getUrgencyBadge(req.urgency)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Hospital className="w-3.5 h-3.5 text-rose-400" />
                        {req.hospital_name || 'Hospital'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{req.hospital_location || 'City / Area'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>{req.required_before ? `Before ${new Date(req.required_before).toLocaleDateString()}` : 'ASAP'}</span>
                  </div>
                </div>

                {req.contact_phone && (
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">Contact: {req.contact_person || 'Attender'}</span>
                    <a
                      href={`tel:${req.contact_phone}`}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for mobile */}
      <button
        onClick={() => navigate('/blood/create')}
        className="fixed bottom-20 right-4 z-40 bg-rose-600 hover:bg-rose-500 text-white p-4 rounded-full shadow-lg shadow-rose-600/40 active:scale-95 transition"
        title="Create Blood Request"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
