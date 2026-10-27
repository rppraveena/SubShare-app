import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Ticket,
  Car,
  HeartHandshake,
  Utensils,
  Share2,
  Trash2,
  Loader2,
  AlertCircle,
  Plus,
  RefreshCw,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ticketsService } from '../../services/ticketsService';
import { ridesService } from '../../services/ridesService';
import { bloodService } from '../../services/bloodService';
import { foodService } from '../../services/foodService';
import { subscriptionsService } from '../../services/subscriptionsService';
import { canDeleteListing } from '../../utils/listingHelpers';
import { supabase } from '../../lib/supabase';

type ServiceTab = 'tickets' | 'rides' | 'blood' | 'food' | 'subscriptions';

export const MyListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<ServiceTab>('tickets');
  const [items, setItems] = useState<any[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTabItems = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      let data: any[] = [];
      if (activeTab === 'tickets') {
        data = await ticketsService.getMyTickets();
      } else if (activeTab === 'rides') {
        data = await ridesService.getMyRides();
      } else if (activeTab === 'blood') {
        data = await bloodService.getMyRequests();
      } else if (activeTab === 'food') {
        data = await foodService.getMyDonations();
      } else if (activeTab === 'subscriptions') {
        data = await subscriptionsService.getMyGroups();
      }

      setItems(data || []);

      // Fetch pending request counts for each listing
      if (data && data.length > 0) {
        const listingIds = data.map((i) => i.id).filter(Boolean);
        const { data: reqCounts } = await supabase
          .from('service_requests')
          .select('listing_id')
          .in('listing_id', listingIds)
          .eq('status', 'pending');

        const countsMap: Record<string, number> = {};
        if (reqCounts) {
          reqCounts.forEach((r: any) => {
            if (r.listing_id) {
              countsMap[r.listing_id] = (countsMap[r.listing_id] || 0) + 1;
            }
          });
        }
        setPendingCounts(countsMap);
      } else {
        setPendingCounts({});
      }
    } catch (err: any) {
      console.error(`Error loading ${activeTab}:`, err);
      setError(err.message || `Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    loadTabItems();
  }, [loadTabItems]);

  const handleDelete = async (item: any) => {
    const deleteCheck = canDeleteListing(item);
    if (!deleteCheck.allowed) {
      alert(deleteCheck.message || 'Cannot delete listing at this time.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setDeletingId(item.id);
    try {
      if (activeTab === 'tickets') {
        await ticketsService.deleteTicket(item.id);
      } else if (activeTab === 'rides') {
        await ridesService.deleteRide(item.id);
      } else if (activeTab === 'blood') {
        await bloodService.deleteRequest(item.id);
      } else if (activeTab === 'food') {
        await foodService.deleteDonation(item.id);
      } else if (activeTab === 'subscriptions') {
        await subscriptionsService.deleteGroup(item.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete listing.');
    } finally {
      setDeletingId(null);
    }
  };

  const tabs = [
    { id: 'tickets' as const, label: 'Tickets', icon: Ticket },
    { id: 'rides' as const, label: 'Rides', icon: Car },
    { id: 'blood' as const, label: 'Blood', icon: HeartHandshake },
    { id: 'food' as const, label: 'Food', icon: Utensils },
    { id: 'subscriptions' as const, label: 'Subscriptions', icon: Share2 },
  ];

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Your Service Listings</h1>
            <p className="text-[11px] text-gray-500">Manage posts, pending requests & 24h locks</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/requests/owner')}
          className="text-xs font-semibold text-[#0A66C2] hover:underline flex items-center gap-1"
        >
          All Requests →
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 px-2 overflow-x-auto scrollbar-none">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === id
                ? 'border-[#0A66C2] text-[#0A66C2] font-bold'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-28 space-y-3 max-w-md mx-auto w-full">
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <p className="text-xs font-bold">Loading your {activeTab} listings…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-[#FEE2E2] border border-[#CC1016]/20 rounded-sm p-4 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-[#CC1016] mx-auto" />
            <p className="text-xs font-bold text-[#CC1016]">{error}</p>
            <button
              onClick={loadTabItems}
              className="text-xs font-semibold text-[#0A66C2] hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-3 my-6 shadow-2xs">
            <p className="text-sm font-bold text-gray-900 dark:text-white">No active {activeTab} listings</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Share your first {activeTab} listing with the community.
            </p>
            <button
              onClick={() => navigate(`/${activeTab}/create`)}
              className="inline-flex items-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-xs px-4 py-2 rounded-full shadow-2xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create {activeTab.slice(0, -1)} listing</span>
            </button>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => {
              const pendingCount = pendingCounts[item.id] || 0;
              const deleteCheck = canDeleteListing(item);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {item.event_name ||
                          item.service_name ||
                          item.pickup_location ||
                          item.hospital_name ||
                          item.food_type ||
                          'Listing'}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        Status: <span className="font-semibold capitalize text-gray-700 dark:text-slate-300">{item.status || 'Active'}</span> • {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Active'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id || !deleteCheck.allowed}
                      className={`p-2 rounded-full transition flex-shrink-0 ${
                        deleteCheck.allowed
                          ? 'bg-[#FEE2E2] text-[#CC1016] hover:bg-[#CC1016] hover:text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                      }`}
                      title={deleteCheck.allowed ? 'Delete Listing' : deleteCheck.message}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Pending Requests Badge */}
                  {pendingCount > 0 && (
                    <div
                      onClick={() => navigate(`/requests/owner?listingId=${item.id}`)}
                      className="bg-[#EAF3FB] border border-[#CFE4F7] p-2.5 rounded-xs flex items-center justify-between cursor-pointer hover:bg-[#CFE4F7] transition text-xs text-[#0A66C2] font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 fill-[#0A66C2]" />
                        <span>🔔 {pendingCount} pending applicant request(s)</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}

                  {!deleteCheck.allowed && (
                    <p className="text-[11px] text-[#915907] italic">
                      ⚠️ {deleteCheck.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
