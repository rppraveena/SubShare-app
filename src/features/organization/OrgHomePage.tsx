import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Utensils,
  HeartHandshake,
  Users,
  Award,
  ArrowRight,
  RefreshCw,
  Loader2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

export const OrgHomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [orgData, setOrgData] = useState<any>(null);
  const [foodCount, setFoodCount] = useState<number>(0);
  const [bloodCount, setBloodCount] = useState<number>(0);
  const [acceptedCount, setAcceptedCount] = useState<number>(0);
  const [mealsDistributed, setMealsDistributed] = useState<number>(0);
  const [recentFood, setRecentFood] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrgMetrics = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    setLoading(true);
    try {
      // 1. Fetch Organization record
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      setOrgData(org);

      // 2. Food Available
      const { count: foodC, data: foodData } = await supabase
        .from('food_donations')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setFoodCount(foodC || 0);
      setRecentFood(foodData ? foodData.slice(0, 3) : []);

      // 3. Blood Requests Nearby
      const { count: bloodC } = await supabase
        .from('blood_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setBloodCount(bloodC || 0);

      // 4. Donations Accepted by this org
      const { count: acceptedC } = await supabase
        .from('food_donations')
        .select('*', { count: 'exact', head: true })
        .eq('claimed_by_org', currentUser.id);

      setAcceptedCount(acceptedC || 0);

      // 5. Meals Distributed (completed)
      const { data: completedData } = await supabase
        .from('food_donations')
        .select('meals_count')
        .eq('claimed_by_org', currentUser.id)
        .eq('status', 'completed');

      const totalMeals = (completedData || []).reduce(
        (sum, d) => sum + (Number(d.meals_count) || 10),
        0
      );
      setMealsDistributed(totalMeals);
    } catch (err) {
      console.error('Error loading org metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgMetrics();
  }, [loadOrgMetrics]);

  const orgName = orgData?.name || user?.name || 'Verified Organization';

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-28 font-sans transition-colors">
      {/* 1. Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#EAF3FB] dark:bg-blue-950/50 border border-[#CFE4F7] dark:border-slate-700 flex items-center justify-center text-[#0A66C2]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{orgName}</h1>
                <CheckCircle2 className="w-4 h-4 text-[#057642] fill-[#DCFCE7]" />
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                Verified NGO / Community Aid Partner
              </p>
            </div>
          </div>

          <button onClick={loadOrgMetrics} className="p-2 rounded-full bg-[#F3F2EF] dark:bg-slate-800 text-gray-600 dark:text-slate-300">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Status Pill */}
        <div className="inline-flex items-center gap-1.5 bg-[#DCFCE7] text-[#057642] px-3 py-1 rounded-full text-xs font-semibold border border-[#057642]/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active Partner Verified</span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
        {/* 2. Metrics Cards Row (4 cards, fully tappable) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div
            onClick={() => navigate('/organization/donations')}
            className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:border-[#CFE4F7] p-3.5 rounded-sm shadow-2xs cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-[#915907]">
              <Utensils className="w-5 h-5" />
              <span className="text-xs font-bold bg-[#FEF3C7] px-2 py-0.5 rounded-full">Available</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">{foodCount}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">Food Donations Available</p>
          </div>

          <div
            onClick={() => navigate('/organization/blood')}
            className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:border-[#CFE4F7] p-3.5 rounded-sm shadow-2xs cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-[#CC1016]">
              <HeartHandshake className="w-5 h-5" />
              <span className="text-xs font-bold bg-[#FEE2E2] px-2 py-0.5 rounded-full">Urgent</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">{bloodCount}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">Blood Requests Nearby</p>
          </div>

          <div
            onClick={() => navigate('/organization/donations')}
            className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:border-[#CFE4F7] p-3.5 rounded-sm shadow-2xs cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-[#057642]">
              <Award className="w-5 h-5" />
              <span className="text-xs font-bold bg-[#DCFCE7] px-2 py-0.5 rounded-full">Claimed</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">{acceptedCount}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">Donations Accepted</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-sm shadow-2xs">
            <div className="flex items-center justify-between text-[#0A66C2]">
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold bg-[#EAF3FB] px-2 py-0.5 rounded-full">Impact</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">{mealsDistributed}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">Meals Distributed</p>
          </div>
        </div>

        {/* 3. Incoming Food Donations Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Available Food Donations
            </h2>
            <Link to="/organization/donations" className="text-xs font-semibold text-[#0A66C2] hover:underline">
              Browse All
            </Link>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-6 text-center text-xs text-gray-500">
              Loading food donations…
            </div>
          ) : recentFood.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-6 text-center space-y-2">
              <Utensils className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">No active food donations nearby</p>
              <p className="text-xs text-gray-500">When individuals list excess food, donations will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentFood.map((food) => (
                <div
                  key={food.id}
                  onClick={() => navigate('/organization/donations')}
                  className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-sm flex items-center justify-between gap-3 cursor-pointer hover:border-[#CFE4F7] transition shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#915907] px-2 py-0.5 rounded-xs">
                        {food.food_type || 'Food'}
                      </span>
                      <span className="text-xs font-bold text-[#0A66C2]">
                        {food.meals_count || 10} meals
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {food.pickup_location || 'Pickup Point'}
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Organization Navigation Links */}
        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={() => navigate('/organization/donations')}
            className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-4 rounded-sm shadow-2xs cursor-pointer hover:border-[#CFE4F7] transition"
          >
            <Utensils className="w-6 h-6 text-[#0A66C2] mb-1" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Food Aid Feed</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Claim surplus food</p>
          </div>

          <div
            onClick={() => navigate('/organization/blood')}
            className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-4 rounded-sm shadow-2xs cursor-pointer hover:border-[#CFE4F7] transition"
          >
            <HeartHandshake className="w-6 h-6 text-[#CC1016] mb-1" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Blood Drives</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Assist emergency SOS</p>
          </div>
        </div>
      </div>
    </div>
  );
};
