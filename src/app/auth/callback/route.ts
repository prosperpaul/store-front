import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Where Supabase's *default* email links land.
 *
 * Editing Supabase's email templates needs custom SMTP, which this project
 * doesn't have, so we work with the stock template instead: the signup and
 * reset calls pass this route as their redirect, Supabase verifies the token
 * on its own endpoint and then sends the browser here with a `code`, which we
 * swap for a real cookie session.
 *
 * (/auth/confirm handles the token_hash style, for if templates ever become
 * editable. Both roads end in the same place.)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const next = searchParams.get('next')

  // Supabase reports its own failures here -- an expired link, mostly.
  const errorDescription = searchParams.get('error_description')

  // Only ever redirect within this app: an open redirect would let a crafted
  // email bounce someone to an attacker's page wearing our name.
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : null

  if (!errorDescription && code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) redirect(destination ?? '/dashboard')
  }

  redirect('/login?error=link')
}
