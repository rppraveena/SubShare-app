import { supabase } from '../lib/supabase';

export interface ServiceRequestRow {
  id?: string;
  sender_id?: string;
  receiver_id: string;
  service_type: string;
  listing_id: string;
  message?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const requestsService = {
  async createRequest(data: {
    receiver_id: string;
    service_type: string;
    listing_id: string;
    message?: string;
  }) {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        console.error('Request Error: Supabase auth error in createRequest:', authErr?.message || 'Not authenticated');
        throw new Error('Not authenticated');
      }

      const payload = {
        sender_id: user.id,
        receiver_id: data.receiver_id,
        service_type: data.service_type,
        listing_id: data.listing_id,
        message: data.message || null,
        status: 'pending',
      };

      console.log('Sending Request Payload:', payload);

      const { data: requestData, error } = await supabase
        .from('service_requests')
        .insert(payload)
        .select();

      console.log('Request Inserted:', requestData);
      console.error('Request Error:', error);

      if (error) {
        console.error('Request Error:', error);
        throw error;
      }
      if (!requestData || requestData.length === 0) {
        console.error('Request Error: Failed to create request — no data returned');
        throw new Error('Failed to create request — no data returned');
      }

      const request = requestData[0];

      // Send Notification to Receiver (TASK 1)
      try {
        const notifPayload: any = {
          user_id: data.receiver_id,
          title: 'New Request',
          message: `Someone wants to join your ${data.service_type}`,
          body: `Someone wants to join your ${data.service_type}`,
          type: 'request',
          related_id: request.id,
          action_url: '/requests',
        };
        const { error: notifErr } = await supabase.from('notifications').insert(notifPayload);
        if (notifErr) {
          console.error('Request Error: Notification insert failed:', notifErr.message);
        }
      } catch (e: any) {
        console.error('Request Error: Failed to send request notification:', e?.message || e);
      }

      return request;
    } catch (err: any) {
      console.error('Request Error in requestsService.createRequest:', err?.message || err);
      throw err;
    }
  },

  /** TASK 1: Join query for incoming requests explicitly specifying profiles!sender_id with two-query fallback */
  async getIncomingRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: joinedRequests, error: joinErr } = await supabase
        .from('service_requests')
        .select('*, sender:profiles!sender_id(id, name, email, phone, trust_score, profile_photo_url, email_verified, phone_verified, verification_status, show_contact, show_phone, city, bio)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (!joinErr && joinedRequests) {
        return joinedRequests.map((r: any) => ({
          ...r,
          sender: r.sender || { name: 'SubShare User' },
        }));
      }

      const { data: rawRequests, error: reqErr } = await supabase
        .from('service_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (reqErr) throw reqErr;
      if (!rawRequests || rawRequests.length === 0) return [];

      const senderIds = [...new Set(rawRequests.map((r) => r.sender_id).filter(Boolean))];
      let profiles: any[] = [];
      if (senderIds.length > 0) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, name, email, phone, trust_score, profile_photo_url, email_verified, phone_verified, verification_status, show_contact, show_phone, city, bio')
          .in('id', senderIds);
        profiles = profData || [];
      }

      return rawRequests.map((r) => ({
        ...r,
        sender: profiles.find((p) => p.id === r.sender_id) || { name: 'SubShare User' },
      }));
    } catch (err: any) {
      console.error('Error in getIncomingRequests:', err?.message || err);
      return [];
    }
  },

  /** TASK 1: Join query for outgoing requests explicitly specifying profiles!receiver_id with two-query fallback */
  async getOutgoingRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: joinedRequests, error: joinErr } = await supabase
        .from('service_requests')
        .select('*, receiver:profiles!receiver_id(id, name, email, phone, trust_score, profile_photo_url)')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (!joinErr && joinedRequests) {
        return joinedRequests.map((r: any) => ({
          ...r,
          receiver: r.receiver || { name: 'Listing Owner' },
        }));
      }

      const { data: rawRequests, error: reqErr } = await supabase
        .from('service_requests')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (reqErr) throw reqErr;
      if (!rawRequests || rawRequests.length === 0) return [];

      const receiverIds = [...new Set(rawRequests.map((r) => r.receiver_id).filter(Boolean))];
      let profiles: any[] = [];
      if (receiverIds.length > 0) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, name, email, phone, trust_score, profile_photo_url')
          .in('id', receiverIds);
        profiles = profData || [];
      }

      return rawRequests.map((r) => ({
        ...r,
        receiver: profiles.find((p) => p.id === r.receiver_id) || { name: 'Listing Owner' },
      }));
    } catch (err: any) {
      console.error('Error in getOutgoingRequests:', err?.message || err);
      return [];
    }
  },

  /** Fetch pending requests for listing owner */
  async getOwnerPendingRequests(listingId?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('service_requests')
        .select('*, sender:profiles!sender_id(id, name, email, phone, trust_score, profile_photo_url, email_verified, phone_verified, verification_status, show_contact, show_phone, city, bio)')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (listingId) {
        query = query.eq('listing_id', listingId);
      }

      const { data: joinedRequests, error: joinErr } = await query;
      if (!joinErr && joinedRequests) {
        return joinedRequests.map((r: any) => ({
          ...r,
          sender: r.sender || { name: 'SubShare User' },
        }));
      }

      let fallbackQuery = supabase
        .from('service_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (listingId) fallbackQuery = fallbackQuery.eq('listing_id', listingId);

      const { data: rawRequests, error: reqErr } = await fallbackQuery;
      if (reqErr) throw reqErr;
      if (!rawRequests || rawRequests.length === 0) return [];

      const senderIds = [...new Set(rawRequests.map((r) => r.sender_id).filter(Boolean))];
      let profiles: any[] = [];
      if (senderIds.length > 0) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, name, email, phone, trust_score, profile_photo_url, email_verified, phone_verified, verification_status, show_contact, show_phone, city, bio')
          .in('id', senderIds);
        profiles = profData || [];
      }

      return rawRequests.map((r) => ({
        ...r,
        sender: profiles.find((p) => p.id === r.sender_id) || { name: 'SubShare User' },
      }));
    } catch (err: any) {
      console.error('Error in getOwnerPendingRequests:', err?.message || err);
      return [];
    }
  },

  async checkPendingRequest(listingId: string, serviceType: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('service_requests')
        .select('id')
        .eq('sender_id', user.id)
        .eq('listing_id', listingId)
        .eq('service_type', serviceType)
        .eq('status', 'pending')
        .limit(1);

      if (error) return false;
      return !!(data && data.length > 0);
    } catch (err: any) {
      console.error('Error in checkPendingRequest:', err?.message || err);
      return false;
    }
  },

  async getPendingCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('service_requests')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) return 0;
      return count || 0;
    } catch (err: any) {
      console.error('Error in getPendingCount:', err?.message || err);
      return 0;
    }
  },

  /** TASK 2: Accept request logic */
  async acceptRequest(id: string) {
    try {
      const { data: req, error: reqErr } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (reqErr || !req) {
        console.error('Error fetching service_request by id:', reqErr?.message || 'Request not found');
        throw new Error('Service request not found');
      }

      let price = 0;
      let title = 'Service Listing';
      if (req.listing_id) {
        try {
          const sType = (req.service_type || '').toLowerCase();
          if (sType.includes('ticket')) {
            const { data: ticket } = await supabase.from('tickets').select('*').eq('id', req.listing_id).maybeSingle();
            if (ticket) {
              price = Number(ticket.selling_price ?? ticket.original_price ?? 0);
              title = ticket.event_name || 'Ticket Listing';
            }
          } else if (sType.includes('ride')) {
            const { data: ride } = await supabase.from('rides').select('*').eq('id', req.listing_id).maybeSingle();
            if (ride) {
              price = Number(ride.price_per_person ?? 0);
              title = ride.destination ? `${ride.pickup_location || ''} → ${ride.destination}` : 'Ride Offer';
            }
          } else if (sType.includes('sub')) {
            const { data: sub } = await supabase.from('subscription_groups').select('*').eq('id', req.listing_id).maybeSingle();
            if (sub) {
              price = Number(sub.monthly_share ?? 0);
              title = sub.service_name || 'Subscription Group';
            }
          } else if (sType.includes('food')) {
            const { data: food } = await supabase.from('food_donations').select('*').eq('id', req.listing_id).maybeSingle();
            if (food) {
              price = 0;
              title = food.food_type || 'Food Donation';
            }
          }
        } catch (lErr: any) {
          console.error('Error fetching listing details:', lErr?.message || lErr);
        }
      }

      // 1. Update service_requests status = 'accepted'
      const { error: updateErr } = await supabase
        .from('service_requests')
        .update({ status: 'accepted' })
        .eq('id', id);

      if (updateErr) {
        console.error('Supabase update service_requests failed:', updateErr.message);
        throw updateErr;
      }

      // 2. Insert chat_rooms record with participant_ids: [sender_id, receiver_id]
      const participantIds = [req.sender_id, req.receiver_id].sort();
      let roomId = '';

      try {
        const { data: existingRooms } = await supabase
          .from('chat_rooms')
          .select('*')
          .contains('participant_ids', participantIds);

        if (existingRooms && existingRooms.length > 0) {
          roomId = existingRooms[0].id;
        } else {
          const { data: newRoom, error: roomErr } = await supabase
            .from('chat_rooms')
            .insert({
              participant_ids: participantIds,
              request_id: req.id,
              last_message: 'Request accepted',
              last_message_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (roomErr) {
            console.error('Supabase insert chat_rooms failed:', roomErr.message);
          } else {
            roomId = newRoom?.id || '';
          }
        }
      } catch (roomErr: any) {
        console.error('Error creating chat room:', roomErr?.message || roomErr);
      }

      // 3. Insert payment record into payments table
      try {
        const { error: payErr } = await supabase
          .from('payments')
          .insert({
            payer_id: req.sender_id,
            receiver_id: req.receiver_id,
            amount: price,
            status: 'pending',
            listing_id: req.listing_id,
            service_type: req.service_type || 'service',
          });

        if (payErr) {
          console.error('Supabase insert payments failed:', payErr.message);
        }
      } catch (payErr: any) {
        console.error('Error creating payment record:', payErr?.message || payErr);
      }

      // 4. Insert notifications record for the sender
      try {
        const notifData = {
          user_id: req.sender_id,
          title: 'Request Accepted',
          message: 'Your request was accepted.',
          body: 'Your request was accepted.',
          type: 'request',
          related_id: req.id,
          action_url: roomId ? `/chat/${roomId}` : '/chat',
        };

        const { error: notifErr } = await supabase.from('notifications').insert(notifData);
        if (notifErr) {
          console.error('Supabase insert notifications failed:', notifErr.message);
        }
      } catch (notifErr: any) {
        console.error('Error sending notification to sender:', notifErr?.message || notifErr);
      }

      return { success: true, roomId, price, title };
    } catch (err: any) {
      console.error('=== acceptRequest FAILED ===', err?.message || err);
      throw err;
    }
  },

  async rejectRequest(id: string) {
    try {
      const { data: req, error } = await supabase
        .from('service_requests')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Supabase update service_requests reject failed:', error.message);
        throw error;
      }

      if (req?.sender_id) {
        try {
          const notifPayload = {
            user_id: req.sender_id,
            title: 'Request Declined',
            message: 'Your request was declined by the owner.',
            body: 'Your request was declined by the owner.',
            type: 'request',
            related_id: id,
          };
          await supabase.from('notifications').insert(notifPayload);
        } catch (e: any) {
          console.error('Error inserting decline notification:', e?.message || e);
        }
      }
    } catch (err: any) {
      console.error('Error in rejectRequest:', err?.message || err);
      throw err;
    }
  },

  async cancelRequest(id: string) {
    try {
      const { data: req, error } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Supabase update service_requests cancel failed:', error.message);
        throw error;
      }

      if (req?.receiver_id) {
        try {
          const notifPayload = {
            user_id: req.receiver_id,
            title: 'Request Cancelled',
            message: 'A pending request on your listing was cancelled by the requester.',
            body: 'A pending request on your listing was cancelled by the requester.',
            type: 'request',
            related_id: id,
          };
          await supabase.from('notifications').insert(notifPayload);
        } catch (e: any) {
          console.error('Error inserting cancel notification:', e?.message || e);
        }
      }
    } catch (err: any) {
      console.error('Error in cancelRequest:', err?.message || err);
      throw err;
    }
  },

  acceptRequestWithAutoReject: async (id: string, _listingId?: string, _serviceType?: string) => {
    return requestsService.acceptRequest(id);
  },
};

export const createRequest = requestsService.createRequest;
export const getIncomingRequests = requestsService.getIncomingRequests;
export const getOutgoingRequests = requestsService.getOutgoingRequests;
export const getOwnerPendingRequests = requestsService.getOwnerPendingRequests;
export const checkPendingRequest = requestsService.checkPendingRequest;
export const getPendingCount = requestsService.getPendingCount;
export const acceptRequestWithAutoReject = requestsService.acceptRequest;
export const acceptRequest = requestsService.acceptRequest;
export const rejectRequest = requestsService.rejectRequest;
export const cancelRequest = requestsService.cancelRequest;

export default requestsService;
