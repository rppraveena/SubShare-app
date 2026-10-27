import { supabase } from '../lib/supabase';
import { RideListing } from '../types';

export interface RideRow {
  id?: string;
  user_id?: string;
  pickup_location: string;
  destination: string;
  departure_date?: string;
  departure_time?: string;
  available_seats?: number;
  total_seats?: number;
  price_per_person?: number;
  vehicle_type?: string;
  gender_preference?: string;
  status?: string;
  available_slots?: number;
  created_at?: string;
}

export const mapDbRideToRideListing = (row: any): RideListing => ({
  id: row.id,
  driverId: row.user_id,
  driverName: row.profiles?.name || 'Driver',
  driverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  driverTrustScore: row.profiles?.trust_score || 90,
  origin: row.pickup_location,
  destination: row.destination,
  date: row.departure_date || '',
  time: row.departure_time || '',
  seatsTotal: Number(row.total_seats) || 3,
  seatsAvailable: Number(row.available_seats) || 3,
  pricePerSeat: Number(row.price_per_person) || 0,
  vehicleModel: row.vehicle_type || 'Car',
  genderPreference: (row.gender_preference as any) || 'Everyone',
  isVerifiedDriver: true,
  distancePickup: row.pickup_location || 'Nearby',
  notes: '',
  status: row.status === 'active' ? 'available' : row.status === 'full' ? 'full' : 'completed',
});

// Core CRUD Functions

export const createRide = async (payload: Partial<RideRow>) => {
  console.log('=== ridesService.createRide START ===');
  console.log('Payload received:', JSON.stringify(payload, null, 2));

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user;
  console.log('[RIDE CREATE] Auth user:', user?.id, user?.email);
  if (authError) console.error('[RIDE CREATE] Auth error:', authError);

  if (!user) {
    console.error('[RIDE CREATE] NO USER — aborting insert');
    throw new Error('Please sign in first');
  }

  // Build exact-column payload — no 'id', no unknown columns
  const finalPayload: Record<string, any> = {
    user_id: user.id,
    pickup_location: (payload.pickup_location || '').trim(),
    destination: (payload.destination || '').trim(),
    departure_date: payload.departure_date || null,
    departure_time: payload.departure_time || null,
    available_seats: Number(payload.available_seats) || 3,
    total_seats: Number(payload.total_seats) || 4,
    price_per_person: Number(payload.price_per_person) || 0,
    vehicle_type: payload.vehicle_type || 'Car',
    gender_preference: payload.gender_preference || 'anyone',
    status: 'active',
    available_slots: Number(payload.available_seats) || 3,
  };

  console.log('Final payload being inserted:', JSON.stringify(finalPayload, null, 2));

  // STEP 1: INSERT only — no .select() to avoid RLS select-after-insert blocking
  const { error: insertErr, status: insertStatus } = await supabase
    .from('rides')
    .insert(finalPayload);

  console.log('INSERT HTTP status:', insertStatus);

  if (insertErr) {
    console.error('INSERT FAILED:', insertErr.code, insertErr.message, insertErr.details);
    throw new Error(insertErr.message);
  }

  console.log('INSERT succeeded — ride saved to DB');

  // STEP 2: Fetch the newly created row to return it
  const { data: rows, error: fetchErr } = await supabase
    .from('rides')
    .select('*')
    .eq('user_id', user.id)
    .eq('pickup_location', finalPayload.pickup_location)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr) {
    console.warn('INSERT succeeded but SELECT failed:', fetchErr.message);
    return [{ ...finalPayload, id: 'db-auto-generated' }];
  }

  const createdItem = rows?.[0] ?? { ...finalPayload };
  console.log('=== CREATE RIDE SUCCESS ===', createdItem);
  return [createdItem];
};

export const create = createRide;

export const getAllRides = async () => {
  const { data: rawRides, error: ridesErr } = await supabase
    .from('rides')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (ridesErr) {
    console.error('Error fetching rides:', ridesErr);
    throw ridesErr;
  }
  if (!rawRides || rawRides.length === 0) return [];

  const userIds = [...new Set(rawRides.map((r) => r.user_id).filter(Boolean))];
  let profiles: any[] = [];
  if (userIds.length > 0) {
    const { data: profData } = await supabase
      .from('profiles')
      .select('id, name, email, trust_score')
      .in('id', userIds);
    profiles = profData || [];
  }

  return rawRides.map((r) => ({
    ...r,
    profiles: profiles.find((p) => p.id === r.user_id) || null,
  }));
};

export const getAll = getAllRides;

export const getMyRides = async (userId?: string) => {
  const targetId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getByUser = getMyRides;
export const getUserRides = getMyRides;

export const updateRide = async (id: string, data: Partial<RideRow>) => {
  const { data: updated, error } = await supabase
    .from('rides')
    .update(data)
    .eq('id', id)
    .select();

  if (error) throw error;
  return updated ? updated[0] : null;
};

export const update = updateRide;
export const updateRideStatus = (rideId: string, status: string) => updateRide(rideId, { status });

export const deleteRide = async (id: string) => {
  const { error } = await supabase.from('rides').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const remove = deleteRide;

export const ridesService = {
  create,
  createRide,
  getAll,
  getAllRides,
  getByUser,
  getMyRides,
  getUserRides,
  update,
  updateRide,
  updateRideStatus,
  remove,
  deleteRide,
};

export default ridesService;
