import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Utensils, RefreshCw, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { foodService } from '../../services/foodService';
import { useAuthStore } from '../../stores/authStore';

export const OrgDonationsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadDonations = useCallback(async () => {
    setLoading(true);
    try {
      const list = await foodService.getActiveDonations();
      setDonations(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  const handleClaim = async (id: string) => {
    if (!user?.id) return;
    setClaimingId(id);
    try {
      await foodService.claimDonation(id, user.id, user.name);
      await loadDonations();
    } catch (e: any) {
      alert(e.message || 'Failed to claim donation.');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors font-sans pb-28">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">Incoming Food Donations</h1>
            <p className="text-[11px] text-gray-500">Claim food for distribution</p>
          </div>
        </div>

        <button onClick={loadDonations} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <p className="text-sm font-medium">Fetching donations…</p>
          </div>
        )}

        {!loading && donations.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-3 my-4">
            <Utensils className="w-8 h-8 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold">No Donations Available</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              When restaurants or caterers post surplus food, they will appear here.
            </p>
          </div>
        )}

        {!loading &&
          donations.map((food) => (
            <div
              key={food.id}
              className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-[#FEF3C7] text-[#915907]">
                    {food.foodType || 'Cooked Food'}
                  </span>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mt-1">
                    {food.approxMeals || '10+'} Meals Available
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {food.pickupLocation || food.city || 'Local Location'}
                  </p>
                </div>

                <button
                  onClick={() => handleClaim(food.id)}
                  disabled={claimingId === food.id}
                  className="bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-xs px-4 py-2 rounded-full transition shadow-2xs flex items-center gap-1"
                >
                  {claimingId === food.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Claim</span>
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
