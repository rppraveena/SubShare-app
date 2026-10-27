import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Car,
  HeartHandshake,
  Utensils,
  Share2,
  Shield,
  Bell,
  ChevronRight,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useMyListings } from '../../hooks/useMyListings';
import { ticketsService } from '../../services/ticketsService';
import { ridesService } from '../../services/ridesService';
import { bloodService } from '../../services/bloodService';
import { foodService } from '../../services/foodService';
import { subscriptionsService } from '../../services/subscriptionsService';

export const HomeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { listings: myListings, loading: myLoading, refresh: refreshMyListings } = useMyListings();

  const [recentFeed, setRecentFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentFeed = async () => {
      setLoading(true);
      try {
        const [tickets, rides, blood, food, subs] = await Promise.allSettled([
          ticketsService.getAllTickets(),
          ridesService.getAllRides(),
          bloodService.getActiveRequests(),
          foodService.getActiveDonations(),
          subscriptionsService.getAllGroups(),
        ]);

        const tList = tickets.status === 'fulfilled' ? tickets.value.map((i: any) => ({ ...i, serviceType: 'ticket', typeLabel: 'Ticket' })) : [];
        const rList = rides.status === 'fulfilled' ? rides.value.map((i: any) => ({ ...i, serviceType: 'ride', typeLabel: 'Ride' })) : [];
        const bList = blood.status === 'fulfilled' ? blood.value.map((i: any) => ({ ...i, serviceType: 'blood', typeLabel: 'Blood SOS' })) : [];
        const fList = food.status === 'fulfilled' ? food.value.map((i: any) => ({ ...i, serviceType: 'food', typeLabel: 'Food' })) : [];
        const sList = subs.status === 'fulfilled' ? subs.value.map((i: any) => ({ ...i, serviceType: 'subscription', typeLabel: 'Subscription' })) : [];

        const combined = [...tList, ...rList, ...bList, ...fList, ...sList].sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setRecentFeed(combined.slice(0, 5));
      } catch (err) {
        console.error('Error fetching recent feed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecentFeed();
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';
  const userScore = user?.trustScore ?? 10;

  const serviceHubs = [
    {
      id: 'tickets',
      path: '/services?tab=tickets',
      icon: Ticket,
      label: 'Ticket Sharing',
    },
    {
      id: 'rides',
      path: '/services?tab=rides',
      icon: Car,
      label: 'Ride Sharing',
    },
    {
      id: 'blood',
      path: '/services?tab=blood',
      icon: HeartHandshake,
      label: 'Blood Emergency',
    },
    {
      id: 'food',
      path: '/services?tab=food',
      icon: Utensils,
      label: 'Food Aid',
    },
    {
      id: 'subscriptions',
      path: '/services?tab=subscriptions',
      icon: Share2,
      label: 'Subscriptions',
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors font-sans pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="relative">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Profile'}
              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700"
            />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Welcome, {firstName}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-semibold text-[#0A66C2]">Trust Score {userScore}</span>
              <span className="text-gray-300 dark:text-slate-700">•</span>
              <span className="text-[11px] text-gray-500 capitalize">{user?.accountType || 'Individual'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/help/contact"
            className="p-2 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            title="Help & Contact Admin"
          >
            <HelpCircle className="w-5 h-5" />
          </Link>
          <Link
            to="/notifications"
            className="p-2 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Content Container */}
      <div className="p-4 max-w-md mx-auto w-full space-y-4">
        {/* Services Hub Grid (5 items) */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">P2P Services Hub</h2>
          <div className="grid grid-cols-5 gap-1.5">
            {serviceHubs.map((hub) => {
              const Icon = hub.icon;
              return (
                <button
                  key={hub.id}
                  onClick={() => navigate(hub.path)}
                  className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:border-[#CFE4F7] dark:hover:border-slate-700 p-2.5 rounded-sm flex flex-col items-center justify-center text-center transition shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#EAF3FB] dark:bg-slate-800 text-[#0A66C2] dark:text-blue-400 flex items-center justify-center mb-1 group-hover:bg-[#0A66C2] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold leading-tight text-gray-800 dark:text-slate-200">{hub.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Your Active Listings Section (Real Data via useMyListings) */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">Your Active Listings ({myListings.length})</h2>
            <Link to="/my-listings" className="text-xs font-semibold text-[#0A66C2] hover:underline flex items-center gap-0.5">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {myLoading && (
            <div className="py-6 flex items-center justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#0A66C2]" />
            </div>
          )}

          {!myLoading && myListings.length === 0 && (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-gray-500 font-medium">You haven't posted any active service listings yet.</p>
              <button
                onClick={() => navigate('/services')}
                className="bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xs transition"
              >
                Create a Listing
              </button>
            </div>
          )}

          {!myLoading && myListings.length > 0 && (
            <div className="space-y-2">
              {myListings.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/services?tab=${item.serviceType || 'tickets'}`)}
                  className="bg-[#F3F2EF] dark:bg-slate-950 p-3 rounded-xs flex items-center justify-between cursor-pointer hover:bg-[#EAF3FB] transition"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A66C2] bg-white px-2 py-0.5 rounded-xs border border-gray-200">
                      {item.type || item.serviceType}
                    </span>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mt-1">{item.title}</h3>
                  </div>
                  {item.price > 0 && (
                    <span className="text-xs font-black text-[#0A66C2]">₹{item.price}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Feed Near You */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recent Listings Near You</h2>
            <Link to="/services" className="text-xs font-semibold text-[#0A66C2] hover:underline">
              Browse All
            </Link>
          </div>

          {loading && (
            <div className="py-8 flex items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0A66C2]" />
            </div>
          )}

          {!loading && recentFeed.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-6 text-center text-xs text-gray-500">
              No recent listings found in your area.
            </div>
          )}

          {!loading &&
            recentFeed.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/services?tab=${item.serviceType === 'ticket' ? 'tickets' : item.serviceType === 'ride' ? 'rides' : item.serviceType === 'blood' ? 'blood' : item.serviceType === 'food' ? 'food' : 'subscriptions'}`)}
                className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-sm flex items-center justify-between gap-3 cursor-pointer hover:border-[#CFE4F7] transition shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF3FB] text-[#0A66C2] px-2 py-0.5 rounded-xs">
                      {item.typeLabel}
                    </span>
                    <span className="text-[11px] text-gray-500 truncate">
                      {item.event_name || item.pickup_location || item.blood_group || item.food_type || item.service_name}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-gray-900 dark:text-white mt-1 truncate">
                    {item.venue || item.destination || item.hospital || item.description || item.notes || 'Available now'}
                  </h3>
                </div>

                <div className="text-right flex-shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
