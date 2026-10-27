import { supabase } from '../lib/supabase';
import { FoodDonation } from '../types';

export interface FoodDonationRow {
  id?: string;
  user_id?: string;
  food_type: string;
  is_vegetarian?: boolean;
  meals_count?: number;
  cooked_time?: string;
  pickup_deadline?: string;
  pickup_location?: string;
  description?: string;
  photo_url?: string;
  status?: string;
  available_slots?: number;
  assigned_org_id?: string;
  claimed_by_org?: string;
  assigned_org_name?: string;
  created_at?: string;
}

export const mapDbFoodToFoodDonation = (row: any): FoodDonation => ({
  id: row.id,
  donorId: row.user_id,
  donorName: row.profiles?.name || 'Food Donor',
  donorType: 'Individual Donor',
  donorAvatar: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  donorTrustScore: row.profiles?.trust_score || 92,
  foodType: (row.food_type as any) || 'Cooked Meals',
  dietaryType: row.is_vegetarian ? 'Vegetarian' : 'Non-Vegetarian',
  approxMeals: Number(row.meals_count) || 10,
  cookedTime: row.cooked_time || 'Earlier today',
  pickupDeadline: row.pickup_deadline || 'Today',
  pickupLocation: row.pickup_location || 'Pickup Point',
  distance: row.pickup_location || 'Nearby',
  image: row.photo_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  notes: row.description || '',
  status: row.status === 'active' ? 'available' : (row.status as any) || 'completed',
});

// Core CRUD Functions

export const createFoodDonation = async (foodData: Partial<FoodDonationRow>) => {
  console.log('=== foodService.createFoodDonation START ===');
  console.log('Data received:', JSON.stringify(foodData, null, 2));

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user;
  console.log('[FOOD CREATE] Auth user:', user?.id, user?.email);
  if (authError) console.error('[FOOD CREATE] Auth error:', authError);

  if (!user) {
    console.error('[FOOD CREATE] NO USER — aborting insert');
    throw new Error('You must be signed in to create a food donation.');
  }

  // Build exact-column payload — no 'id', no unknown columns
  const finalPayload: Record<string, any> = {
    user_id: user.id,
    food_type: foodData.food_type || 'Cooked',
    is_vegetarian: foodData.is_vegetarian !== undefined ? foodData.is_vegetarian : true,
    meals_count: Number(foodData.meals_count) || 10,
    cooked_time: foodData.cooked_time || new Date().toISOString(),
    pickup_deadline: foodData.pickup_deadline || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    pickup_location: (foodData.pickup_location || '').trim(),
    description: foodData.description?.trim() || null,
    photo_url: foodData.photo_url || null,
    status: 'active',
    available_slots: 1,
  };

  console.log('Final payload being inserted:', JSON.stringify(finalPayload, null, 2));

  // STEP 1: INSERT only — no .select() to avoid RLS select-after-insert blocking
  const { error: insertErr, status: insertStatus } = await supabase
    .from('food_donations')
    .insert(finalPayload);

  console.log('INSERT HTTP status:', insertStatus);

  if (insertErr) {
    console.error('INSERT FAILED:', insertErr.code, insertErr.message, insertErr.details);
    throw new Error(insertErr.message);
  }

  console.log('INSERT succeeded — food donation saved to DB');

  // STEP 2: Fetch the newly created row
  const { data: rows, error: fetchErr } = await supabase
    .from('food_donations')
    .select('*')
    .eq('user_id', user.id)
    .eq('pickup_location', finalPayload.pickup_location)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr) {
    console.warn('INSERT succeeded but SELECT failed:', fetchErr.message);
    return { ...finalPayload, id: 'db-auto-generated' };
  }

  const createdItem = rows?.[0] ?? { ...finalPayload };
  console.log('=== CREATE FOOD DONATION SUCCESS ===', createdItem);
  return createdItem;
};

export const create = createFoodDonation;
export const createDonation = createFoodDonation;

export const getActiveDonations = async () => {
  const { data: rawDonations, error: foodErr } = await supabase
    .from('food_donations')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (foodErr) {
    console.error('Error fetching food donations:', foodErr);
    throw foodErr;
  }
  if (!rawDonations || rawDonations.length === 0) return [];

  const userIds = [...new Set(rawDonations.map((f) => f.user_id).filter(Boolean))];
  let profiles: any[] = [];
  if (userIds.length > 0) {
    const { data: profData } = await supabase
      .from('profiles')
      .select('id, name, email, trust_score')
      .in('id', userIds);
    profiles = profData || [];
  }

  return rawDonations.map((f) => ({
    ...f,
    profiles: profiles.find((p) => p.id === f.user_id) || null,
  }));
};

export const getAll = getActiveDonations;
export const getActiveFoodDonations = getActiveDonations;

export const getMyDonations = async (userId?: string) => {
  const targetId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from('food_donations')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getByUser = getMyDonations;
export const getFoodDonationsByUser = getMyDonations;

export const claimDonation = async (donationId: string, orgId: string, orgName: string) => {
  const { data, error } = await supabase
    .from('food_donations')
    .update({
      status: 'accepted',
      claimed_by_org: orgId,
      assigned_org_id: orgId,
      assigned_org_name: orgName,
    })
    .eq('id', donationId)
    .select();

  if (error) throw error;
  return data ? data[0] : null;
};

export const updateFoodDonation = async (id: string, data: Partial<FoodDonationRow>) => {
  const { data: updated, error } = await supabase
    .from('food_donations')
    .update(data)
    .eq('id', id)
    .select();

  if (error) throw error;
  return updated ? updated[0] : null;
};

export const update = updateFoodDonation;
export const updateStatus = (id: string, status: string) => updateFoodDonation(id, { status });
export const updateFoodDonationStatus = updateStatus;

export const deleteFoodDonation = async (id: string) => {
  const { error } = await supabase.from('food_donations').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const remove = deleteFoodDonation;
export const deleteDonation = deleteFoodDonation;

export const foodService = {
  create,
  createDonation,
  createFoodDonation,
  getAll,
  getActiveDonations,
  getActiveFoodDonations,
  getByUser,
  getMyDonations,
  getFoodDonationsByUser,
  claimDonation,
  update,
  updateFoodDonation,
  updateStatus,
  updateFoodDonationStatus,
  remove,
  deleteDonation,
  deleteFoodDonation,
};

export default foodService;
