import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or anonymous key. Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
}

// The client-side client uses the anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// A server-side client with the service role key for admin actions
// Important: This should ONLY be used in server-side code (e.g., API routes, server actions)
if (typeof window !== 'undefined' && supabaseServiceKey) {
    console.warn('supabaseAdmin is being initialized on the client side. This is a security risk. It should only be used in server-side code.');
}

export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
}) : null;
