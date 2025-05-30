// ai-grants.ts - Supabase Edge Function for AI-powered grant matching
// deno-lint-ignore-file no-explicit-any
// @deno-types="https://deno.land/std@0.181.0/server/mod.ts"
import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Add CORS headers helper
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

// Define Grant type
interface Grant {
  id: string;
  title: string;
  organization: string;
  description: string;
  tags?: string[];
  url?: string;
}

const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

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

  const { query } = await req.json();
  const apiKey = Deno.env.get('AI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI API key not set' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }

  // Improved Gemini prompt for robust keyword extraction
  const body = {
    contents: [{ parts: [{ text: `Extract a comma-separated list of keywords (no sentences, just words) from this user query for grant matching: ${query}` }]}]
  };

  try {
    // 1. Get keywords from Gemini
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const geminiData = await geminiRes.json();
    const keywordsText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // More flexible: split only on commas and trim
    const keywords = keywordsText
      .split(',')
      .map((k: string) => k.trim().toLowerCase())
      .filter((k: string) => k.length > 0);

    // Debug logging
    console.log('User query:', query);
    console.log('Gemini keywords:', keywords);

    // 2. Fetch all grants from Supabase
    const { data: grants, error } = await supabase.from('grants').select('*');
    if (error || !grants) {
      return new Response(JSON.stringify({ error: 'Failed to fetch grants' }), {
        status: 500,
        headers: corsHeaders(),
      });
    }
    console.log('Fetched grants:', grants.map(g => ({ title: g.title, tags: g.tags })));

    // 3. Filter grants by keywords (title, description, tags)
    const matches = (grants as Grant[]).filter((grant: Grant) => {
      const text = `${grant.title} ${grant.description} ${(grant.tags || []).join(' ')}`.toLowerCase();
      const queryLower = query.toLowerCase();
      
      // Special handling for women empowerment queries
      if (queryLower.includes('women') || queryLower.includes('female') || queryLower.includes('gender')) {
        return text.includes('women') || text.includes('female') || text.includes('gender') || 
               text.includes('empowerment') || text.includes('equality');
      }
      
      // Special handling for Web3/blockchain queries
      if (queryLower.includes('web3') || queryLower.includes('blockchain') || 
          queryLower.includes('dao') || queryLower.includes('decentralized') ||
          queryLower.includes('nft') || queryLower.includes('token')) {
        return text.includes('web3') || text.includes('blockchain') || 
               text.includes('dao') || text.includes('decentralized') ||
               text.includes('nft') || text.includes('token') ||
               text.includes('defi') || text.includes('crypto');
      }
      
      // Regular keyword matching for other queries
      return keywords.some((kw: string) => text.includes(kw));
    });

    // Fallback buildReason function for LLM errors
    function buildReason(grant: Grant, userQuery: string, matchedKeywords: string[]): string {
      const text = `${grant.title} ${grant.description} ${(grant.tags || []).join(' ')}`.toLowerCase();
      const grantMatched = matchedKeywords.filter(kw => text.includes(kw));
      const userMatched = grantMatched.filter(kw => userQuery.toLowerCase().includes(kw));
      let reason = '';
      if (userMatched.length > 0) {
        reason = `Your project matches because it focuses on: ${userMatched.join(', ')}. `;
      }
      if (grantMatched.length > 0 && userMatched.length === 0) {
        reason = `This grant supports: ${grantMatched.join(', ')}. `;
      }
      if (grant.description) {
        const firstSentence = grant.description.split('. ')[0];
        reason += firstSentence.length > 80 ? grant.description.slice(0, 80) + '...' : firstSentence;
      }
      return reason.trim();
    }

    // 4. For each top match, ask Gemini for a specific reason
    const topMatches = matches.slice(0, 2); // Limit to 2 for performance
    const detailedMatches: { title: string; organization: string; reason: string; id: string; url: string | null }[] = [];
    
    // Sort matches by relevance score
    const sortedMatches = topMatches.sort((a, b) => {
      const aText = `${a.title} ${a.description} ${(a.tags || []).join(' ')}`.toLowerCase();
      const bText = `${b.title} ${b.description} ${(b.tags || []).join(' ')}`.toLowerCase();
      const queryLower = query.toLowerCase();
      
      // Calculate relevance scores
      const aScore = [
        aText.includes('web3') && queryLower.includes('web3'),
        aText.includes('blockchain') && queryLower.includes('blockchain'),
        aText.includes('dao') && queryLower.includes('dao'),
        aText.includes('women') && queryLower.includes('women'),
        aText.includes('decentralized') && queryLower.includes('decentralized')
      ].filter(Boolean).length;
      
      const bScore = [
        bText.includes('web3') && queryLower.includes('web3'),
        bText.includes('blockchain') && queryLower.includes('blockchain'),
        bText.includes('dao') && queryLower.includes('dao'),
        bText.includes('women') && queryLower.includes('women'),
        bText.includes('decentralized') && queryLower.includes('decentralized')
      ].filter(Boolean).length;
      
      return bScore - aScore; // Higher score first
    });

    for (const g of sortedMatches) {
      let reason = '';
      try {
        const prompt = `Given this user's project focus: "${query}" and this grant: "${g.title}" by ${g.organization} (${g.description}), provide a specific 1-2 sentence explanation of why this grant is a good match. If the grant is not a good match, explain why briefly. Focus on concrete connections between the project's main theme and the grant's purpose.`;
        const reasonBody = {
          contents: [{ parts: [{ text: prompt }]}]
        };
        const reasonRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reasonBody)
        });
        const reasonData = await reasonRes.json();
        reason = reasonData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Validate the response
        if (reason.includes('[insert') || reason.includes('template') || reason.length < 10) {
          throw new Error('Invalid response format');
        }
      } catch {
        // fallback to previous logic
        reason = buildReason(g, query, keywords);
      }
      detailedMatches.push({
        title: g.title,
        organization: g.organization,
        reason,
        id: g.id,
        url: g.url || null
      });
    }

    // 5. Return detailed matches with user-friendly formatting and brevity
    function firstTwoSentences(text: string): string {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      return sentences.slice(0, 2).join(' ').trim();
    }
    
    // Validate matches before returning
    if (detailedMatches.length === 0 || detailedMatches.some(m => !m.reason || m.reason.includes('[insert'))) {
      return new Response(JSON.stringify({
        message: 'No relevant grants found. Please provide more details about your project.',
        grants: []
      }), {
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify({
      message: `Top matching grants:<br><br>${detailedMatches.map((g) => `• ${g.title} (${g.organization}):<br>  ${firstTwoSentences(g.reason)}`).join('<br><br>')}`,
      grants: detailedMatches
    }), {
      headers: corsHeaders(),
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to contact Gemini API or Supabase' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}); 