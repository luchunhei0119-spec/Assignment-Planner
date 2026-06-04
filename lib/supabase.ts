import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
