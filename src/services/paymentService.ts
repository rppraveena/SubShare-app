import { supabase } from '../lib/supabase';

export interface PaymentRow {
  id?: string;
  payer_id: string;
  receiver_id: string;
  service_type?: string;
  listing_id?: string;
  amount: number;
  status?: string; // 'pending' | 'marked_paid' | 'completed' | 'overdue'
  due_date?: string;
  paid_at?: string;
  confirmed_at?: string;
  upi_reference?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const paymentService = {
  async createPayment(data: Omit<PaymentRow, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          ...data,
          status: data.status || 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert payment failed:', error.message);
        throw error;
      }
      return payment;
    } catch (err: any) {
      console.error('Error in paymentService.createPayment:', err?.message || err);
      throw err;
    }
  },

  /** Task 3: Fetch payments where payer_id = currentUser.id OR receiver_id = currentUser.id and join with profiles */
  async getMyPayments() {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        console.error('Supabase auth error in getMyPayments:', authErr?.message || 'Not authenticated');
        return [];
      }

      const { data: rawPayments, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .or(`payer_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (payErr) {
        console.error('Supabase select payments failed:', payErr.message);
        throw payErr;
      }

      if (!rawPayments || rawPayments.length === 0) return [];

      const userIds = [
        ...new Set(
          rawPayments.flatMap((p) => [p.payer_id, p.receiver_id]).filter(Boolean)
        ),
      ];

      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('id, name, email, phone, trust_score, profile_photo_url')
          .in('id', userIds);

        if (profErr) {
          console.error('Supabase select profiles for payments failed:', profErr.message);
        } else {
          profiles = profData || [];
        }
      }

      return rawPayments.map((p) => ({
        ...p,
        payer: profiles.find((prof) => prof.id === p.payer_id) || { id: p.payer_id, name: 'Payer' },
        receiver: profiles.find((prof) => prof.id === p.receiver_id) || { id: p.receiver_id, name: 'Receiver' },
      }));
    } catch (err: any) {
      console.error('Error in paymentService.getMyPayments:', err?.message || err);
      return [];
    }
  },

  /** Task 3: Payer marks payment as paid -> status = 'marked_paid' */
  async markAsPaid(paymentId: string, upiReference?: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'marked_paid',
          upi_reference: upiReference || undefined,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update payment markAsPaid failed:', error.message);
        throw error;
      }

      // Send notification to receiver
      if (data?.receiver_id) {
        try {
          const notifPayload = {
            user_id: data.receiver_id,
            title: 'Payment Marked as Paid',
            message: `Payer marked ₹${data.amount} as paid. Please verify & confirm.`,
            body: `Payer marked ₹${data.amount} as paid. Please verify & confirm.`,
            type: 'payment',
            related_id: paymentId,
            action_url: '/payments',
          };
          const { error: notifErr } = await supabase.from('notifications').insert(notifPayload);
          if (notifErr) console.error('Supabase insert notification in markAsPaid failed:', notifErr.message);
        } catch (e: any) {
          console.error('Error sending markAsPaid notification:', e?.message || e);
        }
      }

      return data;
    } catch (err: any) {
      console.error('Error in paymentService.markAsPaid:', err?.message || err);
      throw err;
    }
  },

  /** Task 3: Receiver confirms payment -> status = 'completed' */
  async confirmPayment(paymentId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update payment confirmPayment failed:', error.message);
        throw error;
      }

      if (data?.payer_id) {
        try {
          const notifPayload = {
            user_id: data.payer_id,
            title: 'Payment Confirmed',
            message: `Receiver confirmed your ₹${data.amount} payment!`,
            body: `Receiver confirmed your ₹${data.amount} payment!`,
            type: 'payment',
            related_id: paymentId,
            action_url: '/payments',
          };
          const { error: notifErr } = await supabase.from('notifications').insert(notifPayload);
          if (notifErr) console.error('Supabase insert notification in confirmPayment failed:', notifErr.message);
        } catch (e: any) {
          console.error('Error sending confirmPayment notification:', e?.message || e);
        }
      }

      return data;
    } catch (err: any) {
      console.error('Error in paymentService.confirmPayment:', err?.message || err);
      throw err;
    }
  },
};

export default paymentService;
