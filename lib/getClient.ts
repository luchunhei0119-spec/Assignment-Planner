import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export async function getClient(req: NextRequest, opts?: { cache?: boolean }): Promise<Anthropic> {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      const headers: Record<string, string> = {};
      if (opts?.cache) headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
      return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, defaultHeaders: headers });
    }
  }
  throw new Error('UNAUTHORIZED');
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized. Please log in.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
