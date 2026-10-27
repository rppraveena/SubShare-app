import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Clock, MapPin, User, Utensils } from 'lucide-react';

export const OrgFoodDonationsPage = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'cooked' | 'packaged'>('all');

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Query active food_donations
      const { data: rawDonations, error: donationsError } = await supabase
        .from('food_donations')
        .select('*')
        .eq('status', 'active')
        .order('pickup_deadline', { ascending: true });

      if (donationsError) throw donationsError;

      // 2. Query profiles separately to avoid FK join schema cache error
      const donorIds = [...new Set((rawDonations || []).map((d) => d.user_id).filter(Boolean))];

      let profiles: any[] = [];
      if (donorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, phone, show_contact')
          .in('id', donorIds);
        profiles = profilesData || [];
      }

      // 3. Merge manually
      const enriched = (rawDonations || []).map((d) => ({
        ...d,
        donor: profiles.find((p) => p.id === d.user_id) || null,
      }));

      setDonations(enriched);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch food donations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (donation: any) => {
    const confirmed = window.confirm(
      `Accept this donation of ${donation.meals_count || 10} meals from ${donation.donor?.name || 'Donor'}?`
    );
    if (!confirmed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Update donation status atomically
      const { error: updateError } = await supabase
        .from('food_donations')
        .update({
          status: 'accepted',
          claimed_by_org: user.id,
          assigned_org_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', donation.id)
        .eq('status', 'active');

      if (updateError) {
        alert('Someone else may have accepted this donation or update failed.');
        return;
      }

      // 2. Notify the donor
      await supabase.from('notifications').insert({
        user_id: donation.user_id,
        title: 'Donation Accepted',
        body: `Your donation of ${donation.meals_count || 10} meals was accepted. Check chat for pickup details.`,
        type: 'food',
        related_id: donation.id,
        action_url: '/chat',
      });

      // 3. Create chat room between donor and org
      const participantIds = [donation.user_id, user.id].sort();

      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .contains('participant_ids', participantIds)
        .maybeSingle();

      if (!existingRoom) {
        await supabase.from('chat_rooms').insert({
          participant_ids: participantIds,
          last_message: 'Donation accepted',
          last_message_at: new Date().toISOString(),
        });
      }

      alert('Donation accepted! Chat with donor for pickup.');
      fetchDonations();
    } catch (err: any) {
      alert('Failed to accept: ' + err.message);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500 font-medium">Loading food donations…</div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-[#CC1016] font-semibold">Error: {error}</div>;
  }

  const filtered = donations.filter((d) => {
    if (filter === 'all') return true;
    return d.food_type?.toLowerCase().includes(filter);
  });

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans pb-28">
      <header className="bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold">Food Donations Nearby</h1>
          <p className="text-[11px] text-gray-500">Claim donations for your organization</p>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto w-full space-y-4">
        <div className="flex gap-2 mb-2">
          {(['all', 'cooked', 'packaged'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === f
                  ? 'bg-[#0A66C2] text-white'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-8 text-center space-y-3 my-4">
            <Utensils className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-800 dark:text-slate-200">No food donations available right now</p>
            <p className="text-xs text-gray-500">Check back soon for surplus food donations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((donation) => (
              <div key={donation.id} className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-3 shadow-2xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{donation.food_type}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                      donation.is_vegetarian
                        ? 'bg-[#DCFCE7] text-[#057642]'
                        : 'bg-[#FEE2E2] text-[#CC1016]'
                    }`}>
                      {donation.is_vegetarian ? 'Vegetarian' : 'Non-Veg'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#0A66C2]">
                      {donation.meals_count || 10}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">meals</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 dark:text-slate-300 bg-[#F3F2EF] dark:bg-slate-950 p-3 rounded-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Donor: {donation.donor?.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{donation.pickup_location || 'Pickup Point'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Pickup deadline: {donation.pickup_deadline ? new Date(donation.pickup_deadline).toLocaleString() : 'Today'}</span>
                  </div>
                </div>

                {donation.description && (
                  <p className="text-xs text-gray-600 dark:text-slate-400 italic">
                    "{donation.description}"
                  </p>
                )}

                <button
                  onClick={() => handleAccept(donation)}
                  className="w-full py-3 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full font-semibold text-xs shadow-2xs transition"
                >
                  Accept Donation
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgFoodDonationsPage;
