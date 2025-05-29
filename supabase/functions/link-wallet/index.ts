// link-wallet.ts - Supabase Edge Function to securely link a wallet to a user
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  try {
    const { wallet_address, user_id } = await req.json();
    if (!wallet_address || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing wallet_address or user_id' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Connect to Supabase (service role key is injected automatically)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if wallet_address is already linked to another user
    const { data: existing, error: selectError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('wallet_address', wallet_address)
      .neq('user_id', user_id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // Ignore 'No rows found' error
      return new Response(JSON.stringify({ error: selectError.message }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    if (existing) {
      return new Response(JSON.stringify({ error: 'Wallet already linked to another account.' }), {
        status: 409,
        headers: CORS_HEADERS,
      });
    }

    // Update the user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_address })
      .eq('user_id', user_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});

// Helper: import createClient from supabase-js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'; 