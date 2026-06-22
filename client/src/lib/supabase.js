import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[BlinkPaste] Missing Supabase environment variables.\n' +
      'Copy client/.env.example → client/.env and fill in your Supabase project URL and anon key.'
  )
}

/**
 * Singleton Supabase client.
 * Auth is disabled — BlinkPaste uses no user accounts.
 * Realtime is configured for 20 events/sec to handle rapid typing bursts.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
})
