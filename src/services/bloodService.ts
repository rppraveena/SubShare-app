import { supabase } from '../lib/supabase';
import { BloodRequest } from '../types';

export interface BloodRequestRow {
  id?: string;
  user_id?: string;
  patient_name?: string;
  blood_group: string;
  units_needed?: number;
  hospital_name?: string;
  hospital_location?: string;
  city?: string;
  required_before?: string;
  contact_number?: string;
  contact_person?: string;
  contact_phone?: string;
  urgency?: string;
  reason?: string;
  status?: string;
  available_slots?: number;
  created_at?: string;
}

export const mapDbBloodToBloodRequest = (row: any): BloodRequest => ({
  id: row.id,
  patientName: row.patient_name || 'Emergency Patient',
  requesterId: row.user_id,
  bloodGroup: (row.blood_group as any) || 'O+',
  unitsRequired: Number(row.units_needed) || 1,
  unitsFulfilled: 0,
  hospital: row.hospital_name || 'Hospital',
  location: row.city || row.hospital_location || 'Emergency Location',
  distance: row.city || 'Nearby',
  requiredBefore: row.required_before || 'Urgent',
  attenderContact: row.contact_number || row.contact_phone || '',
  urgency: 'Within 24 Hours',
  isVerifiedHospital: true,
  verifiedByDoc: true,
  status: 'open',
  createdAt: row.created_at || new Date().toISOString(),
  notes: row.reason || '',
});

// Core CRUD Functions

export const createBloodRequest = async (data: Partial<BloodRequestRow>) => {
  console.log('=== bloodService.createBloodRequest START ===');
  console.log('Data received:', JSON.stringify(data, null, 2));

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user;
  console.log('[BLOOD CREATE] Auth user:', user?.id, user?.email);
  if (authError) console.error('[BLOOD CREATE] Auth error:', authError);

  if (!user) {
    console.error('[BLOOD CREATE] NO USER — aborting insert');
    throw new Error('You must be signed in to create a blood request.');
  }

  // Build exact-column payload — only include columns that exist in DB
  const finalPayload: Record<string, any> = {
    user_id: user.id,
    blood_group: data.blood_group || 'O+',
    units_needed: Number(data.units_needed) || 1,
    hospital_name: (data.hospital_name || '').trim(),
    hospital_location: (data.hospital_location || data.city || '').trim() || null,
    city: (data.city || data.hospital_location || '').trim() || null,
    contact_person: (data.contact_person || '').trim() || null,
    contact_phone: (data.contact_phone || data.contact_number || '').trim() || null,
    contact_number: (data.contact_number || data.contact_phone || '').trim() || null,
    reason: data.reason || null,
    urgency: data.urgency || 'Normal',
    required_before: data.required_before || null,
    status: 'active',
    available_slots: Number(data.units_needed) || 1,
  };

  console.log('Final payload being inserted:', JSON.stringify(finalPayload, null, 2));

  // STEP 1: INSERT only — no .select() to avoid RLS select-after-insert blocking
  const { error: insertErr, status: insertStatus } = await supabase
    .from('blood_requests')
    .insert(finalPayload);

  console.log('INSERT HTTP status:', insertStatus);

  if (insertErr) {
    console.error('INSERT FAILED:', insertErr.code, insertErr.message, insertErr.details);
    throw new Error(insertErr.message);
  }

  console.log('INSERT succeeded — blood request saved to DB');

  // STEP 2: Fetch the newly created row
  const { data: rows, error: fetchErr } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('user_id', user.id)
    .eq('blood_group', finalPayload.blood_group)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr) {
    console.warn('INSERT succeeded but SELECT failed:', fetchErr.message);
    return { ...finalPayload, id: 'db-auto-generated' };
  }

  const createdItem = rows?.[0] ?? { ...finalPayload };
  console.log('=== CREATE BLOOD REQUEST SUCCESS ===', createdItem);
  return createdItem;
};

export const create = createBloodRequest;
export const createRequest = createBloodRequest;

export const getActiveRequests = async () => {
  const { data: rawRequests, error: reqErr } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (reqErr) {
    console.error('Error fetching blood requests:', reqErr);
    throw reqErr;
  }
  if (!rawRequests || rawRequests.length === 0) return [];

  const userIds = [...new Set(rawRequests.map((r) => r.user_id).filter(Boolean))];
  let profiles: any[] = [];
  if (userIds.length > 0) {
    const { data: profData } = await supabase
      .from('profiles')
      .select('id, name, email, trust_score')
      .in('id', userIds);
    profiles = profData || [];
  }

  return rawRequests.map((r) => ({
    ...r,
    profiles: profiles.find((p) => p.id === r.user_id) || null,
  }));
};

export const getAll = getActiveRequests;
export const getAllRequests = getActiveRequests;
export const getActiveBloodRequests = getActiveRequests;

export const getMyRequests = async (userId?: string) => {
  const targetId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getByUser = getMyRequests;
export const getBloodRequestsByUser = getMyRequests;

export const updateBloodRequest = async (id: string, data: Partial<BloodRequestRow>) => {
  const { data: updated, error } = await supabase
    .from('blood_requests')
    .update(data)
    .eq('id', id)
    .select();

  if (error) throw error;
  return updated ? updated[0] : null;
};

export const update = updateBloodRequest;

export const deleteBloodRequest = async (id: string) => {
  const { error } = await supabase.from('blood_requests').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const remove = deleteBloodRequest;
export const deleteRequest = deleteBloodRequest;

export const bloodService = {
  create,
  createRequest,
  createBloodRequest,
  getAll,
  getActiveRequests,
  getActiveBloodRequests,
  getAllRequests,
  getByUser,
  getMyRequests,
  getBloodRequestsByUser,
  update,
  updateBloodRequest,
  remove,
  deleteBloodRequest,
  deleteRequest,
};

export default bloodService;
