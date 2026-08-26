import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client. BYPASSES Row Level Security.
 *
 * Only ever import this from server-side code (Route Handlers / Server Actions).
 * We use it for writes that come from buyers, who are not logged in:
 * creating a customer, an order, or a waitlist entry.
 *
 * Never import this into a file with 'use client'.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
