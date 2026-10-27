import { supabase } from '../lib/supabase';

export interface ReportRow {
  id?: string;
  reporter_id: string;
  reported_user_id?: string;
  reported_listing_id?: string;
  reported_message_id?: string;
  service_type?: string;
  category: string;
  description?: string;
  screenshot_url?: string;
  status?: string; // 'pending' | 'resolved' | 'dismissed' | 'escalated'
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
}

export const reportService = {
  async createReport(data: Omit<ReportRow, 'id' | 'created_at'>) {
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        ...data,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return report;
  },

  async getMyReports() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async getAllReports() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_id(name, email, trust_score),
        reported_user:profiles!reported_user_id(name, email, trust_score)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: raw, error: rawErr } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (rawErr) throw rawErr;
      return raw || [];
    }
    return data || [];
  },

  async updateReportStatus(id: string, status: string, adminNotes?: string) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        admin_notes: adminNotes || undefined,
        reviewed_by: user?.id || undefined,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Send notification to reporter
    if (data?.reporter_id) {
      try {
        await supabase.from('notifications').insert({
          user_id: data.reporter_id,
          title: 'Report Update',
          body: `Your report has been reviewed and marked as ${status}.`,
          type: 'report',
          related_id: id,
        });
      } catch (e) {
        console.warn(e);
      }
    }

    return data;
  },

  async uploadScreenshot(file: File) {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `report_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('report-screenshots')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('report-screenshots')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};

export default reportService;
