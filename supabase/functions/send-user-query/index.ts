import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = 'rkppraveena@gmail.com';

serve(async (req) => {
  try {
    const { queryId } = await req.json();

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    // Fetch the query
    const { data: query, error } = await supabase
      .from('user_queries')
      .select('*')
      .eq('id', queryId)
      .eq('user_id', user.id)
      .single();

    if (error || !query) {
      return new Response(JSON.stringify({ error: 'Query not found' }), { status: 404 });
    }

    // Send email to admin via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Subshare <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        reply_to: query.user_email,
        subject: `[Subshare ${query.category}] ${query.subject}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Query from Subshare User</h2>
            <p><strong>From:</strong> ${query.user_name} (${query.user_email})</p>
            <p><strong>Category:</strong> ${query.category}</p>
            <p><strong>Subject:</strong> ${query.subject}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p>${query.message.replace(/\n/g, '<br />')}</p>
            ${query.screenshot_url ? `<p><a href="${query.screenshot_url}">View Screenshot</a></p>` : ''}
            <hr />
            <p style="color: #666; font-size: 12px;">
              Query ID: ${query.id}<br />
              Submitted: ${query.created_at}
            </p>
          </div>
        `,
      }),
    });

    const result = await res.json();

    return new Response(JSON.stringify({ success: res.ok, result }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});