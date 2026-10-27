import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useMyListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setListings([]);
        return;
      }

      const [tickets, rides, blood, food, subs] = await Promise.all([
        supabase.from('tickets').select('*').eq('user_id', user.id),
        supabase.from('rides').select('*').eq('user_id', user.id),
        supabase.from('blood_requests').select('*').eq('user_id', user.id),
        supabase.from('food_donations').select('*').eq('user_id', user.id),
        supabase.from('subscription_groups').select('*').eq('owner_id', user.id),
      ]);

      const combined = [
        ...(tickets.data || []).map((t) => ({ ...t, type: 'ticket', serviceType: 'tickets', title: t.event_name, price: t.selling_price })),
        ...(rides.data || []).map((r) => ({ ...r, type: 'ride', serviceType: 'rides', title: `${r.pickup_location} → ${r.destination}`, price: r.price_per_seat })),
        ...(blood.data || []).map((b) => ({ ...b, type: 'blood', serviceType: 'blood', title: `${b.blood_group} Blood Needed`, price: 0 })),
        ...(food.data || []).map((f) => ({ ...f, type: 'food', serviceType: 'food', title: `${f.food_type} (${f.meals_count || 10} meals)`, price: 0 })),
        ...(subs.data || []).map((s) => ({ ...s, type: 'subscription', serviceType: 'subscriptions', title: s.service_name, price: s.price_per_slot })),
      ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      setListings(combined);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { listings, loading, error, refresh };
}
