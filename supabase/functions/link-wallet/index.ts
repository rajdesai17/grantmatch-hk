// link-wallet.ts - Supabase Edge Function to securely link a wallet to a user
// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders(),
    });
  }

  try {
    const { wallet_address, user_id } = await req.json();
    if (!wallet_address || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing wallet_address or user_id' }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

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
        headers: corsHeaders(),
      });
    }

    if (existing) {
      return new Response(JSON.stringify({ error: 'Wallet already linked to another account.' }), {
        status: 409,
        headers: corsHeaders(),
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
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}); 