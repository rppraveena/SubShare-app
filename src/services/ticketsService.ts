import { supabase } from '../lib/supabase';
import { TicketListing } from '../types';

export interface TicketRow {
  id?: string;
  user_id?: string;
  event_name: string;
  event_type?: string;
  venue?: string;
  event_date?: string;
  event_time?: string;
  seat_number?: string;
  quantity: number;
  original_price?: number;
  selling_price?: number;
  transfer_method?: string;
  proof_image_url?: string;
  status?: string;
  available_slots?: number;
  created_at?: string;
}

export const mapDbTicketToTicketListing = (row: any): TicketListing => ({
  id: row.id,
  title: row.event_name || 'Event Ticket',
  eventType: (row.event_type as any) || 'other',
  venue: row.venue || 'Venue',
  city: 'Local Area',
  date: row.event_date || '',
  time: row.event_time || '',
  seats: row.seat_number || 'General',
  quantity: Number(row.quantity) || 1,
  originalPrice: Number(row.original_price) || 0,
  sellingPrice: Number(row.selling_price) || 0,
  sellerId: row.user_id,
  sellerName: row.profiles?.name || 'Ticket Seller',
  sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  sellerTrustScore: row.profiles?.trust_score || 85,
  isVerified: true,
  verificationScore: 95,
  verificationConfidence: 'High',
  image: row.proof_image_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
  transferMethod: row.transfer_method || 'In-App Transfer',
  status: row.status === 'active' ? 'available' : row.status === 'sold' ? 'sold' : 'available',
});

// Core CRUD Functions

export const createTicket = async (payload: Partial<TicketRow>) => {
  console.log('=== ticketsService.createTicket START ===');
  console.log('Payload received:', JSON.stringify(payload, null, 2));

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user;
  console.log('[TICKET CREATE] Auth user:', user?.id, user?.email);
  if (authError) console.error('[TICKET CREATE] Auth error:', authError);

  if (!user) {
    console.error('[TICKET CREATE] NO USER — aborting insert');
    throw new Error('Please sign in first');
  }

  const finalPayload: Record<string, any> = {
    user_id: user.id,  // always override from auth
    event_name: (payload.event_name || '').trim(),
    event_type: payload.event_type || 'Concert',
    venue: payload.venue?.trim() || null,
    event_date: payload.event_date || null,
    event_time: payload.event_time || null,
    seat_number: payload.seat_number?.trim() || null,
    quantity: Number(payload.quantity) || 1,
    original_price: payload.original_price != null ? Number(payload.original_price) : null,
    selling_price: payload.selling_price != null ? Number(payload.selling_price) : null,
    transfer_method: payload.transfer_method || 'Email',
    status: 'active',
    available_slots: Number(payload.quantity) || 1,
  };
  // Explicitly do NOT include 'id' — DB auto-generates it

  console.log('Final payload being inserted:', JSON.stringify(finalPayload, null, 2));

  // STEP 1: INSERT only — no .select() to avoid RLS select-after-insert blocking
  const { error: insertErr, status: insertStatus } = await supabase
    .from('tickets')
    .insert(finalPayload);

  console.log('INSERT HTTP status:', insertStatus);

  if (insertErr) {
    console.error('INSERT FAILED:', insertErr.code, insertErr.message, insertErr.details);
    throw new Error(insertErr.message);
  }

  console.log('INSERT succeeded — row saved to DB');

  // STEP 2: Fetch the newly created row
  const { data: rows, error: fetchErr } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .eq('event_name', finalPayload.event_name)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr) {
    console.warn('INSERT succeeded but SELECT failed:', fetchErr.message);
    return [{ ...finalPayload, id: 'db-auto-generated' }];
  }

  const createdItem = rows?.[0] ?? { ...finalPayload };
  console.log('=== CREATE TICKET SUCCESS ===', createdItem);
  return [createdItem];
};

export const create = createTicket;

export const getAllTickets = async () => {
  const { data: rawTickets, error: ticketsErr } = await supabase
    .from('tickets')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (ticketsErr) {
    console.error('Error fetching tickets:', ticketsErr);
    throw ticketsErr;
  }
  if (!rawTickets || rawTickets.length === 0) return [];

  const userIds = [...new Set(rawTickets.map((t) => t.user_id).filter(Boolean))];
  let profiles: any[] = [];
  if (userIds.length > 0) {
    const { data: profData } = await supabase
      .from('profiles')
      .select('id, name, email, trust_score')
      .in('id', userIds);
    profiles = profData || [];
  }

  return rawTickets.map((t) => ({
    ...t,
    profiles: profiles.find((p) => p.id === t.user_id) || null,
  }));
};

export const getAll = getAllTickets;

export const getMyTickets = async (userId?: string) => {
  const targetId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getByUser = getMyTickets;
export const getTicketsByUser = getMyTickets;
export const getUserTickets = getMyTickets;

export const updateTicket = async (id: string, data: Partial<TicketRow>) => {
  const { data: updated, error } = await supabase
    .from('tickets')
    .update(data)
    .eq('id', id)
    .select();

  if (error) throw error;
  return updated ? updated[0] : null;
};

export const update = updateTicket;
export const updateTicketStatus = (ticketId: string, status: string) => updateTicket(ticketId, { status });

export const deleteTicket = async (id: string) => {
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const remove = deleteTicket;

export const ticketsService = {
  create,
  createTicket,
  getAll,
  getAllTickets,
  getByUser,
  getMyTickets,
  getTicketsByUser,
  update,
  updateTicket,
  updateTicketStatus,
  remove,
  deleteTicket,
};

export default ticketsService;
