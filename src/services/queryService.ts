import { supabase } from '../lib/supabase';

export interface UserQueryRow {
  id?: string;
  user_id?: string;
  user_email: string;
  user_name?: string;
  category: string;
  subject: string;
  message: string;
  screenshot_url?: string;
  status?: string; // 'open' | 'responded' | 'closed'
  admin_response?: string;
  responded_by?: string;
  responded_at?: string;
  created_at?: string;
}

export const queryService = {
  async createQuery(data: {
    category: string;
    subject: string;
    message: string;
    screenshotFile?: File;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .maybeSingle();

    let screenshotUrl = null;

    if (data.screenshotFile) {
      const fileName = `${user.id}/${Date.now()}-${data.screenshotFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('query-screenshots')
        .upload(fileName, data.screenshotFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('query-screenshots')
          .getPublicUrl(fileName);

        screenshotUrl = publicUrl;
      }
    }

    const { data: query, error } = await supabase
      .from('user_queries')
      .insert({
        user_id: user.id,
        user_email: user.email || profile?.email || 'user@subshare.app',
        user_name: profile?.name || user.email?.split('@')[0] || 'User',
        category: data.category,
        subject: data.subject,
        message: data.message,
        screenshot_url: screenshotUrl,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger Edge Function to send email
    try {
      await supabase.functions.invoke('send-user-query', {
        body: { queryId: query.id },
      });
    } catch (emailError) {
      console.warn('Email sending via edge function skipped or failed:', emailError);
    }

    return query;
  },

  async getMyQueries() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_queries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async getAllQueries() {
    const { data, error } = await supabase
      .from('user_queries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async respondToQuery(id: string, response: string) {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('user_queries')
      .update({
        admin_response: response,
        responded_by: user?.id,
        responded_at: new Date().toISOString(),
        status: 'responded',
      })
      .eq('id', id);

    if (error) throw error;
  },

  async closeQuery(id: string) {
    const { error } = await supabase
      .from('user_queries')
      .update({ status: 'closed' })
      .eq('id', id);

    if (error) throw error;
  },
};

export default queryService;
