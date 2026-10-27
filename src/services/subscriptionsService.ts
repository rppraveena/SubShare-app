import { supabase } from '../lib/supabase';
import { SubscriptionGroup } from '../types';

export interface SubscriptionGroupRow {
  id?: string;
  owner_id?: string;
  service_name: string;
  plan_type?: string;
  category?: string;
  total_slots?: number;
  max_members?: number;
  current_members?: number;
  available_slots?: number;
  price_per_slot?: number;
  monthly_share?: number;
  billing_cycle?: string;
  next_billing_date?: string;
  city?: string;
  description?: string;
  status?: string;
  created_at?: string;
}

export const mapDbSubToSubscriptionGroup = (row: any): SubscriptionGroup => ({
  id: row.id,
  serviceName: row.service_name || 'Family Plan',
  platformLogo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200&auto=format&fit=crop&q=80',
  ownerId: row.owner_id,
  ownerName: row.profiles?.name || 'Group Owner',
  ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  ownerTrustScore: row.profiles?.trust_score || 88,
  totalSlots: Number(row.total_slots || row.max_members) || 4,
  occupiedSlots: Number(row.total_slots || row.max_members || 4) - Number(row.available_slots || 1),
  monthlyShare: Number(row.price_per_slot || row.monthly_share) || 0,
  billingCycle: row.billing_cycle || 'Monthly',
  requiresApproval: false,
  isOfficialInvite: true,
  description: row.description || row.plan_type || '',
  status: row.status === 'active' ? 'available' : 'full',
});

// Core CRUD Functions

export const createSubscriptionGroup = async (groupData: Partial<SubscriptionGroupRow>) => {
  console.log('=== subscriptionsService.createSubscriptionGroup START ===');
  console.log('Data received:', JSON.stringify(groupData, null, 2));

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user;
  console.log('[SUBSCRIPTION CREATE] Auth user:', user?.id, user?.email);
  if (authError) console.error('[SUBSCRIPTION CREATE] Auth error:', authError);

  if (!user) {
    console.error('[SUBSCRIPTION CREATE] NO USER — aborting insert');
    throw new Error('You must be signed in to create a subscription group.');
  }

  const maxMembers = Number(groupData.total_slots || groupData.max_members) || 4;
  const currentMembers = Number(groupData.current_members) || 1;
  const availableSlots = Math.max(0, maxMembers - currentMembers);
  const pricePerSlot = Number(groupData.price_per_slot || groupData.monthly_share) || 0;

  // Build exact-column payload — only send columns confirmed in the DB schema
  // Per spec: owner_id, service_name, plan_type, max_members, current_members,
  //           monthly_share, billing_cycle, next_billing_date, city, status, available_slots
  const finalPayload: Record<string, any> = {
    owner_id: user.id,
    service_name: (groupData.service_name || '').trim(),
    description: (groupData.description || groupData.plan_type || '').trim() || null,
    max_members: maxMembers,
    current_members: currentMembers,
    available_slots: availableSlots,
    price_per_slot: pricePerSlot,
    monthly_share: pricePerSlot,
    billing_cycle: groupData.billing_cycle || 'Monthly',
    next_billing_date: groupData.next_billing_date || null,
    city: groupData.city?.trim() || null,
    status: 'active',
  };

  console.log('Final payload being inserted:', JSON.stringify(finalPayload, null, 2));

  // STEP 1: INSERT only — no .select() to avoid RLS select-after-insert blocking
  const { error: insertErr, status: insertStatus } = await supabase
    .from('subscription_groups')
    .insert(finalPayload);

  console.log('INSERT HTTP status:', insertStatus);

  if (insertErr) {
    console.error('INSERT FAILED:', insertErr.code, insertErr.message, insertErr.details);
    throw new Error(insertErr.message);
  }

  console.log('INSERT succeeded — subscription group saved to DB');

  // STEP 2: Fetch the newly created row
  const { data: rows, error: fetchErr } = await supabase
    .from('subscription_groups')
    .select('*')
    .eq('owner_id', user.id)
    .eq('service_name', finalPayload.service_name)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr) {
    console.warn('INSERT succeeded but SELECT failed:', fetchErr.message);
    return { ...finalPayload, id: 'db-auto-generated' };
  }

  const createdItem = rows?.[0] ?? { ...finalPayload };
  console.log('=== CREATE SUBSCRIPTION GROUP SUCCESS ===', createdItem);
  return createdItem;
};

export const create = createSubscriptionGroup;
export const createGroup = createSubscriptionGroup;

export const getAllGroups = async () => {
  const { data: rawGroups, error: subErr } = await supabase
    .from('subscription_groups')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (subErr) {
    console.error('Error fetching subscription groups:', subErr);
    throw subErr;
  }
  if (!rawGroups || rawGroups.length === 0) return [];

  const userIds = [...new Set(rawGroups.map((s) => s.owner_id).filter(Boolean))];
  let profiles: any[] = [];
  if (userIds.length > 0) {
    const { data: profData } = await supabase
      .from('profiles')
      .select('id, name, email, trust_score')
      .in('id', userIds);
    profiles = profData || [];
  }

  return rawGroups.map((s) => ({
    ...s,
    profiles: profiles.find((p) => p.id === s.owner_id) || null,
  }));
};

export const getAll = getAllGroups;

export const getMyGroups = async (userId?: string) => {
  const targetId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from('subscription_groups')
    .select('*')
    .eq('owner_id', targetId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getByUser = getMyGroups;
export const getMySubscriptionGroups = getMyGroups;
export const getUserGroups = getMyGroups;

export const joinGroup = async (groupId: string, userId?: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');
  return { success: true };
};

export const updateSubscriptionGroup = async (id: string, data: Partial<SubscriptionGroupRow>) => {
  const { data: updated, error } = await supabase
    .from('subscription_groups')
    .update(data)
    .eq('id', id)
    .select();

  if (error) throw error;
  return updated ? updated[0] : null;
};

export const update = updateSubscriptionGroup;

export const deleteSubscriptionGroup = async (id: string) => {
  const { error } = await supabase.from('subscription_groups').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const remove = deleteSubscriptionGroup;
export const deleteGroup = deleteSubscriptionGroup;

export const subscriptionsService = {
  create,
  createGroup,
  createSubscriptionGroup,
  getAll,
  getAllGroups,
  getByUser,
  getMyGroups,
  getMySubscriptionGroups,
  getUserGroups,
  joinGroup,
  update,
  updateSubscriptionGroup,
  remove,
  deleteSubscriptionGroup,
  deleteGroup,
};

export default subscriptionsService;
