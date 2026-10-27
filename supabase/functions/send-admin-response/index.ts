import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  try {
    const { queryId, response } = await req.json();

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Not admin' }), { status: 403 });
    }

    const { data: query } = await supabase
      .from('user_queries')
      .select('*')
      .eq('id', queryId)
      .single();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query not found' }), { status: 404 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Subshare Support <onboarding@resend.dev>',
        to: query.user_email,
        subject: `Re: ${query.subject}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Response from Subshare Support</h2>
            <p>Hi ${query.user_name},</p>
            <p>${response.replace(/\n/g, '<br />')}</p>
            <hr />
            <p style="color: #666; font-size: 12px;">
              Query ID: ${query.id}
            </p>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: res.ok }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});